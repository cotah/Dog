"""Exotic Care Guide (Etapa 29) — conteudo estatico por especie, gating Plus+.

Padrao da suite: fake do Supabase em memoria + dependency override do auth.
O gating usa billing_service.get_active_subscription, entao o monkeypatch
cobre os DOIS modulos (care_guide_service e billing_service).
"""
import pytest

EXOTIC_SPECIES = ["reptile", "bird", "rabbit", "small_mammal", "fish", "other"]
SECTIONS = [
    "habitat", "feeding", "environment", "handling",
    "hygiene", "enrichment", "warning_signs",
]


def _seed(fake_sb, monkeypatch, species="reptile", with_sub=True):
    from app.services import billing_service, care_guide_service

    monkeypatch.setattr(care_guide_service, "get_service_client", lambda: fake_sb)
    monkeypatch.setattr(billing_service, "get_service_client", lambda: fake_sb)
    fake_sb.store["pets"] = [
        {"id": "pet-1", "owner_id": "owner-1", "species": species, "name": "Ziggy"},
    ]
    if with_sub:
        fake_sb.store["subscriptions"] = [{
            "id": "sub-1", "user_id": "owner-1", "status": "active",
            "plan": {"name": "plus", "display_name": "Plus", "max_pets": 2},
            "created_at": "2026-01-01T00:00:00+00:00",
        }]


# ── Conteudo (unit, sem HTTP) ────────────────────────────────
def test_all_exotic_species_have_all_sections_with_en_texts():
    from app.services import care_guide_service as cg

    assert set(cg.CARE_GUIDES) == set(EXOTIC_SPECIES)
    assert set(cg.EXOTIC_SPECIES) == set(EXOTIC_SPECIES)
    for species in EXOTIC_SPECIES:
        guide = cg.CARE_GUIDES[species]
        assert list(guide) == SECTIONS, f"{species}: secoes fora do padrao"
        for section, tips in guide.items():
            assert 3 <= len(tips) <= 5, f"{species}.{section}: {len(tips)} dicas"
            for key in tips:
                text = cg.TIP_TEXTS_EN.get(key)
                assert isinstance(text, str) and len(text) > 10, f"sem texto EN: {key}"


def test_tip_keys_are_unique_per_species_guide():
    from app.services import care_guide_service as cg

    for species in EXOTIC_SPECIES:
        keys = [k for tips in cg.CARE_GUIDES[species].values() for k in tips]
        assert len(keys) == len(set(keys)), f"{species}: tip_key duplicada"


def test_reptile_environment_mentions_temperature():
    from app.services import care_guide_service as cg

    texts = " ".join(
        cg.TIP_TEXTS_EN[k].lower() for k in cg.CARE_GUIDES["reptile"]["environment"]
    )
    assert "temperature" in texts


def test_fish_environment_mentions_water_quality():
    from app.services import care_guide_service as cg

    texts = " ".join(
        cg.TIP_TEXTS_EN[k].lower() for k in cg.CARE_GUIDES["fish"]["environment"]
    )
    assert "water" in texts


def test_warning_signs_always_point_to_exotic_vet():
    """Regra 5 do CLAUDE.md: orientar vet, nunca diagnosticar/prescrever."""
    from app.services import care_guide_service as cg

    for species in EXOTIC_SPECIES:
        texts = " ".join(
            cg.TIP_TEXTS_EN[k].lower()
            for k in cg.CARE_GUIDES[species]["warning_signs"]
        )
        assert "vet" in texts, f"{species}: warning_signs sem orientacao de vet"


# ── API: guia ────────────────────────────────────────────────
def test_get_care_guide_returns_ordered_sections(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch, species="reptile")
    r = as_owner.get("/v1/pets/pet-1/care-guide")
    assert r.status_code == 200
    body = r.json()
    assert body["species"] == "reptile"
    assert [s["key"] for s in body["sections"]] == SECTIONS
    for s in body["sections"]:
        assert 3 <= len(s["tips"]) <= 5


def test_free_user_gets_402(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch, with_sub=False)
    assert as_owner.get("/v1/pets/pet-1/care-guide").status_code == 402
    assert as_owner.get("/v1/pets/pet-1/care-guide/pdf").status_code == 402


def test_other_owner_gets_403(as_other, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    fake_sb.store["subscriptions"].append({
        "id": "sub-2", "user_id": "owner-2", "status": "active",
        "plan": {"name": "plus"}, "created_at": "2026-01-01T00:00:00+00:00",
    })
    assert as_other.get("/v1/pets/pet-1/care-guide").status_code == 403


@pytest.mark.parametrize("species", ["dog", "cat"])
def test_non_exotic_species_gets_404(as_owner, fake_sb, monkeypatch, species):
    _seed(fake_sb, monkeypatch, species=species)
    assert as_owner.get("/v1/pets/pet-1/care-guide").status_code == 404
    assert as_owner.get("/v1/pets/pet-1/care-guide/pdf").status_code == 404


def test_unknown_pet_gets_404(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch)
    assert as_owner.get("/v1/pets/nope/care-guide").status_code == 404


# ── API: PDF ─────────────────────────────────────────────────
def test_pdf_endpoint(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch, species="bird")
    r = as_owner.get("/v1/pets/pet-1/care-guide/pdf")
    assert r.status_code == 200
    assert r.headers["content-type"] == "application/pdf"
    assert r.content[:4] == b"%PDF"


def test_pdf_with_unicode_pet_name_does_not_crash(as_owner, fake_sb, monkeypatch):
    _seed(fake_sb, monkeypatch, species="fish")
    fake_sb.store["pets"][0]["name"] = "Zé Peixão 🐠"
    r = as_owner.get("/v1/pets/pet-1/care-guide/pdf")
    assert r.status_code == 200
    assert r.content[:4] == b"%PDF"
