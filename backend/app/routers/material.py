
from datetime import datetime

from fastapi import (
    APIRouter,
    BackgroundTasks,
    Depends,
    File,
    Form,
    HTTPException,
    UploadFile,
    status,
)
from sqlalchemy.orm import Session
from sqlalchemy import func

from app.database.conection import get_db
from app.dependencias.auth import (
    get_current_user,
    require_role,
    obtener_rol_efectivo,
    verificar_acceso_academico,
)

from app.models.material_academico import MaterialAcademico
from app.models.Usuarios import Usuario
from app.models.materia import Materia
from app.models.docente_asignacion import DocenteAsignacion
from app.models.usuario_curso import UsuarioCurso
from app.models.curso import Curso

from app.schemas.material_academico import (
    MaterialAcademicoResponse,
)

from app.services.notificaciones_service import notificar_usuario
from app.services.archivo_service import (
    subir_archivo,
    eliminar_archivo,
)


router = APIRouter(
    prefix="/materiales",
    tags=["Material Académico"],
)


def obtener_material_o_error(
    db: Session,
    id_material: int,
) -> MaterialAcademico:
    material = (
        db.query(MaterialAcademico)
        .filter(MaterialAcademico.id_material == id_material)
        .first()
    )

    if material is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material académico no encontrado",
        )

    return material


def obtener_curso_de_material(
    db: Session,
    material: MaterialAcademico,
) -> Curso:
    if material.id_curso is None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Este material antiguo todavía no tiene un curso asociado",
        )

    curso = (
        db.query(Curso)
        .filter(Curso.id_curso == material.id_curso)
        .first()
    )

    if curso is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso del material no encontrado",
        )

    return curso


def obtener_asignacion_docente(
    db: Session,
    docente: Usuario,
    nombre_materia: str,
    numero_curso: str,
) -> DocenteAsignacion:
    asignaciones = (
        db.query(DocenteAsignacion)
        .join(
            Materia,
            DocenteAsignacion.id_materia == Materia.id_materia,
        )
        .join(
            Curso,
            DocenteAsignacion.id_curso == Curso.id_curso,
        )
        .filter(
            DocenteAsignacion.id_usuario == docente.id_usuario,
            func.lower(Materia.nombre_materia)
            == nombre_materia.strip().lower(),
            func.lower(Curso.numero_curso)
            == numero_curso.strip().lower(),
            Curso.id_colegio == docente.id_colegio,
        )
        .all()
    )

    if not asignaciones:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=(
                "No tienes asignada esa materia en el curso seleccionado. "
                "Verifica el nombre de la materia y el número del curso."
            ),
        )

    if len(asignaciones) > 1:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=(
                "La materia y el curso no identifican una asignación única. "
                "Debes seleccionar una opción más específica."
            ),
        )

    return asignaciones[0]


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
            detail="No puedes acceder a recursos de otro colegio",
        )


def verificar_asignacion_docente(
    db: Session,
    id_usuario: int,
    id_materia: int,
    id_curso: int,
) -> None:
    asignacion = (
        db.query(DocenteAsignacion)
        .filter(
            DocenteAsignacion.id_usuario == id_usuario,
            DocenteAsignacion.id_materia == id_materia,
            DocenteAsignacion.id_curso == id_curso,
        )
        .first()
    )

    if asignacion is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No estás asignado a esta materia en el curso seleccionado",
        )


def verificar_curso_estudiante(
    db: Session,
    usuario: Usuario,
    id_curso: int,
) -> None:
    pertenencia = (
        db.query(UsuarioCurso)
        .join(
            Curso,
            UsuarioCurso.id_curso == Curso.id_curso,
        )
        .filter(
            UsuarioCurso.id_usuario == usuario.id_usuario,
            UsuarioCurso.id_curso == id_curso,
            Curso.id_colegio == usuario.id_colegio,
        )
        .first()
    )

    if pertenencia is None:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes consultar materiales de otro curso",
        )


