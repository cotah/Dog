"""Testes de auth — JWT invalido, role lido do BANCO (nunca so do JWT)."""
import pytest
from fastapi import HTTPException

from app.core import security


@pytest.fixture(autouse=True)
def _patch_sb(monkeypatch, fake_sb):
    monkeypatch.setattr(security, "get_service_client", lambda: fake_sb)
    return fake_sb


class _Creds:
    def __init__(self, token: str):
        self.credentials = token


def test_rota_protegida_sem_token_401_ou_403(client):
    # HTTPBearer(auto_error=True) responde 403 sem header (comportamento FastAPI)
    r = client.get("/v1/care-shares/pet/pet-1")
    assert r.status_code in (401, 403)


def test_token_lixo_401(client):
    r = client.get(
        "/v1/care-shares/pet/pet-1",
        headers={"Authorization": "Bearer nao-e-um-jwt"},
    )
    assert r.status_code == 401


def test_role_vem_do_banco(monkeypatch, fake_sb):
    """Mesmo que o JWT alegue admin, o role usado e o do banco."""
    monkeypatch.setattr(
        security, "_decode_token", lambda t: {"sub": "user-1", "role": "admin"}
    )
    fake_sb.store["users"] = [
        {"id": "user-1", "email": "u@test.ie", "role": "owner"},
    ]
    user = security.get_current_user(_Creds("qualquer"))
    assert user.role == "owner"  # do banco, nao do token


def test_usuario_inexistente_401(monkeypatch, fake_sb):
    monkeypatch.setattr(security, "_decode_token", lambda t: {"sub": "fantasma"})
    fake_sb.store["users"] = []
    with pytest.raises(HTTPException) as e:
        security.get_current_user(_Creds("qualquer"))
    assert e.value.status_code == 401


def test_require_admin_bloqueia_owner():
    from app.schemas.auth import CurrentUser

    with pytest.raises(HTTPException) as e:
        security.require_admin(CurrentUser(id="x", email=None, role="owner"))
    assert e.value.status_code == 403
