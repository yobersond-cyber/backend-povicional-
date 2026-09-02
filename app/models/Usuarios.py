from sqlalchemy import Column, Integer, String, Enum, ForeignKey
from sqlalchemy.orm import relationship

from app.database.base import Base


class Usuario(Base):
    __tablename__ = "usuario"

    id_usuario = Column(
        Integer,
        primary_key=True,
        index=True
    )

    id_colegio = Column(
        Integer,
        ForeignKey("colegio.id_colegio"),
        nullable=False
    )

    codigo_usuario = Column(
        String(20),
        unique=True,
        nullable=False
    )

    documento = Column(
        String(20),
        unique=True,
        nullable=False
    )

    nombres_compl = Column(
        String(80),
        nullable=False
    )

    apellidos_compl = Column(
        String(80),
        nullable=False
    )

    telefono = Column(
        String(20),
        nullable=False
    )

    correo = Column(
        String(100),
        unique=True,
        nullable=False
    )

    contrasena = Column(
        String(255),
        nullable=False
    )

    tipo_de_usuario = Column(
        Enum(
            "administrador",
            "docente",
            "estudiante"
        ),
        nullable=False
    )

    jornada = Column(
        String(20),
        nullable=True
    )

    # Relación con colegio
    colegio = relationship(
        "Colegio",
        back_populates="usuarios"
    )

    # Relación con cursos
    cursos = relationship(
        "UsuarioCurso",
        back_populates="usuario"
    )

    # Relación con materias que dicta el docente
    materias = relationship(
        "DocenteMateria",
        back_populates="usuario"
    )

    # Relación con incapacidades
    incapacidades = relationship(
        "Incapacidad",
        back_populates="usuario"
    )

    # Relación con historial de incapacidades
    historial_incapacidades = relationship(
        "HistorialIncapacidad",
        back_populates="usuario_cambio"
    )

    # Relación con apelaciones revisadas
    apelaciones_revisadas = relationship(
        "Apelacion",
        back_populates="revisor"
    )

    # Relación con accesos académicos
    accesos_academicos = relationship(
        "AccesoAcademico",
        back_populates="usuario"
    )

    # Relación con materiales académicos
    materiales_academicos = relationship(
        "MaterialAcademico",
        back_populates="usuario"
    )

    # Relación con actividades
    actividades = relationship(
        "Actividad",
        back_populates="usuario"
    )

    # Relación con entregas
    entregas = relationship(
        "Entrega",
        back_populates="usuario"
    )