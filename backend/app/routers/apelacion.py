
from datetime import date, datetime

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session, joinedload

from app.database.conection import get_db
from app.dependencias.auth import (
    get_current_user,
    obtener_rol_efectivo,
    require_role,
)
from app.models.apelacion import Apelacion
from app.models.incapacidad import Incapacidad
from app.models.Usuarios import Usuario
from app.models.acceso_academico import AccesoAcademico
from app.models.historial_incapacidad import HistorialIncapacidad
from app.schemas.apelacion import (
    ApelacionUpdate,
    ApelacionResponse,
    EstadoApelacion,
)
from app.schemas.base import APIResponse
from app.services.notificaciones_service import notificar_usuario
from app.services.archivo_service import (
    subir_archivo,
    eliminar_archivo,
)


router = APIRouter(
    prefix="/apelaciones",
    tags=["Apelaciones"],
)


# ============================================================
# FUNCIONES AUXILIARES
# ============================================================


def obtener_apelacion(
    db: Session,
    id_apelacion: int,
) -> Apelacion:
    apelacion = (
        db.query(Apelacion)
        .options(
            joinedload(Apelacion.incapacidad)
            .joinedload(Incapacidad.usuario)
        )
        .filter(
            Apelacion.id_apelacion == id_apelacion,
        )
        .first()
    )

    if apelacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Apelación no encontrada",
        )

    return apelacion


def buscar_incapacidad_por_radicado(
    db: Session,
    numero_radicado: str,
    id_usuario: int,
) -> Incapacidad:
    incapacidad = (
        db.query(Incapacidad)
        .filter(
            Incapacidad.numero_radicado == numero_radicado.strip(),
            Incapacidad.id_usuario == id_usuario,
        )
        .first()
    )

    if incapacidad is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró una incapacidad propia con ese número de radicado",
        )

    return incapacidad


def verificar_acceso_apelacion(
    apelacion: Apelacion,
    current_user: Usuario,
) -> None:
    rol = obtener_rol_efectivo(current_user)

    if rol == "estudiante":
        if apelacion.incapacidad.id_usuario != current_user.id_usuario:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Apelación no encontrada",
            )
        return

    if rol == "coordinador":
        if (
            current_user.id_colegio is None
            or apelacion.incapacidad.usuario.id_colegio
            != current_user.id_colegio
        ):
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Apelación no encontrada en tu colegio",
            )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permisos para acceder a esta apelación",
    )


def sincronizar_acceso_academico(
    db: Session,
    incapacidad: Incapacidad,
) -> None:
    """
    Crea o actualiza el acceso académico de la incapacidad
    cuando una apelación es aprobada.
    """
    hoy = date.today()

    if incapacidad.fecha_fin < hoy:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No se puede conceder acceso académico porque "
                "el periodo de la incapacidad ya terminó"
            ),
        )

    acceso = (
        db.query(AccesoAcademico)
        .filter(
            AccesoAcademico.id_incapacidad
            == incapacidad.id_incapacidad,
        )
        .first()
    )

    estado_acceso = (
        "suspendido"
        if hoy < incapacidad.fecha_inicio
        else "activo"
    )

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


# ============================================================
# NOTIFICAR A LOS COORDINADORES DE UNA NUEVA APELACIÓN
# ============================================================


def notificar_nueva_apelacion_coordinadores(
    background_tasks: BackgroundTasks,
    db: Session,
    estudiante: Usuario,
    incapacidad: Incapacidad,
) -> None:
    """
    Notifica a los coordinadores del colegio del estudiante
    cuando se registra una nueva apelación.
    """
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
                f"Nueva apelación pendiente - "
                f"{incapacidad.numero_radicado}"
            ),
            titulo="Nueva apelación pendiente de revisión",
            mensaje=(
                f"El estudiante {estudiante.nombres_compl} "
                f"{estudiante.apellidos_compl} ha presentado "
                f"una apelación sobre una incapacidad rechazada. "
                f"Debes ingresar a APRENZY para revisar "
                f"la apelación."
            ),
            detalle=(
                f"Número de radicado: {incapacidad.numero_radicado}\n"
                f"Estudiante: {estudiante.nombres_compl} "
                f"{estudiante.apellidos_compl}\n"
                f"Fecha de incapacidad: "
                f"{incapacidad.fecha_inicio} a "
                f"{incapacidad.fecha_fin}\n"
                f"Estado de la apelación: Pendiente de revisión"
            ),
        )


# ============================================================
# FUNCIONES AUXILIARES PARA CREAR APELACIONES
# ============================================================


def validar_datos_nueva_apelacion(
    numero_radicado: str,
    motivo: str,
) -> None:
    if not numero_radicado.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El número de radicado es obligatorio",
        )

    if len(numero_radicado.strip()) > 30:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El número de radicado no puede superar 30 caracteres",
        )

    if not motivo.strip():
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="El motivo de la apelación es obligatorio",
        )


