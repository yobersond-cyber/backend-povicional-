from sqlalchemy import Column, Integer, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class UsuarioCurso(Base):
    __tablename__ = "usuario_curso"

    id_usuario_curso = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
        nullable=False
    )

    id_curso = Column(
        Integer,
        ForeignKey("curso.id_curso"),
        nullable=False
    )

    # Relaciones
    usuario = relationship(
        "Usuario",
        back_populates="cursos"
    )

    curso = relationship(
        "Curso",
        back_populates="usuarios"
    )