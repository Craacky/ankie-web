from __future__ import annotations

import hashlib
import hmac
import json
import os
import random
import re
import secrets
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any

from fastapi import Cookie, Depends, FastAPI, File, Form, HTTPException, Response, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import case, func, select, text
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from .database import Base, SessionLocal, engine, get_db
from .models import Card, CardProgress, Collection, Folder, Session as UserSession, User
from .schemas import (
    AuthConfigOut,
    CardOut,
    CardProgressAction,
    CardUpdate,
    CollectionDetail,
    CollectionFolderUpdate,
    CollectionOut,
    FolderCreate,
    FolderOut,
    FolderUpdate,
    ImportResult,
    MessageOut,
    StudyCardsOut,
    TelegramAuthPayload,
    UserOut,
)

SESSION_COOKIE_NAME = "ankie_session"

app = FastAPI(title="Ankie Web API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def env_bool(name: str, default: bool) -> bool:
    value = os.getenv(name)
    if value is None:
        return default
    return value.lower() in {"1", "true", "yes", "on"}


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)
    with engine.begin() as conn:
        users_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(users)"))}
        if "auto_import_done" not in users_columns:
            conn.execute(text("ALTER TABLE users ADD COLUMN auto_import_done BOOLEAN DEFAULT 0"))

        collections_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(collections)"))}
        if "folder_id" not in collections_columns:
            conn.execute(text("ALTER TABLE collections ADD COLUMN folder_id INTEGER"))
        if "user_id" not in collections_columns:
            conn.execute(text("ALTER TABLE collections ADD COLUMN user_id INTEGER"))

        folders_columns = {row[1] for row in conn.execute(text("PRAGMA table_info(folders)"))}
        if "user_id" not in folders_columns:
            conn.execute(text("ALTER TABLE folders ADD COLUMN user_id INTEGER"))

        # Performance indexes for common filters/sorts and progress lookups.
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_collections_user_created_at ON collections (user_id, created_at)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_collections_user_folder ON collections (user_id, folder_id)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_cards_collection_created_at ON cards (collection_id, created_at)"))
        conn.execute(text("CREATE INDEX IF NOT EXISTS ix_card_progress_known_card ON card_progress (known, card_id)"))


def parse_cards_payload(payload: Any) -> list[dict[str, str]]:
    cards: list[dict[str, str]] = []

    if isinstance(payload, list):
        source = payload
    elif isinstance(payload, dict) and isinstance(payload.get("cards"), list):
        source = payload["cards"]
    else:
        raise HTTPException(status_code=400, detail="Unsupported JSON format")

    for item in source:
        if not isinstance(item, dict):
            continue

        question = item.get("question") or item.get("q")
        answer = item.get("answer") or item.get("a")

        if not isinstance(question, str) or not isinstance(answer, str):
            continue

        question = question.strip()
        answer = answer.strip()
        if not question or not answer:
            continue

        cards.append({"question": question, "answer": answer})

    if not cards:
        raise HTTPException(status_code=400, detail="No valid cards found in JSON")

    return cards


def parse_markdown_cards(content: str, fallback_name: str) -> list[dict[str, str]]:
    heading_re = re.compile(r"^(#{2,3})\s+(.+?)\s*$")
    lines = content.splitlines()
    sections: list[tuple[str, list[str]]] = []
    current_title: str | None = None
    current_body: list[str] = []

    for line in lines:
        match = heading_re.match(line)
        if match:
            title = match.group(2).strip()
            if current_title is not None:
                sections.append((current_title, current_body))
            current_title = title
            current_body = []
        elif current_title is not None:
            current_body.append(line)

    if current_title is not None:
        sections.append((current_title, current_body))

    cards: list[dict[str, str]] = []
    for title, body_lines in sections:
        answer = "\n".join(body_lines).strip()
        if not answer:
            continue
        question = title.strip()
        if not question:
            continue
        cards.append({"question": question, "answer": answer})

    if cards:
        return cards

    fallback_answer = content.strip()
    if not fallback_answer:
        return []
    return [{"question": f"Notes: {fallback_name}", "answer": fallback_answer}]


