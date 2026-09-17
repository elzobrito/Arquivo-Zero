# AZ-REPORT-001 — Relatório investigativo final

**Tarefa:** `AZ-REPORT-001`  
**Kind:** `spec` · **type:** `governance` · **review:** `governance`  
**Data:** 2026-09-17  
**Depende de:** `AZ-HYP-001`, `AZ-VALIDATION-001`  
**Contrato canônico:** `src/contracts/investigation-report.schema.json`

Esta especificação não altera o schema, o motor, o save ou a decisão de prisão.
Ela define a semântica que as implementações `AZ-REPORT-002`, `003` e `004`
devem preservar.

## Objetivo e regra central

O `InvestigationReport` registra o raciocínio que liga material descoberto a
uma conclusão revisável. Ele não é uma lista de pistas nem uma confirmação
automática do culpado.

```text
fato observado ≠ interpretação ≠ hipótese ≠ conclusão
identificar um suspeito ≠ provar autoria
```

Toda conclusão cita evidências. Um relatório sem qualquer evidência é inválido.
Uma conclusão inconclusiva é válida quando explicita o material considerado, as
contradições e as limitações que impedem afirmar ou refutar autoria.

## Alinhamento ao schema Draft-07 vigente

O schema exige oito campos. Seus tipos e seu papel permanecem inalterados:

| Campo | Tipo no schema | Seção canônica |
|---|---|---|
| `caseId` | string | identidade do caso ou capítulo |
| `facts` | string[] | fatos observados |
| `timeline` | `{timestamp: string|null, event: string}[]` | cronologia |
| `route` | string[] | rota, como IDs territoriais ordenados |
| `hypotheses` | string[] | interpretações e hipóteses declaradas |
| `validations` | array | suporte, contradições e decisão validada |
| `conclusion` | string | conclusão narrativa |
| `limitations` | string[] | limitações conhecidas |

O schema usa `additionalProperties: true`. Assim, as extensões estruturadas
abaixo são compatíveis com o contrato atual. Elas são obrigatórias no domínio
3.0 desta especificação, embora ainda não sejam obrigatórias no JSON Schema. Uma
implementação não pode usar a permissividade do schema para omitir as seções.

## Estrutura de domínio 3.0

```json
{
  "caseId": "cifra:eixo_nordeste",
  "facts": [
    "A ação de perícia registrou documentos falsos na reserva do cargueiro."
  ],
  "factSources": [
    { "factIndex": 0, "evidenceIds": ["E04"] }
  ],
  "timeline": [
    {
      "timestamp": null,
      "event": "A reserva do cargueiro foi localizada.",
      "evidenceIds": ["E04"],
      "timeStatus": "unknown"
    }
  ],
  "route": ["sao_paulo", "recife", "brasilia", "porto_alegre"],
  "routeSupport": [
    {
      "from": "recife",
      "to": "brasilia",
      "status": "hypothesized",
      "evidenceIds": ["E05"],
      "hypothesisIds": ["HYP-CIFRA-ROUTE-01"]
    }
  ],
  "hypotheses": [
    "Cifra pode ter transportado o material pelo eixo Nordeste."
  ],
  "hypothesisRefs": [
    {
      "hypothesisId": "HYP-CIFRA-ROUTE-01",
      "type": "route",
      "status": "active",
      "supports": ["E04", "E05"],
      "contradictions": []
    }
  ],
  "interpretations": [
    {
      "statement": "Os documentos e a mensagem são compatíveis com a rota proposta.",
      "evidenceIds": ["E04", "E05"],
      "hypothesisIds": ["HYP-CIFRA-ROUTE-01"]
    }
  ],
  "authorship": {
    "status": "inconclusive",
    "suspectId": "cifra",
    "hypothesisIds": [],
    "evidenceIds": []
  },
  "support": [
    { "evidenceId": "E04", "role": "supports", "canSupportArrest": true }
  ],
  "contradictions": [],
  "validations": [
    {
      "decision": "INCONCLUSIVE",
      "suspect": "cifra",
      "evidenceScore": 1,
      "procedureScore": 1,
      "hypothesisScore": 0,
      "reasons": ["hypothesis_missing"]
    }
  ],
  "limitations": [
    "Não existe hipótese de autoria sustentada para o capítulo."
  ],
  "conclusionStatus": "inconclusive",
  "conclusion": "E04 e E05 sustentam parte da rota, mas não provam autoria.",
  "conclusionEvidenceIds": ["E04", "E05"],
  "evidenceIds": ["E04", "E05"]
}
```

