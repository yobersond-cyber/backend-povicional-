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

    # Puede ser NULL únicamente para el administrador global.
    # Los demás roles deberán tener un colegio asignado.
    id_colegio = Column(
        Integer,
        ForeignKey("colegio.id_colegio"),
        nullable=True
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

    # Los cuatro roles admitidos por APRENZY.
    tipo_de_usuario = Column(
        Enum(
            "administrador",
            "coordinador",
            "docente",
            "estudiante",
            name="tipo_usuario_enum"
        ),
        nullable=False
    )

    jornada = Column(
        String(20),
        nullable=True
    )

    # Colegio al que pertenece el usuario.
    colegio = relationship(
        "Colegio",
        back_populates="usuarios"
    )

    # Relación con cursos.
    cursos = relationship(
        "UsuarioCurso",
        back_populates="usuario"
    )

    # Materias asignadas al docente.
    materias = relationship(
        "DocenteMateria",
        back_populates="usuario"
    )

    # Incapacidades del usuario.
    incapacidades = relationship(
        "Incapacidad",
        back_populates="usuario"
    )

    # Historial de incapacidades.
    historial_incapacidades = relationship(
        "HistorialIncapacidad",
        back_populates="usuario_cambio"
    )

    # Apelaciones revisadas.
    apelaciones_revisadas = relationship(
        "Apelacion",
        back_populates="revisor"
    )

    # Accesos académicos.
    accesos_academicos = relationship(
        "AccesoAcademico",
        back_populates="usuario"
    )

    # Material académico.
    materiales_academicos = relationship(
        "MaterialAcademico",
        back_populates="usuario"
    )

    # Actividades creadas o gestionadas por el usuario.
    actividades = relationship(
        "Actividad",
        back_populates="usuario"
    )

    # Entregas relacionadas con el usuario.
    entregas = relationship(
        "Entrega",
        back_populates="usuario"
    )