# AZ-VALIDATION-001 — Decisão de validação

**Tarefa:** `AZ-VALIDATION-001`  
**Kind:** `spec` · **type:** `governance` · **review:** `governance`  
**Data:** 2026-09-17  
**Depende de:** `AZ-HYP-001` (done), `AZ-EVIDENCE-003` (done)  
**Contrato canônico:** [`src/contracts/validation-decision.schema.json`](../../src/contracts/validation-decision.schema.json)  
**Cópia publicada:** [`docs/architecture/schemas/validation-decision.schema.json`](schemas/validation-decision.schema.json)  
**Gap vigente:** [`docs/architecture/az-hyp-004-gap-hypothesis-score.md`](az-hyp-004-gap-hypothesis-score.md)  
**Implementações futuras:** `AZ-HYP-004` (score de hipótese), `AZ-HYP-005` (orquestração das sete dimensões)

Esta spec **não** altera `arrest-validator.js`, `dist/app.js` nem `dist/game.json`.

---

## Objetivo

Definir como o Arquivo Zero decide se uma prisão pode ser `APPROVED`, `DENIED`
ou `INCONCLUSIVE`. A decisão é um objeto `ValidationDecision` alinhado ao
schema Draft-07 já publicado. Sete dimensões são avaliadas em separado. Nenhuma
delas, isolada, autoriza vitória.

```text
IDENTIFICAR O SUSPEITO CORRETO ≠ PROVAR SUA RESPONSABILIDADE
identificar o suspeito correto  ↛  APPROVED
```

---

## Contrato `ValidationDecision`

O schema vigente (`additionalProperties: true`) exige:

| Campo | Tipo | Papel |
|---|---|---|
| `decision` | `"APPROVED"` \| `"DENIED"` \| `"INCONCLUSIVE"` | Resultado publicado. |
| `suspect` | string ou `null` | ID estável do alvo do mandado; `null` se inexistente. |
| `evidenceScore` | number 0..1 | Força do material que pode sustentar prisão. |
| `procedureScore` | number 0..1 | Conformidade processual (mandado e rito). |
| `hypothesisScore` | number 0..1 | Força da hipótese de autoria sustentada. |
| `reasons` | string[] | Códigos/motivos determinísticos, estáveis. |

Extensões permitidas pelo `additionalProperties: true`, a formalizar quando
passarem a ser obrigatórias:

```json
{
  "decision": "DENIED",
  "suspect": "cifra",
  "evidenceScore": 1,
  "procedureScore": 1,
  "hypothesisScore": 0,
  "reasons": ["hypothesis_missing"],
  "dimensions": {
    "identity": "MATCH",
    "location": "MATCH",
    "hypothesis": "UNKNOWN",
    "probative": "MATCH",
    "essentials": "MATCH",
    "procedure": "MATCH",
    "deadline": "MATCH"
  }
}
```

Os valores de dimensão usam o triestado de `AZ-CONSTRAINT-001`
(`MATCH` / `NO_MATCH` / `UNKNOWN`). Não redefinir Kleene aqui.

Não se grava `decision` fora do enum do schema. Não se usa `FAIL`, `OK` nem
booleanos.

---

## Três resultados

| `decision` | Quando | Efeito no jogo |
|---|---|---|
| `APPROVED` | As sete dimensões são `MATCH` e os scores exigidos pelo caso estão satisfeitos. | Prisão válida. |
| `DENIED` | Ao menos uma dimensão é `NO_MATCH` de bloqueio (identidade errada, essencial ausente, prazo esgotado, procedimento inválido, hipótese refutada, evidência que deveria sustentar está inadmissível/comprometida de forma bloqueante). | Prisão recusada. |
| `INCONCLUSIVE` | Não há `NO_MATCH` bloqueante, mas ao menos uma dimensão necessária permanece `UNKNOWN` (hipótese inexistente, localização não observada, material parcial). | Não é vitória. Não é “inocente”. |

O motor 2.x **não emite** `INCONCLUSIVE`. Só `APPROVED` ou `DENIED`. Introduzir
o terceiro resultado é trabalho de `AZ-HYP-005`, não desta spec.

---

## Sete dimensões

Cada dimensão devolve `{ result, explanation }` no sentido de
`AZ-CONSTRAINT-001`. O agregador (`AZ-HYP-005`) aplica AND de Kleene sobre as
sete para o veredito, e preenche os scores numéricos.

### 1. Identidade

O mandado aponta um `suspectId` estável. `MATCH` se esse ID é o alvo pretendido
**após** avaliação multidimensional (`AZ-SUSPECT-003` / `AZ-SUSPECT-004`), não
após um único campo de dossiê (`name` / `specialty` / `vehicle`).

