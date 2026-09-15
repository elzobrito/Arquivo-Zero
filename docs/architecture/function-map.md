# Mapa de funções — Arquivo Zero

Este documento é a visão humana do mapa canônico
[`function-map.json`](function-map.json). Ele registra a linha de base do motor em
`dist/app.js`, criada em `TITO-FUNCTION-MAP-001`, estendida por
`TITO-RANDOM-CLUES-001`, reconciliada por `TITO-FUNCTION-MAP-002` e atualizada
por `TITO-CAMPAIGN-ENGINE-001` e redesenhada por `TITO-RETRO-UI-001`.

- SHA-256 mapeado: `ba9b829894c99d51dcf68bb2484f7315c14a4477e1873ea00ba16854d75a390f`
- Unidades executáveis: **69**
- Ocorrências de `function`: **34**
- Arrow functions: **35**
- Convenção: `FN-*` identifica funções do motor ou auxiliares; `CB-*` identifica
  callbacks, projeções e manipuladores inline.

Os IDs são estáveis. Uma função removida não libera seu ID para reutilização.
Entradas, saídas, seletores, estado, dados, persistência, eventos, efeitos e
dependências detalhados estão no JSON canônico.

## Funções do motor e auxiliares

| ID | Função | Linha | Responsabilidade principal |
| --- | --- | ---: | --- |
| `FN-001` | `$` | 1 | Resolver um seletor DOM. |
| `FN-002` | `loadGame` | 5 | Carregar o caso e migrar estados antigos para uma variante. |
| `FN-003` | `fresh` | 6 | Criar o estado inicial com uma variante não repetida. |
| `FN-004` | `save` | 7 | Persistir a investigação atual. |
| `FN-005` | `loc` | 7 | Resolver uma cidade por ID. |
| `FN-006` | `ev` | 7 | Resolver evidência e aplicar o texto da variante. |
| `FN-007` | `render` | 9 | Sincronizar a interface e a arte contextual da cidade. |
| `FN-008` | `clock` | 10 | Renderizar prazo e alerta no cabeçalho retro. |
| `FN-009` | `map` | 11 | Renderizar somente cidades conhecidas, disponibilidade e rota SVG. |
| `FN-010` | `place` | 12 | Renderizar local, contexto da cidade e ações investigativas. |
| `FN-011` | `evidence` | 12 | Renderizar somente evidências já encontradas ou o estado vazio. |
| `FN-012` | `route` | 13 | Renderizar o histórico sem antecipar o total de cidades. |
| `FN-013` | `openTravel` | 14 | Abrir a confirmação de viagem. |
| `FN-014` | `act` | 16 | Executar ação, prova e resultado da abordagem. |
| `FN-015` | `spend` | 17 | Consumir horas ou encerrar o prazo. |
| `FN-016` | `dossier` | 18 | Renderizar o formulário sem revelar totais internos do caso. |
| `FN-017` | `submitDossier` | 19 | Filtrar suspeitos e emitir mandado único. |
| `FN-018` | `career` | 20 | Renderizar estrelas acumuladas. |
| `FN-019` | `awardStar` | 20 | Conceder uma estrela sem duplicidade. |
| `FN-020` | `newCase` | 20 | Reiniciar com outra variante, preservando carreira. |
| `FN-021` | `show` | 21 | Exibir mensagem ou desfecho. |
| `FN-022` | `escape` | 21 | Escapar texto pelo DOM. |
| `FN-023` | `closeAll` | 21 | Fechar todos os diálogos abertos. |
| `FN-024` | `chars` | 22 | Atualizar a contagem do caderno. |
| `FN-025` | `scene` | 23 | Inicializar a ambientação Three.js. |
| `FN-026` | `scene.animate` | 23 | Renderizar e reagendar o loop WebGL. |
| `FN-027` | `pickScenario` | 6 | Sortear uma variante sem repetição imediata. |
| `FN-028` | `scenario` | 6 | Resolver a variante persistida. |
| `FN-029` | `actionData` | 7 | Aplicar substituições da variante a uma ação-base. |
| `FN-030` | `campaignOn` | 5 | Detectar se o JSON declara campanha. |
| `FN-031` | `saveKey` | 5 | Chave de save da fase corrente. |
| `FN-032` | `writeCampaign` | 5 | Persistir o cursor da campanha. |
| `FN-033` | `startCampaign` | 5 | Sortear lieutenants e anexar o chefão. |
| `FN-034` | `readCampaign` | 5 | Restaurar ou iniciar o cursor. |
| `FN-035` | `applyChapter` | 5 | Sobrepor o capítulo ativo em `game`. |

