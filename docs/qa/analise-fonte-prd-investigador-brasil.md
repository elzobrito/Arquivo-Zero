# Análise de fonte × PRD Investigador Brasil

**Data:** 2026-09-16  
**Alvo:** `/home/elzobrito/desenvolvimento/Arquivo Zero`  
**PRD de referência:** Investigador Brasil v2.0 (em definição)  
**Recorte no disco:** Arquivo Zero — Caçada Digital  

Este dossiê lê o motor e o caso **como estão**, e os compara com o PRD. Não autoriza furar o contrato local (5 cidades, sem minigame, sem gerador LLM). Não altera `dist/` nem `.roadmap/`.

---

## 0. Veredito em uma tela

O código é um **protótipo jogável e data-driven** de um único caso educacional em cinco capitais, com campanha (2 lieutenants + chefão). Não é o MVP do PRD.

O loop que existe: receber briefing → viajar no grafo gastando horas → investigar locais → catalogar provas → cruzar 3 atributos → mandado → abordar em Porto Alegre.

O loop que o PRD descreve: 27 estados × restrições que reduzem um espaço de busca de dezenas de suspeitos × relatório de hipótese × minijogos que geram evidência × progressão por rank.

Linters do recorte passam. Há bugs reais no recorte (saldo de horas, save corrompido) independentes das lacunas de produto.

| Medida | Valor |
|---|---|
| `dist/app.js` SHA-256 | `ba9b829894c99d51dcf68bb2484f7315c14a4477e1873ea00ba16854d75a390f` |
| `dist/game.json` SHA-256 | `6ee4590f3763a1cc7291d97d646b8850b4c5ba0ab676f4bc78c7fa32cad6849b` |
| Mapa de funções | 69 unidades (`FN-001`–`FN-035`, `CB-001`–`CB-034`) |
| `verify-function-map.mjs` | `FUNCTION_MAP_PASS total=69 functions=34 arrows=35` |
| `verify-random-scenarios.mjs` | `RANDOM_SCENARIOS_PASS chapters=4 scenarios=9 routes=9` |
| `node --check dist/app.js` | ok |

---

## 1. O que está no disco versus o PRD

| Dimensão | PRD Investigador Brasil | Arquivo Zero hoje |
|---|---|---|
| Nome | Investigador Brasil | Arquivo Zero — Caçada Digital |
| Mundo | 27 estados, ~100 municípios, 4 níveis | 5 capitais, 1 grafo de cidades |
| Casos | 30, cinco categorias | 1 campanha, 4 capítulos, furto de algoritmo |
| Suspeitos | 200; redução 50 → 1 | 4 codinomes; mandado se cruzamento = 1 |
| Evidência | categoria, valor, confiabilidade, origem | `id`, `title`, `text`, `tag` |
| Tempo | dias; entrevista 1 h … interestadual 8 h | 56 h (lieutenant) / 72 h (Cifra) |
| Progressão | Trainee → Elite, desbloqueios | inteiro de estrelas em `localStorage` |
| Minijogos | 5 tipos, só para produzir evidência | nenhum |
| Arquitetura | camadas + State/Strategy/Repository + IA | `app.js` único + JSON + `localStorage` |
| Encerramento | relatório + hipótese | dossiê → mandado → `poa_arrest` |
| Máquina de estados | BRIEFING → … → CLOSED | flags `warrant` / `finished` / `rewarded` + `<dialog>` |

As 27 artes de capitais já estão em `dist/assets/cities/`. O motor só resolve cinco chaves em `CITY_ART`. O contrato `docs/architecture/campaign-contract.md` lista como **fora de escopo** minigame, cidades além das cinco e gerador LLM — o inverso do MVP e da Fase 5 do PRD.

---

## 2. Catálogo: funcionalidade × acionamento × rota de funções

Convenção: IDs de `docs/architecture/function-map.json`. **Acionamento** = evento de UI ou bootstrap. **Rota** = cadeia em `dist/app.js`.

