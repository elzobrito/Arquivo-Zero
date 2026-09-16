# Crítica da admissão ESAA — catálogo AZ-* (75 tarefas)

**Data:** 2026-09-16  
**Alvo:** rascunho de `roadmap.json` com 75 tarefas `AZ-*`, `last_event_seq` 0, projeto `arquivo-zero`  
**Fontes:**  
- [`proposta-evolucao-arquitetural.md`](proposta-evolucao-arquitetural.md) (v1.0)  
- [`wbs-esaa-evolucao.md`](wbs-esaa-evolucao.md) (v2.0)  
- [`../qa/analise-fonte-prd-investigador-brasil.md`](../qa/analise-fonte-prd-investigador-brasil.md)  
- ESAA vivo em `.roadmap/` (18 `TITO-*` em `done`, `last_event_seq` 253)  
**Status:** crítica e sugestões; este arquivo **não** admite tarefas no orquestrador.

---

## 0. Veredito

O JSON é um **catálogo de admissão**, não o roadmap vivo. O store atual permanece o recorte TITO (`eligible` vazio, tudo `done`). Não zerar `activity.jsonl` para “começar limpo”: `done` é imutável e o histórico TITO é a baseline do vertical slice.

O catálogo traduz bem a WBS para `task_kind` `spec|impl|qa`, preenche `depends_on`, `targets`, `outputs` e `required_review_mode`, e deixa **somente `AZ-SPEC-001`** sem dependências — correto.

Não está pronto para `task.create` em lote. Sem ajuste, a Onda 0 quebra em boundary (`dist/**`, `tests/**`), a Onda 6 espera território nacional, migrações de conteúdo não tocam `game.json`, e cinco minijogos entram com aceite vazio.

**Ordem sugerida:** corrigir o JSON → admitir **só** `AZ-SPEC-001` → `claim/complete/review` dessa tarefa → só então o restante da Onda 0.

---

## 1. O que o rascunho acerta

- Enum do orquestrador respeitado: 13 `spec`, 51 `impl`, 11 `qa`. Tipos WBS `test`/`content` não aparecem como `task_kind`.
- Hotfixes com `task_type: hotfix` (não como kind).
- Grafo: `AZ-SPEC-001` único raiz; `AZ-HOTFIX-005` espera `AZ-SPEC-002`; `AZ-QA-001` espera os cinco hotfixes; `AZ-ARCH-001` espera ADR + QA de estabilidade.
- Fluxo Evidência → Restrição → Hipótese → Validação → Relatório preservado nas dependências.
- Review modes razoáveis: `AZ-HOTFIX-003` = `security`; specs de contrato = `governance`; QAs de marco = `regression`.
- Prefixo `AZ-*` não colide com `TITO-*` done.

---

## 2. Crítica por severidade

### P1 — a admissão falha ou o `complete` é rejeitado

#### P1.1 Hotfixes em `dist/app.js` sem `boundary_grant`

Contrato impl: escrita `src/**`, `tests/**`; proibido `.roadmap/**`. O motor do slice **vive em `dist/`**. Sem `boundary_grant` (ex. `dist/app.js` ou `dist/**`), `file_updates` no complete é `boundary_violation` — o mesmo modo de falha de `GQS-PY-EXERCICIOS-20260910`.

`task_type: hotfix` ainda exige `scope_patch` (`require_scope_patch_for_hotfix_tasks: true`). Os cinco `AZ-HOTFIX-*` não têm `scope_patch` nem `is_hotfix`.

**Sugestão**

```yaml
# em cada AZ-HOTFIX-001..004
task_kind: impl
task_type: hotfix
is_hotfix: true          # se o orquestrador usar o flag, não só task_type
scope_patch: ["dist/"]
boundary_grant: ["dist/app.js"]
targets: ["dist/app.js"]
outputs.files: ["dist/app.js"]
```

`AZ-HOTFIX-005` não deveria ter o mesmo alvo (ver P1.3).

#### P1.2 `AZ-SPEC-001` aponta `tests/baseline/**`

Kind `spec` tem `forbidden_write: tests/**`. Hashes e comandos cabem em `docs/baseline/**`. Fixtures de save/linter, se existirem, são tarefa `impl` posterior ou vão para `docs/baseline/` como texto.

**Sugestão:** `targets`/`outputs` só `docs/baseline/**` e `docs/architecture/az-spec-001.md`. Tirar `tests/baseline/**`.

#### P1.3 Conteúdo no arquivo errado

