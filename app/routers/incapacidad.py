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

from app.dependencias.auth import (
    get_current_user,
    require_role,
)


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


# ============================================================
# POST /incapacidades
# Registrar una incapacidad
#
# Solo estudiante
# El estudiante solamente puede registrar su propia incapacidad.
# ============================================================

@router.post(
    "",
    response_model=APIResponse[IncapacidadResponse],
    status_code=status.HTTP_201_CREATED,
)
def crear_incapacidad(
    datos: IncapacidadCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(
        require_role("estudiante")
    ),
):
    # Verificar que las fechas sean válidas
    if datos.fecha_fin < datos.fecha_inicio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de fin no puede ser anterior a la fecha de inicio",
        )

    # El usuario autenticado es el dueño de la incapacidad.
    # No confiamos en el id_usuario enviado por el cliente.
    id_usuario = current_user.id_usuario

    # Verificar que el número de radicado no exista
    existente = (
        db.query(Incapacidad)
        .filter(
            Incapacidad.numero_radicado
            == datos.numero_radicado
        )
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El número de radicado ya existe",
        )

    nueva_incapacidad = Incapacidad(
        numero_radicado=datos.numero_radicado,
        fecha_inicio=datos.fecha_inicio,
        fecha_fin=datos.fecha_fin,
        archivo=datos.archivo,
        motivo=datos.motivo,
        estado="pendiente",
        id_usuario=id_usuario,
    )

    db.add(nueva_incapacidad)
    db.commit()
    db.refresh(nueva_incapacidad)

    return APIResponse(
        success=True,
        mensaje="Incapacidad radicada exitosamente",
        data=nueva_incapacidad,
    )


# ============================================================
# GET /incapacidades
# Listar incapacidades
#
# Solo coordinador.
# El coordinador puede consultar todas.
# ============================================================

@router.get(
    "",
    response_model=APIResponse[list[IncapacidadDetalleResponse]],
)
def listar_incapacidades(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
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


# ============================================================
# GET /incapacidades/{id_incapacidad}
#
# Coordinador: puede consultar cualquiera.
# Estudiante: solamente la suya.
# ============================================================

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
            Incapacidad.id_incapacidad
            == id_incapacidad
        )
        .first()
    )

    if not incapacidad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incapacidad no encontrada",
        )

    # Coordinador puede consultar cualquier incapacidad
    if current_user.tipo_de_usuario == "administrador":
        return APIResponse(
            success=True,
            mensaje="Incapacidad encontrada exitosamente",
            data=incapacidad,
        )

    # Estudiante solamente puede consultar la suya
    if (
        current_user.tipo_de_usuario == "estudiante"
        and incapacidad.id_usuario
        == current_user.id_usuario
    ):
        return APIResponse(
            success=True,
            mensaje="Incapacidad encontrada exitosamente",
            data=incapacidad,
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permisos para consultar esta incapacidad",
    )


# ============================================================
# PUT /incapacidades/{id_incapacidad}
#
# Actualizar una incapacidad.
# Solo coordinador.
#
# El usuario que realiza el cambio sale del JWT.
# ============================================================

@router.put(
    "/{id_incapacidad}",
    response_model=APIResponse[IncapacidadResponse],
)
def actualizar_incapacidad(
    id_incapacidad: int,
    datos: IncapacidadUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
):
    incapacidad = (
        db.query(Incapacidad)
        .filter(
            Incapacidad.id_incapacidad
            == id_incapacidad
        )
        .first()
    )

    if not incapacidad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incapacidad no encontrada",
        )

    # Validar fechas
    if datos.fecha_fin < datos.fecha_inicio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha de fin no puede ser anterior a la fecha de inicio",
        )

    # Validar estado
    estados_validos = {
        "pendiente",
        "aprobada",
        "rechazada",
        "finalizada",
    }

    if datos.estado not in estados_validos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Estado inválido. Estados permitidos: "
                "pendiente, aprobada, rechazada, finalizada"
            ),
        )

    fecha_anterior_inicio = incapacidad.fecha_inicio
    fecha_anterior_fin = incapacidad.fecha_fin

    # Actualizar información
    incapacidad.fecha_inicio = datos.fecha_inicio
    incapacidad.fecha_fin = datos.fecha_fin
    incapacidad.archivo = datos.archivo
    incapacidad.motivo = datos.motivo
    incapacidad.estado = datos.estado

    # Registrar historial del cambio
    nuevo_historial = HistorialIncapacidad(
        id_incapacidad=incapacidad.id_incapacidad,
        fecha_anterior_inicio=fecha_anterior_inicio,
        fecha_anterior_fin=fecha_anterior_fin,
        fecha_nueva_inicio=datos.fecha_inicio,
        fecha_nueva_fin=datos.fecha_fin,
        motivo_cambio=datos.motivo_cambio,
        fecha_cambio=datetime.now(),
        id_usuario_cambio=current_user.id_usuario,
    )

    db.add(nuevo_historial)

    db.commit()
    db.refresh(incapacidad)

    return APIResponse(
        success=True,
        mensaje="Incapacidad actualizada y cambio registrado en el historial",
        data=incapacidad,
    )


# ============================================================
# PUT /incapacidades/{id_incapacidad}/estado
#
# Cambiar estado.
# Solo coordinador.
# ============================================================

@router.put(
    "/{id_incapacidad}/estado",
    response_model=APIResponse[IncapacidadResponse],
)
def cambiar_estado_incapacidad(
    id_incapacidad: int,
    estado: str,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
):
    incapacidad = (
        db.query(Incapacidad)
        .filter(
            Incapacidad.id_incapacidad
            == id_incapacidad
        )
        .first()
    )

    if not incapacidad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incapacidad no encontrada",
        )

    estados_validos = {
        "pendiente",
        "aprobada",
        "rechazada",
        "finalizada",
    }

    if estado not in estados_validos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "Estado inválido. Estados permitidos: "
                "pendiente, aprobada, rechazada, finalizada"
            ),
        )

    incapacidad.estado = estado

    db.commit()
    db.refresh(incapacidad)

    return APIResponse(
        success=True,
        mensaje=(
            f"Estado de la incapacidad cambiado "
            f"a {estado} exitosamente"
        ),
        data=incapacidad,
    )