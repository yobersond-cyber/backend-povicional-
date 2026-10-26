from pydantic_settings import BaseSettings, SettingsConfigDict

class Settings(BaseSettings):
    DATABASE_URL: str
    SECRET_KEY: str
    ALGORITHM: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int
    DB_SSL_CA: str | None = None

    model_config = SettingsConfigDict(
        env_file=".env",
        extra="ignore"
    ) 

settings = Settings()