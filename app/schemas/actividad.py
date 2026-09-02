from datetime import date

from pydantic import Field

from app.schemas.base import BaseSchema


class ActividadBase(BaseSchema):
    id_usuario: int = Field(..., gt=0)

    titulo: str = Field(
        ...,
        min_length=1,
        max_length=120
    )

    descripcion: str = Field(
        ...,
        min_length=1
    )

    fecha_publicacion: date
    fecha_limite: date

    id_materia: int = Field(..., gt=0)


class ActividadCreate(ActividadBase):
    pass


class ActividadResponse(ActividadBase):
    id_actividad: int