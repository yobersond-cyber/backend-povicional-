
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.dependencias.auth import (
    get_current_user,
    require_role,
    obtener_rol_efectivo,
)

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
# FUNCIONES AUXILIARES
# ============================================================

def obtener_materia_o_error(
    db: Session,
    id_materia: int,
) -> Materia:
    materia = (
        db.query(Materia)
        .filter(Materia.id_materia == id_materia)
        .first()
    )

    if materia is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia no encontrada",
        )

    return materia


def obtener_curso_o_error(
    db: Session,
    id_curso: int,
) -> Curso:
    curso = (
        db.query(Curso)
        .filter(Curso.id_curso == id_curso)
        .first()
    )

    if curso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso asociado a la materia no encontrado",
        )

    return curso


def verificar_colegio(
    curso: Curso,
    usuario: Usuario,
) -> None:
    if (
        usuario.id_colegio is None
        or curso.id_colegio != usuario.id_colegio
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes acceder a actividades de otro colegio",
        )


def verificar_asignacion_docente(
    db: Session,
    id_usuario: int,
    id_materia: int,
) -> None:
    asignacion = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario == id_usuario,
            DocenteMateria.id_materia == id_materia,
        )
        .first()
    )

    if asignacion is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El docente no está autorizado para esta materia",
        )


def obtener_actividad_o_error(
    db: Session,
    id_actividad: int,
) -> Actividad:
    actividad = (
        db.query(Actividad)
        .filter(Actividad.id_actividad == id_actividad)
        .first()
    )

    if actividad is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Actividad no encontrada",
        )

    return actividad


def obtener_materia_y_curso_de_actividad(
    db: Session,
    actividad: Actividad,
) -> tuple[Materia, Curso]:
    materia = obtener_materia_o_error(
        db,
        actividad.id_materia,
    )

    curso = obtener_curso_o_error(
        db,
        materia.id_curso,
    )

    return materia, curso


def verificar_acceso_actividad(
    db: Session,
    actividad: Actividad,
    current_user: Usuario,
) -> None:
    """
    Comprueba el acceso a una actividad individual según el rol
    efectivo del usuario y las relaciones académicas existentes.
    """

    rol = obtener_rol_efectivo(current_user)

    materia, curso = obtener_materia_y_curso_de_actividad(
        db,
        actividad,
    )

    # COORDINADOR: únicamente puede consultar actividades
    # del colegio al que está asociado.
    if rol == "coordinador":
        verificar_colegio(curso, current_user)
        return

    # DOCENTE: debe pertenecer al colegio correcto y estar
    # asignado a la materia.
    if rol == "docente":
        verificar_colegio(curso, current_user)

        verificar_asignacion_docente(
            db,
            current_user.id_usuario,
            materia.id_materia,
        )
        return

    # ESTUDIANTE: únicamente puede consultar actividades
    # de su curso y de su colegio.
    if rol == "estudiante":
        verificar_colegio(curso, current_user)

        usuario_curso = (
            db.query(UsuarioCurso)
            .filter(
                UsuarioCurso.id_usuario
                == current_user.id_usuario,
                UsuarioCurso.id_curso == curso.id_curso,
            )
            .first()
        )

        if usuario_curso is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes consultar actividades de otro curso",
            )

        return

    # El administrador global no usa este endpoint para consultar
    # actividades académicas de los colegios.
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Rol no autorizado para consultar esta actividad",
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
    # La actividad debe quedar registrada a nombre del docente
    # autenticado, nunca de otro usuario.
    if datos.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes crear una actividad utilizando otro usuario",
        )

    materia = obtener_materia_o_error(
        db,
        datos.id_materia,
    )

    curso = obtener_curso_o_error(
        db,
        materia.id_curso,
    )

    verificar_colegio(curso, current_user)

    verificar_asignacion_docente(
        db,
        current_user.id_usuario,
        materia.id_materia,
    )

    if datos.fecha_limite < datos.fecha_publicacion:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha límite no puede ser anterior a la fecha de publicación",
        )

    nueva_actividad = Actividad(
        id_usuario=current_user.id_usuario,
        id_materia=materia.id_materia,
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
    rol = obtener_rol_efectivo(current_user)

    # COORDINADOR: actividades de su colegio.
    if rol == "coordinador":
        if current_user.id_colegio is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El coordinador no tiene un colegio asignado",
            )

        return (
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
                Curso.id_colegio == current_user.id_colegio,
            )
            .all()
        )

    # DOCENTE: actividades de sus materias asignadas,
    # siempre dentro de su colegio.
    if rol == "docente":
        if current_user.id_colegio is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El docente no tiene un colegio asignado",
            )

        return (
            db.query(Actividad)
            .join(
                DocenteMateria,
                Actividad.id_materia
                == DocenteMateria.id_materia,
            )
            .join(
                Materia,
                Actividad.id_materia == Materia.id_materia,
            )
            .join(
                Curso,
                Materia.id_curso == Curso.id_curso,
            )
            .filter(
                DocenteMateria.id_usuario
                == current_user.id_usuario,
                Curso.id_colegio == current_user.id_colegio,
            )
            .distinct()
            .all()
        )

    # ESTUDIANTE: actividades de su curso y colegio.
    if rol == "estudiante":
        if current_user.id_colegio is None:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="El estudiante no tiene un colegio asignado",
            )

        usuario_curso = (
            db.query(UsuarioCurso)
            .join(
                Curso,
                UsuarioCurso.id_curso == Curso.id_curso,
            )
            .filter(
                UsuarioCurso.id_usuario
                == current_user.id_usuario,
                Curso.id_colegio == current_user.id_colegio,
            )
            .first()
        )

        if usuario_curso is None:
            return []

        return (
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
                Curso.id_curso == usuario_curso.id_curso,
                Curso.id_colegio == current_user.id_colegio,
            )
            .all()
        )

    # El administrador global no consulta aquí actividades
    # de todos los colegios.
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Rol no autorizado para consultar actividades",
    )