## Callbacks e manipuladores

| ID | Callback | Linha | Responsabilidade principal |
| --- | --- | ---: | --- |
| `CB-001` | `loadGame.parseResponse` | 5 | Decodificar a resposta HTTP como JSON. |
| `CB-002` | `loc.match` | 7 | Comparar cidade por ID. |
| `CB-003` | `ev.match` | 7 | Comparar evidência por ID. |
| `CB-004` | `map.renderCity` | 10 | Projetar uma cidade conhecida em botão HTML acessível. |
| `CB-005` | `map.bindCity` | 10 | Vincular clicks das cidades. |
| `CB-006` | `map.onCityClick` | 10 | Encaminhar destino para confirmação. |
| `CB-007` | `map.resolveRouteLocation` | 10 | Resolver IDs da rota em cidades. |
| `CB-008` | `map.projectRoutePoint` | 10 | Projetar coordenadas para SVG. |
| `CB-009` | `place.renderAction` | 11 | Aplicar a variante e projetar ação investigativa. |
| `CB-010` | `place.bindAction` | 11 | Vincular clicks das ações. |
| `CB-011` | `place.onActionClick` | 11 | Encaminhar ação para o motor. |
| `CB-012` | `evidence.renderItem` | 12 | Projetar cartão de evidência já encontrada. |
| `CB-013` | `route.renderItem` | 13 | Projetar etapa da rota. |
| `CB-014` | `travel.confirm` | 15 | Efetivar a viagem confirmada. |
| `CB-015` | `act.findAction` | 16 | Localizar ação por ID. |
| `CB-016` | `act.hasRequiredEvidence` | 16 | Verificar evidência essencial. |
| `CB-017` | `dossier.renderField` | 18 | Projetar campo do dossiê. |
| `CB-018` | `dossier.renderOption` | 18 | Projetar opção do dossiê. |
| `CB-019` | `submitDossier.keepChosen` | 19 | Descartar atributos desconhecidos. |
| `CB-020` | `submitDossier.matchSuspect` | 19 | Filtrar suspeitos compatíveis. |
| `CB-021` | `submitDossier.matchAttribute` | 19 | Comparar cada atributo. |
| `CB-022` | `submitDossier.suspectName` | 19 | Extrair nomes dos resultados. |
| `CB-023` | `show.continue` | 21 | Fechar mensagem não final. |
| `CB-024` | `closeAll.closeDialog` | 21 | Fechar cada diálogo aberto. |
| `CB-025` | `events.openDossier` | 22 | Abrir o dossiê. |
| `CB-026` | `events.openNotes` | 22 | Abrir o caderno. |
| `CB-027` | `events.bindClose` | 22 | Vincular botões `data-close`. |
| `CB-028` | `events.closeTarget` | 22 | Fechar o diálogo indicado. |
| `CB-029` | `events.notebookInput` | 22 | Persistir as anotações. |
| `CB-030` | `events.resetCase` | 22 | Reiniciar com uma variante diferente após confirmação. |
| `CB-031` | `events.importJson` | 22 | Importar um caso JSON local. |
| `CB-032` | `scene.resize` | 23 | Redimensionar câmera e renderer. |
| `CB-033` | `events.openMap` | 23 | Abrir a janela retro de mapa e destinos. |
| `CB-034` | `events.openEvidence` | 23 | Abrir a janela retro de pistas catalogadas. |

## Fluxos principais

