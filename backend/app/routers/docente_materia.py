
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.dependencias.auth import require_role
from app.models.docente_materia import DocenteMateria
from app.models.Usuarios import Usuario
from app.models.materia import Materia
from app.models.curso import Curso
from app.schemas.docente_materia import (
    DocenteMateriaCreate,
    DocenteMateriaResponse,
)
from app.schemas.base import APIResponse


router = APIRouter(
    prefix="/docente-materia",
    tags=["Docentes - Materias"],
)


def verificar_colegio_coordinador(current_user: Usuario):
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El coordinador no tiene un colegio asignado",
        )


def obtener_asignacion_del_colegio(
    db: Session,
    id_docente_materia: int,
    id_colegio: int,
):
    asignacion = (
        db.query(DocenteMateria)
        .join(
            Usuario,
            DocenteMateria.id_usuario == Usuario.id_usuario,
        )
        .join(
            Materia,
            DocenteMateria.id_materia == Materia.id_materia,
        )
        .join(
            Curso,
            Materia.id_curso == Curso.id_curso,
        )
        .filter(
            DocenteMateria.id_docente_materia == id_docente_materia,
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


@router.post(
    "",
    response_model=APIResponse[DocenteMateriaResponse],
    status_code=status.HTTP_201_CREATED,
)
def asignar_docente_materia(
    datos: DocenteMateriaCreate,
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
        .filter(Curso.id_curso == materia.id_curso)
        .first()
    )

    if curso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso de la materia no encontrado",
        )

    if curso.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes asignar docentes a materias de otro colegio",
        )

    existente = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario == docente.id_usuario,
            DocenteMateria.id_materia == materia.id_materia,
        )
        .first()
    )

    if existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El docente ya está asignado a esta materia",
        )

    nueva_asignacion = DocenteMateria(
        id_usuario=docente.id_usuario,
        id_materia=materia.id_materia,
    )

    try:
        db.add(nueva_asignacion)
        db.commit()
        db.refresh(nueva_asignacion)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo asignar el docente a la materia",
        )

    return APIResponse(
        success=True,
        mensaje="Docente asignado a la materia exitosamente",
        data=nueva_asignacion,
    )


@router.get(
    "",
    response_model=APIResponse[list[DocenteMateriaResponse]],
)
def listar_asignaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("coordinador")),
):
    verificar_colegio_coordinador(current_user)

    asignaciones = (
        db.query(DocenteMateria)
        .join(
            Usuario,
            DocenteMateria.id_usuario == Usuario.id_usuario,
        )
        .join(
            Materia,
            DocenteMateria.id_materia == Materia.id_materia,
        )
        .join(
            Curso,
            Materia.id_curso == Curso.id_curso,
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


@router.delete(
    "/{id_docente_materia}",
    response_model=APIResponse[dict],
)
def eliminar_asignacion(
    id_docente_materia: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("coordinador")),
):
    verificar_colegio_coordinador(current_user)

    asignacion = obtener_asignacion_del_colegio(
        db=db,
        id_docente_materia=id_docente_materia,
        id_colegio=current_user.id_colegio,
    )

    try:
        db.delete(asignacion)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo eliminar la asignación docente-materia",
        )

    return APIResponse(
        success=True,
        mensaje="Asignación docente-materia eliminada correctamente",
        data={
            "id_docente_materia": id_docente_materia,
        },
    )
