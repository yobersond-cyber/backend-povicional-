from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError
from app.database.conection import get_db
from app.dependencias.auth import require_role
from app.models.docente_asignacion import DocenteAsignacion
from app.models.Usuarios import Usuario
from app.models.materia import Materia
from app.models.curso import Curso
from app.schemas.docente_asignacion import (
    DocenteAsignacionCreate,
    DocenteAsignacionResponse,
)
from app.schemas.base import APIResponse
from app.services.notificaciones_service import notificar_usuario


router = APIRouter(
    prefix="/docente-materia",
    tags=["Docentes - Asignaciones"],
)


def verificar_colegio_coordinador(current_user: Usuario):
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El coordinador no tiene un colegio asignado",
        )


def obtener_asignacion_del_colegio(
    db: Session,
    id_asignacion: int,
    id_colegio: int,
):
    asignacion = (
        db.query(DocenteAsignacion)
        .join(
            Usuario,
            DocenteAsignacion.id_usuario == Usuario.id_usuario,
        )
        .join(
            Curso,
            DocenteAsignacion.id_curso == Curso.id_curso,
        )
        .filter(
            DocenteAsignacion.id_asignacion == id_asignacion,
            Usuario.id_colegio == id_colegio,
            Curso.id_colegio == id_colegio,
        )
        .first()
    )

    if asignacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignación no encontrada en tu colegio",
        )

    return asignacion


def obtener_nombre_materia(materia: Materia) -> str:
    return (
        getattr(materia, "nombre", None)
        or getattr(materia, "nombre_materia", None)
        or "la materia asignada"
    )


def obtener_nombre_curso(curso: Curso) -> str:
    return (
        getattr(curso, "nombre", None)
        or getattr(curso, "nombre_curso", None)
        or getattr(curso, "grado", None)
        or "el curso asignado"
    )


def programar_notificacion_docente(
    background_tasks: BackgroundTasks,
    docente: Usuario,
    materia: Materia,
    curso: Curso,
    accion: str,
) -> None:
    """
    Programa un correo para el docente involucrado
    en una asignación o retiro de materia y curso.
    """

    if (
        docente is None
        or docente.tipo_de_usuario != "docente"
        or not docente.correo
        or not docente.correo.strip()
    ):
        return

    nombre_docente = (
        f"{docente.nombres_compl} "
        f"{docente.apellidos_compl}"
    ).strip()

    nombre_materia = obtener_nombre_materia(materia)
    nombre_curso = obtener_nombre_curso(curso)

    if accion == "asignado":
        asunto = "Nueva asignación académica - APRENZY"
        titulo = "Se te ha asignado una materia y un curso"
        mensaje = (
            f"Hola {nombre_docente}, te informamos que "
            f"has sido asignado para orientar la materia "
            f"{nombre_materia} en el curso {nombre_curso}. "
            f"Ya puedes ingresar a APRENZY para consultar "
            f"tu asignación."
        )
    else:
        asunto = "Actualización de asignación académica - APRENZY"
        titulo = "Se ha retirado una asignación académica"
        mensaje = (
            f"Hola {nombre_docente}, te informamos que "
            f"tu asignación para orientar la materia "
            f"{nombre_materia} en el curso {nombre_curso} "
            f"ha sido retirada por el coordinador del colegio."
        )

    background_tasks.add_task(
        notificar_usuario,
        destinatario=docente.correo.strip(),
        nombres_usuario=nombre_docente,
        asunto=asunto,
        titulo=titulo,
        mensaje=mensaje,
        detalle=(
            f"Materia: {nombre_materia}\n"
            f"Curso: {nombre_curso}"
        ),
    )


# ============================================================
# POST /docente-materia
# Asignar un docente a una materia y curso.
# ============================================================


