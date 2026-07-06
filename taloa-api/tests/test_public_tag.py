"""Testes da tag publica (/v1/tags/{code}/public) — privacidade e estados."""
import pytest

from app.services import tag_service


@pytest.fixture(autouse=True)
def _patch_sb(monkeypatch, fake_sb):
    monkeypatch.setattr(tag_service, "get_service_client", lambda: fake_sb)
    return fake_sb


def _seed_active_tag(fake_sb, *, show_phone=False, show_email=False, status="active"):
    fake_sb.store["tags"] = [
        {"tag_code": "TAL-000001", "status": status, "tag_type": "standard",
         "pet_id": "pet-1", "owner_id": "owner-1"},
    ]
    fake_sb.store["pets"] = [
        {"id": "pet-1", "owner_id": "owner-1", "name": "Rex", "species": "dog",
         "breed_or_morph": "Mix", "sex": "male", "age_years": 3, "colour": "brown",
         "photo_url": None},
    ]
    fake_sb.store["pet_profiles"] = [
        {"pet_id": "pet-1", "allergies": "none", "show_phone": show_phone,
         "show_email": show_email, "private_notes": "SEGREDO"},
    ]
    fake_sb.store["users"] = [
        {"id": "owner-1", "phone": "+353 87 123 4567", "email": "owner@test.ie",
         "address_private": "Rua Secreta 1", "eircode_private": "D01X2Y3"},
    ]


def test_tag_nao_encontrada_404(client):
    r = client.get("/v1/tags/TAL-999999/public")
    assert r.status_code == 404


def test_tag_pendente_nao_expoe_pet(client, fake_sb):
    fake_sb.store["tags"] = [
        {"tag_code": "TAL-000002", "status": "pending", "tag_type": None,
         "pet_id": None, "owner_id": None},
    ]
    r = client.get("/v1/tags/TAL-000002/public")
    assert r.status_code == 200
    body = r.json()
    assert body["status"] == "pending"
    assert body["pet"] is None


def test_tag_ativa_mostra_pet_sem_dados_privados(client, fake_sb):
    _seed_active_tag(fake_sb)
    r = client.get("/v1/tags/TAL-000001/public")
    assert r.status_code == 200
    body = r.json()
    assert body["pet"]["name"] == "Rex"
    # NUNCA endereco/eircode/private_notes na resposta publica
    raw = r.text.lower()
    assert "address_private" not in raw
    assert "eircode" not in raw
    assert "segredo" not in raw


def test_contato_respeita_show_phone_false(client, fake_sb):
    _seed_active_tag(fake_sb, show_phone=False, show_email=False)
    body = client.get("/v1/tags/TAL-000001/public").json()
    assert body["contact"]["phone"] is None
    assert body["contact"]["email"] is None


def test_contato_respeita_show_phone_true(client, fake_sb):
    _seed_active_tag(fake_sb, show_phone=True)
    body = client.get("/v1/tags/TAL-000001/public").json()
    assert body["contact"]["phone"] == "+353 87 123 4567"
    assert body["contact"]["whatsapp"] == "353871234567"
    assert body["contact"]["email"] is None  # show_email continua False


def test_tag_lost_inclui_lost_info(client, fake_sb):
    _seed_active_tag(fake_sb, status="lost")
    fake_sb.store["lost_reports"] = [
        {"pet_id": "pet-1", "status": "active", "last_seen_at": "2026-07-01T10:00:00Z",
         "last_seen_area": "Phoenix Park", "description": "fugiu",
         "created_at": "2026-07-01T10:00:00Z"},
    ]
    body = client.get("/v1/tags/TAL-000001/public").json()
    assert body["status"] == "lost"
    assert body["lost"]["last_seen_area"] == "Phoenix Park"
