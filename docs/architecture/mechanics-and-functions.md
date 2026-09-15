# Mecânicas e funções — Arquivo Zero

Inventário do motor atual em `dist/app.js` (67 unidades: `FN-001`–`FN-035` e
`CB-001`–`CB-032`). O caso vive em `dist/game.json`; o JavaScript só executa o
loop. Mapa canônico: [`function-map.md`](function-map.md) e
[`function-map.json`](function-map.json). Contrato de fases:
[`campaign-contract.md`](campaign-contract.md).

Linha de base do motor: SHA-256
`56f49a3db625654655c175fab6a10bc790b564ae1fe0daf5be4e8ac037f7dc38`
(`TITO-CAMPAIGN-ENGINE-001`).

## Loop do jogador

```text
carregar JSON
  → se houver campaign: sortear 2 lieutenants + Cifra
  → sortear cenário da fase (rota de pistas)
  → viajar no grafo (gasta horas)
  → investigar locais (gasta horas, ganha provas)
  → montar dossiê → mandado só se 1 suspeito
  → abordar na cidade da prisão (hoje: Porto Alegre)
      ├ mandado errado → derrota da fase
      ├ provas insuficientes → derrota da fase
      ├ prazo zerado → derrota da fase
      └ prisão válida → estrela → próximo capítulo (ou nova campanha)
```

---

## 1. Campanha (fases)

Uma run tem 3 capítulos: 2 lieutenants distintos do pool `{byte, null, vertice}`
e, por último, o chefão `cifra`. Cada capítulo é uma investigação nova (horas,
provas, mandado e notas zeram). Estrelas e o cursor da campanha persistem.

| Peça | Comportamento | Funções |
| --- | --- | --- |
| Detectar campanha | `game.campaign.chapters` presente | `FN-030 campaignOn` |
| Sortear run | 2 IDs do pool, sem repetir, depois `boss` | `FN-033 startCampaign` → `FN-032 writeCampaign` |
| Restaurar cursor | lê `arquivo-zero-campaign-v1-<id>` ou inicia | `FN-034 readCampaign` |
| Ativar fase | sobrepõe `culprit`, `start`, `briefing`, `total_hours`, `arrest_requirements`, `scenarios` | `FN-035 applyChapter` |
| Avançar | só se `state.rewarded` (prisão legal) | `FN-020 newCase` |
| Próximo capítulo | `index++`, `applyChapter`, `fresh()` | `FN-020` → `FN-032` → `FN-035` → `FN-003` |
| Nova campanha | após o chefão, sorteia outro par | `FN-020` → `FN-033` |
| JSON sem campaign | `newCase` só troca o cenário do mesmo caso | ramo `else` de `FN-020` |

**Dados:** `campaign.id`, `lieutenant_pool`, `lieutenant_chapters` (2), `boss`,
`chapters.{byte,null,vertice,cifra}`.

**Prazos por fase:** lieutenants 56 h; Cifra 72 h. Não há orçamento da campanha
inteira.

---

## 2. Cenário (variante de rota)

Dentro de uma fase, outra cadeia de cidades e textos para a **mesma** solução.
Recarregar a página não troca o cenário.

| Peça | Comportamento | Funções |
| --- | --- | --- |
| Sorteio | exclui o cenário anterior se houver alternativa | `FN-027 pickScenario` |
| Estado inicial | grava `state.scenario` | `FN-003 fresh` |
| Resolução | objeto da variante ativa | `FN-028 scenario` |
| Ação efetiva | `Object.assign(ação-base, override)` | `FN-029 actionData` |
| Texto de prova | merge com `evidence_overrides` | `FN-006 ev` |
| Navegação da variante | `scenario.navigation \|\| game.navigation` | `FN-009 map` |
| Código na UI | `AZ-2026-041 · byte · B-23` | `FN-007 render` |

