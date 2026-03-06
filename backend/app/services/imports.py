from __future__ import annotations

import json
import logging
import os
import re
from pathlib import Path
from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session

from ..models import Card, Collection, Folder, User
from ..settings import env_bool

logger = logging.getLogger(__name__)


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

        exists = db.scalar(select(Collection.id).where(Collection.user_id == user.id, Collection.name == collection_name))
        if exists:
            continue

        try:
            if path.suffix.lower() == ".json":
                payload = json.loads(path.read_text(encoding="utf-8"))
                cards = parse_cards_payload(payload)
            else:
                cards = parse_markdown_cards(path.read_text(encoding="utf-8", errors="ignore"), collection_name)
        except Exception as exc:  # noqa: BLE001
            logger.warning("Skip source import for %s: %s", path, exc)
            db.rollback()
            continue

        if not cards:
            continue

        collection = Collection(name=collection_name, user_id=user.id)
        db.add(collection)
        try:
            db.flush()
        except IntegrityError as exc:
            logger.warning("Skip duplicate collection %s: %s", collection_name, exc)
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