def ensure_user_sources_loaded(db: Session, user: User) -> None:
    enabled = env_bool("AUTO_IMPORT_SOURCES", True)
    if not enabled:
        return

    source_root = Path(os.getenv("SOURCES_PATH", "/sources"))
    if not source_root.exists():
        return

    preload_dir = source_root / "PreloadCollections"
    theory_dir = source_root / "Theory"

    files: list[Path] = []
    if preload_dir.exists():
        files.extend(sorted(p for p in preload_dir.rglob("*.json") if p.is_file()))
    if theory_dir.exists():
        files.extend(sorted(p for p in theory_dir.glob("*.json") if p.is_file()))
        files.extend(sorted(p for p in theory_dir.rglob("*.md") if p.is_file()))

    seen: set[str] = set()
    unique_files: list[Path] = []
    for path in files:
        key = str(path.resolve())
        if key in seen:
            continue
        seen.add(key)
        unique_files.append(path)

    for path in unique_files:
        if path.name.lower() == "collections-manifest.json":
            continue

        collection_name = path.stem.strip()
        if not collection_name:
            continue

        exists = db.scalar(
            select(Collection.id).where(Collection.user_id == user.id, Collection.name == collection_name)
        )
        if exists:
            continue

        try:
            if path.suffix.lower() == ".json":
                payload = json.loads(path.read_text(encoding="utf-8"))
                cards = parse_cards_payload(payload)
            else:
                cards = parse_markdown_cards(path.read_text(encoding="utf-8", errors="ignore"), collection_name)
        except Exception:
            db.rollback()
            continue

        if not cards:
            continue

        collection = Collection(name=collection_name, user_id=user.id)
        db.add(collection)
        try:
            db.flush()
        except IntegrityError:
            db.rollback()
            continue

        unique_pairs: set[tuple[str, str]] = set()
        for item in cards:
            pair = (item["question"], item["answer"])
            if pair in unique_pairs:
                continue
            unique_pairs.add(pair)
            db.add(Card(collection_id=collection.id, question=pair[0], answer=pair[1]))

        db.commit()


def maybe_assign_legacy_data_to_first_user(db: Session, user: User) -> None:
    users_count = db.scalar(select(func.count(User.id))) or 0
    if users_count != 1:
        return

    legacy_collections = db.scalars(select(Collection).where(Collection.user_id.is_(None))).all()
    for collection in legacy_collections:
        collection.user_id = user.id

    legacy_folders = db.scalars(select(Folder).where(Folder.user_id.is_(None))).all()
    for folder in legacy_folders:
        folder.user_id = user.id

    if legacy_collections or legacy_folders:
        db.commit()


def collection_stats(db: Session, collection: Collection) -> CollectionOut:
    total = db.scalar(select(func.count(Card.id)).where(Card.collection_id == collection.id)) or 0
    known = (
        db.scalar(
            select(func.count(Card.id))
            .select_from(Card)
            .join(CardProgress, CardProgress.card_id == Card.id)
            .where(Card.collection_id == collection.id, CardProgress.known == True)  # noqa: E712
        )
        or 0
    )
    remaining = max(total - known, 0)
    return CollectionOut(
        id=collection.id,
        name=collection.name,
        folder_id=collection.folder_id,
        created_at=collection.created_at,
        total_cards=total,
        known_cards=known,
        remaining_cards=remaining,
        is_mastered=(total > 0 and remaining == 0),
    )


def card_to_out(card: Card) -> CardOut:
    known = bool(card.progress.known) if card.progress else False
    return CardOut(
        id=card.id,
        collection_id=card.collection_id,
        question=card.question,
        answer=card.answer,
        known=known,
    )


def user_to_out(user: User) -> UserOut:
    return UserOut(
        id=user.id,
        telegram_id=user.telegram_id,
        username=user.username,
        first_name=user.first_name,
        last_name=user.last_name,
        photo_url=user.photo_url,
    )


