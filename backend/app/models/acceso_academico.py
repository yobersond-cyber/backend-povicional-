from sqlalchemy import Column, Integer, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class AccesoAcademico(Base):
    __tablename__ = "acceso_academico"

    id_acceso = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_usuario = Column(
        Integer,
        ForeignKey("usuario.id_usuario"),
        nullable=False
    )

    id_incapacidad = Column(
        Integer,
        ForeignKey("incapacidad.id_incapacidad"),
        nullable=False,
        unique=True
    )

    estado = Column(
        Enum(
            "activo",
            "suspendido",
            "finalizado"
        ),
        nullable=False
    )

    # Usuario al que pertenece el acceso
    usuario = relationship(
        "Usuario",
        back_populates="accesos_academicos"
    )

    # Incapacidad que generó el acceso
    incapacidad = relationship(
        "Incapacidad",
        back_populates="acceso_academico"
    )