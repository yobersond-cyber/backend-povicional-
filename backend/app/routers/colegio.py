
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    status,
)
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
    ColegioConRectorCreate,
    ColegioConRectorResponse,
)

from app.services.notificaciones_service import notificar_usuario


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


def verificar_datos_rector(
    db: Session,
    documento: str,
    correo: str,
) -> None:

    if db.query(Usuario).filter(
        Usuario.documento == documento
    ).first():

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El documento del rector ya está registrado",
        )

    if db.query(Usuario).filter(
        Usuario.correo == correo
    ).first():

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El correo del rector ya está registrado",
        )


def notificar_creacion_rector(
    background_tasks: BackgroundTasks,
    rector: Usuario,
    colegio: Colegio,
) -> None:
    """
    Notifica al rector la creación de su cuenta institucional.
    El administrador global no recibe esta notificación.
    """

    if (
        rector.tipo_de_usuario != "rector"
        or not rector.correo
        or not rector.correo.strip()
    ):
        return

    background_tasks.add_task(
        notificar_usuario,
        destinatario=rector.correo.strip(),
        nombres_usuario=(
            f"{rector.nombres_compl} "
            f"{rector.apellidos_compl}"
        ),
        asunto="Tu cuenta de rector ha sido creada - APRENZY",
        titulo="¡Bienvenido a APRENZY!",
        mensaje=(
            f"Se ha creado tu cuenta de rector para el colegio "
            f"{colegio.nombre_colegio}. "
            f"Ya puedes ingresar a APRENZY utilizando el correo "
            f"electrónico y la contraseña que fueron registrados "
            f"durante la creación de tu cuenta."
        ),
        detalle=(
            f"Colegio: {colegio.nombre_colegio}\n"
            f"Rol asignado: Rector\n"
            f"Correo de acceso: {rector.correo}"
        ),
    )


@router.post(
    "",
    response_model=APIResponse[ColegioConRectorResponse],
    status_code=status.HTTP_201_CREATED,
)
def crear_colegio_con_rector(
    datos: ColegioConRectorCreate,
    background_tasks: BackgroundTasks,
    current_user: Usuario = Depends(
        require_role("administrador")
    ),
    db: Session = Depends(get_db),
):
    """
    Crea un colegio y su rector obligatoriamente
    en una sola transacción.

    Solo puede hacerlo el administrador global.
    """

    verificar_datos_colegio(
        db,
        datos.colegio.codigo_dane,
        datos.colegio.nit,
    )

    verificar_datos_rector(
        db,
        datos.rector.documento,
        str(datos.rector.correo),
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
        db.add(colegio)

        db.flush()

        rector = Usuario(
            id_colegio=colegio.id_colegio,
            documento=datos.rector.documento,
            nombres_compl=datos.rector.nombres_compl,
            apellidos_compl=datos.rector.apellidos_compl,
            telefono=datos.rector.telefono,
            correo=str(datos.rector.correo),
            contrasena=hash_password(
                datos.rector.contrasena
            ),
            tipo_de_usuario="rector",
            estado_aprobacion=None,
        )

        db.add(rector)

        db.commit()

        db.refresh(colegio)
        db.refresh(rector)

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "No se pudo crear el colegio y su rector. "
                "Verifica que el código DANE, NIT, documento "
                "y correo no estén repetidos, y que el colegio "
                "no tenga ya un rector."
            ),
        ) from exc

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Ocurrió un error al crear el colegio y su rector",
        ) from exc

    # El correo se programa únicamente después de confirmar
    # la creación del colegio y del rector.
    notificar_creacion_rector(
        background_tasks=background_tasks,
        rector=rector,
        colegio=colegio,
    )

    return APIResponse(
        success=True,
        mensaje="Colegio y rector creados exitosamente",
        data={
            "colegio": colegio,
            "rector": rector,
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
    Lista todos los colegios.
    Solo para el administrador global.
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
        .filter(
            Colegio.id_colegio == id_colegio
        )
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