# ============================================================
# GET /actividades/{id_actividad}
# Obtener una actividad específica
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
    actividad = obtener_actividad_o_error(
        db,
        id_actividad,
    )

    verificar_acceso_actividad(
        db,
        actividad,
        current_user,
    )

    return actividad


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
    actividad = obtener_actividad_o_error(
        db,
        id_actividad,
    )

    # Solo el docente creador puede modificar la actividad.
    if actividad.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes editar una actividad creada por otro docente",
        )

    # Verificar que la actividad actual pertenece al colegio
    # y a una materia que el docente aún tiene asignada.
    _, curso_actual = obtener_materia_y_curso_de_actividad(
        db,
        actividad,
    )

    verificar_colegio(curso_actual, current_user)

    verificar_asignacion_docente(
        db,
        current_user.id_usuario,
        actividad.id_materia,
    )

    # Solo se modifican los campos enviados por el cliente.
    cambios = datos.dict(exclude_unset=True)

    # Los campos opcionales del esquema de actualización no
    # pueden establecer como NULL valores requeridos en la BD.
    campos_requeridos = {
        "titulo",
        "descripcion",
        "fecha_publicacion",
        "fecha_limite",
        "id_materia",
    }

    for campo in campos_requeridos.intersection(cambios):
        if cambios[campo] is None:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"El campo '{campo}' no puede ser nulo",
            )

    # Si se cambia la materia, validar también la nueva materia,
    # su colegio y la asignación del docente.
    id_materia_nueva = cambios.get(
        "id_materia",
        actividad.id_materia,
    )

    if id_materia_nueva != actividad.id_materia:
        materia_nueva = obtener_materia_o_error(
            db,
            id_materia_nueva,
        )

        curso_nuevo = obtener_curso_o_error(
            db,
            materia_nueva.id_curso,
        )

        verificar_colegio(curso_nuevo, current_user)

        verificar_asignacion_docente(
            db,
            current_user.id_usuario,
            materia_nueva.id_materia,
        )

    # Validar las fechas resultantes, combinando los valores
    # nuevos con los que ya existen.
    fecha_publicacion_final = cambios.get(
        "fecha_publicacion",
        actividad.fecha_publicacion,
    )

    fecha_limite_final = cambios.get(
        "fecha_limite",
        actividad.fecha_limite,
    )

    if fecha_limite_final < fecha_publicacion_final:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La fecha límite no puede ser anterior a la fecha de publicación",
        )

    # No se permite modificar el creador mediante esta ruta.
    cambios.pop("id_usuario", None)

    for campo, valor in cambios.items():
        setattr(actividad, campo, valor)

    db.commit()
    db.refresh(actividad)

    return actividad
