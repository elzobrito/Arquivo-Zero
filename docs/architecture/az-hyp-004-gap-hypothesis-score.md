# Gap AZ-HYP-004 — hypothesisScore no arrest-validator

**Origem:** crítica Onda 1 P3 (`docs/qa/critica-onda1-arch.md`)  
**Status:** gap aceito; não alterar o validador na Onda 2  

Na Onda 1, `src/domain/arrest/arrest-validator.js` devolve `hypothesisScore: 0` em todos os ramos, inclusive `APPROVED`. Hipóteses ainda não existem como entidade. O campo já está no contrato `validation-decision.schema.json`.

## Critério a acrescentar em AZ-HYP-004 (catálogo de admissão)

```text
arrest-validator.validateArrest retorna hypothesisScore > 0
quando existe hipótese de autoria sustentada vinculada ao caso.
```

Não simplificar vitória para `suspeito correto = APPROVED`. Identificar ≠ provar permanece.
