"""Limiter compartilhado (slowapi).

Protecao de abuso por IP. O limite de 20 mensagens POR SESSAO (vida toda) e
aplicado separadamente no ai_service, contando as mensagens no banco — slowapi
trabalha por janela de tempo, nao por sessao.
"""
from slowapi import Limiter
from slowapi.util import get_remote_address

limiter = Limiter(key_func=get_remote_address)
