from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class MaterialAcademico(Base):
    __tablename__ = "material_academico"

    id_material = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
        nullable=False
    )

    id_materia = Column(
        Integer,
        ForeignKey("materia.id_materia"),
        nullable=False
    )

    titulo = Column(
        String(150),
        nullable=False
    )

    descripcion = Column(
        Text,
        nullable=False
    )

    archivo = Column(
        String(255),
        nullable=False
    )

    fecha_publicacion = Column(
        DateTime,
        nullable=False
    )

    # Docente que publicó el material
    usuario = relationship(
        "Usuario",
        back_populates="materiales_academicos"
    )

    # Materia a la que pertenece
    materia = relationship(
        "Materia",
        back_populates="materiales_academicos"
    )