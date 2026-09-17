# AZ-QA-EVIDENCE-001 — Verificar a fundação probatória

**Ator:** agent-qa  
**Runner:** grok  
**Data:** 2026-09-17  
**Escopo:** Onda 2 — AZ-EVIDENCE-001 a AZ-EVIDENCE-005 (004 sucedida por AZ-EVIDENCE-004-V2)  
**Review mode exigido:** regression  
**Claim:** seq 935–937 · `prior_status=todo` → `in_progress`

## Independência

Papel desta auditoria: `agent-qa`. Implementações da onda: `agent-impl`.

| Tarefa | claim / complete (runner) |
|---|---|
| AZ-EVIDENCE-002 | grok / grok |
| AZ-EVIDENCE-003 | codex / codex |
| AZ-EVIDENCE-004 | codex / codex |
| AZ-EVIDENCE-004-V2 | codex / grok |
| AZ-EVIDENCE-005 | grok-bot / unattended |

O runner `grok` também implementou 002 e completou 004-V2. A separação contratual ESAA é de **papel** (`agent-qa` ≠ `agent-impl`), não de runner. PARCER QA: não confundir papel com independência de runner. Limitação residual registrada abaixo.

## Veredito

A fundação probatória da Onda 2 está **aprovada** para abrir a Onda 3.

O caso publicado em disco é **schemaVersion 3.0** (AZ-EVIDENCE-004-V2), com 14 registros E01–E08 e E11–E16. `source` permanece `null`. `admissibility`/`quality`/`integrity` estão **explícitos no disco** com os defaults `unknown` / `null` / `unverified` — não são mais omitidos para o adaptador preencher em 2.x. `adaptCase` em 3.x é passthrough. A policy opera sobre o `EvidenceRecord` já portador desses campos; não lê `dist/game.json` diretamente.

Nenhum FAIL de schema, suíte ou invariante. `hypothesisScore === 0` permanece gap documentado até AZ-HYP-004, não bug. Sem hotfix.

Esta auditoria **exercitou o Chromium** em `http://127.0.0.1:8765/` (capítulo Null / U-19, save prévio com E13).

## Checklist

| Item | Resultado |
|---|---|
| `validate-case dist/game.json` | **SCHEMA_PASS version=3.x issues=0** (não é mais WARN 2.x; 004-V2). Sem FAIL. `validateCase()` semântico: PASS 3.x issues=[] |
| 14 registros, IDs E01–E08 e E11–E16 | **PASS**. E09/E10 ausentes |
| `source: null` em todos | **PASS** (14/14) |
| `admissibility` ausente no disco | **N/A pós-004-V2**. Presente nos 14 com valor `unknown` (idem `quality: null`, `integrity: unverified`) |
| `adaptCase` normaliza em memória | **PASS em 2.x** (fixture). **3.x passthrough**: defaults já no documento; `warnings.length=0`; mesma referência de objeto |
| `EVIDENCE_SERVICE_PASS tests=18` | **PASS** |
| `EVIDENCE_POLICY_PASS tests=15` | **PASS** |
| `EVIDENCE_BOARD_PASS tests=10` | **PASS** |
| `HOTFIX_SUITE_PASS tests=4` | **PASS** |
| INV-001 a INV-015 manuais | **PASS** (mais campos ausentes = benefício da dúvida) |
| Visibilidade de inadmissível | **PASS** (serviço + policy; catálogo vivo não contém inadmissível) |
| Segurança do quadro | **PASS** (`escapeHtml`; payload sem `<script` / `javascript:`) |
| ESM do board no Chromium | **PASS** (200, sem erro de import). API exportada: `refreshBoard`, `wire`. `buildEvidenceBoard` vive em `/modules/ui/evidence/build-evidence-board.js`. `createBoardController` é CJS de teste, não o ESM do browser |
| `hypothesisScore=0` até AZ-HYP-004 | **PASS** (gap confirmado; `arrest-validator` não importa `canSupportArrest`) |
| `FUNCTION_MAP_PASS total=79` | **PASS** (`functions=42 arrows=37`) |
| SHA `dist/app.js` | **PASS** `8e0b2d03c597dd8fe6daf3896bdaa69f21b1ccb7ade47f90ed5856f54da6efed` |
| SHA `dist/game.json` | **PASS** `870c69317dbbf5d078075ad41543daad9f3593da9e248d963fb1422a9bc046b7` |

Extras executados (não no checklist mínimo): `EVIDENCE_A11Y_PASS tests=11`, `EVIDENCE_FILTERS_PASS tests=7`, `CASE_ADAPTER_PASS`, `EVIDENCE_MIGRATION_PASS tests=29`, `RANDOM_SCENARIOS_PASS chapters=4 scenarios=9 routes=9`, `node --check dist/app.js`.

## 1. Contrato e schema

`src/contracts/evidence-record.schema.json`:

- `required`: `["id","title","text","tag"]`
- `source`, `admissibility`, `quality`, `integrity` existem em `properties` e **não** estão em `required`

