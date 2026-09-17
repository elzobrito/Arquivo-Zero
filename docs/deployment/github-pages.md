# GitHub Pages — Arquivo Zero

Publicação do **vertical slice** jogável a partir de `dist/` neste repositório.

## URL

https://elzobrito.github.io/Arquivo-Zero/

## O que é publicado

Somente o conteúdo de `dist/`:

- `index.html`, `app.js`, `styles.css`, `game.json`
- `modules/**` (ESM)
- `assets/**`
- `.nojekyll` (impede o Jekyll de filtrar arquivos)

Não entram no artifact: `.roadmap/`, código-fonte fora de `dist/`, credenciais, testes.

## Ativação (uma vez)

1. Repo **Settings → Pages → Build and deployment → Source**: **GitHub Actions**.
2. Faça push em `main` (ou rode o workflow **Deploy Pages** manualmente).
3. Aguarde o job `deploy` e o smoke HTTP.

## Workflow

Arquivo: `.github/workflows/deploy-pages.yml`

1. **validate** — baselines Node (schema 3.x, function map 79, evidence migration/policy/service, hotfix 4) + checagem de caminhos relativos em `dist/index.html`.
2. **deploy** — `actions/upload-pages-artifact` com `path: dist` + `deploy-pages`.
3. **smoke** — HTTP 200 em `index.html`, `game.json`, módulos ESM e assets principais.

## Caminhos relativos

Assets em `dist/index.html` usam URLs relativas (`styles.css`, `app.js`, `modules/...`). Isso funciona sob o prefixo `/Arquivo-Zero/`.

`fetch("./game.json")` no board resolve contra a URL do documento (a página), não do módulo.

## Fora de escopo deste deploy

- Alterar regras do jogo, evidências, `schemaVersion` ou política de prisão
- Publicar `.roadmap` ou segredos
- Republicar o hub `elzobrito.github.io` (repo separado)

## Verificação local

```bash
node scripts/validate-case.mjs dist/game.json
node scripts/verify-function-map.mjs
node tests/content/evidence-migration.test.mjs
node tests/domain/evidence-policy.test.mjs
node tests/domain/evidence-service.test.mjs
node tests/hotfix/run-all.mjs
python -m esaa --root . verify
```
