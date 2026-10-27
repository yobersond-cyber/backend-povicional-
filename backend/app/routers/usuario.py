from datetime import date
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from app.database.conection import SessionLocal

from app.models.Usuarios import Usuario
from app.models.colegios import Colegio
from app.models.entrega import Entrega
from app.models.actividad import Actividad
from app.models.usuario_curso import UsuarioCurso
from app.models.curso import Curso
from app.models.incapacidad import Incapacidad
from app.models.materia import Materia
from app.models.docente_materia import DocenteMateria
from app.models.material_academico import MaterialAcademico
from app.models.historial_incapacidad import HistorialIncapacidad
from app.models.acceso_academico import AccesoAcademico

from app.schemas.entrega import EntregaResponse

from app.schemas.actividad import (
    ActividadResponse,
    ActividadEstudianteResponse,
)

from app.schemas.usuario import (
    UsuarioCreate,
    UsuarioResponse,
    UsuarioLogin,
    EstudianteDetalleResponse,
    DocenteDetalleResponse,
)

from app.schemas.base import APIResponse

from app.core.security import (
    hash_password,
    verify_password,
    create_access_token,
)

from app.dependencias.auth import (
    get_current_user,
    require_role,
    obtener_rol_efectivo,
)

from app.schemas.colegio import (
    CoordinadorConColegioCreate,
    CoordinadorResponse,
)


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def verificar_usuario_en_colegio(
    usuario: Usuario,
    current_user: Usuario,
):
    """Comprueba que un coordinador solo acceda a su colegio."""
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
    datos: UsuarioCreate,
    id_usuario_excluir: int | None = None,
):
    """Comprueba que código, documento y correo sean únicos."""
    campos = [
        (
            "codigo_usuario",
            datos.codigo_usuario,
            "El código de usuario ya está registrado",
        ),
        (
            "documento",
            datos.documento,
            "El documento ya está registrado",
        ),
        (
            "correo",
            datos.correo,
            "El correo ya está registrado",
        ),
    ]

    for campo, valor, mensaje in campos:
        consulta = db.query(Usuario).filter(
            getattr(Usuario, campo) == valor
        )

        if id_usuario_excluir is not None:
            consulta = consulta.filter(
                Usuario.id_usuario != id_usuario_excluir
            )

        if consulta.first():
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=mensaje,
            )

# ============================================================
# ADMINISTRACIÓN GLOBAL: COORDINADORES
# ============================================================

@router.get(
    "/coordinadores",
    response_model=APIResponse[list[CoordinadorResponse]],
)
def listar_coordinadores(
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
    db: Session = Depends(get_db),
):
    """
    Lista los coordinadores de todos los colegios.
    Solo puede acceder el administrador global.
    """

    usuarios = (
        db.query(Usuario)
        .filter(
            Usuario.tipo_de_usuario.in_(
                ("coordinador", "administrador")
            )
        )
        .order_by(
            Usuario.apellidos_compl.asc(),
            Usuario.nombres_compl.asc(),
        )
        .all()
    )

    resultado = []

    for usuario in usuarios:
        # Los administradores asociados a un colegio
        # son coordinadores de cuentas antiguas.
        es_coordinador = (
            usuario.tipo_de_usuario == "coordinador"
            or (
                usuario.tipo_de_usuario == "administrador"
                and usuario.id_colegio is not None
            )
        )

        if not es_coordinador:
            continue

        resultado.append({
            "id_usuario": usuario.id_usuario,
            "id_colegio": usuario.id_colegio,
            "codigo_usuario": usuario.codigo_usuario,
            "documento": usuario.documento,
            "nombres_compl": usuario.nombres_compl,
            "apellidos_compl": usuario.apellidos_compl,
            "telefono": usuario.telefono,
            "correo": usuario.correo,
            # Normaliza las cuentas antiguas en la respuesta.
            "tipo_de_usuario": "coordinador",
        })

    return APIResponse(
        success=True,
        mensaje="Coordinadores recuperados exitosamente",
        data=resultado,
    )


