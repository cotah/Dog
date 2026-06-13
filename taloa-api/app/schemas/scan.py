"""Schema de registro de scan."""
from pydantic import BaseModel


class ScanCreate(BaseModel):
    tag_code: str
    action_taken: str | None = None
    # acoes: viewed_profile, clicked_call_owner, clicked_emergency,
    #        clicked_found_pet, shared_location, viewed_lost_page
    user_agent: str | None = None
    ip: str | None = None             # IP cru — o backend so guarda o HASH
    location_lat: float | None = None
    location_lng: float | None = None
    location_granted: bool = False


class ScanResponse(BaseModel):
    ok: bool = True
