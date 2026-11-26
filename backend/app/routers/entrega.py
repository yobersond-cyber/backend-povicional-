
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    status,
    Form,
    File,
    UploadFile,
)
from sqlalchemy.orm import Session
from datetime import datetime

from app.database.conection import get_db
from app.dependencias.auth import (
    get_current_user,
    obtener_rol_efectivo,
    require_role,
    verificar_acceso_academico,
)

from app.models.entrega import Entrega
from app.models.actividad import Actividad
from app.models.Usuarios import Usuario
from app.models.curso import Curso
from app.models.usuario_curso import UsuarioCurso
from app.models.docente_asignacion import DocenteAsignacion

from app.schemas.entrega import (
    EntregaCalificacion,
    EntregaResponse,
)

from app.services.notificaciones_service import notificar_usuario
from app.services.archivo_service import (
    subir_archivo,
    eliminar_archivo,
)


router = APIRouter(
    prefix="/entregas",
    tags=["Entregas"],
)


# ============================================================
# FUNCIONES AUXILIARES
# ============================================================

def obtener_actividad_o_error(
    id_actividad: int,
    db: Session,
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
    actividad: Actividad,
    db: Session,
) -> Curso:
    if actividad.id_curso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La actividad no tiene un curso asociado",
        )

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


def obtener_entrega_o_error(
    id_entrega: int,
    db: Session,
):
    entrega = (
        db.query(Entrega)
        .filter(Entrega.id_entrega == id_entrega)
        .first()
    )

    if entrega is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrega no encontrada",
        )

    estudiante = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == entrega.id_usuario)
        .first()
    )

    if estudiante is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante de la entrega no encontrado",
        )

    actividad = obtener_actividad_o_error(
        entrega.id_actividad,
        db,
    )

    curso = obtener_curso_de_actividad(
        actividad,
        db,
    )

    return entrega, estudiante, actividad, curso


def verificar_colegio(
    current_user: Usuario,
    curso: Curso,
) -> None:
    if (
        current_user.id_colegio is None
        or current_user.id_colegio != curso.id_colegio
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a entregas de otro colegio",
        )


def verificar_asignacion_docente(
    db: Session,
    current_user: Usuario,
    actividad: Actividad,
) -> None:
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
            detail="No estás asignado a esta materia en el curso de la actividad",
        )


def verificar_pertenencia_estudiante(
    db: Session,
    estudiante: Usuario,
    id_curso: int,
) -> None:
    pertenencia = (
        db.query(UsuarioCurso)
        .join(
            Curso,
            UsuarioCurso.id_curso == Curso.id_curso,
        )
        .filter(
            UsuarioCurso.id_usuario == estudiante.id_usuario,
            UsuarioCurso.id_curso == id_curso,
            Curso.id_colegio == estudiante.id_colegio,
        )
        .first()
    )

    if pertenencia is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No perteneces al curso de esta actividad",
        )


def verificar_acceso_docente_entrega(
    db: Session,
    current_user: Usuario,
    actividad: Actividad,
    estudiante: Usuario,
    curso: Curso,
) -> None:
    verificar_colegio(current_user, curso)

    if estudiante.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El estudiante no pertenece a tu colegio",
        )

    verificar_asignacion_docente(
        db,
        current_user,
        actividad,
    )


# ============================================================
# NOTIFICAR A DOCENTES CUANDO SE REGISTRA UNA ENTREGA
# ============================================================

def notificar_nueva_entrega_docentes(
    background_tasks: BackgroundTasks,
    db: Session,
    estudiante: Usuario,
    actividad: Actividad,
    curso: Curso,
) -> None:

    docentes = (
        db.query(Usuario)
        .join(
            DocenteAsignacion,
            DocenteAsignacion.id_usuario == Usuario.id_usuario,
        )
        .filter(
            DocenteAsignacion.id_materia == actividad.id_materia,
            DocenteAsignacion.id_curso == actividad.id_curso,
            Usuario.tipo_de_usuario == "docente",
            Usuario.id_colegio == curso.id_colegio,
            Usuario.correo.isnot(None),
        )
        .distinct()
        .all()
    )

    for docente in docentes:
        if not docente.correo or not docente.correo.strip():
            continue

        background_tasks.add_task(
            notificar_usuario,
            destinatario=docente.correo,
            nombres_usuario=(
                f"{docente.nombres_compl} "
                f"{docente.apellidos_compl}"
            ),
            asunto=f"Nueva entrega recibida: {actividad.titulo}",
            titulo="Un estudiante ha entregado una actividad",
            mensaje=(
                f"El estudiante {estudiante.nombres_compl} "
                f"{estudiante.apellidos_compl} ha registrado "
                f"una entrega para la actividad "
                f"{actividad.titulo}."
            ),
            detalle=(
                f"Actividad: {actividad.titulo}\n"
                f"Curso: {curso.numero_curso}\n"
                f"Estudiante: {estudiante.nombres_compl} "
                f"{estudiante.apellidos_compl}\n"
                f"Estado: Pendiente de revisión"
            ),
        )


