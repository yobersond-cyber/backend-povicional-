
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.conection import get_db
from app.dependencias.auth import get_current_user, require_role
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

ESTADOS_VALIDOS = {
    "pendiente",
    "aprobada",
    "rechazada",
    "finalizada",
}


def obtener_incapacidad_del_colegio(
    db: Session,
    id_incapacidad: int,
    id_colegio: int,
) -> Incapacidad:
    incapacidad = (
        db.query(Incapacidad)
        .join(
            Usuario,
            Incapacidad.id_usuario == Usuario.id_usuario,
        )
        .options(joinedload(Incapacidad.apelacion))
        .filter(
            Incapacidad.id_incapacidad == id_incapacidad,
            Usuario.id_colegio == id_colegio,
        )
        .first()
    )

    if incapacidad is None:
        raise HTTPException(
            status_code=404,
            detail="Incapacidad no encontrada en tu colegio",
        )

    return incapacidad


def validar_fechas(fecha_inicio, fecha_fin):
    if fecha_fin < fecha_inicio:
        raise HTTPException(
            status_code=400,
            detail="La fecha de fin no puede ser anterior a la fecha de inicio",
        )


def validar_estado(estado: str):
    if estado not in ESTADOS_VALIDOS:
        raise HTTPException(
            status_code=400,
            detail=(
                "Estado inválido. Estados permitidos: "
                "pendiente, aprobada, rechazada, finalizada"
            ),
        )


def registrar_historial(
    db: Session,
    incapacidad: Incapacidad,
    usuario_cambio: Usuario,
    fecha_nueva_inicio,
    fecha_nueva_fin,
    motivo_cambio: str,
):
    historial = HistorialIncapacidad(
        id_incapacidad=incapacidad.id_incapacidad,
        fecha_anterior_inicio=incapacidad.fecha_inicio,
        fecha_anterior_fin=incapacidad.fecha_fin,
        fecha_nueva_inicio=fecha_nueva_inicio,
        fecha_nueva_fin=fecha_nueva_fin,
        motivo_cambio=motivo_cambio,
        fecha_cambio=datetime.now(),
        id_usuario_cambio=usuario_cambio.id_usuario,
    )
    db.add(historial)


@router.post(
    "",
    response_model=APIResponse[IncapacidadResponse],
    status_code=status.HTTP_201_CREATED,
)
def crear_incapacidad(
    datos: IncapacidadCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("estudiante")),
):
    validar_fechas(datos.fecha_inicio, datos.fecha_fin)

    existente = (
        db.query(Incapacidad)
        .filter(
            Incapacidad.numero_radicado == datos.numero_radicado
        )
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=409,
            detail="El número de radicado ya existe",
        )

    nueva_incapacidad = Incapacidad(
        numero_radicado=datos.numero_radicado,
        fecha_inicio=datos.fecha_inicio,
        fecha_fin=datos.fecha_fin,
        archivo=datos.archivo,
        motivo=datos.motivo,
        estado="pendiente",
        id_usuario=current_user.id_usuario,
    )

    try:
        db.add(nueva_incapacidad)
        db.commit()
        db.refresh(nueva_incapacidad)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo registrar la incapacidad",
        )

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
    current_user: Usuario = Depends(require_role("coordinador")),
):
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=403,
            detail="El coordinador no tiene un colegio asignado",
        )

    incapacidades = (
        db.query(Incapacidad)
        .join(
            Usuario,
            Incapacidad.id_usuario == Usuario.id_usuario,
        )
        .options(joinedload(Incapacidad.apelacion))
        .filter(Usuario.id_colegio == current_user.id_colegio)
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Incapacidades de tu colegio recuperadas correctamente",
        data=incapacidades,
    )


@router.get(
    "/{id_incapacidad}",
    response_model=APIResponse[IncapacidadDetalleResponse],
)
def obtener_incapacidad(
    id_incapacidad: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    incapacidad = (
        db.query(Incapacidad)
        .options(joinedload(Incapacidad.apelacion))
        .filter(
            Incapacidad.id_incapacidad == id_incapacidad
        )
        .first()
    )

    if incapacidad is None:
        raise HTTPException(
            status_code=404,
            detail="Incapacidad no encontrada",
        )

    rol = current_user.tipo_de_usuario

    if rol == "estudiante":
        if incapacidad.id_usuario != current_user.id_usuario:
            raise HTTPException(
                status_code=403,
                detail="Solo puedes consultar tus propias incapacidades",
            )

    elif rol == "coordinador":
        if current_user.id_colegio is None:
            raise HTTPException(
                status_code=403,
                detail="El coordinador no tiene un colegio asignado",
            )

        obtener_incapacidad_del_colegio(
            db,
            id_incapacidad,
            current_user.id_colegio,
        )

    else:
        raise HTTPException(
            status_code=403,
            detail="No tienes permisos para consultar esta incapacidad",
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
    current_user: Usuario = Depends(require_role("coordinador")),
):
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=403,
            detail="El coordinador no tiene un colegio asignado",
        )

    incapacidad = obtener_incapacidad_del_colegio(
        db,
        id_incapacidad,
        current_user.id_colegio,
    )

    validar_fechas(datos.fecha_inicio, datos.fecha_fin)
    validar_estado(datos.estado)

    radicado_duplicado = (
        db.query(Incapacidad)
        .filter(
            Incapacidad.numero_radicado == incapacidad.numero_radicado,
            Incapacidad.id_incapacidad != incapacidad.id_incapacidad,
        )
        .first()
    )
    if radicado_duplicado:
        raise HTTPException(
            status_code=409,
            detail="El número de radicado ya existe",
        )

    fecha_anterior_inicio = incapacidad.fecha_inicio
    fecha_anterior_fin = incapacidad.fecha_fin

    try:
        incapacidad.fecha_inicio = datos.fecha_inicio
        incapacidad.fecha_fin = datos.fecha_fin
        incapacidad.archivo = datos.archivo
        incapacidad.motivo = datos.motivo
        incapacidad.estado = datos.estado

        registrar_historial(
            db=db,
            incapacidad=incapacidad,
            usuario_cambio=current_user,
            fecha_nueva_inicio=datos.fecha_inicio,
            fecha_nueva_fin=datos.fecha_fin,
            motivo_cambio=datos.motivo_cambio,
        )

        db.commit()
        db.refresh(incapacidad)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo actualizar la incapacidad y su historial",
        )

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
    current_user: Usuario = Depends(require_role("coordinador")),
):
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=403,
            detail="El coordinador no tiene un colegio asignado",
        )

    incapacidad = obtener_incapacidad_del_colegio(
        db,
        id_incapacidad,
        current_user.id_colegio,
    )

    validar_estado(estado)

    try:
        incapacidad.estado = estado
        db.commit()
        db.refresh(incapacidad)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo cambiar el estado de la incapacidad",
        )

    return APIResponse(
        success=True,
        mensaje=f"Estado de la incapacidad cambiado a {estado}",
        data=incapacidad,
    )