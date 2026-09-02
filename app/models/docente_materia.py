from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class DocenteMateria(Base):
    __tablename__ = "docente_materia"

    id_docente_materia = Column(
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

    # Relación con usuario (docente)
    usuario = relationship(
        "Usuario",
        back_populates="materias"
    )

    # Relación con materia
    materia = relationship(
        "Materia",
        back_populates="docentes"
    )