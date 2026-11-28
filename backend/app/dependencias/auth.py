from datetime import date

import jwt

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.config import settings
from app.database.conection import get_db

from app.models.Usuarios import Usuario
from app.models.colegios import Colegio
from app.models.acceso_academico import AccesoAcademico
from app.models.incapacidad import Incapacidad


security = HTTPBearer(auto_error=False)


def obtener_rol_efectivo(usuario: Usuario) -> str:
    """
    El rol efectivo siempre corresponde al rol actual
    guardado en la base de datos.
    """
    return usuario.tipo_de_usuario


def _crear_error_autenticacion() -> HTTPException:
    return HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o sesión expirada. Inicia sesión nuevamente.",
        headers={"WWW-Authenticate": "Bearer"},
    )


def _validar_token(token: str, error: HTTPException) -> tuple[int, str]:
    """
    Valida el JWT y extrae el identificador y el rol.
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"require": ["exp", "sub", "rol"]},
        )

        sub = payload.get("sub")
        rol_token = payload.get("rol")

        if (
            not isinstance(sub, str)
            or not sub.isdecimal()
            or len(sub) > 10
            or not isinstance(rol_token, str)
        ):
            raise error

        id_usuario = int(sub)

        if id_usuario <= 0:
            raise error

        return id_usuario, rol_token

    except (jwt.InvalidTokenError, ValueError, TypeError) as exc:
        raise error from exc


def _obtener_usuario_por_id(
    db: Session,
    id_usuario: int,
) -> Usuario | None:
    return (
        db.query(Usuario)
        .filter(Usuario.id_usuario == id_usuario)
        .first()
    )


def _validar_rol_token(
    usuario: Usuario,
    rol_token: str,
    error: HTTPException,
) -> str:
    """
    Comprueba que el rol del token coincida con el rol actual.
    """
    if rol_token != usuario.tipo_de_usuario:
        raise error

    rol = obtener_rol_efectivo(usuario)

    roles_validos = {
        "administrador",
        "rector",
        "coordinador",
        "docente",
        "estudiante",
    }

    if rol not in roles_validos:
        raise error

    return rol


def _validar_colegio_usuario(
    usuario: Usuario,
    rol: str,
    db: Session,
) -> None:
    """
    Comprueba la asociación y el estado del colegio del usuario.
    """
    if rol == "administrador":
        if usuario.id_colegio is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El administrador global no puede estar asociado a un colegio",
            )
        return

    if usuario.id_colegio is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta no está asociada a un colegio",
        )

    colegio = (
        db.query(Colegio)
        .filter(Colegio.id_colegio == usuario.id_colegio)
        .first()
    )

    if colegio is None or colegio.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El colegio no existe o se encuentra inactivo",
        )


def _validar_aprobacion_estudiante(
    usuario: Usuario,
    rol: str,
) -> None:
    """
    Comprueba que la cuenta del estudiante esté aprobada.
    """
    if rol == "estudiante" and usuario.estado_aprobacion != "aprobada":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta todavía no está aprobada por el colegio",
        )


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Obtiene el usuario autenticado y valida su acceso institucional.
    """
    error = _crear_error_autenticacion()

    if credentials is None:
        raise error

    id_usuario, rol_token = _validar_token(
        credentials.credentials,
        error,
    )

    usuario = _obtener_usuario_por_id(db, id_usuario)

    if usuario is None:
        raise error

    rol = _validar_rol_token(usuario, rol_token, error)

    _validar_colegio_usuario(usuario, rol, db)
    _validar_aprobacion_estudiante(usuario, rol)

    return usuario


def verificar_acceso_academico(
    current_user: Usuario = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> Usuario:
    """
    Comprueba que un estudiante tenga una incapacidad
    aprobada y un acceso académico vigente.

    Los demás roles conservan su funcionamiento habitual.
    """
    if current_user.tipo_de_usuario != "estudiante":
        return current_user

    hoy = date.today()

    acceso = (
        db.query(AccesoAcademico)
        .join(
            Incapacidad,
            AccesoAcademico.id_incapacidad
            == Incapacidad.id_incapacidad,
        )
        .filter(
            AccesoAcademico.id_usuario == current_user.id_usuario,
            AccesoAcademico.estado == "activo",
            Incapacidad.estado == "aprobada",
            Incapacidad.fecha_inicio <= hoy,
            Incapacidad.fecha_fin >= hoy,
        )
        .first()
    )

    if acceso is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "No tienes acceso académico activo. "
                "Puedes enviar incapacidades y consultar tus solicitudes."
            ),
        )

    return current_user


def require_role(*roles: str):
    """
    Protege las rutas según el rol actual del usuario.
    """

    def role_checker(
        current_user: Usuario = Depends(get_current_user),
    ) -> Usuario:
        rol_actual = obtener_rol_efectivo(current_user)

        if rol_actual not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción",
            )

        return current_user

    return role_checker