| # | Funcionalidade | Acionamento | Rota de funções | Dados / persistência |
|---:|---|---|---|---|
| 1 | Carregar caso | `loadGame()` no fim de `app.js` | `FN-002` → se campanha: `FN-030` `campaignOn` → `FN-034` `readCampaign` → `FN-035` `applyChapter` → restore ou `FN-003` `fresh` → `FN-027` `pickScenario` → `FN-004` `save` → `FN-007` `render` | `fetch game.json?v=campaign-001`; save `arquivo-zero-pursuit-v2-<caso>-<capítulo>` |
| 2 | Ambientação WebGL | `scene()` no boot | `FN-025` → `FN-026` animate + `CB-032` resize | Three.js via CDN; falha silenciosa (`catch{}`) |
| 3 | Sortear run da campanha | primeiro load sem cursor, ou vitória no chefão | `FN-033` `startCampaign` → `FN-032` `writeCampaign` | 2 IDs de `{byte, null, vertice}` + `boss=cifra` |
| 4 | Overlay do capítulo | load / avanço de fase | `FN-035` muta `game.culprit`, `metadata.start/briefing/total_hours`, `arrest_requirements`, `scenarios` | `campaign.chapters.{byte,null,vertice,cifra}` |
| 5 | Sortear cenário (rota de pistas) | `fresh` / save antigo sem `scenario` | `FN-027` (exclui o anterior se houver alternativa); leitura `FN-028` | `scenarios[].id`, `code`, `route`, `navigation`, overrides |
| 6 | Sincronizar a mesa | após qualquer transição | `FN-007` → `FN-024` `chars`, `FN-018` `career`, `FN-008` `clock`, `FN-009` `map`, `FN-010` `place`, `FN-011` `evidence`, `FN-012` `route`, `FN-016` `dossier` | arte `CITY_ART[location]`; código `AZ-2026-041 · <capítulo> · <N-17>` |
| 7 | Relógio / prazo | via `render` | `FN-008` | `state.hours / metadata.total_hours`; `.danger` se ≤ 16 h |
| 8 | Abrir mapa | click `#map-button` | `CB-033` → `#map-dialog.showModal()` (DOM já preenchido por `FN-009`) | — |
| 9 | Mapa progressivo e viagem | click cidade habilitada → `#confirm-travel` | `FN-009` → `CB-004` HTML → `CB-005`/`CB-006` → `FN-013` `openTravel` → `CB-014` → `FN-015` `spend` → grava `location/route/visited` → `FN-004` → fecha diálogos → `FN-007` | visível = atual ∪ visitadas ∪ `scenario.navigation[atual]`; custo `travel[origem][destino]`; coords `locations[].x/y` |
| 10 | Investigar local | click em `#location-actions` | `FN-010` `place` → `CB-009`/`FN-029` `actionData` → `CB-010`/`CB-011` → `FN-014` `act` → `FN-015` → marca ação, prova `FN-006` `ev` → `FN-004`/`FN-007`/`FN-021` | `locations[].actions` + `action_overrides` / `evidence_overrides` |
| 11 | Quadro de pistas | click `#evidence-button` | `CB-034` abre; lista por `FN-011` + `CB-012` | só IDs em `state.evidence`; sem total secreto |
| 12 | Histórico da rota | painel do mapa | `FN-012` + `CB-013` | `state.route` / `visited` (“N cidades”, sem denominador) |
| 13 | Intel da cidade | via `place` | `FN-010` + `FN-022` `escape` nos fatos | `locations[].city_info` |
| 14 | Caderno | `#notes-button`; `input` no textarea | `CB-026` abre; `CB-029` → `FN-024` → `FN-004` | `state.notes` |
| 15 | Dossiê / mandado | `#dossier-button`; submit | `CB-025` abre; `FN-016` monta `CB-017`/`CB-018`; `FN-017` → `CB-019`–`CB-022` | mandado se **exatamente 1** suspeito; `state.warrant` + `warrantSuspect` |
| 16 | Abordagem / prisão | ação `poa_arrest` (`requires_warrant`) | `FN-014` com `arrest` → `CB-016` requisitos → vitória `FN-019` `awardStar` ou derrota; `FN-021` `show` | `culprit`; `minimum_evidence` + `required_evidence`; `ending.*` |
| 17 | Avançar capítulo / nova campanha / novo caso | botão do diálogo final | `FN-021` escolhe rótulo PRÓXIMO CAPÍTULO / NOVA CAMPANHA / INICIAR NOVO CASO → `FN-020` `newCase` | vitória + campanha: `index++` ou `FN-033`; derrota: `fresh` **na mesma fase** |
| 18 | Reiniciar | `#reset-button` + `confirm` | `CB-030` apaga save da fase → `FN-003`/`FN-027` → `FN-004`/`FN-007` | **não** zera cursor da campanha nem estrelas |
| 19 | Importar caso | `#json-input` change | `CB-031` → `FN-002` com objeto | File API; validação mínima: `metadata.id`, `locations`, `travel`, `dossier` |
| 20 | Fechar diálogos | `[data-close]`; timeout de derrota | `CB-027`/`CB-028`; `FN-023` + `CB-024` | todos os `<dialog open>` |
| 21 | Carreira (estrelas) | vitória válida; `render` | `FN-019` uma vez por fase (`state.rewarded`); `FN-018` lê | `arquivo-zero-career-v1` (global) |

