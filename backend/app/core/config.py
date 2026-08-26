from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    app_name: str = "HelpDeskPro API"
    database_url: str = "sqlite:///./helpdeskpro.db"
    jwt_secret_key: str = "change-me-in-production-this-is-a-dev-secret"
    jwt_algorithm: str = "HS256"
    jwt_access_token_expire_minutes: int = 60 * 24
    cors_origins: list[str] = ["http://localhost:5173", "http://localhost:3000"]


settings = Settings()
