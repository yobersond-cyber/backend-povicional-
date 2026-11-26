
from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    HTTPException,
    status,
)
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.dependencias.auth import require_role
from app.models.Usuarios import Usuario
from app.models.curso import Curso
from app.models.docente_asignacion import DocenteAsignacion
from app.models.usuario_curso import UsuarioCurso
from app.models.materia import Materia

from app.schemas.curso import (
    CursoCreate,
    CursoUpdate,
    CursoResponse,
)
from app.schemas.base import APIResponse

from app.services.notificaciones_service import notificar_usuario


router = APIRouter(
    prefix="/cursos",
    tags=["Cursos"],
)


def validar_colegio(
    id_colegio: int,
    current_user: Usuario,
):
    """Impide que un coordinador gestione cursos de otro colegio."""
    if (
        current_user.id_colegio is None
        or id_colegio != current_user.id_colegio
    ):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes gestionar cursos de otro colegio",
        )


def validar_numero_curso(
    db: Session,
    id_colegio: int,
    numero_curso: str,
    id_curso_excluir: int | None = None,
):
    """Evita números de curso duplicados dentro del mismo colegio."""
    consulta = db.query(Curso).filter(
        Curso.id_colegio == id_colegio,
        Curso.numero_curso == numero_curso,
    )

    if id_curso_excluir is not None:
        consulta = consulta.filter(
            Curso.id_curso != id_curso_excluir
        )

    if consulta.first():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este curso ya existe en este colegio",
        )


def obtener_nombre_curso(curso: Curso) -> str:
    return (
        f"{curso.grado} - {curso.numero_curso}"
    )


def notificar_actualizacion_curso(
    background_tasks: BackgroundTasks,
    db: Session,
    curso: Curso,
    datos_anteriores: dict,
) -> None:
    """
    Notifica a estudiantes y docentes del curso cuando
    cambia alguno de sus datos académicos.
    """

    nombre_anterior = (
        f"{datos_anteriores['grado']} - "
        f"{datos_anteriores['numero_curso']}"
    )

    nombre_actual = obtener_nombre_curso(curso)

    cambios = []

    if datos_anteriores["grado"] != curso.grado:
        cambios.append(
            f"Grado: {datos_anteriores['grado']} → {curso.grado}"
        )

    if datos_anteriores["numero_curso"] != curso.numero_curso:
        cambios.append(
            f"Número de curso: "
            f"{datos_anteriores['numero_curso']} → "
            f"{curso.numero_curso}"
        )

    if datos_anteriores["jornada"] != curso.jornada:
        cambios.append(
            f"Jornada: {datos_anteriores['jornada']} → "
            f"{curso.jornada}"
        )

    if not cambios:
        return

    detalle = (
        f"Curso anterior: {nombre_anterior}\n"
        f"Curso actualizado: {nombre_actual}\n"
        f"Cambios realizados:\n"
        + "\n".join(cambios)
    )

    destinatarios = (
        db.query(Usuario)
        .join(
            UsuarioCurso,
            Usuario.id_usuario == UsuarioCurso.id_usuario,
        )
        .filter(
            UsuarioCurso.id_curso == curso.id_curso,
            Usuario.tipo_de_usuario == "estudiante",
            Usuario.id_colegio == curso.id_colegio,
            Usuario.correo.isnot(None),
        )
        .distinct()
        .all()
    )

    docentes = (
        db.query(Usuario)
        .join(
            DocenteAsignacion,
            Usuario.id_usuario == DocenteAsignacion.id_usuario,
        )
        .filter(
            DocenteAsignacion.id_curso == curso.id_curso,
            Usuario.tipo_de_usuario == "docente",
            Usuario.id_colegio == curso.id_colegio,
            Usuario.correo.isnot(None),
        )
        .distinct()
        .all()
    )

    usuarios_notificados = {
        usuario.id_usuario: usuario
        for usuario in destinatarios + docentes
    }

    for usuario in usuarios_notificados.values():
        if not usuario.correo or not usuario.correo.strip():
            continue

        nombre_usuario = (
            f"{usuario.nombres_compl} "
            f"{usuario.apellidos_compl}"
        ).strip()

        background_tasks.add_task(
            notificar_usuario,
            destinatario=usuario.correo.strip(),
            nombres_usuario=nombre_usuario,
            asunto="Actualización de curso - APRENZY",
            titulo="Se ha actualizado la información de tu curso",
            mensaje=(
                f"Te informamos que el curso {nombre_anterior} "
                f"ha sido actualizado. "
                f"Ahora corresponde al curso {nombre_actual}. "
                f"Consulta los cambios en APRENZY."
            ),
            detalle=detalle,
        )


