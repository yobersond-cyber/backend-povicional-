
from typing import Optional, List, Literal

from pydantic import EmailStr, Field

from app.schemas.base import BaseSchema
from app.schemas.incapacidad import IncapacidadDetalleResponse


TipoUsuario = Literal[
    "administrador",
    "rector",
    "coordinador",
    "docente",
    "estudiante",
]

EstadoAprobacion = Literal[
    "pendiente",
    "aprobada",
    "rechazada",
]


# ============================================================
# DATOS GENERALES
# ============================================================

class UsuarioBase(BaseSchema):
    documento: str = Field(
        ...,
        min_length=1,
        max_length=20,
    )

    nombres_compl: str = Field(
        ...,
        min_length=1,
        max_length=80,
    )

    apellidos_compl: str = Field(
        ...,
        min_length=1,
        max_length=80,
    )

    telefono: str = Field(
        ...,
        min_length=1,
        max_length=20,
    )

    correo: EmailStr

    jornada: Optional[str] = Field(
        default=None,
        max_length=20,
    )


# ============================================================
# CREACIÓN INTERNA DE USUARIOS
# Rector: coordinadores, docentes y estudiantes.
# Coordinador: docentes y estudiantes.
# El colegio se obtiene del usuario autenticado.
# ============================================================

class UsuarioCreate(UsuarioBase):
    tipo_de_usuario: Literal[
        "coordinador",
        "docente",
        "estudiante",
    ]

    contrasena: str = Field(
        ...,
        min_length=6,
        max_length=255,
    )

    id_curso: Optional[int] = Field(
        default=None,
        gt=0,
    )


# ============================================================
# REGISTRO PÚBLICO DE ESTUDIANTES
# El estudiante selecciona colegio y curso.
# El rol y el estado se asignan en el backend.
# ============================================================

class RegistroEstudianteCreate(UsuarioBase):
    id_colegio: int = Field(
        ...,
        gt=0,
    )

    id_curso: int = Field(
        ...,
        gt=0,
    )

    contrasena: str = Field(
        ...,
        min_length=6,
        max_length=255,
    )


# ============================================================
# ACTUALIZACIÓN DE USUARIOS
# No permite cambiar el colegio ni el rol.
# ============================================================

class UsuarioUpdate(BaseSchema):
    documento: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=20,
    )

    nombres_compl: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=80,
    )

    apellidos_compl: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=80,
    )

    telefono: Optional[str] = Field(
        default=None,
        min_length=1,
        max_length=20,
    )

    correo: Optional[EmailStr] = None

    contrasena: Optional[str] = Field(
        default=None,
        min_length=6,
        max_length=255,
    )

    jornada: Optional[str] = Field(
        default=None,
        max_length=20,
    )

    id_curso: Optional[int] = Field(
        default=None,
        gt=0,
    )


# ============================================================
# RESPUESTAS
# ============================================================

class UsuarioResponse(UsuarioBase):
    id_usuario: int
    id_colegio: Optional[int] = None
    tipo_de_usuario: TipoUsuario
    estado_aprobacion: Optional[EstadoAprobacion] = None


class UsuarioLogin(BaseSchema):
    correo: EmailStr

    contrasena: str


# ============================================================
# RESÚMENES ACADÉMICOS
# ============================================================

class MateriaResumen(BaseSchema):
    id_materia: int
    nombre_materia: str


class CursoResumen(BaseSchema):
    id_curso: int
    numero_curso: str
    grado: str
    jornada: str


# ============================================================
# DETALLES DE USUARIOS
# ============================================================

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
