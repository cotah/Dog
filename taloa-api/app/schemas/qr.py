"""Schemas do gerador de QR Codes / lote de tags."""
from pydantic import BaseModel, Field


class NextNumberResponse(BaseModel):
    next_number: int


class GenerateRequest(BaseModel):
    quantity: int = Field(ge=1, le=100)
    start_number: int = Field(ge=1)


class GenerateResponse(BaseModel):
    tag_codes: list[str]


class ExportRequest(BaseModel):
    tag_codes: list[str]
