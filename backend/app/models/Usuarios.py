
from sqlalchemy import (
    Column,
    Integer,
    String,
    Enum,
    ForeignKey,
    Computed,
    CheckConstraint,
)
from sqlalchemy.orm import relationship

from app.database.base import Base


class Usuario(Base):
    __tablename__ = "usuario"

    __table_args__ = (
        CheckConstraint(
            """
            (
                tipo_de_usuario = 'administrador'
                AND id_colegio IS NULL
            )
            OR
            (
                tipo_de_usuario <> 'administrador'
                AND id_colegio IS NOT NULL
            )
            """,
            name="chk_usuario_colegio",
        ),
    )

    id_usuario = Column(
        Integer,
        primary_key=True,
        index=True,
    )

    id_colegio = Column(
        Integer,
        ForeignKey("colegio.id_colegio"),
        nullable=True,
    )

    documento = Column(
        String(20),
        unique=True,
        nullable=False,
    )

    nombres_compl = Column(
        String(80),
        nullable=False,
    )

    apellidos_compl = Column(
        String(80),
        nullable=False,
    )

    telefono = Column(
        String(20),
        nullable=False,
    )

    correo = Column(
        String(100),
        unique=True,
        nullable=False,
    )

    contrasena = Column(
        String(255),
        nullable=False,
    )

    tipo_de_usuario = Column(
        Enum(
            "administrador",
            "rector",
            "coordinador",
            "docente",
            "estudiante",
            name="tipo_usuario_enum",
        ),
        nullable=False,
    )

    estado_aprobacion = Column(
        Enum(
            "pendiente",
            "aprobada",
            "rechazada",
            name="estado_aprobacion_enum",
        ),
        nullable=True,
    )

    jornada = Column(
        String(20),
        nullable=True,
    )

    # Columna calculada: solo los rectores tienen este valor.
    # El índice único permite un solo rector por colegio.
    id_colegio_rector = Column(
        Integer,
        Computed(
            """
            CASE
                WHEN tipo_de_usuario = 'rector'
                THEN id_colegio
                ELSE NULL
            END
            """,
            persisted=True,
        ),
        unique=True,
    )

    colegio = relationship(
        "Colegio",
        back_populates="usuarios",
    )

    cursos = relationship(
        "UsuarioCurso",
        back_populates="usuario",
    )

    asignaciones_docentes = relationship(
        "DocenteAsignacion",
        back_populates="usuario",
    )

    incapacidades = relationship(
        "Incapacidad",
        back_populates="usuario",
        foreign_keys="Incapacidad.id_usuario",
    )

    historial_incapacidades = relationship(
        "HistorialIncapacidad",
        back_populates="usuario_cambio",
    )

    apelaciones_revisadas = relationship(
        "Apelacion",
        back_populates="revisor",
    )

    accesos_academicos = relationship(
        "AccesoAcademico",
        back_populates="usuario",
    )

    materiales_academicos = relationship(
        "MaterialAcademico",
        back_populates="usuario",
    )

    actividades = relationship(
        "Actividad",
        back_populates="usuario",
    )

    entregas = relationship(
        "Entrega",
        back_populates="usuario",
    )
