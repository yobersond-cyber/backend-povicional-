from datetime import datetime
from enum import Enum

from pydantic import Field

from app.schemas.base import BaseSchema


class EstadoEntrega(str, Enum):
    APROBADO = "Aprobado"
    REPROBADO = "Reprobado"


class EntregaBase(BaseSchema):
    id_actividad: int = Field(..., gt=0)
    id_usuario: int = Field(..., gt=0)

    fecha_entrega: datetime

    estado: EstadoEntrega

    descripcion: str = Field(
        ...,
        min_length=1
    )

    comentario_docente: str | None = None

    archivo: str | None = Field(
        default=None,
        max_length=255
    )

    nota: int | None = Field(
        default=None,
        ge=0,
        le=100
    )


class EntregaCreate(EntregaBase):
    pass

class EntregaCalificacion(BaseSchema):
    nota: int = Field(
        ...,
        ge=0,
        le=100
    )

class EntregaResponse(EntregaBase):
    id_entrega: int