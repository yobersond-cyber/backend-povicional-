
from datetime import date
from typing import Literal

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    status,
)
from pydantic import Field
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.database.conection import get_db
from app.dependencias.auth import (
    get_current_user,
    require_role,
    obtener_rol_efectivo,
    verificar_acceso_academico,
)

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)

from app.models.Usuarios import Usuario
from app.models.colegios import Colegio
from app.models.curso import Curso
from app.models.usuario_curso import UsuarioCurso
from app.models.entrega import Entrega
from app.models.actividad import Actividad
from app.models.incapacidad import Incapacidad
from app.models.materia import Materia
from app.models.docente_asignacion import DocenteAsignacion
from app.models.material_academico import MaterialAcademico
from app.models.historial_incapacidad import HistorialIncapacidad
from app.models.acceso_academico import AccesoAcademico

from app.schemas.base import APIResponse, BaseSchema
from app.schemas.entrega import EntregaResponse
from app.schemas.actividad import ActividadEstudianteResponse

from app.schemas.usuario import (
    UsuarioCreate,
    UsuarioUpdate,
    RegistroEstudianteCreate,
    UsuarioResponse,
    UsuarioLogin,
    EstudianteDetalleResponse,
    DocenteDetalleResponse,
    MateriaResumen,
    CursoResumen,
)

from app.services.notificaciones_service import notificar_usuario


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"],
)


class EstadoAprobacionUpdate(BaseSchema):
    estado: Literal["aprobada", "rechazada"]


# ============================================================
# FUNCIONES AUXILIARES
# ============================================================

def verificar_colegio_usuario(current_user: Usuario) -> int:
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta no tiene un colegio asignado",
        )

    return current_user.id_colegio


def verificar_usuario_en_colegio(
    usuario: Usuario,
    current_user: Usuario,
):
    if (
        current_user.id_colegio is None
        or usuario.id_colegio != current_user.id_colegio
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos sobre este usuario",
        )


def verificar_datos_unicos(
    db: Session,
    documento: str,
    correo: str,
    id_usuario_excluir: int | None = None,
):
    consulta_documento = db.query(Usuario).filter(
        Usuario.documento == documento
    )

    consulta_correo = db.query(Usuario).filter(
        Usuario.correo == correo
    )

    if id_usuario_excluir is not None:
        consulta_documento = consulta_documento.filter(
            Usuario.id_usuario != id_usuario_excluir
        )

        consulta_correo = consulta_correo.filter(
            Usuario.id_usuario != id_usuario_excluir
        )

    if consulta_documento.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El documento ya está registrado",
        )

    if consulta_correo.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya está registrado",
        )


def obtener_usuario_o_error(
    db: Session,
    id_usuario: int,
) -> Usuario:
    usuario = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == id_usuario)
        .first()
    )

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    return usuario


def obtener_curso_o_error(
    db: Session,
    id_curso: int,
    id_colegio: int,
) -> Curso:
    curso = (
        db.query(Curso)
        .filter(
            Curso.id_curso == id_curso,
            Curso.id_colegio == id_colegio,
        )
        .first()
    )

    if curso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El curso no existe o no pertenece al colegio seleccionado",
        )

    return curso


def verificar_colegio_activo(
    db: Session,
    id_colegio: int,
) -> Colegio:
    colegio = (
        db.query(Colegio)
        .filter(Colegio.id_colegio == id_colegio)
        .first()
    )

    if colegio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Colegio no encontrado",
        )

    if colegio.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El colegio se encuentra inactivo",
        )

    return colegio


def verificar_permisos_creacion(
    current_user: Usuario,
    tipo_nuevo_usuario: str,
):
    rol_actual = obtener_rol_efectivo(current_user)

    permisos = {
        "rector": (
            "coordinador",
            "docente",
            "estudiante",
        ),
        "coordinador": (
            "docente",
            "estudiante",
        ),
    }

    if rol_actual not in permisos:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para crear usuarios",
        )

    if tipo_nuevo_usuario not in permisos[rol_actual]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes crear cuentas de este tipo",
        )


