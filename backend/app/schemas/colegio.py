
from datetime import datetime
from typing import Optional, Literal

from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema


class ColegioBase(BaseSchema):
    nombre_colegio: str = Field(
        ...,
        min_length=1,
        max_length=250,
    )

    codigo_dane: Optional[str] = Field(
        default=None,
        max_length=20,
    )

    nit: Optional[str] = Field(
        default=None,
        max_length=20,
    )

    direccion: Optional[str] = Field(
        default=None,
        max_length=250,
    )

    telefono: Optional[str] = Field(
        default=None,
        max_length=20,
    )

    correo_institucional: Optional[EmailStr] = None

    municipio: Optional[str] = Field(
        default=None,
        max_length=100,
    )

    departamento: Optional[str] = Field(
        default=None,
        max_length=100,
    )


class ColegioCreate(ColegioBase):
    estado: Literal["activo", "inactivo"] = "activo"


class ColegioResponse(ColegioBase):
    id_colegio: int
    estado: Literal["activo", "inactivo"]
    fecha_creacion: datetime


class CoordinadorCreate(BaseSchema):
    codigo_usuario: str = Field(
        ...,
        min_length=1,
        max_length=20,
    )

    documento: str = Field(
        ...,
        min_length=1,
        max_length=20,
    )

    nombres_compl: str = Field(
        ...,
        min_length=1,
        max_length=80,
    )

    apellidos_compl: str = Field(
        ...,
        min_length=1,
        max_length=80,
    )

    telefono: str = Field(
        ...,
        min_length=1,
        max_length=20,
    )

    correo: EmailStr

    contrasena: str = Field(
        ...,
        min_length=6,
        max_length=255,
    )


class CoordinadorResponse(BaseSchema):
    id_usuario: int
    id_colegio: int
    codigo_usuario: str
    documento: str
    nombres_compl: str
    apellidos_compl: str
    telefono: str
    correo: EmailStr
    tipo_de_usuario: Literal["coordinador"]


class ColegioConCoordinadorCreate(BaseSchema):
    colegio: ColegioCreate
    coordinador: CoordinadorCreate


class ColegioConCoordinadorResponse(BaseSchema):
    colegio: ColegioResponse
    coordinador: CoordinadorResponse
