# AprenzyBackend

Backend de la plataforma educativa **Aprenzy**, desarrollado con **Python, FastAPI, SQLAlchemy y MYSQL**.

El sistema proporciona una API REST para gestionar usuarios, cursos, materias, relaciones académicas, incapacidades, historial de incapacidades, apelaciones, accesos académicos, materiales, actividades y entregas.

---

## 📌 Tecnologías utilizadas

- Python 3
- FastAPI
- Uvicorn
- SQLAlchemy
- Pydantic
- PostgreSQL
- Psycopg2
- Git / GitHub
- Swagger UI
- REST API

---

## 📁 Estructura del proyecto

```text
AprenzyBackend/
│
├── app/
│   ├── database/
│   │   ├── base.py
│   │   └── conection.py
│   │
│   ├── models/
│   │   ├── Usuarios.py
│   │   ├── curso.py
│   │   ├── materia.py
│   │   ├── usuario_curso.py
│   │   ├── docente_materia.py
│   │   ├── incapacidad.py
│   │   ├── historial_incapacidad.py
│   │   ├── apelacion.py
│   │   ├── acceso_academico.py
│   │   ├── material.py
│   │   ├── actividad.py
│   │   └── entrega.py
│   │
│   ├── routers/
│   │   ├── usuario.py
│   │   ├── curso.py
│   │   ├── materia.py
│   │   ├── usuario_curso.py
│   │   ├── docente_materia.py
│   │   ├── incapacidad.py
│   │   ├── historial.py
│   │   ├── apelacion.py
│   │   ├── acceso.py
│   │   ├── material.py
│   │   ├── actividad.py
│   │   └── entrega.py
│   │
│   ├── schemas/
│   │   ├── base.py
│   │   ├── usuario.py
│   │   ├── curso.py
│   │   ├── materia.py
│   │   ├── usuario_curso.py
│   │   ├── docente_materia.py
│   │   ├── incapacidad.py
│   │   ├── historial.py
│   │   ├── apelacion.py
│   │   ├── acceso.py
│   │   ├── material.py
│   │   ├── actividad.py
│   │   └── entrega.py
│   │
│   └── main.py
│   
├── .venv/
├── .env
├── .gitignore
├── requirements.txt
└── README.md