# AZ-CONSTRAINT-007 — Validador de unicidade e solucionabilidade

## Resultado

`scripts/validate-case-constraints.mjs` oferece a função pura
`validateConstraints(gameJson)` e a interface CLI solicitada. O resultado contém
`status` (`PASS`, `WARN` ou `FAIL`) e issues com `severity`, `path`, `message` e
`suggestion`.

## Regras implementadas

1. Restrições do cenário, capítulo ou caso são avaliadas contra os suspeitos pelo
   `candidate-service`. Zero ou múltiplos `MATCH` são falhas. Um cenário sem
   restrições declaradas não é promovido artificialmente a único nem ambíguo.
2. Campos escalares, exceto identidade nominal (`id`, `name`, `codename`), são
   comparados entre os suspeitos. Valor pertencente a apenas um registro gera
   aviso de identificação trivial.
3. Para cada cenário, evidências obrigatórias precisam ser obtíveis por ações das
   localidades presentes em sua rota, após aplicação de `action_overrides`.
4. O custo mínimo soma o percurso fixado pela rota e a ação mais barata que produz
   cada evidência essencial. Se esse total exceder `total_hours`, o caso falha.

## Caso publicado

O caso 3.0 não declara conjuntos de restrições por cenário; por isso a verificação
de cardinalidade é corretamente omitida, sem inferir regras a partir de narrativa.
As verificações de rota e orçamento cobrem os quatro capítulos e nove cenários.
Os campos legados `specialty` e `vehicle`, quando únicos, podem produzir `WARN`:
isso é não crítico e torna explícito o risco de identificação por um único atributo.

## Cobertura

As cinco fixtures em `tests/qa/fixtures/` isolam solução zero, solução múltipla,
atributo trivial, orçamento inviável e evidência obrigatória fora da rota.
`tests/qa/constraint-validator.test.mjs` cobre `INV-CV-001` a `INV-CV-008`,
incluindo os códigos de saída 0 e 1 da CLI.

## Limites

O validador é uma ferramenta standalone de QA. Não altera `dist/game.json`, não
é importado por `dist/app.js` e não modifica funções ou callbacks do motor.
