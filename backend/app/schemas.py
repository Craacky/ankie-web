from datetime import datetime
from pydantic import BaseModel, Field


class CardBase(BaseModel):
    question: str = Field(min_length=1)
    answer: str = Field(min_length=1)


class CardUpdate(CardBase):
    pass


class CardOut(CardBase):
    id: int
    collection_id: int
    known: bool = False

    class Config:
        from_attributes = True


class CollectionOut(BaseModel):
    id: int
    name: str
    created_at: datetime
    total_cards: int
    known_cards: int
    remaining_cards: int
    is_mastered: bool


class CollectionDetail(CollectionOut):
    cards: list[CardOut]


class ImportResult(BaseModel):
    collection_id: int
    collection_name: str
    imported_count: int
    skipped_duplicates: int


class StudyCardsOut(BaseModel):
    collection_id: int
    collection_name: str
    is_mastered: bool
    remaining_cards: int
    cards: list[CardOut]


class CardProgressAction(BaseModel):
    card_id: int
    known: bool


class CollectionCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class MessageOut(BaseModel):
    message: str