### Fluxos mestres

```text
loadGame (FN-002)
  ├ campaignOn? readCampaign → applyChapter
  ├ state ← localStorage || fresh(pickScenario)
  └ render (FN-007)
       ├ clock / career / chars
       ├ map (navigation da variante) ──click──► openTravel ──confirm──► spend → save → render
       ├ place (ações efetivas) ──click──► act → spend → [prova | prisão] → show
       ├ evidence / route / dossier
       └ dossier submit ──► warrant unívoco → show

show(final)
  └ newCase
       ├ vitória + próximo capítulo → writeCampaign + applyChapter + fresh
       ├ vitória no boss → startCampaign + applyChapter + fresh
       └ derrota / reset de fase → fresh(mesmo capítulo)
```

Lacuna do mapa canônico (o linter não exige): `scene(); loadGame();` no EOF não entram em `calledBy` de `FN-025` / `FN-002`. O campo `signature` de `FN-002` no JSON ainda cita o default `random-clues-001`; o `anchor` já está `campaign-001`.

### Correlação função → superfície

| Superfície | Funções |
|---|---|
| Bootstrap e persistência | `FN-002`–`FN-004`, `FN-027`, `FN-030`–`FN-035`, `CB-001`, `CB-030`, `CB-031` |
| Mapa e viagem | `FN-005`, `FN-008`, `FN-009`, `FN-012`, `FN-013`, `FN-015`, `CB-002`, `CB-004`–`CB-008`, `CB-013`, `CB-014`, `CB-033` |
| Investigação e provas | `FN-006`, `FN-010`, `FN-011`, `FN-014`, `FN-029`, `CB-003`, `CB-009`–`CB-012`, `CB-015`, `CB-016`, `CB-034` |
| Dossiê e mandado | `FN-016`, `FN-017`, `CB-017`–`CB-022`, `CB-025` |
| Desfechos e carreira | `FN-018`–`FN-021`, `CB-023` |
| Shell / caderno / close | `FN-001`, `FN-007`, `FN-022`–`FN-024`, `CB-026`–`CB-029` |
| Three.js | `FN-025`, `FN-026`, `CB-032` |

---

## 3. Rotas geográficas do recorte

**Cenário** = cadeia intencional de pistas (`scenarios[].route`). **Grafo** = `scenario.navigation` (fallback `game.navigation`). O jogador pode desviar; o linter garante que prova obrigatória não vaza para cidade fora da rota.

Mundo jogável: São Paulo, Recife, Brasília, Manaus, Porto Alegre. Única ação `arrest: true` = `poa_arrest` (1 h, exige mandado).

| Capítulo | Alvo | Código | Cadeia | Viagem (h) | Inv. mín. + prisão | Total mín. | Orçamento | Folga |
|---|---|---|---|---:|---:|---:|---:|---:|
| byte | Byte Azul | B-17 | SP → Recife → POA | 17 | 6 | 23 | 56 | 33 |
| byte | Byte Azul | B-23 | SP → Brasília → POA | 9 | 9 | 18 | 56 | 38 |
| null | Null | U-11 | SP → Manaus → POA | 19 | 7 | 26 | 56 | 30 |
| null | Null | U-19 | SP → Recife → Brasília → POA | 18 | 8 | 26 | 56 | 30 |
| vertice | Vértice | V-08 | SP → Manaus → POA | 19 | 11 | 30 | 56 | 26 |
| vertice | Vértice | V-14 | SP → Recife → POA | 17 | 9 | 26 | 56 | 30 |
| cifra | Cifra | N-17 | SP → Recife → Brasília → POA | 18 | 25 | 43 | 72 | 29 |
| cifra | Cifra | A-23 | SP → Manaus → Brasília → POA | 21 | 27 | 48 | 72 | 24 |
| cifra | Cifra | C-31 | SP → Brasília → Recife → POA | 18 | 26 | 44 | 72 | 28 |

Todas as nove rotas são solucionáveis no prazo. Lieutenants exigem 2 provas (`E11`–`E16` aos pares). Cifra exige 7, com essenciais `E01`, `E03`, `E04`, `E07`, `E08`.

