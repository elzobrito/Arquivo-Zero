# AZ-CAREER-001 — Competências e patentes

**Tarefa:** `AZ-CAREER-001`  
**Kind:** `spec` · **type:** `governance` · **review:** `governance`  
**Data:** 2026-09-17  
**Depende de:** `AZ-REPORT-001`  
**Contratos relacionados:** [`src/contracts/validation-decision.schema.json`](../../src/contracts/validation-decision.schema.json), [`docs/architecture/az-validation-001.md`](az-validation-001.md), [`docs/architecture/az-hyp-001.md`](az-hyp-001.md)  
**Gap vigente:** [`docs/architecture/az-hyp-004-gap-hypothesis-score.md`](az-hyp-004-gap-hypothesis-score.md)  
**Implementação futura:** `AZ-CAREER-002` (avaliação por caso)

Esta especificação **não** altera o motor, o save, `arrest-validator.js`,
`dist/app.js` nem `dist/game.json`. Ela define patentes, competências, promoção
e desbloqueios. O avaliador ainda **não existe**; `AZ-CAREER-002` o implementa.

## Objetivo e regra central

Substituir o contador isolado de estrelas (`arquivo-zero-career-v1`, `FN-018` /
`FN-019`) por uma carreira legível, baseada em desempenho observável no caso.
Patente não se compra com pontos. Competência não avalia a pessoa do jogador.

```text
desempenho observável ≠ pontuação arbitrária
identificar o suspeito correto ≠ provar responsabilidade
promoção exige casos E competências
```

A regra de `AZ-VALIDATION-001` permanece vinculante: identidade `MATCH` com
hipótese `UNKNOWN` não produz `APPROVED` no alvo 3.0. Acertar o culpado por
palpite não promove.

---

## 1. Seis patentes

Ordem total, sem salto. A patente inicial é sempre `trainee`. Só se promove
para a **próxima** patente quando **todos** os critérios nomeados da patente
de destino estão satisfeitos.

| `id` | Rótulo | Papel |
|---|---|---|
| `trainee` | Trainee | Patente inicial. Zero casos bastam para ocupá-la. |
| `junior` | Júnior | Primeira promoção. Exige casos concluídos com crédito e pisos de observação/análise. |
| `pleno` | Pleno | Variedade de categorias e consistência de relatório/território. |
| `senior` | Sênior | Consistência alta de relatório, eficiência temporal e mandado limpo recente. |
| `especialista` | Especialista | Piso de `hypothesisQuality` e baixa taxa de mandado errado. |
| `elite` | Elite | Pisos de maestria nas sete competências, nas categorias da campanha. |

Os números abaixo são **exemplo conservador de campanha**, não valores vivos do
motor 2.x. Cada campanha declara os pisos por identificador nomeado. O motor
não esconde um score paralelo.

### 1.1 Critérios por patente

“Casos com crédito” são encerramentos que geram `promotionCredit: true`
(seção 3). Estrelas legadas não preenchem esses totais além do crédito
inicial limitado.

