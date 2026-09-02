from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import SessionLocal
from app.models.acceso_academico import AccesoAcademico
from app.models.incapacidad import Incapacidad
from app.models.Usuarios import Usuario
from app.schemas.acceso_academico import (
    AccesoAcademicoCreate,
    AccesoAcademicoResponse,
    EstadoAcceso,
)


router = APIRouter(
    prefix="/accesos",
    tags=["Acceso Académico"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# POST /accesos
@router.post(   
    "",
    response_model=AccesoAcademicoResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_acceso(
    datos: AccesoAcademicoCreate,
    db: Session = Depends(get_db),
):
    # Verificar que el usuario exista
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

    # Verificar que la incapacidad exista
    incapacidad = (
        db.query(Incapacidad)
        .filter(
            Incapacidad.id_incapacidad == datos.id_incapacidad
        )
        .first()
    )

    if not incapacidad:
        raise HTTPException(
            status_code=404,
            detail="Incapacidad no encontrada",
        )

    # La incapacidad debe pertenecer al mismo usuario
    if incapacidad.id_usuario != datos.id_usuario:
        raise HTTPException(
            status_code=400,
            detail="La incapacidad no pertenece al usuario indicado",
        )

    # Una incapacidad solo puede generar un acceso académico
    existente = (
        db.query(AccesoAcademico)
        .filter(
            AccesoAcademico.id_incapacidad
            == datos.id_incapacidad
        )
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=400,
            detail="Esta incapacidad ya tiene un acceso académico",
        )

    nuevo_acceso = AccesoAcademico(
        id_usuario=datos.id_usuario,
        id_incapacidad=datos.id_incapacidad,
        estado=datos.estado,
    )

    db.add(nuevo_acceso)
    db.commit()
    db.refresh(nuevo_acceso)

    return nuevo_acceso


# GET /accesos
@router.get(
    "",
    response_model=list[AccesoAcademicoResponse],
)
def listar_accesos(
    db: Session = Depends(get_db),
):
    return db.query(AccesoAcademico).all()


# GET /accesos/{id_acceso}
@router.get(
    "/{id_acceso}",
    response_model=AccesoAcademicoResponse,
)
def obtener_acceso(
    id_acceso: int,
    db: Session = Depends(get_db),
):
    acceso = (
        db.query(AccesoAcademico)
        .filter(
            AccesoAcademico.id_acceso == id_acceso
        )
        .first()
    )

    if not acceso:
        raise HTTPException(
            status_code=404,
            detail="Acceso académico no encontrado",
        )

    return acceso


# PUT /accesos/{id_acceso}/estado
@router.put(
    "/{id_acceso}/estado",
    response_model=AccesoAcademicoResponse,
)
def cambiar_estado_acceso(
    id_acceso: int,
    estado: EstadoAcceso,
    db: Session = Depends(get_db),
):
    acceso = (
        db.query(AccesoAcademico)
        .filter(
            AccesoAcademico.id_acceso == id_acceso
        )
        .first()
    )

    if not acceso:
        raise HTTPException(
            status_code=404,
            detail="Acceso académico no encontrado",
        )

    acceso.estado = estado

    db.commit()
    db.refresh(acceso)

    return acceso