| Tarefa | Intenção WBS | Output no JSON | Problema |
|---|---|---|---|
| `AZ-HOTFIX-005` | fonte canônica de cenário | `dist/app.js` | duplicata está em `dist/game.json` (`scenarios` raiz vs `campaign.chapters.cifra`) |
| `AZ-EVIDENCE-004` | migrar E01–E16 | `src/domain/evidence/az-evidence-004.js` | dados do caso, não serviço |
| `AZ-SUSPECT-002` | migrar 4 suspeitos | `src/domain/suspects/az-suspect-002.js` | idem |
| `AZ-TERR-002/003` | municípios / 27 UFs | `src/domain/geography/*.js` | catálogo JSON |
| `AZ-QA-007` | capítulo evoluído jogável | `docs/qa/az-qa-007.md` | QA não pode escrever `dist/` nem `src/`; o slice novo é conteúdo |

**Sugestão**

- `AZ-HOTFIX-005`: `targets` `dist/game.json` + `scripts/verify-random-scenarios.mjs`; `boundary_grant` `dist/game.json` e, se o linter mudar, `scripts/**`. Kind `impl`, `task_type: maintenance` (não hotfix de motor).
- Migrações `*-002/003/004` de dados: `outputs.files` incluir o JSON canônico (`dist/game.json` ou `content/cases/*.json` quando o ADR definir). O `.js` no máximo como adaptador.
- `AZ-QA-007`: dividir em `AZ-QA-007-CONTENT` (`impl`/`maintenance`, escreve o capítulo 3.0) + `AZ-QA-007` (`qa`, só o relatório em `docs/qa/`). Sem isso o marco “vertical slice evoluído” vira um markdown que afirma o jogo sem alterá-lo.

#### P1.4 `AZ-REPORT-003` × Onda 6

`AZ-REPORT-003` depende de `AZ-TERR-004` (repositório com 5 cidades **e** 27 UFs). `AZ-REPORT-004` depende de `003`. A Onda 6 (relatório) não fecha antes da Onda 7 (território nacional). O caminho crítico do JSON/WBS finge que `AZ-REPORT-001 → 004 → 005` basta.

**Sugestão (escolher uma, cravar no ADR):**

- **A (preferida):** `AZ-REPORT-003` depende só de `AZ-TERR-002` (cinco municípios migrados) **ou** do grafo legado via adaptador 2.x. 27 UFs não são necessárias para reconstruir SP→Recife→POA.
- **B:** subir `AZ-TERR-001`–`004` (pelo menos TERR-002 + repositório mínimo das cinco cidades) **antes** da Onda 6; deixar `AZ-TERR-003` (27 UFs) na Onda 7.

Não deixar as duas ondas como estão.

---

### P2 — aceite oco, contrato incompleto, drift de versão

#### P2.1 Minijogos 003–007

Aceite atual:

> A entrega “Minijogo de …” está implementada e verificável conforme a WBS.

Isso não é critério. Restaurar o texto da WBS (evidência produzida, alternativa textual, custo, qualidade). Sem isso, `complete` passa com um stub.

#### P2.2 `AZ-HYP-007` perdeu a matriz

A WBS exige oito desfechos. O JSON deixou um único bullet. Recolocar:

- suspeito correto + prova suficiente;
- suspeito correto + prova insuficiente;
- suspeito incorreto;
- hipótese contraditória;
- mandado ausente;
- localização incorreta;
- procedimento inválido;
- prazo encerrado.

E o meta-critério: nenhum cenário vira vitória só pelo culpado certo.

#### P2.3 Descriptions que repetem o título

`AZ-QA-002`, `AZ-CONSTRAINT-002/004`, `AZ-HYP-003/005/006`, `AZ-TERR-002`…, vários `AZ-MINI-*`, `AZ-CAREER-*`, `AZ-QA-005`–`010`. Na admissão, copiar o **objetivo** da WBS. O dispatch usa `description`; título oco reduz o contexto do agente.

#### P2.4 Proposta v1.0 vs WBS “v2”

`docs/spec/proposta-evolucao-arquitetural.md` está em v1.0. A WBS cita “Proposta … v2”. `AZ-SPEC-001` deve cravar path + hash dos dois specs e do `app.js`/`game.json` atuais, para a baseline não apontar um documento inexistente.

#### P2.5 `AZ-SPEC-001` e a regra canônica

Os critérios pedem a regra “identificar não é provar”. No recorte ela **ainda não vale** (mandado = 1 atributo; provas só na prisão). A baseline deve **documentar o comportamento atual e a regra-alvo**, sem fingir que o motor já a aplica. Senão o ADR e os hotfixes partem de um falso presente.

