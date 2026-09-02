from datetime import datetime
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.conection import SessionLocal
from app.models.incapacidad import Incapacidad
from app.models.historial_incapacidad import HistorialIncapacidad
from app.models.Usuarios import Usuario
from app.schemas.incapacidad import (
    IncapacidadCreate,
    IncapacidadUpdate,
    IncapacidadResponse,
    IncapacidadDetalleResponse,
)
from app.schemas.base import APIResponse


router = APIRouter(
    prefix="/incapacidades",
    tags=["Incapacidades"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=APIResponse[IncapacidadResponse],
    status_code=status.HTTP_201_CREATED,
)
def crear_incapacidad(
    datos: IncapacidadCreate,
    db: Session = Depends(get_db),
):
    usuario = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == datos.id_usuario)
        .first()
    )
    if not usuario:
        raise HTTPException(
            status_code=404, detail="Usuario no encontrado"
        )

    if usuario.tipo_de_usuario != "estudiante":
        raise HTTPException(
            status_code=400,
            detail="La incapacidad solamente puede pertenecer a un estudiante",
        )

    existente = (
        db.query(Incapacidad)
        .filter(Incapacidad.numero_radicado == datos.numero_radicado)
        .first()
    )
    if existente:
        raise HTTPException(
            status_code=400, detail="El número de radicado ya existe"
        )

    if datos.fecha_fin < datos.fecha_inicio:
        raise HTTPException(
            status_code=400,
            detail="La fecha de fin no puede ser anterior a la fecha de inicio",
        )

    nueva_incapacidad = Incapacidad(
        numero_radicado=datos.numero_radicado,
        fecha_inicio=datos.fecha_inicio,
        fecha_fin=datos.fecha_fin,
        archivo=datos.archivo,
        motivo=datos.motivo,
        estado="pendiente",
        id_usuario=datos.id_usuario,
    )

    db.add(nueva_incapacidad)
    db.commit()
    db.refresh(nueva_incapacidad)

    return APIResponse(
        success=True,
        mensaje="Incapacidad radicada exitosamente",
        data=nueva_incapacidad,
    )


@router.get(
    "",
    response_model=APIResponse[list[IncapacidadDetalleResponse]],
)
def listar_incapacidades(
    db: Session = Depends(get_db),
):
    incapacidades = (
        db.query(Incapacidad)
        .options(joinedload(Incapacidad.apelacion))
        .all()
    )
    return APIResponse(
        success=True,
        mensaje="Incapacidades con información de apelación listadas correctamente",
        data=incapacidades,
    )


@router.get(
    "/{id_incapacidad}",
    response_model=APIResponse[IncapacidadDetalleResponse],
)
def obtener_incapacidad(
    id_incapacidad: int,
    db: Session = Depends(get_db),
):
    incapacidad = (
        db.query(Incapacidad)
        .options(joinedload(Incapacidad.apelacion))
        .filter(Incapacidad.id_incapacidad == id_incapacidad)
        .first()
    )
    if not incapacidad:
        raise HTTPException(
            status_code=404, detail="Incapacidad no encontrada"
        )

    return APIResponse(
        success=True,
        mensaje="Incapacidad encontrada exitosamente",
        data=incapacidad,
    )


@router.put(
    "/{id_incapacidad}",
    response_model=APIResponse[IncapacidadResponse],
)
def actualizar_incapacidad(
    id_incapacidad: int,
    datos: IncapacidadUpdate,
    db: Session = Depends(get_db),
):
    incapacidad = (
        db.query(Incapacidad)
        .filter(Incapacidad.id_incapacidad == id_incapacidad)
        .first()
    )
    if not incapacidad:
        raise HTTPException(
            status_code=404, detail="Incapacidad no encontrada"
        )

    usuario_cambio = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == datos.id_usuario_cambio)
        .first()
    )
    if not usuario_cambio:
        raise HTTPException(
            status_code=404,
            detail="Usuario que realiza el cambio no encontrado",
        )

    fecha_anterior_inicio = incapacidad.fecha_inicio
    fecha_anterior_fin = incapacidad.fecha_fin

    incapacidad.fecha_inicio = datos.fecha_inicio
    incapacidad.fecha_fin = datos.fecha_fin
    incapacidad.archivo = datos.archivo
    incapacidad.motivo = datos.motivo
    incapacidad.estado = datos.estado

    nuevo_historial = HistorialIncapacidad(
        id_incapacidad=incapacidad.id_incapacidad,
        fecha_anterior_inicio=fecha_anterior_inicio,
        fecha_anterior_fin=fecha_anterior_fin,
        fecha_nueva_inicio=datos.fecha_inicio,
        fecha_nueva_fin=datos.fecha_fin,
        motivo_cambio=datos.motivo_cambio,
        fecha_cambio=datetime.now(),
        id_usuario_cambio=datos.id_usuario_cambio,
    )

    db.add(nuevo_historial)
    db.commit()
    db.refresh(incapacidad)

    return APIResponse(
        success=True,
        mensaje="Incapacidad actualizada y cambio registrado en el historial",
        data=incapacidad,
    )


@router.put(
    "/{id_incapacidad}/estado",
    response_model=APIResponse[IncapacidadResponse],
)
def cambiar_estado_incapacidad(
    id_incapacidad: int,
    estado: str,
    db: Session = Depends(get_db),
):
    incapacidad = (
        db.query(Incapacidad)
        .filter(Incapacidad.id_incapacidad == id_incapacidad)
        .first()
    )
    if not incapacidad:
        raise HTTPException(
            status_code=404, detail="Incapacidad no encontrada"
        )

    estados_validos = {"pendiente", "aprobada", "rechazada", "finalizada"}
    if estado not in estados_validos:
        raise HTTPException(
            status_code=400,
            detail="Estado inválido. Estados permitidos: pendiente, aprobada, rechazada, finalizada",
        )

    incapacidad.estado = estado
    db.commit()
    db.refresh(incapacidad)

    return APIResponse(
        success=True,
        mensaje=f"Estado de la incapacidad cambiado a {estado} exitosamente",
        data=incapacidad,
    )