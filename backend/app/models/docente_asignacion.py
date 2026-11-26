
from sqlalchemy import Column, Integer, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship

from app.database.base import Base


class DocenteAsignacion(Base):
    __tablename__ = "docente_asignacion"

    __table_args__ = (
        UniqueConstraint(
            "id_usuario",
            "id_materia",
            "id_curso",
            name="uq_docente_materia_curso"
        ),
    )

    id_asignacion = Column(
        Integer,
        primary_key=True,
        autoincrement=True
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

    id_curso = Column(
        Integer,
        ForeignKey("curso.id_curso"),
        nullable=False
    )

    # Docente al que pertenece la asignación.
    usuario = relationship(
        "Usuario",
        back_populates="asignaciones_docentes"
    )

    # Materia asignada.
    materia = relationship(
        "Materia",
        back_populates="asignaciones_docentes"
    )

    # Curso en el que el docente imparte la materia.
    curso = relationship(
        "Curso",
        back_populates="asignaciones_docentes"
    )
