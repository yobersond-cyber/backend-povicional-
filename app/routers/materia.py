from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.models.materia import Materia
from app.schemas.materia import MateriaCreate, MateriaUpdate

router = APIRouter(prefix="/materias", tags=["Materias"])


@router.get("/", status_code=status.HTTP_200_OK)
def listar_materias(db: Session = Depends(get_db)):
    materias = db.query(Materia).all()
    return {
        "success": True,
        "mensaje": "Materias obtenidas exitosamente",
        "data": materias
    }


@router.post("/", status_code=status.HTTP_201_CREATED)
def crear_materia(materia: MateriaCreate, db: Session = Depends(get_db)):
    db_materia = Materia(**materia.model_dump())
    db.add(db_materia)
    db.commit()
    db.refresh(db_materia)
    return {
        "success": True,
        "mensaje": "Materia creada exitosamente",
        "data": db_materia
    }


@router.get("/{id_materia}", status_code=status.HTTP_200_OK)
def obtener_materia(id_materia: int, db: Session = Depends(get_db)):
    db_materia = db.query(Materia).filter(Materia.id_materia == id_materia).first()
    if not db_materia:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    
    return {
        "success": True,
        "mensaje": "Materia obtenida exitosamente",
        "data": db_materia
    }


@router.put("/{id_materia}", status_code=status.HTTP_200_OK)
def actualizar_materia(
    id_materia: int, materia_update: MateriaUpdate, db: Session = Depends(get_db)
):
    db_materia = db.query(Materia).filter(Materia.id_materia == id_materia).first()
    if not db_materia:
        raise HTTPException(status_code=404, detail="Materia no encontrada")

    for key, value in materia_update.model_dump(exclude_unset=True).items():
        setattr(db_materia, key, value)

    db.commit()
    db.refresh(db_materia)
    return {
        "success": True,
        "mensaje": "Materia actualizada exitosamente",
        "data": db_materia
    }


@router.delete("/{id_materia}", status_code=status.HTTP_200_OK)
def eliminar_materia(id_materia: int, db: Session = Depends(get_db)):
    db_materia = db.query(Materia).filter(Materia.id_materia == id_materia).first()
    if not db_materia:
        raise HTTPException(status_code=404, detail="Materia no encontrada")
    
    db.delete(db_materia)
    db.commit()
    
    return {
        "success": True,
        "mensaje": "Materia eliminada exitosamente",
        "data": None
    }