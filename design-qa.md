# Design QA — TITO-CITY-INTEL-001

result: passed

## Alvo de design

As cinco telas fornecidas foram tratadas como referência funcional, não como
pedido de cópia visual. O padrão selecionado foi o da tela de cidade: nome e
posição atual, contexto local legível, ações disponíveis e navegação limitada ao
que o jogador conhece. A identidade escura e tecnológica do Arquivo Zero foi
preservada deliberadamente; pixel art, molduras brancas e ilustrações do jogo de
referência não foram reproduzidas.

## Comparação obrigatória

- Referência inspecionada: tela de Bamako fornecida pelo usuário, com informação
  da cidade como conteúdo narrativo principal.
- Implementação inspecionada: `docs/ux/screenshots/06-city-intel-desktop.png` e
  `docs/ux/screenshots/07-city-intel-mobile.png`.
- Comparação conjunta realizada em `/tmp/tito-design-comparison.png`, com a
  referência e a implementação no mesmo quadro.
- Tipografia: Manrope mantém leitura editorial; DM Mono conserva o vocabulário
  operacional. Resumo e fatos locais receberam escala maior que metadados.
- Layout: contexto do caso e contexto cultural estão separados por hierarquia,
  cor e borda; ações continuam agrupadas no mesmo painel da cidade.
- Cores e superfícies: ciano identifica contexto e navegação; verde-ácido fica
  reservado para posição atual e ações primárias; estados vazios usam borda
  tracejada e texto explícito.
- Imagens: não há substituto falso por CSS ou SVG. A implementação adotou apenas
  a estrutura informacional da referência; uma ilustração de marco urbano não
  fazia parte do escopo escolhido.
- Copy: cada uma das cinco cidades possui resumo e quatro fatos próprios; pistas
  investigativas permanecem separadas desses fatos.

## Estados, comportamento e acessibilidade

- Estado inicial: São Paulo, Recife, Brasília e Manaus aparecem; Porto Alegre não
  é renderizada porque ainda não integra o conhecimento acessível.
- Evidências: zero provas mostra um estado vazio; após `Revisar câmeras`, somente
  E01 é renderizada (`cards=1`, `locked=0`).
- Viagem: a confirmação São Paulo → Recife atualiza o nome, resumo cultural,
  horas e contagem de cidades sem revelar o total do caso.
- Dossiê: apresenta atributos consultáveis e provas reunidas sem totais internos.
- Mobile 375×812: `innerWidth=375`, `documentElement.scrollWidth=360` e
  `body.scrollWidth=360`; não há overflow horizontal.
- Teclado: o segundo `Tab` alcança `#json-input`; foco visível foi confirmado.
- Alvos de cidade têm caixa mínima de 44×44 px; diálogos possuem nomes acessíveis;
  movimento decorativo é removido com `prefers-reduced-motion`.

## Achados bloqueantes

Nenhum P0, P1 ou P2 permanece após os ajustes desta rodada.

