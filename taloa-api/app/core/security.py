"""Validacao do JWT emitido pelo Supabase Auth + dependencies de autorizacao.

Os projetos Supabase atuais assinam o JWT com chaves ASSIMETRICAS (ES256/RS256).
Validamos pela chave PUBLICA via JWKS — mais seguro, pois o segredo nunca precisa
ser compartilhado. Mantemos fallback HS256 (projetos legados com shared secret).

Fluxo: Supabase Auth emite o JWT -> frontend manda no header Authorization
-> aqui o FastAPI valida a assinatura e busca o ROLE no banco (nunca confiar so no token).
"""
import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from jwt import PyJWKClient

from app.config import settings
from app.core.supabase import get_service_client
from app.schemas.auth import CurrentUser

_bearer = HTTPBearer(auto_error=True)

# Cliente JWKS (cacheia as chaves publicas do Supabase)
_JWKS_URL = f"{settings.SUPABASE_URL}/auth/v1/.well-known/jwks.json"
_jwk_client = PyJWKClient(_JWKS_URL)

_INVALID = HTTPException(
    status_code=status.HTTP_401_UNAUTHORIZED, detail="Token invalido ou expirado"
)


def _decode_token(token: str) -> dict:
    try:
        header = jwt.get_unverified_header(token)
        alg = header.get("alg", "")

        # leeway absorve pequeno clock skew entre o Supabase e este servidor
        # (evita ImmatureSignatureError no iat / falso "expirado" no exp)
        if alg == "HS256":
            # Projeto legado: segredo compartilhado
            return jwt.decode(
                token,
                settings.SUPABASE_JWT_SECRET,
                algorithms=["HS256"],
                audience="authenticated",
                leeway=30,
            )

        # Padrao atual: chave assimetrica (ES256/RS256) via JWKS
        signing_key = _jwk_client.get_signing_key_from_jwt(token)
        return jwt.decode(
            token,
            signing_key.key,
            algorithms=["ES256", "RS256"],
            audience="authenticated",
            leeway=30,
        )
    except jwt.PyJWTError:
        raise _INVALID
    except Exception:
        # falha ao buscar a chave JWKS, header malformado, etc.
        raise _INVALID


def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(_bearer),
) -> CurrentUser:
    """Valida o JWT e retorna o usuario com o role REAL (lido do banco)."""
    payload = _decode_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise _INVALID

    sb = get_service_client()
    result = (
        sb.table("users").select("id, email, role").eq("id", user_id).limit(1).execute()
    )
    if not result.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario nao encontrado",
        )
    row = result.data[0]
    return CurrentUser(id=row["id"], email=row.get("email"), role=row["role"])


def require_admin(user: CurrentUser = Depends(get_current_user)) -> CurrentUser:
    """Garante role 'admin' (checado no banco, nao so no JWT)."""
    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Acesso restrito a admin"
        )
    return user
