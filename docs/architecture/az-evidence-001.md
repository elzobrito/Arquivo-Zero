# AZ-EVIDENCE-001 — Registro de evidência

**Tarefa:** `AZ-EVIDENCE-001`  
**Kind:** `spec` · **type:** `governance` · **review:** `governance`  
**Status:** vigente para a Onda 2 (não altera motor)  
**Data:** 2026-09-16  
**Depende de:** `AZ-ARCH-001` (done)  
**Contrato canônico:** [`src/contracts/evidence-record.schema.json`](../../src/contracts/evidence-record.schema.json) (leitura; esta tarefa **não** o altera)  
**Cópia publicada:** [`docs/architecture/schemas/evidence-record.schema.json`](schemas/evidence-record.schema.json)

---

## Objetivo

Definir a entidade `EvidenceRecord` que alimenta o fluxo:

```text
EvidenceRecord[]
    → ConstraintEvaluation[]
    → HypothesisRecord[]
    → ValidationDecision
    → InvestigationReport
```

O serviço da Onda 2 **produz registros e os acumula no estado investigativo**. Não emite mandado, não reescreve `arrest_requirements` e não muda `validateArrest`.

```text
IDENTIFICAR ≠ PROVAR
```

Sessão 2 do browser QA (`AZ-QA-002-BROWSER`, done): mandado `lt_a` sem EA1 → `DENIED` / `insufficient_evidence`. Essa regra permanece.

---

## Ponteiros

| Tema | Onde |
|---|---|
| JSON Schema Draft-07 | `src/contracts/evidence-record.schema.json` |
| Caso 3.0 | `docs/architecture/case-schema-3.0.md` |
| Adaptador 2.x → campos 3.0 | `src/infrastructure/schema/case-adapter.js` (`adaptCase.mapEvidence`) |
| Serviço atual (IDs) | `src/domain/evidence/evidence-service.js` + `dist/modules/evidence-service.js` |
| Prisão 2.x | `src/domain/arrest/arrest-validator.js` |
| Mandado 2.x | `src/domain/dossier/dossier-service.js` (`filterSuspects` / `issueWarrant`) |
| Risco `src/` ≠ `dist/modules/` | `docs/qa/az-qa-002-arch-compat.md` |
| Ending jogável extra | `docs/qa/fixtures/campaign-contract-min-playable.json` |
| Gap `hypothesisScore=0` | `docs/architecture/az-hyp-004-gap-hypothesis-score.md` |

---

## Estado atual (baseline 2.x)

Catálogo em `game.evidence[]`. Cada item vivo tem só `id`, `title`, `text`, `tag` (E01–E16 em `dist/game.json`).

Estado de partida:

```text
state.evidence: string[]     // IDs descobertos, persistidos no save
```

`catalogEvidence` é idempotente: não duplica ID. `getDiscovered` devolve os objetos do catálogo cujo `id` está em `state.evidence`.

O adaptador 2.x, se `admissibility` / `quality` / `integrity` faltam, preenche com WARN:

```text
admissibility = "unknown"
quality       = null
integrity     = "unverified"
```

Não inventa `source`. Ausência de `source` continua ausência (origem desconhecida).

Mandado: igualdade de atributos do dossiê (`filterSuspects`). Um atributo único ainda emite mandado. Isso **não** muda nesta onda.

Prisão: `validateArrest` usa `state.warrantSuspect === culprit` e depois `minimum_evidence` + `required_evidence` (IDs). Não lê `admissibility` nem `quality`.

---

## Contrato 3.0 — campos do schema

`additionalProperties: true`. Campos abaixo são os **nomeados**. Extensões da WBS entram como opcionais extra (secção seguinte) sem patch do schema nesta tarefa.

### Obrigatórios (3.0)

| Campo | Tipo | Semântica |
|---|---|---|
| `id` | string, minLength 1 | Identidade estável. Migração E01–E16 **preserva** IDs. |
| `title` | string | Rótulo curto. |
| `text` | string | Descrição observada (fato) ou texto de interpretação, conforme `kind`. |
| `tag` | string | Categoria livre do caso 2.x (`especialidade`, `rota`, `identidade`, …). |

### Opcionais no 3.0 (obrigatórios só em 3.1+, já dito em `case-schema-3.0.md`)