Cifra tem 3 eixos (`N-17`, `A-23`, `C-31`). Cada lieutenant tem 2. Rota mínima:
3 cidades, sem repetir; teto hoje: 5 (o mundo só tem cinco).

---

## 3. Tempo

Orçamento da **fase**. Viagem e investigação debitam horas. Chegar a 0 sem ser
prisão válida encerra a fase.

| Peça | Comportamento | Funções |
| --- | --- | --- |
| Saldo inicial | `state.hours = metadata.total_hours` | `FN-003` |
| Débito | recusa se o saldo ficaria negativo; prisão pode zerar (`allowZero`) | `FN-015 spend` |
| Relógio | texto `Nh`, barra proporcional, `.danger` se ≤ 16 h | `FN-008 clock` |
| Preview da viagem | “consumirá X; restarão Y” | `FN-013 openTravel` |
| Derrota por prazo | fecha diálogos e mostra `ending.lose_*` | `FN-015` → `FN-023` → `FN-021` |

Chamadores de `spend`: viagem (`CB-014`) e ação (`FN-014`).

---

## 4. Mapa, viagem e revelação progressiva

O jogador só vê a cidade atual, as já visitadas e os destinos **diretamente**
ligados. Totais ocultos (“1/5”) não aparecem.

| Peça | Comportamento | Funções |
| --- | --- | --- |
| Cidades visíveis | atual ∪ visitadas ∪ `navigation[atual]` | `FN-009` + `CB-004` |
| Clique | só destinos habilitados e fase não encerrada | `CB-005` → `CB-006` → `FN-013` |
| Confirmar rota | gasta horas, atualiza `location` / `route` / `visited` | `CB-014` → `FN-015` → `FN-004` → `FN-007` |
| Linha SVG | polyline das cidades da rota | `CB-007` → `FN-005 loc` → `CB-008` |
| Histórico | “N cidades” sem denominador | `FN-012` + `CB-013` |
| Resolver cidade | `locations.find` | `FN-005` + `CB-002` |

Custos: matriz `travel[origem][destino]`. Prisão hoje só em Porto Alegre
(`poa_arrest`).

---

## 5. Cidade atual e investigação

Cada cidade tem contexto educativo (`city_info`) e 2–3 ações. Ação já feita
fica `done`. Ação com `requires_warrant` trava até o mandado.

| Peça | Comportamento | Funções |
| --- | --- | --- |
| Painel do local | nome, tipo, descrição, coordenadas | `FN-010 place` |
| Contexto cultural | resumo + fatos; fatos passam por `escape` | `FN-010` → `FN-022` |
| Botões de ação | label/custo da variante; prisão diz “VERIFICAR IDENTIDADE” | `CB-009` → `FN-029` |
| Clique | | `CB-010` → `CB-011` → `FN-014 act` |
| Executar | gasta horas, marca ação, pode catalogar prova | `FN-014` → `FN-015`, `CB-015` |
| Sem prova | diálogo “pista inconclusiva” | `FN-021` |
| Com prova | cataloga ID e mostra título/texto efetivos | `FN-006` → `FN-021` |

Ações de São Paulo: câmeras, estação, cafeteria. Recife: porto, terminal,
hotel. Brasília: hangar, escuta, arquivo. Manaus: embarcações, conexão. Porto
Alegre: manifesto, abordar, centro.

---

## 6. Evidências

O quadro só lista o que já foi achado. Não mostra o inventário secreto nem
“3/8”.

| Peça | Comportamento | Funções |
| --- | --- | --- |
| Lista | filtra `game.evidence` por `state.evidence` | `FN-011` |
| Cartão | id, tag, título, texto (com override do cenário) | `CB-012` + `FN-006` |
| Vazio | “ARQUIVO LACRADO” | `FN-011` |
| Contador | “N catalogada(s)” | `FN-011` |

Banco raiz: `E01`–`E08` (Cifra) e `E11`–`E16` (lieutenants). O capítulo escolhe
quais são obrigatórias.

---

## 7. Dossiê e mandado

