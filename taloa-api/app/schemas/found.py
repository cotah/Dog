"""Schema do 'I Found This Pet' (found_reports)."""
from pydantic import BaseModel


class FoundReportCreate(BaseModel):
    tag_code: str
    found_area: str | None = None
    notes: str | None = None
    finder_phone: str | None = None
    photo_url: str | None = None
    location_lat: float | None = None
    location_lng: float | None = None
    location_granted: bool = False


class FoundReportResponse(BaseModel):
    ok: bool = True
    message: str = "Thank you. The owner has been notified."
