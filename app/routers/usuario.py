from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload

from app.database.conection import SessionLocal
from app.models.Usuarios import Usuario
from app.models.incapacidad import Incapacidad
from app.schemas.usuario import (
    UsuarioCreate,
    UsuarioResponse,
    UsuarioLogin,
    EstudianteDetalleResponse,
    DocenteDetalleResponse,
)
from app.schemas.base import APIResponse
from app.core.security import hash_password, verify_password, create_access_token


router = APIRouter(
    prefix="/usuarios",
    tags=["Usuarios"],
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# 1. Crear usuario
@router.post(
    "",
    response_model=APIResponse[UsuarioResponse],
    status_code=status.HTTP_201_CREATED,
)
def crear_usuario(
    usuario: UsuarioCreate,
    db: Session = Depends(get_db),
):
    if db.query(Usuario).filter(Usuario.codigo_usuario == usuario.codigo_usuario).first():
        raise HTTPException(status_code=400, detail="El código de usuario ya existe")

    if db.query(Usuario).filter(Usuario.documento == usuario.documento).first():
        raise HTTPException(status_code=400, detail="El documento ya existe")

    if db.query(Usuario).filter(Usuario.correo == usuario.correo).first():
        raise HTTPException(status_code=400, detail="El correo ya existe")

    nuevo_usuario = Usuario(
        id_colegio=usuario.id_colegio,
        codigo_usuario=usuario.codigo_usuario,
        documento=usuario.documento,
        nombres_compl=usuario.nombres_compl,
        apellidos_compl=usuario.apellidos_compl,
        telefono=usuario.telefono,
        correo=usuario.correo,
        contrasena=hash_password(usuario.contrasena),
        tipo_de_usuario=usuario.tipo_de_usuario,
        jornada=usuario.jornada,
    )

    db.add(nuevo_usuario)
    db.commit()
    db.refresh(nuevo_usuario)

    return APIResponse(
        success=True,
        mensaje="Usuario registrado exitosamente",
        data=nuevo_usuario,
    )


# 2. Login de usuario
@router.post(
    "/login", 
    response_model=APIResponse[dict]
)
def login_usuario(
    datos: UsuarioLogin,
    db: Session = Depends(get_db),
):
    usuario = db.query(Usuario).filter(Usuario.correo == datos.correo).first()
    if not usuario or not verify_password(datos.contrasena, usuario.contrasena):
        raise HTTPException(
            status_code=401,
            detail="Correo o contraseña incorrectos",
        )

    token = create_access_token(
        {"sub": str(usuario.id_usuario), "rol": usuario.tipo_de_usuario}
    )

    return APIResponse(
        success=True,
        mensaje="Inicio de sesión exitoso",
        data={
            "access_token": token,
            "token_type": "bearer",
            "id_usuario": usuario.id_usuario,
            "tipo_de_usuario": usuario.tipo_de_usuario,
        },
    )


# 3. Listar todos los usuarios
@router.get(
    "",
    response_model=APIResponse[list[UsuarioResponse]],
)
def listar_usuarios(
    db: Session = Depends(get_db),
):
    usuarios = db.query(Usuario).all()
    return APIResponse(
        success=True,
        mensaje="Lista general de usuarios obtenida",
        data=usuarios,
    )


# 4. Listar solo estudiantes con sus incapacidades
@router.get(
    "/estudiantes",
    response_model=APIResponse[list[EstudianteDetalleResponse]],
)
def listar_estudiantes(
    db: Session = Depends(get_db),
):
    estudiantes = (
        db.query(Usuario)
        .filter(Usuario.tipo_de_usuario == "estudiante")
        .options(joinedload(Usuario.incapacidades).joinedload(Incapacidad.apelacion))
        .all()
    )
    return APIResponse(
        success=True,
        mensaje="Estudiantes recuperados exitosamente",
        data=estudiantes,
    )


# 5. Listar solo docentes con sus materias y cursos
@router.get(
    "/docentes",
    response_model=APIResponse[list[DocenteDetalleResponse]],
)
def listar_docentes(
    db: Session = Depends(get_db),
):
    docentes = db.query(Usuario).filter(Usuario.tipo_de_usuario == "docente").all()

    resultado = []
    for doc in docentes:
        materias = [dm.materia for dm in doc.materias]
        cursos = list({dm.materia.curso for dm in doc.materias if dm.materia.curso})

        resultado.append(
            DocenteDetalleResponse(
                id_usuario=doc.id_usuario,
                id_colegio=doc.id_colegio,
                codigo_usuario=doc.codigo_usuario,
                documento=doc.documento,
                nombres_compl=doc.nombres_compl,
                apellidos_compl=doc.apellidos_compl,
                telefono=doc.telefono,
                correo=doc.correo,
                tipo_de_usuario=doc.tipo_de_usuario,
                jornada=doc.jornada,
                materias_asignadas=materias,
                cursos_asignados=cursos,
            )
        )

    return APIResponse(
        success=True,
        mensaje="Docentes recuperados exitosamente",
        data=resultado,
    )


# 6. Obtener usuario por ID (Debe ir DESPUÉS de las rutas específicas)
@router.get(
    "/{id_usuario}",
    response_model=APIResponse[UsuarioResponse],
)
def obtener_usuario(
    id_usuario: int,
    db: Session = Depends(get_db),
):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    return APIResponse(
        success=True,
        mensaje="Usuario obtenido correctamente",
        data=usuario,
    )


# 7. Actualizar usuario por ID
@router.put(
    "/{id_usuario}",
    response_model=APIResponse[UsuarioResponse],
)
def actualizar_usuario(
    id_usuario: int,
    datos: UsuarioCreate,
    db: Session = Depends(get_db),
):
    usuario = db.query(Usuario).filter(Usuario.id_usuario == id_usuario).first()
    if not usuario:
        raise HTTPException(status_code=404, detail="Usuario no encontrado")

    usuario.id_colegio = datos.id_colegio
    usuario.codigo_usuario = datos.codigo_usuario
    usuario.documento = datos.documento
    usuario.nombres_compl = datos.nombres_compl
    usuario.apellidos_compl = datos.apellidos_compl
    usuario.telefono = datos.telefono
    usuario.correo = datos.correo
    if datos.contrasena:
        usuario.contrasena = hash_password(datos.contrasena)
    usuario.tipo_de_usuario = datos.tipo_de_usuario
    usuario.jornada = datos.jornada

    db.commit()
    db.refresh(usuario)

    return APIResponse(
        success=True,
        mensaje="Usuario actualizado exitosamente",
        data=usuario,
    )