def verificar_permisos_gestion(
    current_user: Usuario,
    usuario_objetivo: Usuario,
):
    verificar_usuario_en_colegio(
        usuario_objetivo,
        current_user,
    )

    rol_actual = obtener_rol_efectivo(current_user)

    permisos = {
        "rector": (
            "coordinador",
            "docente",
            "estudiante",
        ),
        "coordinador": (
            "docente",
            "estudiante",
        ),
    }

    if rol_actual not in permisos:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para gestionar usuarios",
        )

    if usuario_objetivo.tipo_de_usuario not in permisos[rol_actual]:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes gestionar una cuenta de este tipo",
        )


def obtener_nombre_curso(curso: Curso | None) -> str:
    if curso is None:
        return "Sin curso asignado"

    grado = getattr(curso, "grado", None)
    numero = getattr(curso, "numero_curso", None)

    if grado is not None and numero is not None:
        return f"{grado} - {numero}"

    if grado is not None:
        return str(grado)

    if numero is not None:
        return str(numero)

    return "Curso asignado"


def notificar_cambio_curso_estudiante(
    background_tasks: BackgroundTasks,
    estudiante: Usuario,
    curso_anterior: Curso | None,
    curso_nuevo: Curso,
) -> None:
    """
    Notifica al estudiante cuando cambia su curso.
    """

    if (
        estudiante.tipo_de_usuario != "estudiante"
        or not estudiante.correo
        or not estudiante.correo.strip()
    ):
        return

    nombre_anterior = obtener_nombre_curso(curso_anterior)
    nombre_nuevo = obtener_nombre_curso(curso_nuevo)

    background_tasks.add_task(
        notificar_usuario,
        destinatario=estudiante.correo.strip(),
        nombres_usuario=(
            f"{estudiante.nombres_compl} "
            f"{estudiante.apellidos_compl}"
        ),
        asunto="Actualización de tu curso - APRENZY",
        titulo="Tu curso ha sido actualizado",
        mensaje=(
            f"Te informamos que tu curso en APRENZY "
            f"ha sido cambiado de {nombre_anterior} "
            f"a {nombre_nuevo}. "
            f"Ingresa a la plataforma para consultar "
            f"tu información académica actualizada."
        ),
        detalle=(
            f"Curso anterior: {nombre_anterior}\n"
            f"Nuevo curso: {nombre_nuevo}"
        ),
    )


# ============================================================
# 1. COLEGIOS Y CURSOS PARA EL REGISTRO PÚBLICO
# No requieren autenticación.
# ============================================================

@router.get(
    "/colegios-disponibles",
    response_model=APIResponse[list[dict]],
)
def listar_colegios_disponibles(
    db: Session = Depends(get_db),
):
    colegios = (
        db.query(Colegio)
        .filter(Colegio.estado == "activo")
        .order_by(Colegio.nombre_colegio.asc())
        .all()
    )

    resultado = [
        {
            "id_colegio": colegio.id_colegio,
            "nombre_colegio": colegio.nombre_colegio,
        }
        for colegio in colegios
    ]

    return APIResponse(
        success=True,
        mensaje="Colegios disponibles recuperados correctamente",
        data=resultado,
    )


@router.get(
    "/colegios/{id_colegio}/cursos-disponibles",
    response_model=APIResponse[list[dict]],
)
def listar_cursos_disponibles(
    id_colegio: int,
    db: Session = Depends(get_db),
):
    verificar_colegio_activo(
        db,
        id_colegio,
    )

    cursos = (
        db.query(Curso)
        .filter(Curso.id_colegio == id_colegio)
        .order_by(
            Curso.grado.asc(),
            Curso.numero_curso.asc(),
        )
        .all()
    )

    resultado = [
        {
            "id_curso": curso.id_curso,
            "numero_curso": curso.numero_curso,
            "grado": curso.grado,
            "jornada": curso.jornada,
        }
        for curso in cursos
    ]

    return APIResponse(
        success=True,
        mensaje="Cursos del colegio recuperados correctamente",
        data=resultado,
    )


# ============================================================
# 2. REGISTRO PÚBLICO DE ESTUDIANTES
# ============================================================

