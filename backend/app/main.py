from __future__ import annotations

import json
import random
from datetime import datetime
from typing import Any

from fastapi import Depends, FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from .database import Base, engine, get_db
from .models import Card, CardProgress, Collection
from .schemas import (
    CardOut,
    CardProgressAction,
    CardUpdate,
    CollectionDetail,
    CollectionOut,
    ImportResult,
    MessageOut,
    StudyCardsOut,
)

app = FastAPI(title="Ankie Web API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def on_startup() -> None:
    Base.metadata.create_all(bind=engine)


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


@app.get("/api/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/collections", response_model=list[CollectionOut])
def list_collections(db: Session = Depends(get_db)) -> list[CollectionOut]:
    collections = db.scalars(select(Collection).order_by(Collection.created_at.asc())).all()
    return [collection_stats(db, c) for c in collections]


@app.get("/api/collections/{collection_id}", response_model=CollectionDetail)
def get_collection(collection_id: int, db: Session = Depends(get_db)) -> CollectionDetail:
    collection = db.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    cards = db.scalars(
        select(Card)
        .where(Card.collection_id == collection_id)
        .options(joinedload(Card.progress))
        .order_by(Card.created_at.asc())
    ).all()

    stats = collection_stats(db, collection)
    return CollectionDetail(**stats.model_dump(), cards=[card_to_out(c) for c in cards])


@app.get("/api/collections/{collection_id}/study-cards", response_model=StudyCardsOut)
def get_study_cards(collection_id: int, db: Session = Depends(get_db)) -> StudyCardsOut:
    collection = db.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    cards = db.scalars(
        select(Card)
        .where(Card.collection_id == collection_id)
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
    db: Session = Depends(get_db),
) -> ImportResult:
    if file.content_type not in {"application/json", "text/json", "text/plain", None}:
        raise HTTPException(status_code=400, detail="Only JSON files are supported")

    try:
        parsed = json.loads((await file.read()).decode("utf-8"))
    except (UnicodeDecodeError, json.JSONDecodeError) as exc:
        raise HTTPException(status_code=400, detail="Invalid JSON file") from exc

    cards = parse_cards_payload(parsed)

    collection = Collection(name=name.strip())
    if not collection.name:
        raise HTTPException(status_code=400, detail="Collection name cannot be empty")

    db.add(collection)
    try:
        db.flush()
    except IntegrityError as exc:
        db.rollback()
        raise HTTPException(status_code=409, detail="Collection name already exists") from exc

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
def delete_collection(collection_id: int, db: Session = Depends(get_db)) -> MessageOut:
    collection = db.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    db.delete(collection)
    db.commit()
    return MessageOut(message="Collection deleted")


@app.post("/api/collections/{collection_id}/reset", response_model=MessageOut)
def reset_collection_progress(collection_id: int, db: Session = Depends(get_db)) -> MessageOut:
    collection = db.get(Collection, collection_id)
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
def export_collection(collection_id: int, db: Session = Depends(get_db)) -> JSONResponse:
    collection = db.get(Collection, collection_id)
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    cards = db.scalars(select(Card).where(Card.collection_id == collection_id).order_by(Card.created_at.asc())).all()
    payload = [{"question": c.question, "answer": c.answer} for c in cards]

    return JSONResponse(content={"name": collection.name, "cards": payload})


@app.put("/api/cards/{card_id}", response_model=CardOut)
def update_card(card_id: int, payload: CardUpdate, db: Session = Depends(get_db)) -> CardOut:
    card = db.get(Card, card_id)
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
def delete_card(card_id: int, db: Session = Depends(get_db)) -> MessageOut:
    card = db.get(Card, card_id)
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    db.delete(card)
    db.commit()
    return MessageOut(message="Card deleted")


@app.post("/api/cards/{card_id}/progress", response_model=CardProgressAction)
def mark_card_progress(card_id: int, action: CardProgressAction, db: Session = Depends(get_db)) -> CardProgressAction:
    if action.card_id != card_id:
        raise HTTPException(status_code=400, detail="card_id mismatch")

    card = db.get(Card, card_id)
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
