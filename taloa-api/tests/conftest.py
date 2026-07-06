"""Fixtures de teste — fake do Supabase em memoria + TestClient.

Os services chamam `get_service_client()` importado no proprio modulo, entao
cada teste faz monkeypatch NO MODULO do service (ex: care_service.get_service_client).
Nenhum teste toca o banco real.
"""
import os

# Env minimo ANTES de importar o app (em CI nao existe .env).
os.environ.setdefault("SUPABASE_URL", "https://test.supabase.co")
os.environ.setdefault("SUPABASE_ANON_KEY", "test-anon-key")
os.environ.setdefault("SUPABASE_SERVICE_ROLE_KEY", "test-service-key")
os.environ.setdefault("SUPABASE_JWT_SECRET", "test-jwt-secret")
os.environ["SENTRY_DSN"] = ""  # nunca enviar eventos ao Sentry durante testes

import pytest
from fastapi.testclient import TestClient

from app.core.security import get_current_user
from app.main import app
from app.schemas.auth import CurrentUser


# ── Fake Supabase ────────────────────────────────────────────
class _Result:
    def __init__(self, data):
        self.data = data


class _NotFilter:
    """Suporta a sintaxe `.not_.is_(col, "null")` do supabase-py."""

    def __init__(self, query):
        self._query = query

    def is_(self, column, value):
        if value == "null":
            self._query._filters.append(lambda r: r.get(column) is not None)
        return self._query


class _FakeQuery:
    def __init__(self, store, table_name):
        self._store = store
        self._table = table_name
        self._filters = []
        self._order = None
        self._limit = None
        self._range = None
        self._op = "select"
        self._payload = None

    # -- builders (chainable) --
    def select(self, *_cols):
        return self

    def insert(self, payload):
        self._op = "insert"
        self._payload = payload
        return self

    def update(self, payload):
        self._op = "update"
        self._payload = payload
        return self

    def delete(self):
        self._op = "delete"
        return self

    def eq(self, column, value):
        self._filters.append(lambda r: r.get(column) == value)
        return self

    def gt(self, column, value):
        self._filters.append(lambda r: r.get(column) is not None and r[column] > value)
        return self

    def lte(self, column, value):
        self._filters.append(lambda r: r.get(column) is not None and r[column] <= value)
        return self

    @property
    def not_(self):
        return _NotFilter(self)

    def order(self, column, desc=False):
        self._order = (column, desc)
        return self

    def limit(self, n):
        self._limit = n
        return self

    def range(self, start, end):
        self._range = (start, end)
        return self

    # -- execucao --
    def _rows(self):
        rows = [r for r in self._store.setdefault(self._table, []) if all(f(r) for f in self._filters)]
        if self._order:
            col, desc = self._order
            rows.sort(key=lambda r: (r.get(col) is None, r.get(col)), reverse=desc)
        return rows

    def execute(self):
        if self._op == "insert":
            payloads = self._payload if isinstance(self._payload, list) else [self._payload]
            inserted = []
            for p in payloads:
                row = dict(p)
                n = len(self._store.setdefault(self._table, [])) + 1
                row.setdefault("id", f"{self._table}-{n}")
                # Defaults que no banco real vem do Postgres:
                if self._table == "care_shares":
                    row.setdefault("token", f"tok-gen-{n}")
                row.setdefault("created_at", "2026-01-01T00:00:00+00:00")
                self._store[self._table].append(row)
                inserted.append(row)
            return _Result(inserted)

        if self._op == "update":
            rows = self._rows()
            for r in rows:
                r.update(self._payload)
            return _Result(rows)

        if self._op == "delete":
            rows = self._rows()
            self._store[self._table] = [r for r in self._store.get(self._table, []) if r not in rows]
            return _Result(rows)

        rows = self._rows()
        if self._range is not None:
            start, end = self._range
            rows = rows[start : end + 1]
        if self._limit is not None:
            rows = rows[: self._limit]
        return _Result(rows)


class FakeSupabase:
    """Store em memoria: {"tabela": [rows]}. API compativel com supabase-py."""

    def __init__(self, tables: dict | None = None):
        self.store = tables or {}

    def table(self, name):
        return _FakeQuery(self.store, name)


# ── Fixtures ─────────────────────────────────────────────────
@pytest.fixture
def fake_sb():
    return FakeSupabase()


@pytest.fixture
def client():
    """TestClient sem auth (rotas publicas)."""
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


OWNER = CurrentUser(id="owner-1", email="owner@test.ie", role="owner")
OTHER = CurrentUser(id="owner-2", email="other@test.ie", role="owner")
ADMIN = CurrentUser(id="admin-1", email="admin@test.ie", role="admin")


@pytest.fixture
def as_owner():
    """Loga como OWNER via dependency override; limpa ao final."""
    app.dependency_overrides[get_current_user] = lambda: OWNER
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture
def as_other():
    app.dependency_overrides[get_current_user] = lambda: OTHER
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()
