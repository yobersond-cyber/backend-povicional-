from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from sqlalchemy.orm import Session
import jwt

from app.core.config import settings
from app.database.conection import get_db
from app.models.Usuarios import Usuario


oauth2_scheme = OAuth2PasswordBearer(tokenUrl="/usuarios/login")


def get_current_user(
    token: str = Depends(oauth2_scheme),
    db: Session = Depends(get_db),
):
    """
    Obtiene el usuario autenticado a partir del JWT.
    """

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="No se pudo validar el token",
        headers={"WWW-Authenticate": "Bearer"},
    )

    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM],
        )

        id_usuario = payload.get("sub")

        if id_usuario is None:
            raise credentials_exception

        id_usuario = int(id_usuario)

    except (jwt.InvalidTokenError, ValueError, TypeError):
        raise credentials_exception

    usuario = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == id_usuario)
        .first()
    )

    if usuario is None:
        raise credentials_exception

    return usuario


def require_role(*roles: str):
    """
    Permite restringir un endpoint a uno o varios roles.
    """

    def role_checker(
        current_user: Usuario = Depends(get_current_user),
    ):
        if current_user.tipo_de_usuario not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes permisos para realizar esta acción",
            )

        return current_user

    return role_checker