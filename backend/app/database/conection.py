
import tempfile
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.core.config import settings


connect_args = {}
archivo_ca_temporal = None


if settings.DB_SSL_CA:
    certificado = settings.DB_SSL_CA.strip()

    # Caso 1: Railway entrega el certificado PEM como texto.
    if "-----BEGIN CERTIFICATE-----" in certificado:
        certificado = certificado.replace("\\n", "\n")

        archivo_ca = tempfile.NamedTemporaryFile(
            mode="w",
            suffix=".pem",
            delete=False,
            encoding="utf-8",
        )

        archivo_ca.write(certificado)
        archivo_ca.close()

        archivo_ca_temporal = archivo_ca.name
        ruta_ca = archivo_ca_temporal

    # Caso 2: entorno local entrega la ruta del certificado.
    else:
        ruta = Path(certificado)

        if not ruta.is_file():
            raise ValueError(
                "DB_SSL_CA no contiene un certificado PEM válido "
                "ni una ruta existente al certificado."
            )

        ruta_ca = str(ruta)

    connect_args["ssl"] = {
        "ca": ruta_ca,
    }


database_url = settings.DATABASE_URL

if database_url.startswith("mysql://"):
    database_url = database_url.replace(
        "mysql://",
        "mysql+pymysql://",
        1,
    )

engine = create_engine(
    database_url,
    connect_args=connect_args,
    echo=True,
    pool_pre_ping=True,
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine,
)


def get_db():
    db = SessionLocal()

    try:
        yield db
    finally:
        db.close()