| Patente | Casos com crédito | Pisos de competência (mediana da janela) | Variedade | Procedimento (`legalProcedure`) |
|---|---|---|---|---|
| Trainee | 0 para ocupar | nenhum piso de maestria | 0 | Porta de saída: ≥ 1 caso encerrado sem violação processual crítica |
| Júnior | ≥ 2 | `floor.junior.observacao` ≥ 0,40; `floor.junior.analise` ≥ 0,40 | ≥ 1 categoria | `floor.junior.legalProcedure` ≥ 0,50; nenhum crédito com violação crítica |
| Pleno | ≥ 5 | Júnior + `floor.pleno.territorialReasoning` ≥ 0,50; `floor.pleno.reportConsistency` ≥ 0,50; observação/análise ≥ 0,50 | ≥ 3 categorias | `floor.pleno.legalProcedure` ≥ 0,60; sem violação crítica na janela recente (padrão: 3) |
| Sênior | ≥ 8 | Pleno + `floor.senior.reportConsistency` ≥ 0,70; `floor.senior.timeEfficiency` ≥ 0,20; demais declaradas ≥ 0,60 | ≥ 4 categorias, ou todas as publicadas se a campanha tiver menos de 4 | `floor.senior.legalProcedure` ≥ 0,75; **nenhum** erro crítico de mandado na janela recente |
| Especialista | ≥ 12 | Sênior + `floor.especialista.hypothesisQuality` ≥ 0,70; demais ≥ 0,70; `timeEfficiency` ≥ 0,30 | ≥ 5, ou todas as publicadas se menos de 5 | `floor.especialista.legalProcedure` ≥ 0,85; taxa de mandado errado ≤ `maxWrongWarrantRate.especialista` (0,15) |
| Elite | ≥ 20 | as sete em piso de maestria (tabela 1.2) | ≥ 6, ou todas as publicadas se menos de 6 | `floor.elite.legalProcedure` ≥ 0,90; taxa ≤ `maxWrongWarrantRate.elite` (0,05) |

A porta de saída de Trainee (≥ 1 caso sem violação crítica) é **necessária e
não suficiente**. O ingresso em Júnior usa a linha Júnior inteira (≥ 2 casos,
pisos e variedade).

### 1.2 Pisos de maestria (Elite) — exemplo nomeado

| Identificador | Competência | Piso exemplo |
|---|---|---|
| `floor.elite.observacao` | observação | 0,80 |
| `floor.elite.analise` | análise | 0,80 |
| `floor.elite.territorialReasoning` | territorialReasoning | 0,80 |
| `floor.elite.hypothesisQuality` | hypothesisQuality | 0,80 |
| `floor.elite.timeEfficiency` | timeEfficiency | 0,35 |
| `floor.elite.reportConsistency` | reportConsistency | 0,80 |
| `floor.elite.legalProcedure` | legalProcedure | 0,90 |

`timeEfficiency` não usa o mesmo 0,80 das demais: exigir 80 % de horas
restantes tornaria a maestria injogável. O piso é nomeado e configurável.

### 1.3 Configuração por campanha

Os critérios vivem em dados da campanha (ou perfil de progressão referenciado
por ela), não em constantes do motor. Identificadores estáveis:

```text
minQualifyingCases.<rank>
minCategories.<rank>
floor.<rank>.<competencyId>
windowSize                  (padrão: 5)
recentProcedureWindow       (padrão: 3)
maxWrongWarrantRate.<rank>
legacyStarCap               (padrão: 1; máximo admitido: 2)
```

Se a campanha omite um identificador, vale o exemplo desta spec. Se publica
menos categorias do que o `minCategories` da patente, usa-se

```text
minCategoriesEfetivo = min(minCategories.<rank>, |categoriasPublicadas|)
```

Não há patente entre as seis. Não há promoção por soma de pontos.

### 1.4 Categorias investigativas

Cada caso ou capítulo declara `career.categoryIds: string[]`. A campanha
publica o vocabulário admitido. `AZ-CAREER-002` **não** infere categoria a
partir de prosa.

Vocabulário inicial recomendado (extensível pela campanha):

| `id` | Rótulo | O que o caso classifica |
|---|---|---|
| `documental` | Documental | registros, documentos, falsificação |
| `digital` | Digital | logs, sistemas, rastros computacionais |
| `territorial` | Territorial | rota, localidade, deslocamento |
| `testemunhal` | Testemunhal | entrevistas, depoimentos |
| `pericial` | Pericial | perícia material |
| `financeiro` | Financeiro | fluxos e pagamentos |
| `institucional` | Institucional | rito, órgãos, procedimento como objeto |
| `geral` | Geral | fallback se o caso omitir `categoryIds` |

`geral` conta como **uma** categoria. Não inventa cobertura nacional nem as
27 UFs. Variedade é o conjunto de IDs distintos nos casos **com crédito**.

---

## 2. Sete competências

