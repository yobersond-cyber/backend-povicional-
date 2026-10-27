from datetime import datetime
from enum import Enum

from pydantic import Field

from app.schemas.base import BaseSchema


class EstadoEntrega(str, Enum):
    PENDIENTE = "Pendiente"
    APROBADO = "Aprobado"
    REPROBADO = "Reprobado"


# Datos que se devuelven al consultar una entrega.
class EntregaBase(BaseSchema):
    id_actividad: int = Field(..., gt=0)
    id_usuario: int = Field(..., gt=0)

    fecha_entrega: datetime

    estado: EstadoEntrega

    descripcion: str = Field(
        ...,
        min_length=1,
    )

    comentario_docente: str | None = None

    archivo: str | None = Field(
        default=None,
        max_length=255,
    )

    nota: int | None = Field(
        default=None,
        ge=0,
        le=100,
    )


# Datos permitidos al registrar una entrega.
# El estudiante no puede decidir su estado, nota
# ni comentario del docente.
class EntregaCreate(BaseSchema):
    id_actividad: int = Field(..., gt=0)
    id_usuario: int = Field(..., gt=0)

    fecha_entrega: datetime

    descripcion: str = Field(
        ...,
        min_length=1,
    )

    archivo: str | None = Field(
        default=None,
        max_length=255,
    )


# Datos permitidos para calificar una entrega.
class EntregaCalificacion(BaseSchema):
    nota: int = Field(
        ...,
        ge=0,
        le=100,
    )


# Respuesta completa del backend.
class EntregaResponse(EntregaBase):
    id_entrega: int