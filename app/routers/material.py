from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import SessionLocal
from app.models.material_academico import MaterialAcademico
from app.models.Usuarios import Usuario
from app.models.materia import Materia
from app.models.docente_materia import DocenteMateria
from app.schemas.material_academico import (
    MaterialAcademicoCreate,
    MaterialAcademicoResponse,
)


router = APIRouter(
    prefix="/materiales",
    tags=["Material Académico"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# POST /materiales
@router.post(
    "",
    response_model=MaterialAcademicoResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_material(
    datos: MaterialAcademicoCreate,
    db: Session = Depends(get_db),
):
    # Verificar usuario
    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == datos.id_usuario
        )
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )

    # Solo un docente puede publicar material
    if usuario.tipo_de_usuario != "docente":
        raise HTTPException(
            status_code=400,
            detail="Solo un docente puede publicar material académico",
        )

    # Verificar materia
    materia = (
        db.query(Materia)
        .filter(
            Materia.id_materia == datos.id_materia
        )
        .first()
    )

    if not materia:
        raise HTTPException(
            status_code=404,
            detail="Materia no encontrada",
        )

    # Verificar que el docente esté autorizado para la materia
    asignacion = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario == datos.id_usuario,
            DocenteMateria.id_materia == datos.id_materia,
        )
        .first()
    )

    if not asignacion:
        raise HTTPException(
            status_code=403,
            detail="El docente no está autorizado para gestionar esta materia",
        )

    nuevo_material = MaterialAcademico(
        id_usuario=datos.id_usuario,
        id_materia=datos.id_materia,
        titulo=datos.titulo,
        descripcion=datos.descripcion,
        archivo=datos.archivo,
        fecha_publicacion=datos.fecha_publicacion,
    )

    db.add(nuevo_material)
    db.commit()
    db.refresh(nuevo_material)

    return nuevo_material


# GET /materiales
@router.get(
    "",
    response_model=list[MaterialAcademicoResponse],
)
def listar_materiales(
    db: Session = Depends(get_db),
):
    return db.query(MaterialAcademico).all()


# GET /materiales/{id_material}
@router.get(
    "/{id_material}",
    response_model=MaterialAcademicoResponse,
)
def obtener_material(
    id_material: int,
    db: Session = Depends(get_db),
):
    material = (
        db.query(MaterialAcademico)
        .filter(
            MaterialAcademico.id_material == id_material
        )
        .first()
    )

    if not material:
        raise HTTPException(
            status_code=404,
            detail="Material académico no encontrado",
        )

    return material