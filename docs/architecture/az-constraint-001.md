# AZ-CONSTRAINT-001 — Modelo triestado de restrições

**Tarefa:** `AZ-CONSTRAINT-001`  
**Kind:** `spec` · **type:** `governance` · **review:** `governance`  
**Data:** 2026-09-17  
**Depende de:** `AZ-ARCH-001` (done)  
**Contrato de avaliação:** [`src/contracts/constraint-evaluation.schema.json`](../../src/contracts/constraint-evaluation.schema.json)  
**Cópia publicada:** [`docs/architecture/schemas/constraint-evaluation.schema.json`](schemas/constraint-evaluation.schema.json)  
**Implementação imediata:** `AZ-CONSTRAINT-002` (operadores escalares)  
**Fora desta tarefa:** avaliar árvore (`AZ-CONSTRAINT-003`), filtrar candidatos (`AZ-SUSPECT-003`), ligar restrição a hipótese/prisão.

---

## Objetivo

Definir a semântica triestado com a qual o Arquivo Zero avalia restrições sobre
suspeitos, evidências, territórios e hipóteses. A avaliação nunca transforma
ausência de dado em incompatibilidade.

```text
IDENTIFICAR O SUSPEITO CORRETO ≠ PROVAR SUA RESPONSABILIDADE
```

Um caso bem formado **não** produz solução única a partir de uma restrição
isolada. Unicidade exige o cruzamento de múltiplas restrições independentes.
Duplicar a mesma alegação em dois nós da árvore não conta como duas dimensões.

Esta especificação não altera o motor, `dist/game.json`, o mandado 2.x nem
`validateArrest`.

---

## Três resultados

Cada avaliação atômica ou composta devolve exatamente um de:

| Resultado | Significado | Não significa |
|---|---|---|
| `MATCH` | O valor observado satisfaz a restrição. | Autoria, culpa ou prisão. |
| `NO_MATCH` | O valor observado contradiz a restrição. | “O suspeito é inocente.” |
| `UNKNOWN` | Não há valor observável suficiente para decidir. | `NO_MATCH` nem “álibi.” |

Exemplos sobre o campo `methods` de um `SuspectRecord`:

```text
eq(["token-reuse"], ["token-reuse"])     → MATCH
eq(["token-reuse"], ["visual-forgery"])  → NO_MATCH
eq(ausente, ["token-reuse"])             → UNKNOWN
eq(null, ["token-reuse"])                → UNKNOWN
```

`ConstraintEvaluation.result` no schema vigente aceita somente esses três
valores. Não há quarto estado.

---

## Regra do campo ausente

```text
campo ausente, undefined ou null → UNKNOWN
nunca NO_MATCH
nunca exceção
```

Ausência é incerteza, não refutação. Lista vazia `[]` é valor presente: o
operador decide sobre o vazio (por exemplo `contains([], "x")` → `NO_MATCH`).
A distinção é obrigatória: `[]` é conhecido; omissão não é.

Tipos incompatíveis (string vs número, objeto vs conjunto, etc.) também
retornam `UNKNOWN`, com `explanation` descritiva. Não lançar.

---

## Lógica de Kleene (AND, OR, NOT)

Operandos: `M` = MATCH, `N` = NO_MATCH, `U` = UNKNOWN.

### AND

| A \ B | M | N | U |
|---|---|---|---|
| **M** | M | N | U |
| **N** | N | N | N |
| **U** | U | N | U |

`AND` só é `MATCH` quando todos os operandos são `MATCH`. Um único `NO_MATCH`
vence. `UNKNOWN` propaga na ausência de `NO_MATCH`.

### OR

| A \ B | M | N | U |
|---|---|---|---|
| **M** | M | M | M |
| **N** | M | N | U |
| **U** | M | U | U |

`OR` é `MATCH` se algum operando é `MATCH`. Só é `NO_MATCH` quando todos são
`NO_MATCH`. `UNKNOWN` permanece quando não há `MATCH` e resta incerteza.

### NOT

| A | NOT A |
|---|---|
| M | N |
| N | M |
| U | U |

`NOT(UNKNOWN)` é `UNKNOWN`. Não converter incerteza em incompatibilidade.

AND/OR são comutativos e associativos nesta tabela. `NOT NOT A` = `A`.

---

## Operadores escalares iniciais

Namespace de implementação: `src/domain/constraints/scalar-operators.js`.  
Espelho ESM: `dist/modules/scalar-operators.js`.