`node scripts/validate-case.mjs dist/game.json` (working tree, com Ajv extra não commitado) e `validateCase()` de `src/infrastructure/schema/schema-validator.js` (código tracked) concordam: **PASS 3.x, 0 issues**.

O roteiro de entrada desta QA previa WARN 2.x (`schemaVersion` ausente). Isso era verdade **antes** de AZ-EVIDENCE-004-V2. O documento publicado agora declara `"schemaVersion": "3.0"`. Não reabrir 004.

## 2. Dados migrados — `dist/game.json`

```text
length = 14
ids    = ["E01","E02","E03","E04","E05","E06","E07","E08","E11","E12","E13","E14","E15","E16"]
E09    = false
E10    = false
source != null          → 0
admissibility presente  → 14  (todas "unknown")
quality presente        → 14  (todas null)
integrity presente      → 14  (todas "unverified")
combo único             → "unknown"|null|"unverified"|null × 14
```

Origem desconhecida é **explícita** (`source: null`), não omissão. E09/E10 continuam lacuna histórica; não foram inventados.

## 3. Normalização — `case-adapter`

Sobre o caso publicado:

```text
detectVersion(raw)     = 3.x
adapt.version          = 3.x
warnings.length        = 0
e0.admissibility       = unknown   (igual ao disco)
e0.quality             = null
e0.integrity           = unverified
same_object_ref        = true
```

Em 3.x o adaptador **não injeta** defaults (retorno as-is). Isso é o contrato pós-004-V2: os campos precisam estar no documento. Estão. Fixture 2.x (`tests/fixtures/campaign-contract-min.json`) ainda recebe `unknown`/`null`/`unverified` e warning de `schemaVersion` — `CASE_ADAPTER_PASS`.

`evidence-policy.js` não referencia `game.json` nem `fs`. Consome o registro que o chamador passar (adaptado no `loadGame` de `dist/app.js`; cru no fetch do quadro ESM). Com o 3.0 publicado os valores coincidem.

## 4. Suítes

| Comando | Saída |
|---|---|
| `node tests/domain/evidence-service.test.mjs` | `EVIDENCE_SERVICE_PASS tests=18` |
| `node tests/domain/evidence-policy.test.mjs` | `EVIDENCE_POLICY_PASS tests=15` |
| `node tests/ui/evidence/evidence-board.test.mjs` | `EVIDENCE_BOARD_PASS tests=10` |
| `node tests/hotfix/run-all.mjs` | `HOTFIX_SUITE_PASS tests=4` |
| `node tests/schema/case-adapter.test.mjs` | `CASE_ADAPTER_PASS` |
| `node tests/content/evidence-migration.test.mjs` | `EVIDENCE_MIGRATION_PASS tests=29` |

## 5. Invariantes da policy (execução manual)

INV-001 a INV-015: **PASS**. Campos ausentes: `isAdmissible({})`, `isIntegrityVerified({})`, `meetsQualityThreshold({})` → true (benefício da dúvida).

Os 14 registros publicados, após `adaptCase` (passthrough):

| id | admissibility | quality | integrity | canSupportArrest |
|---|---|---|---|---|
| E01–E08, E11–E16 | unknown | null | unverified | true |

Qualidade `null` não é promovida a 0 nem a “completa”. `meetsQualityThreshold` permanece true por ausência, não por valor alto.

`canSupportArrest` é true no catálogo vivo porque **não há** `inadmissible` nem `compromised` publicados. Bloqueio foi verificado com registro sintético (INV-011/012/015).

## 6. Serviço — visibilidade

```text
getDiscovered({evidence:['E01']}, game).length === 1
getDiscovered({evidence:[]}, game).length === 0
canSupportArrest({...E01, admissibility:'inadmissible'}) === false
```

Inadmissível permanece em `getDiscovered`; a policy só recusa suporte a prisão. Não descobertas não aparecem.

## 7. Quadro — segurança e comportamento

`buildEvidenceBoard({evidence:[]}, game)` → `items=[]` (sem placeholder de evidência futura).  
`buildEvidenceBoard` com os 14 IDs → `totalDiscovered=14`.

`renderEvidenceDetails` escapa `& < > "` antes de qualquer `innerHTML`. Payload JSON de `buildEvidenceBoard` não contém `<script` nem `javascript:`. Payload de E01: `source="Não informado"`, `admissibilityLabel="Não informado"`, `qualityLabel="Não informado"`, `integrityLabel="Não verificada"`, `canSupportArrest=true`.

O ESM do board usa `innerHTML` só com markup estático ou strings já passadas por `escapeHtml`.

## 8. Chromium — `http://127.0.0.1:8765/`

Servidor: `python3 -m http.server 8765 --bind 127.0.0.1 --directory dist`. HTTP 200 em `/`, `/game.json`, `/modules/ui/evidence/evidence-board.js`.

Import no console da página:

```text
import('/modules/ui/evidence/evidence-board.js')
  exports: refreshBoard, wire
  typeof refreshBoard === 'function'
  typeof wire === 'function'
  typeof buildEvidenceBoard === 'undefined'   // módulo vizinho
  typeof createBoardController === 'undefined'
import('/modules/ui/evidence/build-evidence-board.js')
  typeof buildEvidenceBoard === 'function'
```

