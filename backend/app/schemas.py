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
    is_markdown: bool = False

    class Config:
        from_attributes = True


class UserOut(BaseModel):
    id: int
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    photo_url: str | None = None
    theme_key: str | None = None


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
    cards_total: int


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
    has_children: bool = False
    children: list["NoteTreeNode"] = Field(default_factory=list)


class PaginatedCardsOut(BaseModel):
    items: list[CardOut]
    total: int
    offset: int
    limit: int


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


class NotePathRename(BaseModel):
    path: str
    new_name: str


class UserThemeUpdate(BaseModel):
    theme_key: str


class AdminMeOut(BaseModel):
    is_admin: bool


class AdminUserOut(BaseModel):
    id: int
    telegram_id: int
    username: str | None = None
    first_name: str | None = None
    last_name: str | None = None
    request_count: int
    error_count: int
    last_seen: datetime | None = None
    is_banned: bool


class AdminRequestOut(BaseModel):
    id: int
    user_id: int | None = None
    ip: str | None = None
    method: str
    path: str
    status_code: int
    duration_ms: int
    request_id: str
    user_agent: str | None = None
    created_at: datetime


class AdminOverviewOut(BaseModel):
    window_minutes: int
    total_requests: int
    unique_users: int
    unique_ips: int
    error_requests: int


class AdminBanIn(BaseModel):
    user_id: int | None = None
    ip: str | None = None
    reason: str | None = None
    duration_minutes: int | None = None


class AdminUnbanIn(BaseModel):
    user_id: int | None = None
    ip: str | None = None


class AdminAlertOut(BaseModel):
    id: int
    kind: str
    user_id: int | None = None
    ip: str | None = None
    window_seconds: int
    count: int
    created_at: datetime
