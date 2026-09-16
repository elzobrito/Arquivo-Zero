# Esquema de caso 3.0

**Tarefa:** `AZ-ARCH-001`  
**Status:** vigente para o validador e o adaptador  
**JSON Schema:** `docs/architecture/schemas/case-schema-3.0.json` (Draft-07)

A ausência de `schemaVersion` no JSON do slice atual significa **2.x**. O validador 3.0 **não** aceita `dist/game.json` como 3.0; o adaptador (`AZ-ARCH-003`) normaliza 2.x em memória.

## Obrigatórios

`schemaVersion` (`3` ou `3.x`), `metadata.{id,title,code,briefing,start,total_hours}`, `suspects`, `dossier.fields`, `evidence`, `locations`, `travel`, `navigation`, `arrest_requirements`, `scenarios`, `culprit`, `ending.{win_title,win_text,lose_title,lose_text}`.

## Opcionais na Onda 1

`territories`, `constraints`, `hypothesisPolicy`, `arrestPolicy`, `minigames`, `progressionRewards`, `reportTemplate`. Tornam-se obrigatórios nas ondas de restrição/hipótese quando o ADR correspondente o disser.

## Artefatos centrais

| Contrato | Arquivo |
|---|---|
| EvidenceRecord | `docs/architecture/schemas/evidence-record.schema.json` |
| ConstraintEvaluation | `docs/architecture/schemas/constraint-evaluation.schema.json` |
| HypothesisRecord | `docs/architecture/schemas/hypothesis-record.schema.json` |
| ValidationDecision | `docs/architecture/schemas/validation-decision.schema.json` |
| InvestigationReport | `docs/architecture/schemas/investigation-report.schema.json` |

EvidenceRecord 3.0 exige `id/title/text/tag`. `source`, `admissibility`, `quality` e `integrity` são opcionais em 3.0 (obrigatórios em 3.1+). O adaptador 2.x preenche `admissibility=unknown`, `quality=null`, `integrity=unverified` com WARN.

## Vitória

Este esquema **não** redefine a prisão 2.x. A regra canônica “identificar ≠ provar” entra em `arrestPolicy` nas tarefas `AZ-HYP-*`. Até lá, `arrest_requirements` continua sendo mínimo + essenciais.

## Fixtures

- `docs/architecture/fixtures/schema-3.0-valid.json` — caso 3.0 mínimo solucionável.
- `docs/architecture/fixtures/schema-3.0-invalid.json` — omite `metadata.id`.

## Compatibilidade

```text
schemaVersion ausente + campaign → 2.x
schemaVersion ausente sem campaign → 1.x
schemaVersion 2.x → adaptador
schemaVersion 3.x → validador 3.0
```
