from sqlalchemy import Column, Integer, Date, DateTime, Text, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class HistorialIncapacidad(Base):
    __tablename__ = "historial_incapacidad"

    id_historial = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_incapacidad = Column(
        Integer,
        ForeignKey("incapacidad.id_incapacidad"),
        nullable=False
    )

    fecha_anterior_inicio = Column(
        Date,
        nullable=False
    )

    fecha_anterior_fin = Column(
        Date,
        nullable=False
    )

    fecha_nueva_inicio = Column(
        Date,
        nullable=False
    )

    fecha_nueva_fin = Column(
        Date,
        nullable=False
    )

    motivo_cambio = Column(
        Text,
        nullable=False
    )

    fecha_cambio = Column(
        DateTime,
        nullable=False
    )

    id_usuario_cambio = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
        nullable=False
    )

    # Incapacidad modificada
    incapacidad = relationship(
        "Incapacidad",
        back_populates="historial"
    )

    # Usuario que realizó el cambio
    usuario_cambio = relationship(
        "Usuario",
        back_populates="historial_incapacidades"
    )