@router.post(
    "",
    response_model=APIResponse[DocenteAsignacionResponse],
    status_code=status.HTTP_201_CREATED,
)
def asignar_docente_materia(
    datos: DocenteAsignacionCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("coordinador")),
):
    verificar_colegio_coordinador(current_user)

    docente = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == datos.id_usuario)
        .first()
    )

    if docente is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Docente no encontrado",
        )

    if docente.tipo_de_usuario != "docente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario seleccionado no es un docente",
        )

    if docente.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes asignar docentes de otro colegio",
        )

    materia = (
        db.query(Materia)
        .filter(Materia.id_materia == datos.id_materia)
        .first()
    )

    if materia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia no encontrada",
        )

    curso = (
        db.query(Curso)
        .filter(Curso.id_curso == datos.id_curso)
        .first()
    )

    if curso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado",
        )

    if curso.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes asignar docentes a cursos de otro colegio",
        )

    existente = (
        db.query(DocenteAsignacion)
        .filter(
            DocenteAsignacion.id_usuario == datos.id_usuario,
            DocenteAsignacion.id_materia == datos.id_materia,
            DocenteAsignacion.id_curso == datos.id_curso,
        )
        .first()
    )

    if existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El docente ya está asignado a esa materia y curso",
        )

    nueva_asignacion = DocenteAsignacion(
        id_usuario=datos.id_usuario,
        id_materia=datos.id_materia,
        id_curso=datos.id_curso,
    )

    try:
        db.add(nueva_asignacion)
        db.commit()
        db.refresh(nueva_asignacion)

    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La asignación ya existe o contiene referencias inválidas",
        )

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo asignar el docente a la materia y curso",
        )

    # Notificar al docente después de guardar la asignación.
    programar_notificacion_docente(
        background_tasks=background_tasks,
        docente=docente,
        materia=materia,
        curso=curso,
        accion="asignado",
    )

    return APIResponse(
        success=True,
        mensaje="Docente asignado a la materia y curso exitosamente",
        data=nueva_asignacion,
    )

# ============================================================
# GET /docente-materia
# Listar asignaciones del colegio.
# ============================================================


@router.get(
    "",
    response_model=APIResponse[list[DocenteAsignacionResponse]],
)
def listar_asignaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("coordinador")),
):
    verificar_colegio_coordinador(current_user)

    asignaciones = (
        db.query(DocenteAsignacion)
        .join(
            Usuario,
            DocenteAsignacion.id_usuario == Usuario.id_usuario,
        )
        .join(
            Curso,
            DocenteAsignacion.id_curso == Curso.id_curso,
        )
        .filter(
            Usuario.id_colegio == current_user.id_colegio,
            Curso.id_colegio == current_user.id_colegio,
        )
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Asignaciones de tu colegio recuperadas correctamente",
        data=asignaciones,
    )


# ============================================================
# DELETE /docente-materia/{id_asignacion}
# Retirar una asignación docente.
# ============================================================


@router.delete(
    "/{id_asignacion}",
    response_model=APIResponse[dict],
)
def eliminar_asignacion(
    id_asignacion: int,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("coordinador")),
):
    verificar_colegio_coordinador(current_user)

    asignacion = obtener_asignacion_del_colegio(
        db=db,
        id_asignacion=id_asignacion,
        id_colegio=current_user.id_colegio,
    )

    # Obtener los datos antes de eliminar la asignación.
    docente = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == asignacion.id_usuario,
        )
        .first()
    )

    materia = (
        db.query(Materia)
        .filter(
            Materia.id_materia == asignacion.id_materia,
        )
        .first()
    )

    curso = (
        db.query(Curso)
        .filter(
            Curso.id_curso == asignacion.id_curso,
        )
        .first()
    )

    try:
        db.delete(asignacion)
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo eliminar la asignación docente",
        )

    # Notificar únicamente después de eliminar correctamente.
    if docente is not None and materia is not None and curso is not None:
        programar_notificacion_docente(
            background_tasks=background_tasks,
            docente=docente,
            materia=materia,
            curso=curso,
            accion="retirado",
        )

    return APIResponse(
        success=True,
        mensaje="Asignación docente eliminada correctamente",
        data={
            "id_asignacion": id_asignacion,
        },
    )

# ============================================================
# GET /docente-materia/mis-asignaciones
# Consultar las materias y cursos del docente autenticado.
# ============================================================


@router.get("/mis-asignaciones")
def listar_mis_asignaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente")),
):
    asignaciones = (
        db.query(
            DocenteAsignacion.id_asignacion,
            DocenteAsignacion.id_materia,
            DocenteAsignacion.id_curso,
            Materia.nombre_materia,
            Curso.numero_curso,
        )
        .join(
            Materia,
            Materia.id_materia == DocenteAsignacion.id_materia,
        )
        .join(
            Curso,
            Curso.id_curso == DocenteAsignacion.id_curso,
        )
        .filter(
            DocenteAsignacion.id_usuario == current_user.id_usuario,
            Curso.id_colegio == current_user.id_colegio,
        )
        .order_by(
            Materia.nombre_materia.asc(),
            Curso.numero_curso.asc(),
        )
        .all()
    )

    return {
        "success": True,
        "mensaje": "Tus asignaciones fueron recuperadas correctamente",
        "data": [
            {
                "id_asignacion": item.id_asignacion,
                "id_materia": item.id_materia,
                "id_curso": item.id_curso,
                "nombre_materia": item.nombre_materia,
                "numero_curso": item.numero_curso,
            }
            for item in asignaciones
        ],
    }