Cada operador é função pura:

```text
(actual, expected, ctx?) → { result: "MATCH"|"NO_MATCH"|"UNKNOWN", explanation: string }
```

`ctx.path` (opcional) identifica o campo avaliado, só para a explicação.
Nenhum operador lê `fs`, `game.json`, DOM ou relógio.

| Código | Nome | Semântica de MATCH | UNKNOWN quando |
|---|---|---|---|
| `eq` | igualdade | `actual` e `expected` são iguais por valor (ver igualdade) | `actual` ausente/null, ou tipos incomparáveis |
| `neq` | diferença | valores comparáveis e diferentes | idem `eq` (incluindo `NOT(UNKNOWN)=UNKNOWN`) |
| `contains` | contém | string: `expected` é substring de `actual`; array: `expected` é elemento de `actual` | `actual` ausente/null, ou `actual` não é string nem array |
| `in` | inclusão em conjunto | `actual` é membro de `expected` (array/conjunto) | `actual` ausente/null, ou `expected` não é array |
| `notIn` | exclusão de conjunto | `actual` não é membro de `expected` | idem `in` |
| `range` | intervalo numérico | `min ≤ actual ≤ max` (limites inclusivos; `min`/`max` omitidos são abertos nesse lado) | `actual` ausente/null/não numérico, ou `expected` sem nenhum limite numérico |

### Igualdade (`eq` / `neq`)

- Primitivos: `===` após recusar `null`/`undefined` (esses já saíram como `UNKNOWN`).
- Números: `NaN` não é igual a `NaN`; `eq(NaN, NaN)` → `UNKNOWN` (não comparável).
- Strings: comparação exata, sem normalizar maiúsculas ou acentos.
- Arrays: igualdade posicional rasa de primitivos; comprimento diferente → `NO_MATCH`.
- Objetos: fora do escopo dos operadores escalares → `UNKNOWN`.

### `contains`

```text
contains("token-reuse", "token")           → MATCH
contains("token-reuse", "forgery")         → NO_MATCH
contains(["token-reuse","phish"], "phish") → MATCH
contains("token-reuse", ["token"])         → UNKNOWN   (expected não é escalar)
contains(42, "4")                          → UNKNOWN
```

### `in` / `notIn`

`expected` deve ser array. Pertinência usa a mesma igualdade de `eq` sobre cada
elemento. `in(x, [])` → `NO_MATCH`. `notIn(x, [])` → `MATCH` quando `x` é
observável.

### `range`

```text
expected = { "min": number?, "max": number? }

range(10, { min: 0, max: 10 })  → MATCH
range(11, { min: 0, max: 10 })  → NO_MATCH
range(10, { min: 11 })          → NO_MATCH
range(10, { max: 9 })           → NO_MATCH
range(10, {})                   → UNKNOWN
range("10", { min: 0, max: 10 })→ UNKNOWN
```

Se `min` e `max` estão presentes e `min > max`, o operador devolve `UNKNOWN`
com explanation de intervalo invertido. Não lança.

---

## Árvore de restrição composta

Uma restrição composta é uma árvore. Folhas são átomos escalares. Nós internos
são `AND`, `OR` ou `NOT`.

```json
{
  "id": "C-BYTE-NETWORK",
  "op": "AND",
  "children": [
    {
      "id": "C-CAP-NET",
      "op": "ATOM",
      "path": "capabilities",
      "operator": "contains",
      "value": "network-access"
    },
    {
      "id": "C-NOT-UNIQUE-VEHICLE",
      "op": "NOT",
      "children": [
        {
          "id": "C-VEHICLE-PLANE",
          "op": "ATOM",
          "path": "mobility.0.vehicleClass",
          "operator": "eq",
          "value": "cargo-plane"
        }
      ]
    }
  ]
}
```

### Campos do nó

| Campo | Obrigatório | Regra |
|---|---:|---|
| `id` | sim | ID estável da restrição; vira `constraintId` na avaliação. |
| `op` | sim | `ATOM`, `AND`, `OR`, `NOT`. |
| `path` | só `ATOM` | Caminho pontilhado no registro avaliado. Segmento ausente → `UNKNOWN`. |
| `operator` | só `ATOM` | Um dos códigos escalares. |
| `value` | só `ATOM` | Operando `expected`. |
| `children` | `AND`/`OR`/`NOT` | `AND`/`OR`: ≥ 1 filho. `NOT`: exatamente 1 filho. `ATOM`: ausente. |

