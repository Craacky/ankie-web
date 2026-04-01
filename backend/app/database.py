from sqlalchemy import create_engine, event
from sqlalchemy.orm import declarative_base, sessionmaker
import os
import logging
from pathlib import Path

logger = logging.getLogger(__name__)

DB_PATH = os.getenv("DB_PATH", "/data/ankie.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

# Ensure database directory exists and is writable
db_path = Path(DB_PATH)
db_dir = db_path.parent
try:
    db_dir.mkdir(parents=True, exist_ok=True)
    # Test write permissions
    test_file = db_dir / ".write_test"
    test_file.touch()
    test_file.unlink()
    logger.info(f"Database directory verified: {db_dir}")
except (OSError, PermissionError) as e:
    logger.error(f"Cannot access database directory {db_dir}: {e}")
    raise RuntimeError(
        f"Database directory {db_dir} is not accessible or writable: {e}"
    ) from e

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
    pool_pre_ping=True,
    pool_recycle=3600,
)


@event.listens_for(engine, "connect")
def _set_sqlite_pragma(dbapi_connection, connection_record) -> None:  # type: ignore[no-untyped-def]
    cursor = dbapi_connection.cursor()
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
