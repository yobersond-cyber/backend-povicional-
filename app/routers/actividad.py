from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import SessionLocal
from app.models.actividad import Actividad
from app.models.Usuarios import Usuario
from app.models.materia import Materia
from app.models.docente_materia import DocenteMateria
from app.schemas.actividad import (
    ActividadCreate,
    ActividadResponse,
)


router = APIRouter(
    prefix="/actividades",
    tags=["Actividades"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# POST /actividades
@router.post(
    "",
    response_model=ActividadResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_actividad(
    datos: ActividadCreate,
    db: Session = Depends(get_db),
):
    # Verificar usuario
    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == datos.id_usuario
        )
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )

    # Solo un docente puede crear actividades
    if usuario.tipo_de_usuario != "docente":
        raise HTTPException(
            status_code=400,
            detail="Solo un docente puede crear actividades",
        )

    # Verificar materia
    materia = (
        db.query(Materia)
        .filter(
            Materia.id_materia == datos.id_materia
        )
        .first()
    )

    if not materia:
        raise HTTPException(
            status_code=404,
            detail="Materia no encontrada",
        )

    # Verificar autorización docente-materia
    asignacion = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario == datos.id_usuario,
            DocenteMateria.id_materia == datos.id_materia,
        )
        .first()
    )

    if not asignacion:
        raise HTTPException(
            status_code=403,
            detail="El docente no está autorizado para gestionar esta materia",
        )

    # Validar fechas
    if datos.fecha_limite < datos.fecha_publicacion:
        raise HTTPException(
            status_code=400,
            detail="La fecha límite no puede ser anterior a la fecha de publicación",
        )

    nueva_actividad = Actividad(
        id_usuario=datos.id_usuario,
        titulo=datos.titulo,
        descripcion=datos.descripcion,
        fecha_publicacion=datos.fecha_publicacion,
        fecha_limite=datos.fecha_limite,
        id_materia=datos.id_materia,
    )

    db.add(nueva_actividad)
    db.commit()
    db.refresh(nueva_actividad)

    return nueva_actividad


# GET /actividades
@router.get(
    "",
    response_model=list[ActividadResponse],
)
def listar_actividades(
    db: Session = Depends(get_db),
):
    return db.query(Actividad).all()


# GET /actividades/{id_actividad}
@router.get(
    "/{id_actividad}",
    response_model=ActividadResponse,
)
def obtener_actividad(
    id_actividad: int,
    db: Session = Depends(get_db),
):
    actividad = (
        db.query(Actividad)
        .filter(
            Actividad.id_actividad == id_actividad
        )
        .first()
    )

    if not actividad:
        raise HTTPException(
            status_code=404,
            detail="Actividad no encontrada",
        )

    return actividad