Cada competência devolve, por caso:

```text
{ id, score: 0..1, reasons: string[], observations: object }
```

`score` é determinado por ações e registros do caso, nunca por traço de
personalidade, estilo de escrita em linguagem natural, rapidez de digitação ou
“inteligência” do jogador humano. `reasons` usam códigos estáveis. A mediana
da janela `windowSize` alimenta os pisos da seção 1; a promoção não lê um
total acumulado oculto.

### 2.1 `observacao` — observação

**Mede:** uso efetivo de ações investigativas (ações de local que consomem
horas e podem produzir evidência).

**Evidência observável no jogo:**

- ações executadas em locais visitados, com ou sem novo `evidenceId`;
- ações on-route ainda disponíveis e não usadas;
- repetição da mesma ação sem material novo.

Fórmula de referência (pesos configuráveis):

```text
uteis     = ações que concederam um evidenceId ainda não coletado
disponiveis = ações investigativas distintas nos locais on-route visitados
redundantes = execuções repetidas sem evidência nova
score = clamp(uteis / max(disponiveis, 1) − 0,1 × redundantes / max(uteis + redundantes, 1), 0, 1)
```

**Não mede:** curiosidade, “olho clínico”, atenção como traço pessoal, nem
conhecimento do jogador sobre o Brasil.

Códigos: `on_route_action_used`, `redundant_action`,
`off_route_action_no_evidence`, `available_action_skipped`.

### 2.2 `analise` — análise

**Mede:** evidências relevantes coletadas versus as disponíveis no caso ativo,
dado o percurso real.

**Evidência observável no jogo:**

- `state.evidence` ∩ catálogo do capítulo ativo;
- `arrest_requirements.required_evidence`;
- IDs concedíveis nas localidades realmente visitadas da rota do cenário.

```text
coletadasRelevantes = |state.evidence ∩ (required ∪ concedíveisOnRoute)|
disponiveisRelevantes = |required ∪ concedíveisOnRoute|
score = coletadasRelevantes / max(disponiveisRelevantes, 1)
```

Evidência off-route opcional pode somar bônus configurável, teto 0,10, e
nunca é obrigatória. IDs de outro capítulo não entram (isolamento já
exigido em `AZ-REPORT-001`). E09 e E10 não existem e não devem ser
inventados. Registro `inadmissible` / `compromised` pode ter sido coletado;
não conta como suporte apto a prisão (`AZ-EVIDENCE-003` /
`canSupportArrest`).

**Não mede:** “capacidade analítica” da pessoa, QI, nem gosto por puzzles.

Códigos: `required_evidence_collected`, `required_evidence_missing`,
`optional_on_route_missed`, `inadmissible_collected_not_support`.

### 2.3 `territorialReasoning` — raciocínio territorial

**Mede:** destinos corretos versus desvios, contra `scenario.route`.

**Evidência observável no jogo:**

- histórico de deslocamentos do estado;
- `scenario.route` do capítulo ativo;
- hops on-route versus cidades visitadas fora da rota.

```text
onRoute    = visitados ∩ rota
offRoute   = visitados \ rota
cobertura  = |onRoute| / max(|rota|, 1)
desvio     = |offRoute| / max(|visitados|, 1)
score      = clamp(cobertura × (1 − 0,5 × desvio), 0, 1)
```

Exploração off-route não é crime; desvio excessivo sem prova baixa o score.
Estar na cidade de abordagem não prova autoria (`AZ-VALIDATION-001`,
dimensão localização ≠ decisão).

**Não mede:** geografia escolar do jogador, memória de mapa-múndi, nem
“intuição espacial” pessoal.

Códigos: `on_route_destination`, `off_route_deviation`,
`arrest_city_reached`, `route_incomplete`.

### 2.4 `hypothesisQuality` — qualidade da hipótese

**Mede:** hipóteses sustentadas por evidências, em especial autoria
(`HypothesisRecord.type = authorship`, `status = supported`, `supports` que
passam `evidence-policy.canSupportArrest`).

