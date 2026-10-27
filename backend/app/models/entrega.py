from sqlalchemy import Column, Integer, String, DateTime, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Entrega(Base):
    __tablename__ = "entrega"

    id_entrega = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_actividad = Column(
        Integer,
        ForeignKey("actividad.id_actividad"),
        nullable=False
    )

    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
        nullable=False
    )

    fecha_entrega = Column(
        DateTime,
        nullable=False
    )

    estado = Column(
    Enum(
        "Pendiente",
        "Aprobado",
        "Reprobado",
    ),
    nullable=False,
    default="Pendiente",
    server_default="Pendiente",
)

    descripcion = Column(
        Text,
        nullable=False
    )

    comentario_docente = Column(
        Text,
        nullable=True
    )

    archivo = Column(
        String(255),
        nullable=True
    )

    nota = Column(
        Integer,
        nullable=True
    )

    # Actividad a la que pertenece la entrega
    actividad = relationship(
        "Actividad",
        back_populates="entregas"
    )

    # Estudiante que realizó la entrega
    usuario = relationship(
        "Usuario",
        back_populates="entregas"
    )