| Campo | Tipo | Semântica | Ausência |
|---|---|---|---|
| `source` | string \| null | Procedência rastreável. `null` = origem desconhecida **explícita**. | ≡ origem desconhecida. **Não** preencher com string inventada. |
| `admissibility` | `admissible` \| `inadmissible` \| `unknown` | Admissibilidade processual. Distinta de relevância. | Adaptador: `unknown` + WARN. Não converter em `inadmissible`. |
| `quality` | number 0..1 \| null | Força/completude relativa. Não altera o fato em `text`. | Adaptador: `null` + WARN. `null` **não** é `0`. |
| `integrity` | `verified` \| `unverified` \| `compromised` | Cadeia de custódia. | Adaptador: `unverified` + WARN. Não converter em `compromised`. |

`unknown` / `null` / `unverified` são marcas de incerteza, não provas negativas.

---

## Extensões opcionais (WBS; `additionalProperties`)

Permitidas pelo schema atual. `AZ-EVIDENCE-002` lê e persiste; `AZ-EVIDENCE-004` preenche só o que o conteúdo legado justificar. Ausência ≠ falso.

| Campo | Tipo | Semântica |
|---|---|---|
| `kind` | `fact` \| `interpretation` | Fato observado vs interpretação. Default de leitura: `fact` se ausente (legado 2.x é texto misto; 004 **não** reclassifica em silêncio — se incerto, omitir ou `interpretation` só com evidência de autoria no conteúdo). |
| `method` | string \| null | Como foi obtida (vistoria, interceptação, minijogo, importação). |
| `type` | string \| null | Tipo fino (`document`, `testimony`, `digital`, `trace`, `audio`, …). `tag` permanece a categoria 2.x. |
| `completeness` | `complete` \| `partial` \| `unknown` | Completude. Parcial exige confirmação (`AZ-EVIDENCE-003`). Ausência ≡ `unknown`. |
| `observedAt` | string \| null | Temporalidade conhecida (ISO-8601 ou rótulo diegético). `null`/ausente = desconhecida. |
| `relations` | object | Vínculos. Chaves opcionais: `locationId`, `suspectIds` (string[]), `actionId`, `minigameId`, `constraintIds` (string[]). Arrays vazios ≠ “não relacionado”: ausência da chave = não afirmado. |
| `contradicts` | string[] | IDs de outros `EvidenceRecord` em tensão. Preservar ambos os registros. |
| `notes` | string | Interpretação do jogador ou do sistema, nunca promovida a `text` factual. |

O quadro (`AZ-EVIDENCE-005`) deve apresentar `kind=fact` e `kind=interpretation` de forma distinta. Filtros de UI **não** alteram `state.evidence`.

---

## Ausência não é falsidade

| Dado ausente | Proibido | Obrigatório |
|---|---|---|
| `source` omitido | Inventar laboratório, agente ou minijogo | Tratar como origem desconhecida; 004 pode gravar `source: null` |
| `quality` omitido/`null` | Usar `0` em score de prisão | Não pontuar; 003 explica “qualidade desconhecida” |
| `admissibility` omitido/`unknown` | Excluir da vista ou tratar como inadmissível | Conservar no catálogo; 003 impede que sustente mandado/prisão **quando** essa política for ligada — ver isolamento abaixo |
| `observedAt` omitido | Inventar horário | Timeline do relatório admite `timestamp: null` |
| `relations.suspectIds` omitido | Inferir o culpado | Sem vínculo afirmado |
| Evidência não descoberta | Aparecer no quadro | Só IDs em `state.evidence` |

---

## Procedência

Todo registro em memória 3.0 tem:

1. `source` string (rastreável), ou
2. `source: null` (desconhecida explícita), ou
3. `source` ausente, tratado como (2) pelo serviço — o adaptador **não** precisa materializar `null` se o consumidor aplicar esta regra.

`AZ-EVIDENCE-004` não inventa origem para E01–E16. Tenentes não vazam provas no capítulo Cifra além do recorte já existente.

---

## Contradição e inadmissibilidade

- Dois registros com `contradicts` mútuo **permanecem** no catálogo e no quadro.
- `admissibility=inadmissible` permanece visível (`AZ-EVIDENCE-005`) e **não** é apagado.
- Inadmissível não sustenta restrição que elimine candidato, nem hipótese de autoria, nem prisão — isso é política de `AZ-EVIDENCE-003` (`evidence-policy.js`), não exclusão de dados.
- Relevância ≠ admissibilidade: uma pista relevante pode ser `inadmissible`.

