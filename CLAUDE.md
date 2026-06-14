# TALOA — Instrucoes para Claude Code

Este arquivo e lido automaticamente ao iniciar uma sessao. Leia antes de qualquer alteracao.

## Identidade do projeto
- Nome: **TALOA**
- Dominio: **taloa.ie**
- Tagline: *Smart safety for pets, starting in Dublin*
- Prefixo de tags: **TAL-** (ex: `TAL-000001`)
- Founder: Henrique Pasquetto

## Arquitetura (IMPORTANTE)
Monorepo com backend e frontend separados, pensado para um futuro app mobile:

- **`taloa-api/`** — FastAPI (Railway). **Toda** a logica de negocio, auth, AI, QR/PDF, emails.
- **`taloa-web/`** — Next.js (Vercel). **So** consome a API. **Zero** logica de negocio. **Sem** API Routes proprias.
- **`supabase/`** — PostgreSQL + Storage. Fonte unica do schema (migrations + seed).
- **Mobile (futuro)** — Expo/React Native vai consumir a MESMA API do FastAPI.

> **SUPABASE PROJECT: `loopcoxvtboytwwjwoeg` (nome "Dog") — este e o unico banco da TALOA.**
> **Nunca aplicar migrations em qualquer outro projeto Supabase.** O ref
> `mrhzgxplamnkktbjbpok` que aparece no CLAUDE.md global e do projeto GBrain/gstack,
> NAO da TALOA. Sempre confirmar o `project_id` contra a `SUPABASE_URL` do
> `taloa-api/.env` antes de qualquer operacao no banco.

### Auth
- O **Supabase Auth** emite o JWT (web e mobile logam pelo SDK do Supabase).
- O **FastAPI valida** o JWT (via `SUPABASE_JWT_SECRET`) e aplica regras de negocio e de role.
- **Nao** existe sistema de auth proprio dentro do FastAPI.

## Regras absolutas — NUNCA violar
1. **NUNCA** usar `dog` ou `dogs` em tabelas, campos, variaveis ou nomes de funcao — sempre `pet` / `pets`. O sistema aceita qualquer especie desde o primeiro commit.
2. **NUNCA** expor o endereco do dono publicamente (`address_private`, `eircode_private` nunca saem em query publica).
3. **NUNCA** commitar segredos, `.env` ou `.env.local`.
4. **NUNCA** remover o RLS das tabelas do Supabase.
5. **NUNCA** fazer o agente de IA diagnosticar doencas ou prescrever medicacao.
6. **NUNCA** usar o mesmo QR Code em mais de uma tag.
7. **NUNCA** colocar logica de negocio no `taloa-web` — ela mora no `taloa-api`.
8. **NUNCA** expor a `SUPABASE_SERVICE_ROLE_KEY` no frontend (somente server-side no FastAPI).
9. **NUNCA** logar dados sensiveis (email, telefone, IP raw). IP nos scans e sempre hash SHA-256.

## Stack obrigatoria
**Backend (taloa-api):** FastAPI · Pydantic · supabase-py · PyJWT · Anthropic (`claude-sonnet-4-6`) · Resend · qrcode · reportlab · slowapi
**Frontend (taloa-web):** Next.js 15+ (App Router) · TypeScript · Tailwind CSS · shadcn/ui · React Hook Form · Zod · @supabase/supabase-js · @supabase/ssr · next-pwa

## Ordem de prioridade de implementacao
1. Setup inicial (estrutura, configs) ← Etapa 1
2. Schema do banco + migrations + RLS (supabase)
3. Auth (validacao de JWT no FastAPI + login/signup no web + middleware)
4. Rota `/t/[tagCode]` — pagina publica da tag (4 estados)
5. Ativacao da tag
6. Perfil publico do pet
7. Dashboard do dono
8. Painel admin
9. Gerador de QR Codes (PNG / PDF A4 / CSV)
10. Emergency vet directory
11. Formulario de leads
12. Lost/Found flow
13. Agente de IA (TaloaChat)
14. Emails transacionais (Resend)
15. PWA manifest
16. Polimento final (loading/error/empty states, responsividade)

> Nao avancar de etapa sem a anterior funcionar e estar testada.

## Convencoes de codigo
**Frontend (TypeScript):**
- Arquivos: kebab-case (`pet-form.tsx`)
- Componentes: PascalCase (`PetForm`)
- Funcoes: camelCase (`getPetByTagCode`)
- Constantes: UPPER_SNAKE_CASE (`TAG_PREFIX`)
- Tipos: PascalCase com sufixo (`PetProfile`, `TagStatus`)

**Backend (Python):**
- Arquivos e funcoes: snake_case (`pet_service.py`, `get_pet_by_tag_code`)
- Classes / schemas Pydantic: PascalCase (`PetProfile`, `TagStatus`)
- Constantes: UPPER_SNAKE_CASE (`TAG_PREFIX`)

## Commits
- `feat:` nova funcionalidade
- `fix:` correcao de bug
- `chore:` configuracao, dependencias
- `db:` alteracoes no banco
- `style:` alteracoes de UI sem logica

## Seguranca (checklist obrigatorio antes do deploy publico)
- RLS ativado em TODAS as tabelas
- Service role key apenas server-side (FastAPI)
- Validacao de todos os inputs (Pydantic na API, Zod nos forms)
- Rate limiting nas rotas (slowapi) — IA: max 20 mensagens por sessao
- Hash SHA-256 do IP nos scans (nunca IP raw)
- GDPR consent com data/hora no cadastro
- Geolocalizacao apenas com permissao explicita
- Headers de seguranca (CORS restrito, CSP, X-Frame-Options)
- Verificacao de role admin checando o banco, nao so o JWT
