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


@router.post(
    "",
    response_model=APIResponse[UsuarioCursoResponse],
    status_code=status.HTTP_201_CREATED,
)
def asignar_usuario_curso(
    datos: UsuarioCursoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("administrador")),
):
    # Buscar usuario
    usuario = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == datos.id_usuario)
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario no encontrado",
        )

    # El usuario debe pertenecer al mismo colegio
    # que el administrador.
    if usuario.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes gestionar usuarios de otro colegio",
        )

    # Un administrador no necesita pertenecer a un curso.
    if usuario.tipo_de_usuario == "administrador":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Un administrador no puede ser asignado a un curso",
        )

    # Buscar curso
    curso = (
        db.query(Curso)
        .filter(Curso.id_curso == datos.id_curso)
        .first()
    )

    if not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso no encontrado",
        )

    # El curso debe pertenecer al mismo colegio.
    if curso.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes gestionar cursos de otro colegio",
        )

    # Verificar que usuario y curso sean del mismo colegio.
    if usuario.id_colegio != curso.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario y el curso deben pertenecer al mismo colegio",
        )

    # Evitar relación duplicada.
    existente = (
        db.query(UsuarioCurso)
        .filter(
            UsuarioCurso.id_usuario == datos.id_usuario,
            UsuarioCurso.id_curso == datos.id_curso,
        )
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="El usuario ya pertenece a este curso",
        )

    # Un estudiante solamente puede pertenecer a un curso.
    if usuario.tipo_de_usuario == "estudiante":
        otro_curso = (
            db.query(UsuarioCurso)
            .filter(
                UsuarioCurso.id_usuario == datos.id_usuario
            )
            .first()
        )

        if otro_curso:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Un estudiante solo puede pertenecer a un curso",
            )

    nueva_relacion = UsuarioCurso(
        id_usuario=datos.id_usuario,
        id_curso=datos.id_curso,
    )

    db.add(nueva_relacion)
    db.commit()
    db.refresh(nueva_relacion)

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
    current_user: Usuario = Depends(require_role("administrador")),
):
    relacion = (
        db.query(UsuarioCurso)
        .filter(
            UsuarioCurso.id_usuario_curso == id_usuario_curso
        )
        .first()
    )

    if not relacion:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Relación usuario-curso no encontrada",
        )

    # Obtener usuario y curso relacionados.
    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == relacion.id_usuario
        )
        .first()
    )

    curso = (
        db.query(Curso)
        .filter(
            Curso.id_curso == relacion.id_curso
        )
        .first()
    )

    if not usuario or not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Usuario o curso relacionado no encontrado",
        )

    # Solo se pueden gestionar relaciones
    # del mismo colegio del administrador.
    if (
        usuario.id_colegio != current_user.id_colegio
        or curso.id_colegio != current_user.id_colegio
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes gestionar relaciones de otro colegio",
        )

    db.delete(relacion)
    db.commit()

    return APIResponse(
        success=True,
        mensaje="Usuario retirado del curso correctamente",
        data={
            "id_usuario_curso": id_usuario_curso
        },
    )