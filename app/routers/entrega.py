from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import SessionLocal
from app.models.entrega import Entrega
from app.models.actividad import Actividad
from app.models.Usuarios import Usuario
from app.models.materia import Materia
from app.models.usuario_curso import UsuarioCurso
from app.schemas.entrega import (
    EntregaCreate,
    EntregaCalificacion,
    EntregaResponse,
)


router = APIRouter(
    prefix="/entregas",
    tags=["Entregas"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# POST /entregas
@router.post(
    "",
    response_model=EntregaResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_entrega(
    datos: EntregaCreate,
    db: Session = Depends(get_db),
):
    # Verificar actividad
    actividad = (
        db.query(Actividad)
        .filter(
            Actividad.id_actividad == datos.id_actividad
        )
        .first()
    )

    if not actividad:
        raise HTTPException(
            status_code=404,
            detail="Actividad no encontrada",
        )

    # Verificar usuario
    usuario = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == datos.id_usuario
        )
        .first()
    )

    if not usuario:
        raise HTTPException(
            status_code=404,
            detail="Usuario no encontrado",
        )

    # Solo un estudiante puede realizar una entrega
    if usuario.tipo_de_usuario != "estudiante":
        raise HTTPException(
            status_code=400,
            detail="Solo un estudiante puede realizar una entrega",
        )

    # Verificar materia de la actividad
    materia = (
        db.query(Materia)
        .filter(
            Materia.id_materia == actividad.id_materia
        )
        .first()
    )

    if not materia:
        raise HTTPException(
            status_code=404,
            detail="Materia de la actividad no encontrada",
        )

    # Verificar que el estudiante pertenezca al curso
    # al que pertenece la materia
    pertenece_curso = (
        db.query(UsuarioCurso)
        .filter(
            UsuarioCurso.id_usuario == datos.id_usuario,
            UsuarioCurso.id_curso == materia.id_curso,
        )
        .first()
    )

    if not pertenece_curso:
        raise HTTPException(
            status_code=403,
            detail="El estudiante no pertenece al curso de esta actividad",
        )

    # Crear entrega
    nueva_entrega = Entrega(
        id_actividad=datos.id_actividad,
        id_usuario=datos.id_usuario,
        fecha_entrega=datos.fecha_entrega,
        estado=datos.estado,
        descripcion=datos.descripcion,
        comentario_docente=datos.comentario_docente,
        archivo=datos.archivo,
        nota=datos.nota,
    )

    db.add(nueva_entrega)
    db.commit()
    db.refresh(nueva_entrega)

    return nueva_entrega


# GET /entregas
@router.get(
    "",
    response_model=list[EntregaResponse],
)
def listar_entregas(
    db: Session = Depends(get_db),
):
    return db.query(Entrega).all()


# GET /entregas/{id_entrega}
@router.get(
    "/{id_entrega}",
    response_model=EntregaResponse,
)
def obtener_entrega(
    id_entrega: int,
    db: Session = Depends(get_db),
):
    entrega = (
        db.query(Entrega)
        .filter(
            Entrega.id_entrega == id_entrega
        )
        .first()
    )

    if not entrega:
        raise HTTPException(
            status_code=404,
            detail="Entrega no encontrada",
        )

    return entrega

# PUT /entregas/{id_entrega}/calificacion
@router.put(
    "/{id_entrega}/calificacion",
    response_model=EntregaResponse,
)
def calificar_entrega(
    id_entrega: int,
    datos: EntregaCalificacion,
    db: Session = Depends(get_db),
):
    # Buscar entrega
    entrega = (
        db.query(Entrega)
        .filter(
            Entrega.id_entrega == id_entrega
        )
        .first()
    )

    if not entrega:
        raise HTTPException(
            status_code=404,
            detail="Entrega no encontrada",
        )

    # Registrar calificación
    entrega.nota = datos.nota

    db.commit()
    db.refresh(entrega)

    return entrega