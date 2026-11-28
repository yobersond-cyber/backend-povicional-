
from datetime import date

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.conection import get_db
from app.dependencias.auth import (
    get_current_user,
    require_role,
    obtener_rol_efectivo,
)

from app.models.acceso_academico import AccesoAcademico
from app.models.incapacidad import Incapacidad
from app.models.Usuarios import Usuario

from app.schemas.acceso_academico import (
    AccesoAcademicoCreate,
    AccesoAcademicoResponse,
)


router = APIRouter(
    prefix="/accesos",
    tags=["Acceso Académico"],
)


# ============================================================
# FUNCIONES AUXILIARES
# ============================================================


def obtener_acceso_del_colegio(
    db: Session,
    id_acceso: int,
    id_colegio: int,
) -> AccesoAcademico:
    acceso = (
        db.query(AccesoAcademico)
        .join(
            Usuario,
            AccesoAcademico.id_usuario == Usuario.id_usuario,
        )
        .options(
            joinedload(AccesoAcademico.usuario),
            joinedload(AccesoAcademico.incapacidad),
        )
        .filter(
            AccesoAcademico.id_acceso == id_acceso,
            Usuario.id_colegio == id_colegio,
        )
        .first()
    )

    if acceso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Acceso académico no encontrado en tu colegio",
        )

    return acceso


def validar_colegio_coordinador(
    current_user: Usuario,
) -> int:
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El coordinador no tiene un colegio asignado",
        )

    return current_user.id_colegio


def obtener_incapacidad_por_radicado(
    db: Session,
    numero_radicado: str,
) -> Incapacidad:
    incapacidad = (
        db.query(Incapacidad)
        .options(
            joinedload(Incapacidad.usuario),
        )
        .filter(
            Incapacidad.numero_radicado == numero_radicado.strip(),
        )
        .first()
    )

    if incapacidad is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró una incapacidad con ese número de radicado",
        )

    return incapacidad


def validar_estudiante_incapacidad(
    incapacidad: Incapacidad,
    id_colegio: int,
) -> Usuario:
    estudiante = incapacidad.usuario

    if (
        estudiante is None
        or estudiante.tipo_de_usuario != "estudiante"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La incapacidad no pertenece a un estudiante",
        )

    if estudiante.id_colegio != id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes gestionar estudiantes de otro colegio",
        )

    return estudiante


def validar_incapacidad_aprobada(
    incapacidad: Incapacidad,
) -> None:
    if incapacidad.estado != "aprobada":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede crear un acceso para una incapacidad aprobada",
        )


def validar_incapacidad_no_vencida(
    incapacidad: Incapacidad,
) -> None:
    if incapacidad.fecha_fin < date.today():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede crear un acceso para una incapacidad vencida",
        )


def verificar_acceso_existente(
    db: Session,
    id_incapacidad: int,
) -> None:
    existente = (
        db.query(AccesoAcademico)
        .filter(
            AccesoAcademico.id_incapacidad == id_incapacidad,
        )
        .first()
    )

    if existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta incapacidad ya tiene un acceso académico",
        )


def determinar_estado_acceso(
    incapacidad: Incapacidad,
) -> str:
    if date.today() < incapacidad.fecha_inicio:
        return "suspendido"

    return "activo"


def guardar_nuevo_acceso(
    db: Session,
    estudiante: Usuario,
    incapacidad: Incapacidad,
) -> AccesoAcademico:
    nuevo_acceso = AccesoAcademico(
        id_usuario=estudiante.id_usuario,
        id_incapacidad=incapacidad.id_incapacidad,
        estado=determinar_estado_acceso(incapacidad),
    )

    try:
        db.add(nuevo_acceso)
        db.commit()
        db.refresh(nuevo_acceso)

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear el acceso académico",
        ) from exc

    return nuevo_acceso


# ============================================================
# POST /accesos
# Crear acceso académico.
# ============================================================


@router.post(
    "",
    response_model=AccesoAcademicoResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_acceso(
    datos: AccesoAcademicoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("coordinador")),
):
    id_colegio = validar_colegio_coordinador(current_user)

    incapacidad = obtener_incapacidad_por_radicado(
        db,
        datos.numero_radicado,
    )

    estudiante = validar_estudiante_incapacidad(
        incapacidad,
        id_colegio,
    )

    validar_incapacidad_aprobada(incapacidad)
    validar_incapacidad_no_vencida(incapacidad)

    verificar_acceso_existente(
        db,
        incapacidad.id_incapacidad,
    )

    return guardar_nuevo_acceso(
        db,
        estudiante,
        incapacidad,
    )


# ============================================================
# GET /accesos
# Listar accesos según el rol.
# ============================================================


@router.get(
    "",
    response_model=list[AccesoAcademicoResponse],
)
def listar_accesos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    rol = obtener_rol_efectivo(current_user)

    if rol == "coordinador":
        id_colegio = validar_colegio_coordinador(current_user)

        return (
            db.query(AccesoAcademico)
            .join(
                Usuario,
                AccesoAcademico.id_usuario == Usuario.id_usuario,
            )
            .filter(
                Usuario.id_colegio == id_colegio,
            )
            .all()
        )

    if rol == "estudiante":
        return (
            db.query(AccesoAcademico)
            .filter(
                AccesoAcademico.id_usuario == current_user.id_usuario,
            )
            .all()
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permisos para consultar estos accesos académicos",
    )


# ============================================================
# GET /accesos/{id_acceso}
# Consultar un acceso concreto.
# ============================================================


def obtener_acceso_del_estudiante(
    db: Session,
    id_acceso: int,
    current_user: Usuario,
) -> AccesoAcademico:
    acceso = (
        db.query(AccesoAcademico)
        .filter(
            AccesoAcademico.id_acceso == id_acceso,
        )
        .first()
    )

    if acceso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Acceso académico no encontrado",
        )

    if acceso.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Solo puedes consultar tus propios accesos académicos",
        )

    return acceso


@router.get(
    "/{id_acceso}",
    response_model=AccesoAcademicoResponse,
)
def obtener_acceso(
    id_acceso: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    rol = obtener_rol_efectivo(current_user)

    if rol == "coordinador":
        id_colegio = validar_colegio_coordinador(current_user)

        return obtener_acceso_del_colegio(
            db,
            id_acceso,
            id_colegio,
        )

    if rol == "estudiante":
        return obtener_acceso_del_estudiante(
            db,
            id_acceso,
            current_user,
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permisos para consultar este acceso académico",
    )