def verificar_incapacidad_apelable(
    db: Session,
    incapacidad: Incapacidad,
) -> None:
    if incapacidad.estado != "rechazada":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Solo puedes apelar una incapacidad que haya sido rechazada",
        )

    apelacion_existente = (
        db.query(Apelacion)
        .filter(
            Apelacion.id_incapacidad == incapacidad.id_incapacidad,
        )
        .first()
    )

    if apelacion_existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta incapacidad ya tiene una apelación registrada",
        )


def eliminar_archivo_subido_si_existe(
    archivo_subido: dict | None,
) -> None:
    if archivo_subido:
        eliminar_archivo(
            archivo_subido["public_id"],
            archivo_subido["resource_type"],
        )


async def guardar_nueva_apelacion(
    db: Session,
    incapacidad: Incapacidad,
    motivo: str,
    archivo: UploadFile | None,
) -> Apelacion:
    archivo_subido = None

    try:
        if archivo is not None:
            archivo_subido = await subir_archivo(
                archivo,
                "apelaciones",
            )

        nueva_apelacion = Apelacion(
            id_incapacidad=incapacidad.id_incapacidad,
            fecha_apelacion=datetime.now(),
            motivo=motivo.strip(),
            archivo=archivo_subido["url"] if archivo_subido else None,
            archivo_public_id=(
                archivo_subido["public_id"] if archivo_subido else None
            ),
            archivo_resource_type=(
                archivo_subido["resource_type"] if archivo_subido else None
            ),
            respuesta=None,
            estado="pendiente",
            id_revisor=None,
        )

        db.add(nueva_apelacion)
        db.commit()
        db.refresh(nueva_apelacion)

        return nueva_apelacion

    except HTTPException:
        db.rollback()
        eliminar_archivo_subido_si_existe(archivo_subido)
        raise

    except Exception as exc:
        db.rollback()
        eliminar_archivo_subido_si_existe(archivo_subido)

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo registrar la apelación",
        ) from exc


# ============================================================
# POST /apelaciones
# El estudiante registra una apelación.
# ============================================================


@router.post(
    "",
    response_model=APIResponse[ApelacionResponse],
    status_code=status.HTTP_201_CREATED,
)
async def crear_apelacion(
    background_tasks: BackgroundTasks,
    numero_radicado: str = Form(...),
    motivo: str = Form(...),
    archivo: UploadFile | None = File(None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("estudiante")),
):
    validar_datos_nueva_apelacion(
        numero_radicado,
        motivo,
    )

    incapacidad = buscar_incapacidad_por_radicado(
        db,
        numero_radicado,
        current_user.id_usuario,
    )

    verificar_incapacidad_apelable(
        db,
        incapacidad,
    )

    nueva_apelacion = await guardar_nueva_apelacion(
        db,
        incapacidad,
        motivo,
        archivo,
    )

    notificar_nueva_apelacion_coordinadores(
        background_tasks=background_tasks,
        db=db,
        estudiante=current_user,
        incapacidad=incapacidad,
    )

    return APIResponse(
        success=True,
        mensaje="Apelación radicada exitosamente",
        data=nueva_apelacion,
    )


# ============================================================
# GET /apelaciones
# Listar apelaciones según el rol.
# ============================================================


@router.get(
    "",
    response_model=APIResponse[list[ApelacionResponse]],
)
def listar_apelaciones(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    rol = obtener_rol_efectivo(current_user)

    consulta = (
        db.query(Apelacion)
        .join(
            Incapacidad,
            Apelacion.id_incapacidad == Incapacidad.id_incapacidad,
        )
        .join(
            Usuario,
            Incapacidad.id_usuario == Usuario.id_usuario,
        )
        .options(
            joinedload(Apelacion.incapacidad)
            .joinedload(Incapacidad.usuario)
        )
    )

    if rol == "coordinador":
        if current_user.id_colegio is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El coordinador no tiene un colegio asignado",
            )

        apelaciones = (
            consulta
            .filter(
                Usuario.id_colegio == current_user.id_colegio,
            )
            .all()
        )

    elif rol == "estudiante":
        apelaciones = (
            consulta
            .filter(
                Incapacidad.id_usuario == current_user.id_usuario,
            )
            .all()
        )

    else:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para consultar apelaciones",
        )

    return APIResponse(
        success=True,
        mensaje="Apelaciones recuperadas correctamente",
        data=apelaciones,
    )


# ============================================================
# GET /apelaciones/{id_apelacion}
# Consultar una apelación concreta.
# ============================================================


@router.get(
    "/{id_apelacion}",
    response_model=APIResponse[ApelacionResponse],
)
def obtener_apelacion_por_id(
    id_apelacion: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    apelacion = obtener_apelacion(
        db,
        id_apelacion,
    )

    verificar_acceso_apelacion(
        apelacion,
        current_user,
    )

    return APIResponse(
        success=True,
        mensaje="Apelación encontrada",
        data=apelacion,
    )


# ============================================================
# FUNCIONES AUXILIARES PARA ACTUALIZAR APELACIONES
# ============================================================


def validar_revision_apelacion(
    apelacion: Apelacion,
    incapacidad: Incapacidad,
) -> None:
    if apelacion.estado != "pendiente":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta apelación ya fue revisada",
        )

    if incapacidad.estado != "rechazada":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="La incapacidad ya no se encuentra en estado rechazado",
        )


