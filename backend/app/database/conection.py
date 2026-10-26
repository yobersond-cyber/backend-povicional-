import os
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from app.core.config import settings

connect_args = {}

if settings.DB_SSL_CA:
    connect_args["ssl"] = {"ca": settings.DB_SSL_CA}

engine = create_engine(
    settings.DATABASE_URL,
    connect_args=connect_args,
    echo=True
)

SessionLocal = sessionmaker(
    autocommit=False,
    autoflush=False,
    bind=engine
)

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()