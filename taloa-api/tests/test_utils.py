"""Testes dos utils de privacidade — hash de IP (nunca IP cru) e digits_only."""
from app.utils.ip_hash import digits_only, hash_ip


def test_hash_ip_nunca_retorna_ip_cru():
    h = hash_ip("192.168.1.10")
    assert h is not None
    assert "192.168" not in h
    assert len(h) == 64  # SHA-256 hex


def test_hash_ip_usa_primeiro_do_xff():
    assert hash_ip("1.2.3.4, 10.0.0.1") == hash_ip("1.2.3.4")


def test_hash_ip_vazio():
    assert hash_ip(None) is None
    assert hash_ip("") is None


def test_digits_only():
    assert digits_only("+353 (87) 123-4567") == "353871234567"
    assert digits_only(None) is None
    assert digits_only("abc") is None


def test_health_endpoint(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"
