
from datetime import date

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.dependencias.auth import (
    get_current_user,
    require_role,
    obtener_rol_efectivo,
    verificar_acceso_academico,
)

from app.models.actividad import Actividad
from app.models.Usuarios import Usuario
from app.models.materia import Materia
from app.models.curso import Curso
from app.models.docente_asignacion import DocenteAsignacion
from app.models.usuario_curso import UsuarioCurso

from app.schemas.actividad import ActividadResponse

from app.services.notificaciones_service import notificar_usuario
from app.services.archivo_service import (
    subir_archivo,
    eliminar_archivo,
)


router = APIRouter(
    prefix="/actividades",
    tags=["Actividades"],
)


# ============================================================
# FUNCIONES AUXILIARES
# ============================================================

def obtener_asignacion_docente(
    db: Session,
    docente: Usuario,
    nombre_materia: str,
    numero_curso: str,
):
    asignacion = (
        db.query(DocenteAsignacion)
        .join(
            Materia,
            DocenteAsignacion.id_materia == Materia.id_materia,
        )
        .join(
            Curso,
            DocenteAsignacion.id_curso == Curso.id_curso,
        )
        .filter(
            DocenteAsignacion.id_usuario == docente.id_usuario,
            Materia.nombre_materia == nombre_materia.strip(),
            Curso.numero_curso == numero_curso.strip(),
            Curso.id_colegio == docente.id_colegio,
        )
        .first()
    )

    if asignacion is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "No tienes asignada esa materia en el curso seleccionado. "
                "Verifica el nombre de la materia y el número del curso."
            ),
        )

    return asignacion


def obtener_actividad_o_error(
    db: Session,
    id_actividad: int,
) -> Actividad:
    actividad = (
        db.query(Actividad)
        .filter(Actividad.id_actividad == id_actividad)
        .first()
    )

    if actividad is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Actividad no encontrada",
        )

    return actividad


def obtener_curso_de_actividad(
    db: Session,
    actividad: Actividad,
) -> Curso:
    curso = (
        db.query(Curso)
        .filter(Curso.id_curso == actividad.id_curso)
        .first()
    )

    if curso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso de la actividad no encontrado",
        )

    return curso


def verificar_colegio(
    curso: Curso,
    usuario: Usuario,
) -> None:
    if (
        usuario.id_colegio is None
        or curso.id_colegio != usuario.id_colegio
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes acceder a actividades de otro colegio",
        )


def verificar_acceso_actividad(
    db: Session,
    actividad: Actividad,
    current_user: Usuario,
) -> None:
    rol = obtener_rol_efectivo(current_user)
    curso = obtener_curso_de_actividad(db, actividad)

    verificar_colegio(curso, current_user)

    if rol == "coordinador":
        return

    if rol == "docente":
        asignacion = (
            db.query(DocenteAsignacion)
            .filter(
                DocenteAsignacion.id_usuario == current_user.id_usuario,
                DocenteAsignacion.id_materia == actividad.id_materia,
                DocenteAsignacion.id_curso == actividad.id_curso,
            )
            .first()
        )

        if asignacion is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a esta actividad",
            )

        return

    if rol == "estudiante":
        verificar_acceso_academico(current_user, db)

        pertenencia = (
            db.query(UsuarioCurso)
            .filter(
                UsuarioCurso.id_usuario == current_user.id_usuario,
                UsuarioCurso.id_curso == curso.id_curso,
            )
            .first()
        )

        if pertenencia is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes consultar actividades de otro curso",
            )

        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Rol no autorizado para consultar esta actividad",
    )


# ============================================================
# NOTIFICACIONES
# ============================================================