---

## Isolamento do mandado (até `AZ-SUSPECT-004`)

Critério de aceite desta spec e das impls 002/003:

```text
O serviço de evidências:
  produz EvidenceRecord[]
  acumula no estado investigativo (state.evidence = IDs)
  é consultável pelo arrest-validator
  NÃO altera a lógica de emissão de mandado
```

| Operação | Dono | Até `AZ-SUSPECT-004` |
|---|---|---|
| `filterSuspects` / `issueWarrant` | `dossier-service.js` | Igualdade de atributo. Sem `admissibility`/`quality`. |
| `validateArrest` | `arrest-validator.js` | Mandado + mínimo + essenciais (IDs). `hypothesisScore` continua 0 (gap HYP-004). |
| `catalogEvidence` / `getDiscovered` | `evidence-service.js` | IDs + registros. Idempotente. Sem DOM. |
| Política de admissibilidade | `evidence-policy.js` (003) | Funções puras consultáveis. **Não** ligar em `issueWarrant` nesta onda. |

`AZ-SUSPECT-004` é o único ponto autorizado a exigir hipótese sustentada para emitir mandado. `AZ-HYP-004` é o ponto autorizado a fazer `hypothesisScore > 0`. Nenhum dos dois é esta tarefa.

Não criar campos novos em `arrest_requirements`.

---

## Ending expandido → `AZ-ARCH-001-PATCH-ENDING`

O runtime e o fixture jogável já usam textos distintos para os três desfechos de prisão. O schema 3.0 só formaliza `win_*` e `lose_*`:

```json
{
  "win_title": "string",
  "win_text": "string",
  "lose_title": "string",
  "lose_text": "string",
  "wrong_warrant_title": "string",
  "wrong_warrant_text": "string",
  "insufficient_evidence_title": "string",
  "insufficient_evidence_text": "string"
}
```

Os quatro campos `wrong_warrant_*` e `insufficient_evidence_*` são **opcionais**. Ausência: o motor 2.x já cai em `lose_*` ou em literais de `dist/app.js`; 3.x deve preferir os campos específicos quando presentes.

Esta spec **não** altera `case-schema-3.0.json`. A formalização é tarefa de manutenção separada:

```text
AZ-ARCH-001-PATCH-ENDING
  kind: impl (ou spec+impl com grant em src/contracts/** e docs/architecture/schemas/**)
  momento: antes da Onda de hipóteses (AZ-HYP-*)
  efeito: declarar os quatro campos como opcionais em ending
  não toca: EvidenceRecord, arrest-validator, dist/app.js (salvo se o patch de schema exigir fixture)
```

Onda 2 (`AZ-EVIDENCE-002`…`005`, `AZ-QA-EVIDENCE-001`) **pode** admitir esse patch em paralelo: não escreve `ending` e não depende dele.

---

## Módulos previstos (spec only)

| Arquivo | Tarefa que implementa | Papel |
|---|---|---|
| `src/domain/evidence/evidence-service.js` | `AZ-EVIDENCE-002` | Repositório: descobrir, catalogar, consultar, vincular. Já existe o stub de IDs. |
| `dist/modules/evidence-service.js` | `AZ-EVIDENCE-002` | Espelho ESM imediato. |
| `src/domain/evidence/evidence-policy.js` | `AZ-EVIDENCE-003` | Admissibilidade, integridade, qualidade, explicação. |
| `dist/modules/evidence-policy.js` | `AZ-EVIDENCE-003` | Espelho ESM imediato. |
| `src/ui/evidence-board/` | `AZ-EVIDENCE-005` | Quadro. Sem gravar evidência direto da UI. |
| `dist/game.json` (E01–E16) | `AZ-EVIDENCE-004` | Conteúdo. Grant em `dist/game.json`. |

### API mínima do serviço (002)

Funções puras, testáveis sem DOM. Nomes canônicos (ADR `AZ-SPEC-002`):

```text
catalogEvidence(state, evidenceId) → state
getDiscovered(state, game) → EvidenceRecord[]
getRecord(game, evidenceId) → EvidenceRecord | null
```