```text
inicialização/importação
  FN-002 loadGame → restaura state ou FN-003 fresh
    → FN-027 pickScenario/migração → FN-004 save? → FN-007 render

nova partida/reset
  FN-020 ou CB-030 → FN-003 fresh(anterior)
    → FN-027 pickScenario → FN-004 save → FN-007 render

renderização
  FN-007 render
    ├─ FN-024 chars
    ├─ FN-018 career
    ├─ FN-008 clock
    ├─ FN-009 map → FN-028 scenario → navegação da variante
    ├─ FN-010 place → CB-009 → FN-029 actionData
    ├─ FN-011 evidence → FN-006 ev → texto da variante
    ├─ FN-012 route
    └─ FN-016 dossier

viagem
  CB-006 → FN-013 openTravel → CB-014 travel.confirm
    → FN-015 spend → FN-004 save → FN-007 render

investigação e abordagem
  CB-011 → FN-014 act → FN-015 spend
    ├─ coleta de evidência → FN-004 save → FN-007 render → FN-021 show
    └─ abordagem → CB-016 requisitos → FN-019 awardStar? → FN-021 show

mandado
  FN-016 dossier → FN-017 submitDossier
    → CB-019/020/021 filtros → FN-004 save → FN-007 render → FN-021 show
```

## Matriz de impacto

| Área | Funções diretamente relacionadas |
| --- | --- |
| Interface | `FN-001`, `FN-007`–`FN-013`, `FN-016`–`FN-018`, `FN-020`–`FN-025`, `FN-029`, `CB-004`–`CB-014`, `CB-017`, `CB-018`, `CB-022`–`CB-034` |
| Estado da partida | `FN-002`–`FN-004`, `FN-007`, `FN-014`, `FN-015`, `FN-017`, `FN-019`, `FN-020`, `FN-027`–`FN-029`, `CB-014`, `CB-029`, `CB-030`, `CB-031` |
| Persistência | `FN-002`, `FN-004`, `FN-014`, `FN-015`, `FN-017`–`FN-020`, `FN-027`, `FN-031`–`FN-034`, `CB-014`, `CB-029`, `CB-030` |
| `game.json` e dados | `FN-002`, `FN-003`, `FN-005`, `FN-006`, `FN-008`–`FN-019`, `FN-027`–`FN-029`, `CB-001`–`CB-004`, `CB-007`–`CB-022`, `CB-031` |
| Navegação | `FN-003`, `FN-005`, `FN-009`, `FN-010`, `FN-012`–`FN-015`, `FN-027`, `FN-028`, `CB-002`, `CB-004`–`CB-011`, `CB-013`, `CB-014`, `CB-033` |
| Evidências | `FN-003`, `FN-006`, `FN-010`, `FN-011`, `FN-014`, `FN-016`, `FN-029`, `CB-003`, `CB-009`–`CB-012`, `CB-015`, `CB-016`, `CB-034` |
| Dossiê e mandado | `FN-003`, `FN-010`, `FN-014`, `FN-016`, `FN-017`, `CB-009`, `CB-016`–`CB-022`, `CB-025` |
| Tempo | `FN-003`, `FN-008`, `FN-009`, `FN-013`–`FN-015`, `CB-004`, `CB-014` |
| Desfechos e carreira | `FN-014`, `FN-015`, `FN-019`–`FN-021`, `CB-016`, `CB-023` |
| Three.js | `FN-025`, `FN-026`, `CB-032` |

## Regra para alterações futuras

Toda tarefa que altere o motor ou seus contratos deve registrar no ESAA:

1. IDs de funções diretamente modificadas;
2. IDs impactados indiretamente por chamadas, estado, DOM, JSON ou persistência;
3. campos do mapa atualizados ou a justificativa verificável para não atualizá-los;
4. resultado de `node scripts/verify-function-map.mjs`;
5. testes funcionais proporcionais às áreas indicadas na matriz.

Funções novas recebem novos IDs. Funções removidas são retiradas dos mapas, mas o
ID da remoção permanece citado na tarefa ESAA responsável e nunca é reutilizado.

## Validação

Execute na raiz do projeto:

```bash
node scripts/verify-function-map.mjs
node --check dist/app.js
jq empty dist/game.json
```

O verificador confere IDs únicos, campos obrigatórios, referências entre IDs,
âncoras e linhas atuais, presença de cada ID nesta visão humana, SHA-256 da
fonte, objeto `inventory` e paridade entre as 34 ocorrências de `function`, as
35 arrow functions e as 69 entradas do mapa.
