"""Reviews de providers (directory). O rating/review_count do provider e
recalculado por trigger no banco — aqui so escrevemos/lemos as reviews.

REGRA: 1 review por user por provider (UNIQUE + upsert). So o primeiro nome do
reviewer e exposto.
"""
from fastapi import HTTPException, status

from app.core.supabase import get_service_client
from app.schemas.auth import CurrentUser
from app.schemas.review import Review, ReviewCreate


def _first_name(name: str | None) -> str | None:
    if not name:
        return None
    return name.strip().split(" ")[0] or None


def list_reviews(provider_id: str, limit: int = 50) -> list[Review]:
    sb = get_service_client()
    res = (
        sb.table("provider_reviews")
        .select("id, user_id, rating, comment, created_at")
        .eq("provider_id", provider_id)
        .order("created_at", desc=True)
        .limit(limit)
        .execute()
    )
    rows = res.data or []
    names: dict[str, str | None] = {}
    user_ids = list({r["user_id"] for r in rows})
    if user_ids:
        ures = sb.table("users").select("id, name").in_("id", user_ids).execute()
        names = {u["id"]: u.get("name") for u in (ures.data or [])}
    return [
        Review(
            id=r["id"],
            rating=r["rating"],
            comment=r.get("comment"),
            reviewer_name=_first_name(names.get(r["user_id"])),
            created_at=r.get("created_at"),
        )
        for r in rows
    ]


def submit_review(user: CurrentUser, provider_id: str, body: ReviewCreate) -> Review:
    """Cria ou atualiza (upsert) a review do utilizador para este provider."""
    sb = get_service_client()
    prov = (
        sb.table("service_providers").select("id").eq("id", provider_id).limit(1).execute()
    )
    if not prov.data:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Provider not found")

    res = (
        sb.table("provider_reviews")
        .upsert(
            {
                "provider_id": provider_id,
                "user_id": user.id,
                "rating": body.rating,
                "comment": body.comment,
            },
            on_conflict="provider_id,user_id",
        )
        .execute()
    )
    row = res.data[0]
    uname = sb.table("users").select("name").eq("id", user.id).limit(1).execute()
    name = uname.data[0].get("name") if uname.data else None
    return Review(
        id=row["id"],
        rating=row["rating"],
        comment=row.get("comment"),
        reviewer_name=_first_name(name),
        created_at=row.get("created_at"),
    )


def admin_delete(review_id: str) -> bool:
    sb = get_service_client()
    res = sb.table("provider_reviews").delete().eq("id", review_id).execute()
    return bool(res.data)
