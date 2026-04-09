import os

class Config:
    SQLALCHEMY_DATABASE_URI = "sqlite:///assets.db"
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    SECRET_KEY = os.environ.get("SECRET_KEY", "dev-key-please-change-in-production")
    JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", "jwt-dev-secret-change-in-production")
    JWT_ACCESS_TOKEN_EXPIRES = 3600   # 1 hour
    JWT_REFRESH_TOKEN_EXPIRES = 86400 * 7  # 7 days