**Evidência observável no jogo (alvo 3.0):**

- hipóteses do caso ativo (`AZ-HYP-001` / serviço `AZ-HYP-002`);
- `ValidationDecision.hypothesisScore` **depois** de `AZ-HYP-004`;
- IDs em `supports` / `contradictions` versus catálogo descoberto.

`confidence` declarada **não** eleva esta competência (`AZ-HYP-001`).
Palpite do culpado sem `supports` aptos produz `guess_without_evidence` e
score 0.

**Não mede:** criatividade, originalidade literária, nem “jeito de pensar”
do jogador humano.

**Limitação vigente (obrigatória):** esta competência **não pode ser
calculada corretamente** até `AZ-HYP-004` integrar `canSupportArrest` em
`validateArrest`. Hoje `src/domain/arrest/arrest-validator.js` devolve
`hypothesisScore: 0` em **todos** os ramos, inclusive `APPROVED`:

```text
wrong_warrant            → hypothesisScore: 0
insufficient_evidence    → hypothesisScore: 0
APPROVED (essenciais ok) → hypothesisScore: 0
```

Até esse gap fechar, `AZ-CAREER-002` grava `score: 0` com razão
`hypothesis_score_unwired` e **não** interpreta `decision === "APPROVED"`
do motor 2.x como maestria de hipótese. Pisos de `hypothesisQuality`
(Especialista e Elite) permanecem **insatisfeitos** enquanto o score
estiver desligado. Ver seção 5.

Códigos: `hypothesis_score_unwired`, `hypothesis_missing`,
`hypothesis_refuted`, `hypothesis_supported`, `guess_without_evidence`.

### 2.5 `timeEfficiency` — eficiência temporal

**Mede:** horas restantes ao concluir o caso, relativas a `total_hours` do
capítulo.

**Evidência observável no jogo:**

- `state.hours` no instante do `ValidationDecision`;
- `total_hours` do capítulo (overlay de campanha ou raiz);
- encerramento por prazo (`deadline_expired` / `hours <= 0`).

```text
se hours <= 0 no encerramento → 0, razão deadline_expired
senão → hours / total_hours
```

É orçamento diegético, não relógio de parede. Terminar rápido com prova
falha não promove: os outros pisos continuam a valer. Não há bônus por
“speedrun” humano.

**Não mede:** velocidade de clique, leitura dinâmica, nem tempo real.

Códigos: `hours_remaining`, `deadline_expired`.

### 2.6 `reportConsistency` — consistência do relatório

**Mede:** evidências citadas versus as de facto usadas no relatório
investigativo (`AZ-REPORT-001`), após a avaliação lógica de
`AZ-REPORT-005`.

**Evidência observável no jogo:**

- snapshot de `InvestigationReport`: `evidenceIds`, `factSources`,
  `support`, `conclusionEvidenceIds`, `authorship`;
- `state.evidence` descoberto no caso ativo;
- último `ValidationDecision`.

```text
se não há snapshot → 0, report_missing
se conclusionEvidenceIds vazio → 0 (relatório inválido)
usadas = cited ∩ discovered ∩ (factSources ∪ support ∪ conclusionEvidenceIds)
score = |usadas| / max(|evidenceIds ∪ conclusionEvidenceIds|, 1)
```

Penalidades nomeadas (subtraem, piso 0):

| Código | Quando | Efeito |
|---|---|---|
| `guess_without_evidence` | conclusão nomeia culpado sem suporte apto a prisão | penaliza esta competência **e** `hypothesisQuality` |
| `report_citation_mismatch` | ID citado não descoberto ou inexistente | score 0 se restar citação inválida |
| `fact_interpretation_collapse` | interpretação promovida a `facts` | penalidade configurável (padrão 0,20) |

Relatório **inconclusivo** que cita o material examinado e declara
limitações pode pontuar na faixa média-alta: inconclusão honesta não é
zero (seção 3). Contradições preservadas não baixam consistência;
apagá-las, sim.