def verify_telegram_payload(payload: TelegramAuthPayload, bot_token: str) -> bool:
    data = payload.model_dump()
    incoming_hash = data.pop("hash")
    parts = []
    for key in sorted(data.keys()):
        value = data[key]
        if value is None:
            continue
        parts.append(f"{key}={value}")
    data_check_string = "\n".join(parts)

    secret_key = hashlib.sha256(bot_token.encode("utf-8")).digest()
    expected_hash = hmac.new(secret_key, data_check_string.encode("utf-8"), hashlib.sha256).hexdigest()
    return hmac.compare_digest(expected_hash, incoming_hash)


def create_session(db: Session, user_id: int) -> UserSession:
    ttl_days = int(os.getenv("SESSION_TTL_DAYS", "30"))
    now = datetime.utcnow()
    session = UserSession(
        token=secrets.token_urlsafe(48),
        user_id=user_id,
        created_at=now,
        expires_at=now + timedelta(days=ttl_days),
    )
    db.add(session)
    db.commit()
    db.refresh(session)
    return session


def set_session_cookie(response: Response, token: str) -> None:
    ttl_days = int(os.getenv("SESSION_TTL_DAYS", "30"))
    cookie_secure = env_bool("COOKIE_SECURE", False)
    response.set_cookie(
        key=SESSION_COOKIE_NAME,
        value=token,
        httponly=True,
        secure=cookie_secure,
        samesite="lax",
        max_age=ttl_days * 24 * 60 * 60,
        path="/",
    )


def clear_session_cookie(response: Response) -> None:
    cookie_secure = env_bool("COOKIE_SECURE", False)
    response.delete_cookie(key=SESSION_COOKIE_NAME, path="/", samesite="lax", secure=cookie_secure)


