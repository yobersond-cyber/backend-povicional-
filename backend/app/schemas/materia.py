
from app.schemas.base import BaseSchema


class MateriaBase(BaseSchema):
    nombre_materia: str
    descripcion: str


class MateriaCreate(MateriaBase):
    pass


class MateriaUpdate(MateriaBase):
    pass


class MateriaResponse(MateriaBase):
    id_materia: int
