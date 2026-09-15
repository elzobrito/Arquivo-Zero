# Cenários aleatórios de pistas

Esta evolução, governada por `TITO-RANDOM-CLUES-001`, preserva a solução do caso
— **Cifra**, **Engenharia social** e **Avião cargueiro** — e varia o caminho usado
para demonstrá-la.

## Fluxo da partida

```text
novo caso
  -> sorteia cenário diferente do anterior, quando possível
  -> persiste scenario no estado local
  -> São Paulo: identidade, especialidade e primeira direção
  -> intermediário 1: transporte e próxima direção
  -> intermediário 2: localização e negociação
  -> Porto Alegre: manifesto, mandado e prisão
```

O identificador operacional exibido no cabeçalho (`N-17`, `A-23` ou `C-31`)
serve para reprodução e suporte. Ele não descreve a rota ao jogador.

## Variantes

| Cenário | Cadeia válida | Desvio inicial |
| --- | --- | --- |
| `eixo_nordeste` | São Paulo -> Recife -> Brasília -> Porto Alegre | Manaus |
| `eixo_amazonico` | São Paulo -> Manaus -> Brasília -> Porto Alegre | Recife |
| `eixo_central` | São Paulo -> Brasília -> Recife -> Porto Alegre | Manaus |

Cada cenário possui sua própria navegação, substituições de ações e textos de
evidência. A aplicação combina esses dados com as ações-base somente durante a
renderização e a execução; `game.json` continua sendo a fonte declarativa.

## Garantias

- a variante permanece estável durante recargas porque seu ID pertence a
  `state.scenario`;
- iniciar ou reiniciar um caso exclui a variante anterior do sorteio enquanto
  houver outra opção;
- cidades de desvio não entregam provas obrigatórias daquele cenário;
- cada cadeia oferece pelo menos sete evidências e todas as evidências exigidas;
- casos JSON antigos, sem `scenarios`, usam navegação e ações-base normalmente.

Validação automatizada:

```bash
node scripts/verify-random-scenarios.mjs
```

## Campanha (conteúdo, motor ainda não encadeia)

Governado por `TITO-CAMPAIGN-CONTENT-001`. Contrato em
[`campaign-contract.md`](campaign-contract.md).

`dist/game.json` agora declara `campaign` com pool `{byte, null, vertice}`,
dois capítulos de lieutenant por run e chefão `cifra`. O **motor atual**
continua jogando só o caso raiz (Cifra, três eixos acima). A ligação
`vitória → próximo capítulo` é `TITO-CAMPAIGN-ENGINE-001`.

Até lá, prisão e ações novas **não** foram acrescentadas nas cidades: todos os
capítulos de lieutenant terminam em Porto Alegre, reusando `poa_arrest`, para
não alterar a UI do caso Cifra.

| Capítulo | Alvo | Cenários | Rotas |
| --- | --- | --- | --- |
| `byte` | Byte Azul (redes, carro preto) | `byte_litoral` B-17, `byte_planalto` B-23 | SP→Recife→POA · SP→Brasília→POA |
| `null` | Null (dados, ônibus) | `null_amazonia` U-11, `null_nordeste` U-19 | SP→Manaus→POA · SP→Recife→Brasília→POA |
| `vertice` | Vértice (gráficos, barco) | `vertice_rio` V-08, `vertice_litoral` V-14 | SP→Manaus→POA · SP→Recife→POA |
| `cifra` | Cifra (engenharia social, cargueiro) | os três eixos N-17 / A-23 / C-31 | inalterados |

Provas novas: `E11`–`E16`. O linter exige solucionabilidade **por capítulo**.

```bash
node scripts/verify-random-scenarios.mjs
# RANDOM_SCENARIOS_PASS chapters=4 scenarios=9 routes=9 culprit=byte|null|vertice|cifra
```

