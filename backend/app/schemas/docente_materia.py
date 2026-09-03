from app.schemas.base import BaseSchema


class DocenteMateriaBase(BaseSchema):
    id_usuario: int
    id_materia: int


class DocenteMateriaCreate(DocenteMateriaBase):
    pass


class DocenteMateriaResponse(DocenteMateriaBase):
    id_docente_materia: int