#### P2.6 `AZ-QA-006` como `qa` que “cria o validador”

Criar validador é `impl` (WBS `test` → `impl`). QA de marco escreve `docs/qa/**`. Sugestão: `AZ-QA-006` permanece auditoria do validador já entregue em `AZ-ARCH-002` + `AZ-CONSTRAINT-007` + `AZ-TERR-007`; se faltar um CLI unificado, isso é `AZ-ARCH-00x`/`impl`, não a tarefa de review.

#### P2.7 `AZ-QA-009` como `spec` com `task_type: audit`

Kind `spec` + type `audit` + review `docs` é defensável (atualiza contratos). `targets` um único `az-qa-009.md` é estreito demais: o aceite pede mapa de funções, PRD, guia 3.0 e remoção de docs obsoletos. Ampliar `targets` para `docs/**` (escrita spec já cobre `docs/**`) e listar outputs reais (`function-map.md`, `campaign-contract.md`, guia).

---

### P3 — forma, grants futuros, paralelismo

#### P3.1 `src/core/az-arch-002.js` como nome de módulo

Um arquivo por ID ESAA (`az-evidence-002.js`) polui o domínio e impede merge natural no motor. O ADR (`AZ-SPEC-002`) deve dizer: o **output da tarefa** pode ser o arquivo de entrega daquela fatia, mas o nome canônico do módulo é o da arquitetura-alvo (`schema-validator.js`, `evidence-service.js`), com o ID só no envelope ESAA / notas de complete.

#### P3.2 Impl em `src/**` antes de `AZ-ARCH-004`

`AZ-ARCH-002` já escreve `src/core/` enquanto o jogo ainda bootstra `dist/app.js`. Sem um passo explícito de *wire* (`import` no `app.js` ou bundle), o validador nasce órfão. Sugestão: `AZ-ARCH-002` inclui “invocado por `loadGame` ou CLI `node scripts/validate-case.mjs`”; senão é código morto até a extração do DOM.

#### P3.3 UI em pacote `domain/`

`AZ-EVIDENCE-005`, `AZ-CONSTRAINT-006`, `AZ-HYP-003`, `AZ-TERR-005`, `AZ-CAREER-006` são interface. A árvore-alvo da proposta põe isso em `src/ui/`. Mover outputs para `src/ui/...` no JSON, ou aceitar no ADR que o slice ainda renderiza em `dist/app.js` até `AZ-ARCH-004`.

#### P3.4 `AZ-CONSTRAINT-007` depende de `AZ-SUSPECT-004`

O validador de unicidade na Onda 3 espera o dossiê novo da Onda 5. A WBS já fazia isso; a Onda 3 então **não fecha** sem mandado novo. Ou o validador 007 na Onda 3 opera só sobre o esquema/restrições (sem política de mandado), e a unicidade de suspeito fica no `AZ-QA-003`; ou a Onda 3 declara saída parcial.

#### P3.5 Paralelismo pós-`AZ-ARCH-001`

Specs `AZ-TERR-001`, `AZ-SUSPECT-001`, `AZ-HYP-001`, `AZ-CONSTRAINT-001`, `AZ-EVIDENCE-001` podem ser paralelas. O JSON já permite. Não paralelizar `AZ-SUSPECT-004` com `AZ-HYP-005` (o JSON já encadeia — manter).

#### P3.6 Índices

`indexes.by_status.todo: 75` está coerente com o array. Após admissão sobre o log TITO, o índice real será `done` (18 TITO) + `todo` (75 AZ), se o `init` não apagar o passado.

---

## 3. Sugestões de admissão (operacional)

### 3.1 Não destruir o log TITO

Admitir com `task.create` das `AZ-*` **em cima** de `last_event_seq` 253. As 18 `TITO-*` done são a evidência do slice que `AZ-SPEC-001` deve hashear. `activity clear` / `init` apaga isso.

### 3.2 Lote mínimo 1

Só `AZ-SPEC-001`. Outputs:

- `docs/baseline/slice-20260916.md` (hashes SHA-256 de `dist/app.js`, `dist/game.json`, `dist/index.html`, `dist/styles.css`; comandos `verify-function-map`, `verify-random-scenarios`, `node --check`; 5 cidades, 9 cenários, 4 capítulos; comportamento **atual** de mandado/prisão vs regra-alvo);
- `docs/architecture/az-spec-001.md` (ponte para baseline + regra canônica como requisito futuro).

