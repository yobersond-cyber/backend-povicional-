
import logging
import smtplib

from email.message import EmailMessage

from app.core.config import settings


logger = logging.getLogger(__name__)


def enviar_correo(
    destinatario: str,
    asunto: str,
    mensaje: str,
    mensaje_html: str | None = None,
) -> bool:
    """
    Envía un correo electrónico mediante SMTP.

    Args:
        destinatario: Correo de quien recibirá el mensaje.
        asunto: Asunto del correo.
        mensaje: Contenido en texto plano.
        mensaje_html: Contenido HTML opcional.

    Returns:
        True si el correo se envió correctamente.
        False si el envío está deshabilitado o ocurrió un error.
    """

    if not settings.EMAIL_ENABLED:
        logger.info(
            "Envío de correo deshabilitado. No se envió el mensaje a %s",
            destinatario,
        )
        return False

    if not all([
        settings.SMTP_HOST,
        settings.SMTP_USER,
        settings.SMTP_PASSWORD,
        settings.EMAIL_FROM,
    ]):
        logger.error(
            "La configuración SMTP está incompleta. "
            "No se pudo enviar el correo."
        )
        return False

    if not destinatario or not destinatario.strip():
        logger.warning(
            "No se puede enviar un correo sin destinatario."
        )
        return False

    correo = EmailMessage()

    correo["Subject"] = asunto
    correo["From"] = settings.EMAIL_FROM
    correo["To"] = destinatario.strip()

    correo.set_content(mensaje)

    if mensaje_html:
        correo.add_alternative(
            mensaje_html,
            subtype="html",
        )

    try:
        with smtplib.SMTP(
            settings.SMTP_HOST,
            settings.SMTP_PORT,
            timeout=settings.SMTP_TIMEOUT,
        ) as servidor:

            servidor.ehlo()

            if settings.SMTP_USE_TLS:
                servidor.starttls()
                servidor.ehlo()

            servidor.login(
                settings.SMTP_USER,
                settings.SMTP_PASSWORD,
            )

            servidor.send_message(correo)

        logger.info(
            "Correo enviado correctamente a %s",
            destinatario,
        )

        return True

    except (smtplib.SMTPException, OSError) as error:
        logger.exception(
            "No se pudo enviar el correo a %s: %s",
            destinatario,
            error,
        )
        return False

    except Exception:
        logger.exception(
            "Error inesperado al enviar correo a %s",
            destinatario,
        )
        return False