Consultas determinísticas por `tag`/`type`, `source`, `relations.locationId`, `relations.suspectIds`. Descoberta duplicada = no-op. A UI chama o serviço; não escreve `state.evidence` ad hoc.

### API mínima da política (003)

```text
admissibilityOf(record) → admissible | inadmissible | unknown
qualityOf(record) → number | null          // null ≠ 0
integrityOf(record) → verified | unverified | compromised
canSupportArrest(record) → boolean         // false se inadmissible ou quality null quando a política exigir confirmação
explain(record) → string
```

`canSupportArrest` existe para o validador **consultar**. Ligação em `validateArrest` é tarefa posterior explícita, não efeito colateral de 003.

---

## Espelho `dist/modules/` (risco operacional #1 da Onda 2)

Não há bundler. `python -m http.server -d dist` importa ESM em `dist/modules/`.

Critério **vinculante** para `AZ-EVIDENCE-002` e `AZ-EVIDENCE-003` (e qualquer módulo novo em `src/domain/evidence/`):

```text
Todo arquivo criado ou alterado em src/domain/evidence/
tem espelho imediato em dist/modules/ antes de qualquer browser test.

node scripts/verify-function-map.mjs
  → FUNCTION_MAP_PASS

Servir dist/ e no console do Chromium:
  import('/dist/modules/evidence-service.js')   → sem erro ESM
  import('/dist/modules/evidence-policy.js')    → sem erro ESM (a partir de 003)
```

Divergência `src/` ≠ `dist/modules/` é defeito da impl, não “detalhe de deploy”.

Esta spec **não** cria esses arquivos.

---

## Sequência da Onda 2

```text
AZ-EVIDENCE-001  spec do registro            → docs/architecture/az-evidence-001.md   (esta)
AZ-EVIDENCE-002  serviço                     → src/domain/evidence/ + dist/modules/
AZ-EVIDENCE-003  admissibilidade e qualidade → evidence-policy.js + espelho
AZ-EVIDENCE-004  migrar E01–E16              → dist/game.json (grant)
AZ-EVIDENCE-005  quadro                      → src/ui/evidence-board/
AZ-QA-EVIDENCE-001 auditoria                 → docs/qa/
```

`AZ-ARCH-001-PATCH-ENDING` admite-se em paralelo. `AZ-VSLICE-001` permanece não eligible (QA-004, TERR-007, MINI-009, QA-005, QA-006). Não reabrir `AZ-QA-002` nem `AZ-QA-002-BROWSER`.

---

## Fora de escopo desta spec

```text
Não alterar dist/app.js
Não alterar src/domain/arrest/arrest-validator.js
Não alterar src/core/state-machine.js
Não implementar evidence-service nem evidence-policy
Não criar campos em arrest_requirements
Não alterar a lógica de mandado do dossiê
Não alterar src/contracts/evidence-record.schema.json
Não materializar o capítulo 3.0 (AZ-VSLICE-001)
```

---

## Critérios de aceite (esta spec)

1. Campos obrigatórios e opcionais documentados e alinhados a `evidence-record.schema.json`.
2. Dados ausentes não são convertidos em falsidade (`unknown` / `null` / omissão).
3. Evidência contraditória e inadmissível podem ser preservadas.
4. Esquema 2.x continua adaptável; todo registro tem procedência rastreável ou marca de origem desconhecida.
5. Ending `wrong_warrant_*` e `insufficient_evidence_*` registrados como contrato opcional a formalizar em `AZ-ARCH-001-PATCH-ENDING` antes de `AZ-HYP-*`.
6. Serviço de evidências produz/acumula/é consultável e **não** altera emissão de mandado até `AZ-SUSPECT-004`.
7. Espelho `dist/modules/` e os dois checks (function-map + import ESM) são critério das impls 002/003, não desta spec.

---

## Verificações de entrada (2026-09-16, antes do claim)

```text
node scripts/verify-function-map.mjs      FUNCTION_MAP_PASS total=79 functions=42 arrows=37
node scripts/verify-random-scenarios.mjs  RANDOM_SCENARIOS_PASS chapters=4 scenarios=9
node scripts/validate-case.mjs dist/game.json
  SCHEMA_WARN version=2.x  schemaVersion ausente
python -m esaa --root . verify            verify_status ok  last_event_seq 603 na entrada
```
)