def verificar_acceso_material(
    db: Session,
    material: MaterialAcademico,
    current_user: Usuario,
) -> None:
    rol = obtener_rol_efectivo(current_user)
    curso = obtener_curso_de_material(db, material)

    verificar_colegio(curso, current_user)

    if rol == "coordinador":
        return

    if rol == "docente":
        verificar_asignacion_docente(
            db,
            current_user.id_usuario,
            material.id_materia,
            curso.id_curso,
        )
        return

    if rol == "estudiante":
        verificar_acceso_academico(current_user, db)

        verificar_curso_estudiante(
            db,
            current_user,
            curso.id_curso,
        )
        return

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Tu rol no tiene permisos para consultar este material",
    )


def notificar_publicacion_material(
    background_tasks: BackgroundTasks,
    db: Session,
    material: MaterialAcademico,
    materia: Materia,
    curso: Curso,
) -> None:
    estudiantes = (
        db.query(Usuario)
        .join(
            UsuarioCurso,
            Usuario.id_usuario == UsuarioCurso.id_usuario,
        )
        .filter(
            UsuarioCurso.id_curso == curso.id_curso,
            Usuario.tipo_de_usuario == "estudiante",
            Usuario.id_colegio == curso.id_colegio,
        )
        .distinct()
        .all()
    )

    for estudiante in estudiantes:
        if not estudiante.correo:
            continue

        background_tasks.add_task(
            notificar_usuario,
            destinatario=estudiante.correo,
            nombres_usuario=(
                f"{estudiante.nombres_compl} "
                f"{estudiante.apellidos_compl}"
            ),
            asunto=f"Nuevo material académico: {material.titulo}",
            titulo="Se publicó un nuevo material académico",
            mensaje=(
                f"Tu docente ha publicado un nuevo material "
                f"en la materia {materia.nombre_materia}, "
                f"correspondiente al curso {curso.numero_curso}."
            ),
            detalle=(
                f"Título: {material.titulo}\n"
                f"Descripción: {material.descripcion or 'Sin descripción'}"
            ),
        )


@router.post("")
async def crear_material(
    background_tasks: BackgroundTasks,
    titulo: str = Form(...),
    descripcion: str = Form(...),
    fecha_publicacion: datetime = Form(...),
    id_materia: int = Form(...),
    id_curso: int = Form(...),
    archivo: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente")),
):
    # Verificar que la materia y el curso estén asignados
    # al docente que está publicando el material.
    verificar_asignacion_docente(
        db,
        current_user.id_usuario,
        id_materia,
        id_curso,
    )

    materia = (
        db.query(Materia)
        .filter(Materia.id_materia == id_materia)
        .first()
    )

    curso = (
        db.query(Curso)
        .filter(Curso.id_curso == id_curso)
        .first()
    )

    if not materia or not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="La materia o el curso seleccionado no existe.",
        )

    # Subir el archivo al almacenamiento.
    archivo_subido = await subir_archivo(
        archivo,
        "materiales",
    )

    nuevo_material = MaterialAcademico(
        id_usuario=current_user.id_usuario,
        id_materia=id_materia,
        id_curso=id_curso,
        titulo=titulo,
        descripcion=descripcion,
        archivo=archivo_subido["url"],
        archivo_public_id=archivo_subido["public_id"],
        archivo_resource_type=archivo_subido["resource_type"],
        fecha_publicacion=fecha_publicacion,
    )

    try:
        db.add(nuevo_material)
        db.commit()
        db.refresh(nuevo_material)

    except Exception:
        db.rollback()

        eliminar_archivo(
            archivo_subido["public_id"],
            archivo_subido["resource_type"],
        )

        raise

    # Mantener las notificaciones por correo a los estudiantes.
    notificar_publicacion_material(
        background_tasks,
        db,
        nuevo_material,
        materia,
        curso,
    )

    return nuevo_material


