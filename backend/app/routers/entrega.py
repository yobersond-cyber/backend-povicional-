
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.dependencias.auth import (
    get_current_user,
    obtener_rol_efectivo,
    require_role,
)

from app.models.entrega import Entrega
from app.models.actividad import Actividad
from app.models.Usuarios import Usuario
from app.models.materia import Materia
from app.models.curso import Curso
from app.models.usuario_curso import UsuarioCurso
from app.models.docente_materia import DocenteMateria

from app.schemas.entrega import (
    EntregaCreate,
    EntregaCalificacion,
    EntregaResponse,
)


router = APIRouter(
    prefix="/entregas",
    tags=["Entregas"],
)


def obtener_colegio_de_actividad(
    actividad: Actividad,
    db: Session,
):
    """Obtiene el colegio al que pertenece una actividad."""

    materia = (
        db.query(Materia)
        .filter(Materia.id_materia == actividad.id_materia)
        .first()
    )

    if not materia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia de la actividad no encontrada",
        )

    curso = (
        db.query(Curso)
        .filter(Curso.id_curso == materia.id_curso)
        .first()
    )

    if not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso de la actividad no encontrado",
        )

    return curso.id_colegio


def obtener_entrega_o_error(
    id_entrega: int,
    db: Session,
):
    """Busca una entrega y sus datos principales."""

    entrega = (
        db.query(Entrega)
        .filter(Entrega.id_entrega == id_entrega)
        .first()
    )

    if not entrega:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrega no encontrada",
        )

    estudiante = (
        db.query(Usuario)
        .filter(Usuario.id_usuario == entrega.id_usuario)
        .first()
    )

    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante de la entrega no encontrado",
        )

    actividad = (
        db.query(Actividad)
        .filter(Actividad.id_actividad == entrega.id_actividad)
        .first()
    )

    if not actividad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Actividad de la entrega no encontrada",
        )

    colegio_id = obtener_colegio_de_actividad(actividad, db)

    return entrega, estudiante, actividad, colegio_id


def verificar_coordinador_del_colegio(
    current_user: Usuario,
    id_colegio: int,
):
    """Impide que un coordinador consulte entregas de otro colegio."""

    if (
        current_user.id_colegio is None
        or current_user.id_colegio != id_colegio
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes acceso a entregas de otro colegio",
        )


# ============================================================
# POST /entregas
# El estudiante registra su propia entrega.
# ============================================================

@router.post(
    "",
    response_model=EntregaResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_entrega(
    datos: EntregaCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("estudiante")),
):
    if datos.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes registrar una entrega a nombre de otro usuario",
        )

    actividad = (
        db.query(Actividad)
        .filter(Actividad.id_actividad == datos.id_actividad)
        .first()
    )

    if not actividad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Actividad no encontrada",
        )

    colegio_id = obtener_colegio_de_actividad(actividad, db)

    if colegio_id != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="La actividad no pertenece a tu colegio",
        )

    pertenece_curso = (
        db.query(UsuarioCurso)
        .join(
            Curso,
            UsuarioCurso.id_curso == Curso.id_curso,
        )
        .join(
            Materia,
            Materia.id_curso == Curso.id_curso,
        )
        .filter(
            UsuarioCurso.id_usuario == current_user.id_usuario,
            Materia.id_materia == actividad.id_materia,
            Curso.id_colegio == current_user.id_colegio,
        )
        .first()
    )

    if not pertenece_curso:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No perteneces al curso de esta actividad",
        )

    entrega_existente = (
        db.query(Entrega)
        .filter(
            Entrega.id_actividad == actividad.id_actividad,
            Entrega.id_usuario == current_user.id_usuario,
        )
        .first()
    )

    if entrega_existente:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Ya existe una entrega para esta actividad",
        )

    # El estudiante no puede autoasignarse una nota ni
    # comentarios del docente mediante el cuerpo de la petición.
    nueva_entrega = Entrega(
    id_actividad=actividad.id_actividad,
    id_usuario=current_user.id_usuario,
    fecha_entrega=datos.fecha_entrega,
    estado="Pendiente",
    descripcion=datos.descripcion,
    archivo=datos.archivo,
    comentario_docente=None,
    nota=None,
    )

    db.add(nueva_entrega)
    db.commit()
    db.refresh(nueva_entrega)

    return nueva_entrega


# ============================================================
# GET /entregas
# Cada rol recibe únicamente las entregas autorizadas.
# ============================================================

