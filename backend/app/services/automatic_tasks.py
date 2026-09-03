import asyncio
import logging

from app.database.conection import SessionLocal
from app.services.acceso_service import finalizar_accesos_vencidos


logger = logging.getLogger(__name__)


async def tarea_finalizar_accesos():
    """
    Revisa periódicamente los accesos académicos
    y finaliza los que ya vencieron.
    """

    while True:
        db = SessionLocal()

        try:
            cantidad = finalizar_accesos_vencidos(db)

            if cantidad > 0:
                logger.info(
                    "Se finalizaron %s accesos académicos vencidos",
                    cantidad,
                )

        except Exception:
            logger.exception(
                "Error al finalizar accesos académicos vencidos"
            )

        finally:
            db.close()

        # Revisar nuevamente después de 60 segundos
        await asyncio.sleep(60)
