from sqlalchemy import (
    Column,
    Integer,
    String,
    Enum,
    DateTime,
    func,
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class Colegio(Base):
    __tablename__ = "colegio"

    id_colegio = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nombre_colegio = Column(
        String(250),
        nullable=False
    )

    # Información de identificación institucional.
    codigo_dane = Column(
        String(20),
        unique=True,
        nullable=True
    )

    nit = Column(
        String(20),
        unique=True,
        nullable=True
    )

    direccion = Column(
        String(250),
        nullable=True
    )

    telefono = Column(
        String(20),
        nullable=True
    )

    correo_institucional = Column(
        String(100),
        nullable=True
    )

    municipio = Column(
        String(100),
        nullable=True
    )

    departamento = Column(
        String(100),
        nullable=True
    )

    estado = Column(
        Enum("activo", "inactivo"),
        nullable=False,
        server_default="activo"
    )

    fecha_creacion = Column(
        DateTime,
        nullable=False,
        server_default=func.current_timestamp()
    )

    # Usuarios asociados a este colegio.
    usuarios = relationship(
        "Usuario",
        back_populates="colegio"
    )

    # Cursos pertenecientes a este colegio.
    cursos = relationship(
        "Curso",
        back_populates="colegio"
    )