"""Partners Directory (Etapa 23): listagem publica com filtros + CRUD admin.

REGRA: nas queries publicas selecionamos SO colunas seguras (sem `email`,
`notes`, `is_active`) — o email do provider nunca sai do banco para o publico.
"""
import re

from app.core.supabase import get_service_client
from app.schemas.directory import (
    AdminProvider,
    CategoryCount,
    ProviderCreate,
    ProviderUpdate,
    PublicProvider,
)

# Colunas expostas ao publico (sem email/notes/is_active).
PUBLIC_COLS = (
    "id,name,category,description,phone,website,address,area,eircode,"
    "species_supported,emergency_24h,hours,price_range,languages,"
    "is_verified,is_featured,is_taloa_partner,partner_discount,"
    "photo_url,logo_url,rating,review_count,latitude,longitude"
)


def _safe_search(term: str) -> str:
    """Sanitiza o termo de busca antes de montar o filtro `or` do PostgREST.

    Remove virgula/parenteses/% e afins para nao quebrar nem injetar no filtro.
    """
    return re.sub(r"[^\w\s-]", " ", term).strip()[:80]


def list_providers(
    *,
    category: str | None = None,
    area: str | None = None,
    species: str | None = None,
    emergency_24h: bool | None = None,
    is_featured: bool | None = None,
    search: str | None = None,
    limit: int = 20,
    offset: int = 0,
) -> list[PublicProvider]:
    sb = get_service_client()
    q = sb.table("service_providers").select(PUBLIC_COLS).eq("is_active", True)

    if category:
        q = q.eq("category", category)
    if area:
        q = q.eq("area", area)
    if species:
        q = q.contains("species_supported", [species])
    if emergency_24h is not None:
        q = q.eq("emergency_24h", emergency_24h)
    if is_featured is not None:
        q = q.eq("is_featured", is_featured)
    if search:
        clean = _safe_search(search)
        if clean:
            q = q.or_(f"name.ilike.%{clean}%,description.ilike.%{clean}%")

    # Destaques primeiro, depois 24h, depois alfabetico.
    q = (
        q.order("is_featured", desc=True)
        .order("emergency_24h", desc=True)
        .order("name")
        .range(offset, offset + limit - 1)
    )
    res = q.execute()
    return [PublicProvider(**r) for r in (res.data or [])]


def categories_with_counts() -> list[CategoryCount]:
    """Contagem de providers ATIVOS por categoria."""
    sb = get_service_client()
    res = (
        sb.table("service_providers")
        .select("category")
        .eq("is_active", True)
        .execute()
    )
    counts: dict[str, int] = {}
    for r in res.data or []:
        cat = r.get("category")
        if cat:
            counts[cat] = counts.get(cat, 0) + 1
    return [
        CategoryCount(category=c, count=n)
        for c, n in sorted(counts.items(), key=lambda kv: (-kv[1], kv[0]))
    ]


def get_provider(provider_id: str) -> PublicProvider | None:
    sb = get_service_client()
    res = (
        sb.table("service_providers")
        .select(PUBLIC_COLS)
        .eq("id", provider_id)
        .eq("is_active", True)
        .limit(1)
        .execute()
    )
    if not res.data:
        return None
    return PublicProvider(**res.data[0])


# ── Admin (todas as colunas, inclui inativos) ─────────────────────────────────
def admin_list(
    *,
    category: str | None = None,
    search: str | None = None,
    limit: int = 100,
    offset: int = 0,
) -> list[AdminProvider]:
    sb = get_service_client()
    q = sb.table("service_providers").select("*")
    if category:
        q = q.eq("category", category)
    if search:
        clean = _safe_search(search)
        if clean:
            q = q.or_(f"name.ilike.%{clean}%,description.ilike.%{clean}%")
    q = q.order("is_featured", desc=True).order("name").range(offset, offset + limit - 1)
    res = q.execute()
    return [AdminProvider(**r) for r in (res.data or [])]


def admin_create(data: ProviderCreate) -> AdminProvider:
    sb = get_service_client()
    res = (
        sb.table("service_providers")
        .insert(data.model_dump(exclude_none=True))
        .execute()
    )
    return AdminProvider(**res.data[0])


def admin_update(provider_id: str, data: ProviderUpdate) -> AdminProvider | None:
    sb = get_service_client()
    payload = data.model_dump(exclude_unset=True)
    if not payload:
        # nada para atualizar — retorna o estado atual
        cur = sb.table("service_providers").select("*").eq("id", provider_id).limit(1).execute()
        return AdminProvider(**cur.data[0]) if cur.data else None
    res = (
        sb.table("service_providers")
        .update(payload)
        .eq("id", provider_id)
        .execute()
    )
    if not res.data:
        return None
    return AdminProvider(**res.data[0])


def admin_soft_delete(provider_id: str) -> bool:
    """Soft delete: marca is_active = false."""
    sb = get_service_client()
    res = (
        sb.table("service_providers")
        .update({"is_active": False})
        .eq("id", provider_id)
        .execute()
    )
    return bool(res.data)
