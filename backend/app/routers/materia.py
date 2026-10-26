
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.dependencias.auth import require_role
from app.models.Usuarios import Usuario
from app.models.curso import Curso
from app.models.materia import Materia
from app.schemas.materia import (
    MateriaCreate,
    MateriaUpdate,
    MateriaResponse,
)
from app.schemas.base import APIResponse


router = APIRouter(prefix="/materias", tags=["Materias"])


def obtener_curso_del_colegio(
    db: Session,
    id_curso: int,
    id_colegio: int,
) -> Curso:
    curso = (
        db.query(Curso)
        .filter(
            Curso.id_curso == id_curso,
            Curso.id_colegio == id_colegio,
        )
        .first()
    )

    if curso is None:
        raise HTTPException(
            status_code=403,
            detail="El curso no existe o no pertenece a tu colegio",
        )

    return curso


def obtener_materia_del_colegio(
    db: Session,
    id_materia: int,
    id_colegio: int,
) -> Materia:
    materia = (
        db.query(Materia)
        .join(Curso, Materia.id_curso == Curso.id_curso)
        .filter(
            Materia.id_materia == id_materia,
            Curso.id_colegio == id_colegio,
        )
        .first()
    )

    if materia is None:
        raise HTTPException(
            status_code=404,
            detail="Materia no encontrada en tu colegio",
        )

    return materia


def validar_codigo_materia(
    db: Session,
    id_curso: int,
    codigo_materia: str,
    id_materia_excluir: int | None = None,
) -> None:
    consulta = db.query(Materia).filter(
        Materia.id_curso == id_curso,
        Materia.codigo_materia == codigo_materia,
    )

    if id_materia_excluir is not None:
        consulta = consulta.filter(
            Materia.id_materia != id_materia_excluir
        )

    if consulta.first():
        raise HTTPException(
            status_code=409,
            detail="Ya existe una materia con ese código en este curso",
        )


@router.get("", response_model=APIResponse[list[MateriaResponse]])
def listar_materias(
    current_user: Usuario = Depends(require_role("coordinador")),
    db: Session = Depends(get_db),
):
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=403,
            detail="El coordinador no tiene un colegio asignado",
        )

    materias = (
        db.query(Materia)
        .join(Curso, Materia.id_curso == Curso.id_curso)
        .filter(Curso.id_colegio == current_user.id_colegio)
        .order_by(Materia.nombre_materia.asc())
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Materias del colegio recuperadas correctamente",
        data=materias,
    )


@router.post(
    "",
    response_model=APIResponse[MateriaResponse],
    status_code=201,
)
def crear_materia(
    datos: MateriaCreate,
    current_user: Usuario = Depends(require_role("coordinador")),
    db: Session = Depends(get_db),
):
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=403,
            detail="El coordinador no tiene un colegio asignado",
        )

    obtener_curso_del_colegio(
        db,
        datos.id_curso,
        current_user.id_colegio,
    )

    validar_codigo_materia(
        db,
        datos.id_curso,
        datos.codigo_materia,
    )

    nueva_materia = Materia(
        codigo_materia=datos.codigo_materia,
        nombre_materia=datos.nombre_materia,
        descripcion=datos.descripcion,
        id_curso=datos.id_curso,
    )

    try:
        db.add(nueva_materia)
        db.commit()
        db.refresh(nueva_materia)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo crear la materia",
        )

    return APIResponse(
        success=True,
        mensaje="Materia creada correctamente",
        data=nueva_materia,
    )


@router.get(
    "/{id_materia}",
    response_model=APIResponse[MateriaResponse],
)
def obtener_materia(
    id_materia: int,
    current_user: Usuario = Depends(require_role("coordinador")),
    db: Session = Depends(get_db),
):
    materia = obtener_materia_del_colegio(
        db,
        id_materia,
        current_user.id_colegio,
    )

    return APIResponse(
        success=True,
        mensaje="Materia obtenida correctamente",
        data=materia,
    )


@router.put(
    "/{id_materia}",
    response_model=APIResponse[MateriaResponse],
)
def actualizar_materia(
    id_materia: int,
    datos: MateriaUpdate,
    current_user: Usuario = Depends(require_role("coordinador")),
    db: Session = Depends(get_db),
):
    materia = obtener_materia_del_colegio(
        db,
        id_materia,
        current_user.id_colegio,
    )

    obtener_curso_del_colegio(
        db,
        datos.id_curso,
        current_user.id_colegio,
    )

    validar_codigo_materia(
        db,
        datos.id_curso,
        datos.codigo_materia,
        id_materia_excluir=materia.id_materia,
    )

    materia.codigo_materia = datos.codigo_materia
    materia.nombre_materia = datos.nombre_materia
    materia.descripcion = datos.descripcion
    materia.id_curso = datos.id_curso

    try:
        db.commit()
        db.refresh(materia)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=500,
            detail="No se pudo actualizar la materia",
        )

    return APIResponse(
        success=True,
        mensaje="Materia actualizada correctamente",
        data=materia,
    )


@router.delete("/{id_materia}", response_model=APIResponse[dict])
def eliminar_materia(
    id_materia: int,
    current_user: Usuario = Depends(require_role("coordinador")),
    db: Session = Depends(get_db),
):
    materia = obtener_materia_del_colegio(
        db,
        id_materia,
        current_user.id_colegio,
    )

    try:
        db.delete(materia)
        db.commit()
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=409,
            detail=(
                "No se pudo eliminar la materia. "
                "Verifica si tiene actividades, materiales o docentes asociados."
            ),
        )

    return APIResponse(
        success=True,
        mensaje="Materia eliminada correctamente",
        data={"id_materia": id_materia},
    )