# ============================================================
# NOTIFICAR AL ESTUDIANTE CUANDO SU ENTREGA ES CALIFICADA
# ============================================================

def notificar_calificacion_entrega(
    background_tasks: BackgroundTasks,
    estudiante: Usuario,
    actividad: Actividad,
    curso: Curso,
    nota: int,
    estado: str,
    comentario: str | None,
) -> None:

    if (
        estudiante.tipo_de_usuario != "estudiante"
        or not estudiante.correo
        or not estudiante.correo.strip()
    ):
        return

    detalle = (
        f"Actividad: {actividad.titulo}\n"
        f"Curso: {curso.numero_curso}\n"
        f"Nota: {nota}/100\n"
        f"Resultado: {estado}\n"
        f"Observaciones del docente: "
        f"{comentario or 'Sin observaciones'}"
    )

    background_tasks.add_task(
        notificar_usuario,
        destinatario=estudiante.correo,
        nombres_usuario=(
            f"{estudiante.nombres_compl} "
            f"{estudiante.apellidos_compl}"
        ),
        asunto=f"Resultado de tu actividad: {actividad.titulo}",
        titulo="Tu entrega ha sido calificada",
        mensaje=(
            f"Tu docente ha evaluado tu entrega de la actividad "
            f"{actividad.titulo}. Tu resultado es: {estado}, "
            f"con una nota de {nota}/100. "
            f"Ingresa a APRENZY para consultar los detalles."
        ),
        detalle=detalle,
    )


# ============================================================
# POST /entregas
# El estudiante registra su propia entrega.
# El archivo adjunto es opcional.
# ============================================================

@router.post(
    "",
    response_model=EntregaResponse,
    status_code=status.HTTP_201_CREATED,
)
async def crear_entrega(
    background_tasks: BackgroundTasks,
    id_actividad: int = Form(...),
    fecha_entrega: datetime = Form(...),
    descripcion: str = Form(...),
    archivo: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("estudiante")),
):
    verificar_acceso_academico(current_user, db)

    actividad = obtener_actividad_o_error(
        id_actividad,
        db,
    )

    curso = obtener_curso_de_actividad(
        actividad,
        db,
    )

    verificar_colegio(
        current_user,
        curso,
    )

    verificar_pertenencia_estudiante(
        db,
        current_user,
        curso.id_curso,
    )

    entrega_existente = (
        db.query(Entrega)
        .filter(
            Entrega.id_actividad == actividad.id_actividad,
            Entrega.id_usuario == current_user.id_usuario,
        )
        .first()
    )

    if entrega_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una entrega para esta actividad",
        )

    archivo_subido = None

    if archivo is not None and archivo.filename:
        archivo_subido = await subir_archivo(
            archivo,
            "entregas",
        )

    nueva_entrega = Entrega(
        id_actividad=actividad.id_actividad,
        id_usuario=current_user.id_usuario,
        fecha_entrega=fecha_entrega,
        estado="Pendiente",
        descripcion=descripcion,
        archivo=archivo_subido["url"] if archivo_subido else None,
        archivo_public_id=(
            archivo_subido["public_id"] if archivo_subido else None
        ),
        archivo_resource_type=(
            archivo_subido["resource_type"] if archivo_subido else None
        ),
        comentario_docente=None,
        nota=None,
    )

    try:
        db.add(nueva_entrega)
        db.commit()
        db.refresh(nueva_entrega)

    except Exception:
        db.rollback()

        if archivo_subido:
            eliminar_archivo(
                archivo_subido["public_id"],
                archivo_subido["resource_type"],
            )

        raise

    notificar_nueva_entrega_docentes(
        background_tasks=background_tasks,
        db=db,
        estudiante=current_user,
        actividad=actividad,
        curso=curso,
    )

    return nueva_entrega


# ============================================================
# GET /entregas
# Listar entregas según el rol.
# ============================================================

