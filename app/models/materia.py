from sqlalchemy import Column, Integer, String, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Materia(Base):
    __tablename__ = "materia"

    id_materia = Column(
        Integer,
        primary_key=True,
        index=True
    )

    codigo_materia = Column(
        String(20),
        nullable=False
    )

    nombre_materia = Column(
        String(100),
        nullable=False
    )

    descripcion = Column(
        Text,
        nullable=False
    )

    id_curso = Column(
        Integer,
        ForeignKey("curso.id_curso"),
        nullable=False
    )

    # Relación con curso
    curso = relationship(
        "Curso",
        back_populates="materias"
    )

    # Relación con docentes
    docentes = relationship(
        "DocenteMateria",
        back_populates="materia"
    )

    # Materiales académicos
    materiales_academicos = relationship(
        "MaterialAcademico",
        back_populates="materia"
    )

    # Actividades
    actividades = relationship(
        "Actividad",
        back_populates="materia"
    )