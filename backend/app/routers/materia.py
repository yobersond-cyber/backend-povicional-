
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
)
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.dependencias.auth import (
    get_current_user,
    obtener_rol_efectivo,
    require_role,
    verificar_acceso_academico,
)

from app.models.Usuarios import Usuario
from app.models.curso import Curso
from app.models.materia import Materia
from app.models.docente_asignacion import DocenteAsignacion
from app.models.usuario_curso import UsuarioCurso

from app.schemas.materia import (
    MateriaCreate,
    MateriaUpdate,
    MateriaResponse,
)

from app.schemas.base import APIResponse

from app.services.notificaciones_service import notificar_usuario


router = APIRouter(
    prefix="/materias",
    tags=["Materias"],
)


def obtener_materia(
    id_materia: int,
    db: Session,
) -> Materia:

    materia = (
        db.query(Materia)
        .filter(
            Materia.id_materia == id_materia,
        )
        .first()
    )

    if materia is None:
        raise HTTPException(
            status_code=404,
            detail="Materia no encontrada",
        )

    return materia


def notificar_actualizacion_materia(
    background_tasks: BackgroundTasks,
    db: Session,
    materia: Materia,
    nombre_anterior: str,
    descripcion_anterior: str | None,
) -> None:
    """
    Notifica a docentes y estudiantes afectados por cambios
    en una materia.
    """

    cambios = []

    if nombre_anterior != materia.nombre_materia:
        cambios.append(
            f"Nombre anterior: {nombre_anterior}\n"
            f"Nombre actual: {materia.nombre_materia}"
        )

    if descripcion_anterior != materia.descripcion:
        cambios.append(
            "La descripción de la materia fue modificada."
        )

    if not cambios:
        return

    detalle = "\n".join(cambios)

    # Docentes que tienen asignada esta materia.
    docentes = (
        db.query(Usuario)
        .join(
            DocenteAsignacion,
            DocenteAsignacion.id_usuario == Usuario.id_usuario,
        )
        .join(
            Curso,
            Curso.id_curso == DocenteAsignacion.id_curso,
        )
        .filter(
            DocenteAsignacion.id_materia == materia.id_materia,
            Usuario.tipo_de_usuario == "docente",
            Usuario.id_colegio == Curso.id_colegio,
            Usuario.correo.isnot(None),
        )
        .distinct()
        .all()
    )

    # Estudiantes inscritos en cursos donde se orienta la materia.
    estudiantes = (
        db.query(Usuario)
        .join(
            UsuarioCurso,
            UsuarioCurso.id_usuario == Usuario.id_usuario,
        )
        .join(
            DocenteAsignacion,
            DocenteAsignacion.id_curso == UsuarioCurso.id_curso,
        )
        .join(
            Curso,
            Curso.id_curso == DocenteAsignacion.id_curso,
        )
        .filter(
            DocenteAsignacion.id_materia == materia.id_materia,
            Usuario.tipo_de_usuario == "estudiante",
            Usuario.id_colegio == Curso.id_colegio,
            Usuario.correo.isnot(None),
        )
        .distinct()
        .all()
    )

    # Evita enviar dos correos al mismo usuario.
    destinatarios = {
        usuario.id_usuario: usuario
        for usuario in docentes + estudiantes
    }

    for usuario in destinatarios.values():

        if not usuario.correo or not usuario.correo.strip():
            continue

        nombre_usuario = (
            f"{usuario.nombres_compl} "
            f"{usuario.apellidos_compl}"
        ).strip()

        background_tasks.add_task(
            notificar_usuario,
            destinatario=usuario.correo.strip(),
            nombres_usuario=nombre_usuario,
            asunto="Actualización de materia - APRENZY",
            titulo="Se ha actualizado una materia",
            mensaje=(
                f"Te informamos que la materia "
                f"{materia.nombre_materia} ha sido actualizada. "
                f"Ingresa a APRENZY para consultar la información "
                f"actualizada."
            ),
            detalle=detalle,
        )


@router.get(
    "",
    response_model=APIResponse[list[MateriaResponse]],
)
def listar_materias(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    rol = obtener_rol_efectivo(current_user)

    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=403,
            detail="Tu cuenta no tiene un colegio asignado",
        )

    if rol == "coordinador":

        materias = (
            db.query(Materia)
            .order_by(Materia.nombre_materia.asc())
            .all()
        )

    elif rol == "docente":

        materias = (
            db.query(Materia)
            .join(
                DocenteAsignacion,
                DocenteAsignacion.id_materia == Materia.id_materia,
            )
            .join(
                Curso,
                Curso.id_curso == DocenteAsignacion.id_curso,
            )
            .filter(
                DocenteAsignacion.id_usuario == current_user.id_usuario,
                Curso.id_colegio == current_user.id_colegio,
            )
            .distinct()
            .order_by(Materia.nombre_materia.asc())
            .all()
        )

    elif rol == "estudiante":

        verificar_acceso_academico(current_user, db)

        materias = (
            db.query(Materia)
            .join(
                DocenteAsignacion,
                DocenteAsignacion.id_materia == Materia.id_materia,
            )
            .join(
                Curso,
                Curso.id_curso == DocenteAsignacion.id_curso,
            )
            .join(
                UsuarioCurso,
                UsuarioCurso.id_curso == Curso.id_curso,
            )
            .filter(
                UsuarioCurso.id_usuario == current_user.id_usuario,
                Curso.id_colegio == current_user.id_colegio,
            )
            .distinct()
            .order_by(Materia.nombre_materia.asc())
            .all()
        )

    else:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para consultar estas materias",
        )

    return APIResponse(
        success=True,
        mensaje="Materias recuperadas correctamente",
        data=materias,
    )