Arestas com custo em `travel` e **sem** correspondente em `game.navigation` raiz (o grafo efetivo é o do cenário): SP→POA 4 h, Recife→POA 9 h, Manaus→POA 10 h, POA→Recife 9 h, POA→Manaus 10 h.

`game.trail` (`sao_paulo → recife → brasilia → porto_alegre`) **não é lido** por `app.js`. É resto do caso linear antigo.

Ações-base por cidade:

| Cidade | Ações (id · custo · prova) |
|---|---|
| São Paulo | `sp_camera` 3 h E01 · `sp_desk` 4 h E03 · `sp_cafe` 2 h E02 |
| Recife | `re_port` 4 h E04 · `re_terminal` 3 h E05 · `re_hotel` 5 h — |
| Brasília | `bsb_hangar` 5 h E06 · `bsb_audio` 4 h E07 · `bsb_archive` 4 h — |
| Manaus | `mao_port` 6 h — · `mao_network` 5 h — |
| Porto Alegre | `poa_manifest` 4 h E08 · `poa_arrest` 1 h (mandado) · `poa_street` 6 h — |

Provas de lieutenant (`E11`–`E16`) entram por `action_overrides` do cenário.

---

## 4. Matriz PRD ↔ implementação

### Loop do jogador (PRD §6)

| Passo PRD | Status | Onde no recorte |
|---|---|---|
| Receber caso | parcial | briefing + campanha; 1 caso, não 30 |
| Analisar evidências iniciais | parcial | só texto de briefing; nenhuma evidência pré-carregada |
| Selecionar estado destino | **ausente** | destino = cidade, não UF; 5 nós, não 27 |
| Investigar locais | presente | 2–3 ações por cidade |
| Coletar evidências | parcial | catálogo simples; sem confiabilidade/origem |
| Reduzir possibilidades | **ausente como sistema** | dossiê filtra 4 suspeitos por igualdade de string, não por restrição geográfica/econômica |
| Identificar suspeitos | parcial | 4 codinomes; PRD pede 50 → 1 |
| Validar hipóteses | **ausente** | não há objeto hipótese nem relatório |
| Emitir relatório | **ausente** | há mandado, não relatório |
| Encerrar caso | parcial | prisão em POA; sem máquina BRIEFING…CLOSED |

### Mecânicas (PRD §8–17, §24–26)

| Requisito PRD | Status no recorte |
|---|---|
| Redução 50 suspeitos / 27 estados → 1 / 1 | 4 suspeitos, 5 cidades; sem espaço de busca |
| Investigar pessoas, docs, sistemas, laudos | só rótulos de ação (câmeras, porto, hangar…) |
| Analisar gera restrição (ex. Porto de Santos ⇒ SP) | não; pista é texto + `tag` |
| Viajar consome tempo | sim (`FN-015` + matriz `travel`) |
| Mandado com evidências suficientes | **não**: mandado exige só 1 match de atributos. Provas entram na **prisão** |
| Concluir após hipótese | prisão testa culpado + mínimo + essenciais |
| Evidence `{categoria, valor, confiabilidade, origem}` | só `tag` livre (`especialidade`, `rota`, `prova`…) |
| Suspect `{org, função, localização, histórico}` | só `id/name/specialty/vehicle` |
| Filtro progressivo 50 → 14 → 4 → 1 | cada um dos 3 campos já é único; **um** atributo emite mandado |
| 4 níveis territoriais (país / UF / município / local) | 1 nível (cidade = local) |
| Minijogos geram evidência | zero |
| Rankings Trainee–Elite | estrelas inteiras |
| IA de caso / dificuldade / consistência | `Math.random` no pool e no cenário |
| Camadas + repositórios | um arquivo JS |
| MVP 27 / 100 / 30 / 200 | 5 / 5 / 1 / 4 |
| Categorias Compliance, LGPD, Educação, Ergonomia, Logística | um caso de furto de algoritmo (Educação / SI) |

A fórmula central do PRD (`Possibilidades ∩ Restrições`) **não existe como tipo**. O motor faz: grafo + orçamento + igualdade de três strings + lista de IDs de prova.

### O que o recorte já antecipa (reaproveitável)

- Loop viajar → investigar → gastar horas → persistir → renderizar.
- Caso 100% declarativo em JSON (importar arquivo troca o conteúdo sem recompilar).
- Revelação progressiva (INV-3): totais secretos não vão para o DOM.
- Mandado unívoco (INV-4) — a *ideia* bate com “reduzir até 1”; os *dados* tornam isso trivial.
- 27 artes de capitais já geradas.
- Mapa cartográfico do Brasil (`brasil-map.webp`) com coordenadas `x/y`.
- Campanha em capítulos com overlay, não um JSON por fase.

