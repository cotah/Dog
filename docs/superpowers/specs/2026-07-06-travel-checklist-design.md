# Etapa 28 — Travel Checklist (design aprovado)

Data: 2026-07-06 · Aprovado por: Henrique · Status: aprovado, aguardando plano de implementacao

## O que e

Checklist interativa de preparacao de viagem, por pet. O dono cria uma "viagem"
(tipo + escopo + data + destino), o backend gera os itens a partir de templates
por especie/tipo/escopo, e o dono marca os itens conforme prepara. Itens com
prazo (ex.: vacina antirrabica 21 dias antes) ganham `due_date` e alertas
visuais. Exportavel em PDF.

## Decisoes de produto (respostas do Henrique)

1. **Formato:** interativo no dashboard + PDF exportavel.
2. **Geracao:** especie + tipo de viagem + escopo + **data da viagem** (permite alertas de prazo).
3. **Plano:** Plus e acima (`require_active_subscription`, 402 para Free). Entra nos beneficios do Plus na `/pricing`.
4. **Itens custom:** o dono pode adicionar itens proprios e remover qualquer item.

## Arquitetura (Opcao A aprovada)

Templates vivem no backend (dict Python em `travel_service.py`); instancias no
banco. Frontend so consome a API (regra 7 do CLAUDE.md). Mesmo desenho da
Etapa 27 (Diary). Mobile futuro herda tudo via API.

## Banco — migration `0015_travel_checklist.sql` (Supabase `loopcoxvtboytwwjwoeg`)

### `pet_trips`
| campo | tipo | nota |
|---|---|---|
| `id` | uuid PK default gen_random_uuid() | |
| `pet_id` | uuid FK -> pets ON DELETE CASCADE | |
| `title` | text NULL | ex. "Ferias em Portugal" |
| `travel_type` | text CHECK IN (`car`,`plane`,`ferry`,`train`) | |
| `scope` | text CHECK IN (`domestic`,`international`) | domestic = Irlanda |
| `destination` | text NULL | texto livre |
| `travel_date` | date NOT NULL | |
| `created_at` / `updated_at` | timestamptz default now() | |

### `trip_checklist_items`
| campo | tipo | nota |
|---|---|---|
| `id` | uuid PK | |
| `trip_id` | uuid FK -> pet_trips ON DELETE CASCADE | |
| `item_key` | text NULL | chave do template; NULL = item custom |
| `label` | text NULL | so para custom (texto do dono) |
| `section` | text CHECK IN (`documents`,`transport`,`essentials`) | do template; custom = `essentials` |
| `is_checked` | boolean default false | |
| `due_date` | date NULL | `travel_date - days_before` do template |
| `sort_order` | int NOT NULL | |
| `created_at` | timestamptz default now() | |

Invariante: cada linha tem `item_key` OU `label` (nunca ambos, nunca nenhum) —
CHECK constraint.

**RLS:** padrao Diary — owner via `pets.owner_id = auth.uid()` (select/insert/
update/delete) + admin via role no banco, nas 2 tabelas. Nunca publicas.

## Templates (backend `services/travel_service.py`)

~35 itens, cada um: `key`, `days_before` (opcional), `section`
(`documents`/`transport`/`essentials`), e regras de aplicacao por
`travel_type`, `scope` e `species`. Composicao:

- **Base** (todos): comida e agua para a viagem, tigelas, medicacao, brinquedo
  favorito, coleira/tag TALOA, sacos de dejetos etc.
- **Por tipo:** aviao -> caixa IATA, regras da companhia; carro -> cinto/
  harness, paradas; ferry -> politica pet da companhia; train -> regras de
  transporte.
- **Por escopo (international):** EU Pet Passport, microchip verificado,
  vacina antirrabica (`days_before=21`), certificado veterinario, tratamento
  antiparasitario quando aplicavel.
- **Por especie:** reptil -> heat pack, transporte termico; ave -> capa da
  gaiola; peixe -> saco de transporte + bomba de ar a pilha; etc. Especies =
  as 8 do Diary (`dog/cat/reptile/bird/rabbit/small_mammal/fish/other`).