Cruzar atributos (codinome, especialidade, meio de fuga) até restar
**exatamente uma** pessoa. Zero atributos ou 0/N>1 correspondências não emitem
mandado.

| Peça | Comportamento | Funções |
| --- | --- | --- |
| Abrir | | `CB-025` |
| Formular campos | options do JSON; não revela quantos suspeitos existem | `FN-016` + `CB-017` + `CB-018` |
| Submeter | | `FN-017` |
| Descartar vazios | | `CB-019` |
| Filtrar suspeitos | todos os atributos escolhidos têm de bater | `CB-020` + `CB-021` |
| Nomes se N>1 | | `CB-022` |
| Emitir | `warrant=true`, `warrantSuspect=id` | `FN-017` → `FN-004` → `FN-007` → `FN-021` |
| Botão de abordagem | “EXIGE MANDADO” até emitir | `FN-010` / `CB-009` |

Um mandado por fase; o formulário desabilita depois.

---

## 8. Prisão e desfechos

Abordar (`arrest: true`) só faz sentido com mandado. Sem mandado, a ação sequer
clica. Com mandado, `FN-014` fecha a fase e testa três condições nessa ordem:

1. `warrantSuspect === culprit`? senão → “mandado não correspondente”
   (`ending.wrong_warrant_*`)
2. `evidence.length >= minimum_evidence` e todas as `required_evidence`
   (`CB-016`)? senão → “conjunto probatório insuficiente”
3. senão → vitória: `FN-019 awardStar` + `ending.win_*`

| Desfecho | Botão (`FN-021`) | Depois (`FN-020`) |
| --- | --- | --- |
| Vitória, há próximo capítulo | PRÓXIMO CAPÍTULO | avança fase |
| Vitória no chefão | NOVA CAMPANHA | sorteia nova run |
| Derrota / prazo | INICIAR NOVO CASO | recomeça **a mesma** fase, outro cenário se possível |
| Mensagem comum (prova, mandado, etc.) | CONTINUAR | `CB-023` fecha o diálogo |

`closeAll` (`FN-023` + `CB-024`) fecha todo `<dialog open>` no timeout.

---

## 9. Carreira (estrelas)

| Peça | Comportamento | Funções |
| --- | --- | --- |
| Exibir | lê `arquivo-zero-career-v1` | `FN-018 career` |
| Conceder | +1 uma vez por fase (`state.rewarded`) | `FN-019 awardStar` |
| Sobrevive | reset de fase, novo capítulo, novo JSON importado | não apaga `CAREER` |

---

## 10. Persistência e reset

| Chave | Conteúdo | Funções |
| --- | --- | --- |
| `arquivo-zero-pursuit-v2-<caso>-<capítulo>` | save da fase: horas, cidade, rota, provas, ações, notas, mandado, scenario | `FN-031 saveKey`, `FN-004 save`, `FN-002` |
| `arquivo-zero-campaign-v1-<campaign.id>` | `{ run, index }` | `FN-032` / `FN-034` |
| `arquivo-zero-career-v1` | inteiro de estrelas | `FN-018` / `FN-019` |

| Ação do jogador | Efeito | Funções |
| --- | --- | --- |
| Recarregar | restaura capítulo, cenário e save | `FN-002` → `FN-034` → `FN-035` |
| REINICIAR | confirma, apaga save da fase, novo cenário, **mesmo** lieutenant | `CB-030` |
| IMPORTAR CASO | lê arquivo, `loadGame(objeto)` | `CB-031` → `FN-002` → `CB-001` se URL |
| Caderno | `oninput` copia texto, conta caracteres, salva | `CB-029` → `FN-024` → `FN-004` |

JSON legado (sem `campaign`) usa chave `STORE-<caso>` apenas.

---

## 11. Interface e diálogos

