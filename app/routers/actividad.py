from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.dependencias.auth import get_current_user, require_role

from app.models.actividad import Actividad
from app.models.Usuarios import Usuario
from app.models.materia import Materia
from app.models.curso import Curso
from app.models.docente_materia import DocenteMateria
from app.models.usuario_curso import UsuarioCurso

from app.schemas.actividad import (
    ActividadCreate,
    ActividadUpdate,
    ActividadResponse,
)


router = APIRouter(
    prefix="/actividades",
    tags=["Actividades"],
)


# ============================================================
# POST /actividades
# Crear actividad
# ============================================================

@router.post(
    "",
    response_model=ActividadResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_actividad(
    datos: ActividadCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente")),
):
    # --------------------------------------------------------
    # Seguridad:
    # el usuario enviado debe coincidir con el usuario
    # autenticado mediante JWT.
    # --------------------------------------------------------

    if datos.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes crear una actividad utilizando otro usuario",
        )

    # --------------------------------------------------------
    # Buscar materia
    # --------------------------------------------------------

    materia = (
        db.query(Materia)
        .filter(
            Materia.id_materia == datos.id_materia
        )
        .first()
    )

    if not materia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia no encontrada",
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
            detail="Curso asociado a la materia no encontrado",
        )

    # --------------------------------------------------------
    # Verificar colegio
    # --------------------------------------------------------

    if curso.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes crear actividades para otro colegio",
        )

    # --------------------------------------------------------
    # Verificar que el docente esté asignado a la materia
    # --------------------------------------------------------

    asignacion = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario
            == current_user.id_usuario,
            DocenteMateria.id_materia
            == datos.id_materia,
        )
        .first()
    )

    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El docente no está autorizado para esta materia",
        )

    # --------------------------------------------------------
    # Validar fechas
    #
    # La fecha límite debe ser igual o posterior
    # a la fecha de publicación.
    # --------------------------------------------------------

    if datos.fecha_limite < datos.fecha_publicacion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha límite no puede ser anterior a la fecha de publicación",
        )

    # --------------------------------------------------------
    # Crear actividad
    # --------------------------------------------------------

    nueva_actividad = Actividad(
        id_usuario=current_user.id_usuario,
        id_materia=datos.id_materia,
        titulo=datos.titulo,
        descripcion=datos.descripcion,
        fecha_publicacion=datos.fecha_publicacion,
        fecha_limite=datos.fecha_limite,
    )

    db.add(nueva_actividad)
    db.commit()
    db.refresh(nueva_actividad)

    return nueva_actividad


# ============================================================
# GET /actividades
# Listar actividades según el usuario autenticado
# ============================================================

@router.get(
    "",
    response_model=list[ActividadResponse],
)
def listar_actividades(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    # --------------------------------------------------------
    # ADMINISTRADOR
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "administrador":

        actividades = (
            db.query(Actividad)
            .join(
                Materia,
                Actividad.id_materia == Materia.id_materia,
            )
            .join(
                Curso,
                Materia.id_curso == Curso.id_curso,
            )
            .filter(
                Curso.id_colegio == current_user.id_colegio
            )
            .all()
        )

        return actividades

    # --------------------------------------------------------
    # DOCENTE
    # Solo actividades de sus materias asignadas.
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "docente":

        actividades = (
            db.query(Actividad)
            .join(
                DocenteMateria,
                Actividad.id_materia
                == DocenteMateria.id_materia,
            )
            .join(
                Materia,
                Actividad.id_materia
                == Materia.id_materia,
            )
            .join(
                Curso,
                Materia.id_curso
                == Curso.id_curso,
            )
            .filter(
                DocenteMateria.id_usuario
                == current_user.id_usuario,
                Curso.id_colegio
                == current_user.id_colegio,
            )
            .all()
        )

        return actividades

    # --------------------------------------------------------
    # ESTUDIANTE
    # Solo actividades del curso al que pertenece.
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "estudiante":

        usuario_curso = (
            db.query(UsuarioCurso)
            .filter(
                UsuarioCurso.id_usuario
                == current_user.id_usuario
            )
            .first()
        )

        if not usuario_curso:
            return []

        actividades = (
            db.query(Actividad)
            .join(
                Materia,
                Actividad.id_materia
                == Materia.id_materia,
            )
            .filter(
                Materia.id_curso
                == usuario_curso.id_curso
            )
            .all()
        )

        return actividades

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Rol de usuario no autorizado",
    )


