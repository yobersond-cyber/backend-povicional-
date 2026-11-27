
from datetime import date, datetime

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    status,
    Form,
    File,
    UploadFile,
)
from sqlalchemy.orm import Session, joinedload

from app.database.conection import get_db
from app.dependencias.auth import (
    get_current_user,
    require_role,
)

from app.models.Usuarios import Usuario
from app.models.incapacidad import Incapacidad
from app.models.historial_incapacidad import HistorialIncapacidad
from app.models.acceso_academico import AccesoAcademico

from app.schemas.incapacidad import (
    IncapacidadResponse,
    IncapacidadDetalleResponse,
)

from app.schemas.base import APIResponse

from app.services.notificaciones_service import notificar_usuario
from app.services.archivo_service import (
    subir_archivo,
    eliminar_archivo,
)


router = APIRouter(
    prefix="/incapacidades",
    tags=["Incapacidades"],
)


# ============================================================
# FUNCIONES AUXILIARES
# ============================================================

def obtener_incapacidad(
    db: Session,
    id_incapacidad: int,
) -> Incapacidad:
    incapacidad = (
        db.query(Incapacidad)
        .options(
            joinedload(Incapacidad.usuario),
            joinedload(Incapacidad.apelacion),
        )
        .filter(
            Incapacidad.id_incapacidad == id_incapacidad,
        )
        .first()
    )

    if incapacidad is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incapacidad no encontrada",
        )

    return incapacidad


def verificar_colegio(
    incapacidad: Incapacidad,
    coordinador: Usuario,
) -> None:
    if (
        coordinador.id_colegio is None
        or incapacidad.usuario.id_colegio != coordinador.id_colegio
    ):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incapacidad no encontrada en tu colegio",
        )


def sincronizar_acceso_academico(
    db: Session,
    incapacidad: Incapacidad,
) -> None:
    acceso = (
        db.query(AccesoAcademico)
        .filter(
            AccesoAcademico.id_incapacidad
            == incapacidad.id_incapacidad,
        )
        .first()
    )

    if incapacidad.estado in ("rechazada", "pendiente"):
        if acceso is not None:
            acceso.estado = "suspendido"
        return

    if incapacidad.estado == "finalizada":
        if acceso is not None:
            acceso.estado = "finalizado"
        return

    if incapacidad.estado == "aprobada":
        hoy = date.today()

        if incapacidad.fecha_fin < hoy:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "No se puede aprobar una incapacidad cuyo "
                    "periodo ya terminó"
                ),
            )

        if hoy < incapacidad.fecha_inicio:
            estado_acceso = "suspendido"
        else:
            estado_acceso = "activo"

        if acceso is None:
            acceso = AccesoAcademico(
                id_usuario=incapacidad.id_usuario,
                id_incapacidad=incapacidad.id_incapacidad,
                estado=estado_acceso,
            )
            db.add(acceso)
        else:
            acceso.id_usuario = incapacidad.id_usuario
            acceso.estado = estado_acceso


def validar_actualizacion_incapacidad(
    incapacidad: Incapacidad,
    fecha_inicio: date,
    fecha_fin: date,
    estado: str,
    observacion_revision: str | None,
) -> None:
    if incapacidad.estado == "finalizada":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="No se puede modificar una incapacidad finalizada",
        )

    estados_validos = (
        "pendiente",
        "aprobada",
        "rechazada",
        "finalizada",
    )

    if estado not in estados_validos:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El estado de la incapacidad no es válido",
        )

    if fecha_fin < fecha_inicio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La fecha de finalización no puede ser anterior "
                "a la fecha de inicio"
            ),
        )

    if estado in ("aprobada", "rechazada"):
        if (
            observacion_revision is None
            or not observacion_revision.strip()
        ):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=(
                    "Debes escribir una observación para "
                    "aprobar o rechazar la incapacidad"
                ),
            )


