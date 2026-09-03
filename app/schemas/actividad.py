from datetime import date
from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class ActividadBase(BaseSchema):
    id_usuario: int = Field(..., gt=0)
    titulo: str = Field(..., min_length=1, max_length=120)
    descripcion: str = Field(..., min_length=1)
    fecha_publicacion: date
    fecha_limite: date
    id_materia: int = Field(..., gt=0)


class ActividadCreate(ActividadBase):
    pass

class ActividadUpdate(ActividadBase):
    pass


class ActividadUpdate(BaseSchema):
    titulo: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=120
    )

    descripcion: Optional[str] = Field(
        default=None,
        min_length=1
    )

    fecha_publicacion: Optional[date] = None

    fecha_limite: Optional[date] = None

    id_materia: Optional[int] = Field(
        default=None,
        gt=0
    )


class ActividadResponse(ActividadBase):
    id_actividad: int


class ActividadEstudianteResponse(ActividadResponse):
    estado: str