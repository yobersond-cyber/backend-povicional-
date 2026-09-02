from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import SessionLocal
from app.models.historial_incapacidad import HistorialIncapacidad
from app.models.incapacidad import Incapacidad
from app.schemas.historial import HistorialResponse
from app.schemas.base import APIResponse


router = APIRouter(
    prefix="/historial",
    tags=["Historial de Incapacidades"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.get(
    "",
    response_model=APIResponse[list[HistorialResponse]],
)
def listar_historiales(
    db: Session = Depends(get_db),
):
    historiales = db.query(HistorialIncapacidad).all()
    return APIResponse(
        success=True,
        mensaje="Historial general de modificaciones en incapacidades recuperado",
        data=historiales,
    )


@router.get(
    "/incapacidad/{id_incapacidad}",
    response_model=APIResponse[list[HistorialResponse]],
)
def listar_historial_por_incapacidad(
    id_incapacidad: int,
    db: Session = Depends(get_db),
):
    incapacidad = (
        db.query(Incapacidad)
        .filter(Incapacidad.id_incapacidad == id_incapacidad)
        .first()
    )
    if not incapacidad:
        raise HTTPException(
            status_code=404,
            detail="Incapacidad no encontrada",
        )

    historial = (
        db.query(HistorialIncapacidad)
        .filter(HistorialIncapacidad.id_incapacidad == id_incapacidad)
        .all()
    )

    return APIResponse(
        success=True,
        mensaje=f"Historial de la incapacidad #{id_incapacidad} recuperado con éxito",
        data=historial,
    )