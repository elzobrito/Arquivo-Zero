# AZ-SUSPECT-001 — Perfil multidimensional de suspeitos

**Status:** especificação 3.0  
**Escopo:** contrato de dados e regras futuras; não altera o motor, o dossiê ou a emissão de mandado atual.  
**Dependência:** `AZ-ARCH-001`

## Objetivo

Substituir o perfil plano `name + specialty + vehicle` por um registro que
separe características globais do suspeito das circunstâncias de cada caso. A
identificação deve resultar do cruzamento de dimensões compartilhadas, hipótese
e evidência, nunca de um atributo isolado.

Ausência de dado significa **desconhecido**, não `false`, incompatível ou álibi.
Relações usam IDs estáveis; texto de apresentação não funciona como chave.

## SuspectRecord 3.0

```json
{
  "id": "suspect-byte-azul",
  "codename": "Byte Azul",
  "capabilities": ["network-access", "credential-cloning"],
  "methods": ["social-engineering", "token-reuse"],
  "mobility": [
    { "mode": "road", "vehicleClass": "car", "details": null }
  ],
  "caseProfiles": {
    "case-horus": {
      "opportunity": {
        "status": "unknown",
        "window": null,
        "evidenceIds": []
      },
      "possibleLocationIds": ["municipality-sao-paulo"],
      "alibis": [
        {
          "id": "alibi-byte-001",
          "claim": "Declaração ainda não confirmada.",
          "status": "unverified",
          "supportingEvidenceIds": [],
          "contradictingEvidenceIds": []
        }
      ]
    }
  }
}
```

### Campos globais

| Campo | Obrigatório | Tipo | Regra |
|---|---:|---|---|
| `id` | sim | string | ID estável, único e não reutilizável. |
| `codename` | sim | string | Nome de exibição; não é prova de identidade. |
| `capabilities` | sim | string[] | Capacidades técnicas ou operacionais; valores podem ser compartilhados. |
| `methods` | sim | string[] | Métodos conhecidos; não equivalem automaticamente a autoria. |
| `mobility` | sim | object[] | Modos de deslocamento possíveis. Cada item exige `mode`; `vehicleClass` e `details` são opcionais ou `null`. |
| `links` | não | object[] | Vínculos por `suspectId`, com `type` e `evidenceIds`; vínculo ausente não significa inexistente. |
| `metadata` | não | object | Proveniência editorial, versão e notas sem efeito decisório automático. |

### Campos específicos do caso

`caseProfiles` é um mapa indexado por `caseId`. O perfil de um caso não altera
os atributos globais e não vaza automaticamente para outro capítulo.

| Campo | Obrigatório | Tipo | Regra |
|---|---:|---|---|
| `opportunity.status` | sim | `supported`, `contradicted` ou `unknown` | Só muda por avaliação explícita; ausência nunca vira `contradicted`. |
| `opportunity.window` | não | object ou null | Intervalo temporal conhecido; `null` mantém a incerteza. |
| `opportunity.evidenceIds` | sim | string[] | Evidências que sustentam ou contradizem a oportunidade. |
| `possibleLocationIds` | sim | string[] | IDs territoriais possíveis, não confirmação de presença. |
| `alibis` | sim | object[] | Alegações preservadas mesmo quando não verificadas. |
| `alibis[].id` | sim | string | ID estável do álibi. |
| `alibis[].claim` | sim | string | Alegação, separada da conclusão do sistema. |
| `alibis[].status` | sim | `verified`, `refuted` ou `unverified` | `verified`/`refuted` exigem evidência válida. |
| `alibis[].supportingEvidenceIds` | sim | string[] | Suporte probatório admissível. |
| `alibis[].contradictingEvidenceIds` | sim | string[] | Evidência contrária, preservada junto do suporte. |

## Regras anti-trivialidade

1. Em dificuldade normal, nenhum valor isolado de codinome, capacidade, método,
   mobilidade, oportunidade ou localização pode deixar exatamente um candidato.
2. Ao menos dois suspeitos compartilham parcialmente cada capacidade ou método
   usado como pista discriminante no caso.
3. A combinação conclusiva exige múltiplas dimensões independentes; duplicar a
   mesma alegação em dois campos não conta como duas dimensões.
4. Um álibi só exclui candidato quando `status=verified` e existe ao menos um
   `supportingEvidenceId` resolvido para evidência válida segundo a política
   probatória vigente.
5. Álibi `unverified`, dado ausente, array vazio ou origem desconhecida produz
   resultado indeterminado, nunca exclusão.
6. Evidência contraditória não é descartada: suporte e contradição permanecem
   representáveis e a decisão deve explicar ambos.

## Mandado revisado — alvo de `AZ-SUSPECT-004`

O mandado futuro exige simultaneamente:

```text
suspeito único
+ hipótese explícita de autoria
+ suporte probatório mínimo e aplicável
+ conformidade processual
= decisão explicada de emitir ou recusar
```

- Suspeito único significa unicidade após avaliação multidimensional, não após
  correspondência de um campo.
- A hipótese referencia o suspeito, fatos e evidências que sustentam autoria.
- Suporte probatório respeita admissibilidade, integridade e qualidade definidas
  pela política de evidências.
- Conformidade verifica estado investigativo e requisitos processuais.
- Toda recusa informa dimensões insuficientes, desconhecidas ou contraditórias.

**Isolamento:** `AZ-SUSPECT-001` não altera `filterSuspects`, `issueWarrant`,
`submitDossier`, `dist/app.js` nem o comportamento atual em que um campo pode
emitir mandado. A mudança operacional pertence exclusivamente a
`AZ-SUSPECT-004` e suas dependências.

## Critérios de aceite de `AZ-SUSPECT-002`

- Byte Azul, Null, Cifra e Vértice recebem IDs estáveis e perfis conformes a
  `SuspectRecord 3.0`.
- Os quatro preservam codinomes, métodos e mobilidade já declarados no caso.
- Nenhum suspeito é identificável por um único atributo em dificuldade normal;
  o teste demonstra compartilhamento real de capacidade e método.
- Dados novos necessários à não trivialidade são marcados como conteúdo novo
  aprovado; lacunas não são preenchidas silenciosamente.
- Perfis por capítulo permanecem isolados e todos os capítulos continuam
  solucionáveis.

## Critérios de aceite de `AZ-SUSPECT-003`

- O serviço avalia cada suspeito por múltiplas dimensões e retorna, por dimensão,
  `compatible`, `incompatible` ou `unknown` com explicação.
- Ausência de campo, lista vazia ou álibi não verificado retorna `unknown`, não
  elimina o suspeito.
- Consultas são determinísticas, independentes do DOM e não modificam o caso.
- Evidência de suporte e de contradição permanece acessível no resultado.
- IDs territoriais, de suspeitos, casos, álibis e evidências inválidos são
  diagnosticados; não há correspondência por texto de exibição.

## Fora de escopo

- Migrar os quatro suspeitos (`AZ-SUSPECT-002`).
- Implementar o serviço de candidatos (`AZ-SUSPECT-003`).
- Alterar UI, dossiê ou política de mandado (`AZ-SUSPECT-004`).

