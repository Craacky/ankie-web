from __future__ import annotations

import os
import tempfile
from pathlib import Path

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="session")
def client():
    db_path = Path(tempfile.gettempdir()) / "ankie_test.db"
    if db_path.exists():
        db_path.unlink()

    notes_root = Path(tempfile.gettempdir()) / "ankie_notes_test"
    if notes_root.exists():
        for child in notes_root.iterdir():
            if child.is_dir():
                for sub in child.rglob("*"):
                    if sub.is_file():
                        sub.unlink()
                for sub in sorted(notes_root.rglob("*"), reverse=True):
                    if sub.is_dir():
                        sub.rmdir()
            elif child.is_file():
                child.unlink()
    notes_root.mkdir(parents=True, exist_ok=True)

    os.environ["DB_PATH"] = str(db_path)
    os.environ["TELEGRAM_BOT_USERNAME"] = "testbot"
    os.environ["TELEGRAM_BOT_TOKEN"] = "testtoken"
    os.environ["NOTES_ROOT"] = str(notes_root)

    from app.main import app  # noqa: E402

    with TestClient(app) as test_client:
        yield test_client


@pytest.fixture()
def db_session():
    from app.database import SessionLocal  # noqa: E402

    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture()
def clean_db(db_session):
    from app.models import Card, CardProgress, Collection, Folder, Session, User  # noqa: E402

    db_session.query(CardProgress).delete()
    db_session.query(Card).delete()
    db_session.query(Collection).delete()
    db_session.query(Folder).delete()
    db_session.query(Session).delete()
    db_session.query(User).delete()
    db_session.commit()
    return db_session


@pytest.fixture()
def auth_client(client, clean_db):
    from datetime import datetime, timedelta

    from app.models import Session as UserSession  # noqa: E402
    from app.models import User  # noqa: E402

    user = User(telegram_id=12345, username="tester", first_name="Test")
    clean_db.add(user)
    clean_db.commit()
    clean_db.refresh(user)

    token = "test-session-token"
    session = UserSession(
        token=token,
        user_id=user.id,
        created_at=datetime.utcnow(),
        expires_at=datetime.utcnow() + timedelta(days=1),
    )
    clean_db.add(session)
    clean_db.commit()

    client.cookies.set("ankie_session", token)
    return client
