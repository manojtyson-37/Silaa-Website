import os

from sqlalchemy import create_engine
from sqlalchemy.orm import DeclarativeBase, sessionmaker

DATABASE_URL = os.environ.get("DATABASE_URL", "sqlite:///./erp.db")
if DATABASE_URL.startswith("postgresql+psycopg2://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql+psycopg2://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql+psycopg://", 1)
elif DATABASE_URL.startswith("postgresql://"):
    DATABASE_URL = DATABASE_URL.replace("postgresql://", "postgresql+psycopg://", 1)

# Supabase session limit fix for serverless
if "pooler.supabase.com" in DATABASE_URL:
    DATABASE_URL = DATABASE_URL.replace(":5432", ":6543")

from sqlalchemy import create_engine, pool

connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}
if "psycopg" in DATABASE_URL:
    connect_args["prepare_threshold"] = None
engine = create_engine(DATABASE_URL, connect_args=connect_args, poolclass=pool.NullPool)
SessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
