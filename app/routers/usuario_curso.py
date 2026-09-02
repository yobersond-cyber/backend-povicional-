from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import SessionLocal
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


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=APIResponse[UsuarioCursoResponse],
    status_code=status.HTTP_201_CREATED,
)
def asignar_usuario_curso(
    datos: UsuarioCursoCreate,
    db: Session = Depends(get_db),
):
    usuario = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == datos.id_usuario)
        .first()
    )
    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )

    curso = (
        db.query(Curso)
        .filter(Curso.id_curso == datos.id_curso)
        .first()
    )
    if not curso:
        raise HTTPException(
            status_code=404,
            detail="Curso no encontrado",
        )

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
            status_code=400,
            detail="El usuario ya pertenece a este curso",
        )

    if usuario.tipo_de_usuario == "estudiante":
        otro_curso = (
            db.query(UsuarioCurso)
            .filter(UsuarioCurso.id_usuario == datos.id_usuario)
            .first()
        )
        if otro_curso:
            raise HTTPException(
                status_code=400,
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
):
    relacion = (
        db.query(UsuarioCurso)
        .filter(UsuarioCurso.id_usuario_curso == id_usuario_curso)
        .first()
    )
    if not relacion:
        raise HTTPException(
            status_code=404,
            detail="Relación usuario-curso no encontrada",
        )

    db.delete(relacion)
    db.commit()

    return APIResponse(
        success=True,
        mensaje="Usuario retirado del curso correctamente",
        data={"id_usuario_curso": id_usuario_curso},
    )