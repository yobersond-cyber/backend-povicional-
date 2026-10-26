
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.dependencias.auth import require_role
from app.core.security import hash_password

from app.models.colegios import Colegio
from app.models.Usuarios import Usuario

from app.schemas.base import APIResponse
from app.schemas.colegio import (
    ColegioResponse,
    ColegioConCoordinadorCreate,
    ColegioConCoordinadorResponse,
)


router = APIRouter(
    prefix="/colegios",
    tags=["Colegios"],
)


def verificar_datos_colegio(
    db: Session,
    codigo_dane: str | None,
    nit: str | None,
) -> None:
    if codigo_dane and db.query(Colegio).filter(
        Colegio.codigo_dane == codigo_dane
    ).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un colegio con ese código DANE",
        )

    if nit and db.query(Colegio).filter(
        Colegio.nit == nit
    ).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Ya existe un colegio con ese NIT",
        )


def verificar_datos_coordinador(
    db: Session,
    codigo_usuario: str,
    documento: str,
    correo: str,
) -> None:
    if db.query(Usuario).filter(
        Usuario.codigo_usuario == codigo_usuario
    ).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El código del coordinador ya está registrado",
        )

    if db.query(Usuario).filter(
        Usuario.documento == documento
    ).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El documento del coordinador ya está registrado",
        )

    if db.query(Usuario).filter(
        Usuario.correo == correo
    ).first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo del coordinador ya está registrado",
        )


@router.post(
    "",
    response_model=APIResponse[ColegioConCoordinadorResponse],
    status_code=status.HTTP_201_CREATED,
)
def crear_colegio_con_coordinador(
    datos: ColegioConCoordinadorCreate,
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
    db: Session = Depends(get_db),
):
    """
    Crea un colegio y su coordinador en una sola operación.

    Solo puede hacerlo el administrador global: las cuentas
    antiguas con rol administrador y colegio asignado se
    interpretan como coordinadores y no pasan esta autorización.
    """

    verificar_datos_colegio(
        db,
        datos.colegio.codigo_dane,
        datos.colegio.nit,
    )

    verificar_datos_coordinador(
        db,
        datos.coordinador.codigo_usuario,
        datos.coordinador.documento,
        str(datos.coordinador.correo),
    )

    colegio = Colegio(
        nombre_colegio=datos.colegio.nombre_colegio,
        codigo_dane=datos.colegio.codigo_dane,
        nit=datos.colegio.nit,
        direccion=datos.colegio.direccion,
        telefono=datos.colegio.telefono,
        correo_institucional=(
            str(datos.colegio.correo_institucional)
            if datos.colegio.correo_institucional
            else None
        ),
        municipio=datos.colegio.municipio,
        departamento=datos.colegio.departamento,
        estado=datos.colegio.estado,
    )

    try:
        # Primero se guarda el colegio para obtener su ID.
        db.add(colegio)
        db.flush()

        coordinador = Usuario(
            id_colegio=colegio.id_colegio,
            codigo_usuario=datos.coordinador.codigo_usuario,
            documento=datos.coordinador.documento,
            nombres_compl=datos.coordinador.nombres_compl,
            apellidos_compl=datos.coordinador.apellidos_compl,
            telefono=datos.coordinador.telefono,
            correo=str(datos.coordinador.correo),
            contrasena=hash_password(
                datos.coordinador.contrasena
            ),
            tipo_de_usuario="coordinador",
        )

        db.add(coordinador)
        db.commit()

        db.refresh(colegio)
        db.refresh(coordinador)

    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No se pudo crear el colegio y su coordinador. "
                "Verifica que el código DANE, NIT, código de usuario, "
                "documento y correo no estén repetidos."
            ),
        ) from exc

    return APIResponse(
        success=True,
        mensaje="Colegio y coordinador creados exitosamente",
        data={
            "colegio": colegio,
            "coordinador": coordinador,
        },
    )


@router.get(
    "",
    response_model=APIResponse[list[ColegioResponse]],
)
def listar_colegios(
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
    db: Session = Depends(get_db),
):
    """
    Lista todos los colegios. Solo para el administrador global.
    """

    colegios = (
        db.query(Colegio)
        .order_by(Colegio.nombre_colegio.asc())
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Colegios recuperados exitosamente",
        data=colegios,
    )


@router.get(
    "/{id_colegio}",
    response_model=APIResponse[ColegioResponse],
)
def obtener_colegio(
    id_colegio: int,
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
    db: Session = Depends(get_db),
):
    colegio = (
        db.query(Colegio)
        .filter(Colegio.id_colegio == id_colegio)
        .first()
    )

    if colegio is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Colegio no encontrado",
        )

    return APIResponse(
        success=True,
        mensaje="Colegio recuperado exitosamente",
        data=colegio,
    )
