# Crítica — Onda 1 · AZ-ARCH-001 a AZ-QA-002

**Data:** 2026-09-16  
**Baseline entrada:** AZ-BASELINE-20260916 · SHA 508679ea · 80 unidades  
**Baseline saída:** last_event_seq 510 · 79 unidades · verify ok  
**Revisor:** análise independente pós-done  
**Status:** PASS com ressalvas — Onda 2 pode ser admitida  

Tarefas de follow-up neste workspace:

| Achado | Tarefa ESAA | Estado esperado |
|---|---|---|
| P1 título do fixture inválido | `AZ-HOTFIX-006` | correção imediata |
| P2 WARRANT no BRIEFING | `AZ-HOTFIX-007` | antes de AZ-HYP-005 |
| P3 hypothesisScore sempre 0 | critério extra em AZ-HYP-004 | ver `docs/architecture/az-hyp-004-gap-hypothesis-score.md` |
| Clique real pós-ESM | `AZ-QA-002-BROWSER` | bloqueia AZ-VSLICE-001 |
| AZ-QA-002 | permanece `done` | imutável |

---

## Veredicto geral

A Onda 1 entregou o que o plano exigia. Os contratos dos cinco artefatos centrais existem, são válidos como JSON Schema Draft-07 e estão coerentes entre si. A FSM é funcional, testada e compatível com saves 2.x. O arrest-validator preserva a regra canônica do produto. O validador de esquema opera em CLI com WARN/FAIL corretos.

Há três problemas que devem ser registrados antes da admissão de AZ-EVIDENCE-001, um dos quais é um risco direto para a Onda 2.

---

## 1. Problemas que exigem ação antes ou durante a Onda 2

### P1 — WARN obrigatório: título errado em schema-3.0-invalid.json

**Severidade:** WARN · deve ser corrigido antes do primeiro uso em CI  
**Arquivo:** `tests/fixtures/schema-3.0-invalid.json` (cópia em `docs/architecture/fixtures/`)

O campo `metadata.title` diz "Fixture 3.0 válido" num fixture negativo. Correção: "Fixture 3.0 inválido — ausência de metadata.id". Tarefa: `AZ-HOTFIX-006`.

### P2 — RISCO: transição WARRANT aceita no estado BRIEFING

**Severidade:** RISCO para Onda 2 · não bloqueia Onda 1, bloqueia Onda 5  
**Arquivo:** `src/core/state-machine.js`

`BRIEFING` aceita `WARRANT → WARRANT_ISSUED`. A partir de AZ-HYP-005 isso permitiria mandado sem investigação. Tarefa: `AZ-HOTFIX-007` (remover WARRANT de BRIEFING; teste `transition(briefing, "WARRANT").ok === false`; `submitDossier` recusa no BRIEFING).

### P3 — GAP documentado: hypothesisScore sempre zero

**Severidade:** INFO · correto na Onda 1, gap na Onda 5  
**Arquivo:** `src/domain/arrest/arrest-validator.js`

Campo reservado no schema; cálculo real em AZ-HYP-004. Ver `docs/architecture/az-hyp-004-gap-hypothesis-score.md`.

---

## 2. Divergência de contagem de unidades (informativo)

Plano previa ≥ 82; entregue 79 porque `CB-016`, `CB-020` e `CB-021` migraram ao domínio. Critério era `FUNCTION_MAP_PASS`, não um número fixo.

## 3. Pendência de validação em navegador real

`AZ-QA-002` está done e não será reaberta. A sessão de clique real é `AZ-QA-002-BROWSER` e bloqueia `AZ-VSLICE-001`.

## 4. O que não deve ser alterado

- `validateArrest` separa `wrong_warrant` de `insufficient_evidence`; APPROVED exige mandado + mínimo + essenciais.
- `getCurrentState` deriva flags 2.x como documentado na crítica original.
- EvidenceRecord 3.0: required id/title/text/tag; quality/admissibility opcionais até 3.1+.
- `constraint-evaluation.schema.json` com `additionalProperties: false`.

## 5. Próximas tarefas

```text
Imediata:   AZ-EVIDENCE-001 (ainda não admitida)
Paralela:   AZ-HOTFIX-007
Manutenção: AZ-HOTFIX-006
Navegador:  AZ-QA-002-BROWSER
