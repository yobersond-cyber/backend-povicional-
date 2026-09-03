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
    