@router.post(
    "/coordinadores",
    response_model=APIResponse[CoordinadorResponse],
    status_code=status.HTTP_201_CREATED,
)
def crear_coordinador(
    datos: CoordinadorConColegioCreate,
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
    db: Session = Depends(get_db),
):
    """
    Crea un coordinador en un colegio existente.
    Solo puede hacerlo el administrador global.
    """

    colegio = (
        db.query(Colegio)
        .filter(
            Colegio.id_colegio == datos.id_colegio
        )
        .first()
    )

    if colegio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="El colegio seleccionado no existe",
        )

    if colegio.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No se puede asignar un coordinador "
                "a un colegio inactivo"
            ),
        )

    # Comprobar que el código sea único.
    if db.query(Usuario).filter(
        Usuario.codigo_usuario == datos.codigo_usuario
    ).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El código de usuario ya está registrado",
        )

    # Comprobar que el documento sea único.
    if db.query(Usuario).filter(
        Usuario.documento == datos.documento
    ).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El documento ya está registrado",
        )

    # Comprobar que el correo sea único.
    if db.query(Usuario).filter(
        Usuario.correo == str(datos.correo)
    ).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo ya está registrado",
        )

    coordinador = Usuario(
        id_colegio=datos.id_colegio,
        codigo_usuario=datos.codigo_usuario,
        documento=datos.documento,
        nombres_compl=datos.nombres_compl,
        apellidos_compl=datos.apellidos_compl,
        telefono=datos.telefono,
        correo=str(datos.correo),
        contrasena=hash_password(datos.contrasena),
        tipo_de_usuario="coordinador",
        jornada=None,
    )

    try:
        db.add(coordinador)
        db.commit()
        db.refresh(coordinador)

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No se pudo crear el coordinador. "
                "Verifica que el código, documento y "
                "correo no estén registrados."
            ),
        ) from exc

    return APIResponse(
        success=True,
        mensaje="Coordinador creado exitosamente",
        data=coordinador,
    )

# ============================================================
# 1. Crear usuario
# Solo coordinadores; únicamente docentes y estudiantes.
# ============================================================


@router.post(
    "",
    response_model=APIResponse[UsuarioResponse],
    status_code=status.HTTP_201_CREATED,
)
def crear_usuario(
    usuario: UsuarioCreate,
    current_user: Usuario = Depends(
        require_role("coordinador")
    ),
    db: Session = Depends(get_db),
):
    # El coordinador debe tener un colegio asignado.
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El coordinador no tiene un colegio asignado",
        )

    # Solo se permite crear docentes y estudiantes.
    roles_permitidos = {"docente", "estudiante"}
    if usuario.tipo_de_usuario not in roles_permitidos:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes crear docentes y estudiantes",
        )

    # No se permite crear usuarios en otro colegio.
    if usuario.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes crear usuarios en otro colegio",
        )

    # Verificar que el colegio exista.
    from app.models.colegios import Colegio

    colegio = db.query(Colegio).filter(
        Colegio.id_colegio == current_user.id_colegio
    ).first()

    if not colegio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La institución/colegio indicado no existe",
        )

    # Los estudiantes deben tener un curso válido
    # que pertenezca al mismo colegio.
    if usuario.tipo_de_usuario == "estudiante":
        if not usuario.id_curso:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="El estudiante debe indicar un curso",
            )

        curso = db.query(Curso).filter(
            Curso.id_curso == usuario.id_curso,
            Curso.id_colegio == current_user.id_colegio,
        ).first()

        if not curso:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "El curso no existe o no pertenece "
                    "a la institución indicada"
                ),
            )

    # Verificar que código, documento y correo sean únicos.
    verificar_datos_unicos(db, usuario)

    nuevo_usuario = Usuario(
        id_colegio=current_user.id_colegio,
        codigo_usuario=usuario.codigo_usuario,
        documento=usuario.documento,
        nombres_compl=usuario.nombres_compl,
        apellidos_compl=usuario.apellidos_compl,
        telefono=usuario.telefono,
        correo=usuario.correo,
        contrasena=hash_password(usuario.contrasena),
        tipo_de_usuario=usuario.tipo_de_usuario,
        jornada=usuario.jornada,
    )

    try:
        db.add(nuevo_usuario)
        db.commit()
        db.refresh(nuevo_usuario)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No se pudo crear el usuario. "
                "Verifica que el código, documento y correo "
                "no estén registrados."
            ),
        )

    # Vincular al estudiante con el curso seleccionado.
    if usuario.tipo_de_usuario == "estudiante" and usuario.id_curso:
        try:
            db.add(
                UsuarioCurso(
                    id_usuario=nuevo_usuario.id_usuario,
                    id_curso=usuario.id_curso,
                )
            )
            db.commit()
        except IntegrityError:
            db.rollback()
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="No se pudo vincular al estudiante con el curso.",
            )

    return APIResponse(
        success=True,
        mensaje="Usuario registrado exitosamente",
        data=nuevo_usuario,
    )