def crear_historial_incapacidad(
    incapacidad: Incapacidad,
    fecha_inicio: date,
    fecha_fin: date,
    motivo_cambio: str,
    id_usuario: int,
) -> HistorialIncapacidad:
    return HistorialIncapacidad(
        id_incapacidad=incapacidad.id_incapacidad,
        fecha_anterior_inicio=incapacidad.fecha_inicio,
        fecha_anterior_fin=incapacidad.fecha_fin,
        fecha_nueva_inicio=fecha_inicio,
        fecha_nueva_fin=fecha_fin,
        motivo_cambio=motivo_cambio,
        fecha_cambio=datetime.now(),
        id_usuario_cambio=id_usuario,
    )


def aplicar_actualizacion_incapacidad(
    incapacidad: Incapacidad,
    fecha_inicio: date,
    fecha_fin: date,
    motivo: str,
    estado: str,
    observacion_revision: str | None,
    coordinador: Usuario,
    archivo_subido: dict | None,
) -> None:
    incapacidad.fecha_inicio = fecha_inicio
    incapacidad.fecha_fin = fecha_fin
    incapacidad.motivo = motivo
    incapacidad.estado = estado

    if archivo_subido:
        incapacidad.archivo = archivo_subido["url"]
        incapacidad.archivo_public_id = archivo_subido["public_id"]
        incapacidad.archivo_resource_type = (
            archivo_subido["resource_type"]
        )

    if estado in ("aprobada", "rechazada"):
        incapacidad.id_coordinador_revisor = coordinador.id_usuario
        incapacidad.fecha_revision = datetime.now()
        incapacidad.observacion_revision = (
            observacion_revision.strip()
        )


def limpiar_archivo_subido(
    archivo_subido: dict | None,
) -> None:
    if archivo_subido:
        eliminar_archivo(
            archivo_subido["public_id"],
            archivo_subido["resource_type"],
        )


def notificar_resultado_revision(
    background_tasks: BackgroundTasks,
    incapacidad: Incapacidad,
    estado_anterior: str,
    estado_nuevo: str,
) -> None:
    if (
        estado_nuevo not in ("aprobada", "rechazada")
        or estado_anterior == estado_nuevo
    ):
        return

    estudiante = incapacidad.usuario

    if (
        estudiante is None
        or estudiante.tipo_de_usuario != "estudiante"
        or not estudiante.correo
    ):
        return

    resultado = (
        "aprobada"
        if estado_nuevo == "aprobada"
        else "rechazada"
    )

    background_tasks.add_task(
        notificar_usuario,
        destinatario=estudiante.correo,
        nombres_usuario=(
            f"{estudiante.nombres_compl} "
            f"{estudiante.apellidos_compl}"
        ),
        asunto=(
            f"Actualización de incapacidad - "
            f"{incapacidad.numero_radicado}"
        ),
        titulo=f"Tu incapacidad fue {resultado}",
        mensaje=(
            f"Te informamos que tu incapacidad con "
            f"número de radicado "
            f"{incapacidad.numero_radicado} "
            f"ha sido {resultado}."
        ),
        detalle=incapacidad.observacion_revision or "",
    )


# ============================================================
# NOTIFICAR A LOS COORDINADORES DE UNA NUEVA INCAPACIDAD
# ============================================================

