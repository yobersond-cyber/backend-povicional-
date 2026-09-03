from sqlalchemy import Column, Integer, String, Date, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship

from app.database.base import Base


class Incapacidad(Base):
    __tablename__ = "incapacidad"

    id_incapacidad = Column(
        Integer,
        primary_key=True,
        index=True
    )

    numero_radicado = Column(
        String(30),
        unique=True,
        nullable=False
    )

    fecha_inicio = Column(
        Date,
        nullable=False
    )

    fecha_fin = Column(
        Date,
        nullable=False
    )

    archivo = Column(
        String(255),
        nullable=False
    )

    motivo = Column(
        Text,
        nullable=False
    )

    estado = Column(
        Enum(
            "pendiente",
            "aprobada",
            "rechazada",
            "finalizada"
        ),
        nullable=False
    )

    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
        nullable=False
    )

    # Relación con el estudiante/usuario
    usuario = relationship(
        "Usuario",
        back_populates="incapacidades"
    )

    # Historial de cambios
    historial = relationship(
        "HistorialIncapacidad",
        back_populates="incapacidad",
        cascade="all, delete-orphan"
    )

    # Apelación
    apelacion = relationship(
        "Apelacion",
        back_populates="incapacidad",
        uselist=False,
        cascade="all, delete-orphan"
    )

    # Acceso académico
    acceso_academico = relationship(
        "AccesoAcademico",
        back_populates="incapacidad",
        uselist=False,
        cascade="all, delete-orphan"
    )