O exemplo é inconclusivo de propósito. Citar `E04` e `E05` torna explícito o
material avaliado; não transforma essas evidências em prova de autoria.

## Seções obrigatórias e invariantes

### 1. Fatos observados

`facts` contém apenas observações atribuíveis a material descoberto. Cada item
possui uma entrada correspondente em `factSources`, identificada por
`factIndex`, com um ou mais `evidenceIds` existentes no catálogo e descobertos
no caso ativo.

Não escrever em `facts` “o suspeito produziu o registro” quando a evidência diz
somente “foi encontrado um registro”. Ausência de origem, horário ou método
permanece desconhecida.

### 2. Cronologia

`timeline` preserva eventos conhecidos e desconhecidos. `timestamp: null` e
`timeStatus: "unknown"` representam horário ausente; a implementação nunca
inventa uma data para ordenar o evento. Conflitos temporais permanecem marcados,
não são resolvidos automaticamente. Cada evento derivado de prova inclui
`evidenceIds`; uma observação do jogador é rotulada como tal.

### 3. Rota

`route` mantém IDs territoriais ordenados. `routeSupport` explica cada trecho:

- `observed`: sustentado diretamente por evidência;
- `hypothesized`: proposto por hipótese, com suporte identificado;
- `unknown`: sem suporte suficiente.

Todo território precisa existir no catálogo disponível ao caso. Trecho não
comprovado não é promovido a fato. A reconstrução usa as cinco localidades
migradas ou o adaptador legado; não depende de inventar cobertura nacional.

### 4. Autoria

`authorship` é uma interpretação estruturada, nunca um fato. `status` admite
`supported`, `refuted` ou `inconclusive`; `suspectId` pode ser `null`. Para
`supported`, deve existir hipótese `authorship` com estado `supported`, ligada
ao caso e ao suspeito, com `supports` não vazio que passe a política probatória.

Acertar `culprit`, obter candidato único ou emitir mandado não basta. A regra de
`AZ-VALIDATION-001` permanece vinculante: identidade `MATCH` com hipótese
`UNKNOWN` não produz prova de autoria.

### 5. Suporte

`support` lista cada evidência citada a favor e sua função no raciocínio. Um
registro inadmissível continua visível, mas `canSupportArrest: false` impede que
ele sustente autoria ou conclusão aprovada. Redundância não conta como suporte
independente. Confiança declarada da hipótese não substitui prova.

### 6. Contradições

`contradictions` preserva material contrário, inclusive quando a conclusão é
sustentada. Cada item contém `evidenceId`, hipótese afetada e explicação. Uma
contradição não pode ser apagada, reclassificada como suporte ou ocultada para
elevar confiança.

### 7. Limitações

`limitations` registra lacunas de horário, origem, qualidade, integridade,
localização, procedimento ou cobertura probatória. `unknown` não equivale a
`false`. Lista vazia afirma que nenhuma limitação conhecida foi registrada; não
afirma onisciência.

### 8. Conclusão

`conclusionStatus` admite:

| Estado | Regra |
|---|---|
| `supported` | conclusão compatível com validação `APPROVED` e autoria sustentada |
| `refuted` | conclusão rejeitada por contradição material ou validação `DENIED` |
| `inconclusive` | não há bloqueio conclusivo, mas permanece dimensão necessária `UNKNOWN` |

`conclusion` é narrativa, não veredito implícito. `conclusionEvidenceIds` deve
ter ao menos um ID, todos presentes em `evidenceIds`. Até a conclusão
inconclusiva cita o material efetivamente examinado e explica por que ele não é
suficiente. Sem evidência citada, o relatório é inválido.

## Validação do relatório

Uma implementação valida, nesta ordem:

1. o núcleo contra `investigation-report.schema.json` Draft-07;
2. presença das oito seções de domínio: fatos, cronologia, rota, autoria,
   suporte, contradições, limitações e conclusão;
3. `evidenceIds.length >= 1` e referências existentes no caso ativo;
4. correspondência entre `facts` e `factSources` sem fatos sem fonte;
5. separação: nenhuma interpretação ou hipótese é promovida a `facts`;
6. `conclusionEvidenceIds.length >= 1` e subconjunto de `evidenceIds`;
7. referências de hipóteses existentes, com suporte e contradições preservados;
8. coerência com o último `ValidationDecision`, sem converter
   `INCONCLUSIVE` em inocência ou `APPROVED` quando `hypothesisScore = 0` no
   alvo 3.0;
