
from sqlalchemy import Column, Integer, String, Text
from sqlalchemy.orm import relationship

from app.database.base import Base


class Materia(Base):
    __tablename__ = "materia"

    id_materia = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nombre_materia = Column(
        String(100),
        nullable=False
    )

    descripcion = Column(
        Text,
        nullable=False
    )

    # Asignaciones de docentes a esta materia y sus respectivos cursos.
    asignaciones_docentes = relationship(
        "DocenteAsignacion",
        back_populates="materia"
    )

    # Materiales académicos de esta materia.
    materiales_academicos = relationship(
        "MaterialAcademico",
        back_populates="materia"
    )

    # Actividades correspondientes a esta materia.
    actividades = relationship(
        "Actividad",
        back_populates="materia"
    )