Kind `spec` → actor `agent-spec`. Review `governance`. Sem `file_updates` em `dist/` ou `tests/`.

### 3.3 Lote 2 (após SPEC-001 `done`)

Em paralelo, cada um com grant/scope:

| ID | Grant / alvo |
|---|---|
| `AZ-SPEC-002` | `docs/adr/**`, `docs/architecture/**` |
| `AZ-HOTFIX-001` | `boundary_grant: dist/app.js` + `scope_patch: [dist/]` |
| `AZ-HOTFIX-002` | idem |
| `AZ-HOTFIX-003` | idem; review `security` |
| `AZ-HOTFIX-004` | idem; HTML se o reset ganhar botões (`dist/index.html` no grant) |

`AZ-HOTFIX-005` **depois** do ADR, alvo `dist/game.json`.

### 3.4 Mapa `task_type` / kind (congelar)

| WBS | Kind ESAA | `task_type` |
|---|---|---|
| spec | spec | governance |
| impl (motor/serviço) | impl | feature |
| content (JSON do caso) | impl | maintenance |
| test (validador/matriz) | impl | audit |
| hotfix slice | impl | hotfix (+ `scope_patch`) |
| qa de marco | qa | audit |

### 3.5 Campos a acrescentar no `task.create`

Para cada tarefa, além do que o rascunho já tem:

- `boundary_grant` quando o path sair de `src/**`/`tests/**`/`docs/**` do kind;
- `scope_patch` em todo `task_type: hotfix`;
- `acceptance_criteria` copiados da WBS, sem paráfrase oca;
- nota de complete futura: IDs `FN-*`/`CB-*` se `dist/app.js` mudar (contrato AGENTS.md).

### 3.6 Correção pontual do grafo (antes das Ondas 6–7)

```text
AZ-REPORT-003.depends_on = [AZ-REPORT-001, AZ-HYP-002, AZ-TERR-002]
# AZ-TERR-004 deixa de ser pré-requisito do relatório legado
# AZ-TERR-003 (27 UFs) permanece na Onda 7
```

### 3.7 Aceite a restaurar (minijogos)

Recolocar da WBS, exemplo `AZ-MINI-003`:

- identifica eventos relevantes;
- produz evidência digital;
- oferece alternativa textual;
- informa custo antes de iniciar.

Análogo para 004–007.

---

## 4. Checklist antes do primeiro `task.create`

```text
[ ] JSON confrontado com ESAA vivo (não é o store atual)
[ ] TITO-* done preservadas; sem activity clear
[ ] AZ-SPEC-001 sem targets em tests/**
[ ] AZ-HOTFIX-001..004 com boundary_grant dist/ e scope_patch
[ ] AZ-HOTFIX-005 retarget para game.json após ADR
[ ] AZ-REPORT-003 desacoplado de TERR-004 nacional
[ ] AZ-MINI-003..007 com aceite da WBS
[ ] AZ-HYP-007 com 8 desfechos
[ ] migrações de conteúdo incluem o JSON do caso
[ ] AZ-QA-007 não é a única escritora do capítulo 3.0
[ ] descriptions = objetivo da WBS
[ ] proposta v1.0 e WBS v2.0 hasheadas na baseline
```

Nenhum item acima autoriza editar `.roadmap/activity.jsonl` a partir deste documento.

---

## 5. Relação com o recorte atual

Os P1 do dossiê de fonte (`docs/qa/analise-fonte-prd-investigador-brasil.md`) continuam sendo o trabalho real da Onda 0:

- viagem/ação acima do saldo derrota (`AZ-HOTFIX-001`);
- save com `location` inválida quebra `render` (`AZ-HOTFIX-002`);
- `innerHTML` na vitória / import (`AZ-HOTFIX-003`);
- “Reiniciar toda a investigação” só apaga a fase (`AZ-HOTFIX-004`);
- `scenarios` raiz duplicam Cifra (`AZ-HOTFIX-005`).

`AZ-SPEC-001` não corrige isso; só congela hashes e a regra-alvo. Qualquer `complete` de SPEC-001 que altere `dist/` está fora de escopo.

---

## 6. Conclusão

O catálogo de 75 tarefas é a WBS em forma de envelope ESAA, com kind correto e um único raiz. Falta **fronteira de escrita**, **alvos de conteúdo**, **aceite verificável** e **um grafo de relatório que não espere o Brasil inteiro**.

Sugestão de execução: emendar o JSON com as correções P1/P2 desta crítica, admitir apenas `AZ-SPEC-001`, e só então abrir os hotfixes com grant em `dist/`.
