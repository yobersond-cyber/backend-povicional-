from datetime import datetime

from pydantic import Field

from app.schemas.base import BaseSchema


class MaterialAcademicoBase(BaseSchema):
    id_usuario: int = Field(..., gt=0)
    id_materia: int = Field(..., gt=0)

    titulo: str = Field(..., min_length=1, max_length=150)

    descripcion: str = Field(..., min_length=1)

    archivo: str = Field(..., min_length=1, max_length=255)

    fecha_publicacion: datetime


class MaterialAcademicoCreate(MaterialAcademicoBase):
    pass


class MaterialAcademicoUpdate(BaseSchema):
    titulo: str = Field(..., min_length=1, max_length=150)
    descripcion: str = Field(..., min_length=1)
    archivo: str = Field(..., min_length=1, max_length=255)
    fecha_publicacion: datetime


class MaterialAcademicoResponse(MaterialAcademicoBase):
    id_material: int
