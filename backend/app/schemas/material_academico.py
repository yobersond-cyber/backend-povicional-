
from datetime import datetime
from typing import Optional

from pydantic import Field

from app.schemas.base import BaseSchema


class MaterialAcademicoBase(BaseSchema):
    titulo: str = Field(
        ...,
        min_length=1,
        max_length=150,
    )

    descripcion: str = Field(
        ...,
        min_length=1,
    )

    fecha_publicacion: datetime

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


class MaterialAcademicoCreate(MaterialAcademicoBase):
    pass


class MaterialAcademicoUpdate(BaseSchema):
    titulo: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=150,
    )

    descripcion: Optional[str] = Field(
        default=None,
        min_length=1,
    )

    fecha_publicacion: Optional[datetime] = None

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


class MaterialAcademicoResponse(BaseSchema):
    id_material: int
    id_usuario: int
    id_materia: int
    id_curso: Optional[int]
    titulo: str
    descripcion: str
    archivo: str
    fecha_publicacion: datetime
