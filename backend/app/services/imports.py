from __future__ import annotations

from typing import Any

from fastapi import HTTPException
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Collection, Folder, User
from ..settings import card_answer_max_chars, card_question_max_chars


def parse_cards_payload(payload: Any) -> list[dict[str, Any]]:
    cards: list[dict[str, Any]] = []

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
        if len(question) > card_question_max_chars() or len(answer) > card_answer_max_chars():
            continue

        is_markdown = bool(item.get("markdown") or item.get("is_markdown"))
        cards.append({"question": question, "answer": answer, "is_markdown": is_markdown})

    if not cards:
        raise HTTPException(status_code=400, detail="No valid cards found in JSON")

    return cards


def parse_markdown_cards(content: str) -> list[dict[str, Any]]:
    lines = content.splitlines()
    cards: list[dict[str, Any]] = []
    current_question: str | None = None
    current_body: list[str] = []
    for line in lines:
        if line.startswith("## "):
            if current_question is not None:
                answer = "\n".join(current_body).strip()
                if answer:
                    if len(current_question) <= card_question_max_chars() and len(answer) <= card_answer_max_chars():
                        cards.append({"question": current_question, "answer": answer, "is_markdown": True})
            current_question = line[3:].strip()
            current_body = []
        else:
        current_body.append(line)

    if current_question is not None:
        answer = "\n".join(current_body).strip()
        if answer:
            if len(current_question) <= card_question_max_chars() and len(answer) <= card_answer_max_chars():
                cards.append({"question": current_question, "answer": answer, "is_markdown": True})

    if not cards:
        raise HTTPException(status_code=400, detail="No valid cards found in markdown")

    return cards


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