**Não mede:** redação, gramática, erudição ou personalidade do jogador.
O texto livre só entra na medida na medida em que referencia IDs.

Códigos: `report_missing`, `report_citation_mismatch`,
`guess_without_evidence`, `inconclusive_report_consistent`,
`fact_interpretation_collapse`.

### 2.7 `legalProcedure` — procedimento legal

**Mede:** mandado correto e procedimento válido.

**Evidência observável no jogo:**

- `state.warrant`, `state.warrantSuspect`;
- `ValidationDecision.procedureScore` e `reasons`;
- dimensão `procedure` de `AZ-VALIDATION-001` quando `AZ-HYP-005` existir.

```text
se reasons contém wrong_warrant            → 0, critical = true
se prisão tentada com warrant === false    → 0, critical = true
senão → procedureScore do ValidationDecision   (2.x: 0 ou 1)
```

Prisão do suspeito correto com rito inválido **afeta esta competência**,
não é encoberta por identidade `MATCH`. Mandado errado é violação
**crítica**: o caso não gera crédito de promoção.

Baseline 2.x (`arrest-validator.js`): no ramo `wrong_warrant`,
`procedureScore = state.warrant ? 1 : 0`; nos demais ramos assume 1. O
avaliador de carreira usa esses campos publicados; não inventa rito 3.0
enquanto o validador não o modelar.

**Não mede:** ética pessoal, formação jurídica do jogador humano, nem
“respeito à lei” como caráter.

Códigos: `wrong_warrant`, `arrest_without_warrant`, `procedure_match`,
`critical_procedure_violation`.

---

## 3. Regras de promoção

Promoção é um predicado booleano sobre o perfil + critérios da campanha.
Não é loja de pontos, média disfarçada nem acúmulo de estrelas.

### 3.1 Casos e competências, juntos

```text
promoção(rankN → rankN+1) ⇔
    rank atual é N
    ∧ casosComCrédito ≥ minQualifyingCases.N+1
    ∧ categoriasDistintas ≥ minCategoriesEfetivo.N+1
    ∧ ∀ competência com piso em N+1: mediana(janela) ≥ floor.N+1.competência
    ∧ regras de legalProcedure de N+1
    ∧ se o piso de hypothesisQuality for exigido: AZ-HYP-004 concluído
       e o score não for hypothesis_score_unwired
```

Faltar um dos lados bloqueia. Doze casos com observação baixa não fazem
Especialista. Pisos altos com um único caso não fazem Pleno.

### 3.2 Encerramento, crédito e avaliação parcial

| Situação | `outcome` | Avaliação | `promotionCredit` |
|---|---|---|---|
| `APPROVED` 3.0 (sete dimensões `MATCH`, hipótese sustentada) | `approved` | completa | `true` se sem violação crítica e sem palpite |
| `DENIED` por mandado errado / rito inválido | `denied` | completa | `false` (crítica) |
| `DENIED` por essenciais em falta, sem crítica de mandado | `denied` | completa | `false` (sem crédito; competências ainda registadas) |
| `INCONCLUSIVE` | `inconclusive` | **parcial, não zero** | `false` (aprendizagem sem promoção) |
| Palpite: suspeito correto sem suporte apto | conforme validador | completa com penalidade | `false` |
| Prazo esgotado | `denied` / prazo | `timeEfficiency = 0`; demais calculadas | `false` |

Caso inconclusivo **avalia** observação, análise, território, tempo,
relatório e procedimento com o material existente. Não zera o vetor.
Não conta para `minQualifyingCases`. Não preenche variedade de promoção.

### 3.3 Palpite sem evidência

Identificar o suspeito correto sem prova:

- penaliza `reportConsistency` (`guess_without_evidence`);
- penaliza `hypothesisQuality` (`guess_without_evidence`);
- **não** gera crédito de promoção, mesmo que o motor 2.x emita `APPROVED`
  por `warrantSuspect === culprit` + essenciais
  (`AZ-VALIDATION-001`: identificar ↛ `APPROVED`).

