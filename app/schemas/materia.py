from typing import Optional
from pydantic import Field
from app.schemas.base import BaseSchema


class MateriaBase(BaseSchema):
    codigo_materia: str = Field(..., min_length=1, max_length=20)
    nombre_materia: str = Field(..., min_length=1, max_length=100)
    descripcion: Optional[str] = None
    id_curso: int


class MateriaCreate(MateriaBase):
    pass


class MateriaUpdate(MateriaBase):
    pass


class MateriaResponse(MateriaBase):
    id_materia: int