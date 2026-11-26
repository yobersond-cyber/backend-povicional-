
from enum import Enum

from pydantic import Field

from app.schemas.base import BaseSchema


class EstadoAcceso(str, Enum):
    ACTIVO = "activo"
    SUSPENDIDO = "suspendido"
    FINALIZADO = "finalizado"


class AccesoAcademicoCreate(BaseSchema):
    numero_radicado: str = Field(
        ...,
        min_length=1,
        max_length=30,
    )


class AccesoAcademicoResponse(BaseSchema):
    id_acceso: int
    id_usuario: int
    id_incapacidad: int
    estado: EstadoAcceso