def obtener_estado_apelacion(
    datos: ApelacionUpdate,
) -> str:
    return (
        datos.estado.value
        if isinstance(datos.estado, EstadoApelacion)
        else datos.estado
    )


def aprobar_incapacidad_por_apelacion(
    db: Session,
    incapacidad: Incapacidad,
    datos: ApelacionUpdate,
    current_user: Usuario,
) -> None:
    fecha_revision = datetime.now()

    historial = HistorialIncapacidad(
        id_incapacidad=incapacidad.id_incapacidad,
        fecha_anterior_inicio=incapacidad.fecha_inicio,
        fecha_anterior_fin=incapacidad.fecha_fin,
        fecha_nueva_inicio=incapacidad.fecha_inicio,
        fecha_nueva_fin=incapacidad.fecha_fin,
        motivo_cambio=(
            "Incapacidad aprobada mediante apelación. "
            + (
                datos.respuesta.strip()
                if datos.respuesta
                else "El coordinador aprobó la apelación."
            )
        ),
        fecha_cambio=fecha_revision,
        id_usuario_cambio=current_user.id_usuario,
    )

    incapacidad.estado = "aprobada"
    incapacidad.id_coordinador_revisor = current_user.id_usuario
    incapacidad.fecha_revision = fecha_revision
    incapacidad.observacion_revision = datos.respuesta

    sincronizar_acceso_academico(
        db,
        incapacidad,
    )

    db.add(historial)


def guardar_revision_apelacion(
    db: Session,
    apelacion: Apelacion,
) -> None:
    try:
        db.commit()
        db.refresh(apelacion)

    except HTTPException:
        db.rollback()
        raise

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo actualizar la apelación",
        ) from exc


def notificar_resultado_apelacion(
    background_tasks: BackgroundTasks,
    incapacidad: Incapacidad,
    datos: ApelacionUpdate,
    estado: str,
) -> None:
    estudiante = incapacidad.usuario

    if (
        estudiante is None
        or estudiante.tipo_de_usuario != "estudiante"
        or not estudiante.correo
    ):
        return

    resultado = "aprobada" if estado == "aprobada" else "rechazada"

    mensaje = (
        f"Tu apelación correspondiente a la incapacidad "
        f"con número de radicado "
        f"{incapacidad.numero_radicado} ha sido {resultado}."
    )

    if estado == "aprobada":
        mensaje += (
            " Tu incapacidad también ha sido aprobada. "
            "El acceso académico fue gestionado según "
            "las fechas de la incapacidad."
        )

    background_tasks.add_task(
        notificar_usuario,
        destinatario=estudiante.correo,
        nombres_usuario=(
            f"{estudiante.nombres_compl} "
            f"{estudiante.apellidos_compl}"
        ),
        asunto=(
            f"Resultado de apelación - "
            f"{incapacidad.numero_radicado}"
        ),
        titulo=f"Tu apelación fue {resultado}",
        mensaje=mensaje,
        detalle=(
            datos.respuesta.strip()
            if datos.respuesta
            else "El coordinador no agregó observaciones."
        ),
    )


def obtener_mensaje_revision(estado: str) -> str:
    if estado == "aprobada":
        return (
            "Apelación aprobada. La incapacidad fue aprobada "
            "y el acceso académico fue gestionado."
        )

    return "Apelación rechazada correctamente"


# ============================================================
# PUT /apelaciones/{id_apelacion}
# El coordinador revisa y actualiza una apelación.
# ============================================================


@router.put(
    "/{id_apelacion}",
    response_model=APIResponse[ApelacionResponse],
)
def actualizar_apelacion(
    id_apelacion: int,
    datos: ApelacionUpdate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("coordinador")),
):
    apelacion = obtener_apelacion(
        db,
        id_apelacion,
    )

    verificar_acceso_apelacion(
        apelacion,
        current_user,
    )

    incapacidad = apelacion.incapacidad

    validar_revision_apelacion(
        apelacion,
        incapacidad,
    )

    estado = obtener_estado_apelacion(datos)

    apelacion.respuesta = datos.respuesta
    apelacion.estado = estado
    apelacion.id_revisor = current_user.id_usuario

    try:
        if estado == "aprobada":
            aprobar_incapacidad_por_apelacion(
                db,
                incapacidad,
                datos,
                current_user,
            )

        guardar_revision_apelacion(
            db,
            apelacion,
        )

    except HTTPException:
        db.rollback()
        raise

    notificar_resultado_apelacion(
        background_tasks,
        incapacidad,
        datos,
        estado,
    )

    return APIResponse(
        success=True,
        mensaje=obtener_mensaje_revision(estado),
        data=apelacion,
    )