@router.get(
    "",
    response_model=list[EntregaResponse],
)
def listar_entregas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    rol = obtener_rol_efectivo(current_user)

    if rol == "estudiante":
        verificar_acceso_academico(current_user, db)

        return (
            db.query(Entrega)
            .filter(
                Entrega.id_usuario == current_user.id_usuario,
            )
            .all()
        )

    if rol == "docente":
        if current_user.id_colegio is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El docente no tiene un colegio asignado",
            )

        return (
            db.query(Entrega)
            .join(
                Actividad,
                Entrega.id_actividad == Actividad.id_actividad,
            )
            .join(
                Curso,
                Actividad.id_curso == Curso.id_curso,
            )
            .join(
                DocenteAsignacion,
                (DocenteAsignacion.id_materia == Actividad.id_materia)
                & (DocenteAsignacion.id_curso == Actividad.id_curso),
            )
            .join(
                Usuario,
                Entrega.id_usuario == Usuario.id_usuario,
            )
            .filter(
                DocenteAsignacion.id_usuario == current_user.id_usuario,
                Curso.id_colegio == current_user.id_colegio,
                Usuario.id_colegio == current_user.id_colegio,
                Actividad.id_curso.isnot(None),
            )
            .distinct()
            .all()
        )

    if rol == "coordinador":
        if current_user.id_colegio is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El coordinador no tiene un colegio asignado",
            )

        return (
            db.query(Entrega)
            .join(
                Actividad,
                Entrega.id_actividad == Actividad.id_actividad,
            )
            .join(
                Curso,
                Actividad.id_curso == Curso.id_curso,
            )
            .join(
                Usuario,
                Entrega.id_usuario == Usuario.id_usuario,
            )
            .filter(
                Curso.id_colegio == current_user.id_colegio,
                Usuario.id_colegio == current_user.id_colegio,
                Actividad.id_curso.isnot(None),
            )
            .all()
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permisos para consultar entregas",
    )


# ============================================================
# GET /entregas/{id_entrega}
# Consultar una entrega concreta.
# ============================================================

@router.get(
    "/{id_entrega}",
    response_model=EntregaResponse,
)
def obtener_entrega(
    id_entrega: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    rol = obtener_rol_efectivo(current_user)

    entrega, estudiante, actividad, curso = (
        obtener_entrega_o_error(id_entrega, db)
    )

    if rol == "estudiante":
        verificar_acceso_academico(current_user, db)

        if entrega.id_usuario != current_user.id_usuario:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes consultar la entrega de otro estudiante",
            )

        verificar_colegio(current_user, curso)

        return entrega

    if rol == "coordinador":
        verificar_colegio(current_user, curso)

        if estudiante.id_colegio != current_user.id_colegio:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El estudiante no pertenece a tu colegio",
            )

        return entrega

    if rol == "docente":
        verificar_acceso_docente_entrega(
            db,
            current_user,
            actividad,
            estudiante,
            curso,
        )

        return entrega

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permisos para consultar esta entrega",
    )


# ============================================================
# PUT /entregas/{id_entrega}/calificacion
# Solo el docente asignado puede calificar.
# ============================================================

@router.put(
    "/{id_entrega}/calificacion",
    response_model=EntregaResponse,
)
def calificar_entrega(
    id_entrega: int,
    datos: EntregaCalificacion,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente")),
):
    entrega, estudiante, actividad, curso = (
        obtener_entrega_o_error(id_entrega, db)
    )

    verificar_acceso_docente_entrega(
        db,
        current_user,
        actividad,
        estudiante,
        curso,
    )

    nota_anterior = entrega.nota
    estado_anterior = entrega.estado
    comentario_anterior = entrega.comentario_docente

    entrega.nota = datos.nota
    entrega.estado = datos.estado.value

    if "comentario_docente" in datos.model_fields_set:
        entrega.comentario_docente = datos.comentario_docente

    nota_modificada = nota_anterior != entrega.nota
    estado_modificado = estado_anterior != entrega.estado
    comentario_modificado = (
        comentario_anterior != entrega.comentario_docente
    )

    try:
        db.commit()
        db.refresh(entrega)

    except Exception:
        db.rollback()
        raise

    if (
        nota_modificada
        or estado_modificado
        or comentario_modificado
    ):
        notificar_calificacion_entrega(
            background_tasks=background_tasks,
            estudiante=estudiante,
            actividad=actividad,
            curso=curso,
            nota=entrega.nota,
            estado=entrega.estado,
            comentario=entrega.comentario_docente,
        )

    return entrega