def notificar_nueva_incapacidad_coordinadores(
    background_tasks: BackgroundTasks,
    db: Session,
    estudiante: Usuario,
    incapacidad: Incapacidad,
) -> None:

    if estudiante.id_colegio is None:
        return

    coordinadores = (
        db.query(Usuario)
        .filter(
            Usuario.id_colegio == estudiante.id_colegio,
            Usuario.tipo_de_usuario == "coordinador",
            Usuario.correo.isnot(None),
        )
        .all()
    )

    for coordinador in coordinadores:
        if not coordinador.correo or not coordinador.correo.strip():
            continue

        background_tasks.add_task(
            notificar_usuario,
            destinatario=coordinador.correo,
            nombres_usuario=(
                f"{coordinador.nombres_compl} "
                f"{coordinador.apellidos_compl}"
            ),
            asunto=(
                f"Nueva incapacidad recibida - "
                f"{incapacidad.numero_radicado}"
            ),
            titulo="Nueva incapacidad pendiente de revisión",
            mensaje=(
                f"El estudiante {estudiante.nombres_compl} "
                f"{estudiante.apellidos_compl} ha registrado "
                f"una nueva incapacidad en APRENZY. "
                f"Debes ingresar a la plataforma para revisar "
                f"la solicitud."
            ),
            detalle=(
                f"Número de radicado: {incapacidad.numero_radicado}\n"
                f"Estudiante: {estudiante.nombres_compl} "
                f"{estudiante.apellidos_compl}\n"
                f"Fecha de inicio: {incapacidad.fecha_inicio}\n"
                f"Fecha de finalización: {incapacidad.fecha_fin}\n"
                f"Estado: Pendiente de revisión"
            ),
        )


# ============================================================
# POST /incapacidades
# El estudiante registra una nueva incapacidad.
# El documento adjunto es obligatorio.
# ============================================================

@router.post(
    "",
    response_model=APIResponse[IncapacidadResponse],
    status_code=status.HTTP_201_CREATED,
)
async def crear_incapacidad(
    background_tasks: BackgroundTasks,
    numero_radicado: str = Form(...),
    fecha_inicio: date = Form(...),
    fecha_fin: date = Form(...),
    motivo: str = Form(...),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("estudiante")),
):
    numero_radicado = numero_radicado.strip()

    if not numero_radicado:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El número de radicado es obligatorio",
        )

    if fecha_fin < fecha_inicio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=(
                "La fecha de finalización no puede ser anterior "
                "a la fecha de inicio"
            ),
        )

    radicado_existente = (
        db.query(Incapacidad)
        .filter(
            Incapacidad.numero_radicado == numero_radicado,
        )
        .first()
    )

    if radicado_existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe una incapacidad con ese número de radicado",
        )

    archivo_subido = await subir_archivo(
        archivo,
        "incapacidades",
    )

    nueva_incapacidad = Incapacidad(
        numero_radicado=numero_radicado,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        archivo=archivo_subido["url"],
        archivo_public_id=archivo_subido["public_id"],
        archivo_resource_type=archivo_subido["resource_type"],
        motivo=motivo,
        estado="pendiente",
        id_usuario=current_user.id_usuario,
    )

    try:
        db.add(nueva_incapacidad)
        db.commit()
        db.refresh(nueva_incapacidad)

    except Exception:
        db.rollback()

        eliminar_archivo(
            archivo_subido["public_id"],
            archivo_subido["resource_type"],
        )

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo registrar la incapacidad",
        )

    notificar_nueva_incapacidad_coordinadores(
        background_tasks=background_tasks,
        db=db,
        estudiante=current_user,
        incapacidad=nueva_incapacidad,
    )

    return APIResponse(
        success=True,
        mensaje="Incapacidad registrada correctamente y pendiente de revisión",
        data=nueva_incapacidad,
    )


# ============================================================
# GET /incapacidades
# Listar incapacidades según el rol.
# ============================================================

@router.get(
    "",
    response_model=APIResponse[list[IncapacidadResponse]],
)
def listar_incapacidades(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    if current_user.tipo_de_usuario == "estudiante":
        incapacidades = (
            db.query(Incapacidad)
            .filter(
                Incapacidad.id_usuario == current_user.id_usuario,
            )
            .all()
        )

    elif current_user.tipo_de_usuario == "coordinador":
        if current_user.id_colegio is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El coordinador no tiene un colegio asignado",
            )

        incapacidades = (
            db.query(Incapacidad)
            .join(
                Usuario,
                Incapacidad.id_usuario == Usuario.id_usuario,
            )
            .filter(
                Usuario.id_colegio == current_user.id_colegio,
                Usuario.tipo_de_usuario == "estudiante",
            )
            .all()
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para consultar incapacidades",
        )

    return APIResponse(
        success=True,
        mensaje="Incapacidades recuperadas correctamente",
        data=incapacidades,
    )


