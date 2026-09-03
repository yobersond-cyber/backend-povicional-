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


# POST /docente-materia
# Solo administrador puede asignar docentes a materias.
@router.post(
    "",
    response_model=APIResponse[DocenteMateriaResponse],
    status_code=status.HTTP_201_CREATED,
)
def asignar_docente_materia(
    datos: DocenteMateriaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("administrador")),
):
    # Buscar docente
    docente = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == datos.id_usuario)
        .first()
    )

    if not docente:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    if docente.tipo_de_usuario != "docente":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario seleccionado no es un docente",
        )

    # El docente debe pertenecer al mismo colegio
    # que el administrador que realiza la asignación.
    if docente.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes gestionar docentes de otro colegio",
        )

    # Buscar materia
    materia = (
        db.query(Materia)
        .filter(Materia.id_materia == datos.id_materia)
        .first()
    )

    if not materia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia no encontrada",
        )

    # Buscar curso de la materia
    curso = (
        db.query(Curso)
        .filter(Curso.id_curso == materia.id_curso)
        .first()
    )

    if not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso de la materia no encontrado",
        )

    # La materia debe pertenecer al colegio del administrador.
    if curso.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes gestionar materias de otro colegio",
        )

    # Evitar asignación duplicada.
    existente = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario == datos.id_usuario,
            DocenteMateria.id_materia == datos.id_materia,
        )
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El docente ya está asignado a esta materia",
        )

    nueva_asignacion = DocenteMateria(
        id_usuario=datos.id_usuario,
        id_materia=datos.id_materia,
    )

    db.add(nueva_asignacion)
    db.commit()
    db.refresh(nueva_asignacion)

    return APIResponse(
        success=True,
        mensaje="Docente asignado a la materia exitosamente",
        data=nueva_asignacion,
    )


# GET /docente-materia
# El administrador puede consultar las asignaciones de su colegio.
@router.get(
    "",
    response_model=APIResponse[list[DocenteMateriaResponse]],
)
def listar_asignaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("administrador")),
):
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
        mensaje="Asignaciones docente-materia recuperadas correctamente",
        data=asignaciones,
    )


# DELETE /docente-materia/{id_docente_materia}
# Solo administrador puede eliminar una asignación.
@router.delete(
    "/{id_docente_materia}",
    response_model=APIResponse[dict],
)
def eliminar_asignacion(
    id_docente_materia: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("administrador")),
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
            Usuario.id_colegio == current_user.id_colegio,
            Curso.id_colegio == current_user.id_colegio,
        )
        .first()
    )

    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignación docente-materia no encontrada",
        )

    db.delete(asignacion)
    db.commit()

    return APIResponse(
        success=True,
        mensaje="Asignación docente-materia eliminada correctamente",
        data={
            "id_docente_materia": id_docente_materia
        },
    )