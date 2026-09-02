from pydantic import Field

from app.schemas.base import BaseSchema


class ColegioBase(BaseSchema):
    nombre_colegio: str = Field(min_length=1, max_length=250)


class ColegioCreate(ColegioBase):
    pass


class ColegioResponse(ColegioBase):
    id_colegio: int