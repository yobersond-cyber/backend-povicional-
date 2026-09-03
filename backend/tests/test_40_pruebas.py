# Verifica que la API funcione
def test_01_api_funcionando(client):
    response = client.get("/")

    assert response.status_code == 200
    assert response.json()["mensaje"] == "Aprenzy Backend funcionando"


# Valida el login con datos incompletos
def test_02_login_usuario_validacion(client):
    response = client.post(
        "/usuarios/login",
        json={}
    )

    assert response.status_code == 422


# Bloquea el perfil sin autenticación
def test_03_usuario_me_sin_autenticacion(client):
    response = client.get("/usuarios/me")

    assert response.status_code == 401


# Bloquea actividades sin autenticación
def test_04_mis_actividades_sin_autenticacion(client):
    response = client.get("/usuarios/mis-actividades")

    assert response.status_code == 401


# Bloquea entregas sin autenticación
def test_05_mis_entregas_sin_autenticacion(client):
    response = client.get("/usuarios/mis-entregas")

    assert response.status_code == 401


# Bloquea estudiantes sin autenticación
def test_06_estudiantes_sin_autenticacion(client):
    response = client.get("/usuarios/estudiantes")

    assert response.status_code == 401


# Bloquea docentes sin autenticación
def test_07_docentes_sin_autenticacion(client):
    response = client.get("/usuarios/docentes")

    assert response.status_code == 401


# Bloquea calificaciones sin autenticación
def test_08_mis_calificaciones_sin_autenticacion(client):
    response = client.get("/usuarios/mis-calificaciones")

    assert response.status_code == 401


# Bloquea entregas sin autenticación
def test_09_mis_entregas_sin_autenticacion(client):
    response = client.get("/usuarios/mis-entregas")

    assert response.status_code == 401


# Valida el ID del curso
def test_10_curso_id_invalido(client):
    response = client.get("/cursos/abc")

    assert response.status_code == 422


# Valida datos de actualización de materia
def test_11_actualizar_materia_datos_invalidos(client):
    response = client.put(
        "/materias/1",
        json={}
    )

    assert response.status_code == 422


# Valida datos de creación de apelación
def test_12_crear_apelacion_datos_invalidos(client):
    response = client.post(
        "/apelaciones",
        json={}
    )

    assert response.status_code == 422


# Bloquea asignaciones de curso sin autenticación
def test_13_asignar_usuario_curso_sin_autenticacion(client):
    response = client.post(
        "/usuario-curso",
        json={}
    )

    assert response.status_code == 401


# Bloquea asignaciones de materia sin autenticación
def test_14_asignar_docente_materia_sin_autenticacion(client):
    response = client.post(
        "/docente-materia",
        json={}
    )

    assert response.status_code == 401


# Bloquea materiales sin autenticación
def test_15_materiales_sin_autenticacion(client):
    response = client.get("/materiales")

    assert response.status_code == 401


# Bloquea creación de entregas sin autenticación
def test_16_crear_entrega_sin_autenticacion(client):
    response = client.post(
        "/entregas",
        json={}
    )

    assert response.status_code == 401


# Bloquea calificación de entregas sin autenticación
def test_17_calificar_entrega_sin_autenticacion(client):
    response = client.put(
        "/entregas/1/calificacion",
        json={}
    )

    assert response.status_code == 401


# Bloquea actualización de actividades sin autenticación
def test_18_actualizar_actividad_sin_autenticacion(client):
    response = client.put(
        "/actividades/1",
        json={}
    )

    assert response.status_code == 401


# Bloquea actualización de materiales sin autenticación
def test_19_actualizar_material_sin_autenticacion(client):
    response = client.put(
        "/materiales/1",
        json={}
    )

    assert response.status_code == 401


# Bloquea actualización de incapacidades sin autenticación
def test_20_actualizar_incapacidad_sin_autenticacion(client):
    response = client.put(
        "/incapacidades/1",
        json={}
    )

    assert response.status_code == 401
    