# ============================================================
# 2. Login
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
        .filter(Usuario.correo == datos.correo)
        .first()
    )

    if not usuario or not verify_password(
        datos.contrasena,
        usuario.contrasena,
    ):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos",
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
# 3. Obtener usuario autenticado
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
# 4. Listar usuarios del colegio
# Solo coordinadores.
# ============================================================

@router.get(
    "",
    response_model=APIResponse[list[UsuarioResponse]],
)
def listar_usuarios(
    current_user: Usuario = Depends(
        require_role("coordinador")
    ),
    db: Session = Depends(get_db),
):
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El coordinador no tiene un colegio asignado",
        )

    usuarios = (
        db.query(Usuario)
        .filter(
            Usuario.id_colegio == current_user.id_colegio,
            Usuario.tipo_de_usuario.in_(("docente", "estudiante")),
        )
        .order_by(Usuario.apellidos_compl.asc())
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Lista de usuarios obtenida exitosamente",
        data=usuarios,
    )


# ============================================================
# 5. Listar estudiantes
# Coordinador: estudiantes de su colegio.
# Docente: estudiantes de los cursos donde tiene
# materias asignadas.
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

    if rol not in ("coordinador", "docente"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para consultar estudiantes",
        )

    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta no tiene un colegio asignado",
        )

    # Consulta base: solo registros de estudiantes.
    consulta = db.query(Usuario).filter(
        Usuario.tipo_de_usuario == "estudiante",
        Usuario.id_colegio == current_user.id_colegio,
    )

    if rol == "docente":
        # El docente solo puede ver estudiantes inscritos
        # en cursos que tengan una materia asignada a él.
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
                Materia,
                Materia.id_curso == Curso.id_curso,
            )
            .join(
                DocenteMateria,
                DocenteMateria.id_materia == Materia.id_materia,
            )
            .filter(
                DocenteMateria.id_usuario == current_user.id_usuario,
                Curso.id_colegio == current_user.id_colegio,
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
        mensaje="Estudiantes recuperados exitosamente",
        data=estudiantes,
    )


# ============================================================
# 6. Listar docentes del colegio
# ============================================================

@router.get(
    "/docentes",
    response_model=APIResponse[list[DocenteDetalleResponse]],
)
def listar_docentes(
    current_user: Usuario = Depends(
        require_role("coordinador")
    ),
    db: Session = Depends(get_db),
):
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El coordinador no tiene un colegio asignado",
        )

    docentes = (
        db.query(Usuario)
        .filter(
            Usuario.tipo_de_usuario == "docente",
            Usuario.id_colegio == current_user.id_colegio,
        )
        .all()
    )

    resultado = []

    for docente in docentes:
        materias = [
            dm.materia
            for dm in docente.materias
            if dm.materia
            and dm.materia.curso
            and dm.materia.curso.id_colegio
            == current_user.id_colegio
        ]

        cursos = list({
            dm.materia.curso
            for dm in docente.materias
            if dm.materia
            and dm.materia.curso
            and dm.materia.curso.id_colegio
            == current_user.id_colegio
        })

        resultado.append(
            DocenteDetalleResponse(
                id_usuario=docente.id_usuario,
                id_colegio=docente.id_colegio,
                codigo_usuario=docente.codigo_usuario,
                documento=docente.documento,
                nombres_compl=docente.nombres_compl,
                apellidos_compl=docente.apellidos_compl,
                telefono=docente.telefono,
                correo=docente.correo,
                tipo_de_usuario=docente.tipo_de_usuario,
                jornada=docente.jornada,
                materias_asignadas=materias,
                cursos_asignados=cursos,
            )
        )

    return APIResponse(
        success=True,
        mensaje="Docentes recuperados exitosamente",
        data=resultado,
    )


# ============================================================
# 7. Obtener mis entregas
# ============================================================