def notificar_publicacion_actividad(
    background_tasks: BackgroundTasks,
    db: Session,
    actividad: Actividad,
    materia: Materia,
    curso: Curso,
) -> None:
    """
    Programa notificaciones para los estudiantes inscritos
    en el curso donde se publicó la actividad.
    """

    estudiantes = (
        db.query(Usuario)
        .join(
            UsuarioCurso,
            Usuario.id_usuario == UsuarioCurso.id_usuario,
        )
        .filter(
            UsuarioCurso.id_curso == curso.id_curso,
            Usuario.tipo_de_usuario == "estudiante",
            Usuario.id_colegio == curso.id_colegio,
        )
        .distinct()
        .all()
    )

    fecha_limite = (
        actividad.fecha_limite.strftime("%d/%m/%Y")
        if actividad.fecha_limite
        else "No especificada"
    )

    for estudiante in estudiantes:
        if not estudiante.correo:
            continue

        background_tasks.add_task(
            notificar_usuario,
            destinatario=estudiante.correo,
            nombres_usuario=(
                f"{estudiante.nombres_compl} "
                f"{estudiante.apellidos_compl}"
            ),
            asunto=f"Nueva actividad: {actividad.titulo}",
            titulo="Se publicó una nueva actividad",
            mensaje=(
                f"Tu docente ha publicado una nueva actividad "
                f"en la materia {materia.nombre_materia}, "
                f"correspondiente al curso {curso.numero_curso}."
            ),
            detalle=(
                f"Título: {actividad.titulo}\n"
                f"Descripción: {actividad.descripcion or 'Sin descripción'}\n"
                f"Fecha límite de entrega: {fecha_limite}"
            ),
        )


# ============================================================
# POST /actividades
# Crear actividad con archivo opcional.
# ============================================================

@router.post(
    "",
    response_model=ActividadResponse,
    status_code=status.HTTP_201_CREATED,
)
async def crear_actividad(
    background_tasks: BackgroundTasks,
    titulo: str = Form(..., min_length=1, max_length=120),
    descripcion: str = Form(..., min_length=1),
    fecha_publicacion: date = Form(...),
    fecha_limite: date = Form(...),
    nombre_materia: str = Form(..., min_length=1, max_length=100),
    numero_curso: str = Form(..., min_length=1, max_length=10),
    archivo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente")),
):
    if not titulo.strip() or not descripcion.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El título y la descripción son obligatorios",
        )

    asignacion = obtener_asignacion_docente(
        db,
        current_user,
        nombre_materia,
        numero_curso,
    )

    if fecha_limite < fecha_publicacion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha límite no puede ser anterior a la fecha de publicación",
        )

    archivo_subido = None

    try:
        if archivo is not None:
            archivo_subido = await subir_archivo(
                archivo,
                "actividades",
            )

        nueva_actividad = Actividad(
            id_usuario=current_user.id_usuario,
            titulo=titulo.strip(),
            descripcion=descripcion.strip(),
            archivo=(
                archivo_subido["url"]
                if archivo_subido
                else None
            ),
            archivo_public_id=(
                archivo_subido["public_id"]
                if archivo_subido
                else None
            ),
            archivo_resource_type=(
                archivo_subido["resource_type"]
                if archivo_subido
                else None
            ),
            fecha_publicacion=fecha_publicacion,
            fecha_limite=fecha_limite,
            id_materia=asignacion.id_materia,
            id_curso=asignacion.id_curso,
        )

        db.add(nueva_actividad)
        db.commit()
        db.refresh(nueva_actividad)

    except HTTPException:
        db.rollback()

        if archivo_subido:
            eliminar_archivo(
                archivo_subido["public_id"],
                archivo_subido["resource_type"],
            )

        raise

    except Exception:
        db.rollback()

        if archivo_subido:
            eliminar_archivo(
                archivo_subido["public_id"],
                archivo_subido["resource_type"],
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo registrar la actividad",
        )

    materia = (
        db.query(Materia)
        .filter(
            Materia.id_materia == nueva_actividad.id_materia,
        )
        .first()
    )

    curso = (
        db.query(Curso)
        .filter(
            Curso.id_curso == nueva_actividad.id_curso,
        )
        .first()
    )

    if materia is not None and curso is not None:
        notificar_publicacion_actividad(
            background_tasks,
            db,
            nueva_actividad,
            materia,
            curso,
        )

    return nueva_actividad


# ============================================================
# GET /actividades
# Listar actividades según el rol.
# ============================================================