# ============================================================
# Crear curso
# Solo coordinadores.
# ============================================================

@router.post(
    "",
    response_model=APIResponse[CursoResponse],
    status_code=status.HTTP_201_CREATED,
)
def crear_curso(
    datos: CursoCreate,
    current_user: Usuario = Depends(
        require_role("coordinador")
    ),
    db: Session = Depends(get_db),
):
    validar_colegio(datos.id_colegio, current_user)

    validar_numero_curso(
        db=db,
        id_colegio=current_user.id_colegio,
        numero_curso=datos.numero_curso,
    )

    nuevo_curso = Curso(
        id_colegio=current_user.id_colegio,
        numero_curso=datos.numero_curso,
        grado=datos.grado,
        jornada=datos.jornada,
    )

    try:
        db.add(nuevo_curso)
        db.commit()
        db.refresh(nuevo_curso)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo crear el curso",
        )

    return APIResponse(
        success=True,
        mensaje="Curso creado exitosamente",
        data=nuevo_curso,
    )


# ============================================================
# Listar cursos del colegio del coordinador.
# ============================================================

@router.get(
    "",
    response_model=APIResponse[list[CursoResponse]],
)
def listar_cursos(
    current_user: Usuario = Depends(
        require_role("coordinador")
    ),
    db: Session = Depends(get_db),
):
    if current_user.id_colegio is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El coordinador no tiene un colegio asignado",
        )

    cursos = (
        db.query(Curso)
        .filter(Curso.id_colegio == current_user.id_colegio)
        .order_by(Curso.grado.asc(), Curso.numero_curso.asc())
        .all()
    )

    return APIResponse(
        success=True,
        mensaje="Cursos del colegio recuperados exitosamente",
        data=cursos,
    )


# ============================================================
# Consultar un curso.
# Solo si pertenece al colegio del coordinador.
# ============================================================

@router.get(
    "/{id_curso}",
    response_model=APIResponse[CursoResponse],
)
def obtener_curso(
    id_curso: int,
    current_user: Usuario = Depends(
        require_role("coordinador")
    ),
    db: Session = Depends(get_db),
):
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

    validar_colegio(curso.id_colegio, current_user)

    return APIResponse(
        success=True,
        mensaje="Curso obtenido correctamente",
        data=curso,
    )


# ============================================================
# Actualizar curso.
# El curso no puede trasladarse a otro colegio.
# ============================================================

@router.put(
    "/{id_curso}",
    response_model=APIResponse[CursoResponse],
)
def actualizar_curso(
    id_curso: int,
    datos: CursoUpdate,
    background_tasks: BackgroundTasks,
    current_user: Usuario = Depends(
        require_role("coordinador")
    ),
    db: Session = Depends(get_db),
):
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

    validar_colegio(curso.id_colegio, current_user)

    # El cuerpo de la petición no puede cambiar el colegio.
    if datos.id_colegio != curso.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes trasladar un curso a otro colegio",
        )

    validar_numero_curso(
        db=db,
        id_colegio=curso.id_colegio,
        numero_curso=datos.numero_curso,
        id_curso_excluir=curso.id_curso,
    )

    datos_anteriores = {
        "numero_curso": curso.numero_curso,
        "grado": curso.grado,
        "jornada": curso.jornada,
    }

    curso.numero_curso = datos.numero_curso
    curso.grado = datos.grado
    curso.jornada = datos.jornada

    try:
        db.commit()
        db.refresh(curso)
    except Exception:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="No se pudo actualizar el curso",
        )

    notificar_actualizacion_curso(
        background_tasks=background_tasks,
        db=db,
        curso=curso,
        datos_anteriores=datos_anteriores,
    )

    return APIResponse(
        success=True,
        mensaje="Curso actualizado correctamente",
        data=curso,
    )
