from typing import Optional, List
from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema
from app.schemas.incapacidad import IncapacidadDetalleResponse


class UsuarioBase(BaseSchema):
    id_colegio: int
    codigo_usuario: str = Field(min_length=1, max_length=20)
    documento: str = Field(min_length=1, max_length=20)
    nombres_compl: str = Field(min_length=1, max_length=80)
    apellidos_compl: str = Field(min_length=1, max_length=80)
    telefono: str = Field(min_length=1, max_length=20)
    correo: EmailStr
    tipo_de_usuario: str
    jornada: Optional[str] = Field(default=None, max_length=20)


class UsuarioCreate(UsuarioBase):
    contrasena: str = Field(min_length=6, max_length=255)
    # Campo condicional: obligatorio para estudiantes.
    id_curso: Optional[int] = Field(default=None, gt=0)


class UsuarioResponse(UsuarioBase):
    id_usuario: int


class UsuarioLogin(BaseSchema):
    correo: EmailStr
    contrasena: str


class MateriaResumen(BaseSchema):
    id_materia: int
    codigo_materia: str
    nombre_materia: str


class CursoResumen(BaseSchema):
    id_curso: int
    numero_curso: str
    grado: str
    jornada: str


class EstudianteDetalleResponse(UsuarioResponse):
    incapacidades: List[IncapacidadDetalleResponse] = []


class DocenteDetalleResponse(UsuarioResponse):
    materias_asignadas: List[MateriaResumen] = []
    cursos_asignados: List[CursoResumen] = []