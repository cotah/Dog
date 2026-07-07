"""Travel Checklist (Etapa 28) — geracao por template, gating Plus+, CRUD.

Padrao da suite: fake do Supabase em memoria + dependency override do auth.
O gating usa billing_service.get_active_subscription, entao o monkeypatch
cobre os DOIS modulos (travel_service e billing_service).
"""
import pytest

from tests.conftest import FakeSupabase


def _seed(fake_sb, monkeypatch, species="dog", with_sub=True):
    from app.services import billing_service, travel_service

    monkeypatch.setattr(travel_service, "get_service_client", lambda: fake_sb)
    monkeypatch.setattr(billing_service, "get_service_client", lambda: fake_sb)
    fake_sb.store["pets"] = [
        {"id": "pet-1", "owner_id": "owner-1", "species": species, "name": "Rex"},
    ]
    if with_sub:
        fake_sb.store["subscriptions"] = [{
            "id": "sub-1", "user_id": "owner-1", "status": "active",
            "plan": {"name": "plus", "display_name": "Plus", "max_pets": 2},
            "created_at": "2026-01-01T00:00:00+00:00",
        }]


def _create_trip(client, **overrides):
    body = {
        "travel_type": "plane", "scope": "international",
        "travel_date": "2026-09-01", "destination": "Lisbon",
    }
    body.update(overrides)
    return client.post("/v1/pets/pet-1/trips", json=body)


# ── Gating e ownership ───────────────────────────────────────
def test_free_user_gets_402(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch, with_sub=False)
    assert _create_trip(as_owner).status_code == 402
    assert as_owner.get("/v1/pets/pet-1/trips").status_code == 402