Acertar o nome no dossiê não é competência demonstrada.

### 3.4 Mandado errado e prisão inválida

Mandado sobre o ID errado, prisão sem mandado ou rito `NO_MATCH`
penalizam `legalProcedure` de forma **forte** (score 0 e
`criticalProcedureViolation: true`). Esse caso:

- não entra em `casosComCrédito`;
- incrementa o numerador da taxa de mandado errado;
- na janela `recentProcedureWindow`, impede Sênior (e patentes acima,
  enquanto o evento permanecer na janela).

Prisão correta com procedimento ruim **não** é promovida a “caso limpo”:
baixa `legalProcedure` e pode retirar o crédito se a violação for crítica.

### 3.5 Estrelas legadas

O inteiro em `localStorage` (`arquivo-zero-career-v1`) converte-se em
**crédito inicial limitado**, nunca em patente avançada.

```text
legacyCredit = min(estrelas, legacyStarCap)     # padrão cap = 1; teto da spec = 2
```

Regras:

- o crédito soma apenas a `casosComCrédito` rumo a **Júnior** (porta
  Trainee → Júnior);
- **não** conta para Pleno, Sênior, Especialista ou Elite;
- **não** preenche pisos de competência;
- **não** apaga violações processuais (não há histórico de rito nas
  estrelas: o crédito é cego e por isso permanece mínimo);
- **não** atribui categorias;
- a migração é idempotente e informa o jogador (`AZ-CAREER-004`);
- vinte estrelas continuam a produzir Trainee com no máximo dois créditos.

Estrelas não são moeda. Não há catálogo de compras por estrela.

### 3.6 Não é loja de pontos

Proibido:

- somar as sete competências num total e ranquear por esse total;
- compensar `legalProcedure` baixa com `timeEfficiency` alta;
- gastar estrelas, horas ou IDs para “comprar” patente;
- pular patentes;
- promover por quantidade bruta de capítulos jogados.

A campanha pode endurecer pisos; não pode substituir o predicado
conjuntivo por um score único.

### 3.7 Esboço do perfil (ainda não persistido nesta tarefa)

```json
{
  "schemaVersion": "career-1.0",
  "rank": "trainee",
  "legacyStarsConverted": 3,
  "legacyCreditApplied": 1,
  "qualifyingCaseCount": 1,
  "categoryIds": ["territorial"],
  "windowSize": 5,
  "history": [
    {
      "caseId": "cifra:eixo_nordeste",
      "outcome": "inconclusive",
      "categoryIds": ["territorial", "documental"],
      "promotionCredit": false,
      "criticalProcedureViolation": false,
      "competencies": {
        "observacao": { "score": 0.62, "reasons": ["on_route_action_used"] },
        "analise": { "score": 0.50, "reasons": ["required_evidence_collected"] },
        "territorialReasoning": { "score": 0.71, "reasons": ["on_route_destination"] },
        "hypothesisQuality": { "score": 0, "reasons": ["hypothesis_score_unwired"] },
        "timeEfficiency": { "score": 0.41, "reasons": ["hours_remaining"] },
        "reportConsistency": { "score": 0.66, "reasons": ["inconclusive_report_consistent"] },
        "legalProcedure": { "score": 1, "reasons": ["procedure_match"] }
      }
    }
  ]
}
```

O exemplo é ilustrativo. Materializar o save é `AZ-CAREER-003`, não esta
spec. `AZ-CAREER-001` não grava chave nova em `localStorage`.

---

## 4. Desbloqueios por patente

Desbloqueios **ampliam ferramentas analíticas e conteúdo**. Nenhum
desbloqueio revela a solução, o culpado, a rota canónica ou o conjunto
mínimo de provas.

### 4.1 Catálogo exemplo (configurável)

