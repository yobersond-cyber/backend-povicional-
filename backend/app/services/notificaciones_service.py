
import html
import logging

from app.services.email_service import enviar_correo


logger = logging.getLogger(__name__)


def notificar_usuario(
    destinatario: str,
    nombres_usuario: str,
    asunto: str,
    titulo: str,
    mensaje: str,
    detalle: str | None = None,
) -> bool:
    """
    Envía una notificación general por correo electrónico.

    Se utiliza para informar movimientos significativos
    que afectan directamente a un usuario de APRENZY.

    El administrador global no debe recibir notificaciones
    de este sistema.
    """

    if not destinatario or not destinatario.strip():
        logger.warning(
            "No se envió la notificación porque falta el destinatario."
        )
        return False

    nombres_usuario = nombres_usuario.strip()

    titulo_html = html.escape(titulo)
    nombres_html = html.escape(nombres_usuario)
    mensaje_html = html.escape(mensaje).replace("\n", "<br>")

    detalle_html = ""

    if detalle:
        detalle_html = f"""
        <div style="
            margin-top: 20px;
            padding: 15px;
            background-color: #f3f4f6;
            border-radius: 8px;
        ">
            <strong>Información adicional:</strong>
            <p>{html.escape(detalle).replace(chr(10), '<br>')}</p>
        </div>
        """

    contenido_texto = (
        f"Hola {nombres_usuario},\n\n"
        f"{mensaje}\n\n"
    )

    if detalle:
        contenido_texto += (
            f"Información adicional:\n{detalle}\n\n"
        )

    contenido_texto += (
        "Ingresa a APRENZY para consultar más detalles.\n\n"
        "Este es un mensaje automático de APRENZY."
    )

    contenido_html = f"""
    <!DOCTYPE html>
    <html lang="es">
        <head>
            <meta charset="UTF-8">
        </head>
        <body style="
            font-family: Arial, sans-serif;
            color: #333333;
            line-height: 1.6;
        ">
            <div style="
                max-width: 600px;
                margin: 20px auto;
                padding: 25px;
                border: 1px solid #e5e7eb;
                border-radius: 10px;
            ">
                <h2 style="color: #2563eb;">
                    APRENZY
                </h2>

                <h3>{titulo_html}</h3>

                <p>Hola {nombres_html},</p>

                <p>{mensaje_html}</p>

                {detalle_html}

                <p style="margin-top: 25px;">
                    Ingresa a APRENZY para consultar
                    más detalles.
                </p>

                <hr style="border: 0; border-top: 1px solid #e5e7eb;">

                <small style="color: #6b7280;">
                    Este es un mensaje automático de APRENZY.
                    Por favor, no respondas a este correo.
                </small>
            </div>
        </body>
    </html>
    """

    return enviar_correo(
        destinatario=destinatario.strip(),
        asunto=asunto,
        mensaje=contenido_texto,
        mensaje_html=contenido_html,
    )
