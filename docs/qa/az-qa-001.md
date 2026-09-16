# AZ-QA-001 — Revisão da estabilização (Onda 0)

**Ator:** agent-qa  
**Data:** 2026-09-16  
**Escopo:** AZ-SPEC-001/002 e AZ-HOTFIX-001 a 005  
**Review mode:** regression  

## Veredito

A Onda 0 está **aprovada** para o vertical slice. Os P1 de saldo, save e XSS do dossiê de fonte não permanecem no motor. A campanha 2.x continua com 9 rotas solucionáveis. Importação deixa de executar HTML. Reinício distingue capítulo, campanha e carreira.

Esta auditoria **não** exercitou o jogo em navegador real (sem sessão de UI nesta passagem). A evidência é linter + testes de fonte + inspeção de `dist/app.js` / `index.html`.

## Suite reexecutada

| Comando | Resultado |
|---|---|
| `node scripts/verify-function-map.mjs` | `FUNCTION_MAP_PASS total=80 functions=41 arrows=39` |
| `node scripts/verify-random-scenarios.mjs` | `RANDOM_SCENARIOS_PASS chapters=4 scenarios=9 routes=9` |
| `node --check dist/app.js` | exit 0 |
| parse `dist/game.json` | GAME_JSON_OK |
| `tests/hotfix/az-hotfix-001-spend.test.mjs` | PASS cases=5 |
| `tests/hotfix/az-hotfix-002-save.test.mjs` | PASS |
| `tests/hotfix/az-hotfix-003-import.test.mjs` | PASS |
| `tests/hotfix/az-hotfix-004-reset.test.mjs` | PASS |
| divergência forçada raiz vs cifra | FAIL com mensagem de fonte canônica |

## P1 / P2

| Item | Status |
|---|---|
| Viagem/ação acima do saldo derrota | **corrigido** (`isUnaffordable`; botões e confirm recusam sem `spend`) |
| Horas negativas no diálogo | **corrigido** (`Math.max(0, hours-cost)`) |
| Save com location inválida | **corrigido** (`isolateSave` + `restoreState`) |
| innerHTML na vitória / import | **corrigido** (`escape` sempre; `importCase` 512 KiB) |
| Reiniciar = só a fase com copy enganoso | **corrigido** (três ações) |
| Cenários duplicados sem linter | **corrigido** (`canonical_scenarios: chapters`) |

## Limitações

- Auto-tarefas `HF-ISS-AZ-*` foram geradas pelo fluxo `issue.report` → `hotfix.create`. São reconciliação em `src/hotfix/*.txt`, não segundo patch em `dist/`.
- Mandado trivial (um atributo) **não** faz parte da Onda 0; permanece como comportamento da baseline até `AZ-SUSPECT-004`.
- Sem evidência de clique real no mapa/reset nesta QA.

## Conclusão

Critérios de aceite de AZ-QA-001 cumpridos. Slice jogável 2.x estável para `AZ-ARCH-001`.
