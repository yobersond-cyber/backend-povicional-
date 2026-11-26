
from sqlalchemy import (
    Column,
    Integer,
    DateTime,
    Text,
    Enum,
    ForeignKey,
    String,
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class Apelacion(Base):
    __tablename__ = "apelacion"

    id_apelacion = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_incapacidad = Column(
        Integer,
        ForeignKey("incapacidad.id_incapacidad"),
        nullable=False,
        unique=True
    )

    fecha_apelacion = Column(
        DateTime,
        nullable=False
    )

    motivo = Column(
        Text,
        nullable=False
    )

    archivo = Column(
        String(255),
        nullable=True
    )

    archivo_public_id = Column(
        String(255),
        nullable=True
    )

    archivo_resource_type = Column(
        String(20),
        nullable=True
    )

    respuesta = Column(
        Text,
        nullable=True
    )

    estado = Column(
        Enum(
            "pendiente",
            "aprobada",
            "rechazada"
        ),
        nullable=False
    )

    id_revisor = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
        nullable=True
    )

    # Incapacidad apelada
    incapacidad = relationship(
        "Incapacidad",
        back_populates="apelacion"
    )

    # Usuario que revisa la apelación
    revisor = relationship(
        "Usuario",
        back_populates="apelaciones_revisadas"
    )