@router.post(
    "/registro-estudiante",
    response_model=APIResponse[UsuarioResponse],
    status_code=status.HTTP_201_CREATED,
)
def registrar_estudiante(
    datos: RegistroEstudianteCreate,
    db: Session = Depends(get_db),
):
    colegio = verificar_colegio_activo(
        db,
        datos.id_colegio,
    )

    curso = obtener_curso_o_error(
        db,
        datos.id_curso,
        colegio.id_colegio,
    )

    verificar_datos_unicos(
        db,
        datos.documento,
        str(datos.correo),
    )

    estudiante = Usuario(
        id_colegio=colegio.id_colegio,
        documento=datos.documento,
        nombres_compl=datos.nombres_compl,
        apellidos_compl=datos.apellidos_compl,
        telefono=datos.telefono,
        correo=str(datos.correo),
        contrasena=hash_password(datos.contrasena),
        tipo_de_usuario="estudiante",
        estado_aprobacion="pendiente",
        jornada=curso.jornada,
    )

    try:
        db.add(estudiante)
        db.flush()

        db.add(
            UsuarioCurso(
                id_usuario=estudiante.id_usuario,
                id_curso=curso.id_curso,
            )
        )

        db.commit()
        db.refresh(estudiante)

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo registrar el estudiante. Verifica sus datos.",
        ) from exc

    return APIResponse(
        success=True,
        mensaje=(
            "Registro enviado correctamente. "
            "Debes esperar la aprobación del coordinador del colegio."
        ),
        data=estudiante,
    )


# ============================================================
# 3. CREACIÓN INTERNA DE USUARIOS
# ============================================================

@router.post(
    "",
    response_model=APIResponse[UsuarioResponse],
    status_code=status.HTTP_201_CREATED,
)
def crear_usuario(
    datos: UsuarioCreate,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    verificar_permisos_creacion(
        current_user,
        datos.tipo_de_usuario,
    )

    id_colegio = verificar_colegio_usuario(current_user)

    verificar_colegio_activo(
        db,
        id_colegio,
    )

    curso = None

    if datos.tipo_de_usuario == "estudiante":
        if datos.id_curso is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Debes seleccionar un curso para el estudiante",
            )

        curso = obtener_curso_o_error(
            db,
            datos.id_curso,
            id_colegio,
        )

    elif datos.id_curso is not None:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo los estudiantes deben tener un curso directo",
        )

    verificar_datos_unicos(
        db,
        datos.documento,
        str(datos.correo),
    )

    nuevo_usuario = Usuario(
        id_colegio=id_colegio,
        documento=datos.documento,
        nombres_compl=datos.nombres_compl,
        apellidos_compl=datos.apellidos_compl,
        telefono=datos.telefono,
        correo=str(datos.correo),
        contrasena=hash_password(datos.contrasena),
        tipo_de_usuario=datos.tipo_de_usuario,
        estado_aprobacion=(
            "aprobada"
            if datos.tipo_de_usuario == "estudiante"
            else None
        ),
        jornada=(
            curso.jornada
            if curso is not None
            else datos.jornada
        ),
    )

    try:
        db.add(nuevo_usuario)
        db.flush()

        if curso is not None:
            db.add(
                UsuarioCurso(
                    id_usuario=nuevo_usuario.id_usuario,
                    id_curso=curso.id_curso,
                )
            )

        db.commit()
        db.refresh(nuevo_usuario)

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo crear el usuario. Verifica el documento y el correo.",
        ) from exc

    return APIResponse(
        success=True,
        mensaje="Usuario creado exitosamente en tu colegio",
        data=nuevo_usuario,
    )


# ============================================================
# 4. INICIAR SESIÓN
# ============================================================

