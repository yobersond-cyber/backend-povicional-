from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import SessionLocal
from app.models.docente_materia import DocenteMateria
from app.models.Usuarios import Usuario
from app.models.materia import Materia
from app.schemas.docente_materia import (
    DocenteMateriaCreate,
    DocenteMateriaResponse,
)


router = APIRouter(
    prefix="/docente-materia",
    tags=["Docentes - Materias"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# POST /docente-materia
@router.post(
    "",
    response_model=DocenteMateriaResponse,
    status_code=status.HTTP_201_CREATED,
)
def asignar_docente_materia(
    datos: DocenteMateriaCreate,
    db: Session = Depends(get_db),
):
    # Verificar que el usuario exista
    usuario = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == datos.id_usuario)
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )

    # Solo los docentes pueden gestionar materias
    if usuario.tipo_de_usuario != "docente":
        raise HTTPException(
            status_code=400,
            detail="El usuario seleccionado no es un docente",
        )

    # Verificar que la materia exista
    materia = (
        db.query(Materia)
        .filter(Materia.id_materia == datos.id_materia)
        .first()
    )

    if not materia:
        raise HTTPException(
            status_code=404,
            detail="Materia no encontrada",
        )

    # Verificar relación duplicada
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
            status_code=400,
            detail="El docente ya está asignado a esta materia",
        )

    nueva_asignacion = DocenteMateria(
        id_usuario=datos.id_usuario,
        id_materia=datos.id_materia,
    )

    db.add(nueva_asignacion)
    db.commit()
    db.refresh(nueva_asignacion)

    return nueva_asignacion


# GET /docente-materia
@router.get(
    "",
    response_model=list[DocenteMateriaResponse],
)
def listar_asignaciones(
    db: Session = Depends(get_db),
):
    return db.query(DocenteMateria).all()


# DELETE /docente-materia/{id_docente_materia}
@router.delete(
    "/{id_docente_materia}",
)
def eliminar_asignacion(
    id_docente_materia: int,
    db: Session = Depends(get_db),
):
    asignacion = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_docente_materia
            == id_docente_materia
        )
        .first()
    )

    if not asignacion:
        raise HTTPException(
            status_code=404,
            detail="Asignación docente-materia no encontrada",
        )

    db.delete(asignacion)
    db.commit()

    return {
        "mensaje": "Asignación eliminada correctamente"
    }