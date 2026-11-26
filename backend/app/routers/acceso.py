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

    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El coordinador no tiene un colegio asignado",
        )

    incapacidad = (
        db.query(Incapacidad)
        .options(
            joinedload(Incapacidad.usuario),
        )
        .filter(
            Incapacidad.numero_radicado
            == datos.numero_radicado.strip(),
        )
        .first()
    )

    if incapacidad is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No se encontró una incapacidad con ese número de radicado",
        )

    estudiante = incapacidad.usuario

    if (
        estudiante is None
        or estudiante.tipo_de_usuario != "estudiante"
    ):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La incapacidad no pertenece a un estudiante",
        )

    if estudiante.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes gestionar estudiantes de otro colegio",
        )

    if incapacidad.estado != "aprobada":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede crear un acceso para una incapacidad aprobada",
        )

    hoy = date.today()

    if incapacidad.fecha_fin < hoy:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No se puede crear un acceso para una incapacidad vencida",
        )

    existente = (
        db.query(AccesoAcademico)
        .filter(
            AccesoAcademico.id_incapacidad
            == incapacidad.id_incapacidad,
        )
        .first()
    )

    if existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Esta incapacidad ya tiene un acceso académico",
        )

    # El acceso depende de las fechas de la incapacidad.
    if hoy < incapacidad.fecha_inicio:
        estado_acceso = "suspendido"
    else:
        estado_acceso = "activo"

    nuevo_acceso = AccesoAcademico(
        id_usuario=estudiante.id_usuario,
        id_incapacidad=incapacidad.id_incapacidad,
        estado=estado_acceso,
    )

    try:
        db.add(nuevo_acceso)
        db.commit()
        db.refresh(nuevo_acceso)

    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear el acceso académico",
        )

    return nuevo_acceso


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

        if current_user.id_colegio is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El coordinador no tiene un colegio asignado",
            )

        return (
            db.query(AccesoAcademico)
            .join(
                Usuario,
                AccesoAcademico.id_usuario == Usuario.id_usuario,
            )
            .filter(
                Usuario.id_colegio == current_user.id_colegio,
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

        if current_user.id_colegio is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El coordinador no tiene un colegio asignado",
            )

        return obtener_acceso_del_colegio(
            db,
            id_acceso,
            current_user.id_colegio,
        )

    if rol == "estudiante":

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

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permisos para consultar este acceso académico",
    )