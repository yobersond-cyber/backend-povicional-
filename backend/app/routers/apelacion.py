
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.conection import get_db
from app.dependencias.auth import get_current_user, require_role
from app.models.apelacion import Apelacion
from app.models.incapacidad import Incapacidad
from app.models.Usuarios import Usuario
from app.schemas.apelacion import (
    ApelacionCreate,
    ApelacionResponse,
    EstadoApelacion,
)
from app.schemas.base import APIResponse


router = APIRouter(
    prefix="/apelaciones",
    tags=["Apelaciones"],
)

ESTADOS_APELACION = {
    "pendiente",
    "aprobada",
    "rechazada",
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


def obtener_apelacion(
    db: Session,
    id_apelacion: int,
) -> Apelacion:
    apelacion = (
        db.query(Apelacion)
        .options(joinedload(Apelacion.incapacidad))
        .filter(Apelacion.id_apelacion == id_apelacion)
        .first()
    )

    if apelacion is None:
        raise HTTPException(
            status_code=404,
            detail="Apelación no encontrada",
        )

    return apelacion


def validar_revisor(
    db: Session,
    id_revisor: int | None,
    id_colegio: int,
) -> None:
    if id_revisor is None:
        return

    revisor = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == id_revisor,
            Usuario.id_colegio == id_colegio,
            Usuario.tipo_de_usuario.in_(["coordinador", "docente"]),
        )
        .first()
    )

    if revisor is None:
        raise HTTPException(
            status_code=400,
            detail=(
                "El revisor debe ser un coordinador o docente "
                "del mismo colegio"
            ),
        )


def validar_estado(estado) -> str:
    valor = estado.value if isinstance(estado, EstadoApelacion) else estado

    if valor not in ESTADOS_APELACION:
        raise HTTPException(
            status_code=400,
            detail="Estado de apelación inválido",
        )

    return valor


def verificar_acceso_apelacion(
    apelacion: Apelacion,
    current_user: Usuario,
) -> None:
    rol = current_user.tipo_de_usuario

    if rol == "estudiante":
        if apelacion.incapacidad.id_usuario != current_user.id_usuario:
            raise HTTPException(
                status_code=403,
                detail="Solo puedes acceder a apelaciones de tus incapacidades",
            )
        return

    if rol == "coordinador":
        if (
            current_user.id_colegio is None
            or apelacion.incapacidad.usuario.id_colegio
            != current_user.id_colegio
        ):
            raise HTTPException(
                status_code=404,
                detail="Apelación no encontrada en tu colegio",
            )
        return

    raise HTTPException(
        status_code=403,
        detail="No tienes permisos para acceder a esta apelación",
    )


@router.post(
    "",
    response_model=APIResponse[ApelacionResponse],
    status_code=status.HTTP_201_CREATED,
)
def crear_apelacion(
    datos: ApelacionCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("estudiante")),
):
    incapacidad = (
        db.query(Incapacidad)
        .filter(
            Incapacidad.id_incapacidad == datos.id_incapacidad,
            Incapacidad.id_usuario == current_user.id_usuario,
        )
        .first()
    )

    if incapacidad is None:
        raise HTTPException(
            status_code=404,
            detail="No se encontró una incapacidad propia para apelar",
        )

    apelacion_existente = (
        db.query(Apelacion)
        .filter(Apelacion.id_incapacidad == datos.id_incapacidad)
        .first()
    )

    if apelacion_existente:
        raise HTTPException(
            status_code=409,
            detail="Esta incapacidad ya tiene una apelación",
        )

    # El estudiante no puede asignar el revisor ni decidir el resultado.
    nueva_apelacion = Apelacion(
        id_incapacidad=incapacidad.id_incapacidad,
        fecha_apelacion=datos.fecha_apelacion,
        motivo=datos.motivo,
        respuesta=None,
        estado="pendiente",
        id_revisor=None,
    )

    try:
        db.add(nueva_apelacion)
        db.commit()
        db.refresh(nueva_apelacion)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo registrar la apelación",
        )

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
    current_user: Usuario = Depends(require_role("coordinador")),
):
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=403,
            detail="El coordinador no tiene un colegio asignado",
        )

    apelaciones = (
        db.query(Apelacion)
        .join(
            Incapacidad,
            Apelacion.id_incapacidad == Incapacidad.id_incapacidad,
        )
        .join(
            Usuario,
            Incapacidad.id_usuario == Usuario.id_usuario,
        )
        .options(joinedload(Apelacion.incapacidad))
        .filter(Usuario.id_colegio == current_user.id_colegio)
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Apelaciones de tu colegio recuperadas correctamente",
        data=apelaciones,
    )


@router.get(
    "/{id_apelacion}",
    response_model=APIResponse[ApelacionResponse],
)
def obtener_apelacion_por_id(
    id_apelacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    apelacion = obtener_apelacion(db, id_apelacion)
    verificar_acceso_apelacion(apelacion, current_user)

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
    current_user: Usuario = Depends(require_role("coordinador")),
):
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=403,
            detail="El coordinador no tiene un colegio asignado",
        )

    apelacion = obtener_apelacion(db, id_apelacion)

    verificar_acceso_apelacion(apelacion, current_user)

    incapacidad_destino = obtener_incapacidad_del_colegio(
        db,
        datos.id_incapacidad,
        current_user.id_colegio,
    )

    if apelacion.id_incapacidad != incapacidad_destino.id_incapacidad:
        otra_apelacion = (
            db.query(Apelacion)
            .filter(
                Apelacion.id_incapacidad == incapacidad_destino.id_incapacidad,
                Apelacion.id_apelacion != id_apelacion,
            )
            .first()
        )

        if otra_apelacion:
            raise HTTPException(
                status_code=409,
                detail="La incapacidad indicada ya tiene otra apelación",
            )

    validar_revisor(
        db,
        datos.id_revisor,
        current_user.id_colegio,
    )
    estado = validar_estado(datos.estado)

    try:
        apelacion.id_incapacidad = incapacidad_destino.id_incapacidad
        apelacion.fecha_apelacion = datos.fecha_apelacion
        apelacion.motivo = datos.motivo
        apelacion.respuesta = datos.respuesta
        apelacion.estado = estado
        apelacion.id_revisor = datos.id_revisor

        db.commit()
        db.refresh(apelacion)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo actualizar la apelación",
        )

    return APIResponse(
        success=True,
        mensaje="Apelación actualizada correctamente",
        data=apelacion,
    )
