
from app.schemas.base import BaseSchema


class DocenteAsignacionBase(BaseSchema):
    id_usuario: int
    id_materia: int
    id_curso: int


class DocenteAsignacionCreate(DocenteAsignacionBase):
    pass


class DocenteAsignacionResponse(DocenteAsignacionBase):
    id_asignacion: int