| Patente | `unlockId` exemplo | O que libera | O que **não** faz |
|---|---|---|---|
| Trainee | — | slice atual (mapa, dossiê, evidências, mandado) | — |
| Júnior | `constraint_unknown_filter` | filtro no painel de restrições que distingue `UNKNOWN` de `NO_MATCH` | não marca o suspeito certo |
| Pleno | `territory_route_overlay` | visualização territorial de visitados versus rota **proposta pelo jogador** | não pinta a rota-solução do cenário |
| Sênior | `category_pack_advanced` | categorias investigativas adicionais publicadas pela campanha | não entrega evidência extra automática |
| Especialista | `contradiction_workspace` | destaque de contradições já registadas pelo jogador | não auto-preenche hipóteses |
| Elite | `multi_constraint_board` | área de trabalho para cruzar restrições já avaliadas | não preenche a conclusão do relatório |

A campanha lista `unlocks.<rank>: string[]`. IDs desconhecidos são
ignorados com diagnóstico, não inventados pelo motor.

### 4.2 Proibições

Nenhum `unlockId`, nesta spec ou nas implementações seguintes, pode:

- revelar `game.culprit` ou o equivalente 3.0;
- auto-preencher `HypothesisRecord` (statement, supports, status);
- auto-preencher `conclusion`, `authorship` ou `conclusionEvidenceIds`;
- marcar a rota correta do cenário;
- pular mandado, essenciais ou prazo;
- transformar identidade `MATCH` em `APPROVED`.

Ferramenta nova explica o que o jogador **já observou**. Não investiga no
lugar dele.

Desbloqueio concreto e persistência por patente são `AZ-CAREER-005`. Esta
spec só amarra a regra.

---

## 5. Gap explícito

```text
hypothesisScore atualmente sempre 0 no arrest-validator (gap AZ-HYP-004).
A competência hypothesisQuality será calculada corretamente
somente após AZ-HYP-004 integrar canSupportArrest.
```

Este parágrafo é **critério de aceite de `AZ-CAREER-002`**.

Fontes:

- [`src/domain/arrest/arrest-validator.js`](../../src/domain/arrest/arrest-validator.js)
  — os três `return` (mandado errado, essenciais em falta, `APPROVED`)
  fixam `hypothesisScore: 0`;
- [`docs/architecture/az-hyp-004-gap-hypothesis-score.md`](az-hyp-004-gap-hypothesis-score.md)
  — gap aceito; validador intocado na Onda 2;
- [`docs/architecture/az-validation-001.md`](az-validation-001.md) —
  identificar o suspeito correto **não** implica `APPROVED`;
- `canSupportArrest` existe em `evidence-policy` (`AZ-EVIDENCE-003`) e
  **não** é consultado por `validateArrest` até `AZ-HYP-004`.

Consequências para a carreira:

| Enquanto `AZ-HYP-004` não estiver `done` | Efeito |
|---|---|
| `hypothesisQuality.score` | 0 com `hypothesis_score_unwired` |
| Pisos de Especialista e Elite | impossíveis de cumprir |
| `APPROVED` 2.x (`warrant_minimum_and_essentials`) | **não** conta como hipótese sustentada |
| Palpite com suspeito correto | continua a penalizar relatório e hipótese |

`AZ-CAREER-002` não corrige o validador. Não reabre `AZ-HYP-004`. Não
trata `hypothesisScore === 0` em `APPROVED` como “hipótese perfeita”.

---

## 6. Critérios de aceite de AZ-CAREER-002

`AZ-CAREER-002` implementa a avaliação **por caso**. Não promove, não
migra estrelas para o perfil completo, não desenha o painel. Dependências
obrigatórias: esta spec `done`, `AZ-REPORT-005` `done`, `AZ-HYP-007`
`done`.

### 6.1 Comportamento

1. Avaliação **determinística e explicável** por caso: as mesmas entradas
   (trace de ações, evidências, rota, horas, mandado, relatório,
   `ValidationDecision`) produzem os mesmos `score` e `reasons`.
