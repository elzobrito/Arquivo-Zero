# AZ-EVIDENCE-005 — envelope de admissão (operador)

Baseline: ESAA seq ~895; AZ-EVIDENCE-004-V2 DONE.

## Classificação

```yaml
task_id: AZ-EVIDENCE-005
title: Criar quadro de evidências estruturado
task_kind: impl
task_type: feature
required_review_mode: regression
depends_on:
  - AZ-EVIDENCE-002
  - AZ-EVIDENCE-003
  - AZ-EVIDENCE-004-V2
  - AZ-SCHEMA-001
```

## Objetivo

UI de consulta das evidências **descobertas**: fato, interpretação (se cadastrada), origem/método, capítulo/cenário, qualidade, integridade, admissibilidade, relações explícitas, desconhecidos, contradições, justificativas da policy — sem revelar conclusões automáticas.

Fluxo: `dist/game.json` → Evidence Service → Evidence Policy → View Model → Quadro.

## Princípios

- UI não é fonte de verdade (não grava, não recalcula policy, não promove unknown→false, não conclui culpado).
- Identificar ≠ provar.
- unknown permanece “Não informado/Desconhecido”.

## Escopo

- Lista só descobertas; sem cards bloqueados/contadores de não descobertas.
- Detalhe com seções separadas (fato vs interpretação).
- Filtros determinísticos sem mutar estado/save/repo/admissibilidade.
- Ordenação não conclusiva.
- Contradições visíveis; relações só cadastradas.

## Targets / outputs / grant

```yaml
targets:
  - src/ui/evidence/**
  - src/application/evidence/**
  - dist/modules/ui/evidence/**
  - dist/index.html
  - dist/styles.css
  - tests/ui/evidence/**
  - docs/ui/evidence-board.md
outputs:
  files:
    - src/ui/evidence/evidence-board.js
    - src/ui/evidence/evidence-view-model.js
    - src/ui/evidence/evidence-filters.js
    - src/ui/evidence/evidence-details.js
    - tests/ui/evidence/evidence-board.test.mjs
    - tests/ui/evidence/evidence-filters.test.mjs
    - tests/ui/evidence/evidence-accessibility.test.mjs
    - docs/ui/evidence-board.md
boundary_grant:
  - dist/modules/ui/evidence/**
  - dist/index.html
  - dist/styles.css
```

Não incluir `dist/app.js` sem grant explícito. Inspecionar árvore e reutilizar convenções existentes.

## Fora de escopo

Não modificar: game.json, schema, validate-case, evidence-policy/service, E01–E16, hipóteses, mandado, arrest-validator, state-machine, vitória/prisão, .roadmap/**.

## Aceite (resumo)

Só descobertas; fato≠interpretação; unknown explícito; admissibilidade≠relevância; incompleta/inadmissível/contradições preservadas; filtros determinísticos sem mutação; teclado/a11y; sem XSS HTML; sem conclusão de autoria; baselines SCHEMA/FUNCTION_MAP(79)/MIGRATION(29)/POLICY(15)/SERVICE(18)/HOTFIX(4); `python -m esaa verify` ok.

## Testes / validações

Incluir suítes UI + regressões listadas pelo operador (validate-case, random scenarios, function-map, domain, hotfix, esaa verify) e smoke HTTP.

## Complete evidence

Arquivos, SHA game.json e app.js antes/depois, diffs restritos, saídas de testes, smoke HTTP, matriz visível/não visível, FN/CB, declarações de não-duplicação de policy e não-revelação, verify_status e seq final.

## Envelope JSON

```json
{
  "task_id": "AZ-EVIDENCE-005",
  "title": "Criar quadro de evidências estruturado",
  "description": "Implementar interface acessível para consultar evidências descobertas, separando fatos, interpretações, origem, qualidade, integridade, admissibilidade, completude, relações e contradições, sem alterar estado do caso, revelar não descobertas ou concluir autoria.",
  "task_kind": "impl",
  "task_type": "feature",
  "depends_on": ["AZ-EVIDENCE-002", "AZ-EVIDENCE-003", "AZ-EVIDENCE-004-V2", "AZ-SCHEMA-001"],
  "targets": ["src/ui/evidence/**", "src/application/evidence/**", "dist/modules/ui/evidence/**", "dist/index.html", "dist/styles.css", "tests/ui/evidence/**", "docs/ui/evidence-board.md"],
  "outputs": {"files": ["src/ui/evidence/evidence-board.js", "src/ui/evidence/evidence-view-model.js", "src/ui/evidence/evidence-filters.js", "src/ui/evidence/evidence-details.js", "tests/ui/evidence/evidence-board.test.mjs", "tests/ui/evidence/evidence-filters.test.mjs", "tests/ui/evidence/evidence-accessibility.test.mjs", "docs/ui/evidence-board.md"]},
  "boundary_grant": ["dist/modules/ui/evidence/**", "dist/index.html", "dist/styles.css"],
  "required_review_mode": "regression"
}
```

Também leia o arquivo completo do operador se existir em /tmp/az-evidence-005-full-from-operator.md (detalhamento longo de princípios/aceitação/casos de teste).
