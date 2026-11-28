
import asyncio
import os
from contextlib import asynccontextmanager
from importlib import import_module

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import inspect, text

from app.database.conection import engine
from app.services.automatic_tasks import tarea_finalizar_accesos
from app.database.base import Base
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

import_module("app.models")


# ============================================================
# CONFIGURACIÓN DE LA ESTRUCTURA DE LA BASE DE DATOS
# ============================================================

TABLAS_REQUERIDAS = [
    "material_academico",
    "entrega",
    "incapacidad",
    "apelacion",
    "actividad",
]

COLUMNAS_NUEVAS = {
    "archivo": "VARCHAR(255) NULL",
    "archivo_public_id": "VARCHAR(255) NULL",
    "archivo_resource_type": "VARCHAR(20) NULL",
}

TABLAS_CON_ARCHIVO_EXISTENTE = {
    "material_academico",
    "entrega",
    "incapacidad",
}


def obtener_tablas_existentes() -> set[str]:
    inspector = inspect(engine)
    return set(inspector.get_table_names())


def validar_tablas_requeridas(
    tablas_existentes: set[str],
) -> None:
    for tabla in TABLAS_REQUERIDAS:
        if tabla not in tablas_existentes:
            raise RuntimeError(
                f"No existe la tabla {tabla} en la base de datos."
            )


def obtener_columnas_existentes(
    tabla: str,
) -> set[str]:
    inspector = inspect(engine)

    return {
        columna["name"]
        for columna in inspector.get_columns(tabla)
    }


def necesita_agregar_columna(
    tabla: str,
    nombre: str,
    columnas_existentes: set[str],
) -> bool:
    if nombre in columnas_existentes:
        return False

    if (
        nombre == "archivo"
        and tabla in TABLAS_CON_ARCHIVO_EXISTENTE
    ):
        return False

    return True


def obtener_cambios_pendientes() -> dict[str, dict[str, str]]:
    cambios_pendientes = {}

    for tabla in TABLAS_REQUERIDAS:
        columnas_existentes = obtener_columnas_existentes(tabla)
        cambios_pendientes[tabla] = {}

        for nombre, definicion in COLUMNAS_NUEVAS.items():
            if necesita_agregar_columna(
                tabla,
                nombre,
                columnas_existentes,
            ):
                cambios_pendientes[tabla][nombre] = definicion

    return cambios_pendientes


def agregar_columnas_faltantes(
    cambios_pendientes: dict[str, dict[str, str]],
) -> None:
    with engine.begin() as conexion:
        for tabla, columnas in cambios_pendientes.items():
            for nombre, definicion in columnas.items():
                conexion.execute(
                    text(
                        f"ALTER TABLE {tabla} "
                        f"ADD COLUMN {nombre} {definicion}"
                    )
                )


def actualizar_estructura_base_datos() -> None:
    """
    Crea las tablas que falten y agrega automáticamente
    las columnas necesarias para almacenar archivos
    de Cloudinary.

    Conserva las tablas y registros existentes.
    """
    Base.metadata.create_all(bind=engine)

    tablas_existentes = obtener_tablas_existentes()

    validar_tablas_requeridas(tablas_existentes)

    cambios_pendientes = obtener_cambios_pendientes()

    agregar_columnas_faltantes(cambios_pendientes)


# ============================================================
# CICLO DE VIDA DE LA APLICACIÓN
# ============================================================

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


# ============================================================
# CONFIGURACIÓN CORS
# ============================================================

origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

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


# ============================================================
# RUTA PRINCIPAL
# ============================================================

@app.get("/")
def root():
    return {
        "mensaje": "Aprenzy Backend funcionando"
    }


# ============================================================
# REGISTRO DE ROUTERS
# ============================================================

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
