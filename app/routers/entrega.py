from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.dependencias.auth import get_current_user, require_role

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


# ============================================================
# POST /entregas
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
    # --------------------------------------------------------
    # El estudiante solamente puede crear su propia entrega
    # --------------------------------------------------------

    if datos.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes registrar una entrega a nombre de otro usuario",
        )

    # --------------------------------------------------------
    # Buscar actividad
    # --------------------------------------------------------

    actividad = (
        db.query(Actividad)
        .filter(
            Actividad.id_actividad == datos.id_actividad
        )
        .first()
    )

    if not actividad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Actividad no encontrada",
        )

    # --------------------------------------------------------
    # Buscar materia de la actividad
    # --------------------------------------------------------

    materia = (
        db.query(Materia)
        .filter(
            Materia.id_materia == actividad.id_materia
        )
        .first()
    )

    if not materia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia de la actividad no encontrada",
        )

    # --------------------------------------------------------
    # Buscar curso
    # --------------------------------------------------------

    curso = (
        db.query(Curso)
        .filter(
            Curso.id_curso == materia.id_curso
        )
        .first()
    )

    if not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso de la actividad no encontrado",
        )

    # --------------------------------------------------------
    # Verificar que el estudiante pertenezca al curso
    # --------------------------------------------------------

    pertenece_curso = (
        db.query(UsuarioCurso)
        .filter(
            UsuarioCurso.id_usuario == current_user.id_usuario,
            UsuarioCurso.id_curso == curso.id_curso,
        )
        .first()
    )

    if not pertenece_curso:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El estudiante no pertenece al curso de esta actividad",
        )

    # --------------------------------------------------------
    # Verificar que no exista ya una entrega para la misma
    # actividad por parte del estudiante
    #
    # No agregamos una regla nueva de negocio:
    # simplemente evitamos duplicar una entrega existente.
    # --------------------------------------------------------

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

    # --------------------------------------------------------
    # Crear entrega
    # --------------------------------------------------------

    nueva_entrega = Entrega(
        id_actividad=actividad.id_actividad,
        id_usuario=current_user.id_usuario,
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


# ============================================================
# GET /entregas
# ============================================================

@router.get(
    "",
    response_model=list[EntregaResponse],
)
def listar_entregas(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    # --------------------------------------------------------
    # ADMINISTRADOR
    # Puede consultar entregas de su colegio
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "administrador":

        entregas = (
            db.query(Entrega)
            .join(Usuario, Entrega.id_usuario == Usuario.id_usuario)
            .filter(
                Usuario.id_colegio == current_user.id_colegio
            )
            .all()
        )

        return entregas

    # --------------------------------------------------------
    # ESTUDIANTE
    # Solo sus propias entregas
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "estudiante":

        return (
            db.query(Entrega)
            .filter(
                Entrega.id_usuario == current_user.id_usuario
            )
            .all()
        )

    # --------------------------------------------------------
    # DOCENTE
    # Solo entregas de actividades de materias que tiene
    # asignadas
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "docente":

        entregas = (
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
                DocenteMateria,
                DocenteMateria.id_materia == Materia.id_materia,
            )
            .join(
                Usuario,
                Entrega.id_usuario == Usuario.id_usuario,
            )
            .filter(
                DocenteMateria.id_usuario == current_user.id_usuario,
                Usuario.id_colegio == current_user.id_colegio,
            )
            .all()
        )

        return entregas

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permisos para consultar entregas",
    )


# ============================================================
# GET /entregas/{id_entrega}
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
    # --------------------------------------------------------
    # Buscar entrega
    # --------------------------------------------------------

    entrega = (
        db.query(Entrega)
        .filter(
            Entrega.id_entrega == id_entrega
        )
        .first()
    )

    if not entrega:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrega no encontrada",
        )

    # --------------------------------------------------------
    # Buscar estudiante propietario
    # --------------------------------------------------------

    estudiante = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == entrega.id_usuario
        )
        .first()
    )

    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante de la entrega no encontrado",
        )

    # --------------------------------------------------------
    # ADMINISTRADOR
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "administrador":

        if estudiante.id_colegio != current_user.id_colegio:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a esta entrega",
            )

        return entrega

    # --------------------------------------------------------
    # ESTUDIANTE
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "estudiante":

        if entrega.id_usuario != current_user.id_usuario:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a esta entrega",
            )

        return entrega

    # --------------------------------------------------------
    # DOCENTE
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "docente":

        actividad = (
            db.query(Actividad)
            .filter(
                Actividad.id_actividad == entrega.id_actividad
            )
            .first()
        )

        if not actividad:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Actividad de la entrega no encontrada",
            )

        materia = (
            db.query(Materia)
            .filter(
                Materia.id_materia == actividad.id_materia
            )
            .first()
        )

        if not materia:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Materia de la actividad no encontrada",
            )

        asignacion = (
            db.query(DocenteMateria)
            .filter(
                DocenteMateria.id_usuario == current_user.id_usuario,
                DocenteMateria.id_materia == materia.id_materia,
            )
            .first()
        )

        if not asignacion:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a esta entrega",
            )

        if estudiante.id_colegio != current_user.id_colegio:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No tienes acceso a esta entrega",
            )

        return entrega

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="No tienes permisos para consultar esta entrega",
    )


# ============================================================
# PUT /entregas/{id_entrega}/calificacion
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
    # --------------------------------------------------------
    # Buscar entrega
    # --------------------------------------------------------

    entrega = (
        db.query(Entrega)
        .filter(
            Entrega.id_entrega == id_entrega
        )
        .first()
    )

    if not entrega:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Entrega no encontrada",
        )

    # --------------------------------------------------------
    # Buscar actividad
    # --------------------------------------------------------

    actividad = (
        db.query(Actividad)
        .filter(
            Actividad.id_actividad == entrega.id_actividad
        )
        .first()
    )

    if not actividad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Actividad de la entrega no encontrada",
        )

    # --------------------------------------------------------
    # Buscar materia
    # --------------------------------------------------------

    materia = (
        db.query(Materia)
        .filter(
            Materia.id_materia == actividad.id_materia
        )
        .first()
    )

    if not materia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia de la actividad no encontrada",
        )

    # --------------------------------------------------------
    # Verificar que el docente tenga asignada la materia
    # --------------------------------------------------------

    asignacion = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario == current_user.id_usuario,
            DocenteMateria.id_materia == materia.id_materia,
        )
        .first()
    )

    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para calificar esta entrega",
        )

    # --------------------------------------------------------
    # Verificar colegio
    # --------------------------------------------------------

    estudiante = (
        db.query(Usuario)
        .filter(
            Usuario.id_usuario == entrega.id_usuario
        )
        .first()
    )

    if not estudiante:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Estudiante de la entrega no encontrado",
        )

    if estudiante.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No tienes permisos para calificar esta entrega",
        )

    # --------------------------------------------------------
    # La validación 0-100 también está definida en el schema.
    # Se vuelve a validar aquí para mantener la regla clara.
    # --------------------------------------------------------

    if datos.nota < 0 or datos.nota > 100:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nota debe estar entre 0 y 100",
        )

    # --------------------------------------------------------
    # Registrar calificación
    # --------------------------------------------------------

    entrega.nota = datos.nota

    db.commit()
    db.refresh(entrega)

    return entrega