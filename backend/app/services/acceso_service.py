from datetime import date

from sqlalchemy.orm import Session

from app.models.acceso_academico import AccesoAcademico
from app.models.incapacidad import Incapacidad


def finalizar_accesos_vencidos(db: Session) -> int:
    hoy = date.today()
    cambios = 0

    accesos = (
        db.query(AccesoAcademico)
        .join(
            Incapacidad,
            AccesoAcademico.id_incapacidad == Incapacidad.id_incapacidad,
        )
        .all()
    )

    try:
        for acceso in accesos:
            incapacidad = acceso.incapacidad

            if incapacidad.estado == "aprobada":

                # La incapacidad ya terminó.
                if incapacidad.fecha_fin < hoy:

                    if acceso.estado != "finalizado":
                        acceso.estado = "finalizado"
                        cambios += 1

                    if incapacidad.estado != "finalizada":
                        incapacidad.estado = "finalizada"
                        cambios += 1

                    continue

                # La incapacidad todavía no comienza.
                if hoy < incapacidad.fecha_inicio:

                    if acceso.estado != "suspendido":
                        acceso.estado = "suspendido"
                        cambios += 1

                    continue

                # La incapacidad está vigente.
                if acceso.estado != "activo":
                    acceso.estado = "activo"
                    cambios += 1

            # La incapacidad ya fue finalizada.
            elif incapacidad.estado == "finalizada":

                if acceso.estado != "finalizado":
                    acceso.estado = "finalizado"
                    cambios += 1

            # La incapacidad está pendiente o rechazada.
            else:

                if acceso.estado != "suspendido":
                    acceso.estado = "suspendido"
                    cambios += 1

        if cambios > 0:
            db.commit()

        return cambios

    except Exception:
        db.rollback()
        raise