def get_current_user(
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> User:
    if not session_token:
        raise HTTPException(status_code=401, detail="Unauthorized")

    now = datetime.utcnow()
    session = db.scalar(
        select(UserSession)
        .where(UserSession.token == session_token, UserSession.expires_at > now)
        .options(joinedload(UserSession.user))
    )
    if not session or not session.user:
        raise HTTPException(status_code=401, detail="Unauthorized")

    # Opportunistic cleanup of expired sessions
    expired = db.scalars(select(UserSession).where(UserSession.expires_at <= now)).all()
    for item in expired:
        db.delete(item)
    if expired:
        db.commit()

    return session.user


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/auth/config", response_model=AuthConfigOut)
def auth_config() -> AuthConfigOut:
    username = os.getenv("TELEGRAM_BOT_USERNAME", "").strip()
    if not username:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_USERNAME is not configured")
    return AuthConfigOut(telegram_bot_username=username)


@app.post("/api/auth/telegram", response_model=UserOut)
def auth_telegram(payload: TelegramAuthPayload, response: Response, db: Session = Depends(get_db)) -> UserOut:
    bot_token = os.getenv("TELEGRAM_BOT_TOKEN", "").strip()
    if not bot_token:
        raise HTTPException(status_code=500, detail="TELEGRAM_BOT_TOKEN is not configured")

    if not verify_telegram_payload(payload, bot_token):
        raise HTTPException(status_code=401, detail="Invalid Telegram signature")

    max_age_seconds = int(os.getenv("TELEGRAM_AUTH_MAX_AGE", str(24 * 60 * 60)))
    now_ts = int(datetime.utcnow().timestamp())
    if now_ts - int(payload.auth_date) > max_age_seconds:
        raise HTTPException(status_code=401, detail="Telegram auth data is too old")

    user = db.scalar(select(User).where(User.telegram_id == payload.id))
    if not user:
        user = User(
            telegram_id=payload.id,
            username=payload.username,
            first_name=payload.first_name,
            last_name=payload.last_name,
            photo_url=payload.photo_url,
        )
        db.add(user)
        db.commit()
        db.refresh(user)
    else:
        user.username = payload.username
        user.first_name = payload.first_name
        user.last_name = payload.last_name
        user.photo_url = payload.photo_url
        db.commit()
        db.refresh(user)

    maybe_assign_legacy_data_to_first_user(db, user)
    if not user.auto_import_done:
        ensure_user_sources_loaded(db, user)
        user.auto_import_done = True
        db.commit()
        db.refresh(user)

    session = create_session(db, user.id)
    set_session_cookie(response, session.token)
    return user_to_out(user)


@app.get("/api/auth/me", response_model=UserOut)
def auth_me(current_user: User = Depends(get_current_user)) -> UserOut:
    return user_to_out(current_user)


@app.post("/api/auth/logout", response_model=MessageOut)
def auth_logout(
    response: Response,
    session_token: str | None = Cookie(default=None, alias=SESSION_COOKIE_NAME),
    db: Session = Depends(get_db),
) -> MessageOut:
    if session_token:
        session = db.scalar(select(UserSession).where(UserSession.token == session_token))
        if session:
            db.delete(session)
            db.commit()
    clear_session_cookie(response)
    return MessageOut(message="Logged out")


@app.get("/api/collections", response_model=list[CollectionOut])
def list_collections(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[CollectionOut]:
    rows = db.execute(
        select(
            Collection.id,
            Collection.name,
            Collection.folder_id,
            Collection.created_at,
            func.count(Card.id).label("total_cards"),
            func.coalesce(
                func.sum(case((CardProgress.known == True, 1), else_=0)),  # noqa: E712
                0,
            ).label("known_cards"),
        )
        .select_from(Collection)
        .outerjoin(Card, Card.collection_id == Collection.id)
        .outerjoin(CardProgress, CardProgress.card_id == Card.id)
        .where(Collection.user_id == current_user.id)
        .group_by(Collection.id, Collection.name, Collection.folder_id, Collection.created_at)
        .order_by(Collection.created_at.asc())
    ).all()
    result: list[CollectionOut] = []
    for row in rows:
        total = int(row.total_cards or 0)
        known = int(row.known_cards or 0)
        remaining = max(total - known, 0)
        result.append(
            CollectionOut(
                id=row.id,
                name=row.name,
                folder_id=row.folder_id,
                created_at=row.created_at,
                total_cards=total,
                known_cards=known,
                remaining_cards=remaining,
                is_mastered=(total > 0 and remaining == 0),
            )
        )
    return result


@app.get("/api/folders", response_model=list[FolderOut])
def list_folders(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)) -> list[FolderOut]:
    rows = db.execute(
        select(
            Folder.id,
            Folder.name,
            Folder.created_at,
            func.count(Collection.id).label("collections_count"),
        )
        .select_from(Folder)
        .outerjoin(
            Collection,
            (Collection.folder_id == Folder.id) & (Collection.user_id == current_user.id),
        )
        .where(Folder.user_id == current_user.id)
        .group_by(Folder.id, Folder.name, Folder.created_at)
        .order_by(Folder.created_at.asc())
    ).all()
    return [
        FolderOut(
            id=row.id,
            name=row.name,
            created_at=row.created_at,
            collections_count=int(row.collections_count or 0),
        )
        for row in rows
    ]


@app.post("/api/folders", response_model=FolderOut)
def create_folder(
    payload: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FolderOut:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name cannot be empty")

    exists = db.scalar(select(Folder.id).where(Folder.user_id == current_user.id, Folder.name == name))
    if exists:
        raise HTTPException(status_code=409, detail="Folder name already exists")

    folder = Folder(name=name, user_id=current_user.id)
    db.add(folder)
    db.commit()
    db.refresh(folder)
    return FolderOut(id=folder.id, name=folder.name, created_at=folder.created_at, collections_count=0)


@app.patch("/api/folders/{folder_id}", response_model=FolderOut)
def rename_folder(
    folder_id: int,
    payload: FolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FolderOut:
    folder = db.scalar(select(Folder).where(Folder.id == folder_id, Folder.user_id == current_user.id))
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name cannot be empty")

    conflict = db.scalar(
        select(Folder.id).where(Folder.user_id == current_user.id, Folder.name == name, Folder.id != folder_id)
    )
    if conflict:
        raise HTTPException(status_code=409, detail="Folder name already exists")

    folder.name = name
    db.commit()
    db.refresh(folder)

    count = (
        db.scalar(
            select(func.count(Collection.id)).where(
                Collection.folder_id == folder.id, Collection.user_id == current_user.id
            )
        )
        or 0
    )
    return FolderOut(id=folder.id, name=folder.name, created_at=folder.created_at, collections_count=count)


@app.delete("/api/folders/{folder_id}", response_model=MessageOut)
def delete_folder(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    folder = db.scalar(select(Folder).where(Folder.id == folder_id, Folder.user_id == current_user.id))
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    collections = db.scalars(
        select(Collection).where(Collection.folder_id == folder_id, Collection.user_id == current_user.id)
    ).all()
    for collection in collections:
        collection.folder_id = None

    db.delete(folder)
    db.commit()
    return MessageOut(message="Folder deleted")


@app.patch("/api/collections/{collection_id}/folder", response_model=CollectionOut)
def move_collection_to_folder(
    collection_id: int,
    payload: CollectionFolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CollectionOut:
    collection = db.scalar(
        select(Collection).where(Collection.id == collection_id, Collection.user_id == current_user.id)
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    if payload.folder_id is not None:
        folder = db.scalar(
            select(Folder).where(Folder.id == payload.folder_id, Folder.user_id == current_user.id)
        )
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")

    collection.folder_id = payload.folder_id
    db.commit()
    db.refresh(collection)
    return collection_stats(db, collection)


@app.get("/api/collections/{collection_id}", response_model=CollectionDetail)
def get_collection(
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CollectionDetail:
    collection = db.scalar(
        select(Collection).where(Collection.id == collection_id, Collection.user_id == current_user.id)
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    cards = db.scalars(
        select(Card)
        .join(Collection, Collection.id == Card.collection_id)
        .where(Card.collection_id == collection_id, Collection.user_id == current_user.id)
        .options(joinedload(Card.progress))
        .order_by(Card.created_at.asc())
    ).all()

    stats = collection_stats(db, collection)
    return CollectionDetail(**stats.model_dump(), cards=[card_to_out(c) for c in cards])


@app.get("/api/collections/{collection_id}/study-cards", response_model=StudyCardsOut)
def get_study_cards(
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> StudyCardsOut:
    collection = db.scalar(
        select(Collection).where(Collection.id == collection_id, Collection.user_id == current_user.id)
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    cards = db.scalars(
        select(Card)
        .join(Collection, Collection.id == Card.collection_id)
        .where(Card.collection_id == collection_id, Collection.user_id == current_user.id)
        .options(joinedload(Card.progress))
    ).all()

    filtered = [card_to_out(card) for card in cards if not (card.progress and card.progress.known)]
    random.shuffle(filtered)

    return StudyCardsOut(
        collection_id=collection.id,
        collection_name=collection.name,
        is_mastered=(len(cards) > 0 and len(filtered) == 0),
        remaining_cards=len(filtered),
        cards=filtered,
    )


@app.post("/api/collections/import", response_model=ImportResult)
async def import_collection(
    name: str = Form(...),
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ImportResult:
    if file.content_type not in {"application/json", "text/json", "text/plain", None}:
        raise HTTPException(status_code=400, detail="Only JSON files are supported")

    try:
        parsed = json.loads((await file.read()).decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON file") from exc

    cards = parse_cards_payload(parsed)

    collection_name = name.strip()
    if not collection_name:
        raise HTTPException(status_code=400, detail="Collection name cannot be empty")

    exists = db.scalar(
        select(Collection.id).where(Collection.user_id == current_user.id, Collection.name == collection_name)
    )
    if exists:
        raise HTTPException(status_code=409, detail="Collection name already exists")

    collection = Collection(name=collection_name, user_id=current_user.id)
    db.add(collection)
    db.flush()

    existing_pairs: set[tuple[str, str]] = set()
    imported_count = 0
    skipped = 0

    for item in cards:
        pair = (item["question"], item["answer"])
        if pair in existing_pairs:
            skipped += 1
            continue
        existing_pairs.add(pair)
        db.add(Card(collection_id=collection.id, question=pair[0], answer=pair[1]))
        imported_count += 1

    db.commit()

    return ImportResult(
        collection_id=collection.id,
        collection_name=collection.name,
        imported_count=imported_count,
        skipped_duplicates=skipped,
    )


@app.delete("/api/collections/{collection_id}", response_model=MessageOut)
def delete_collection(
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    collection = db.scalar(
        select(Collection).where(Collection.id == collection_id, Collection.user_id == current_user.id)
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    db.delete(collection)
    db.commit()
    return MessageOut(message="Collection deleted")


@app.post("/api/collections/{collection_id}/reset", response_model=MessageOut)
def reset_collection_progress(
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    collection = db.scalar(
        select(Collection).where(Collection.id == collection_id, Collection.user_id == current_user.id)
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    cards = db.scalars(select(Card.id).where(Card.collection_id == collection_id)).all()
    if cards:
        progresses = db.scalars(select(CardProgress).where(CardProgress.card_id.in_(cards))).all()
        for progress in progresses:
            progress.known = False
            progress.known_at = None
            progress.last_reviewed_at = datetime.utcnow()
    db.commit()

    return MessageOut(message="Collection progress reset")


@app.get("/api/collections/{collection_id}/export")
def export_collection(
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    collection = db.scalar(
        select(Collection).where(Collection.id == collection_id, Collection.user_id == current_user.id)
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    cards = db.scalars(select(Card).where(Card.collection_id == collection_id).order_by(Card.created_at.asc())).all()
    payload = [{"question": c.question, "answer": c.answer} for c in cards]

    return JSONResponse(content={"name": collection.name, "cards": payload})


@app.put("/api/cards/{card_id}", response_model=CardOut)
def update_card(
    card_id: int,
    payload: CardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CardOut:
    card = db.scalar(
        select(Card)
        .join(Collection, Collection.id == Card.collection_id)
        .where(Card.id == card_id, Collection.user_id == current_user.id)
        .options(joinedload(Card.progress))
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    card.question = payload.question.strip()
    card.answer = payload.answer.strip()
    if not card.question or not card.answer:
        raise HTTPException(status_code=400, detail="Question and answer cannot be empty")

    db.commit()
    db.refresh(card)
    return card_to_out(card)


@app.delete("/api/cards/{card_id}", response_model=MessageOut)
def delete_card(
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    card = db.scalar(
        select(Card).join(Collection, Collection.id == Card.collection_id).where(
            Card.id == card_id, Collection.user_id == current_user.id
        )
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    db.delete(card)
    db.commit()
    return MessageOut(message="Card deleted")


@app.post("/api/cards/{card_id}/progress", response_model=CardProgressAction)
def mark_card_progress(
    card_id: int,
    action: CardProgressAction,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CardProgressAction:
    if action.card_id != card_id:
        raise HTTPException(status_code=400, detail="card_id mismatch")

    card = db.scalar(
        select(Card)
        .join(Collection, Collection.id == Card.collection_id)
        .where(Card.id == card_id, Collection.user_id == current_user.id)
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    progress = db.scalar(select(CardProgress).where(CardProgress.card_id == card_id))
    if not progress:
        progress = CardProgress(card_id=card_id)
        db.add(progress)

    progress.known = action.known
    progress.last_reviewed_at = datetime.utcnow()
    progress.known_at = datetime.utcnow() if action.known else None

    db.commit()

    return action
