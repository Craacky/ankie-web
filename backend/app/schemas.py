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


class UserOut(BaseModel):
    id: int
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    photo_url: str | None = None


class AuthConfigOut(BaseModel):
    telegram_bot_username: str


class TelegramAuthPayload(BaseModel):
    id: int
    auth_date: int
    hash: str
    first_name: str | None = None
    last_name: str | None = None
    username: str | None = None
    photo_url: str | None = None


class FolderBase(BaseModel):
    name: str = Field(min_length=1, max_length=255)


class FolderCreate(FolderBase):
    pass


class FolderUpdate(FolderBase):
    pass


class FolderOut(FolderBase):
    id: int
    created_at: datetime
    collections_count: int


class CollectionFolderUpdate(BaseModel):
    folder_id: int | None = None


class CollectionOut(BaseModel):
    id: int
    name: str
    folder_id: int | None = None
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


class MessageOut(BaseModel):
    message: str


class NoteTreeNode(BaseModel):
    name: str
    path: str
    type: str
    children: list["NoteTreeNode"] = Field(default_factory=list)


class NoteFileOut(BaseModel):
    path: str
    name: str
    content: str


class NoteFileUpdate(BaseModel):
    path: str
    content: str


class NoteFileCreate(BaseModel):
    parent_path: str = ""
    name: str
    content: str = ""


class NoteFolderCreate(BaseModel):
    parent_path: str = ""
    name: str
