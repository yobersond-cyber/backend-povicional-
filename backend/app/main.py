
import asyncio
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database.conection import engine
from app.database.base import Base

# Registrar todos los modelos antes de crear las tablas.
import app.models

from app.routers import (
    usuario,
    colegio,
    curso,
    materia,
    usuario_curso,
    docente_asignacion,
    incapacidad,
    historial,
    apelacion,
    acceso,
    material,
    actividad,
    entrega,
)

from app.services.automatic_tasks import tarea_finalizar_accesos


def actualizar_estructura_base_datos():
    """
    Crea las tablas que falten y agrega automáticamente
    las columnas necesarias para almacenar archivos
    de Cloudinary.

    Conserva las tablas y registros existentes.
    """

    Base.metadata.create_all(bind=engine)

    tablas_requeridas = [
        "material_academico",
        "entrega",
        "incapacidad",
        "apelacion",
        "actividad",
    ]

    columnas_nuevas = {
        "archivo": "VARCHAR(255) NULL",
        "archivo_public_id": "VARCHAR(255) NULL",
        "archivo_resource_type": "VARCHAR(20) NULL",
    }

    tablas_con_archivo_existente = {
        "material_academico",
        "entrega",
        "incapacidad",
    }

    inspector = inspect(engine)
    tablas_existentes = set(inspector.get_table_names())

    for tabla in tablas_requeridas:
        if tabla not in tablas_existentes:
            raise RuntimeError(
                f"No existe la tabla {tabla} en la base de datos."
            )

    cambios_pendientes = {}

    for tabla in tablas_requeridas:
        columnas_existentes = {
            columna["name"]
            for columna in inspector.get_columns(tabla)
        }

        cambios_pendientes[tabla] = {}

        for nombre, definicion in columnas_nuevas.items():
            if nombre in columnas_existentes:
                continue

            if (
                nombre == "archivo"
                and tabla in tablas_con_archivo_existente
            ):
                continue

            cambios_pendientes[tabla][nombre] = definicion

    with engine.begin() as conexion:
        for tabla, columnas in cambios_pendientes.items():
            for nombre, definicion in columnas.items():
                conexion.execute(
                    text(
                        f"ALTER TABLE {tabla} "
                        f"ADD COLUMN {nombre} {definicion}"
                    )
                )


@asynccontextmanager
async def lifespan(app: FastAPI):
    actualizar_estructura_base_datos()

    tarea = asyncio.create_task(
        tarea_finalizar_accesos()
    )

    try:
        yield
    finally:
        tarea.cancel()

        try:
            await tarea
        except asyncio.CancelledError:
            pass


app = FastAPI(
    title="Aprenzy Backend",
    description="API MVP para la gestión académica de Aprenzy",
    version="1.0.0",
    lifespan=lifespan,
)


# Dominios permitidos para comunicarse con el backend.
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# Permitir agregar uno o varios dominios propios desde Railway.
# Ejemplo: https://mi-aplicacion.vercel.app
frontend_urls = os.getenv("FRONTEND_URL", "")

for url in frontend_urls.split(","):
    url = url.strip().rstrip("/")

    if url and url not in origins:
        origins.append(url)


app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_origin_regex=r"^https://[a-zA-Z0-9-]+\.vercel\.app$",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "mensaje": "Aprenzy Backend funcionando"
    }


routers = [
    usuario.router,
    colegio.router,
    curso.router,
    materia.router,
    usuario_curso.router,
    docente_asignacion.router,
    incapacidad.router,
    historial.router,
    apelacion.router,
    acceso.router,
    material.router,
    actividad.router,
    entrega.router,
]

for router in routers:
    app.include_router(router)
