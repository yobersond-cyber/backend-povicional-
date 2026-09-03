from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.conection import SessionLocal

from app.models.Usuarios import Usuario
from app.models.entrega import Entrega
from app.models.actividad import Actividad
from app.models.usuario_curso import UsuarioCurso
from app.models.incapacidad import Incapacidad
from app.models.materia import Materia
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


# ============================================================
# 1. Crear usuario
# ============================================================

@router.post(
    "",
    response_model=APIResponse[UsuarioResponse],
    status_code=status.HTTP_201_CREATED,
)
def crear_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
):
    if db.query(Usuario).filter(
        Usuario.codigo_usuario == usuario.codigo_usuario
    ).first():
        raise HTTPException(
            status_code=400,
            detail="El código de usuario ya existe",
        )

    if db.query(Usuario).filter(
        Usuario.documento == usuario.documento
    ).first():
        raise HTTPException(
            status_code=400,
            detail="El documento ya existe",
        )

    if db.query(Usuario).filter(
        Usuario.correo == usuario.correo
    ).first():
        raise HTTPException(
            status_code=400,
            detail="El correo ya existe",
        )

    nuevo_usuario = Usuario(
        id_colegio=usuario.id_colegio,
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

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

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
            status_code=401,
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
# 3. Usuario autenticado
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
# 4. Listar usuarios
# ============================================================

@router.get(
    "",
    response_model=APIResponse[list[UsuarioResponse]],
)
def listar_usuarios(
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
    db: Session = Depends(get_db),
):
    usuarios = (
        db.query(Usuario)
        .filter(
            Usuario.id_colegio == current_user.id_colegio
        )
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Lista de usuarios obtenida exitosamente",
        data=usuarios,
    )


# ============================================================
# 5. Listar estudiantes
# ============================================================

@router.get(
    "/estudiantes",
    response_model=APIResponse[list[EstudianteDetalleResponse]],
)
def listar_estudiantes(
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
    db: Session = Depends(get_db),
):
    estudiantes = (
        db.query(Usuario)
        .filter(
            Usuario.tipo_de_usuario == "estudiante",
            Usuario.id_colegio == current_user.id_colegio,
        )
        .options(
            joinedload(
                Usuario.incapacidades
            ).joinedload(
                Incapacidad.apelacion
            )
        )
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Estudiantes recuperados exitosamente",
        data=estudiantes,
    )


# ============================================================
# 6. Listar docentes
# ============================================================

@router.get(
    "/docentes",
    response_model=APIResponse[list[DocenteDetalleResponse]],
)
def listar_docentes(
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
    db: Session = Depends(get_db),
):
    docentes = (
        db.query(Usuario)
        .filter(
            Usuario.tipo_de_usuario == "docente",
            Usuario.id_colegio == current_user.id_colegio,
        )
        .all()
    )

    resultado = []

    for doc in docentes:

        materias = [
            dm.materia
            for dm in doc.materias
            if dm.materia
            and dm.materia.curso
            and dm.materia.curso.id_colegio
            == current_user.id_colegio
        ]

        cursos = list({
            dm.materia.curso
            for dm in doc.materias
            if dm.materia
            and dm.materia.curso
            and dm.materia.curso.id_colegio
            == current_user.id_colegio
        })

        resultado.append(
            DocenteDetalleResponse(
                id_usuario=doc.id_usuario,
                id_colegio=doc.id_colegio,
                codigo_usuario=doc.codigo_usuario,
                documento=doc.documento,
                nombres_compl=doc.nombres_compl,
                apellidos_compl=doc.apellidos_compl,
                telefono=doc.telefono,
                correo=doc.correo,
                tipo_de_usuario=doc.tipo_de_usuario,
                jornada=doc.jornada,
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
# 7. Mis entregas
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
# 8. Mis actividades
# ============================================================

@router.get(
    "/mis-actividades",
    response_model=APIResponse[
        list[ActividadEstudianteResponse]
    ],
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
            UsuarioCurso.id_usuario
            == current_user.id_usuario
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
                Entrega.id_actividad
                == actividad.id_actividad,
                Entrega.id_usuario
                == current_user.id_usuario,
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
# 9. Mis calificaciones
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
            Entrega.id_usuario
            == current_user.id_usuario,
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
# SOLO ADMINISTRADOR / COORDINADOR
# ============================================================

@router.delete(
    "/{id_usuario}",
    response_model=APIResponse[dict],
)
def eliminar_usuario(
    id_usuario: int,
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
    db: Session = Depends(get_db),
):
    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == id_usuario
        )
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )

    # El administrador no puede eliminar otro administrador
    if usuario.tipo_de_usuario == "administrador":
        raise HTTPException(
            status_code=403,
            detail="No se puede eliminar un administrador",
        )

    # Solo se permite eliminar estudiantes y docentes
    if usuario.tipo_de_usuario not in (
        "estudiante",
        "docente",
    ):
        raise HTTPException(
            status_code=400,
            detail="Solo se pueden eliminar estudiantes o docentes",
        )

    # Seguridad por colegio
    if usuario.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos sobre este usuario",
        )

    # ========================================================
    # Verificar registros que dependen del usuario
    # ========================================================

    tiene_incapacidades = (
        db.query(Incapacidad)
        .filter(
            Incapacidad.id_usuario
            == id_usuario
        )
        .first()
        is not None
    )

    tiene_historial = (
        db.query(HistorialIncapacidad)
        .filter(
            HistorialIncapacidad.id_usuario_cambio
            == id_usuario
        )
        .first()
        is not None
    )

    tiene_accesos = (
        db.query(AccesoAcademico)
        .filter(
            AccesoAcademico.id_usuario
            == id_usuario
        )
        .first()
        is not None
    )

    tiene_materiales = (
        db.query(MaterialAcademico)
        .filter(
            MaterialAcademico.id_usuario
            == id_usuario
        )
        .first()
        is not None
    )

    tiene_actividades = (
        db.query(Actividad)
        .filter(
            Actividad.id_usuario
            == id_usuario
        )
        .first()
        is not None
    )

    tiene_entregas = (
        db.query(Entrega)
        .filter(
            Entrega.id_usuario
            == id_usuario
        )
        .first()
        is not None
    )

    if any([
        tiene_incapacidades,
        tiene_historial,
        tiene_accesos,
        tiene_materiales,
        tiene_actividades,
        tiene_entregas,
    ]):
        raise HTTPException(
            status_code=409,
            detail=(
                "No se puede eliminar el usuario porque "
                "tiene registros académicos o administrativos "
                "relacionados."
            ),
        )

    nombre_usuario = (
        f"{usuario.nombres_compl} "
        f"{usuario.apellidos_compl}"
    )

    db.delete(usuario)
    db.commit()

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
        .filter(
            Usuario.id_usuario == id_usuario
        )
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )

    if usuario.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos sobre este usuario",
        )

    return APIResponse(
        success=True,
        mensaje="Usuario obtenido correctamente",
        data=usuario,
    )


# ============================================================
# 12. Actualizar usuario
# ============================================================

@router.put(
    "/{id_usuario}",
    response_model=APIResponse[UsuarioResponse],
)
def actualizar_usuario(
    id_usuario: int,
    datos: UsuarioCreate,
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
    db: Session = Depends(get_db),
):
    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == id_usuario
        )
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )

    if usuario.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos sobre este usuario",
        )

    usuario.id_colegio = datos.id_colegio
    usuario.codigo_usuario = datos.codigo_usuario
    usuario.documento = datos.documento
    usuario.nombres_compl = datos.nombres_compl
    usuario.apellidos_compl = datos.apellidos_compl
    usuario.telefono = datos.telefono
    usuario.correo = datos.correo

    if datos.contrasena:
        usuario.contrasena = hash_password(
            datos.contrasena
        )

    usuario.tipo_de_usuario = datos.tipo_de_usuario
    usuario.jornada = datos.jornada

    db.commit()
    db.refresh(usuario)

    return APIResponse(
        success=True,
        mensaje="Usuario actualizado exitosamente",
        data=usuario,
    )