---

## 5. Achados do recorte (bugs, não gaps de PRD)

Severidade: **P1** quebra ou derrota indevida · **P2** contrato/docs/UX mentem ou enfraquecem a mecânica · **P3** morto, drift, polish.

### P1 — runtime

1. **Viagem ou ação acima do saldo derrota na hora.** Botões de cidade e de investigação não desabilitam quando `cost > state.hours`. `CB-014` / `FN-014` chamam `FN-015`; se `remaining < 0` (ou `== 0` sem `allowZero`), zera o relógio, marca `finished` e mostra `ending.lose_*` — inclusive se o jogador só confirmou um destino caro. `FN-013` interpola `state.hours - cost` no HTML e pode mostrar **horas negativas**.

2. **Save com `location` inválida derruba o render.** `loc()` pode ser `undefined`; `render()` usa `current.name` sem guarda. `loadGame` valida só a estrutura mínima do JSON, não o save.

### P2 — mecânica, UX, docs, import

3. **Dossiê “cruzar atributos” é trivial nos dados.** `name`, `specialty` e `vehicle` são únicos por suspeito. Um único campo preenchido já produz 1 match e emite mandado (`FN-017`). O texto da UI pede cruzamento; o banco não exige. Isso também distancia o recorte da redução progressiva do PRD.

4. **Reiniciar não é “toda a investigação”.** O `confirm` de `CB-030` diz isso, mas só apaga o save da **fase** (`saveKey()`). Cursor da campanha e estrelas permanecem. Derrota (`FN-020` ramo else) também recomeça o mesmo capítulo.

5. **Vitória usa `innerHTML` com `a.result` + `ending.win_text`.** Caso importado malicioso → XSS. Import é feature de primeira classe (`CB-031`).

6. **Capítulos lieutenant reutilizam ações/provas de Cifra.** Byte / Null / Vértice ainda coletam `E01`–`E08` nas cidades da rota (além de `E11`–`E16`). O jogador lê pistas do chefão enquanto caça o lieutenant.

7. **Documentação interna atrasada em relação ao motor:**
   - `docs/architecture/random-clue-scenarios.md` ainda diz que o motor “não encadeia” a campanha — falso após `TITO-CAMPAIGN-ENGINE-001`.
   - `docs/architecture/campaign-contract.md` diz que `game.json` atual é capítulo implícito — o arquivo **tem** `campaign`.
   - `docs/RELATORIO-MAPEAMENTO-EXTENSIBILIDADE.md` aponta `/desenvolvimento/Tito`, 61 funções e SHA velho.
   - `mechanics-and-functions.md` SHA `56f49a3d…` ≠ fonte atual `ba9b8298…`.

### P3 — morto / drift / polish

8. Menu `Jogo / Opções / Casos` são `<span>`, sem handler.
9. `div.map-grid` vazio no HTML do mapa.
10. 22 webp de capitais fora de `CITY_ART` (biblioteca de `TITO-BRAZIL-CAPITALS-ART-001`, não ligada ao motor).
11. `scenarios` da raiz duplicam `campaign.chapters.cifra.scenarios` — risco de drift.
12. Cache-bust: HTML `app.js?v=retro-ui-003` versus fetch `game.json?v=campaign-001`.
13. Fontes Google + Three.js CDN: o jogo degrada se a rede falhar; a casca retro muda.

### O que não é bug

- Motor compactado em ~24 linhas: estilo, não erro.
- Revelação progressiva sem totais `n/N`: INV-3, intencional.
- Recarregar a página não troca cenário/capítulo: INV-6.
- Prisão só em Porto Alegre: contrato atual do recorte.
- Three.js opcional: `catch` vazio aceitável como ambientação.
- Linters de mapa e de rotas: passam.

---

## 6. Fora deste dossiê

- Implementar o MVP do PRD (27 estados, minijogos, CS de restrições, camadas).
- Reescrever `app.js`.
- Abrir `issue.report` / hotfix ESAA.
- Tratar o PRD como autorização para furar o contrato de 5 cidades.

Passos naturais, se pedidos: (a) hotfix P1 do recorte; (b) WBS/ESAA a partir do PRD; (c) o que promover do slice para o produto (JSON data-driven, invariantes de tempo/grafo/mandado, artes das 27 capitais).
