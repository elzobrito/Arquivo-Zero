# Contrato de campanha, capítulo e cenário

Fonte de governança: `TITO-CAMPAIGN-CONTRACT-001`.
O motor em `dist/app.js` (`TITO-CAMPAIGN-ENGINE-001`) aplica o capítulo ativo,
persiste o cursor em `arquivo-zero-campaign-v1` e avança na prisão válida.
JSON sem `campaign` conserva o `newCase` de um único caso.

## Duas unidades

| Unidade | Significado | Onde vive |
| --- | --- | --- |
| **Cenário** | Variedade de *uma* partida: mesma solução, outra rota e outros textos | `scenarios[]` do capítulo |
| **Capítulo / fase** | Unidade de progressão: outro alvo, outro briefing, outro recorte | `campaign.chapters` ou o JSON raiz, se não houver `campaign` |

Acrescentar um cenário não exige JS. Acrescentar uma fase, depois do motor da
campanha, é acrescentar um capítulo e passar o linter.

## Capítulo implícito (JSON legado)

Se `campaign` estiver ausente, o arquivo inteiro é **um** capítulo:

- `culprit`, `metadata.start`, `arrest_requirements`, `scenarios`
- mundo compartilhado: `locations`, `travel`, `suspects`, `dossier`, `evidence`

`dist/game.json` atual (Cifra, três eixos, Porto Alegre) cai neste modo. O
linter não exige os literais Cifra / Porto Alegre / rota de 4 cidades; lê esses
valores do próprio JSON.

## Campanha (quando `campaign` existe)

```text
início
  → sorteia `lieutenant_chapters` IDs distintos de `lieutenant_pool`
  → joga esses capítulos na ordem sorteada
  → joga o capítulo `boss`
```

Campos obrigatórios de `campaign`:

| Campo | Regra |
| --- | --- |
| `id` | string não vazia |
| `lieutenant_pool` | IDs de suspeitos, todos existentes, sem duplicata |
| `lieutenant_chapters` | inteiro ≥ 1 e ≤ tamanho do pool; v1 usa `2` |
| `boss` | ID de suspeito existente, **fora** do pool |
| `chapters` | objeto com **exatamente** as chaves `pool ∪ {boss}` |

Cada entrada de `chapters` é um overlay sobre o mundo raiz:

| Campo | Regra |
| --- | --- |
| `culprit` | deve coincidir com a chave do capítulo e existir em `suspects` |
| `start` | cidade existente; cada `scenario.route[0]` começa aqui |
| `arrest_requirements.minimum_evidence` | inteiro ≥ 0 |
| `arrest_requirements.required_evidence` | IDs de `evidence` |
| `scenarios` | ≥ 2 rotas distintas e solucionáveis |
| `briefing`, `total_hours` | opcionais (o motor da campanha pode promovê-los) |

O mundo (`locations`, `travel`, `suspects`, `dossier`, `evidence`) permanece na
raiz. Capítulo não duplica cidade.

## Cenário

Contrato já exercitado por `TITO-RANDOM-CLUES-001`, generalizado:

- `id` e `code` únicos no capítulo
- `route` acíclica, comprimento ≥ 3, começa em `start`, cidades existentes
- `navigation` permite cada salto consecutivo da rota
- overrides só citam ações e evidências existentes
- a cadeia da rota oferece o mínimo e todas as provas obrigatórias
- cidade fora da rota não entrega prova obrigatória
- a **última** cidade da rota tem uma ação efetiva com `arrest: true`

O fim da fase é o último ID de `route`, não um literal de cidade.

## Persistência (contrato; implementação no motor)

| Chave / campo | Papel |
| --- | --- |
| `STORE + metadata.id` | save da *fase corrente* (horas, evidências, `scenario`) |
| `CAREER` | estrelas acumuladas |
| cursor da campanha | capítulos já sorteados, índice atual, boss pendente |

Regras:

- recarregar a página não troca capítulo nem cenário;
- reset da **fase** re-sorteia só o cenário daquele capítulo;
- reset da **campanha** sorteia de novo o par de lieutenants;
- JSON sem `campaign` conserva o `newCase` atual.

## Linter

```bash
node scripts/verify-random-scenarios.mjs
node scripts/verify-random-scenarios.mjs tests/fixtures/campaign-contract-min.json
```

O primeiro caminho valida `dist/game.json` (capítulo implícito) e o contrato do
motor em `dist/app.js`. O segundo valida o fixture de campanha. Não altera o
jogo.

## Fora deste contrato

- minigame Python no chefão
- cidades além das cinco do produto
- gerador LLM no browser
- reabrir tarefas `done`
