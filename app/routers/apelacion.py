from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import SessionLocal
from app.models.apelacion import Apelacion
from app.models.incapacidad import Incapacidad
from app.models.Usuarios import Usuario
from app.schemas.apelacion import (
    ApelacionCreate,
    ApelacionResponse,
)
from app.schemas.base import APIResponse


router = APIRouter(
    prefix="/apelaciones",
    tags=["Apelaciones"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=APIResponse[ApelacionResponse],
    status_code=status.HTTP_201_CREATED,
)
def crear_apelacion(
    datos: ApelacionCreate,
    db: Session = Depends(get_db),
):
    incapacidad = (
        db.query(Incapacidad)
        .filter(Incapacidad.id_incapacidad == datos.id_incapacidad)
        .first()
    )
    if not incapacidad:
        raise HTTPException(status_code=404, detail="Incapacidad no encontrada")

    apelacion_existente = (
        db.query(Apelacion)
        .filter(Apelacion.id_incapacidad == datos.id_incapacidad)
        .first()
    )
    if apelacion_existente:
        raise HTTPException(
            status_code=400,
            detail="Esta incapacidad ya tiene una apelación",
        )

    if datos.id_revisor is not None:
        revisor = (
            db.query(Usuario)
            .filter(Usuario.id_usuario == datos.id_revisor)
            .first()
        )
        if not revisor:
            raise HTTPException(
                status_code=404, detail="Usuario revisor no encontrado"
            )
        if revisor.tipo_de_usuario not in {"administrador", "docente"}:
            raise HTTPException(
                status_code=400,
                detail="El revisor debe ser administrador o docente",
            )

    nueva_apelacion = Apelacion(
        id_incapacidad=datos.id_incapacidad,
        fecha_apelacion=datos.fecha_apelacion,
        motivo=datos.motivo,
        respuesta=datos.respuesta,
        estado=datos.estado.value,
        id_revisor=datos.id_revisor,
    )

    db.add(nueva_apelacion)
    db.commit()
    db.refresh(nueva_apelacion)

    return APIResponse(
        success=True,
        mensaje="Apelación radicada exitosamente",
        data=nueva_apelacion,
    )


@router.get(
    "",
    response_model=APIResponse[list[ApelacionResponse]],
)
def listar_apelaciones(
    db: Session = Depends(get_db),
):
    apelaciones = db.query(Apelacion).all()
    return APIResponse(
        success=True,
        mensaje="Lista de apelaciones obtenida",
        data=apelaciones,
    )


@router.get(
    "/{id_apelacion}",
    response_model=APIResponse[ApelacionResponse],
)
def obtener_apelacion(
    id_apelacion: int,
    db: Session = Depends(get_db),
):
    apelacion = (
        db.query(Apelacion)
        .filter(Apelacion.id_apelacion == id_apelacion)
        .first()
    )
    if not apelacion:
        raise HTTPException(status_code=404, detail="Apelación no encontrada")

    return APIResponse(
        success=True,
        mensaje="Apelación encontrada",
        data=apelacion,
    )


@router.put(
    "/{id_apelacion}",
    response_model=APIResponse[ApelacionResponse],
)
def actualizar_apelacion(
    id_apelacion: int,
    datos: ApelacionCreate,
    db: Session = Depends(get_db),
):
    apelacion = (
        db.query(Apelacion)
        .filter(Apelacion.id_apelacion == id_apelacion)
        .first()
    )
    if not apelacion:
        raise HTTPException(status_code=404, detail="Apelación no encontrada")

    incapacidad = (
        db.query(Incapacidad)
        .filter(Incapacidad.id_incapacidad == datos.id_incapacidad)
        .first()
    )
    if not incapacidad:
        raise HTTPException(status_code=404, detail="Incapacidad no encontrada")

    if apelacion.id_incapacidad != datos.id_incapacidad:
        otra = (
            db.query(Apelacion)
            .filter(
                Apelacion.id_incapacidad == datos.id_incapacidad,
                Apelacion.id_apelacion != id_apelacion,
            )
            .first()
        )
        if otra:
            raise HTTPException(
                status_code=400,
                detail="La incapacidad indicada ya tiene una apelación",
            )

    if datos.id_revisor is not None:
        revisor = (
            db.query(Usuario)
            .filter(Usuario.id_usuario == datos.id_revisor)
            .first()
        )
        if not revisor or revisor.tipo_de_usuario not in {"administrador", "docente"}:
            raise HTTPException(
                status_code=400,
                detail="El revisor indicado no es válido o no existe",
            )

    apelacion.id_incapacidad = datos.id_incapacidad
    apelacion.fecha_apelacion = datos.fecha_apelacion
    apelacion.motivo = datos.motivo
    apelacion.respuesta = datos.respuesta
    apelacion.estado = datos.estado.value
    apelacion.id_revisor = datos.id_revisor

    db.commit()
    db.refresh(apelacion)

    return APIResponse(
        success=True,
        mensaje="Apelación actualizada correctamente",
        data=apelacion,
    )