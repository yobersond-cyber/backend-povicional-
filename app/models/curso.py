from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Curso(Base):
    __tablename__ = "curso"

    id_curso = Column(Integer, primary_key=True, index=True)
    id_colegio = Column(
        Integer, 
        ForeignKey("colegio.id_colegio"), 
        nullable=False
    )
    numero_curso = Column(String(10), nullable=False)
    grado = Column(String(20), nullable=False)
    jornada = Column(String(20), nullable=False)

    # Relaciones
    colegio = relationship("Colegio", back_populates="cursos")
    usuarios = relationship("UsuarioCurso", back_populates="curso")
    materias = relationship("Materia", back_populates="curso")