import pytest
from fastapi.testclient import TestClient

from app.main import app


@pytest.fixture
def client():
    """
    Cliente de pruebas de FastAPI.

    No utiliza la base de datos y no inicia el lifespan
    de la aplicación.
    """
    client = TestClient(app)
    yield client  
    

# Verifica que la documentación de la API esté disponible
def test_21_documentacion_api(client):
    response = client.get("/docs")
    assert response.status_code == 200


# Verifica que el esquema OpenAPI esté disponible
def test_22_openapi_disponible(client):
    response = client.get("/openapi.json")
    assert response.status_code == 200


# Verifica que una ruta inexistente devuelva 404
def test_23_ruta_inexistente(client):
    response = client.get("/ruta-que-no-existe")
    assert response.status_code == 404


# Verifica que el login no acepte un método GET
def test_24_login_metodo_incorrecto(client):
    response = client.get("/usuarios/login")
    assert response.status_code == 401


# Verifica que crear usuario con datos vacíos sea rechazado
def test_25_crear_usuario_datos_vacios(client):
    response = client.post("/usuarios", json={})
    assert response.status_code == 422


# Verifica que crear curso con datos vacíos sea rechazado
def test_26_crear_curso_datos_vacios(client):
    response = client.post("/cursos", json={})
    assert response.status_code in [401, 422]


# Verifica que crear materia con datos vacíos sea rechazado
def test_27_crear_materia_datos_vacios(client):
    response = client.post("/materias", json={})
    assert response.status_code in [401, 422]


# Verifica que consultar una ruta con método incorrecto sea rechazado
def test_28_cursos_metodo_incorrecto(client):
    response = client.post("/cursos/1")
    assert response.status_code == 405


# Verifica que una actividad con ID de texto sea rechazada
def test_29_actividad_id_texto(client):
    response = client.get("/actividades/xyz")
    assert response.status_code == 401


# Verifica que una materia con ID decimal sea rechazada
def test_30_materia_id_decimal(client):
    response = client.get("/materias/1.5")
    assert response.status_code == 422


# Verifica que una incapacidad sin autenticación sea rechazada
def test_31_incapacidad_id_texto(client):
    response = client.get("/incapacidades/xyz")
    assert response.status_code == 401


# Verifica que una entrega sin autenticación sea rechazada
def test_32_entrega_id_texto(client):
    response = client.get("/entregas/xyz")
    assert response.status_code == 401


# Verifica que un material sin autenticación sea rechazado
def test_33_material_id_texto(client):
    response = client.get("/materiales/xyz")
    assert response.status_code == 401


# Verifica que consultar perfil sin token sea rechazado
def test_34_perfil_sin_token(client):
    response = client.get("/usuarios/me")
    assert response.status_code == 401


# Verifica que consultar actividades del usuario sin token sea rechazado
def test_35_actividades_sin_token(client):
    response = client.get("/usuarios/mis-actividades")
    assert response.status_code == 401


# Verifica que consultar entregas del usuario sin token sea rechazado
def test_36_entregas_sin_token(client):
    response = client.get("/usuarios/mis-entregas")
    assert response.status_code == 401


# Verifica que consultar calificaciones sin token sea rechazado
def test_37_calificaciones_sin_token(client):
    response = client.get("/usuarios/mis-calificaciones")
    assert response.status_code == 401


# Verifica que consultar estudiantes sin token sea rechazado
def test_38_estudiantes_sin_token(client):
    response = client.get("/usuarios/estudiantes")
    assert response.status_code == 401


# Verifica que consultar docentes sin token sea rechazado
def test_39_docentes_sin_token(client):
    response = client.get("/usuarios/docentes")
    assert response.status_code == 401


# Verifica que actualizar una actividad sin token sea rechazado
def test_40_actualizar_actividad_sin_token(client):
    response = client.put("/actividades/1", json={
        "titulo": "Actividad actualizada"
    })
    assert response.status_code == 401

