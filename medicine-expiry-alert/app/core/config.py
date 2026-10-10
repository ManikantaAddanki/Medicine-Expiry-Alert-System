import os
from pydantic_settings import BaseSettings

class Settings(BaseSettings):
    APP_NAME: str = "Medicine Expiry Alert System"
    APP_ENV: str = "development"
    DEBUG: bool = True
    SECRET_KEY: str = "pharmacy-secure-secret-key-replace-in-production-2026"
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24

    # MySQL Database Connection String
    # Format: mysql+pymysql://USER:PASSWORD@HOST:PORT/DB_NAME
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL", 
        "mysql+pymysql://root:medicine_pass@localhost:3306/medicine_expiry_db"
    )

    # Expiry Alert Default Thresholds (Days)
    THRESHOLD_CRITICAL_DAYS: int = 7
    THRESHOLD_HIGH_DAYS: int = 30
    THRESHOLD_WARNING_DAYS: int = 60
    THRESHOLD_UPCOMING_DAYS: int = 90

    # Auto quarantine expired stock during batch scan
    AUTO_QUARANTINE_EXPIRED: bool = True

    # Scheduler Interval in minutes (default: every 24 hours / 1440 mins)
    SCAN_INTERVAL_MINUTES: int = 1440

    class Config:
        env_file = ".env"
        case_sensitive = True

settings = Settings()
