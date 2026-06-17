"""Schemas das reviews de providers (directory)."""
from pydantic import BaseModel, Field


class ReviewCreate(BaseModel):
    rating: int = Field(ge=1, le=5)
    comment: str | None = Field(default=None, max_length=1000)


class Review(BaseModel):
    id: str
    rating: int
    comment: str | None = None
    reviewer_name: str | None = None      # primeiro nome de quem avaliou
    created_at: str | None = None