Rede: board + `build-evidence-board`, `evidence-filters`, `evidence-details`, `evidence-view-model`, `evidence-policy` → 200. Único 404: `favicon.ico` (irrelevante).

Sessão: campanha Null / U-19, save `arquivo-zero-pursuit-v2-caca_algoritmo_001-null` com `evidence: ["E13"]`. Abrir **PISTAS**:

- host `#evidence-board-host` preenchido
- card **E13** “Dump da base acadêmica”; fato vs interpretação em regiões distintas
- origem “Não informado”; qualidade “Não informado”; integridade “Não verificada”
- notas: benefício da dúvida; “não prova autoria sozinha”; disclaimer “Identificar evidência ≠ provar autoria”
- `#evidence-list` legado `hidden`
- filtro Admissibilidade=Admissível → **“0 visíveis de 1 catalogadas”**; E13 some da lista; save permanece `["E13"]`

Ação **Interrogar cafeteria** no capítulo Null consumiu 2h e mostrou texto de bilhete para Recife, **sem** catalogar E02 (Cifra). Isolamento de capítulo preservado.

`buildEvidenceBoard({evidence:[]}, game)` no browser → 0 itens. Com os 14 IDs → 14, todos `canSupportArrest=true`.

## 9. Gap — `arrest-validator`

```text
validateArrest(state com essenciais + warrantSuspect=culprit)
  decision: APPROVED
  evidenceScore: 1
  procedureScore: 1
  hypothesisScore: 0
  reasons: ["warrant_minimum_and_essentials"]
```

Fonte: três ramos com `hypothesisScore: 0`. Sem `canSupportArrest`. Integração é AZ-HYP-004 / AZ-VALIDATION-001 — **não reabrir** 003 nem o validador.

## SHA e motor

| Arquivo | SHA-256 |
|---|---|
| `dist/app.js` | `8e0b2d03c597dd8fe6daf3896bdaa69f21b1ccb7ade47f90ed5856f54da6efed` |
| `dist/game.json` | `870c69317dbbf5d078075ad41543daad9f3593da9e248d963fb1422a9bc046b7` |

`FUNCTION_MAP_PASS total=79 functions=42 arrows=37`  
`RANDOM_SCENARIOS_PASS chapters=4 scenarios=9 routes=9 culprit=byte\|null\|vertice\|cifra`  
`node --check dist/app.js` exit 0  
`python3 -m esaa --root . verify` ok no claim (seq 937)

Nenhum arquivo de código alterado nesta QA.

## Riscos residuais

1. **Catálogo vivo homogêneo.** Os 14 registros usam o mesmo default. Inadmissível/comprometido não tem exemplar publicado; cobertura é sintético + teste de UI.
2. **Quadro ESM não chama `adaptCase`.** Lê `game.json` via `fetch`. Mitigado hoje porque 3.0 já traz os campos. Fixture 2.x no browser rotularia integridade ausente como “Não informado” em vez de “Não verificada”.
3. **API ESM ≠ nomes do roteiro desta QA.** Browser: `refreshBoard`/`wire`. `createBoardController` só no CJS de teste.
4. **Rótulo de capítulo.** Detalhe mostrou `Capítulo: null` (id do capítulo Null). Confuso visualmente; não vaza conclusão de autoria.
5. **Git vs ESAA.** `src/ui/evidence/**` e `tests/ui/evidence/**` existem no workspace e passam testes, mas seguem untracked no git; `dist/modules/ui/evidence/**` está tracked. Risco de deploy se o commit omitir a fonte CJS.
6. **Working tree sujo alheio.** `scripts/validate-case.mjs` (Ajv 3.0) e testes de schema modificados fora desta tarefa. Esta QA não os altera. O PASS semântico veio também de `schema-validator.js` tracked.
7. **Runner reutilizado.** `grok` implementou 002 e completou 004-V2. Papel QA distinto; não é segunda implementação.
8. **Onda 3 ainda não está no event store.** `AZ-CONSTRAINT-001`, `AZ-VALIDATION-001`, `AZ-SUSPECT-002`, `AZ-HYP-004` → `TASK_NOT_FOUND`. Abrir via `task.create`, não inventar elegibilidade.

## Recomendação

- **Não** reabrir AZ-EVIDENCE-001…005 nem 004-V2.
- **Não** abrir hotfix: nenhum defeito comprovado que quebre aceite da onda.
- Abrir Onda 3 com `task.create` de **AZ-CONSTRAINT-001** (modelo triestado). Em paralelo de backlog, quando o grafo permitir: AZ-SUSPECT-001 e a spec AZ-VALIDATION-001 (depende de AZ-HYP-001 + AZ-EVIDENCE-003).
- AZ-HYP-004 continua o ponto correto para ligar `canSupportArrest` ao validador.

Onda 2 pode fechar. Identificar evidência continua distinto de provar autoria.
