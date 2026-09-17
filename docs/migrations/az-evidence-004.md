# AZ-EVIDENCE-004-V2 — Migração estruturada das evidências 3.0

**Tarefa:** `AZ-EVIDENCE-004-V2` (sucede `AZ-EVIDENCE-004`, que permanece `done` e imutável)  
**Kind:** `impl` · **type:** `maintenance` · **review:** `regression`  
**Documento publicado:** `dist/game.json` (`schemaVersion` `3.0`)  
**Catálogo:** 14 registros existentes `E01`–`E08` e `E11`–`E16`

Esta nota é o inventário e a matriz antes/depois da migração. Não reabre
`AZ-EVIDENCE-004`. Não cria `E09`/`E10`. Não inventa origem, relação, método
nem interpretação.

---

## Por que a sucessora existe

`AZ-EVIDENCE-004` gravou só `source: null` nos 14 registros e deixou
`admissibility`, `quality` e `integrity` como defaults do adaptador 2.x em
memória. `AZ-SCHEMA-001` formalizou `schemaVersion: "3.0"` no documento
publicado. No ramo 3.x, `adaptCase` devolve o JSON como está e **não**
preenche esses campos. A V2 materializa os defaults formais no documento
raiz e fecha o isolamento de IDs entre capítulos.

`E09` e `E10` nunca foram definidos nem referenciados. A lacuna permanece
documentada; não há fato a migrar.

---

## Inventário publicado

| ID | Título | Tag | Capítulo dono |
|---|---|---|---|
| E01 | Crachá clonado | especialidade | cifra |
| E02 | Bilhete para Recife | rota | cifra |
| E03 | Assinatura C1FR4 | identidade | cifra |
| E04 | Carga desviada | transporte | cifra |
| E05 | Mensagem interceptada | rota | cifra |
| E06 | Registro do hangar | localização | cifra |
| E07 | Áudio de negociação | prova | cifra |
| E08 | Manifesto de carga | prisão | cifra |
| E09 | — | — | lacuna histórica; não existe |
| E10 | — | — | lacuna histórica; não existe |
| E11 | Token de rede clonado | especialidade | byte |
| E12 | Sedã preto na fuga | transporte | byte |
| E13 | Dump da base acadêmica | especialidade | null |
| E14 | Passagem de ônibus | transporte | null |
| E15 | Overlay gráfico forjado | especialidade | vertice |
| E16 | Despacho fluvial | transporte | vertice |

A atribuição de capítulo replica o recorte já publicado
(`arrest_requirements` + IDs concedidos nos cenários). Não cria vínculo novo.

---

## Matriz antes → depois (catálogo)

Estado **antes** (pós-`AZ-SCHEMA-001`, SHA
`0274a9c3e00934d5b20e561b77678fe3f96fdecc249955b6567b62133422a00a`):
`id`, `title`, `text`, `tag`, `source: null`.

Estado **depois** (esta tarefa): os mesmos cinco campos, mais defaults
formais explícitos. Título, texto, tag e origem **não** mudam.

| Campo | Antes | Depois | Nota |
|---|---|---|---|
| `id` | E01–E08, E11–E16 | inalterado | 14 IDs preservados |
| `title` / `text` / `tag` | texto legado | inalterado | nenhum fato reescrito |
| `source` | `null` | `null` | origem desconhecida explícita |
| `admissibility` | ausente | `unknown` | default formal; não é inadmissível |
| `quality` | ausente | `null` | `null` ≠ `0` |
| `integrity` | ausente | `unverified` | não é `compromised` |
| `kind`, `method`, `type`, `relations`, `observedAt`, `contradicts`, `notes` | ausentes | ausentes | não justificados pelo legado |
| E09 / E10 | inexistentes | inexistentes | lacuna histórica |

Overrides de cenário continuam podendo trocar só `title`/`text` via
`evidence_overrides`. `FN-006` (`ev`) faz `Object.assign` sobre o registro
base, então os defaults do catálogo permanecem no registro efetivo.

---

## Isolamento entre capítulos

Critério: evidências de outro capítulo não entram em `state.evidence` no
capítulo ativo, na rota nem no desvio. Descoberta continua idempotente
(`catalogEvidence`).

As ações-base de São Paulo, Recife, Brasília e Porto Alegre ainda carregam
IDs da Cifra (`E01`–`E08`). Nos seis cenários de tenente, toda ação-base
que concederia um ID da Cifra recebe `action_overrides.evidence: null`.
O `result` copiado é o texto **já publicado** da ação-base; a V2 não redige
pista nova. O jogador pode ler o texto legado; o motor não cataloga o ID.

`poa_arrest` dos tenentes continua sem chave `evidence` porque a ação-base
já não concede prova.

A campanha permanece solucionável: quatro capítulos, nove cenários, rotas
e provas obrigatórias intactas.

---

## Fora de escopo

- Não altera `dist/app.js`.
- Não liga `evidence-policy` em `issueWarrant` nem em `validateArrest`.
- Não reclassifica `kind` (fato vs interpretação).
- Não inventa laboratório, minijogo, horário, suspeito ou autoria.
- Não atualiza `docs/architecture/function-map.*` (fora do boundary/grant
  desta tarefa). Impactos de função vão nas notas de `complete`.

---

## Verificações

```text
node tests/content/evidence-migration.test.mjs
  EVIDENCE_MIGRATION_PASS tests=29
node scripts/validate-case.mjs dist/game.json
  SCHEMA_PASS version=3.x issues=0
node scripts/verify-random-scenarios.mjs
  RANDOM_SCENARIOS_PASS chapters=4 scenarios=9 routes=9
node scripts/verify-function-map.mjs
  FUNCTION_MAP_PASS total=79
node tests/domain/evidence-policy.test.mjs
  EVIDENCE_POLICY_PASS tests=15
node tests/domain/evidence-service.test.mjs
  EVIDENCE_SERVICE_PASS tests=18
node tests/hotfix/run-all.mjs
  HOTFIX_SUITE_PASS tests=4
```

Fixtures: `tests/fixtures/evidence/catalog-before.json`,
`catalog-after.json`, `chapter-ownership.json`, `historical-gap.json`.
