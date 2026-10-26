from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

import jwt

from app.core.config import settings
from app.database.conection import get_db
from app.models.Usuarios import Usuario
from app.models.colegios import Colegio


security = HTTPBearer(auto_error=False)


def obtener_rol_efectivo(usuario: Usuario) -> str:
    """
    Compatibilidad temporal con las cuentas existentes.

    Antes, el rol administrador representaba al encargado
    de un colegio.

    Ahora:
    - administrador sin colegio: administrador global.
    - administrador con colegio: coordinador antiguo.
    - coordinador: coordinador nuevo.
    """

    if (
        usuario.tipo_de_usuario == "administrador"
        and usuario.id_colegio is not None
    ):
        return "coordinador"

    return usuario.tipo_de_usuario


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(security),
    db: Session = Depends(get_db),
) -> Usuario:

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    # 1. Verificar que se haya enviado un token.
    if credentials is None:
        raise credentials_exception

    token = credentials.credentials

    # 2. Validar la firma, la expiración y el identificador del JWT.
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
            options={"require": ["exp", "sub"]},
        )

        id_usuario = int(payload.get("sub"))

    except (jwt.InvalidTokenError, ValueError, TypeError) as exc:
        raise credentials_exception from exc

    # 3. Consultar el usuario real en la base de datos.
    # No confiamos únicamente en el rol guardado en el JWT.
    usuario = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == id_usuario)
        .first()
    )

    if usuario is None:
        raise credentials_exception

    rol_efectivo = obtener_rol_efectivo(usuario)

    # 4. El administrador global no necesita colegio.
    if rol_efectivo == "administrador":
        return usuario

    # 5. Los demás usuarios deben estar asociados a un colegio.
    if usuario.id_colegio is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La cuenta no está asociada a un colegio",
        )

    # 6. Verificar que el colegio exista y esté activo.
    colegio = (
        db.query(Colegio)
        .filter(Colegio.id_colegio == usuario.id_colegio)
        .first()
    )

    if colegio is None or colegio.estado != "activo":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El colegio no existe o está inactivo",
        )

    return usuario


def require_role(*roles: str):
    """
    Permite acceder a una ruta únicamente a los roles
    autorizados.

    Las cuentas antiguas de administrador asociadas a un
    colegio se consideran coordinadores temporalmente.
    """

    def role_checker(
        current_user: Usuario = Depends(get_current_user),
    ) -> Usuario:

        rol_efectivo = obtener_rol_efectivo(current_user)

        if rol_efectivo not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción",
            )

        return current_user

    return role_checker