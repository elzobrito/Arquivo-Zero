# AZ-SPEC-001 — Ponte da baseline do vertical slice

**Tarefa:** `AZ-SPEC-001`  
**Kind:** `spec` · **type:** `governance` · **review:** `governance`  
**Baseline canônica:** [`docs/baseline/slice-20260916.md`](../baseline/slice-20260916.md) (`AZ-BASELINE-20260916`)

---

## Objetivo cumprido

Registrar, sem alterar o motor, o estado reproduzível do Arquivo Zero imediatamente antes da evolução `AZ-*`: hashes, verificadores, cinco cidades, nove cenários, quatro capítulos, e a **diferença** entre mandado/prisão atuais e a regra-alvo “identificar não é provar”.

## Ponteiros

| Tema | Onde |
|---|---|
| Hashes `dist/app.js`, `game.json`, `index.html`, `styles.css` | baseline §1 |
| Specs de evolução (proposta v1.0, WBS v2.0) | baseline §2 |
| Comandos e saídas dos linters | baseline §3 |
| Cidades, capítulos, rotas | baseline §4 |
| Comportamento **atual** de mandado e prisão | baseline §5 |
| Regra-alvo **não implementada** | baseline §6 |
| Mapa de funções (69 unidades) | `docs/architecture/function-map.json` / `.md` |
| Contrato de campanha 2.x | `docs/architecture/campaign-contract.md` |
| Análise fonte × PRD | `docs/qa/analise-fonte-prd-investigador-brasil.md` |
| Crítica do catálogo de admissão | `docs/spec/critica-admissao-roadmap-az.md` |

## Regra canônica (requisito futuro, não fato do motor)

```text
IDENTIFICAR O CRIMINOSO NÃO É PROVAR SUA RESPONSABILIDADE
```

Vitória futura exige a conjunção da proposta §3.7.1. O slice 2026-09-16 vence com culpado no mandado + essenciais + contagem mínima. Um atributo único do dossiê já emite mandado. Ver baseline §5 versus §6.

## Fora de escopo desta spec

- `file_updates` em `dist/**`, `tests/**`, `.roadmap/**` (proibido pelos critérios).
- Hotfixes de saldo, save, import e reinício (`AZ-HOTFIX-001`–`004`).
- ADR de migração (`AZ-SPEC-002`).
- Admissão do restante do catálogo 1.1.

## Verificações registradas

1. `sha256sum` dos quatro artefatos `dist/` e dos dois specs em `docs/spec/`.
2. `node scripts/verify-function-map.mjs` → `FUNCTION_MAP_PASS total=69`.
3. `node scripts/verify-random-scenarios.mjs` → `RANDOM_SCENARIOS_PASS chapters=4 scenarios=9`.
4. `node --check dist/app.js` → exit 0.
5. Parse JSON de `dist/game.json` → ok.
