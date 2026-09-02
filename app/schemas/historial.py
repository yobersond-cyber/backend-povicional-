from datetime import date, datetime

from pydantic import Field

from app.schemas.base import BaseSchema


class HistorialBase(BaseSchema):
    id_incapacidad: int = Field(..., gt=0)

    fecha_anterior_inicio: date
    fecha_anterior_fin: date

    fecha_nueva_inicio: date
    fecha_nueva_fin: date

    motivo_cambio: str = Field(..., min_length=1)

    fecha_cambio: datetime

    id_usuario_cambio: int = Field(..., gt=0)


class HistorialCreate(HistorialBase):
    pass


class HistorialResponse(HistorialBase):
    id_historial: int