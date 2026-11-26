
from sqlalchemy import (
    Column,
    Integer,
    String,
    ForeignKey,
    UniqueConstraint,
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class Curso(Base):
    __tablename__ = "curso"

    __table_args__ = (
        UniqueConstraint(
            "id_colegio",
            "numero_curso",
            name="uq_curso_colegio_numero",
        ),
    )

    id_curso = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    id_colegio = Column(
        Integer,
        ForeignKey("colegio.id_colegio"),
        nullable=False,
    )

    numero_curso = Column(
        String(10),
        nullable=False,
    )

    grado = Column(
        String(20),
        nullable=False,
    )

    jornada = Column(
        String(20),
        nullable=False,
    )

    colegio = relationship(
        "Colegio",
        back_populates="cursos",
    )

    usuarios = relationship(
        "UsuarioCurso",
        back_populates="curso",
    )

    asignaciones_docentes = relationship(
        "DocenteAsignacion",
        back_populates="curso",
    )
