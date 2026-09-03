from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.conection import get_db
from app.dependencias.auth import get_current_user, require_role

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
    # --------------------------------------------------------
    # El usuario del JWT debe ser el mismo que figura
    # como propietario del material.
    # --------------------------------------------------------

    if datos.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes publicar material utilizando otro usuario",
        )

    # --------------------------------------------------------
    # Verificar materia
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
    # Verificar curso de la materia
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
    # El docente y la materia deben pertenecer al mismo colegio
    # --------------------------------------------------------

    if current_user.id_colegio != curso.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes gestionar material de otro colegio",
        )

    # --------------------------------------------------------
    # Verificar que el docente esté asignado a la materia
    # --------------------------------------------------------

    asignacion = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario == current_user.id_usuario,
            DocenteMateria.id_materia == datos.id_materia,
        )
        .first()
    )

    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El docente no está autorizado para gestionar esta materia",
        )

    # --------------------------------------------------------
    # Crear material
    # --------------------------------------------------------

    nuevo_material = MaterialAcademico(
        id_usuario=current_user.id_usuario,
        id_materia=datos.id_materia,
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
    # --------------------------------------------------------
    # ADMINISTRADOR
    # Puede consultar los materiales de su colegio.
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "administrador":

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
                Curso.id_colegio == current_user.id_colegio
            )
            .all()
        )

        return materiales

    # --------------------------------------------------------
    # DOCENTE
    # Solo materiales de materias que tiene asignadas.
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "docente":

        materiales = (
            db.query(MaterialAcademico)
            .join(
                DocenteMateria,
                MaterialAcademico.id_materia
                == DocenteMateria.id_materia,
            )
            .join(
                Materia,
                MaterialAcademico.id_materia
                == Materia.id_materia,
            )
            .join(
                Curso,
                Materia.id_curso == Curso.id_curso,
            )
            .filter(
                DocenteMateria.id_usuario
                == current_user.id_usuario,
                Curso.id_colegio
                == current_user.id_colegio,
            )
            .all()
        )

        return materiales

    # --------------------------------------------------------
    # ESTUDIANTE
    # Solo materiales de las materias de su curso.
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "estudiante":

        usuario_curso = (
            db.query(UsuarioCurso)
            .join(
                Curso,
                UsuarioCurso.id_curso == Curso.id_curso,
            )
            .filter(
                UsuarioCurso.id_usuario
                == current_user.id_usuario,
                Curso.id_colegio
                == current_user.id_colegio,
            )
            .first()
        )

        if not usuario_curso:
            return []

        materiales = (
            db.query(MaterialAcademico)
            .join(
                Materia,
                MaterialAcademico.id_materia
                == Materia.id_materia,
            )
            .filter(
                Materia.id_curso
                == usuario_curso.id_curso
            )
            .all()
        )

        return materiales

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Rol de usuario no autorizado",
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
    material = (
        db.query(MaterialAcademico)
        .filter(
            MaterialAcademico.id_material == id_material
        )
        .first()
    )

    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material académico no encontrado",
        )

    # --------------------------------------------------------
    # Obtener materia y curso
    # --------------------------------------------------------

    materia = (
        db.query(Materia)
        .filter(
            Materia.id_materia == material.id_materia
        )
        .first()
    )

    if not materia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia asociada al material no encontrada",
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
            detail="Curso asociado al material no encontrado",
        )

    # --------------------------------------------------------
    # ADMINISTRADOR
    # --------------------------------------------------------

    if current_user.tipo_de_usuario == "administrador":

        if curso.id_colegio != current_user.id_colegio:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes consultar material de otro colegio",
            )

        return material

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
                == material.id_materia,
            )
            .first()
        )

        if not asignacion:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No estás autorizado para consultar este material",
            )

        if curso.id_colegio != current_user.id_colegio:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="No puedes consultar material de otro colegio",
            )

        return material

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
                detail="No puedes consultar material de otro curso",
            )

        return material

    raise HTTPException(
        status_code=status.HTTP_403_FORBIDDEN,
        detail="Rol de usuario no autorizado",
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
    # --------------------------------------------------------
    # Buscar material
    # --------------------------------------------------------

    material = (
        db.query(MaterialAcademico)
        .filter(
            MaterialAcademico.id_material == id_material
        )
        .first()
    )

    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material académico no encontrado",
        )

    # --------------------------------------------------------
    # Verificar propietario
    # --------------------------------------------------------

    if material.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes editar material publicado por otro docente",
        )

    # --------------------------------------------------------
    # Verificar materia
    # --------------------------------------------------------

    materia = (
        db.query(Materia)
        .filter(
            Materia.id_materia == material.id_materia
        )
        .first()
    )

    if not materia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia asociada al material no encontrada",
        )

    # --------------------------------------------------------
    # Verificar curso/colegio
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

    if curso.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes editar material de otro colegio",
        )

    # --------------------------------------------------------
    # Verificar que el docente siga asignado a la materia
    # --------------------------------------------------------

    asignacion = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario
            == current_user.id_usuario,
            DocenteMateria.id_materia
            == material.id_materia,
        )
        .first()
    )

    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El docente no está autorizado para gestionar esta materia",
        )

    # --------------------------------------------------------
    # Actualizar
    # --------------------------------------------------------

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
    # --------------------------------------------------------
    # Buscar material
    # --------------------------------------------------------

    material = (
        db.query(MaterialAcademico)
        .filter(
            MaterialAcademico.id_material == id_material
        )
        .first()
    )

    if not material:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Material académico no encontrado",
        )

    # --------------------------------------------------------
    # Verificar propietario
    # --------------------------------------------------------

    if material.id_usuario != current_user.id_usuario:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes eliminar material publicado por otro docente",
        )

    # --------------------------------------------------------
    # Verificar materia
    # --------------------------------------------------------

    materia = (
        db.query(Materia)
        .filter(
            Materia.id_materia == material.id_materia
        )
        .first()
    )

    if not materia:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Materia asociada al material no encontrada",
        )

    # --------------------------------------------------------
    # Verificar curso
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

    if curso.id_colegio != current_user.id_colegio:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="No puedes eliminar material de otro colegio",
        )

    # --------------------------------------------------------
    # Verificar asignación docente-materia
    # --------------------------------------------------------

    asignacion = (
        db.query(DocenteMateria)
        .filter(
            DocenteMateria.id_usuario
            == current_user.id_usuario,
            DocenteMateria.id_materia
            == material.id_materia,
        )
        .first()
    )

    if not asignacion:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="El docente no está autorizado para gestionar esta materia",
        )

    # --------------------------------------------------------
    # Eliminar
    # --------------------------------------------------------

    db.delete(material)
    db.commit()

    return {
        "success": True,
        "mensaje": "Material académico eliminado correctamente",
        "data": None,
    }