`AND`/`OR` de um único filho equivalem ao filho. `AND`/`OR` vazios são
inválidos na autoria do caso (o avaliador futuro deve devolver `UNKNOWN` com
explanation de árvore malformada, sem lançar).

A resolução de `path` trata `null` intermediário como ausência. Não percorre
protótipo. Não interpreta o path como código.

---

## Formato obrigatório de explicação

Toda avaliação, atômica ou composta, materializa um `ConstraintEvaluation`:

```json
{
  "constraintId": "C-CAP-NET",
  "candidateId": "byte",
  "result": "MATCH",
  "explanation": "capabilities contém network-access."
}
```

Contrato: schema Draft-07 `constraint-evaluation.schema.json`. Campos
obrigatórios: `constraintId`, `candidateId`, `result`, `explanation`.
`explanation` é string humana, determinística para a mesma entrada, sem
relógio e sem IDs inventados.

Regras de redação:

1. Declarar o path ou o `op` composto, o resultado e o motivo.
2. Em `UNKNOWN` por ausência: dizer que o campo não foi observado, nunca que
   “não casa”.
3. Em tipo incompatível: nomear os tipos encontrados.
4. Avaliação composta agrega as explicações dos filhos em uma frase ou em
   sentenças separadas por espaço; o `result` segue a tabela de Kleene.
5. `candidateId` é o ID estável do registro (suspeito, evidência, território),
   nunca o texto de exibição.

Para `AZ-CONSTRAINT-002` (somente átomos), o objeto devolvido pelo operador é
o núcleo `{ result, explanation }`. O serviço que conhece `constraintId` e
`candidateId` (`AZ-CONSTRAINT-003` / `AZ-SUSPECT-003`) completa o schema.

---

## Caso bem formado

Um caso 3.0 que use restrições para unicidade deve:

1. Exigir **pelo menos duas** restrições independentes para reduzir o conjunto
   a um único `MATCH` sem `UNKNOWN` bloqueante.
2. Garantir que cada capacidade ou método usado como pista discriminante seja
   compartilhado por ao menos dois suspeitos (`AZ-SUSPECT-001`).
3. Tratar `UNKNOWN` como “ainda na lista”, nunca como exclusão.
4. Não emitir prisão só porque o conjunto de candidatos tem tamanho 1.

Identificar o suspeito correto por restrições **não** implica
`ValidationDecision.decision = APPROVED`.

---

## Critérios de aceite de `AZ-CONSTRAINT-002`

Implementar operadores escalares triestados, sem avaliar a árvore composta.

1. Exportar `eq`, `neq`, `contains`, `in`, `notIn`, `range` de
   `src/domain/constraints/scalar-operators.js`.
2. Cada operador devolve `{ result: "MATCH"|"NO_MATCH"|"UNKNOWN", explanation }`
   com `explanation` string não vazia.
3. Campo ausente (`undefined`) ou `null` retorna `UNKNOWN` e **não** lança.
4. Tipos incompatíveis retornam `UNKNOWN` com explanation que nomeia os tipos.
5. Operadores são funções puras: mesma entrada → mesma saída; sem I/O, sem
   mutação dos argumentos.
6. Testes em `tests/domain/scalar-operators.test.mjs` cobrem, **para cada
   operador**: `MATCH`, `NO_MATCH`, `UNKNOWN` por ausência, `UNKNOWN` por tipo
   incompatível e, em `range`, os limites inclusivos `min` e `max` e o
   intervalo invertido.
7. Espelho ESM em `dist/modules/scalar-operators.js` com as mesmas exportações.
8. `node scripts/verify-function-map.mjs` → `FUNCTION_MAP_PASS`. Como os
   operadores não entram em `dist/app.js`, o mapa do motor permanece com o SHA
   vigente; o Markdown registra a existência do módulo de domínio.
9. `node --check dist/app.js` e `python3 -m esaa --root . verify` ok.
10. SHA de `dist/app.js` inalterado.

Fora de `AZ-CONSTRAINT-002`: parser da árvore, `AND`/`OR`/`NOT` compostos,
`filterCandidates`, alteração de `dist/game.json` ou do validador de prisão.

---

## Fora de escopo desta spec

```text
Não alterar dist/app.js nem dist/game.json
Não implementar scalar-operators.js
Não implementar candidate-service.js
Não alterar arrest-validator.js
Não redefinir ValidationDecision
```