@router.get(
    "",
    response_model=list[ActividadResponse],
)
def listar_actividades(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    rol = obtener_rol_efectivo(current_user)

    if rol == "coordinador":
        return (
            db.query(Actividad)
            .join(
                Curso,
                Actividad.id_curso == Curso.id_curso,
            )
            .filter(
                Curso.id_colegio == current_user.id_colegio,
            )
            .all()
        )

    if rol == "docente":
        return (
            db.query(Actividad)
            .join(
                DocenteAsignacion,
                (Actividad.id_materia == DocenteAsignacion.id_materia)
                & (Actividad.id_curso == DocenteAsignacion.id_curso),
            )
            .filter(
                DocenteAsignacion.id_usuario == current_user.id_usuario,
            )
            .distinct()
            .all()
        )

    if rol == "estudiante":
        verificar_acceso_academico(current_user, db)

        cursos_estudiante = (
            db.query(UsuarioCurso.id_curso)
            .filter(
                UsuarioCurso.id_usuario == current_user.id_usuario,
            )
            .subquery()
        )

        return (
            db.query(Actividad)
            .filter(
                Actividad.id_curso.in_(cursos_estudiante),
            )
            .all()
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Rol no autorizado para consultar actividades",
    )


# ============================================================
# GET /actividades/{id_actividad}
# Consultar actividad concreta.
# ============================================================

@router.get(
    "/{id_actividad}",
    response_model=ActividadResponse,
)
def obtener_actividad(
    id_actividad: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    actividad = obtener_actividad_o_error(
        db,
        id_actividad,
    )

    verificar_acceso_actividad(
        db,
        actividad,
        current_user,
    )

    return actividad


# ============================================================
# PUT /actividades/{id_actividad}
# Editar actividad y reemplazar archivo opcionalmente.
# ============================================================

@router.put(
    "/{id_actividad}",
    response_model=ActividadResponse,
)
async def editar_actividad(
    id_actividad: int,
    titulo: str | None = Form(None, min_length=1, max_length=120),
    descripcion: str | None = Form(None, min_length=1),
    fecha_publicacion: date | None = Form(None),
    fecha_limite: date | None = Form(None),
    nombre_materia: str | None = Form(None, min_length=1, max_length=100),
    numero_curso: str | None = Form(None, min_length=1, max_length=10),
    archivo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente")),
):
    actividad = obtener_actividad_o_error(
        db,
        id_actividad,
    )

    if actividad.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes editar una actividad creada por otro docente",
        )

    verificar_acceso_actividad(
        db,
        actividad,
        current_user,
    )

    cambios = {
        "titulo": titulo,
        "descripcion": descripcion,
        "fecha_publicacion": fecha_publicacion,
        "fecha_limite": fecha_limite,
    }

    if titulo is not None and not titulo.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El título no puede estar vacío",
        )

    if descripcion is not None and not descripcion.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="La descripción no puede estar vacía",
        )

    if nombre_materia is not None or numero_curso is not None:
        materia_actual = (
            db.query(Materia)
            .filter(Materia.id_materia == actividad.id_materia)
            .first()
        )

        curso_actual = obtener_curso_de_actividad(
            db,
            actividad,
        )

        asignacion = obtener_asignacion_docente(
            db,
            current_user,
            nombre_materia or materia_actual.nombre_materia,
            numero_curso or curso_actual.numero_curso,
        )

        actividad.id_materia = asignacion.id_materia
        actividad.id_curso = asignacion.id_curso

    for campo, valor in cambios.items():
        if valor is not None:
            if isinstance(valor, str):
                valor = valor.strip()

            setattr(actividad, campo, valor)

    if actividad.fecha_limite < actividad.fecha_publicacion:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha límite no puede ser anterior a la fecha de publicación",
        )

    archivo_anterior = {
        "public_id": actividad.archivo_public_id,
        "resource_type": actividad.archivo_resource_type,
    }

    archivo_subido = None

    try:
        if archivo is not None:
            archivo_subido = await subir_archivo(
                archivo,
                "actividades",
            )

            actividad.archivo = archivo_subido["url"]
            actividad.archivo_public_id = archivo_subido["public_id"]
            actividad.archivo_resource_type = archivo_subido["resource_type"]

        db.commit()
        db.refresh(actividad)

    except HTTPException:
        db.rollback()

        if archivo_subido:
            eliminar_archivo(
                archivo_subido["public_id"],
                archivo_subido["resource_type"],
            )

        raise

    except Exception:
        db.rollback()

        if archivo_subido:
            eliminar_archivo(
                archivo_subido["public_id"],
                archivo_subido["resource_type"],
            )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo actualizar la actividad",
        )

    # Eliminar el archivo anterior solo después de guardar
    # correctamente el nuevo archivo y los cambios en la BD.
    if archivo_subido and archivo_anterior["public_id"]:
        eliminar_archivo(
            archivo_anterior["public_id"],
            archivo_anterior["resource_type"] or "image",
        )

    return actividad
