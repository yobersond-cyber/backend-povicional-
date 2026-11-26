
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class MaterialAcademico(Base):
    __tablename__ = "material_academico"

    id_material = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
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

    titulo = Column(
        String(150),
        nullable=False,
    )

    descripcion = Column(
        Text,
        nullable=False,
    )

    archivo = Column(
        String(255),
        nullable=False,
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
        DateTime,
        nullable=False,
    )

    usuario = relationship(
        "Usuario",
        back_populates="materiales_academicos",
    )

    materia = relationship(
        "Materia",
        back_populates="materiales_academicos",
    )

    curso = relationship(
        "Curso",
    )
