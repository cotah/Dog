"""Testes do care link (Etapa 25 + diario 27.5) — validade, ownership, privacidade."""
from datetime import datetime, timedelta, timezone

import pytest

from app.services import care_service


def _iso(days: int) -> str:
    return (datetime.now(timezone.utc) + timedelta(days=days)).isoformat()


@pytest.fixture(autouse=True)
def _patch_sb(monkeypatch, fake_sb):
    monkeypatch.setattr(care_service, "get_service_client", lambda: fake_sb)
    return fake_sb


def _seed(fake_sb, *, show_diary=False, expires_days=7, is_active=True):
    fake_sb.store["care_shares"] = [
        {"id": "share-1", "token": "tok-abc", "pet_id": "pet-1", "owner_id": "owner-1",
         "expires_at": _iso(expires_days), "is_active": is_active,
         "show_diary": show_diary, "created_at": _iso(-1)},
    ]
    fake_sb.store["pets"] = [
        {"id": "pet-1", "owner_id": "owner-1", "name": "Rex", "species": "dog"},
    ]
    fake_sb.store["pet_profiles"] = [
        {"pet_id": "pet-1", "medication": "None", "private_notes": "nota privada"},
    ]
    fake_sb.store["users"] = [
        {"id": "owner-1", "phone": "+353871234567", "email": "owner@test.ie"},
    ]
    fake_sb.store["tags"] = [
        {"pet_id": "pet-1", "tag_code": "TAL-000001", "tag_type": "standard"},
    ]


# ── Leitura publica /v1/care/{token} ─────────────────────────
def test_token_invalido_404(client):
    assert client.get("/v1/care/nao-existe").status_code == 404


def test_token_expirado_404(client, fake_sb):
    _seed(fake_sb, expires_days=-1)
    assert client.get("/v1/care/tok-abc").status_code == 404


def test_token_revogado_404(client, fake_sb):
    _seed(fake_sb, is_active=False)
    assert client.get("/v1/care/tok-abc").status_code == 404


def test_care_valido_mostra_telefone_nunca_email(client, fake_sb):
    _seed(fake_sb)
    body = client.get("/v1/care/tok-abc").json()
    assert body["pet_name"] == "Rex"
    assert body["owner_phone"] == "+353871234567"
    assert "owner@test.ie" not in str(body)  # email do dono NUNCA no care link


def test_diary_oculto_por_padrao(client, fake_sb):
    _seed(fake_sb, show_diary=False)
    fake_sb.store["pet_activities"] = [
        {"id": "a1", "pet_id": "pet-1", "activity_type": "walk",
         "occurred_at": _iso(-1)},
    ]
    body = client.get("/v1/care/tok-abc").json()
    assert body["show_diary"] is False
    assert body["diary_activities"] == []


def test_diary_visivel_com_show_diary(client, fake_sb):
    _seed(fake_sb, show_diary=True)
    fake_sb.store["pet_activities"] = [
        {"id": "a1", "pet_id": "pet-1", "activity_type": "walk",
         "occurred_at": _iso(-1)},
        {"id": "a2", "pet_id": "pet-2", "activity_type": "meal",
         "occurred_at": _iso(-1)},  # de OUTRO pet — nao pode aparecer
    ]
    fake_sb.store["pet_health_records"] = [
        {"id": "h1", "pet_id": "pet-1", "record_type": "vaccine", "title": "Rabies",
         "date": "2026-06-01", "next_due_date": (datetime.now(timezone.utc) + timedelta(days=30)).date().isoformat()},
        {"id": "h2", "pet_id": "pet-1", "record_type": "vaccine", "title": "Distante",
         "date": "2026-06-01", "next_due_date": (datetime.now(timezone.utc) + timedelta(days=90)).date().isoformat()},  # fora da janela de 60d
    ]
    body = client.get("/v1/care/tok-abc").json()
    assert body["show_diary"] is True
    assert [a["id"] for a in body["diary_activities"]] == ["a1"]
    assert [h["id"] for h in body["diary_health"]] == ["h1"]


# ── CRUD do dono ─────────────────────────────────────────────
def test_criar_share_do_proprio_pet(as_owner, fake_sb):
    _seed(fake_sb)
    r = as_owner.post("/v1/care-shares", json={"pet_id": "pet-1", "duration": "1w",
                                               "show_diary": True})
    assert r.status_code == 201
    body = r.json()
    assert body["show_diary"] is True
    assert body["care_url"].endswith(f"/care/{body['token']}")


def test_criar_share_de_pet_alheio_403(as_other, fake_sb):
    _seed(fake_sb)
    r = as_other.post("/v1/care-shares", json={"pet_id": "pet-1", "duration": "1w"})
    assert r.status_code == 403


def test_revogar_share_alheio_403(as_other, fake_sb):
    _seed(fake_sb)
    assert as_other.delete("/v1/care-shares/share-1").status_code == 403


def test_revogar_share_esconde_o_link(as_owner, client, fake_sb):
    _seed(fake_sb)
    assert as_owner.delete("/v1/care-shares/share-1").status_code == 200
    assert client.get("/v1/care/tok-abc").status_code == 404
