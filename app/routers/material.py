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

from app.schemas.material_academico import (
    MaterialAcademicoCreate,
    MaterialAcademicoUpdate,
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


# PUT /materiales/{id_material}
@router.put(
    "/{id_material}",
    response_model=MaterialAcademicoResponse,
)
def editar_material(
    id_material: int,
    datos: MaterialAcademicoUpdate,
    id_usuario: int,
    db: Session = Depends(get_db),
):
    # Buscar material
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

    # Verificar usuario
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

    # Solo docentes
    if usuario.tipo_de_usuario != "docente":
        raise HTTPException(
            status_code=403,
            detail="Solo un docente puede editar material académico",
        )

    # Verificar que sea el docente que publicó el material
    if material.id_usuario != id_usuario:
        raise HTTPException(
            status_code=403,
            detail="No puedes editar material publicado por otro docente",
        )

    # Verificar que el docente siga asignado a la materia
    asignacion = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario == id_usuario,
            DocenteMateria.id_materia == material.id_materia,
        )
        .first()
    )

    if not asignacion:
        raise HTTPException(
            status_code=403,
            detail="El docente no está autorizado para gestionar esta materia",
        )

    # Actualizar información editable
    material.titulo = datos.titulo
    material.descripcion = datos.descripcion
    material.archivo = datos.archivo
    material.fecha_publicacion = datos.fecha_publicacion

    db.commit()
    db.refresh(material)

    return material


# DELETE /materiales/{id_material}
@router.delete(
    "/{id_material}",
)
def eliminar_material(
    id_material: int,
    id_usuario: int,
    db: Session = Depends(get_db),
):
    # Buscar material
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

    # Verificar usuario
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

    # Solo docentes
    if usuario.tipo_de_usuario != "docente":
        raise HTTPException(
            status_code=403,
            detail="Solo un docente puede eliminar material académico",
        )

    # Verificar propietario
    if material.id_usuario != id_usuario:
        raise HTTPException(
            status_code=403,
            detail="No puedes eliminar material publicado por otro docente",
        )

    # Verificar que el docente siga asignado a la materia
    asignacion = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario == id_usuario,
            DocenteMateria.id_materia == material.id_materia,
        )
        .first()
    )

    if not asignacion:
        raise HTTPException(
            status_code=403,
            detail="El docente no está autorizado para gestionar esta materia",
        )

    db.delete(material)
    db.commit()

    return {
        "success": True,
        "mensaje": "Material académico eliminado correctamente",
        "data": None,
    }	