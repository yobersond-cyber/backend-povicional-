
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.dependencias.auth import (
    get_current_user,
    require_role,
    obtener_rol_efectivo,
)

from app.models.material_academico import MaterialAcademico
from app.models.Usuarios import Usuario
from app.models.materia import Materia
from app.models.docente_materia import DocenteMateria
from app.models.usuario_curso import UsuarioCurso
from app.models.curso import Curso

from app.schemas.material_academico import (
    MaterialAcademicoCreate,
    MaterialAcademicoUpdate,
    MaterialAcademicoResponse,
)


router = APIRouter(
    prefix="/materiales",
    tags=["Material Académico"],
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

    if not materia:
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

    if not curso:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Curso asociado a la materia no encontrado",
        )

    return curso


def obtener_material_o_error(
    db: Session,
    id_material: int,
) -> MaterialAcademico:
    material = (
        db.query(MaterialAcademico)
        .filter(MaterialAcademico.id_material == id_material)
        .first()
    )

    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material académico no encontrado",
        )

    return material


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
) -> None:
    asignacion = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario == id_usuario,
            DocenteMateria.id_materia == id_materia,
        )
        .first()
    )

    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El docente no está autorizado para gestionar esta materia",
        )


def obtener_curso_estudiante(
    db: Session,
    usuario: Usuario,
) -> UsuarioCurso:
    usuario_curso = (
        db.query(UsuarioCurso)
        .join(
            Curso,
            UsuarioCurso.id_curso == Curso.id_curso,
        )
        .filter(
            UsuarioCurso.id_usuario == usuario.id_usuario,
            Curso.id_colegio == usuario.id_colegio,
        )
        .first()
    )

    if not usuario_curso:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El estudiante no tiene un curso asignado en su colegio",
        )

    return usuario_curso


# ============================================================
# POST /materiales
# Crear material académico
# ============================================================

@router.post(
    "",
    response_model=MaterialAcademicoResponse,
    status_code=status.HTTP_201_CREATED,
)
def crear_material(
    datos: MaterialAcademicoCreate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente")),
):
    # El docente solo puede publicar en su propio nombre.
    if datos.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes publicar material utilizando otro usuario",
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

    nuevo_material = MaterialAcademico(
        id_usuario=current_user.id_usuario,
        id_materia=materia.id_materia,
        titulo=datos.titulo,
        descripcion=datos.descripcion,
        archivo=datos.archivo,
        fecha_publicacion=datos.fecha_publicacion,
    )

    db.add(nuevo_material)
    db.commit()
    db.refresh(nuevo_material)

    return nuevo_material


# ============================================================
# GET /materiales
# Listar materiales según el usuario autenticado
# ============================================================

@router.get(
    "",
    response_model=list[MaterialAcademicoResponse],
)
def listar_materiales(
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    rol = obtener_rol_efectivo(current_user)

    # COORDINADOR:
    # Solo puede consultar materiales de su colegio.
    if rol == "coordinador":
        materiales = (
            db.query(MaterialAcademico)
            .join(
                Materia,
                MaterialAcademico.id_materia == Materia.id_materia,
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

        return materiales

    # DOCENTE:
    # Solo consulta materiales de materias que tiene asignadas
    # y que pertenecen a su colegio.
    if rol == "docente":
        materiales = (
            db.query(MaterialAcademico)
            .join(
                Materia,
                MaterialAcademico.id_materia == Materia.id_materia,
            )
            .join(
                Curso,
                Materia.id_curso == Curso.id_curso,
            )
            .join(
                DocenteMateria,
                MaterialAcademico.id_materia
                == DocenteMateria.id_materia,
            )
            .filter(
                DocenteMateria.id_usuario == current_user.id_usuario,
                Curso.id_colegio == current_user.id_colegio,
            )
            .all()
        )

        return materiales

    # ESTUDIANTE:
    # Solo consulta materiales de las materias de su curso.
    if rol == "estudiante":
        usuario_curso = obtener_curso_estudiante(
            db,
            current_user,
        )

        materiales = (
            db.query(MaterialAcademico)
            .join(
                Materia,
                MaterialAcademico.id_materia == Materia.id_materia,
            )
            .join(
                Curso,
                Materia.id_curso == Curso.id_curso,
            )
            .filter(
                Materia.id_curso == usuario_curso.id_curso,
                Curso.id_colegio == current_user.id_colegio,
            )
            .all()
        )

        return materiales

    # El administrador global no consulta materiales académicos
    # desde este módulo, para mantener separados sus permisos.
    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Tu rol no tiene permisos para consultar materiales académicos",
    )


# ============================================================
# GET /materiales/{id_material}
# Obtener un material específico
# ============================================================

@router.get(
    "/{id_material}",
    response_model=MaterialAcademicoResponse,
)
def obtener_material(
    id_material: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(get_current_user),
):
    rol = obtener_rol_efectivo(current_user)

    material = obtener_material_o_error(
        db,
        id_material,
    )

    materia = obtener_materia_o_error(
        db,
        material.id_materia,
    )

    curso = obtener_curso_o_error(
        db,
        materia.id_curso,
    )

    # COORDINADOR:
    # El material debe pertenecer a su colegio.
    if rol == "coordinador":
        verificar_colegio(curso, current_user)
        return material

    # DOCENTE:
    # Debe estar asignado a la materia y pertenecer al colegio.
    if rol == "docente":
        verificar_colegio(curso, current_user)

        verificar_asignacion_docente(
            db,
            current_user.id_usuario,
            materia.id_materia,
        )

        return material

    # ESTUDIANTE:
    # El material debe corresponder a su curso y colegio.
    if rol == "estudiante":
        verificar_colegio(curso, current_user)

        usuario_curso = obtener_curso_estudiante(
            db,
            current_user,
        )

        if usuario_curso.id_curso != curso.id_curso:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes consultar material de otro curso",
            )

        return material

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Tu rol no tiene permisos para consultar este material",
    )


# ============================================================
# PUT /materiales/{id_material}
# Editar material
# ============================================================

@router.put(
    "/{id_material}",
    response_model=MaterialAcademicoResponse,
)
def editar_material(
    id_material: int,
    datos: MaterialAcademicoUpdate,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente")),
):
    material = obtener_material_o_error(
        db,
        id_material,
    )

    # Solo el docente que publicó el material puede editarlo.
    if material.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes editar material publicado por otro docente",
        )

    materia = obtener_materia_o_error(
        db,
        material.id_materia,
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

    material.titulo = datos.titulo
    material.descripcion = datos.descripcion
    material.archivo = datos.archivo
    material.fecha_publicacion = datos.fecha_publicacion

    db.commit()
    db.refresh(material)

    return material


# ============================================================
# DELETE /materiales/{id_material}
# Eliminar material
# ============================================================

@router.delete(
    "/{id_material}",
)
def eliminar_material(
    id_material: int,
    db: Session = Depends(get_db),
    current_user: Usuario = Depends(require_role("docente")),
):
    material = obtener_material_o_error(
        db,
        id_material,
    )

    # Solo el docente que publicó el material puede eliminarlo.
    if material.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes eliminar material publicado por otro docente",
        )

    materia = obtener_materia_o_error(
        db,
        material.id_materia,
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

    db.delete(material)
    db.commit()

    return {
        "success": True,
        "mensaje": "Material académico eliminado correctamente",
        "data": None,
    }
