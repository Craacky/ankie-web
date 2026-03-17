from __future__ import annotations

from sqlalchemy import func, select
from sqlalchemy.orm import Session

from ..models import Card, CardProgress, Collection
from ..schemas import CardOut, CollectionOut


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
        is_markdown=bool(getattr(card, "is_markdown", False)),
    )