@router.post(
    "/login",
    response_model=APIResponse[dict],
)
def login_usuario(
    datos: UsuarioLogin,
    db: Session = Depends(get_db),
):
    usuario = (
        db.query(Usuario)
        .filter(Usuario.correo == str(datos.correo))
        .first()
    )

    if usuario is None or not verify_password(
        datos.contrasena,
        usuario.contrasena,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
        )

    if usuario.tipo_de_usuario == "administrador":
        if usuario.id_colegio is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El administrador global no puede pertenecer a un colegio",
            )

    else:
        if usuario.id_colegio is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="La cuenta no tiene un colegio asignado",
            )

        verificar_colegio_activo(
            db,
            usuario.id_colegio,
        )

    if (
        usuario.tipo_de_usuario == "estudiante"
        and usuario.estado_aprobacion != "aprobada"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta todavía no ha sido aprobada por el colegio",
        )

    token = create_access_token(
        {
            "sub": str(usuario.id_usuario),
            "rol": usuario.tipo_de_usuario,
        }
    )

    return APIResponse(
        success=True,
        mensaje="Inicio de sesión exitoso",
        data={
            "access_token": token,
            "token_type": "bearer",
            "id_usuario": usuario.id_usuario,
            "tipo_de_usuario": usuario.tipo_de_usuario,
        },
    )


# ============================================================
# 5. OBTENER USUARIO AUTENTICADO
# ============================================================

@router.get(
    "/me",
    response_model=APIResponse[UsuarioResponse],
)
def obtener_usuario_actual(
    current_user: Usuario = Depends(get_current_user),
):
    return APIResponse(
        success=True,
        mensaje="Usuario autenticado obtenido correctamente",
        data=current_user,
    )


# ============================================================
# 6. LISTAR USUARIOS DEL COLEGIO
# ============================================================

@router.get(
    "",
    response_model=APIResponse[list[UsuarioResponse]],
)
def listar_usuarios(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rol = obtener_rol_efectivo(current_user)
    id_colegio = verificar_colegio_usuario(current_user)

    if rol == "rector":
        tipos = (
            "coordinador",
            "docente",
            "estudiante",
        )

    elif rol == "coordinador":
        tipos = (
            "docente",
            "estudiante",
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para listar usuarios",
        )

    usuarios = (
        db.query(Usuario)
        .filter(
            Usuario.id_colegio == id_colegio,
            Usuario.tipo_de_usuario.in_(tipos),
        )
        .order_by(
            Usuario.apellidos_compl.asc(),
            Usuario.nombres_compl.asc(),
        )
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Usuarios del colegio recuperados correctamente",
        data=usuarios,
    )


# ============================================================
# 7. LISTAR COORDINADORES DEL RECTOR
# ============================================================

@router.get(
    "/coordinadores",
    response_model=APIResponse[list[UsuarioResponse]],
)
def listar_coordinadores(
    current_user: Usuario = Depends(
        require_role("rector")
    ),
    db: Session = Depends(get_db),
):
    id_colegio = verificar_colegio_usuario(current_user)

    coordinadores = (
        db.query(Usuario)
        .filter(
            Usuario.id_colegio == id_colegio,
            Usuario.tipo_de_usuario == "coordinador",
        )
        .order_by(
            Usuario.apellidos_compl.asc(),
            Usuario.nombres_compl.asc(),
        )
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Coordinadores del colegio recuperados correctamente",
        data=coordinadores,
    )


# ============================================================
# 8. SOLICITUDES DE REGISTRO DE ESTUDIANTES
# ============================================================

@router.get(
    "/solicitudes-estudiantes",
    response_model=APIResponse[list[UsuarioResponse]],
)
def listar_solicitudes_estudiantes(
    current_user: Usuario = Depends(
        require_role("coordinador")
    ),
    db: Session = Depends(get_db),
):
    id_colegio = verificar_colegio_usuario(current_user)

    solicitudes = (
        db.query(Usuario)
        .filter(
            Usuario.id_colegio == id_colegio,
            Usuario.tipo_de_usuario == "estudiante",
            Usuario.estado_aprobacion == "pendiente",
        )
        .order_by(
            Usuario.apellidos_compl.asc(),
            Usuario.nombres_compl.asc(),
        )
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Solicitudes pendientes recuperadas correctamente",
        data=solicitudes,
    )


@router.patch(
    "/{id_usuario}/aprobacion",
    response_model=APIResponse[UsuarioResponse],
)
def actualizar_aprobacion_estudiante(
    id_usuario: int,
    datos: EstadoAprobacionUpdate,
    background_tasks: BackgroundTasks,
    current_user: Usuario = Depends(
        require_role("coordinador")
    ),
    db: Session = Depends(get_db),
):
    verificar_colegio_usuario(current_user)

    estudiante = obtener_usuario_o_error(
        db,
        id_usuario,
    )

    verificar_usuario_en_colegio(
        estudiante,
        current_user,
    )

    if estudiante.tipo_de_usuario != "estudiante":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La cuenta seleccionada no es de un estudiante",
        )

    if estudiante.estado_aprobacion != "pendiente":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta solicitud ya fue revisada",
        )

    estudiante.estado_aprobacion = datos.estado

    try:
        db.commit()
        db.refresh(estudiante)

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo actualizar la solicitud",
        ) from exc

    if estudiante.correo:
        if datos.estado == "aprobada":
            asunto = "Tu cuenta de APRENZY ha sido aprobada"
            titulo = "¡Tu solicitud fue aprobada!"

            mensaje = (
                "Tu solicitud de registro en APRENZY ha sido aprobada "
                "por el coordinador de tu colegio. "
                "Ya puedes iniciar sesión con tu correo y contraseña "
                "para acceder a la plataforma."
            )

        else:
            asunto = "Actualización de tu solicitud de APRENZY"
            titulo = "Tu solicitud de registro fue rechazada"

            mensaje = (
                "Te informamos que tu solicitud de registro en APRENZY "
                "ha sido rechazada por el coordinador de tu colegio. "
                "Si necesitas más información, comunícate con tu colegio."
            )

        background_tasks.add_task(
            notificar_usuario,
            destinatario=estudiante.correo,
            nombres_usuario=(
                f"{estudiante.nombres_compl} "
                f"{estudiante.apellidos_compl}"
            ),
            asunto=asunto,
            titulo=titulo,
            mensaje=mensaje,
            detalle=(
                f"Estado de tu solicitud: {datos.estado.capitalize()}"
            ),
        )

    return APIResponse(
        success=True,
        mensaje=(
            "Estudiante aprobado correctamente"
            if datos.estado == "aprobada"
            else "Solicitud de estudiante rechazada"
        ),
        data=estudiante,
    )