9. ausência de vazamento de evidências não descobertas ou de outro capítulo.

Falhas produzem caminhos e mensagens acionáveis, por exemplo:

```text
conclusionEvidenceIds: conclusão precisa citar ao menos uma evidência.
factSources[2].evidenceIds[0]: evidência E99 não existe no caso ativo.
authorship.status: supported exige hipótese de autoria sustentada.
```

## Persistência e auditoria

O relatório possui rascunho editável e snapshot final. O rascunho referencia
IDs estáveis de evidências e hipóteses; não copia fatos para ocultar sua origem.
Salvar/carregar preserva ordem, contradições, limitações e timestamps nulos.
Publicar cria snapshot imutável associado ao `caseId` e à revisão das hipóteses
usadas. Nova evidência gera nova revisão, sem reescrever o relatório anterior.

## Critérios de aceite de AZ-REPORT-002 — construtor de cronologia

1. Exportar `buildTimeline(events)` como função pura e determinística.
2. Ordenar eventos com timestamp conhecido de forma estável.
3. Manter eventos sem timestamp como `timestamp: null`, rotulados “horário
   desconhecido”, sem inventar data ou posição causal.
4. Marcar conflitos temporais e preservar os eventos conflitantes; não escolher
   silenciosamente qual é verdadeiro.
5. Preservar `evidenceIds`, origem e observações do jogador em cada evento.
6. Não mutar a entrada; suportar lista vazia e dados parciais com diagnóstico.
7. Testar ordem, empate estável, conflito, evento sem timestamp, referências de
   evidência e determinismo.
8. Fornecer espelho ESM sem alterar `dist/app.js`.

## Critérios de aceite de AZ-REPORT-003 — reconstrução de rota

1. Reconstruir uma sequência de territórios válidos no catálogo disponível ao
   caso, sem inferir geografia ausente.
2. Associar a cada trecho `status`, `evidenceIds` e `hypothesisIds`.
3. Marcar trechos sem prova como `hypothesized` ou `unknown`, nunca `observed`.
4. Preservar rotas concorrentes e contradições; não escolher automaticamente a
   rota que coincide com a solução.
5. Rejeitar referência territorial ou probatória inexistente com path e motivo.
6. Manter compatibilidade com as cinco localidades migradas/adaptador 2.x; a
   reconstrução do caso atual não exige o catálogo nacional de 27 UFs.
7. Testar trecho observado, hipotético, desconhecido, contraditório e território
   inválido, sem mutação e com resultado determinístico.
8. Fornecer espelho ESM sem alterar `dist/app.js`.

## Critérios de aceite de AZ-REPORT-004 — editor de relatório

1. Permitir selecionar somente evidências descobertas e hipóteses do caso ativo.
2. Exibir e editar separadamente fatos e interpretações, com rótulos acessíveis.
3. Oferecer as oito seções obrigatórias e validar referências antes de publicar.
4. Impedir publicação sem evidências ou sem `conclusionEvidenceIds`, com erro
   acionável; permitir rascunho incompleto.
5. Permitir `conclusionStatus: inconclusive` sem tratá-lo como derrota, inocência
   ou conclusão sustentada.
6. Manter contradições e limitações visíveis; evidência inadmissível pode ser
   citada para contexto, mas não como suporte apto à prisão.
7. Persistir o rascunho e restaurá-lo sem perder `null`, ordem, IDs ou revisões;
   publicação produz snapshot imutável.
8. Navegação completa por teclado, foco previsível e anúncios de validação para
   tecnologia assistiva.
9. Escapar conteúdo do jogador; não inserir texto externo por `innerHTML`.
10. Testar edição, persistência, separação fato/interpretação, conclusão
    inconclusiva, bloqueio sem evidência, isolamento por capítulo e acessibilidade.

## Fora de escopo

```text
Não alterar src/contracts/investigation-report.schema.json
Não implementar timeline-builder, reconstrutor de rota ou editor
Não alterar HypothesisRecord ou ValidationDecision
Não alterar arrest-validator, evidence-policy, dist/game.json ou dist/app.js
Não materializar relatório no save nesta tarefa de especificação
```
