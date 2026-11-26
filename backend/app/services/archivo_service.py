
import logging

import cloudinary
import cloudinary.uploader

from fastapi import HTTPException, UploadFile, status

from app.core.config import settings


logger = logging.getLogger(__name__)


def configurar_cloudinary():
    """
    Configura la conexión con Cloudinary.
    """

    if not all([
        settings.CLOUDINARY_CLOUD_NAME,
        settings.CLOUDINARY_API_KEY,
        settings.CLOUDINARY_API_SECRET,
    ]):
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="El almacenamiento de archivos no está configurado",
        )

    cloudinary.config(
        cloud_name=settings.CLOUDINARY_CLOUD_NAME,
        api_key=settings.CLOUDINARY_API_KEY,
        api_secret=settings.CLOUDINARY_API_SECRET,
        secure=True,
    )


async def subir_archivo(
    archivo: UploadFile,
    carpeta: str,
) -> dict:
    """
    Sube un archivo a Cloudinary y devuelve sus datos.

    La URL segura y el identificador público se guardan
    posteriormente en la base de datos.
    """

    if not archivo or not archivo.filename:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se recibió ningún archivo",
        )

    try:
        configurar_cloudinary()

        resultado = cloudinary.uploader.upload(
            archivo.file,
            folder=f"{settings.CLOUDINARY_FOLDER}/{carpeta}",
            resource_type="auto",
            use_filename=True,
            unique_filename=True,
            overwrite=False,
        )

        return {
            "public_id": resultado.get("public_id"),
            "url": resultado.get("secure_url"),
            "resource_type": resultado.get("resource_type"),
            "format": resultado.get("format"),
            "filename": archivo.filename,
        }

    except HTTPException:
        raise

    except Exception as error:
        logger.exception(
            "Error al subir archivo a Cloudinary: %s",
            error,
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo subir el archivo",
        )


def eliminar_archivo(
    public_id: str,
    resource_type: str = "image",
) -> bool:
    """
    Elimina un archivo de Cloudinary utilizando su public_id.
    """

    if not public_id:
        return False

    try:
        configurar_cloudinary()

        resultado = cloudinary.uploader.destroy(
            public_id,
            resource_type=resource_type,
            invalidate=True,
        )

        return resultado.get("result") == "ok"

    except Exception as error:
        logger.exception(
            "Error al eliminar archivo de Cloudinary: %s",
            error,
        )

        return False