# ============================================================
# 9. LISTAR ESTUDIANTES
# ============================================================

@router.get(
    "/estudiantes",
    response_model=APIResponse[list[EstudianteDetalleResponse]],
)
def listar_estudiantes(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rol = obtener_rol_efectivo(current_user)

    if rol not in (
        "rector",
        "coordinador",
        "docente",
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para consultar estudiantes",
        )

    id_colegio = verificar_colegio_usuario(current_user)

    consulta = db.query(Usuario).filter(
        Usuario.tipo_de_usuario == "estudiante",
        Usuario.id_colegio == id_colegio,
        Usuario.estado_aprobacion == "aprobada",
    )

    if rol == "docente":
        consulta = (
            consulta
            .join(
                UsuarioCurso,
                UsuarioCurso.id_usuario == Usuario.id_usuario,
            )
            .join(
                Curso,
                Curso.id_curso == UsuarioCurso.id_curso,
            )
            .join(
                DocenteAsignacion,
                DocenteAsignacion.id_curso == Curso.id_curso,
            )
            .filter(
                DocenteAsignacion.id_usuario == current_user.id_usuario,
                Curso.id_colegio == id_colegio,
            )
            .distinct()
        )

    estudiantes = (
        consulta
        .options(
            joinedload(
                Usuario.incapacidades
            ).joinedload(
                Incapacidad.apelacion
            )
        )
        .order_by(
            Usuario.apellidos_compl.asc(),
            Usuario.nombres_compl.asc(),
        )
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Estudiantes recuperados correctamente",
        data=estudiantes,
    )


# ============================================================
# 10. LISTAR DOCENTES DEL COLEGIO
# ============================================================

@router.get(
    "/docentes",
    response_model=APIResponse[list[DocenteDetalleResponse]],
)
def listar_docentes(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rol = obtener_rol_efectivo(current_user)

    if rol not in ("rector", "coordinador"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para consultar docentes",
        )

    id_colegio = verificar_colegio_usuario(current_user)

    docentes = (
        db.query(Usuario)
        .filter(
            Usuario.tipo_de_usuario == "docente",
            Usuario.id_colegio == id_colegio,
        )
        .order_by(
            Usuario.apellidos_compl.asc(),
            Usuario.nombres_compl.asc(),
        )
        .all()
    )

    resultado = []

    for docente in docentes:
        asignaciones = (
            db.query(DocenteAsignacion)
            .join(
                Curso,
                DocenteAsignacion.id_curso == Curso.id_curso,
            )
            .filter(
                DocenteAsignacion.id_usuario == docente.id_usuario,
                Curso.id_colegio == id_colegio,
            )
            .all()
        )

        materias_por_id = {}
        cursos_por_id = {}

        for asignacion in asignaciones:
            materia = (
                db.query(Materia)
                .filter(
                    Materia.id_materia == asignacion.id_materia
                )
                .first()
            )

            curso = (
                db.query(Curso)
                .filter(
                    Curso.id_curso == asignacion.id_curso
                )
                .first()
            )

            if materia:
                materias_por_id[materia.id_materia] = MateriaResumen(
                    id_materia=materia.id_materia,
                    nombre_materia=materia.nombre_materia,
                )

            if curso:
                cursos_por_id[curso.id_curso] = CursoResumen(
                    id_curso=curso.id_curso,
                    numero_curso=curso.numero_curso,
                    grado=curso.grado,
                    jornada=curso.jornada,
                )

        resultado.append(
            DocenteDetalleResponse(
                id_usuario=docente.id_usuario,
                id_colegio=docente.id_colegio,
                documento=docente.documento,
                nombres_compl=docente.nombres_compl,
                apellidos_compl=docente.apellidos_compl,
                telefono=docente.telefono,
                correo=docente.correo,
                tipo_de_usuario=docente.tipo_de_usuario,
                jornada=docente.jornada,
                estado_aprobacion=docente.estado_aprobacion,
                materias_asignadas=list(materias_por_id.values()),
                cursos_asignados=list(cursos_por_id.values()),
            )
        )

    return APIResponse(
        success=True,
        mensaje="Docentes recuperados correctamente",
        data=resultado,
    )


# ============================================================
# 11. OBTENER MIS ENTREGAS
# ============================================================

@router.get(
    "/mis-entregas",
    response_model=APIResponse[list[EntregaResponse]],
)
def obtener_mis_entregas(
    current_user: Usuario = Depends(require_role("estudiante")),
    db: Session = Depends(get_db),
):
    verificar_acceso_academico(current_user, db)

    entregas = (
        db.query(Entrega)
        .filter(
            Entrega.id_usuario == current_user.id_usuario
        )
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Entregas del usuario recuperadas correctamente",
        data=entregas,
    )


# ============================================================
# 12. OBTENER MIS ACTIVIDADES
# ============================================================

@router.get(
    "/mis-actividades",
    response_model=APIResponse[list[ActividadEstudianteResponse]],
)
def obtener_mis_actividades(
    current_user: Usuario = Depends(
        require_role("estudiante")
    ),
    db: Session = Depends(get_db),
):
    verificar_acceso_academico(current_user, db)

    actividades = (
        db.query(Actividad)
        .join(
            UsuarioCurso,
            Actividad.id_curso == UsuarioCurso.id_curso,
        )
        .join(
            Curso,
            Actividad.id_curso == Curso.id_curso,
        )
        .filter(
            UsuarioCurso.id_usuario == current_user.id_usuario,
            Curso.id_colegio == current_user.id_colegio,
            Actividad.id_curso.isnot(None),
        )
        .order_by(
            Actividad.fecha_limite.asc()
        )
        .all()
    )

    hoy = date.today()
    resultado = []

    for actividad in actividades:
        entrega = (
            db.query(Entrega)
            .filter(
                Entrega.id_actividad == actividad.id_actividad,
                Entrega.id_usuario == current_user.id_usuario,
            )
            .first()
        )

        if entrega:
            fecha_entrega = entrega.fecha_entrega.date()

            estado = (
                "entregada"
                if fecha_entrega <= actividad.fecha_limite
                else "fuera_de_plazo"
            )

        elif hoy > actividad.fecha_limite:
            estado = "vencida"

        else:
            estado = "pendiente"

        resultado.append(
            ActividadEstudianteResponse(
                id_actividad=actividad.id_actividad,
                id_usuario=actividad.id_usuario,
                titulo=actividad.titulo,
                descripcion=actividad.descripcion,
                fecha_publicacion=actividad.fecha_publicacion,
                fecha_limite=actividad.fecha_limite,
                id_materia=actividad.id_materia,
                id_curso=actividad.id_curso,
                estado=estado,
            )
        )

    return APIResponse(
        success=True,
        mensaje="Actividades del estudiante recuperadas correctamente",
        data=resultado,
    )


# ============================================================
# 13. OBTENER MIS CALIFICACIONES
# ============================================================

@router.get(
    "/mis-calificaciones",
    response_model=APIResponse[list[EntregaResponse]],
)
def obtener_mis_calificaciones(
    current_user: Usuario = Depends(
        require_role("estudiante")
    ),
    db: Session = Depends(get_db),
):
    verificar_acceso_academico(current_user, db)

    entregas = (
        db.query(Entrega)
        .filter(
            Entrega.id_usuario == current_user.id_usuario,
            Entrega.nota.isnot(None),
        )
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Calificaciones recuperadas correctamente",
        data=entregas,
    )


# ============================================================
# 14. ELIMINAR USUARIOS
# ============================================================

@router.delete(
    "/{id_usuario}",
    response_model=APIResponse[dict],
)
def eliminar_usuario(
    id_usuario: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    usuario = obtener_usuario_o_error(
        db,
        id_usuario,
    )

    verificar_permisos_gestion(
        current_user,
        usuario,
    )

    tiene_incapacidades = (
        db.query(Incapacidad)
        .filter(Incapacidad.id_usuario == id_usuario)
        .first()
        is not None
    )

    tiene_historial = (
        db.query(HistorialIncapacidad)
        .filter(
            HistorialIncapacidad.id_usuario_cambio == id_usuario
        )
        .first()
        is not None
    )

    tiene_accesos = (
        db.query(AccesoAcademico)
        .filter(AccesoAcademico.id_usuario == id_usuario)
        .first()
        is not None
    )

    tiene_materiales = (
        db.query(MaterialAcademico)
        .filter(MaterialAcademico.id_usuario == id_usuario)
        .first()
        is not None
    )

    tiene_actividades = (
        db.query(Actividad)
        .filter(Actividad.id_usuario == id_usuario)
        .first()
        is not None
    )

    tiene_entregas = (
        db.query(Entrega)
        .filter(Entrega.id_usuario == id_usuario)
        .first()
        is not None
    )

    tiene_asignaciones = (
        db.query(DocenteAsignacion)
        .filter(DocenteAsignacion.id_usuario == id_usuario)
        .first()
        is not None
    )

    tiene_cursos = (
        db.query(UsuarioCurso)
        .filter(UsuarioCurso.id_usuario == id_usuario)
        .first()
        is not None
    )

    if any((
        tiene_incapacidades,
        tiene_historial,
        tiene_accesos,
        tiene_materiales,
        tiene_actividades,
        tiene_entregas,
        tiene_asignaciones,
        tiene_cursos,
    )):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No se puede eliminar el usuario porque tiene "
                "registros académicos o administrativos relacionados."
            ),
        )

    nombre_usuario = (
        f"{usuario.nombres_compl} {usuario.apellidos_compl}"
    )

    try:
        db.delete(usuario)
        db.commit()

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede eliminar el usuario porque tiene otros registros relacionados.",
        ) from exc

    return APIResponse(
        success=True,
        mensaje="Usuario eliminado correctamente",
        data={
            "id_usuario": id_usuario,
            "nombre": nombre_usuario,
        },
    )


