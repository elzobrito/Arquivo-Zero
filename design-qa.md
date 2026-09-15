# Design QA — TITO-RETRO-UI-001

## Alvos e evidências

- Verdade visual primária: `/tmp/codex-clipboard-52a4ac92-9f5a-4c15-8103-912912829677.png` (1920×1080). As outras três capturas fornecidas pelo usuário foram usadas para os estados de mapa, seleção de local e depoimento.
- Implementação desktop: `docs/ux/screenshots/retro-ui-desktop.png` (1920×1080).
- Implementação móvel: `docs/ux/screenshots/retro-ui-mobile.png` (375×1475, captura da página inteira).
- Comparação conjunta: `/tmp/arquivo-zero-design-qa-combined-final.png` (3840×1080).
- Comparação focada do painel informativo: `/tmp/arquivo-zero-design-qa-focused.png` (1840×500).
- Viewport desktop: 1920×1080 CSS px, `deviceScaleFactor=1`; fonte e implementação têm a mesma densidade e não exigiram reamostragem.
- Viewport móvel solicitado: 390×844 CSS px; área útil registrada pelo navegador em 375 px por causa da barra de rolagem. A captura full-page mede 375×1475 em densidade 1.
- Estado comparado: cidade visitada com ilustração, arquivo cultural, contexto do caso, ações locais e quatro comandos persistentes.

## Findings

Nenhum P0, P1 ou P2 permanece.

- [P3] A implementação usa uma escala tipográfica mais compacta no painel direito.
  Local: `.intel-frame`, `.briefing` e `.city-briefing`.
  Evidência: a referência exibe um único bloco cultural em letras grandes; o Arquivo Zero precisa acomodar briefing, contexto da pista, quatro fatos da cidade e três ações no mesmo quadro.
  Impacto: a composição é mais densa, mas continua legível e preserva a hierarquia retrô.
  Classificação: diferença intencional para manter todo o conteúdo funcional acima da faixa de comandos.

## Superfícies de fidelidade

- Tipografia: Pixelify Sans reproduz a cadência bitmap; títulos, metadados, corpo e comandos têm pesos e escalas distintos. Não há truncamento ou colisão em desktop ou móvel.
- Espaçamento e ritmo: grade 48/52, cabeçalhos simétricos, molduras duplas, painel preto e faixa inferior seguem a composição da referência. Em 1920 px o console ocupa 1760 px e mantém margens laterais equilibradas.
- Cores e tokens: papel quente, preto, vermelho de navegação, azul cartográfico, verde de seleção e amarelo de tempo correspondem ao vocabulário visual observado. Não foram usados gradientes.
- Imagens: cinco ilustrações urbanas e o mapa do Brasil são rasters WebP originais, nítidos e coerentes com pixel art. Não há arte substituída por CSS, emoji ou SVG artesanal; o SVG já existente continua restrito às linhas funcionais de rota.
- Copy e conteúdo: a interface está localizada em português, mantém as informações culturais de cada cidade e revela somente cidades, pistas e atributos conhecidos pelo jogador.
- Ícones: Material Symbols fornece família consistente para pistas, viagem, notas, dossiê e ações; o estado do mandado preserva o ícone do botão.
- Acessibilidade: botões e diálogos têm nomes semânticos, a imagem muda o texto alternativo por cidade, foco é visível e `prefers-reduced-motion` remove transições.

## Comparação full-view e focada

- Full-view: a comparação conjunta confirma a mesma arquitetura visual — barra superior clara, duas colunas, arte urbana à esquerda, informação em painel preto à direita e quatro comandos inferiores.
- Região focada: o recorte do painel direito confirmou molduras, contraste, tipografia bitmap, hierarquia e alinhamento. A densidade adicional é deliberada e não gerou quebra de linhas, clipping ou perda de contraste.
- Estados adicionais: mapa, pistas vazias, uma pista revelada, confirmação de viagem, troca da imagem de cidade, dossiê e notas foram abertos na interface real.

## Histórico das iterações

1. Primeira comparação desktop: [P2] o console estava limitado a 1460 px e ficava estreito diante da referência de 1920×1080. Correção: largura máxima elevada para 1760 px. Evidência pós-fix: `retro-ui-desktop.png`, sem overflow e com `scrollHeight=1080`.
2. Primeira comparação móvel: [P2] a barra `sticky` sobrepunha o arquivo cultural durante a rolagem. Correção: a faixa passou a `position: static` abaixo do conteúdo em até 620 px. Evidência pós-fix: `retro-ui-mobile.png`, `scrollWidth=375`, sem sobreposição.
3. Segunda comparação conjunta: nenhum P0, P1 ou P2 foi encontrado; permaneceu somente a diferença P3 de densidade informacional.

## Interações e execução

- Viagem São Paulo → Brasília: confirmação exibiu custo e saldo; após confirmar, cidade, horas, contexto e imagem foram atualizados.
- Investigação em Brasília: a ação consumiu tempo, abriu E12 e desabilitou somente a ação concluída.
- Pistas: começou com zero e depois mostrou somente E12, confirmando divulgação progressiva.
- Mapa móvel: abriu em 375 px úteis, sem overflow horizontal.
- Dossiê e bloco de notas: ambos abriram com campos e estados acessíveis.
- Console do navegador: zero erros e zero avisos no fluxo testado.

## Implementation Checklist

- [x] Estrutura desktop inspirada nas capturas.
- [x] Arte urbana original para todas as cidades.
- [x] Mapa retrô em janela modal.
- [x] Pistas, notas e dossiê encapsulados em janelas próprias.
- [x] Responsividade sem conteúdo encoberto.
- [x] Fluxos essenciais e console verificados em navegador real.

## Follow-up Polish

- P3 opcional: explorar um modo “ampliação 8-bit” com menos conteúdo simultâneo e corpo maior, sem retirar as informações culturais.

final result: passed
