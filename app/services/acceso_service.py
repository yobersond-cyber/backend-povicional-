from datetime import date

from sqlalchemy.orm import Session

from app.models.acceso_academico import AccesoAcademico
from app.models.incapacidad import Incapacidad


def finalizar_accesos_vencidos(db: Session) -> int:
    hoy = date.today()

    accesos_vencidos = (
        db.query(AccesoAcademico)
        .join(
            Incapacidad,
            AccesoAcademico.id_incapacidad == Incapacidad.id_incapacidad,
        )
        .filter(
            AccesoAcademico.estado == "activo",
            Incapacidad.fecha_fin < hoy,
        )
        .all()
    )

    cantidad = len(accesos_vencidos)

    for acceso in accesos_vencidos:
        acceso.estado = "finalizado"

        if acceso.incapacidad.estado == "aprobada":
            acceso.incapacidad.estado = "finalizada"

    if cantidad > 0:
        db.commit()

    return cantidad