Conteudo e orientativo (preparacao de viagem) — sem diagnostico nem prescricao
(regra 5 do CLAUDE.md).

## API — `api/v1/routes/trips.py` + `schemas/travel.py`

Todas com JWT + `_own_pet_or_403` + `require_active_subscription` (402 Free):

| # | rota | faz |
|---|---|---|
| 1 | `GET /v1/pets/{pet_id}/trips` | lista viagens com progresso (checked/total) |
| 2 | `POST /v1/pets/{pet_id}/trips` | cria viagem e gera itens dos templates |
| 3 | `GET /v1/trips/{trip_id}` | detalhe + itens ordenados por section/sort_order |
| 4 | `DELETE /v1/trips/{trip_id}` | apaga viagem (cascade) |
| 5 | `POST /v1/trips/{trip_id}/items` | adiciona item custom |
| 6 | `PATCH /v1/trips/{trip_id}/items/{item_id}` | marca/desmarca |
| 7 | `DELETE /v1/trips/{trip_id}/items/{item_id}` | remove item |
| 8 | `GET /v1/trips/{trip_id}/pdf` | PDF A4 (reportlab) |

Acesso a `/v1/trips/{trip_id}` valida ownership via join trip -> pet ->
owner_id. Validacao Pydantic em todos os inputs; rate limiting padrao slowapi.

## Frontend (taloa-web)

- **Aba nova "Travel"** em `/owner/pets/[petId]`, ao lado de Diary/Health/
  Shedding/Timeline (reusa a estrutura de abas da Etapa 27).
- `components/owner/travel/TravelView.tsx` — cards de viagem (titulo, destino,
  data, icone por tipo, barra de progresso X/Y).
- `components/owner/travel/NewTripModal.tsx` — RHF + Zod (titulo, tipo,
  escopo, destino, data).
- `components/owner/travel/TripChecklist.tsx` — checkboxes por seccao, aviso
  de prazo (vermelho = due_date passou; ambar = falta <=7 dias), input de item
  custom, remover item, botao "Download PDF".
- `lib/api/travel.ts` + `types/travel.ts` (padrao do diary).
- **Free:** 402 da API -> card de upgrade com link para `/pricing`.
- Labels de template via i18n (`travelChecklist.items.<key>`); custom mostra o
  `label` como digitado.

## PDF

Reportlab (padrao Identity Card): A4, marca TALOA, nome do pet, destino, data,
itens por seccao com checkbox (marcado/vazio) e due dates. **Ingles na v1**
(igual ao Identity Card). Backend resolve `item_key` -> texto ingles pelo
proprio template; custom usa `label`.

## i18n

Namespace novo `travelChecklist` nos 6 idiomas com **traducao real** (~60
strings: 35 itens + UI). Beneficio novo na `/pricing` (lista do Plus): "Travel
Checklist with deadline alerts", tambem nos 6 idiomas.

## Testes — `taloa-api/tests/test_travel.py` (~12, fake Supabase em memoria)

- Geracao correta por especie x tipo x escopo (aviao internacional + cao inclui
  passaporte + caixa IATA; carro domestico nao inclui).
- `due_date = travel_date - days_before`.
- Sem assinatura -> 402; pet de outro dono -> 403.
- Toggle, item custom (criar/remover), delete cascade.
- Invariante item_key XOR label.

## Fora de escopo (YAGNI)

- Editar viagem depois de criada (apagar e recriar).
- Templates editaveis pelo admin (Opcao B, descartada).
- PDF traduzido, notificacoes push/email de prazo, compartilhar checklist no
  care link.

## Riscos

- Baixo: nenhuma tabela existente muda; Stripe/precos intocados; feature nova
  isolada. Unico ponto de atencao: aplicar a migration SOMENTE no projeto
  `loopcoxvtboytwwjwoeg`.

## Ordem de entrega

1. Migration + RLS -> 2. Templates + service + schemas -> 3. Rotas + testes ->
4. Frontend (aba, modais, checklist) -> 5. PDF -> 6. i18n 6 idiomas +
/pricing -> 7. Revisao final + deploy.
