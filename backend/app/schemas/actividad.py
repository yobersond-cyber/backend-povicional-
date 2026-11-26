
from datetime import date
from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class ActividadBase(BaseSchema):
    titulo: str = Field(
        ...,
        min_length=1,
        max_length=120,
    )

    descripcion: str = Field(
        ...,
        min_length=1,
    )

    fecha_publicacion: date
    fecha_limite: date

    nombre_materia: str = Field(
        ...,
        min_length=1,
        max_length=100,
    )

    numero_curso: str = Field(
        ...,
        min_length=1,
        max_length=10,
    )


class ActividadCreate(ActividadBase):
    pass


class ActividadUpdate(BaseSchema):
    titulo: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=120,
    )

    descripcion: Optional[str] = Field(
        default=None,
        min_length=1,
    )

    fecha_publicacion: Optional[date] = None
    fecha_limite: Optional[date] = None

    nombre_materia: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=100,
    )

    numero_curso: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=10,
    )


class ActividadResponse(BaseSchema):
    id_actividad: int
    titulo: str
    descripcion: str
    archivo: Optional[str] = None
    fecha_publicacion: date
    fecha_limite: date
    id_usuario: int
    id_materia: int
    id_curso: int


class ActividadEstudianteResponse(ActividadResponse):
    estado: str
