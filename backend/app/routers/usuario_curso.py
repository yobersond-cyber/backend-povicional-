
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.dependencias.auth import require_role
from app.models.usuario_curso import UsuarioCurso
from app.models.Usuarios import Usuario
from app.models.curso import Curso
from app.schemas.usuario_curso import (
    UsuarioCursoCreate,
    UsuarioCursoResponse,
)
from app.schemas.base import APIResponse


router = APIRouter(
    prefix="/usuario-curso",
    tags=["Usuarios - Cursos"],
)


def verificar_colegio_coordinador(current_user: Usuario) -> int:
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El coordinador no tiene un colegio asignado",
        )

    return current_user.id_colegio


def obtener_relacion_del_colegio(
    db: Session,
    id_usuario_curso: int,
    id_colegio: int,
):
    relacion = (
        db.query(UsuarioCurso)
        .join(
            Usuario,
            UsuarioCurso.id_usuario == Usuario.id_usuario,
        )
        .join(
            Curso,
            UsuarioCurso.id_curso == Curso.id_curso,
        )
        .filter(
            UsuarioCurso.id_usuario_curso == id_usuario_curso,
            Usuario.id_colegio == id_colegio,
            Curso.id_colegio == id_colegio,
        )
        .first()
    )

    if relacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relación usuario-curso no encontrada en tu colegio",
        )

    return relacion


@router.post(
    "",
    response_model=APIResponse[UsuarioCursoResponse],
    status_code=status.HTTP_201_CREATED,
)
def asignar_usuario_curso(
    datos: UsuarioCursoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("coordinador")),
):
    id_colegio = verificar_colegio_coordinador(current_user)

    usuario = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == datos.id_usuario)
        .first()
    )

    if usuario is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    if usuario.tipo_de_usuario not in ("estudiante", "docente"):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden asignar estudiantes o docentes a un curso",
        )

    if usuario.id_colegio != id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes asignar usuarios de otro colegio",
        )

    curso = (
        db.query(Curso)
        .filter(Curso.id_curso == datos.id_curso)
        .first()
    )

    if curso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado",
        )

    if curso.id_colegio != id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes gestionar cursos de otro colegio",
        )

    existente = (
        db.query(UsuarioCurso)
        .filter(
            UsuarioCurso.id_usuario == usuario.id_usuario,
            UsuarioCurso.id_curso == curso.id_curso,
        )
        .first()
    )

    if existente is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El usuario ya pertenece a este curso",
        )

    # Un estudiante solo puede estar inscrito en un curso.
    if usuario.tipo_de_usuario == "estudiante":
        otra_asignacion = (
            db.query(UsuarioCurso)
            .filter(
                UsuarioCurso.id_usuario == usuario.id_usuario,
            )
            .first()
        )

        if otra_asignacion is not None:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="El estudiante ya está asignado a otro curso",
            )

    nueva_relacion = UsuarioCurso(
        id_usuario=usuario.id_usuario,
        id_curso=curso.id_curso,
    )

    try:
        db.add(nueva_relacion)
        db.commit()
        db.refresh(nueva_relacion)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo asignar el usuario al curso",
        )

    return APIResponse(
        success=True,
        mensaje="Usuario asignado al curso exitosamente",
        data=nueva_relacion,
    )


@router.delete(
    "/{id_usuario_curso}",
    response_model=APIResponse[dict],
    status_code=status.HTTP_200_OK,
)
def eliminar_usuario_curso(
    id_usuario_curso: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("coordinador")),
):
    id_colegio = verificar_colegio_coordinador(current_user)

    relacion = obtener_relacion_del_colegio(
        db=db,
        id_usuario_curso=id_usuario_curso,
        id_colegio=id_colegio,
    )

    try:
        db.delete(relacion)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo retirar al usuario del curso",
        )

    return APIResponse(
        success=True,
        mensaje="Usuario retirado del curso correctamente",
        data={
            "id_usuario_curso": id_usuario_curso,
        },
    )
