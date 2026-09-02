from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import (
    usuario,
    curso,
    materia,
    usuario_curso,
    docente_materia,
    incapacidad,
    historial,
    apelacion,
    acceso,
    material,
    actividad,
    entrega,
)

app = FastAPI(
    title="Aprenzy Backend",
    description="API MVP para la gestión académica de Aprenzy",
    version="1.0.0",
)

# 1. Configuración de CORS para permitir la conexión desde el frontend (React)
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def root():
    return {
        "mensaje": "Aprenzy Backend funcionando"
    }


# 2. Lista de routers a incluir
routers = [
    usuario.router,
    curso.router,
    materia.router,
    usuario_curso.router,
    docente_materia.router,
    incapacidad.router,
    historial.router,
    apelacion.router,
    acceso.router,
    material.router,
    actividad.router,
    entrega.router,
]

# 3. Inclusión correcta de routers utilizando include_router
for router in routers:
    app.include_router(router)