# ============================================================
# 15. OBTENER USUARIO POR ID
# ============================================================

@router.get(
    "/{id_usuario}",
    response_model=APIResponse[UsuarioResponse],
)
def obtener_usuario(
    id_usuario: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    usuario = obtener_usuario_o_error(
        db,
        id_usuario,
    )

    rol = obtener_rol_efectivo(current_user)

    if rol == "administrador":
        pass

    elif rol in ("rector", "coordinador"):
        verificar_permisos_gestion(
            current_user,
            usuario,
        )

    elif rol in ("docente", "estudiante"):
        if usuario.id_usuario != current_user.id_usuario:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Solo puedes consultar tu propio perfil",
            )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para consultar este usuario",
        )

    return APIResponse(
        success=True,
        mensaje="Usuario recuperado correctamente",
        data=usuario,
    )


# ============================================================
# 16. ACTUALIZAR USUARIOS
# Notifica al estudiante si cambia de curso.
# ============================================================

@router.put(
    "/{id_usuario}",
    response_model=APIResponse[UsuarioResponse],
)
def actualizar_usuario(
    id_usuario: int,
    datos: UsuarioUpdate,
    background_tasks: BackgroundTasks,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    usuario = obtener_usuario_o_error(
        db,
        id_usuario,
    )

    verificar_permisos_gestion(
        current_user,
        usuario,
    )

    cambios = datos.model_dump(exclude_unset=True)

    if not cambios:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se enviaron datos para actualizar",
        )

    if "documento" in cambios or "correo" in cambios:
        verificar_datos_unicos(
            db,
            cambios.get("documento", usuario.documento),
            str(cambios.get("correo", usuario.correo)),
            id_usuario_excluir=id_usuario,
        )

    curso_anterior = None
    curso_nuevo = None
    cambio_real_de_curso = False

    if usuario.tipo_de_usuario == "estudiante":
        if "id_curso" in cambios:
            id_curso = cambios.pop("id_curso")

            if id_curso is None:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="El estudiante debe conservar un curso asignado",
                )

            curso_nuevo = obtener_curso_o_error(
                db,
                id_curso,
                usuario.id_colegio,
            )

            relacion = (
                db.query(UsuarioCurso)
                .filter(
                    UsuarioCurso.id_usuario == usuario.id_usuario
                )
                .first()
            )

            if relacion is None:
                db.add(
                    UsuarioCurso(
                        id_usuario=usuario.id_usuario,
                        id_curso=curso_nuevo.id_curso,
                    )
                )

                cambio_real_de_curso = True

            else:
                if relacion.id_curso != curso_nuevo.id_curso:
                    curso_anterior = (
                        db.query(Curso)
                        .filter(
                            Curso.id_curso == relacion.id_curso,
                        )
                        .first()
                    )

                    relacion.id_curso = curso_nuevo.id_curso
                    cambio_real_de_curso = True

            if cambio_real_de_curso:
                usuario.jornada = curso_nuevo.jornada

    elif "id_curso" in cambios:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo los estudiantes pueden tener un curso directo",
        )

    contrasena = cambios.pop("contrasena", None)

    cambios.pop("id_curso", None)

    for campo, valor in cambios.items():
        setattr(usuario, campo, valor)

    if contrasena:
        usuario.contrasena = hash_password(contrasena)

    try:
        db.commit()
        db.refresh(usuario)

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo actualizar el usuario. Verifica los datos.",
        ) from exc

    # Notificar solamente si el estudiante cambió realmente
    # de curso y el cambio quedó guardado correctamente.
    if (
        cambio_real_de_curso
        and curso_nuevo is not None
        and usuario.tipo_de_usuario == "estudiante"
    ):
        notificar_cambio_curso_estudiante(
            background_tasks=background_tasks,
            estudiante=usuario,
            curso_anterior=curso_anterior,
            curso_nuevo=curso_nuevo,
        )

    return APIResponse(
        success=True,
        mensaje="Usuario actualizado correctamente",
        data=usuario,
    )