# ============================================================
# GET /actividades/{id_actividad}
# Obtener actividad específica
# ============================================================

@router.get(
    "/{id_actividad}",
    response_model=ActividadResponse,
)
def obtener_actividad(
    id_actividad: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    actividad = (
        db.query(Actividad)
        .filter(
            Actividad.id_actividad == id_actividad
        )
        .first()
    )

    if not actividad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Actividad no encontrada",
        )

    # --------------------------------------------------------
    # Materia
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
            detail="Materia asociada a la actividad no encontrada",
        )

    # --------------------------------------------------------
    # Curso
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
            detail="Curso asociado a la actividad no encontrado",
        )

    # --------------------------------------------------------
    # ADMINISTRADOR
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "administrador":

        if curso.id_colegio != current_user.id_colegio:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes consultar actividades de otro colegio",
            )

        return actividad

    # --------------------------------------------------------
    # DOCENTE
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "docente":

        asignacion = (
            db.query(DocenteMateria)
            .filter(
                DocenteMateria.id_usuario
                == current_user.id_usuario,
                DocenteMateria.id_materia
                == actividad.id_materia,
            )
            .first()
        )

        if not asignacion:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No estás autorizado para consultar esta actividad",
            )

        if curso.id_colegio != current_user.id_colegio:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes consultar actividades de otro colegio",
            )

        return actividad

    # --------------------------------------------------------
    # ESTUDIANTE
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "estudiante":

        usuario_curso = (
            db.query(UsuarioCurso)
            .filter(
                UsuarioCurso.id_usuario
                == current_user.id_usuario
            )
            .first()
        )

        if not usuario_curso:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El estudiante no tiene un curso asignado",
            )

        if usuario_curso.id_curso != curso.id_curso:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes consultar actividades de otro curso",
            )

        return actividad

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Rol de usuario no autorizado",
    )


# ============================================================
# PUT /actividades/{id_actividad}
# Editar actividad
# ============================================================

@router.put(
    "/{id_actividad}",
    response_model=ActividadResponse,
)
def editar_actividad(
    id_actividad: int,
    datos: ActividadUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente")),
):
    actividad = (
        db.query(Actividad)
        .filter(
            Actividad.id_actividad == id_actividad
        )
        .first()
    )

    if not actividad:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Actividad no encontrada",
        )

    # --------------------------------------------------------
    # Solo el docente que creó la actividad puede modificarla.
    # --------------------------------------------------------

    if actividad.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes editar una actividad creada por otro docente",
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
            detail="Materia asociada a la actividad no encontrada",
        )

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
            detail="Curso asociado a la actividad no encontrado",
        )

    if curso.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes editar actividades de otro colegio",
        )

    asignacion = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario
            == current_user.id_usuario,
            DocenteMateria.id_materia
            == actividad.id_materia,
        )
        .first()
    )

    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El docente no está autorizado para esta materia",
        )

    # --------------------------------------------------------
    # Validar fechas
    # --------------------------------------------------------

    if datos.fecha_limite < datos.fecha_publicacion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha límite no puede ser anterior a la fecha de publicación",
        )

    # --------------------------------------------------------
    # Actualizar
    # --------------------------------------------------------

    actividad.titulo = datos.titulo
    actividad.descripcion = datos.descripcion
    actividad.fecha_publicacion = datos.fecha_publicacion
    actividad.fecha_limite = datos.fecha_limite

    db.commit()
    db.refresh(actividad)

    return actividad