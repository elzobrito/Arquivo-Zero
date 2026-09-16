# AZ-QA-002 — Compatibilidade arquitetural (Onda 1)

**Ator:** agent-qa  
**Data:** 2026-09-16  
**Pré-requisito:** AZ-ARCH-001 a 005 done  
**Review mode:** regression  

## Veredito

A fundação 3.0 está **aprovada** para abrir a Onda 2 (`AZ-EVIDENCE-001`), ainda **não admitida**. O vertical slice 2.x permanece o caso em disco (`dist/game.json` sem `schemaVersion`). Vitória continua mandado + mínimo + essenciais; identificar o culpado sem provas **não** aprova prisão nos testes de domínio.

Não houve sessão de navegador real nesta auditoria. Evidência: CLI, linters e testes Node.

## Checklist

| Verificação | Resultado |
|---|---|
| `node --check dist/app.js` | NODE_CHECK_OK |
| parse `dist/game.json` | GAME_JSON_OK; `schemaVersion` ausente (2.x) |
| `verify-function-map.mjs` | FUNCTION_MAP_PASS total=79 functions=42 arrows=37 |
| `verify-random-scenarios.mjs` | RANDOM_SCENARIOS_PASS chapters=4 scenarios=9 |
| `validate-case.mjs dist/game.json` | SCHEMA_WARN 2.x (schemaVersion ausente) |
| `validate-case.mjs campaign-contract-min.json` | SCHEMA_WARN 2.x (aceito; exit 0) |
| `validate-case.mjs schema-3.0-valid.json` | SCHEMA_PASS |
| `validate-case.mjs schema-3.0-invalid.json` | SCHEMA_FAIL `metadata.id` |
| `tests/domain/run-all.mjs` | DOMAIN_PASS invariants=5 |
| `tests/core/state-machine.test.js` | FSM_PASS |
| `tests/hotfix/run-all.mjs` | HOTFIX_SUITE_PASS tests=4 |
| `python -m esaa verify` | ok · last_event_seq 503 no momento da medição |

## Funções novas / retiradas no mapa do motor

Novas no `dist/app.js` nesta onda: `FN-043 adaptCase`, `CB-039 adaptCase.mapEvidence`.  
Retiradas do motor (lógica em `src/domain/**`, IDs não reutilizáveis): `CB-016`, `CB-020`, `CB-021`.  
O plano previa ≥82 unidades se os callbacks permanecessem inline; após extração o mapa correto é **79**.

## SHA dos artefatos

| Arquivo | SHA-256 |
|---|---|
| `dist/app.js` | `5ef566dfdbae2036bef89f587722b7d956abe6b4ecf47567cb27ebde163fd518` |
| `dist/game.json` | `a97912559deeb4a56861da3211390231e3992d75a4e561804245d5930f2af318` |
| `src/contracts/case-schema-3.0.json` | `5c4032618a81afcf25d4612767760c987c02421460fb1dffcbb5f52b42c27305` |
| `src/infrastructure/schema/schema-validator.js` | `c67bdf9c95e761889b37600eb4ffb762230830e5caabc1e626c753e4107fb623` |
| `src/infrastructure/schema/case-adapter.js` | `55310afdae0b5e4ecc74e36c6ed8c1cf95ffcc61683dae294788b965d743c01f` |
| `src/core/state-machine.js` | `ffe6d4c5ec07dc6ed9f4cda1e5102524ea305fb0385afc31efb19d966dd8ed33` |

## Riscos residuais

- `dist/modules/*.js` espelha `src/domain` e `src/core` para o browser (`python -m http.server -d dist`). Divergência futura é risco operacional até existir bundler.
- `AZ-ARCH-001` publicou schemas em `docs/architecture/schemas/` porque `spec` não escreve `src/**`; `AZ-ARCH-002` materializou `src/contracts/`.
- campaign-min retorna WARN (não PASS) por `schemaVersion` ausente — coerente com 2.x.
- Sem evidência de clique real no mapa/dossiê/prisão após os imports ESM.
- Mandado trivial por um atributo permanece (fora da Onda 1).

## Recomendação

Abrir Onda 2 com `AZ-EVIDENCE-001` após `task.create`. Não reabrir tarefas `done`.
