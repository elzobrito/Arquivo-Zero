# AZ-SPEC-002 — ADR: evolução incremental do Arquivo Zero

**Status:** aceito  
**Data:** 2026-09-16  
**Tarefa:** `AZ-SPEC-002`  
**Baseline:** `AZ-BASELINE-20260916` (`docs/baseline/slice-20260916.md`)  
**Substitui:** nenhuma decisão anterior de arquitetura 3.0  

---

## Decisão

A evolução do Arquivo Zero é **incremental**. O vertical slice em `dist/app.js` + `dist/game.json` permanece o runtime jogável até cada módulo 3.0 ser ligado por adaptador. **Reescrita total é proibida** sem um novo ADR que a autorize explicitamente e superseda este.

Arquitetura-alvo (proposta v1.0): camadas de aplicação / domínio / infraestrutura / UI, com o fluxo

```text
Evidência → Restrição → Hipótese → Validação → Relatório
```

e a regra canônica “identificar não é provar”. Essa regra **não** está no motor da baseline; as tarefas `AZ-HYP-*` a introduzem.

## Esquemas e adaptadores

| Versão | Significado | Carregamento |
|---|---|---|
| `1.x` | caso linear, sem `campaign` | adaptador 1→2 (capítulo implícito) já descrito no contrato de campanha |
| `2.x` | campanha + `scenarios` (baseline atual, sem `schemaVersion`) | runtime atual; `AZ-ARCH-003` normaliza para 3.0 |
| `3.x` | `schemaVersion: "3.0"` + território, restrições, hipóteses, minijogos, carreira | validador `AZ-ARCH-002` + adaptador 2→3 |

O JSON atual **não** declara `schemaVersion`; o adaptador trata ausência como 2.x.

Perdas de semântica na normalização geram `WARN`, nunca silêncio.

## Fonte canônica de cenário

- **Canônico:** `campaign.chapters.<id>.scenarios` para cada capítulo.
- **Legado:** `game.scenarios` na raiz existe só para JSON sem `campaign` e, no caso atual, **deve ser idêntico** a `campaign.chapters.cifra.scenarios`.
- `AZ-HOTFIX-005` faz o linter falhar se raiz e capítulo cifra divergirem.
- `applyChapter` continua copiando o array do capítulo ativo para `game.scenarios` em memória.

Não há duas fontes de verdade: a raiz é projeção de compatibilidade do capítulo Cifra.

## Módulos e fronteiras

- Nomes de arquivo canônicos (`evidence-service.js`, `schema-validator.js`), não `az-evidence-002.js`.
- UI em `src/ui/**`; domínio em `src/domain/**`.
- `scripts/validate-case.mjs` e linters em `scripts/**` exigem `boundary_grant` em tarefas impl.
- `AZ-REPORT-003` depende de `AZ-TERR-002` (cinco municípios), **não** do catálogo nacional `AZ-TERR-003/004`.
- Catálogos territoriais grandes devem sair de `dist/game.json` quando o esquema 3.0 existir (`content/territories.json` ou equivalente).

## Rollback

1. Artefatos da baseline (hashes em `docs/baseline/slice-20260916.md`) são o ponto de restauração do slice 2.x.
2. Git: reverter `file_updates` da tarefa falha; `done` permanece imutável — correção via hotfix, não reopen.
3. Saves 2.x continuam no `localStorage` com as chaves da baseline; o adaptador 3.0 deve lê-las ou isolá-las (`AZ-HOTFIX-002`).
4. Não usar `activity clear` / `init` para “voltar”.

## Consequências

- Onda 0 (hotfixes) altera `dist/` com grant explícito.
- `AZ-ARCH-004` extrai domínio do DOM sem mudar o comportamento visível.
- Nenhuma tarefa posterior simplifica vitória para `suspeito correto = caso resolvido`.
