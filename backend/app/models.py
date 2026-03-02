from datetime import datetime

from sqlalchemy import Boolean, DateTime, ForeignKey, String, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column, relationship

from .database import Base


class Collection(Base):
    __tablename__ = "collections"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(255), unique=True, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    cards: Mapped[list["Card"]] = relationship("Card", back_populates="collection", cascade="all, delete-orphan")


class Card(Base):
    __tablename__ = "cards"

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    collection_id: Mapped[int] = mapped_column(ForeignKey("collections.id", ondelete="CASCADE"), nullable=False, index=True)
    question: Mapped[str] = mapped_column(Text, nullable=False)
    answer: Mapped[str] = mapped_column(Text, nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, nullable=False)

    collection: Mapped[Collection] = relationship("Collection", back_populates="cards")
    progress: Mapped["CardProgress"] = relationship("CardProgress", back_populates="card", uselist=False, cascade="all, delete-orphan")


class CardProgress(Base):
    __tablename__ = "card_progress"
    __table_args__ = (UniqueConstraint("card_id", name="uq_card_progress_card_id"),)

    id: Mapped[int] = mapped_column(primary_key=True, index=True)
    card_id: Mapped[int] = mapped_column(ForeignKey("cards.id", ondelete="CASCADE"), nullable=False, index=True)
    known: Mapped[bool] = mapped_column(Boolean, default=False, nullable=False)
    last_reviewed_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)
    known_at: Mapped[datetime | None] = mapped_column(DateTime, nullable=True)

    card: Mapped[Card] = relationship("Card", back_populates="progress")
