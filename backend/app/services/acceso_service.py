
from datetime import date

from sqlalchemy.orm import Session

from app.models.acceso_academico import AccesoAcademico
from app.models.incapacidad import Incapacidad


def actualizar_estado_acceso(
    acceso: AccesoAcademico,
    estado: str,
) -> int:
    if acceso.estado == estado:
        return 0

    acceso.estado = estado
    return 1


def actualizar_estado_incapacidad_finalizada(
    incapacidad: Incapacidad,
) -> int:
    if incapacidad.estado == "finalizada":
        return 0

    incapacidad.estado = "finalizada"
    return 1


def procesar_incapacidad_aprobada(
    acceso: AccesoAcademico,
    incapacidad: Incapacidad,
    hoy: date,
) -> int:
    if incapacidad.fecha_fin < hoy:
        cambios = actualizar_estado_acceso(
            acceso,
            "finalizado",
        )
        cambios += actualizar_estado_incapacidad_finalizada(
            incapacidad,
        )
        return cambios

    if hoy < incapacidad.fecha_inicio:
        return actualizar_estado_acceso(
            acceso,
            "suspendido",
        )

    return actualizar_estado_acceso(
        acceso,
        "activo",
    )


def procesar_acceso(
    acceso: AccesoAcademico,
    hoy: date,
) -> int:
    incapacidad = acceso.incapacidad

    if incapacidad.estado == "aprobada":
        return procesar_incapacidad_aprobada(
            acceso,
            incapacidad,
            hoy,
        )

    if incapacidad.estado == "finalizada":
        return actualizar_estado_acceso(
            acceso,
            "finalizado",
        )

    return actualizar_estado_acceso(
        acceso,
        "suspendido",
    )


def obtener_accesos_academicos(
    db: Session,
) -> list[AccesoAcademico]:
    return (
        db.query(AccesoAcademico)
        .join(
            Incapacidad,
            AccesoAcademico.id_incapacidad == Incapacidad.id_incapacidad,
        )
        .all()
    )


def finalizar_accesos_vencidos(db: Session) -> int:
    hoy = date.today()
    cambios = 0

    accesos = obtener_accesos_academicos(db)

    try:
        for acceso in accesos:
            cambios += procesar_acceso(
                acceso,
                hoy,
            )

        if cambios > 0:
            db.commit()

        return cambios

    except Exception:
        db.rollback()
        raise
