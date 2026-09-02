from datetime import datetime
from typing import Optional
from pydantic import Field
from enum import Enum

from app.schemas.base import BaseSchema


class EstadoApelacion(str, Enum):
    PENDIENTE = "pendiente"
    APROBADA = "aprobada"
    RECHAZADA = "rechazada"


class ApelacionBase(BaseSchema):
    id_incapacidad: int = Field(..., gt=0)
    fecha_apelacion: datetime
    motivo: str = Field(..., min_length=1)
    respuesta: Optional[str] = None
    estado: EstadoApelacion = EstadoApelacion.PENDIENTE
    id_revisor: Optional[int] = Field(default=None, gt=0)


class ApelacionCreate(ApelacionBase):
    pass


class ApelacionResponse(ApelacionBase):
    id_apelacion: int