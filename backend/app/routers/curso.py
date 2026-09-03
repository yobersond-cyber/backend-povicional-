from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.schemas.curso import CursoCreate, CursoUpdate, CursoResponse

from app.database.conection import SessionLocal
from app.models.curso import Curso
from app.schemas.curso import CursoCreate, CursoResponse
from app.schemas.base import APIResponse


router = APIRouter(
    prefix="/cursos",
    tags=["Cursos"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@router.post(
    "",
    response_model=APIResponse[CursoResponse],
    status_code=status.HTTP_201_CREATED,
)
def crear_curso(
    curso: CursoCreate,
    db: Session = Depends(get_db),
):
    existente = (
        db.query(Curso)
        .filter(
            Curso.id_colegio == curso.id_colegio,
            Curso.numero_curso == curso.numero_curso,
        )
        .first()
    )

    if existente:
        raise HTTPException(
            status_code=400,
            detail="Este curso ya fue creado previamente en este colegio",
        )

    nuevo_curso = Curso(
        id_colegio=curso.id_colegio,
        numero_curso=curso.numero_curso,
        grado=curso.grado,
        jornada=curso.jornada,
    )

    db.add(nuevo_curso)
    db.commit()
    db.refresh(nuevo_curso)

    return APIResponse(
        success=True,
        mensaje="Curso creado exitosamente",
        data=nuevo_curso,
    )


@router.get(
    "",
    response_model=APIResponse[list[CursoResponse]],
)
def listar_cursos(
    db: Session = Depends(get_db),
):
    cursos = db.query(Curso).all()
    return APIResponse(
        success=True,
        mensaje="Estos son todos los cursos registrados",
        data=cursos,
    )


@router.get(
    "/{id_curso}",
    response_model=APIResponse[CursoResponse],
)
def obtener_curso(
    id_curso: int,
    db: Session = Depends(get_db),
):
    curso = (
        db.query(Curso)
        .filter(Curso.id_curso == id_curso)
        .first()
    )

    if not curso:
        raise HTTPException(
            status_code=404,
            detail="Curso no encontrado",
        )

    return APIResponse(
        success=True,
        mensaje="Curso obtenido correctamente",
        data=curso,
    )


@router.put(
    "/{id_curso}",
    response_model=APIResponse[CursoResponse],
)
def actualizar_curso(
    id_curso: int,
    datos: CursoCreate,
    db: Session = Depends(get_db),
):
    curso = (
        db.query(Curso)
        .filter(Curso.id_curso == id_curso)
        .first()
    )

    if not curso:
        raise HTTPException(
            status_code=404,
            detail="Curso no encontrado",
        )

    curso.id_colegio = datos.id_colegio
    curso.numero_curso = datos.numero_curso
    curso.grado = datos.grado
    curso.jornada = datos.jornada

    db.commit()
    db.refresh(curso)

    return APIResponse(
        success=True,
        mensaje="Curso actualizado correctamente",
        data=curso,
    )