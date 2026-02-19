import logging
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    app_name: str = "Study Session Manager"
    debug: bool = False
    database_url: str
    frontend_url: str = "http://localhost:5173"
    anthropic_api_key: str = ""

    class Config:
        env_file = ".env"

    def get_allowed_origins(self) -> list[str]:
        """Return list of allowed origins for CORS."""
        origins = [self.frontend_url]
        # Always allow localhost for development
        if "http://localhost:5173" not in origins:
            origins.append("http://localhost:5173")
        return origins

@lru_cache()
def get_settings() -> Settings:
    return Settings()


def setup_logging() -> logging.Logger:
    logging.basicConfig(
        level=logging.INFO,
        format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
        datefmt="%Y-%m-%d %H:%M:%S",
    )
    logger = logging.getLogger("study_session_manager")
    return logger


logger = setup_logging()
