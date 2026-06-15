"""Schemas do agente de IA (TaloaChat)."""
from typing import Literal

from pydantic import BaseModel, Field

ChatContext = Literal["emergency", "lost_pet", "general"]


class ChatMessage(BaseModel):
    role: Literal["user", "assistant"]
    content: str = Field(min_length=1, max_length=4000)


class ChatRequest(BaseModel):
    session_id: str = Field(min_length=8, max_length=128)
    messages: list[ChatMessage] = Field(min_length=1, max_length=40)
    context: ChatContext = "general"
    # Contexto dinamico opcional (dados publicos do pet quando na pagina da tag).
    pet_context: dict | None = None
    tag_code: str | None = None
