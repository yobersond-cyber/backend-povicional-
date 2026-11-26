
from sqlalchemy import (
    Column,
    Integer,
    String,
    Text,
    Date,
    ForeignKey,
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class Actividad(Base):
    __tablename__ = "actividad"

    id_actividad = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
        nullable=False,
    )

    titulo = Column(
        String(120),
        nullable=False,
    )

    descripcion = Column(
        Text,
        nullable=False,
    )

    archivo = Column(
        String(255),
        nullable=True,
    )

    archivo_public_id = Column(
        String(255),
        nullable=True,
    )

    archivo_resource_type = Column(
        String(20),
        nullable=True,
    )

    fecha_publicacion = Column(
        Date,
        nullable=False,
    )

    fecha_limite = Column(
        Date,
        nullable=False,
    )

    id_materia = Column(
        Integer,
        ForeignKey("materia.id_materia"),
        nullable=False,
    )

    id_curso = Column(
        Integer,
        ForeignKey("curso.id_curso"),
        nullable=False,
    )

    usuario = relationship(
        "Usuario",
        back_populates="actividades",
    )

    materia = relationship(
        "Materia",
        back_populates="actividades",
    )

    curso = relationship(
        "Curso",
    )

    entregas = relationship(
        "Entrega",
        back_populates="actividad",
    )
