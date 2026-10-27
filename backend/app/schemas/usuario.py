from typing import Optional, List, Literal

from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema
from app.schemas.incapacidad import IncapacidadDetalleResponse




# Roles que puede devolver la API.
TipoUsuario = Literal[
    "administrador",
    "coordinador",
    "docente",
    "estudiante",
]


class UsuarioBase(BaseSchema):
    # Es nulo para la cuenta de administrador global.
    id_colegio: Optional[int] = Field(default=None, gt=0)

    codigo_usuario: str = Field(min_length=1, max_length=20)
    documento: str = Field(min_length=1, max_length=20)
    nombres_compl: str = Field(min_length=1, max_length=80)
    apellidos_compl: str = Field(min_length=1, max_length=80)
    telefono: str = Field(min_length=1, max_length=20)
    correo: EmailStr

    tipo_de_usuario: TipoUsuario

    jornada: Optional[str] = Field(default=None, max_length=20)


class UsuarioCreate(UsuarioBase):
    # El registro general de usuarios exige un colegio.
    # Los administradores globales y coordinadores se
    # crearán mediante endpoints específicos y protegidos.
    id_colegio: int = Field(..., gt=0)

    # Este formulario general solo puede crear docentes
    # o estudiantes. No permite elevar privilegios.
    tipo_de_usuario: Literal["docente", "estudiante"]

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
    incapacidades: List[IncapacidadDetalleResponse] = Field(
        default_factory=list
    )


class DocenteDetalleResponse(UsuarioResponse):
    materias_asignadas: List[MateriaResumen] = Field(
        default_factory=list
    )

    cursos_asignados: List[CursoResumen] = Field(
        default_factory=list
    )