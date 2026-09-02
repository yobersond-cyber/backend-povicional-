from datetime import date, datetime
from typing import Optional
from pydantic import BaseModel, Field, model_validator

from app.schemas.base import BaseSchema


class ApelacionResumen(BaseSchema):
    id_apelacion: int
    fecha_apelacion: datetime
    motivo: str
    respuesta: Optional[str] = None
    estado: str


class IncapacidadBase(BaseSchema):
    numero_radicado: str = Field(..., min_length=1, max_length=30)
    fecha_inicio: date
    fecha_fin: date
    archivo: str = Field(..., min_length=1, max_length=255)
    motivo: str
    estado: str
    id_usuario: int

    @model_validator(mode="after")
    def validar_fechas(self):
        if self.fecha_fin < self.fecha_inicio:
            raise ValueError("La fecha_fin no puede ser anterior a fecha_inicio")
        return self


class IncapacidadCreate(BaseModel):
    numero_radicado: str = Field(..., min_length=1, max_length=30)
    fecha_inicio: date
    fecha_fin: date
    archivo: str = Field(..., min_length=1, max_length=255)
    motivo: str
    id_usuario: int

    @model_validator(mode="after")
    def validar_fechas(self):
        if self.fecha_fin < self.fecha_inicio:
            raise ValueError("La fecha_fin no puede ser anterior a fecha_inicio")
        return self


class IncapacidadUpdate(BaseModel):
    fecha_inicio: date
    fecha_fin: date
    archivo: str = Field(..., min_length=1, max_length=255)
    motivo: str
    estado: str
    motivo_cambio: str = Field(..., min_length=1)
    id_usuario_cambio: int

    @model_validator(mode="after")
    def validar_fechas(self):
        if self.fecha_fin < self.fecha_inicio:
            raise ValueError("La fecha_fin no puede ser anterior a fecha_inicio")
        return self


class IncapacidadResponse(IncapacidadBase):
    id_incapacidad: int


class IncapacidadDetalleResponse(IncapacidadResponse):
    apelacion: Optional[ApelacionResumen] = None