@router.get(
    "",
    response_model=list[MaterialAcademicoResponse],
)
def listar_materiales(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    rol = obtener_rol_efectivo(current_user)

    if rol == "coordinador":
        return (
            db.query(MaterialAcademico)
            .join(
                Curso,
                MaterialAcademico.id_curso == Curso.id_curso,
            )
            .filter(
                Curso.id_colegio == current_user.id_colegio,
            )
            .all()
        )

    if rol == "docente":
        return (
            db.query(MaterialAcademico)
            .join(
                DocenteAsignacion,
                (MaterialAcademico.id_materia == DocenteAsignacion.id_materia)
                & (MaterialAcademico.id_curso == DocenteAsignacion.id_curso),
            )
            .join(
                Curso,
                MaterialAcademico.id_curso == Curso.id_curso,
            )
            .filter(
                DocenteAsignacion.id_usuario == current_user.id_usuario,
                Curso.id_colegio == current_user.id_colegio,
            )
            .distinct()
            .all()
        )

    if rol == "estudiante":
        verificar_acceso_academico(current_user, db)

        cursos_estudiante = (
            db.query(UsuarioCurso.id_curso)
            .join(
                Curso,
                UsuarioCurso.id_curso == Curso.id_curso,
            )
            .filter(
                UsuarioCurso.id_usuario == current_user.id_usuario,
                Curso.id_colegio == current_user.id_colegio,
            )
            .subquery()
        )

        return (
            db.query(MaterialAcademico)
            .filter(
                MaterialAcademico.id_curso.in_(cursos_estudiante),
            )
            .all()
        )

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Tu rol no tiene permisos para consultar materiales académicos",
    )


@router.get(
    "/{id_material}",
    response_model=MaterialAcademicoResponse,
)
def obtener_material(
    id_material: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    material = obtener_material_o_error(
        db,
        id_material,
    )

    verificar_acceso_material(
        db,
        material,
        current_user,
    )

    return material


@router.put(
    "/{id_material}",
    response_model=MaterialAcademicoResponse,
)
async def editar_material(
    id_material: int,
    titulo: str | None = Form(default=None),
    descripcion: str | None = Form(default=None),
    fecha_publicacion: datetime | None = Form(default=None),
    nombre_materia: str | None = Form(default=None),
    numero_curso: str | None = Form(default=None),
    archivo: UploadFile | None = File(default=None),
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente")),
):
    material = obtener_material_o_error(
        db,
        id_material,
    )

    if material.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes editar material publicado por otro docente",
        )

    verificar_acceso_material(
        db,
        material,
        current_user,
    )

    if nombre_materia is not None or numero_curso is not None:
        curso_actual = obtener_curso_de_material(
            db,
            material,
        )

        materia_actual = (
            db.query(Materia)
            .filter(Materia.id_materia == material.id_materia)
            .first()
        )

        asignacion = obtener_asignacion_docente(
            db,
            current_user,
            nombre_materia or materia_actual.nombre_materia,
            numero_curso or curso_actual.numero_curso,
        )

        material.id_materia = asignacion.id_materia
        material.id_curso = asignacion.id_curso

    if titulo is not None:
        material.titulo = titulo

    if descripcion is not None:
        material.descripcion = descripcion

    if fecha_publicacion is not None:
        material.fecha_publicacion = fecha_publicacion

    archivo_anterior_public_id = material.archivo_public_id
    archivo_anterior_resource_type = material.archivo_resource_type

    archivo_nuevo = None

    if archivo is not None and archivo.filename:
        archivo_nuevo = await subir_archivo(
            archivo,
            "materiales",
        )

        material.archivo = archivo_nuevo["url"]
        material.archivo_public_id = archivo_nuevo["public_id"]
        material.archivo_resource_type = archivo_nuevo["resource_type"]

    try:
        db.commit()
        db.refresh(material)

    except Exception:
        db.rollback()

        if archivo_nuevo:
            eliminar_archivo(
                archivo_nuevo["public_id"],
                archivo_nuevo["resource_type"],
            )

        raise

    if (
        archivo_nuevo
        and archivo_anterior_public_id
    ):
        eliminar_archivo(
            archivo_anterior_public_id,
            archivo_anterior_resource_type or "image",
        )

    return material


@router.delete("/{id_material}")
def eliminar_material(
    id_material: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente")),
):
    material = obtener_material_o_error(
        db,
        id_material,
    )

    if material.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes eliminar material publicado por otro docente",
        )

    verificar_acceso_material(
        db,
        material,
        current_user,
    )

    archivo_public_id = material.archivo_public_id
    archivo_resource_type = material.archivo_resource_type

    try:
        db.delete(material)
        db.commit()

    except Exception:
        db.rollback()
        raise

    if archivo_public_id:
        eliminar_archivo(
            archivo_public_id,
            archivo_resource_type or "image",
        )

    return {
        "success": True,
        "mensaje": "Material académico eliminado correctamente",
        "data": None,
    }
