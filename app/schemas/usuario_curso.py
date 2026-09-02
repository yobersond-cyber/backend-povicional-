from app.schemas.base import BaseSchema


class UsuarioCursoBase(BaseSchema):
    id_usuario: int
    id_curso: int


class UsuarioCursoCreate(UsuarioCursoBase):
    pass


class UsuarioCursoResponse(UsuarioCursoBase):
    id_usuario_curso: int