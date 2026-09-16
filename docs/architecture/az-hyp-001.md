# AZ-HYP-001 — Ciclo de hipóteses

**Tarefa:** `AZ-HYP-001`  
**Tipo:** especificação de governança  
**Data:** 2026-09-16  
**Dependência:** `AZ-ARCH-001`  
**Contrato de referência:** `src/contracts/hypothesis-record.schema.json`

## Objetivo e limites

Uma hipótese é uma afirmação investigativa revisável. Ela organiza evidências e
contradições, mas não se torna verdadeira por ter sido cadastrada nem por receber
confiança alta. O ciclo cobre autoria, rota, destino, método, vínculo e
cronologia.

Esta especificação não altera o motor, o save, o schema ou a decisão de prisão.
Esses efeitos pertencem às tarefas de implementação indicadas ao final.

```text
EvidenceRecord[]
  → HypothesisRecord[]
  → ValidationDecision.hypothesisScore
```

Identificar um suspeito não equivale a provar autoria.

## HypothesisRecord 3.0

O contrato mínimo já publicado é preservado. Extensões abaixo usam
`additionalProperties: true` e devem ser formalizadas em revisão futura do
schema quando passarem a ser obrigatórias.

```json
{
  "id": "HYP-C01-AUTHORSHIP-01",
  "type": "authorship",
  "statement": "S-03 praticou o fato investigado no capítulo C01.",
  "supports": ["E03", "E11"],
  "contradictions": ["E06"],
  "confidence": "medium",
  "status": "active",
  "caseId": "C01",
  "subjectIds": ["S-03"],
  "revision": 2,
  "history": [
    {
      "revision": 1,
      "changedAt": "2026-09-16T12:00:00-03:00",
      "statement": "S-03 pode ter participado do fato.",
      "supports": ["E03"],
      "contradictions": [],
      "confidence": "low",
      "status": "active"
    }
  ]
}
```

### Campos canônicos

| Campo | Regra |
|---|---|
| `id` | Identificador estável da hipótese. Não é reutilizado após encerramento. |
| `type` | `authorship`, `route`, `method`, `link` ou `timeline`, conforme o schema atual. |
| `statement` | Proposição declarada e verificável; não é conclusão automática. |
| `supports` | IDs de evidências apresentadas a favor. Não implica admissibilidade. |
| `contradictions` | IDs de evidências contrárias. Permanecem visíveis durante todo o ciclo. |
| `confidence` | Declaração do investigador: `low`, `medium` ou `high`. Não é score probatório. |
| `status` | Estado semântico do ciclo, definido abaixo. |

### Extensões opcionais

| Campo | Regra |
|---|---|
| `caseId` | Caso ou capítulo ao qual a hipótese pertence. |
| `subjectIds` | Entidades envolvidas, sem inferir culpabilidade. |
| `revision` | Número inteiro monotônico da versão corrente. |
| `history` | Snapshots anteriores suficientes para reconstruir cada revisão. |
| `closedAt` | Instante de encerramento, ausente enquanto a hipótese estiver ativa. |
| `reasons` | Explicações estruturadas de consistência, enfraquecimento ou refutação. |

O domínio de produto inclui `destination`. Até o schema enumerá-lo, destino é
representado por uma hipótese `route` cuja declaração e metadados distinguem o
ponto final. `timeline` é o identificador técnico atual de cronologia. Não se
grava `destination` ou `chronology` diretamente em `type` enquanto o schema
vigente não os aceitar.

## Estados do ciclo

| Estado | Significado | Transições esperadas |
|---|---|---|
| `active` | Afirmação aberta, ainda em investigação. | Pode permanecer ativa ou ir a qualquer estado avaliado. |
| `supported` | Há suporte probatório válido e as contradições conhecidas não impedem a sustentação. | Pode ser enfraquecida, refutada ou reaberta como ativa após nova revisão. |
| `weakened` | Suporte perdeu força ou surgiu contradição relevante, sem refutação suficiente. | Pode voltar a ativa/sustentada ou avançar a refutada/inconclusiva. |
| `refuted` | Evidência válida contradiz materialmente a proposição. | Nova revisão pode gerar outra hipótese; o histórico refutado não é apagado. |
| `inconclusive` | O material disponível não permite sustentar nem refutar. | Pode voltar a ativa quando houver novo material. |

Estado é resultado explicável, não edição manual sem motivo. `supported` não
autoriza prisão isoladamente: a validação ainda considera identidade,
localização, requisitos essenciais, procedimento e prazo.

