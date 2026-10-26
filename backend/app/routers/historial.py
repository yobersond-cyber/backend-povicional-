
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.dependencias.auth import require_role
from app.models.Usuarios import Usuario
from app.models.historial_incapacidad import HistorialIncapacidad
from app.models.incapacidad import Incapacidad
from app.schemas.historial import HistorialResponse
from app.schemas.base import APIResponse


router = APIRouter(
    prefix="/historial",
    tags=["Historial de Incapacidades"],
)


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


@router.get(
    "",
    response_model=APIResponse[list[HistorialResponse]],
)
def listar_historiales(
    current_user: Usuario = Depends(require_role("coordinador")),
    db: Session = Depends(get_db),
):
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=403,
            detail="El coordinador no tiene un colegio asignado",
        )

    historiales = (
        db.query(HistorialIncapacidad)
        .join(
            Incapacidad,
            HistorialIncapacidad.id_incapacidad
            == Incapacidad.id_incapacidad,
        )
        .join(
            Usuario,
            Incapacidad.id_usuario == Usuario.id_usuario,
        )
        .filter(Usuario.id_colegio == current_user.id_colegio)
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Historiales de incapacidades de tu colegio recuperados",
        data=historiales,
    )


@router.get(
    "/incapacidad/{id_incapacidad}",
    response_model=APIResponse[list[HistorialResponse]],
)
def listar_historial_por_incapacidad(
    id_incapacidad: int,
    current_user: Usuario = Depends(require_role("coordinador")),
    db: Session = Depends(get_db),
):
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

    historial = (
        db.query(HistorialIncapacidad)
        .filter(
            HistorialIncapacidad.id_incapacidad == id_incapacidad
        )
        .all()
    )

    return APIResponse(
        success=True,
        mensaje=(
            f"Historial de la incapacidad #{id_incapacidad} "
            "recuperado correctamente"
        ),
        data=historial,
    )
