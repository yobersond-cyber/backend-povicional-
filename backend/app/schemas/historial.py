
from datetime import date, datetime

from pydantic import Field

from app.schemas.base import BaseSchema


class HistorialResponse(BaseSchema):
    id_historial: int
    id_incapacidad: int = Field(..., gt=0)

    fecha_anterior_inicio: date
    fecha_anterior_fin: date

    fecha_nueva_inicio: date
    fecha_nueva_fin: date

    motivo_cambio: str

    fecha_cambio: datetime

    id_usuario_cambio: int = Field(..., gt=0)