`NO_MATCH` se o mandado nomeia outro ID. `UNKNOWN` se não há mandado ou o
conjunto de candidatos ainda contém `UNKNOWN` impedindo unicidade.

Identidade `MATCH` **não** autoriza `APPROVED`.

### 2. Localização

O alvo precisa ser compatível com o lugar da abordagem: `possibleLocationIds`
do `caseProfile` do capítulo ativo e a cidade corrente. `MATCH` se a cidade da
prisão está entre as localizações possíveis suportadas. `NO_MATCH` se o perfil
exclui explicitamente essa cidade. `UNKNOWN` se o perfil não observa
localização (`[]` ou ausência tratada pela regra de `AZ-CONSTRAINT-001` /
`AZ-SUSPECT-001`: ausência → `UNKNOWN`, não exclusão).

### 3. Hipótese

Existe hipótese de autoria (`HypothesisRecord.type = authorship`) **sustentada**
(`status = supported`), vinculada ao `suspect` e ao caso/capítulo, com
`supports` não vazio de evidências válidas. `MATCH` só nesse caso.
`NO_MATCH` se a hipótese de autoria está `refuted`. `UNKNOWN` se não há
hipótese, se está `active`/`weakened`/`inconclusive`, ou se o suporte não
passa a política probatória.

Hoje **não existem** hipóteses no save. Portanto a dimensão é `UNKNOWN` em
todo o vertical slice. Ver gap abaixo.

### 4. Força probatória

Usa `evidence-policy.canSupportArrest(record)` sobre o `EvidenceRecord`
normalizado em memória (`AZ-EVIDENCE-003`). `MATCH` se o material que pretende
sustentar a prisão pode participar (não `inadmissible`, não `compromised`).
`NO_MATCH` se o suporte restante, depois da política, é vazio quando o caso
exige suporte. `UNKNOWN` se qualidade/integridade/admissibilidade ainda estão
em benefício da dúvida **e** a política do caso pede confirmação explícita.

Redundância não infla score. Evidência inadmissível permanece visível e não
contribui.

### 5. Evidências essenciais

`arrest_requirements.required_evidence`: todos os IDs estão em
`state.evidence`. `MATCH` se o conjunto essencial está coberto.
`NO_MATCH` se falta algum ID essencial. Contagem `minimum_evidence` é critério
adicional do caso, não substitui o essencial.

Esta dimensão já é avaliada pelo motor 2.x (ramo `insufficient_evidence`).

### 6. Procedimento

Mandado emitido (`state.warrant === true`) pelo rito vigente, suspeito do
mandado preenchido, sem atalho que pule o dossiê. `MATCH` se o rito foi
cumprido. `NO_MATCH` se a prisão é tentada sem mandado. `UNKNOWN` não se aplica
ao flag booleano atual; um rito 3.0 futuro pode devolver `UNKNOWN` quando o
mandado existir mas requisitos processuais ainda não modelados estiverem
omissos.

Motor 2.x: `procedureScore = state.warrant ? 1 : 0` no ramo de mandado errado;
nos demais ramos assume 1.

### 7. Prazo

A abordagem ocorre com horas restantes suficientes segundo `time-service` /
`isUnaffordable`. `MATCH` se o prazo não esgotou. `NO_MATCH` se `hours <= 0`
antes da prisão válida. O motor já encerra o caso no limite; esta dimensão
torna o motivo explícito em `reasons`.

---

## Agregação (alvo de `AZ-HYP-005`)

```text
se alguma dimensão bloqueante = NO_MATCH     → DENIED
senão se alguma dimensão necessária = UNKNOWN → INCONCLUSIVE
senão se todas = MATCH                        → APPROVED
```

Scores:

- `evidenceScore`: 0 se força probatória ou essenciais `NO_MATCH`; 1 se ambas
  `MATCH`; fração configurável só quando o caso declarar limiar (default 2.x:
  0 ou 1, sem meia-prova silenciosa).
- `procedureScore`: 1 se procedimento `MATCH`, senão 0.
- `hypothesisScore`: 0 enquanto não houver hipótese de autoria sustentada;
  `> 0` somente após `AZ-HYP-004`.

`reasons` usam códigos estáveis, por exemplo:

```text
wrong_warrant
insufficient_evidence
hypothesis_missing
hypothesis_refuted
inadmissible_support
deadline_expired
location_unknown
identity_not_unique
warrant_minimum_and_essentials
```

---

## Comportamento atual (baseline 2.x) — gap `hypothesisScore = 0`

`src/domain/arrest/arrest-validator.js` hoje:

1. Se `state.warrantSuspect !== game.culprit` → `DENIED`, `evidenceScore=0`,
   `procedureScore = warrant ? 1 : 0`, **`hypothesisScore=0`**,
   `reasons=["wrong_warrant"]`.
2. Se faltam quantidade ou essenciais → `DENIED`, `evidenceScore=0`,
   `procedureScore=1`, **`hypothesisScore=0`**,
   `reasons=["insufficient_evidence"]`.
3. Caso contrário → `APPROVED`, `evidenceScore=1`, `procedureScore=1`,
   **`hypothesisScore=0`**, `reasons=["warrant_minimum_and_essentials"]`.

Observações vinculantes:

- Os três ramos devolvem `hypothesisScore: 0`, inclusive o `APPROVED`.
- Não há ramo `INCONCLUSIVE`.
- `canSupportArrest` **não** é consultado.
- Acertar o suspeito no mandado (`warrantSuspect === culprit`) mais essenciais
  produz `APPROVED`. Isso **identifica** e chama de vitória. É exatamente o
  comportamento que a regra canônica proíbe no alvo 3.0.
- O campo `hypothesisScore` já existe no schema; hipóteses ainda não existem
  como entidade no save (`AZ-HYP-001` é spec).

Esse gap permanece até `AZ-HYP-004`. **Não** alterar o validador nesta tarefa
nem reabrir `AZ-EVIDENCE-003`.

---

## Critérios de aceite de `AZ-HYP-004`

Integração da hipótese de autoria ao validador. Não colapsa identificar=provar.

1. `validateArrest` consulta `evidence-policy.canSupportArrest(record)` sobre
   cada `EvidenceRecord` normalizado em memória que pretenda participar do
   cálculo de `hypothesisScore`.
2. `hypothesisScore > 0` **somente** quando existe hipótese de autoria
   `supported`, vinculada ao caso/capítulo e ao `suspect` do mandado, com
   suporte que passa a política. Acertar o suspeito, só, não eleva o score.
3. Evidência inadmissível ou comprometida não contribui. Redundância não infla.
4. Os três ramos atuais deixam de devolver `hypothesisScore: 0` por omissão:
   o zero passa a significar “sem hipótese sustentada”, não “campo não ligado”.
5. `IDENTIFICAR ≠ PROVAR` permanece: `warrantSuspect === culprit` com
   `hypothesisScore = 0` **não** pode ser `APPROVED` no alvo 3.0 desta tarefa
   (ou o validador passa a `INCONCLUSIVE`/`DENIED` com `hypothesis_missing`,
   conforme o modo ligado por `AZ-HYP-005`).
6. `FUNCTION_MAP_PASS`, `HOTFIX_SUITE_PASS tests=4`, evidência policy/service
   e `python3 -m esaa verify` ok. SHA de `dist/game.json` inalterado a menos
   que a tarefa conceda o contrário.

Dependências previstas (Onda 4): `AZ-HYP-002`, restrições compostas
(`AZ-CONSTRAINT-005` quando existir) e esta spec `AZ-VALIDATION-001`.

---

## Critérios de aceite de `AZ-HYP-005`

Orquestrar as sete dimensões num único `ValidationDecision` publicado.

1. Avaliar identidade, localização, hipótese, força probatória, essenciais,
   procedimento e prazo em separado, cada uma com `{ result, explanation }`.
2. Agregar com AND de Kleene: `NO_MATCH` → `DENIED`; só `UNKNOWN` residual →
   `INCONCLUSIVE`; todas `MATCH` → `APPROVED`.
3. Preencher `decision`, `suspect`, `evidenceScore`, `procedureScore`,
   `hypothesisScore` e `reasons` de forma válida no schema vigente.
4. Introduzir `INCONCLUSIVE` no fluxo jogável (UI e motor) sem tratar
   inconclusão como inocência.
5. Identidade `MATCH` com hipótese `UNKNOWN` **não** produz `APPROVED`.
6. Testes cobrem: mandado certo sem hipótese → não `APPROVED`; mandado errado
   → `DENIED`; essenciais faltando → `DENIED`; prazo esgotado → `DENIED`;
   sete `MATCH` com hipótese sustentada → `APPROVED`; localização ausente →
   `INCONCLUSIVE`.
7. Não simplificar vitória para `suspeito correto = APPROVED`.

`AZ-HYP-005` depende de `AZ-HYP-004` (score) e desta spec. Não implementar
aqui.

---

## Fora de escopo desta spec

```text
Não alterar src/domain/arrest/arrest-validator.js
Não alterar evidence-policy.js
Não alterar dist/app.js nem dist/game.json
Não materializar hipóteses no save
Não emitir INCONCLUSIVE no motor 2.x
```