@router.get(
    "",
    response_model=list[EntregaResponse],
)
def listar_entregas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    rol = obtener_rol_efectivo(current_user)
    
    if rol == "estudiante":
        return (
            db.query(Entrega)
            .filter(
                Entrega.id_usuario == current_user.id_usuario
            )
            .all()
        )

    if rol == "docente":
        return (
            db.query(Entrega)
            .join(
                Actividad,
                Entrega.id_actividad == Actividad.id_actividad,
            )
            .join(
                Materia,
                Actividad.id_materia == Materia.id_materia,
            )
            .join(
                Curso,
                Materia.id_curso == Curso.id_curso,
            )
            .join(
                DocenteMateria,
                DocenteMateria.id_materia == Materia.id_materia,
            )
            .join(
                Usuario,
                Entrega.id_usuario == Usuario.id_usuario,
            )
            .filter(
                DocenteMateria.id_usuario == current_user.id_usuario,
                Curso.id_colegio == current_user.id_colegio,
                Usuario.id_colegio == current_user.id_colegio,
            )
            .all()
        )

    if rol in ("administrador", "coordinador"):
        if current_user.id_colegio is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El administrador global debe utilizar sus rutas administrativas",
            )

        return (
            db.query(Entrega)
            .join(
                Actividad,
                Entrega.id_actividad == Actividad.id_actividad,
            )
            .join(
                Materia,
                Actividad.id_materia == Materia.id_materia,
            )
            .join(
                Curso,
                Materia.id_curso == Curso.id_curso,
            )
            .join(
                Usuario,
                Entrega.id_usuario == Usuario.id_usuario,
            )
            .filter(
                Curso.id_colegio == current_user.id_colegio,
                Usuario.id_colegio == current_user.id_colegio,
            )
            .all()
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permisos para consultar entregas",
    )


# ============================================================
# GET /entregas/{id_entrega}
# Consultar una entrega concreta.
# ============================================================

@router.get(
    "/{id_entrega}",
    response_model=EntregaResponse,
)
def obtener_entrega(
    id_entrega: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    rol = obtener_rol_efectivo(current_user)
    entrega, estudiante, actividad, colegio_id = (
        obtener_entrega_o_error(id_entrega, db)
    )

    if rol == "estudiante":
        if entrega.id_usuario != current_user.id_usuario:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes consultar la entrega de otro estudiante",
            )

        if colegio_id != current_user.id_colegio:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="La entrega no pertenece a tu colegio",
            )

        return entrega

    if rol in ("administrador", "coordinador"):
        if current_user.id_colegio is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El administrador global debe utilizar sus rutas administrativas",
            )

        verificar_coordinador_del_colegio(
            current_user,
            colegio_id,
        )

        if estudiante.id_colegio != current_user.id_colegio:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El estudiante no pertenece a tu colegio",
            )

        return entrega

    if rol == "docente":
        asignacion = (
            db.query(DocenteMateria)
            .filter(
                DocenteMateria.id_usuario == current_user.id_usuario,
                DocenteMateria.id_materia == actividad.id_materia,
            )
            .first()
        )

        if not asignacion:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No estás asignado a la materia de esta entrega",
            )

        if (
            colegio_id != current_user.id_colegio
            or estudiante.id_colegio != current_user.id_colegio
        ):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes consultar entregas de otro colegio",
            )

        return entrega

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permisos para consultar esta entrega",
    )


# ============================================================
# PUT /entregas/{id_entrega}/calificacion
# Solo el docente asignado puede calificar.
# ============================================================

@router.put(
    "/{id_entrega}/calificacion",
    response_model=EntregaResponse,
)
def calificar_entrega(
    id_entrega: int,
    datos: EntregaCalificacion,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente")),
):
    entrega, estudiante, actividad, colegio_id = (
        obtener_entrega_o_error(id_entrega, db)
    )

    if colegio_id != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes calificar entregas de otro colegio",
        )

    if estudiante.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El estudiante no pertenece a tu colegio",
        )

    asignacion = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario == current_user.id_usuario,
            DocenteMateria.id_materia == actividad.id_materia,
        )
        .first()
    )

    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para calificar esta entrega",
        )

    if datos.nota < 0 or datos.nota > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nota debe estar entre 0 y 100",
        )

    entrega.nota = datos.nota

    # Si el esquema incluye comentario_docente, se podrá
    # asignar aquí después de verificar su nombre exacto.
    db.commit()
    db.refresh(entrega)

    return entrega
