from __future__ import annotations

import json
from datetime import datetime, timezone

from fastapi import (
    APIRouter,
    Body,
    Depends,
    File,
    Form,
    HTTPException,
    Query,
    Request,
    UploadFile,
)
from starlette.datastructures import UploadFile as StarletteUploadFile
from fastapi.responses import JSONResponse
from sqlalchemy import case, func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.orm import Session, joinedload

from ..database import get_db
from ..dependencies import get_current_user
from ..limiter import limiter
from ..models import Card, CardProgress, Collection, Folder, User
from ..schemas import (
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
    PaginatedCardsOut,
    StudyCardsOut,
)
from ..services.imports import parse_cards_payload, parse_markdown_cards
from ..services.library import card_to_out, collection_stats
from ..settings import collections_import_max_bytes
from ..settings import card_answer_max_chars, card_question_max_chars
from ..utils.uploads import read_upload_with_limit

router = APIRouter()


def clamp_limit(limit: int, max_limit: int = 500, default: int = 200) -> int:
    if limit <= 0:
        return default
    return min(limit, max_limit)


@router.get("/collections", response_model=list[CollectionOut])
@limiter.limit("60/minute")
def list_collections(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> list[CollectionOut]:
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
        .group_by(
            Collection.id, Collection.name, Collection.folder_id, Collection.created_at
        )
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


@router.get("/folders", response_model=list[FolderOut])
def list_folders(
    current_user: User = Depends(get_current_user), db: Session = Depends(get_db)
) -> list[FolderOut]:
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
            (Collection.folder_id == Folder.id)
            & (Collection.user_id == current_user.id),
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


@router.post("/folders", response_model=FolderOut)
def create_folder(
    payload: FolderCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FolderOut:
    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name cannot be empty")

    folder = Folder(name=name, user_id=current_user.id)
    db.add(folder)
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Folder name already exists"
        ) from None
    db.refresh(folder)
    return FolderOut(
        id=folder.id,
        name=folder.name,
        created_at=folder.created_at,
        collections_count=0,
    )


@router.patch("/folders/{folder_id}", response_model=FolderOut)
def rename_folder(
    folder_id: int,
    payload: FolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> FolderOut:
    folder = db.scalar(
        select(Folder).where(Folder.id == folder_id, Folder.user_id == current_user.id)
    )
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    name = payload.name.strip()
    if not name:
        raise HTTPException(status_code=400, detail="Folder name cannot be empty")

    folder.name = name
    try:
        db.commit()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Folder name already exists"
        ) from None
    db.refresh(folder)

    count = (
        db.scalar(
            select(func.count(Collection.id)).where(
                Collection.folder_id == folder.id, Collection.user_id == current_user.id
            )
        )
        or 0
    )
    return FolderOut(
        id=folder.id,
        name=folder.name,
        created_at=folder.created_at,
        collections_count=count,
    )


@router.delete("/folders/{folder_id}", response_model=MessageOut)
def delete_folder(
    folder_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    folder = db.scalar(
        select(Folder).where(Folder.id == folder_id, Folder.user_id == current_user.id)
    )
    if not folder:
        raise HTTPException(status_code=404, detail="Folder not found")

    collections = db.scalars(
        select(Collection).where(
            Collection.folder_id == folder_id, Collection.user_id == current_user.id
        )
    ).all()
    for collection in collections:
        collection.folder_id = None

    db.delete(folder)
    db.commit()
    return MessageOut(message="Folder deleted")


@router.patch("/collections/{collection_id}/folder", response_model=CollectionOut)
def move_collection_to_folder(
    collection_id: int,
    payload: CollectionFolderUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> CollectionOut:
    collection = db.scalar(
        select(Collection).where(
            Collection.id == collection_id, Collection.user_id == current_user.id
        )
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    if payload.folder_id is not None:
        folder = db.scalar(
            select(Folder).where(
                Folder.id == payload.folder_id, Folder.user_id == current_user.id
            )
        )
        if not folder:
            raise HTTPException(status_code=404, detail="Folder not found")

    collection.folder_id = payload.folder_id
    db.commit()
    db.refresh(collection)
    return collection_stats(db, collection)


@router.get("/collections/{collection_id}", response_model=CollectionDetail)
@limiter.limit("60/minute")
def get_collection(
    request: Request,
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    offset: int = Query(0, ge=0),
    limit: int = Query(200, ge=0, le=500),
) -> CollectionDetail:
    collection = db.scalar(
        select(Collection).where(
            Collection.id == collection_id, Collection.user_id == current_user.id
        )
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    limit = clamp_limit(limit)
    cards_total = (
        db.scalar(
            select(func.count(Card.id)).where(Card.collection_id == collection_id)
        )
        or 0
    )
    cards = db.scalars(
        select(Card)
        .join(Collection, Collection.id == Card.collection_id)
        .where(
            Card.collection_id == collection_id, Collection.user_id == current_user.id
        )
        .options(joinedload(Card.progress))
        .order_by(Card.created_at.asc())
        .offset(offset)
        .limit(limit)
    ).all()

    stats = collection_stats(db, collection)
    return CollectionDetail(
        **stats.model_dump(),
        cards=[card_to_out(c) for c in cards],
        cards_total=int(cards_total),
    )


@router.get("/collections/{collection_id}/cards", response_model=PaginatedCardsOut)
@limiter.limit("60/minute")
def list_collection_cards(
    request: Request,
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    offset: int = Query(0, ge=0),
    limit: int = Query(200, ge=0, le=500),
) -> PaginatedCardsOut:
    collection = db.scalar(
        select(Collection.id).where(
            Collection.id == collection_id, Collection.user_id == current_user.id
        )
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    limit = clamp_limit(limit)
    total = (
        db.scalar(
            select(func.count(Card.id)).where(Card.collection_id == collection_id)
        )
        or 0
    )
    rows = db.execute(
        select(Card, CardProgress.known)
        .outerjoin(CardProgress, CardProgress.card_id == Card.id)
        .where(Card.collection_id == collection_id)
        .order_by(Card.created_at.asc())
        .offset(offset)
        .limit(limit)
    ).all()

    items = [
        CardOut(
            id=card.id,
            collection_id=card.collection_id,
            question=card.question,
            answer=card.answer,
            known=bool(known),
            is_markdown=bool(getattr(card, "is_markdown", False)),
        )
        for card, known in rows
    ]
    return PaginatedCardsOut(items=items, total=int(total), offset=offset, limit=limit)


@router.get("/collections/{collection_id}/study-cards", response_model=StudyCardsOut)
@limiter.limit("120/minute")
def get_study_cards(
    request: Request,
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    offset: int = Query(0, ge=0),
    limit: int = Query(200, ge=0, le=500),
) -> StudyCardsOut:
    collection = db.scalar(
        select(Collection).where(
            Collection.id == collection_id, Collection.user_id == current_user.id
        )
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    limit = clamp_limit(limit)
    unknown_filter = or_(CardProgress.id.is_(None), CardProgress.known == False)  # noqa: E712
    remaining = (
        db.scalar(
            select(func.count(Card.id))
            .outerjoin(CardProgress, CardProgress.card_id == Card.id)
            .where(Card.collection_id == collection_id, unknown_filter)
        )
        or 0
    )

    cards = db.scalars(
        select(Card)
        .outerjoin(CardProgress, CardProgress.card_id == Card.id)
        .where(Card.collection_id == collection_id, unknown_filter)
        .options(joinedload(Card.progress))
        .order_by(Card.created_at.asc())
        .offset(offset)
        .limit(limit)
    ).all()

    filtered = [card_to_out(card) for card in cards]

    return StudyCardsOut(
        collection_id=collection.id,
        collection_name=collection.name,
        is_mastered=remaining == 0,
        remaining_cards=int(remaining),
        cards=filtered,
    )


@router.post("/collections/import", response_model=ImportResult)
@limiter.limit("10/minute")
async def import_collection(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> ImportResult:
    form = await request.form()
    name = form.get("name")
    file = form.get("file")
    if not isinstance(name, str) or not name.strip():
        raise HTTPException(status_code=422, detail="name is required")
    if not isinstance(file, (UploadFile, StarletteUploadFile)):
        raise HTTPException(status_code=422, detail="file is required")
    filename = (file.filename or "").lower()
    is_markdown = filename.endswith(".md") or file.content_type in {
        "text/markdown",
        "text/x-markdown",
    }
    if not is_markdown and file.content_type not in {
        "application/json",
        "text/json",
        "text/plain",
        None,
    }:
        raise HTTPException(
            status_code=400, detail="Only JSON or Markdown files are supported"
        )

    data = await read_upload_with_limit(file, collections_import_max_bytes())

    text = ""
    try:
        text = data.decode("utf-8")
    except UnicodeDecodeError as exc:
        raise HTTPException(status_code=400, detail="Invalid UTF-8 file") from exc

    if is_markdown:
        cards = parse_markdown_cards(text)
    else:
        try:
            parsed = json.loads(text)
        except json.JSONDecodeError as exc:
            raise HTTPException(status_code=400, detail="Invalid JSON file") from exc
        cards = parse_cards_payload(parsed)

    collection_name = name.strip()
    if not collection_name:
        raise HTTPException(status_code=400, detail="Collection name cannot be empty")

    collection = Collection(name=collection_name, user_id=current_user.id)
    db.add(collection)
    try:
        db.flush()
    except IntegrityError:
        db.rollback()
        raise HTTPException(
            status_code=409, detail="Collection name already exists"
        ) from None

    existing_pairs: set[tuple[str, str]] = set()
    imported_count = 0
    skipped = 0

    for item in cards:
        pair = (item["question"], item["answer"])
        if pair in existing_pairs:
            skipped += 1
            continue
        existing_pairs.add(pair)
        db.add(
            Card(
                collection_id=collection.id,
                question=pair[0],
                answer=pair[1],
                is_markdown=bool(item.get("is_markdown", False)),
            )
        )
        imported_count += 1

    db.commit()

    return ImportResult(
        collection_id=collection.id,
        collection_name=collection.name,
        imported_count=imported_count,
        skipped_duplicates=skipped,
    )


@router.delete("/collections/{collection_id}", response_model=MessageOut)
@limiter.limit("30/minute")
def delete_collection(
    request: Request,
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    collection = db.scalar(
        select(Collection).where(
            Collection.id == collection_id, Collection.user_id == current_user.id
        )
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    db.delete(collection)
    db.commit()
    return MessageOut(message="Collection deleted")


@router.post("/collections/{collection_id}/reset", response_model=MessageOut)
@limiter.limit("30/minute")
def reset_collection_progress(
    request: Request,
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    collection = db.scalar(
        select(Collection).where(
            Collection.id == collection_id, Collection.user_id == current_user.id
        )
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    db.query(CardProgress).filter(
        CardProgress.card_id.in_(
            select(Card.id).where(Card.collection_id == collection_id)
        )
    ).update(
        {
            CardProgress.known: False,
            CardProgress.known_at: None,
            CardProgress.last_reviewed_at: datetime.now(timezone.utc),
        },
        synchronize_session=False,
    )
    db.commit()

    return MessageOut(message="Collection progress reset")


@router.get("/collections/{collection_id}/export")
def export_collection(
    collection_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> JSONResponse:
    collection = db.scalar(
        select(Collection).where(
            Collection.id == collection_id, Collection.user_id == current_user.id
        )
    )
    if not collection:
        raise HTTPException(status_code=404, detail="Collection not found")

    cards = db.scalars(
        select(Card)
        .where(Card.collection_id == collection_id)
        .order_by(Card.created_at.asc())
    ).all()
    payload = [
        {
            "question": c.question,
            "answer": c.answer,
            "markdown": bool(getattr(c, "is_markdown", False)),
        }
        for c in cards
    ]

    return JSONResponse(content={"name": collection.name, "cards": payload})


@router.put("/cards/{card_id}", response_model=CardOut)
@limiter.limit("60/minute")
def update_card(
    request: Request,
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
        raise HTTPException(
            status_code=400, detail="Question and answer cannot be empty"
        )
    if (
        len(card.question) > card_question_max_chars()
        or len(card.answer) > card_answer_max_chars()
    ):
        raise HTTPException(status_code=400, detail="Question or answer is too long")

    db.commit()
    db.refresh(card)
    return card_to_out(card)


@router.delete("/cards/{card_id}", response_model=MessageOut)
@limiter.limit("60/minute")
def delete_card(
    request: Request,
    card_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
) -> MessageOut:
    card = db.scalar(
        select(Card)
        .join(Collection, Collection.id == Card.collection_id)
        .where(Card.id == card_id, Collection.user_id == current_user.id)
    )
    if not card:
        raise HTTPException(status_code=404, detail="Card not found")

    db.delete(card)
    db.commit()
    return MessageOut(message="Card deleted")


@router.post("/cards/{card_id}/progress", response_model=CardProgressAction)
@limiter.limit("120/minute")
def mark_card_progress(
    request: Request,
    card_id: int,
    action: CardProgressAction = Body(...),
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
    progress.last_reviewed_at = datetime.now(timezone.utc)
    progress.known_at = datetime.now(timezone.utc) if action.known else None

    db.commit()

    return action
