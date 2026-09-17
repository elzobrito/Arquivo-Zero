# Quadro de evidências (AZ-EVIDENCE-005)

## Fluxo

`dist/game.json` → Evidence Service (`getDiscovered`) → Evidence Policy → View Model → Quadro (`#evidence-board-host`).

O `dist/app.js` continua atualizando `#evidence-list` (oculto) e `#evidence-count`. O módulo ESM relê o save em `localStorage` + `game.json` e redesenha lista/detalhe **sem** mutar estado, save ou policy.

## Princípios

- UI não é fonte de verdade.
- Só evidências **descobertas**; inadmissíveis e contradições permanecem visíveis.
- Fato e interpretação em seções distintas (`aria-label` próprios).
- `unknown` / ausência → “Não informado” / “Desconhecido” (sem promover a falso).
- Filtros/ordenação determinísticos e locais à sessão do diálogo.
- Identificar ≠ provar (disclaimer no detalhe).
- Teclado: listbox + setas ↑/↓.

## Arquivos

| Camada | Caminho |
|--------|---------|
| Application | `src/application/evidence/build-evidence-board.js` |
| UI (CJS) | `src/ui/evidence/*` |
| UI (ESM) | `dist/modules/ui/evidence/*` |
| Shell | `dist/index.html`, `dist/styles.css` |
| Testes | `tests/ui/evidence/*.test.mjs` |

## Fora de escopo

- Não altera `dist/game.json` nem `dist/app.js`.
- Não conclui autoria nem esconde inadmissíveis.