def test_other_owner_gets_403(as_other, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    fake_sb.store["subscriptions"].append({
        "id": "sub-2", "user_id": "owner-2", "status": "active",
        "plan": {"name": "plus"}, "created_at": "2026-01-01T00:00:00+00:00",
    })
    assert _create_trip(as_other).status_code == 403


# ── Geracao por template ─────────────────────────────────────
def test_plane_international_dog_has_passport_and_crate(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch, species="dog")
    r = _create_trip(as_owner)
    assert r.status_code == 201
    keys = {i["item_key"] for i in r.json()["items"]}
    assert "eu_pet_passport" in keys
    assert "rabies_vaccine" in keys
    assert "iata_crate" in keys
    assert "car_harness" not in keys  # item de carro nao entra em aviao


def test_car_domestic_dog_has_no_passport(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch, species="dog")
    r = _create_trip(as_owner, travel_type="car", scope="domestic")
    keys = {i["item_key"] for i in r.json()["items"]}
    assert "eu_pet_passport" not in keys
    assert "iata_crate" not in keys
    assert "car_harness" in keys
    assert "food_supply" in keys  # base entra sempre


def test_species_specific_items(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch, species="reptile")
    r = _create_trip(as_owner, travel_type="car", scope="domestic")
    keys = {i["item_key"] for i in r.json()["items"]}
    assert "heat_pack" in keys          # so repteis
    assert "rabies_vaccine" not in keys  # so dog/cat internacional
    assert "waste_bags" not in keys      # so caes


def test_due_date_from_travel_date(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    r = _create_trip(as_owner, travel_date="2026-09-01")
    items = {i["item_key"]: i for i in r.json()["items"]}
    # rabies_vaccine tem days_before=21 -> 2026-08-11
    assert items["rabies_vaccine"]["due_date"] == "2026-08-11"
    # itens sem days_before nao tem due_date
    assert items["food_supply"]["due_date"] is None


# ── CRUD ─────────────────────────────────────────────────────
def test_list_trips_with_progress(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    trip = _create_trip(as_owner).json()
    item_id = trip["items"][0]["id"]
    as_owner.patch(f"/v1/trips/{trip['id']}/items/{item_id}", json={"is_checked": True})
    lst = as_owner.get("/v1/pets/pet-1/trips").json()
    assert len(lst) == 1
    assert lst[0]["checked_count"] == 1
    assert lst[0]["total_count"] == len(trip["items"])


def test_toggle_item(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    trip = _create_trip(as_owner).json()
    item_id = trip["items"][0]["id"]
    r = as_owner.patch(f"/v1/trips/{trip['id']}/items/{item_id}", json={"is_checked": True})
    assert r.status_code == 200 and r.json()["is_checked"] is True
    r = as_owner.patch(f"/v1/trips/{trip['id']}/items/{item_id}", json={"is_checked": False})
    assert r.json()["is_checked"] is False


def test_custom_item_create_and_delete(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    trip = _create_trip(as_owner).json()
    r = as_owner.post(f"/v1/trips/{trip['id']}/items", json={"label": "Brinquedo favorito"})
    assert r.status_code == 201
    item = r.json()
    assert item["item_key"] is None and item["label"] == "Brinquedo favorito"
    assert item["section"] == "essentials"
    r = as_owner.delete(f"/v1/trips/{trip['id']}/items/{item['id']}")
    assert r.status_code == 200
    detail = as_owner.get(f"/v1/trips/{trip['id']}").json()
    assert item["id"] not in {i["id"] for i in detail["items"]}


def test_delete_trip_cascades_items(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    trip = _create_trip(as_owner).json()
    r = as_owner.delete(f"/v1/trips/{trip['id']}")
    assert r.status_code == 200
    # fake nao tem FK cascade — o service apaga os itens explicitamente
    assert fake_sb.store.get("trip_checklist_items", []) == []
    assert as_owner.get(f"/v1/trips/{trip['id']}").status_code == 404


def test_trip_of_other_owner_404_or_403(as_other, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    fake_sb.store["pet_trips"] = [{
        "id": "trip-1", "pet_id": "pet-1", "owner_id": "owner-1",
        "travel_type": "car", "scope": "domestic", "travel_date": "2026-09-01",
    }]
    fake_sb.store["subscriptions"].append({
        "id": "sub-2", "user_id": "owner-2", "status": "active",
        "plan": {"name": "plus"}, "created_at": "2026-01-01T00:00:00+00:00",
    })
    assert as_other.get("/v1/trips/trip-1").status_code == 403


def test_pdf_endpoint(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    trip = _create_trip(as_owner).json()
    r = as_owner.get(f"/v1/trips/{trip['id']}/pdf")
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.content[:4] == b"%PDF"


def test_patch_item_of_another_trip_404(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    trip_a = _create_trip(as_owner).json()
    trip_b = _create_trip(as_owner, travel_type="car", scope="domestic").json()
    item_b = trip_b["items"][0]["id"]
    r = as_owner.patch(f"/v1/trips/{trip_a['id']}/items/{item_b}", json={"is_checked": True})
    assert r.status_code == 404


def test_invalid_travel_type_422(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    r = _create_trip(as_owner, travel_type="boat")
    assert r.status_code == 422


def test_custom_item_on_other_owners_trip_403(as_other, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    fake_sb.store["pet_trips"] = [{
        "id": "trip-1", "pet_id": "pet-1", "owner_id": "owner-1",
        "travel_type": "car", "scope": "domestic", "travel_date": "2026-09-01",
    }]
    fake_sb.store["subscriptions"].append({
        "id": "sub-2", "user_id": "owner-2", "status": "active",
        "plan": {"name": "plus"}, "created_at": "2026-01-01T00:00:00+00:00",
    })
    r = as_other.post("/v1/trips/trip-1/items", json={"label": "X"})
    assert r.status_code == 403


def test_pdf_with_unicode_title_does_not_crash(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    trip = _create_trip(as_owner, title="Férias 🐕 em São Paulo").json()
    as_owner.post(f"/v1/trips/{trip['id']}/items", json={"label": "Coleira nova 🎾"})
    r = as_owner.get(f"/v1/trips/{trip['id']}/pdf")
    assert r.status_code == 200
    assert r.content[:4] == b"%PDF"