@router.post(
    "",
    response_model=APIResponse[MateriaResponse],
    status_code=201,
)
def crear_materia(
    datos: MateriaCreate,
    current_user: Usuario = Depends(require_role("coordinador")),
    db: Session = Depends(get_db),
):

    nueva_materia = Materia(
        nombre_materia=datos.nombre_materia,
        descripcion=datos.descripcion,
    )

    try:
        db.add(nueva_materia)
        db.commit()
        db.refresh(nueva_materia)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo crear la materia",
        )

    return APIResponse(
        success=True,
        mensaje="Materia creada correctamente",
        data=nueva_materia,
    )


@router.get(
    "/{id_materia}",
    response_model=APIResponse[MateriaResponse],
)
def obtener_materia_por_id(
    id_materia: int,
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
):

    rol = obtener_rol_efectivo(current_user)

    materia = obtener_materia(
        id_materia,
        db,
    )

    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=403,
            detail="Tu cuenta no tiene un colegio asignado",
        )

    if rol == "coordinador":
        pass

    elif rol == "docente":

        asignacion = (
            db.query(DocenteAsignacion)
            .join(
                Curso,
                Curso.id_curso == DocenteAsignacion.id_curso,
            )
            .filter(
                DocenteAsignacion.id_usuario == current_user.id_usuario,
                DocenteAsignacion.id_materia == id_materia,
                Curso.id_colegio == current_user.id_colegio,
            )
            .first()
        )

        if asignacion is None:
            raise HTTPException(
                status_code=404,
                detail="La materia no está entre tus asignaciones",
            )

    elif rol == "estudiante":

        verificar_acceso_academico(current_user, db)

        asignacion = (
            db.query(DocenteAsignacion)
            .join(
                Curso,
                Curso.id_curso == DocenteAsignacion.id_curso,
            )
            .join(
                UsuarioCurso,
                UsuarioCurso.id_curso == Curso.id_curso,
            )
            .filter(
                DocenteAsignacion.id_materia == id_materia,
                UsuarioCurso.id_usuario == current_user.id_usuario,
                Curso.id_colegio == current_user.id_colegio,
            )
            .first()
        )

        if asignacion is None:
            raise HTTPException(
                status_code=404,
                detail="La materia no pertenece a tus cursos",
            )

    else:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para consultar esta materia",
        )

    return APIResponse(
        success=True,
        mensaje="Materia obtenida correctamente",
        data=materia,
    )


@router.put(
    "/{id_materia}",
    response_model=APIResponse[MateriaResponse],
)
def actualizar_materia(
    id_materia: int,
    datos: MateriaUpdate,
    background_tasks: BackgroundTasks,
    current_user: Usuario = Depends(require_role("coordinador")),
    db: Session = Depends(get_db),
):

    materia = obtener_materia(
        id_materia,
        db,
    )

    nombre_anterior = materia.nombre_materia
    descripcion_anterior = materia.descripcion

    materia.nombre_materia = datos.nombre_materia
    materia.descripcion = datos.descripcion

    try:
        db.commit()
        db.refresh(materia)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo actualizar la materia",
        )

    notificar_actualizacion_materia(
        background_tasks=background_tasks,
        db=db,
        materia=materia,
        nombre_anterior=nombre_anterior,
        descripcion_anterior=descripcion_anterior,
    )

    return APIResponse(
        success=True,
        mensaje="Materia actualizada correctamente",
        data=materia,
    )


@router.delete(
    "/{id_materia}",
    response_model=APIResponse[dict],
)
def eliminar_materia(
    id_materia: int,
    current_user: Usuario = Depends(require_role("coordinador")),
    db: Session = Depends(get_db),
):

    materia = obtener_materia(
        id_materia,
        db,
    )

    try:
        db.delete(materia)
        db.commit()

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "No se pudo eliminar la materia. "
                "Puede tener actividades, materiales o asignaciones asociadas."
            ),
        )

    return APIResponse(
        success=True,
        mensaje="Materia eliminada correctamente",
        data={
            "id_materia": id_materia,
        },
    )
