
from datetime import datetime
from typing import Optional
from enum import Enum

from pydantic import Field

from app.schemas.base import BaseSchema


class EstadoApelacion(str, Enum):
    PENDIENTE = "pendiente"
    APROBADA = "aprobada"
    RECHAZADA = "rechazada"


class ApelacionCreate(BaseSchema):
    numero_radicado: str = Field(
        ...,
        min_length=1,
        max_length=30,
    )

    motivo: str = Field(
        ...,
        min_length=1,
    )


class ApelacionUpdate(BaseSchema):
    respuesta: Optional[str] = None
    estado: EstadoApelacion


class ApelacionResponse(BaseSchema):
    id_apelacion: int
    id_incapacidad: int
    fecha_apelacion: datetime
    motivo: str
    archivo: Optional[str] = None
    respuesta: Optional[str] = None
    estado: EstadoApelacion
    id_revisor: Optional[int] = None
