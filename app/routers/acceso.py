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

from app.services.acceso_service import finalizar_accesos_vencidos

from app.dependencias.auth import (
    get_current_user,
    require_role,
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


# ============================================================
# POST /accesos
# Crear un acceso académico
# Solo administrador
# ============================================================

@router.post(
    "",
    response_model=AccesoAcademicoResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_acceso(
    datos: AccesoAcademicoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
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
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    # El acceso académico es para estudiantes
    if usuario.tipo_de_usuario != "estudiante":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El acceso académico solo puede asignarse a un estudiante",
        )

    # Verificar que la incapacidad exista
    incapacidad = (
        db.query(Incapacidad)
        .filter(
            Incapacidad.id_incapacidad
            == datos.id_incapacidad
        )
        .first()
    )

    if not incapacidad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Incapacidad no encontrada",
        )

    # La incapacidad debe pertenecer al mismo estudiante
    if incapacidad.id_usuario != datos.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La incapacidad no pertenece al usuario indicado",
        )

    # La incapacidad debe estar aprobada
    if incapacidad.estado != "aprobada":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se puede crear un acceso académico para una incapacidad aprobada",
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
            status_code=status.HTTP_400_BAD_REQUEST,
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


# ============================================================
# GET /accesos
# Listar accesos académicos
# Solo coordinador
# ============================================================

@router.get(
    "",
    response_model=list[AccesoAcademicoResponse],
)
def listar_accesos(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
):
    # Finalizar automáticamente los accesos vencidos
    finalizar_accesos_vencidos(db)

    return db.query(AccesoAcademico).all()


# ============================================================
# GET /accesos/{id_acceso}
# Consultar un acceso académico
#
# Coordinador: puede consultar cualquiera.
# Estudiante: solamente el suyo.
# ============================================================

@router.get(
    "/{id_acceso}",
    response_model=AccesoAcademicoResponse,
)
def obtener_acceso(
    id_acceso: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    # Finalizar automáticamente los accesos vencidos
    finalizar_accesos_vencidos(db)

    acceso = (
        db.query(AccesoAcademico)
        .filter(
            AccesoAcademico.id_acceso == id_acceso
        )
        .first()
    )

    if not acceso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Acceso académico no encontrado",
        )

    # El coordinador puede consultar cualquier acceso
    if current_user.tipo_de_usuario == "administrador":
        return acceso

    # El estudiante solamente puede consultar su propio acceso
    if (
        current_user.tipo_de_usuario == "estudiante"
        and acceso.id_usuario == current_user.id_usuario
    ):
        return acceso