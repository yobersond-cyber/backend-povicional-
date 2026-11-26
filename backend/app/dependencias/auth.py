
from datetime import date

from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

import jwt

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


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Token inválido o sesión expirada. Inicia sesión nuevamente.",
        headers={"WWW-Authenticate": "Bearer"},
    )

    if credentials is None:
        raise credentials_exception

    token = credentials.credentials

    # 1. Validar firma, expiración e información obligatoria del JWT.
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={
                "require": ["exp", "sub", "rol"],
            },
        )

        sub = payload.get("sub")
        rol_token = payload.get("rol")

        if (
            not isinstance(sub, str)
            or not sub.isdecimal()
            or len(sub) > 10
            or not isinstance(rol_token, str)
        ):
            raise credentials_exception

        id_usuario = int(sub)

        if id_usuario <= 0:
            raise credentials_exception

    except (jwt.InvalidTokenError, ValueError, TypeError) as exc:
        raise credentials_exception from exc

    # 2. Consultar el usuario real en la base de datos.
    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == id_usuario
        )
        .first()
    )

    if usuario is None:
        raise credentials_exception

    # 3. Comprobar que el rol del JWT coincida con el rol actual.
    if rol_token != usuario.tipo_de_usuario:
        raise credentials_exception

    rol = obtener_rol_efectivo(usuario)

    roles_validos = {
        "administrador",
        "rector",
        "coordinador",
        "docente",
        "estudiante",
    }

    if rol not in roles_validos:
        raise credentials_exception

    # 4. El administrador global no debe tener colegio.
    if rol == "administrador":
        if usuario.id_colegio is not None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El administrador global no puede estar asociado a un colegio",
            )

        return usuario

    # 5. El resto de usuarios debe pertenecer a un colegio.
    if usuario.id_colegio is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta no está asociada a un colegio",
        )

    # 6. Comprobar que el colegio exista y esté activo.
    colegio = (
        db.query(Colegio)
        .filter(
            Colegio.id_colegio == usuario.id_colegio
        )
        .first()
    )

    if colegio is None or colegio.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El colegio no existe o se encuentra inactivo",
        )

    # 7. Los estudiantes deben estar aprobados.
    if (
        rol == "estudiante"
        and usuario.estado_aprobacion != "aprobada"
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Tu cuenta todavía no está aprobada por el colegio",
        )

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

    # Esta restricción solo aplica a estudiantes.
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

    Ejemplos:
    require_role("administrador")
    require_role("rector")
    require_role("coordinador")
    require_role("docente")
    require_role("estudiante")
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
