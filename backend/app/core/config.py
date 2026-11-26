
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    DB_SSL_CA: str | None = None

    # CORREO ELECTRÓNICO

    EMAIL_ENABLED: bool = False

    SMTP_HOST: str | None = None
    SMTP_PORT: int = 587
    SMTP_USER: str | None = None
    SMTP_PASSWORD: str | None = None

    EMAIL_FROM: str | None = None
    SMTP_USE_TLS: bool = True
    SMTP_TIMEOUT: int = 20

    # ALMACENAMIENTO CLOUDINARY

    CLOUDINARY_CLOUD_NAME: str | None = None
    CLOUDINARY_API_KEY: str | None = None
    CLOUDINARY_API_SECRET: str | None = None

    CLOUDINARY_FOLDER: str = "aprenzy"

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore",
    )


settings = Settings()
