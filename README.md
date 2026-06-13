# TALOA — Smart Safety for Pets

**taloa.ie** | Smart safety for pets, starting in Dublin.

TALOA e uma plataforma de seguranca para pets baseada em tags (NFC + QR Code).
Quando alguem encontra um pet, escaneia a tag, abre `taloa.ie/t/TAL-000001` e
ve as informacoes necessarias para devolver o pet ao dono com seguranca.

---

## Arquitetura

O projeto e um **monorepo** com backend e frontend separados desde o inicio,
para que um futuro **app mobile (Expo / React Native)** possa consumir a mesma
API sem reescrever nenhuma logica de negocio.

```
dog/
├── taloa-api/    # Backend  — FastAPI (Railway). Toda a logica de negocio, auth, AI.
├── taloa-web/    # Frontend — Next.js (Vercel). So consome a API. Zero logica de negocio.
└── supabase/     # Banco    — PostgreSQL + Storage. Fonte unica do schema (migrations + seed).
```

**Fluxo de dados:**

```
[ Web (Next.js) ]  ┐
                   ├──►  [ FastAPI (taloa-api) ]  ──►  [ Supabase: PostgreSQL + Storage ]
[ Mobile (futuro)] ┘            ▲
                                └── Anthropic (AI) · Resend (email) · QR/PDF
```

- **Auth:** o Supabase Auth emite o JWT (web e mobile fazem login pelo SDK do Supabase).
  O FastAPI **valida** esse JWT e aplica as regras de negocio e de role.
- O Next.js **nao tem API Routes proprias** — todas as chamadas vao para o FastAPI.
- O Next.js usa o Supabase apenas para **login (Auth)** e **upload de fotos (Storage)**.

---

## Stack

### Backend — `taloa-api` (FastAPI / Railway)
- Python + FastAPI + Uvicorn
- Pydantic / pydantic-settings
- Supabase (cliente Python) — acesso ao banco com service role
- PyJWT — validacao do token emitido pelo Supabase Auth
- Anthropic API (`claude-sonnet-4-6`) — agente de IA TALOA
- Resend — emails transacionais
- qrcode + reportlab — geracao de QR Codes e PDF A4
- slowapi — rate limiting

### Frontend — `taloa-web` (Next.js / Vercel)
- Next.js 15+ (App Router) + TypeScript
- Tailwind CSS + shadcn/ui + Lucide React
- React Hook Form + Zod
- @supabase/supabase-js + @supabase/ssr (somente Auth + Storage)
- @react-google-maps/api, Recharts, date-fns
- next-pwa (PWA installable)

### Banco — `supabase/`
- PostgreSQL + Storage + Row Level Security (RLS)

---

## Setup local

> **Pre-requisitos:** Node.js 20+, Python 3.12+, conta no Supabase.

### 1. Clonar o repositorio
```bash
git clone https://github.com/cotah/Dog
cd Dog
```

### 2. Backend (taloa-api)
```bash
cd taloa-api
python -m venv .venv
# Windows:  .venv\Scripts\activate
# Mac/Linux: source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env        # preencha as variaveis
uvicorn app.main:app --reload
```

### 3. Frontend (taloa-web)
```bash
cd taloa-web
npm install
cp .env.example .env.local  # preencha as variaveis
npm run dev
```

### 4. Banco (supabase)
- Crie um projeto em [supabase.com](https://supabase.com)
- Execute as migrations em `supabase/migrations/`
- Execute o seed em `supabase/seed.sql`
- Ative o RLS em todas as tabelas

---

## Estrutura de tags
- Prefixo: **TAL**
- Formato: **TAL-000001**
- URL: **https://taloa.ie/t/TAL-000001**

## Roles de usuario
- `owner` — dono de pet, acessa `/owner/*`
- `admin` — Henrique, acessa `/admin/*`
- `partner` — futuro (parceiros: groomers, walkers, trainers)

## Deploy
- **Backend:** Railway (taloa-api)
- **Frontend:** Vercel (taloa-web) — auto-deploy do branch `main`
- **Banco:** Supabase (producao separada do local)

---

## Regras importantes
- **NUNCA** usar `dog` ou `dogs` em tabelas, campos, variaveis ou nomes de funcao — sempre `pet` / `pets`.
- **NUNCA** expor o endereco do dono publicamente.
- **NUNCA** commitar `.env` / `.env.local` ou qualquer segredo.
- **NUNCA** remover o RLS das tabelas do Supabase.
- Ler `CLAUDE.md` antes de qualquer alteracao.

---

TALOA — taloa.ie — Founder: Henrique Pasquetto
