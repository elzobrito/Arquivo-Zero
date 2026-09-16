# AZ-QA-002-BROWSER — Prisão em navegador (fixture mínimo)

**Data:** 2026-09-16  
**URL:** http://127.0.0.1:8766/dist/  
**Import:** `docs/qa/fixtures/campaign-contract-min-playable.json` (mesmo caso que `tests/fixtures/campaign-contract-min.json` + `ending` jogável)  
**Capítulo vivo:** FX-001 · lt_a · A-2 (navegação alpha→charlie, não bravo)

Sessão 2 adaptada ao HOTFIX-007: viagem primeiro (sai de BRIEFING), mandado sem vistoria, depois abordagem. Identificar ≠ provar.

| Sessão | Desfecho esperado | reasons esperado | Modal exibido | reasons no console/UI | PASS/FAIL |
|--------|------------------|------------------|---------------|----------------------|-----------|
| 1 APPROVED | CASE_WON | warrant_minimum_and_essentials | PRISÃO LEGALMENTE VALIDADA / Prisão validada (fixture) | `{"decision":"APPROVED","suspect":"lt_a","reasons":["warrant_minimum_and_essentials"]}` fsm=CASE_WON rewarded=true evidence=["EA1"] | PASS |
| 2 INSUFFICIENT | CASE_LOST_WARRANT | insufficient_evidence | CONJUNTO PROBATÓRIO INSUFICIENTE / Prova insuficiente (fixture) | `{"decision":"DENIED","suspect":"lt_a","reasons":["insufficient_evidence"]}` fsm=CASE_LOST_WARRANT evidence=[] | PASS |
| 3 WRONG_WARRANT | CASE_LOST_WARRANT | wrong_warrant | MANDADO NÃO CORRESPONDENTE / Mandado não correspondente (fixture) | `{"decision":"DENIED","suspect":"lt_b","reasons":["wrong_warrant"]}` fsm=CASE_LOST_WARRANT evidence=["EA1"] | PASS |

`validateArrest` foi reexecutado no Chromium (`import('/dist/modules/arrest-validator.js')`) sobre o save em `localStorage` após cada abordagem.

Sessão 1: vistoriar → EA1 → dossiê specialty=Redes (Alfa) → viajar Charlie 3h → Abordar.  
Sessão 2: sem vistoriar → viajar Charlie → dossiê Redes → Abordar (0 provas).  
Sessão 3: vistoriar → EA1 → dossiê specialty=Dados (Beta, errado) → viajar Charlie → Abordar.

AZ-VSLICE-001 permanece não admitida; o bloqueio de clique de prisão está resolvido.