@router.get(
    "/mis-entregas",
    response_model=APIResponse[list[EntregaResponse]],
)
def obtener_mis_entregas(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    entregas = (
        db.query(Entrega)
        .filter(
            Entrega.id_usuario == current_user.id_usuario
        )
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Entregas del usuario obtenidas exitosamente",
        data=entregas,
    )


# ============================================================
# 8. Obtener mis actividades
# ============================================================

@router.get(
    "/mis-actividades",
    response_model=APIResponse[list[ActividadEstudianteResponse]],
)
def obtener_mis_actividades(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    actividades = (
        db.query(Actividad)
        .join(
            Materia,
            Actividad.id_materia == Materia.id_materia,
        )
        .join(
            UsuarioCurso,
            Materia.id_curso == UsuarioCurso.id_curso,
        )
        .filter(
            UsuarioCurso.id_usuario == current_user.id_usuario
        )
        .order_by(Actividad.fecha_limite.asc())
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

            if fecha_entrega <= actividad.fecha_limite:
                estado = "entregada"
            else:
                estado = "fuera_de_plazo"
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
                estado=estado,
            )
        )

    return APIResponse(
        success=True,
        mensaje="Actividades del usuario obtenidas exitosamente",
        data=resultado,
    )


# ============================================================
# 9. Obtener mis calificaciones
# ============================================================

@router.get(
    "/mis-calificaciones",
    response_model=APIResponse[list[EntregaResponse]],
)
def obtener_mis_calificaciones(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
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
        mensaje="Calificaciones del usuario obtenidas exitosamente",
        data=entregas,
    )


# ============================================================
# 10. Eliminar estudiante o docente
# Administrador global: cualquier colegio.
# Coordinador: únicamente su colegio.
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

    rol = obtener_rol_efectivo(current_user)

    if rol not in ("administrador", "coordinador"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para eliminar usuarios",
        )

    if rol == "coordinador":
        verificar_usuario_en_colegio(usuario, current_user)

    if usuario.tipo_de_usuario in ("administrador", "coordinador"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "No se pueden eliminar cuentas administrativas "
                "o de coordinación desde esta ruta"
            ),
        )

    if usuario.tipo_de_usuario not in ("estudiante", "docente"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden eliminar estudiantes o docentes",
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

    if any((
        tiene_incapacidades,
        tiene_historial,
        tiene_accesos,
        tiene_materiales,
        tiene_actividades,
        tiene_entregas,
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
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No se puede eliminar el usuario porque tiene "
                "otros registros relacionados."
            ),
        )

    return APIResponse(
        success=True,
        mensaje="Usuario eliminado exitosamente",
        data={
            "id_usuario": id_usuario,
            "nombre": nombre_usuario,
        },
    )


# ============================================================
# 11. Obtener usuario por ID
# Administrador global: todos los colegios.
# Coordinador: su colegio.
# Docente/estudiante: únicamente su perfil.
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

    rol = obtener_rol_efectivo(current_user)

    if rol == "administrador":
        pass

    elif rol == "coordinador":
        verificar_usuario_en_colegio(usuario, current_user)

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
        mensaje="Usuario obtenido correctamente",
        data=usuario,
    )


# ============================================================
# 12. Actualizar usuario
# Solo coordinadores; únicamente docentes y estudiantes
# de su propio colegio.
# ============================================================

@router.put(
    "/{id_usuario}",
    response_model=APIResponse[UsuarioResponse],
)
def actualizar_usuario(
    id_usuario: int,
    datos: UsuarioCreate,
    current_user: Usuario = Depends(
        require_role("coordinador")
    ),
    db: Session = Depends(get_db),
):
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

    verificar_usuario_en_colegio(usuario, current_user)

    if usuario.tipo_de_usuario not in ("docente", "estudiante"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes modificar docentes y estudiantes",
        )

    if datos.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes asignar usuarios a otro colegio",
        )

    if datos.tipo_de_usuario not in ("docente", "estudiante"):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes asignar roles administrativos",
        )

    verificar_datos_unicos(
        db,
        datos,
        id_usuario_excluir=id_usuario,
    )

    usuario.codigo_usuario = datos.codigo_usuario
    usuario.documento = datos.documento
    usuario.nombres_compl = datos.nombres_compl
    usuario.apellidos_compl = datos.apellidos_compl
    usuario.telefono = datos.telefono
    usuario.correo = datos.correo
    usuario.tipo_de_usuario = datos.tipo_de_usuario
    usuario.jornada = datos.jornada

    # El colegio se mantiene sin cambios.
    if datos.contrasena:
        usuario.contrasena = hash_password(datos.contrasena)

    try:
        db.commit()
        db.refresh(usuario)
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se pudo actualizar: verifica los datos únicos",
        )

    return APIResponse(
        success=True,
        mensaje="Usuario actualizado exitosamente",
        data=usuario,
    )