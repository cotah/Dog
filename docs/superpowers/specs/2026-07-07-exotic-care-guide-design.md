# Etapa 29 — Exotic Care Guide (design aprovado)

Data: 2026-07-07 · Aprovado por: Henrique · Status: aprovado

## O que e

Guia de cuidados por especie exotica, exibido numa aba "Care Guide" do pet no
dashboard do dono, com download em PDF. Cumpre os beneficios "Species-specific
care guide PDF" e "Species-specific content in app" ja listados no plano
Exotic Club na `/pricing` (sem badge "Coming soon" — esta etapa os torna
verdadeiros).

## Decisoes de produto (respostas do Henrique)

1. **Especies:** so exoticas — `reptile`, `bird`, `rabbit`, `small_mammal`,
   `fish`, `other`. Dog/cat ficam de fora (podem entrar depois).
2. **Gating:** Plus e acima (`require_active_subscription`, 402 para Free) —
   mesmo gating do Travel Checklist.
3. **Formato:** 7 secoes fixas com 3-5 dicas curtas cada:
   `habitat`, `feeding`, `environment` (temperatura/umidade/qualidade da
   agua), `handling`, `hygiene`, `enrichment`, `warning_signs`.
4. **Localizacao:** aba "Care Guide" em `/owner/pets/[petId]`, ao lado de
   Diary/Health/Travel — so aparece se a especie do pet for exotica. Botao de
   PDF dentro da aba.

`other` recebe conteudo generico de exoticos ("pesquise as necessidades da
sua especie", "encontre um vet de exoticos antes de precisar", etc.).

**Regra 5 do CLAUDE.md garantida:** `warning_signs` orienta sempre "procure um
veterinario de exoticos" — nunca diagnostico nem prescricao de medicacao.

## Arquitetura (Opcao A aprovada)

Conteudo estatico no backend (dict Python), API read-only com gating, i18n no
frontend. **Zero migration** — nao ha estado por pet, nenhuma tabela nova nem
alterada. Mesmo desenho das etapas 27/28: mobile futuro herda tudo via API.

Opcao B (banco + admin CRUD) descartada — mais infra sem ganho real, mesma
conclusao da Etapa 28. Opcao C (so frontend) descartada — gating burlavel e
sem paridade mobile (regra 7).

## Backend — `taloa-api` (sem migration)

- `services/care_guide_service.py` — `EXOTIC_SPECIES` (set com as 6 especies)
  e `CARE_GUIDES[species][section] = [tip_keys]`, mais o texto canonico EN de
  cada `tip_key` (usado pelo PDF).
- `schemas/care_guide.py` — `CareGuideSection { key, tips }` e
  `CareGuideResponse { species, sections }`.
- `api/v1/routes/care_guide.py` — 2 rotas, ambas JWT + `_own_pet_or_403` +
  `require_active_subscription` (402 Free) + rate limiting padrao slowapi:

| # | rota | faz |
|---|---|---|
| 1 | `GET /v1/pets/{pet_id}/care-guide` | secoes + chaves de dicas da especie do pet; **404** se especie nao-exotica |
| 2 | `GET /v1/pets/{pet_id}/care-guide/pdf` | PDF A4 em ingles (reportlab) |

## PDF

Reportlab, padrao Identity Card/Travel: A4, marca TALOA, nome do pet +
especie, secoes com bullets. **Ingles na v1.** Resiliente a unicode no nome do
pet (mesma protecao do PDF do Travel).

## Frontend — `taloa-web`

- Aba **"Care Guide"** em `/owner/pets/[petId]`, renderizada so para especies
  exoticas (o front conhece a especie; a API revalida no server).
- `components/owner/care-guide/CareGuideView.tsx` — secoes com icone +
  bullets traduzidos, botao "Download PDF", tratamento de erro/loading.
- **Free:** 402 da API → card de upgrade com link para `/pricing` (reuso do
  padrao Travel).
- `lib/api/care-guide.ts` + `types/care-guide.ts` (padrao diary/travel).

## i18n

Namespace novo `careGuide` nos 6 idiomas (en/pt/es/fr/de/it) com **traducao
real**: ~140 chaves de dicas (6 especies x 7 secoes x 3-5) + ~15 de UI
(titulos de secao, botoes, erros, card de upgrade). Nada muda na `/pricing`.

## Testes — `taloa-api/tests/test_care_guide.py` (~10, fake Supabase em memoria)

TDD: testes escritos antes da implementacao (padrao Etapa 28).

- Estrutura correta por especie (reptile tem `environment` com dicas de
  temperatura; fish fala de qualidade da agua).
- Todas as 6 especies exoticas tem as 7 secoes e cada `tip_key` tem texto EN.
- Sem assinatura → 402; pet de outro dono → 403; especie dog/cat → 404.
- PDF: 200 + content-type `application/pdf`; nao quebra com unicode no nome.

## Fora de escopo (YAGNI)

- Subtipos de especie (cobra vs lagarto etc.).
- Conteudo editavel por admin.
- PDF traduzido.
- Guia publico/SEO.
- Dog/cat.

## Riscos

O mais baixo ate agora: zero mudanca no banco, nenhuma tabela tocada, Stripe
intocado, feature read-only isolada. Unico cuidado real e a qualidade e
seguranca do conteudo (regra 5), coberto por revisao do texto.

## Ordem de entrega

1. Testes (TDD) → 2. Service + conteudo EN → 3. Schemas + rotas → 4. PDF →
5. Frontend (aba + view) → 6. i18n 6 idiomas → 7. Revisao final + deploy
confirmado em producao.
