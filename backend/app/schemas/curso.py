from pydantic import Field
from app.schemas.base import BaseSchema


class CursoBase(BaseSchema):
    id_colegio: int
    numero_curso: str = Field(..., min_length=1, max_length=10)
    grado: str = Field(..., min_length=1, max_length=20)
    jornada: str = Field(..., min_length=1, max_length=20)


class CursoCreate(CursoBase):
    pass


class CursoUpdate(CursoBase):
    pass


class CursoResponse(CursoBase):
    id_curso: int