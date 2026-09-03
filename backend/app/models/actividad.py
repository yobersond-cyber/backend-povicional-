from sqlalchemy import Column, Integer, String, Text, Date, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Actividad(Base):
    __tablename__ = "actividad"

    id_actividad = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
        nullable=False
    )

    titulo = Column(
        String(120),
        nullable=False
    )

    descripcion = Column(
        Text,
        nullable=False
    )

    fecha_publicacion = Column(
        Date,
        nullable=False
    )

    fecha_limite = Column(
        Date,
        nullable=False
    )

    id_materia = Column(
        Integer,
        ForeignKey("materia.id_materia"),
        nullable=False
    )

    # Docente que creó la actividad
    usuario = relationship(
        "Usuario",
        back_populates="actividades"
    )

    # Materia a la que pertenece
    materia = relationship(
        "Materia",
        back_populates="actividades"
    )

    # Entregas de esta actividad
    entregas = relationship(
        "Entrega",
        back_populates="actividad"
    )