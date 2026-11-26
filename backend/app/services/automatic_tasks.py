
import asyncio
import logging

from app.database.conection import SessionLocal
from app.services.acceso_service import finalizar_accesos_vencidos


logger = logging.getLogger(__name__)


async def tarea_finalizar_accesos():
    """
    Sincroniza periódicamente los accesos académicos
    con las fechas y estados de las incapacidades.

    La tarea:
    - Activa accesos cuando comienza una incapacidad aprobada.
    - Mantiene suspendidos los accesos de incapacidades futuras.
    - Finaliza accesos cuando termina la incapacidad.
    - Suspende accesos de incapacidades pendientes o rechazadas.
    """

    while True:
        db = SessionLocal()

        try:
            cantidad = finalizar_accesos_vencidos(db)

            if cantidad > 0:
                logger.info(
                    "Se sincronizaron %s cambios en los accesos académicos",
                    cantidad,
                )

        except Exception:
            logger.exception(
                "Error al sincronizar los accesos académicos"
            )

        finally:
            db.close()

        # Revisar nuevamente después de 60 segundos.
        await asyncio.sleep(60)