## Evidência, contradição e confiança

- `supports` e `contradictions` aceitam somente IDs existentes no catálogo do
  caso. Um mesmo registro não deve ocupar os dois lados na mesma revisão.
- A avaliação usa o `EvidenceRecord` normalizado em memória. O ID persistido não
  carrega sozinho admissibilidade, qualidade ou integridade.
- Evidência inadmissível continua visível e pode explicar a investigação, mas
  não sustenta prisão.
- Evidência redundante não vale como confirmação independente apenas por estar
  repetida em mais de uma hipótese.
- `confidence` registra a avaliação humana do investigador. Alterá-la não cria
  evidência, não muda admissibilidade e não aumenta diretamente
  `hypothesisScore`.
- Uma contradição nunca é apagada para elevar a confiança ou promover o estado.

## Revisão e persistência

Toda edição que altere `statement`, `supports`, `contradictions`, `confidence` ou
`status` incrementa `revision` e acrescenta ao `history` o snapshot anterior.
O save persiste a versão corrente e o histórico; carregar e salvar novamente
não pode achatar, reordenar ou recriar revisões.

Encerrar uma hipótese define seu estado avaliado e, quando aplicável,
`closedAt`. Reabrir cria nova revisão. Excluir visualmente não elimina o registro
histórico usado em decisões e relatórios anteriores.

## Critérios de AZ-HYP-002 — serviço de hipóteses

1. Criar, editar, encerrar e reabrir hipóteses com IDs estáveis.
2. Validar referências de suporte e contradição contra o catálogo do caso.
3. Calcular consistência de forma explicável, sem transformar hipótese em fato.
4. Preservar contradições e todo o histórico de revisão no save.
5. Manter compatibilidade com saves legados sem hipóteses, normalizando-os para
   coleção vazia sem inventar registros.

## Critérios de AZ-HYP-003 — quadro de hipóteses

1. Permitir declarar a afirmação e escolher autoria, rota/destino, método,
   vínculo ou cronologia.
2. Permitir selecionar separadamente evidências de suporte e de contradição.
3. Exibir estado, confiança declarada, motivos e histórico sem apresentar
   confiança como prova.
4. Tornar contradições e evidências inadmissíveis visíveis com seu contexto.
5. Validar o fluxo completo por teclado e leitor de tela.

## Critérios de AZ-HYP-004 — força probatória

1. A política é configurável por caso e avalia suficiência, não contagem bruta.
2. `evidence-policy.canSupportArrest(record)` é a interface que
   `arrest-validator` consulta para decidir se cada registro normalizado pode
   participar do cálculo de `hypothesisScore`.
3. A consulta recebe o `EvidenceRecord` normalizado pelo adaptador em memória;
   não presume que `admissibility`, `quality` ou `integrity` existam no JSON em
   disco.
4. Evidência inadmissível não contribui; redundância não infla o score; material
   desconhecido ou parcial segue a política explícita de confirmação.
5. `validateArrest` retorna `hypothesisScore > 0` somente quando existe hipótese
   de autoria sustentada e vinculada ao caso. Acertar o suspeito, por si só, não
   satisfaz esse critério.
6. Requisitos essenciais continuam suportados e o cálculo produz motivos
   estruturados para aprovação, negação ou inconclusão.

Essa integração é alvo exclusivo de `AZ-HYP-004`. `AZ-EVIDENCE-003` fornece a
política pura, mas não altera `arrest-validator` nem a lógica vigente de mandado.

## Nota vinculante para AZ-QA-EVIDENCE-001

A auditoria da fundação probatória deve verificar:

1. `evidence-policy.js` lê `admissibility` do registro normalizado pelo adaptador
   em memória, não diretamente do disco.
2. `dist/game.json` contém apenas `source: null` nos registros legados;
   `admissibility`, `quality` e `integrity` permanecem defaults do adaptador.
3. `canSupportArrest` funciona com os valores normalizados dos **14 registros**
   existentes: E01–E08 e E11–E16. E09 e E10 nunca foram definidos e não devem
   ser criados pela auditoria.

## Fora de escopo

```text
Não alterar src/contracts/hypothesis-record.schema.json
Não alterar evidence-policy.js
Não alterar arrest-validator.js
Não alterar dist/game.json
Não alterar emissão de mandado
Não materializar hipóteses no save nesta tarefa de especificação
```
