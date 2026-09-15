# Design QA — TITO-MAP-RECIFE-MARKER-001

## Alvos e evidências

- Fonte visual: `/tmp/codex-clipboard-1ad5c30c-bb44-492c-a428-2b9df5521ac2.png` (1474×921 px).
- Implementação final: `docs/ux/screenshots/map-recife-marker-aligned.png` (1474×921 px).
- Comparação conjunta normalizada: `/tmp/recife-marker-comparison.png` (1506×477 px), com fonte e implementação lado a lado na mesma entrada visual.
- Evidência móvel: `/tmp/map-recife-marker-mobile.png` (390×844 px).
- Viewport desktop: 1474×921 CSS px, `deviceScaleFactor=1`; fonte e implementação possuem a mesma densidade e dimensão, sem normalização de densidade.
- Viewport móvel: 390×844 CSS px, `deviceScaleFactor=1`.
- Estado: mapa aberto; teste funcional adicional confirmou uma rota São Paulo → Recife.

## Findings

Nenhum P0, P1 ou P2 permanece.

- [P3] A captura final usa uma partida limpa com menos cidades reveladas que a fonte.
  Local: painel “Rota da caçada”.
  Evidência: a fonte mostra três cidades; a captura final mostra uma cidade antes do teste de viagem.
  Impacto: não afeta a comparação focada do marcador, rótulo e contorno de Recife.
  Classificação: diferença de estado dinâmica e aceitável.

## Superfícies de fidelidade

- Tipografia: família pixel, peso, escala, contorno e hierarquia foram preservados; “Recife” e o custo mantêm a âncora cartográfica aprovada à esquerda/acima do ponto.
- Espaçamento e layout: `locations[].x` de Recife passou de 82 para 73; o quadrado de 15×15 px fica integralmente dentro da massa territorial e não colide com o rótulo.
- Cores e tokens: azul do oceano, papel do território, bordas, estados azul/amarelo/cinza e linha verde-amarela permanecem inalterados.
- Imagem: `brasil-map.webp` foi preservado sem recorte, substituição, deformação ou perda de nitidez.
- Copy e conteúdo: nomes, custos, legenda, rota e divulgação progressiva não mudaram.
- Acessibilidade e interação: o botão continua com nome acessível “Viajar para Recife, 8 horas”; o clique abriu “Rota para Recife”.

## Comparação full-view e focada

- Full-view: a estrutura do diálogo, legenda, mapa e painel lateral coincide com a fonte; a diferença dinâmica do número de cidades não interfere no alvo.
- Foco Recife: na fonte, o rótulo estava correto, mas o quadrado ficava no oceano. Na implementação final, a borda direita do quadrado toca o contorno por dentro e o rótulo permanece sobre o território.
- Rota: após confirmar a viagem de teste, o SVG reportou `570,427.8 730,266.6`; o ponto final `730` corresponde diretamente ao `x=73` usado pelo botão.
- Mobile: marcador e rótulo ficaram contidos no diálogo em 390×844, sem sobreposição ou corte.

## Histórico das iterações

1. Estado reportado: [P1] rótulo de Recife correto, mas marcador clicável e término da rota em `x=82`, fora da costa.
2. Primeira correção: `x=78` moveu o ponto 4% para dentro, porém a inspeção ampliada ainda mostrou o quadrado tangenciando o lado oceânico.
3. Ajuste intermediário: `x=76` com compensação absoluta do rótulo aproximou texto e marcador demais; resultado ainda bloqueado.
4. Correção final: `x=73` e restauração da âncora relativa `right:50px`; comparação conjunta mostra o quadrado inteiro dentro do território, texto separado e rota coincidente. Nenhum P0/P1/P2 permanece.

## Interações e execução

- VIAJAR abriu o mapa em origem limpa.
- O ponto de Recife foi clicado e abriu a autorização “Rota para Recife”.
- Uma viagem de teste produziu rota com término `730,266.6`, igual à projeção da coordenada do marcador.
- Divulgação progressiva permaneceu ativa.
- Console desktop e mobile: zero erros e zero avisos.

## Implementation Checklist

- [x] Mover coordenada funcional de Recife para dentro do contorno.
- [x] Manter rótulo relativo à esquerda/acima do marcador.
- [x] Confirmar que marcador e rota compartilham `locations[].x/y`.
- [x] Testar clique e diálogo de viagem.
- [x] Verificar desktop e 390×844.
- [x] Atualizar os mapas canônico e humano de funções.

## Follow-up Polish

- Nenhum refinamento adicional necessário para esta hotfix.

final result: passed
