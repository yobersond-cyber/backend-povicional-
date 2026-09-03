from enum import Enum

from pydantic import Field

from app.schemas.base import BaseSchema


class EstadoAcceso(str, Enum):
    ACTIVO = "activo"
    SUSPENDIDO = "suspendido"
    FINALIZADO = "finalizado"


class AccesoAcademicoBase(BaseSchema):
    id_usuario: int = Field(..., gt=0)
    id_incapacidad: int = Field(..., gt=0)
    estado: EstadoAcceso = EstadoAcceso.ACTIVO


class AccesoAcademicoCreate(AccesoAcademicoBase):
    pass


class AccesoAcademicoResponse(AccesoAcademicoBase):
    id_acceso: int