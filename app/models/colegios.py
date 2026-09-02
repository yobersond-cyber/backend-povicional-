from sqlalchemy import Column, Integer, String
from sqlalchemy.orm import relationship

from app.database.base import Base


class Colegio(Base):
    __tablename__ = "colegio"

    id_colegio = Column(
        Integer,
        primary_key=True,
        index=True
    )

    nombre_colegio = Column(
        String(250),
        nullable=False
    )

    usuarios = relationship(
        "Usuario",
        back_populates="colegio"
    )

    cursos = relationship(
        "Curso",
        back_populates="colegio"
    )