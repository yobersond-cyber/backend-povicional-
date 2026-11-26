
from datetime import date, datetime
from typing import Optional, Literal

from pydantic import Field, model_validator

from app.schemas.base import BaseSchema


EstadoIncapacidad = Literal[
    "pendiente",
    "aprobada",
    "rechazada",
    "finalizada",
]


class ApelacionResumen(BaseSchema):
    id_apelacion: int
    fecha_apelacion: datetime
    motivo: str
    respuesta: Optional[str] = None
    estado: str


class IncapacidadBase(BaseSchema):
    numero_radicado: str = Field(
        ...,
        min_length=1,
        max_length=30,
    )

    fecha_inicio: date
    fecha_fin: date

    archivo: str = Field(
        ...,
        min_length=1,
        max_length=255,
    )

    motivo: str = Field(
        ...,
        min_length=1,
    )

    estado: EstadoIncapacidad

    @model_validator(mode="after")
    def validar_fechas(self):
        if self.fecha_fin < self.fecha_inicio:
            raise ValueError(
                "La fecha de finalización no puede ser anterior a la fecha de inicio"
            )
        return self


class IncapacidadCreate(BaseSchema):
    numero_radicado: str = Field(
        ...,
        min_length=1,
        max_length=30,
    )

    fecha_inicio: date
    fecha_fin: date

    motivo: str = Field(
        ...,
        min_length=1,
    )

    @model_validator(mode="after")
    def validar_fechas(self):
        if self.fecha_fin < self.fecha_inicio:
            raise ValueError(
                "La fecha de finalización no puede ser anterior a la fecha de inicio"
            )
        return self


class IncapacidadUpdate(BaseSchema):
    fecha_inicio: date
    fecha_fin: date

    motivo: str = Field(
        ...,
        min_length=1,
    )

    estado: EstadoIncapacidad

    motivo_cambio: str = Field(
        ...,
        min_length=1,
    )

    observacion_revision: Optional[str] = Field(
        default=None,
        max_length=2000,
    )

    @model_validator(mode="after")
    def validar_fechas(self):
        if self.fecha_fin < self.fecha_inicio:
            raise ValueError(
                "La fecha de finalización no puede ser anterior a la fecha de inicio"
            )
        return self


class IncapacidadResponse(IncapacidadBase):
    id_incapacidad: int
    id_usuario: int
    fecha_revision: Optional[datetime] = None
    observacion_revision: Optional[str] = None


class IncapacidadDetalleResponse(IncapacidadResponse):
    apelacion: Optional[ApelacionResumen] = None