2. Cada resultado de competência tem ao menos uma `reason` ligada a uma
   **ação ou registo observável** (ação de local, hop, ID de evidência,
   hipótese, campo do relatório, flag de mandado). Proibido motivo do
   tipo “jogador pouco atento”.
3. Prisão correta com procedimento ruim afeta `legalProcedure` (e o
   crédito, se a violação for crítica). Identidade certa não lava rito
   errado.
4. Caso `INCONCLUSIVE` produz avaliação **parcial, não zero**:
   competências observáveis no trace recebem score; `promotionCredit`
   permanece `false`.
5. `hypothesisQuality` **depende** de `AZ-HYP-004` `done`. Enquanto o
   gap vigorar, score 0 + `hypothesis_score_unwired`, sem inferir
   maestria a partir de `APPROVED` 2.x.
6. Identificar o suspeito correto sem suporte apto emite
   `guess_without_evidence` em `reportConsistency` **e**
   `hypothesisQuality`, e recusa crédito.
7. Critérios de patente e pisos são lidos da campanha (seção 1.3), com
   fallback nos exemplos desta spec. Nenhum score oculto adicional.
8. **Não mutar `dist/app.js`** em `AZ-CAREER-002`, salvo concessão
   documentada na própria tarefa. Espelho ESM / módulo em `src/` como
   nas specs de relatório. Esta spec `AZ-CAREER-001` não toca no motor.

### 6.2 Testes obrigatórios

| Caso de teste | Entrada mínima | Aceite |
|---|---|---|
| Palpite sem evidência | `warrantSuspect === culprit`, essenciais eventualmente presentes, relatório/hipótese sem suporte apto | penalidade em `reportConsistency` e `hypothesisQuality`; `promotionCredit === false` |
| Mandado errado | `reasons` contém `wrong_warrant` | `legalProcedure.score === 0`, `criticalProcedureViolation === true`, sem crédito |
| Inconclusivo parcial | `decision === "INCONCLUSIVE"` com ações e evidências parciais | vetor não todo zero; crédito falso |
| Replay determinístico | duas avaliações do mesmo snapshot | igualdade profunda de scores e `reasons` |
| Estrelas legadas sem salto | `legacyStars` alto (ex.: 20) na conversão | `rank` permanece `trainee` ou, no máximo, os créditos de cap rumo a Júnior; **nunca** Pleno+ só por estrelas; pisos de competência vazios |

Cobrir ainda: prisão correta com rito ruim; relatório inconclusivo
consistente (score médio, não zero); `hypothesis_score_unwired` enquanto
`validateArrest` devolver 0; isolamento de IDs de outro capítulo.

### 6.3 Fora de `AZ-CAREER-002`

Persistência de perfil (`AZ-CAREER-003`), migração idempotente das
estrelas na UI (`AZ-CAREER-004`), aplicação de desbloqueios
(`AZ-CAREER-005`) e painel (`AZ-CAREER-006`) não são aceite desta
implementação. `AZ-CAREER-002` pode devolver o objeto de avaliação pura
e, se necessário, um predicado `canPromote` **sem** gravar patente no
save.

### 6.4 Próxima tarefa

```text
AZ-CAREER-002  ←  AZ-CAREER-001 done
               ∧  AZ-REPORT-005 done
               ∧  AZ-HYP-007 done
```

Não iniciar `AZ-CAREER-002` com essas dependências em aberto: sem
avaliação lógica do relatório e sem matriz de desfechos, os testes da
seção 6.2 não têm oráculo estável.

---

## Fora de escopo

```text
Não alterar o motor, o save, dist/app.js nem dist/game.json
Não implementar o avaliador / scorer de competências
Não alterar arrest-validator.js nem ligar canSupportArrest
Não alterar o schema de save nem criar chave de carreira nova
Não migrar arquivo-zero-career-v1
Não atualizar function-map.md / function-map.json
Não promover, desbloquear conteúdo nem desenhar o painel
Não reabrir AZ-HYP-004, AZ-EVIDENCE-003 ou AZ-REPORT-001
```
)