| Superfície | Papel | Funções |
| --- | --- | --- |
| Seletor DOM | `$` | `FN-001` |
| Render geral | título, briefing, código, caderno, todos os painéis | `FN-007` |
| Diálogo genérico | kicker/título/corpo; HTML só na vitória | `FN-021` + `FN-022 escape` |
| Fechar `data-close` | | `CB-027` → `CB-028` |
| Caderno | textarea + contagem | `CB-026`, `CB-029`, `FN-024` |
| Ambientação 3D | globo wireframe; falha silenciosa se o CDN cair | `FN-025 scene` → `FN-026` loop → `CB-032` resize |

O Three.js **não** entra na lógica da caçada.

---

## 12. Contrato de dados (`game.json`)

O motor é um intérprete. Quase toda regra nova é JSON.

| Bloco | Mecânica que alimenta |
| --- | --- |
| `metadata` | título, briefing, código, start, `total_hours` da fase (se o capítulo não overlay) |
| `locations` + `city_info` | mapa, contexto, ações |
| `travel` | custo em horas |
| `navigation` / `scenarios[].navigation` | grafo visível |
| `suspects` + `dossier.fields` | mandado |
| `culprit` | quem precisa estar no mandado |
| `evidence` | banco de provas |
| `arrest_requirements` | mínimo + IDs obrigatórios |
| `scenarios[]` | rotas, overrides de ação/texto |
| `campaign` | fases |
| `ending` | textos dos quatro desfechos |

---

## 13. Invariantes (não podem quebrar)

| ID | Regra | Funções-chave |
| --- | --- | --- |
| INV-1 | horas da fase, 0 = derrota (exceto prisão válida) | `FN-015`, `FN-014`, `CB-014` |
| INV-2 | só viaja pelo grafo da variante | `FN-009`, `FN-013`, `CB-014` |
| INV-3 | não vazar cidades/provas/totais ocultos | `FN-009`, `FN-011`, `FN-012`, `FN-016` |
| INV-4 | mandado só com exatamente 1 suspeito | `FN-017` |
| INV-5 | prisão = mandado certo + mínimo + essenciais | `FN-014`, `CB-016` |
| INV-6 | cenário e capítulo estáveis no reload | `FN-002`, `FN-003`, `FN-027`, `FN-034` |

---

## 14. Índice de unidades (67)

**Bootstrap e campanha:** `FN-001` `$` · `FN-002` `loadGame` · `FN-030`–`FN-035`
campanha · `CB-001` parse JSON · `CB-031` import

**Estado da fase:** `FN-003` `fresh` · `FN-004` `save` · `FN-027` `pickScenario`
· `FN-028` `scenario` · `FN-029` `actionData` · `FN-005` `loc` · `FN-006` `ev` ·
`CB-002` `CB-003`

**UI contínua:** `FN-007` `render` · `FN-008` `clock` · `FN-009` `map`
(`CB-004`–`CB-008`) · `FN-010` `place` (`CB-009`–`CB-011`) · `FN-011` `evidence`
(`CB-012`) · `FN-012` `route` (`CB-013`) · `FN-016` `dossier` (`CB-017`
`CB-018`) · `FN-018` `career` · `FN-024` `chars`

**Ações do jogador:** `FN-013` + `CB-014` viajar · `FN-014` + `CB-015` `CB-016`
investigar/prender · `FN-015` tempo · `FN-017` + `CB-019`–`CB-022` mandado ·
`FN-019` estrela · `FN-020` avançar/reiniciar · `FN-021` + `CB-023` mensagens ·
`FN-022` escape · `FN-023` + `CB-024` fechar diálogos · `CB-025`–`CB-030` chrome
da UI

**Cosmético:** `FN-025` `FN-026` `CB-032`

---

## O que o jogo ainda não faz

- Prisão em cidade que não seja Porto Alegre (só `poa_arrest` tem `arrest: true`)
- Orçamento de horas da campanha inteira
- Minigame Python no chefão
- Cidades além das cinco atuais
- Backend; tudo é HTML/JS + `localStorage`
