
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import IntegrityError

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
    tags=["Estudiantes - Cursos"],
)


# ============================================================
# FUNCIONES AUXILIARES
# ============================================================


def obtener_colegio_coordinador(current_user: Usuario) -> int:
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
            Usuario.tipo_de_usuario == "estudiante",
        )
        .first()
    )

    if relacion is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Asignación de estudiante no encontrada en tu colegio",
        )

    return relacion


def obtener_estudiante_para_asignacion(
    db: Session,
    id_usuario: int,
    id_colegio: int,
) -> Usuario:
    estudiante = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == id_usuario)
        .first()
    )

    if estudiante is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante no encontrado",
        )

    if estudiante.tipo_de_usuario != "estudiante":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Solo se pueden asignar estudiantes a esta relación",
        )

    if estudiante.id_colegio != id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes asignar estudiantes de otro colegio",
        )

    if estudiante.estado_aprobacion != "aprobada":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El estudiante debe estar aprobado antes de asignarlo a un curso",
        )

    return estudiante


def obtener_curso_para_asignacion(
    db: Session,
    id_curso: int,
    id_colegio: int,
) -> Curso:
    curso = (
        db.query(Curso)
        .filter(Curso.id_curso == id_curso)
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
            detail="No puedes asignar estudiantes a cursos de otro colegio",
        )

    return curso


def validar_asignacion_existente(
    db: Session,
    estudiante: Usuario,
    curso: Curso,
) -> None:
    asignacion_existente = (
        db.query(UsuarioCurso)
        .filter(
            UsuarioCurso.id_usuario == estudiante.id_usuario,
        )
        .first()
    )

    if asignacion_existente is None:
        return

    if asignacion_existente.id_curso == curso.id_curso:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El estudiante ya pertenece a este curso",
        )

    raise HTTPException(
        status_code=status.HTTP_409_CONFLICT,
        detail="El estudiante ya está asignado a otro curso",
    )


def guardar_nueva_asignacion(
    db: Session,
    nueva_relacion: UsuarioCurso,
) -> None:
    try:
        db.add(nueva_relacion)
        db.commit()
        db.refresh(nueva_relacion)

    except IntegrityError as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="El estudiante ya está asignado o existen referencias inválidas",
        ) from exc

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo asignar el estudiante al curso",
        ) from exc


# ============================================================
# ASIGNAR ESTUDIANTE A UN CURSO
# ============================================================


@router.post(
    "",
    response_model=APIResponse[UsuarioCursoResponse],
    status_code=status.HTTP_201_CREATED,
)
def asignar_estudiante_curso(
    datos: UsuarioCursoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("coordinador")),
):
    id_colegio = obtener_colegio_coordinador(current_user)

    estudiante = obtener_estudiante_para_asignacion(
        db,
        datos.id_usuario,
        id_colegio,
    )

    curso = obtener_curso_para_asignacion(
        db,
        datos.id_curso,
        id_colegio,
    )

    validar_asignacion_existente(
        db,
        estudiante,
        curso,
    )

    nueva_relacion = UsuarioCurso(
        id_usuario=estudiante.id_usuario,
        id_curso=curso.id_curso,
    )

    guardar_nueva_asignacion(
        db,
        nueva_relacion,
    )

    return APIResponse(
        success=True,
        mensaje="Estudiante asignado al curso exitosamente",
        data=nueva_relacion,
    )


# ============================================================
# ELIMINAR ESTUDIANTE DE UN CURSO
# ============================================================


@router.delete(
    "/{id_usuario_curso}",
    response_model=APIResponse[dict],
    status_code=status.HTTP_200_OK,
)
def eliminar_estudiante_curso(
    id_usuario_curso: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("coordinador")),
):
    id_colegio = obtener_colegio_coordinador(current_user)

    relacion = obtener_relacion_del_colegio(
        db=db,
        id_usuario_curso=id_usuario_curso,
        id_colegio=id_colegio,
    )

    try:
        db.delete(relacion)
        db.commit()

    except Exception as exc:
        db.rollback()

        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo retirar al estudiante del curso",
        ) from exc

    return APIResponse(
        success=True,
        mensaje="Estudiante retirado del curso correctamente",
        data={
            "id_usuario_curso": id_usuario_curso,
        },
    )