# ============================================================
# GET /incapacidades/{id_incapacidad}
# Consultar una incapacidad concreta.
# ============================================================

@router.get(
    "/{id_incapacidad}",
    response_model=APIResponse[IncapacidadDetalleResponse],
)
def obtener_incapacidad_por_id(
    id_incapacidad: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    incapacidad = obtener_incapacidad(
        db,
        id_incapacidad,
    )

    if current_user.tipo_de_usuario == "estudiante":
        if incapacidad.id_usuario != current_user.id_usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Incapacidad no encontrada",
            )

    elif current_user.tipo_de_usuario == "coordinador":
        verificar_colegio(
            incapacidad,
            current_user,
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para consultar esta incapacidad",
        )

    return APIResponse(
        success=True,
        mensaje="Incapacidad encontrada",
        data=incapacidad,
    )


# ============================================================
# PUT /incapacidades/{id_incapacidad}
# El coordinador revisa y actualiza una incapacidad.
# El archivo nuevo es opcional.
# ============================================================


@router.put(
    "/{id_incapacidad}",
    response_model=APIResponse[IncapacidadResponse],
)
async def actualizar_incapacidad(
    id_incapacidad: int,
    background_tasks: BackgroundTasks,
    fecha_inicio: date = Form(...),
    fecha_fin: date = Form(...),
    motivo: str = Form(...),
    estado: str = Form(...),
    motivo_cambio: str = Form(...),
    observacion_revision: str | None = Form(default=None),
    archivo: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("coordinador")),
):
    incapacidad = obtener_incapacidad(
        db,
        id_incapacidad,
    )

    verificar_colegio(
        incapacidad,
        current_user,
    )

    validar_actualizacion_incapacidad(
        incapacidad,
        fecha_inicio,
        fecha_fin,
        estado,
        observacion_revision,
    )

    estado_anterior = incapacidad.estado

    archivo_anterior_public_id = incapacidad.archivo_public_id
    archivo_anterior_resource_type = incapacidad.archivo_resource_type

    archivo_subido = None

    if archivo is not None and archivo.filename:
        archivo_subido = await subir_archivo(
            archivo,
            "incapacidades",
        )

    historial = crear_historial_incapacidad(
        incapacidad=incapacidad,
        fecha_inicio=fecha_inicio,
        fecha_fin=fecha_fin,
        motivo_cambio=motivo_cambio,
        id_usuario=current_user.id_usuario,
    )

    try:
        aplicar_actualizacion_incapacidad(
            incapacidad=incapacidad,
            fecha_inicio=fecha_inicio,
            fecha_fin=fecha_fin,
            motivo=motivo,
            estado=estado,
            observacion_revision=observacion_revision,
            coordinador=current_user,
            archivo_subido=archivo_subido,
        )

        sincronizar_acceso_academico(
            db,
            incapacidad,
        )

        db.add(historial)
        db.commit()
        db.refresh(incapacidad)

    except HTTPException:
        db.rollback()
        limpiar_archivo_subido(archivo_subido)
        raise

    except Exception:
        db.rollback()
        limpiar_archivo_subido(archivo_subido)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo actualizar la incapacidad",
        )

    # Eliminar el documento anterior después del commit.
    if archivo_subido and archivo_anterior_public_id:
        eliminar_archivo(
            archivo_anterior_public_id,
            archivo_anterior_resource_type or "image",
        )

    notificar_resultado_revision(
        background_tasks=background_tasks,
        incapacidad=incapacidad,
        estado_anterior=estado_anterior,
        estado_nuevo=estado,
    )

    mensaje = (
        "Incapacidad aprobada y acceso académico gestionado automáticamente"
        if estado == "aprobada"
        else "Incapacidad actualizada y revisión registrada correctamente"
    )

    return APIResponse(
        success=True,
        mensaje=mensaje,
        data=incapacidad,
    )
