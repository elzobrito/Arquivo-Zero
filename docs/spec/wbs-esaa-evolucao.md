# WBS ESAA para a construção do Arquivo Zero

## Transformação da proposta arquitetural em tarefas governadas

**Versão:** 2.0  
**Data:** 16/09/2026  
**Produto:** Arquivo Zero — Caçada Digital  
**Entrada:** PRD Investigador Brasil e Proposta de Evolução Arquitetural v2  
**Finalidade:** catálogo de tarefas para posterior admissão no roadmap do ESAA-Core, organizado pelo fluxo Evidência → Restrição → Hipótese → Validação → Relatório  

> Este documento define a decomposição do trabalho. Ele não altera manualmente `.roadmap/activity.jsonl`, `roadmap.json` ou outras projeções do ESAA. A admissão deve ocorrer pelo fluxo do orquestrador, preservando o log append-only e as projeções determinísticas.

---

# 1. Objetivo da transformação

Converter os seis eixos da proposta em unidades de trabalho pequenas, verificáveis, ordenadas por dependências e compatíveis com execução governada:

1. sistema de restrições;
2. expansão territorial;
3. modelagem rica de suspeitos;
4. relatórios e hipóteses;
5. minijogos produtores de evidência;
6. progressão profissional.

A WBS inclui também estabilização, fundação arquitetural, segurança, compatibilidade, testes e documentação.

---

# 2. Regra canônica do produto

Todas as tarefas devem preservar o princípio:

```text
IDENTIFICAR O CRIMINOSO NÃO É PROVAR SUA RESPONSABILIDADE
```

A conclusão válida exige:

```text
suspeito correto
AND localização correta
AND hipótese de autoria sustentada
AND força probatória suficiente
AND evidências essenciais presentes
AND procedimento válido
AND prazo não encerrado
```

Nenhuma tarefa poderá simplificar a vitória para `suspeito correto = caso resolvido`.


---

# 3. Fluxo mestre da construção

A WBS passa a ser governada pelo seguinte fluxo funcional e arquitetural:

```text
EVIDÊNCIA
    ↓
RESTRIÇÃO
    ↓
HIPÓTESE
    ↓
VALIDAÇÃO
    ↓
RELATÓRIO
```

Esse fluxo estabelece a ordem das responsabilidades do produto:

1. **Evidência:** registrar o que foi encontrado, sua origem, qualidade, admissibilidade e integridade.
2. **Restrição:** interpretar a evidência como condição computável, sem convertê-la automaticamente em conclusão.
3. **Hipótese:** combinar restrições e formular uma explicação provisória sobre autoria, rota, método ou evento.
4. **Validação:** verificar identidade, localização, coerência, força probatória, evidências essenciais, procedimento e prazo.
5. **Relatório:** documentar fatos, inferências, contradições, limitações e conclusão reproduzível.

## 3.1 Invariantes do fluxo

- nenhuma restrição pode existir sem origem rastreável ou regra declarada;
- nenhuma hipótese pode ser validada sem evidências vinculadas;
- nenhuma validação pode ignorar evidências contraditórias relevantes;
- nenhum relatório pode apresentar hipótese como fato observado;
- nenhuma prisão pode ser validada somente porque o suspeito correto foi identificado;
- toda etapa deve produzir saída consumível pela etapa seguinte;
- falha em uma etapa deve gerar diagnóstico explicável, não correção silenciosa.

## 3.2 Contratos entre etapas

```text
EvidenceRecord[]
    → ConstraintEvaluation[]
    → HypothesisRecord[]
    → ValidationDecision
    → InvestigationReport
```

Cada contrato deverá ser versionado, validado e testável sem dependência da interface.

---

# 4. Convenções das tarefas

## 4.1 Identificadores

- `AZ-SPEC-*`: especificação e contratos;
- `AZ-HOTFIX-*`: correção do vertical slice;
- `AZ-ARCH-*`: fundação arquitetural;
- `AZ-CONSTRAINT-*`: restrições;
- `AZ-SUSPECT-*`: suspeitos;
- `AZ-HYP-*`: hipóteses, mandado e prisão;
- `AZ-REPORT-*`: relatórios;
- `AZ-TERR-*`: território;
- `AZ-MINI-*`: minijogos;
- `AZ-CAREER-*`: progressão;
- `AZ-QA-*`: qualidade, integração e publicação.

## 4.2 Tipos de tarefa sugeridos

- `spec`: contratos, ADRs, esquemas e documentação;
- `impl`: código de produção;
- `test`: testes, validadores e fixtures;
- `content`: migração e criação de dados do jogo;
- `qa`: revisão independente e verificação integrada.

## 4.3 Estados

```text
todo → in_progress → review → done
```

Uma tarefa só deve ser elegível quando todas as dependências estiverem concluídas.

## 4.4 Conteúdo mínimo de cada tarefa

- objetivo;
- escopo;
- dependências;
- caminhos permitidos;
- fora de escopo;
- critérios de aceite;
- verificações obrigatórias;
- evidências de conclusão.

---

# 5. Estrutura da WBS

```text
0. Governança e baseline
1. Estabilização
2. Fundação arquitetural
3. Evidências estruturadas
4. Sistema de restrições
5. Modelagem rica de suspeitos
6. Hipóteses
7. Validação, mandado e prisão
8. Relatórios investigativos
9. Expansão territorial
10. Minijogos produtores de evidência
11. Progressão profissional
12. Integração, QA e publicação
```

---

# 6. Catálogo de tarefas ESAA

## Épico 0 — Governança e baseline

### AZ-SPEC-001 — Congelar baseline verificável

**Tipo:** `spec`  
**Dependências:** nenhuma  
**Objetivo:** registrar os arquivos, hashes, testes e contratos que representam o vertical slice antes da evolução.

**Escopo**

- registrar hashes de `app.js`, `game.json`, `index.html` e `styles.css`;
- registrar comandos de verificação existentes;
- documentar cinco cidades, nove cenários, quatro capítulos e invariantes atuais;
- registrar a regra canônica de prisão.

**Caminhos permitidos**

- `docs/baseline/**`
- `docs/architecture/**`
- `tests/baseline/**`

**Fora de escopo**

- alterar o motor;
- alterar conteúdo do caso;
- editar projeções ESAA manualmente.

**Critérios de aceite**

- baseline reproduzível documentado;
- hashes dos arquivos-alvo registrados;
- comandos de verificação executáveis;
- regra “identificar não é provar” explicitada.

**Verificação**

- executar verificadores atuais;
- validar hashes;
- revisar documentação contra o código.

---

### AZ-SPEC-002 — Definir ADR da evolução incremental

**Tipo:** `spec`  
**Dependências:** AZ-SPEC-001  
**Objetivo:** decidir formalmente por migração incremental, versionamento de esquema e compatibilidade com casos 2.x.

**Caminhos permitidos:** `docs/adr/**`, `docs/architecture/**`

**Critérios de aceite**

- ADR define arquitetura-alvo;
- proíbe reescrita total sem nova decisão;
- define adaptadores entre esquemas;
- define fonte canônica de cenário para remover duplicações;
- define estratégia de rollback.

**Verificação:** revisão documental independente.

---

## Épico 1 — Estabilização do vertical slice

### AZ-HOTFIX-001 — Impedir ação ou viagem sem saldo

**Tipo:** `impl`  
**Dependências:** AZ-SPEC-001  
**Objetivo:** impedir que uma tentativa impossível produza derrota automática ou saldo negativo.

**Caminhos permitidos:** `src/**`, `dist/app.js`, `tests/**`

**Critérios de aceite**

- destinos com custo superior ao saldo ficam indisponíveis ou são recusados sem consumir tempo;
- ações com custo superior ao saldo seguem a mesma política;
- a autorização de viagem nunca exibe saldo negativo;
- prisão no limite exato obedece à regra aprovada do caso.

**Verificação**

- testes de custo menor, igual e maior que o saldo;
- teste de viagem;
- teste de investigação;
- teste de prisão.

---

### AZ-HOTFIX-002 — Recuperar save inválido

**Tipo:** `impl`  
**Dependências:** AZ-SPEC-001  
**Objetivo:** evitar falha de renderização quando o save referenciar localização, cenário ou capítulo inexistente.

**Critérios de aceite**

- save válido é preservado;
- save inválido é isolado;
- o jogador retorna a um estado inicial válido;
- diagnóstico é registrado sem expor dados sensíveis.

**Verificação:** fixtures de save válido, JSON corrompido, localização inexistente e cenário removido.

---

### AZ-HOTFIX-003 — Sanitizar importação e mensagens

**Tipo:** `impl`  
**Dependências:** AZ-SPEC-001  
**Objetivo:** impedir execução de conteúdo ativo proveniente de casos importados.

**Critérios de aceite**

- conteúdo importado é tratado como texto;
- esquema e tamanho são validados;
- mensagens de vitória, resultados e briefings não executam HTML;
- casos inválidos produzem diagnóstico acionável.

**Verificação:** testes com payloads HTML, scripts, atributos de evento e JSON excessivo.

---

### AZ-HOTFIX-004 — Corrigir semântica de reinício

**Tipo:** `impl`  
**Dependências:** AZ-SPEC-001  
**Objetivo:** diferenciar reiniciar capítulo, reiniciar campanha e zerar carreira.

**Critérios de aceite**

- cada ação informa o que será apagado;
- reiniciar capítulo preserva campanha e carreira;
- reiniciar campanha redefine seu cursor;
- zerar carreira exige ação específica;
- testes confirmam as três operações.

---

### AZ-HOTFIX-005 — Consolidar cenário canônico

**Tipo:** `content`  
**Dependências:** AZ-SPEC-002  
**Objetivo:** eliminar duplicação divergente entre cenários da raiz e capítulo Cifra.

**Critérios de aceite**

- existe uma única fonte canônica por cenário;
- adaptador mantém compatibilidade;
- os nove cenários continuam solucionáveis;
- o verificador acusa futuras duplicações divergentes.

---

### AZ-QA-001 — Revisar estabilização

**Tipo:** `qa`  
**Dependências:** AZ-HOTFIX-001, AZ-HOTFIX-002, AZ-HOTFIX-003, AZ-HOTFIX-004, AZ-HOTFIX-005  
**Objetivo:** realizar revisão independente do marco de estabilidade.

**Critérios de aceite**

- todos os testes passam;
- nenhum bug P1 conhecido permanece;
- importação insegura é rejeitada;
- campanha atual permanece jogável.

---

## Épico 2 — Fundação arquitetural

### AZ-ARCH-001 — Definir esquema de caso 3.0

**Tipo:** `spec`  
**Dependências:** AZ-SPEC-002, AZ-QA-001  
**Objetivo:** especificar território, evidência, restrição, suspeito, hipótese, minijogo, relatório e progressão.

**Critérios de aceite**

- `schemaVersion` obrigatório;
- IDs e referências possuem regras explícitas;
- esquemas definem campos obrigatórios e opcionais;
- política de prisão está representada;
- exemplos válidos e inválidos incluídos.

---

### AZ-ARCH-002 — Implementar validador de esquema

**Tipo:** `impl`  
**Dependências:** AZ-ARCH-001  
**Objetivo:** validar casos antes do carregamento.

**Critérios de aceite**

- retorna `PASS`, `WARN` ou `FAIL`;
- informa caminho e motivo do problema;
- rejeita referências quebradas;
- não altera o caso durante a validação;
- pode ser executado em CLI e testes.

---

### AZ-ARCH-003 — Implementar adaptador 2.x para 3.0

**Tipo:** `impl`  
**Dependências:** AZ-ARCH-001, AZ-ARCH-002  
**Objetivo:** preservar o caso atual no novo runtime.

**Critérios de aceite**

- o caso atual carrega sem edição manual;
- ações e evidências antigas são normalizadas;
- campanha, cenários e saves compatíveis são preservados;
- perdas de semântica geram avisos explícitos.

---

### AZ-ARCH-004 — Extrair domínio do DOM

**Tipo:** `impl`  
**Dependências:** AZ-ARCH-003  
**Objetivo:** separar regras de tempo, viagem, evidência, dossiê e prisão da renderização.

**Critérios de aceite**

- regras críticas são testáveis sem navegador;
- UI consome serviços de aplicação;
- não há alteração perceptível no vertical slice;
- módulos possuem responsabilidades documentadas.

---

### AZ-ARCH-005 — Implementar máquina de estados explícita

**Tipo:** `impl`  
**Dependências:** AZ-ARCH-004  
**Objetivo:** substituir combinações implícitas de flags por transições validadas.

**Critérios de aceite**

- estados e transições estão enumerados;
- transição inválida é recusada;
- save persiste o estado atual;
- compatibilidade com `warrant`, `finished` e `rewarded` é testada.

---

### AZ-QA-002 — Verificar compatibilidade arquitetural

**Tipo:** `qa`  
**Dependências:** AZ-ARCH-002, AZ-ARCH-003, AZ-ARCH-004, AZ-ARCH-005  
**Critérios de aceite**

- nove cenários continuam solucionáveis;
- saves suportados carregam;
- regras funcionam sem DOM;
- esquema inválido falha de forma fechada.

---

## Épico 3 — Evidências estruturadas

### AZ-EVIDENCE-001 — Especificar o registro de evidência

**Tipo:** `spec`  
**Dependências:** AZ-ARCH-001  
**Objetivo:** definir a entidade de evidência que alimentará restrições, hipóteses, validações e relatórios.

**Escopo**

- identidade, título e descrição;
- origem e método de obtenção;
- categoria e tipo;
- integridade e admissibilidade;
- qualidade e completude;
- temporalidade, quando conhecida;
- vínculos com local, suspeito, ação e minijogo;
- distinção entre fato observado e interpretação.

**Critérios de aceite**

- campos obrigatórios e opcionais documentados;
- dados ausentes não são convertidos em falsidade;
- evidência contraditória pode ser preservada;
- esquema suporta evidências legadas por adaptação;
- todo registro possui procedência rastreável.

---

### AZ-EVIDENCE-002 — Implementar repositório e serviço de evidências

**Tipo:** `impl`  
**Dependências:** AZ-EVIDENCE-001, AZ-ARCH-004  
**Objetivo:** centralizar descoberta, catalogação, consulta e vínculo das evidências.

**Critérios de aceite**

- evidências não são gravadas diretamente pela interface;
- descoberta duplicada é idempotente;
- histórico de origem é preservado;
- consultas por tipo, origem, local e relação são determinísticas;
- serviço é testável sem DOM.

---

### AZ-EVIDENCE-003 — Implementar admissibilidade, integridade e qualidade

**Tipo:** `impl`  
**Dependências:** AZ-EVIDENCE-002  
**Objetivo:** impedir que toda pista encontrada seja tratada automaticamente como prova suficiente.

**Critérios de aceite**

- admissibilidade é distinta de relevância;
- qualidade não altera o fato observado;
- evidência incompleta pode exigir confirmação;
- evidência inadmissível permanece visível, mas não sustenta mandado ou prisão;
- decisão produz explicação.

---

### AZ-EVIDENCE-004 — Migrar evidências do caso atual

**Tipo:** `content`  
**Dependências:** AZ-EVIDENCE-001, AZ-ARCH-003  
**Objetivo:** adaptar E01–E16 ao novo esquema sem inventar fatos implícitos.

**Critérios de aceite**

- todos os IDs existentes são preservados;
- origem desconhecida permanece explicitamente desconhecida;
- evidências de tenentes não vazam indevidamente para capítulos de Cifra;
- campanha legada continua solucionável.

---

### AZ-EVIDENCE-005 — Criar quadro de evidências estruturado

**Tipo:** `impl`  
**Dependências:** AZ-EVIDENCE-002, AZ-EVIDENCE-003  
**Objetivo:** exibir fatos, origem, qualidade, admissibilidade e relações sem revelar conclusões automáticas.

**Critérios de aceite**

- fatos e interpretações possuem apresentação distinta;
- filtros não alteram o estado do caso;
- evidências contraditórias permanecem disponíveis;
- interface é acessível por teclado;
- evidências não descobertas não aparecem.

---

### AZ-QA-EVIDENCE-001 — Verificar a fundação probatória

**Tipo:** `qa`  
**Dependências:** AZ-EVIDENCE-003, AZ-EVIDENCE-004, AZ-EVIDENCE-005  
**Critérios de aceite**

- toda evidência ativa possui origem ou marca explícita de origem desconhecida;
- evidência inadmissível não valida prisão;
- evidência parcial não é promovida silenciosamente a completa;
- casos legados continuam carregando.

---

## Épico 4 — Sistema de restrições

### AZ-CONSTRAINT-001 — Especificar modelo triestado

**Tipo:** `spec`  
**Dependências:** AZ-ARCH-001  
**Objetivo:** definir resultados `MATCH`, `NO_MATCH` e `UNKNOWN`, composição e explicação.

**Critérios de aceite**

- semântica dos três resultados definida;
- tabela verdade de `AND`, `OR` e `NOT` documentada;
- comportamento com dados ausentes definido;
- formato de explicação definido.

---

### AZ-CONSTRAINT-002 — Implementar operadores escalares

**Tipo:** `impl`  
**Dependências:** AZ-CONSTRAINT-001, AZ-ARCH-004, AZ-EVIDENCE-003  
**Escopo:** igualdade, diferença, contém, inclusão, exclusão e intervalos.

**Critérios de aceite**

- operadores são puros;
- retornam resultado triestado e explicação;
- tipos incompatíveis falham de forma controlada;
- cobertura inclui limites e dados ausentes.

---

### AZ-CONSTRAINT-003 — Implementar composição lógica

**Tipo:** `impl`  
**Dependências:** AZ-CONSTRAINT-002  
**Objetivo:** suportar árvores de restrições com `AND`, `OR` e `NOT`.

**Critérios de aceite**

- composição respeita tabela verdade aprovada;
- explicação preserva subresultados;
- profundidade excessiva é limitada;
- referências circulares são rejeitadas.

---

### AZ-CONSTRAINT-004 — Implementar restrições territoriais

**Tipo:** `impl`  
**Dependências:** AZ-CONSTRAINT-003, AZ-TERR-001  
**Escopo:** região, UF, município, infraestrutura, setor econômico e proximidade cadastrada.

**Critérios de aceite**

- nenhuma geografia é inferida fora do catálogo;
- candidatos sem dado retornam `UNKNOWN`;
- explicações citam atributo e evidência de origem.

---

### AZ-CONSTRAINT-005 — Integrar evidência e restrição

**Tipo:** `impl`  
**Dependências:** AZ-CONSTRAINT-003, AZ-EVIDENCE-002, AZ-ARCH-003  
**Objetivo:** permitir que evidências ativem ou sustentem restrições.

**Critérios de aceite**

- evidência registra origem, admissibilidade e confiabilidade;
- restrição referencia evidência válida;
- evidência não descoberta não afeta candidatos;
- evidência contraditória é preservada.

---

### AZ-CONSTRAINT-006 — Criar painel explicável de filtragem

**Tipo:** `impl`  
**Dependências:** AZ-CONSTRAINT-005, AZ-SUSPECT-003  
**Objetivo:** apresentar sobreviventes, eliminados, indeterminados e justificativas.

**Critérios de aceite**

- jogador escolhe evidências a cruzar;
- cada alteração é explicável;
- solução não é revelada automaticamente;
- interface é navegável por teclado.

---

### AZ-CONSTRAINT-007 — Validar unicidade e solucionabilidade

**Tipo:** `test`  
**Dependências:** AZ-CONSTRAINT-005, AZ-SUSPECT-004  
**Objetivo:** garantir que casos publicados tenham solução prevista.

**Critérios de aceite**

- detecta zero soluções;
- detecta soluções múltiplas ao final;
- detecta atributo único indevido;
- valida pistas essenciais e orçamento mínimo.

---

## Épico 5 — Modelagem rica de suspeitos

### AZ-SUSPECT-001 — Especificar perfil multidimensional

**Tipo:** `spec`  
**Dependências:** AZ-ARCH-001  
**Escopo:** identidade, capacidade, oportunidade, método, mobilidade, vínculos e álibi.

**Critérios de aceite**

- campos globais e específicos do caso separados;
- relações possuem IDs estáveis;
- suporte e contradição são representáveis;
- dados ausentes não significam falsidade.

---

### AZ-SUSPECT-002 — Migrar os quatro suspeitos atuais

**Tipo:** `content`  
**Dependências:** AZ-SUSPECT-001, AZ-ARCH-003  
**Objetivo:** representar Byte Azul, Null, Cifra e Vértice no novo esquema.

**Critérios de aceite**

- nenhum suspeito é identificável por um único atributo normal;
- capítulos permanecem solucionáveis;
- métodos atuais são preservados;
- dados inventados são marcados como conteúdo novo aprovado.

---

### AZ-SUSPECT-003 — Implementar serviço de candidatos

**Tipo:** `impl`  
**Dependências:** AZ-SUSPECT-001, AZ-CONSTRAINT-003  
**Objetivo:** avaliar suspeitos por múltiplas restrições.

**Critérios de aceite**

- resultado triestado por suspeito;
- explicação por dimensão;
- não confunde ausência de dado com exclusão;
- filtros são determinísticos.

---

### AZ-SUSPECT-004 — Redesenhar dossiê e política de mandado

**Tipo:** `impl`  
**Dependências:** AZ-SUSPECT-002, AZ-SUSPECT-003, AZ-HYP-003  
**Critérios de aceite**

- nome isolado não emite mandado;
- atributos compartilhados exigem cruzamento;
- hipótese de autoria é obrigatória;
- suporte probatório mínimo é obrigatório;
- decisão explica aprovação ou recusa.

---

### AZ-QA-003 — Revisar dedução de suspeitos

**Tipo:** `qa`  
**Dependências:** AZ-SUSPECT-004, AZ-CONSTRAINT-007  
**Critérios de aceite**

- não há atalho por atributo único;
- culpado correto pode ser identificado;
- identificação isolada não resolve o caso;
- suspeitos inocentes podem ser excluídos por evidência válida.

---

## Épico 6 — Hipóteses e Épico 7 — Validação, mandado e prisão

### AZ-HYP-001 — Especificar ciclo de hipóteses

**Tipo:** `spec`  
**Dependências:** AZ-ARCH-001  
**Escopo:** autoria, rota, destino, método, vínculo e cronologia.

**Critérios de aceite**

- estados `active`, `supported`, `weakened`, `refuted` e `inconclusive` definidos;
- evidências favoráveis e contrárias representadas;
- confiança não substitui prova;
- revisão preserva histórico no save do jogo.

---

### AZ-HYP-002 — Implementar serviço de hipóteses

**Tipo:** `impl`  
**Dependências:** AZ-HYP-001, AZ-CONSTRAINT-005  
**Critérios de aceite**

- cria, edita e encerra hipótese;
- vincula evidências;
- calcula consistência sem transformar hipótese em verdade;
- mantém contradições visíveis.

---

### AZ-HYP-003 — Implementar quadro de hipóteses

**Tipo:** `impl`  
**Dependências:** AZ-HYP-002  
**Critérios de aceite**

- jogador declara afirmação e tipo;
- seleciona suporte e contradição;
- revisa grau de confiança;
- acessibilidade por teclado e leitor de tela validada.

---

## Épico 7 — Validação, mandado e prisão

### AZ-VALIDATION-001 — Especificar decisão de validação

**Tipo:** `spec`  
**Dependências:** AZ-HYP-001, AZ-EVIDENCE-003  
**Objetivo:** definir o contrato que recebe evidências e hipóteses e produz decisão explicável.

**Critérios de aceite**

- validação separa identidade, localização, hipótese, força probatória, essenciais, procedimento e prazo;
- resultado pode ser aprovado, negado ou inconclusivo;
- motivos são estruturados;
- identificar corretamente o culpado não implica aprovação.

---

### AZ-HYP-004 — Implementar força probatória

**Tipo:** `impl`  
**Dependências:** AZ-HYP-002, AZ-CONSTRAINT-005, AZ-VALIDATION-001  
**Objetivo:** avaliar suficiência sem reduzir o resultado a contagem bruta de evidências.

**Critérios de aceite**

- política configurável por caso;
- evidência inadmissível não sustenta prisão;
- evidência redundante não infla indevidamente o resultado;
- requisitos essenciais continuam suportados;
- cálculo produz explicação.

---

### AZ-HYP-005 — Implementar decisão governada de mandado

**Tipo:** `impl`  
**Dependências:** AZ-HYP-003, AZ-HYP-004, AZ-SUSPECT-004  
**Critérios de aceite**

- jogador propõe o mandado;
- sistema valida identidade, hipótese e prova;
- decisão é aprovada ou negada com motivos;
- mandado não equivale à vitória.

---

### AZ-HYP-006 — Implementar validação canônica da prisão

**Tipo:** `impl`  
**Dependências:** AZ-HYP-005, AZ-ARCH-005  
**Critérios de aceite**

- valida todos os termos da regra canônica;
- preso correto é liberado se a prova for insuficiente;
- mandado incorreto produz desfecho distinto;
- procedimento inválido produz desfecho distinto;
- prazo encerrado impede conclusão válida;
- resultado é completamente explicado.

---

### AZ-HYP-007 — Testar matriz de desfechos

**Tipo:** `test`  
**Dependências:** AZ-HYP-006  
**Casos obrigatórios**

- suspeito correto e prova suficiente;
- suspeito correto e prova insuficiente;
- suspeito incorreto;
- hipótese contraditória;
- mandado ausente;
- localização incorreta;
- procedimento inválido;
- prazo encerrado.

**Critério de aceite:** nenhum cenário identifica automaticamente vitória apenas pelo culpado correto.

---

## Épico 8 — Relatórios investigativos

### AZ-REPORT-001 — Especificar relatório final

**Tipo:** `spec`  
**Dependências:** AZ-HYP-001, AZ-VALIDATION-001  
**Escopo:** fatos, cronologia, rota, autoria, suporte, contradições, limitações e conclusão.

**Critérios de aceite**

- separa fatos observados de interpretação;
- identifica evidências usadas;
- registra limitações;
- permite conclusão inconclusiva.

---

### AZ-REPORT-002 — Implementar construtor de cronologia

**Tipo:** `impl`  
**Dependências:** AZ-REPORT-001, AZ-HYP-002  
**Critérios de aceite**

- ordena eventos com timestamp conhecido;
- não inventa horários ausentes;
- marca conflitos temporais;
- permite observações do jogador.

---

### AZ-REPORT-003 — Implementar reconstrução de rota

**Tipo:** `impl`  
**Dependências:** AZ-REPORT-001, AZ-TERR-004, AZ-HYP-002  
**Critérios de aceite**

- rota proposta referencia territórios válidos;
- evidências sustentadoras são identificadas;
- trechos não comprovados são marcados como hipótese.

---

### AZ-REPORT-004 — Implementar editor de relatório

**Tipo:** `impl`  
**Dependências:** AZ-REPORT-002, AZ-REPORT-003  
**Critérios de aceite**

- jogador seleciona hipóteses e evidências;
- seções obrigatórias são validadas;
- fatos e interpretações têm apresentação distinta;
- rascunho é persistido.

---

### AZ-REPORT-005 — Implementar avaliação lógica

**Tipo:** `impl`  
**Dependências:** AZ-REPORT-004, AZ-HYP-004, AZ-HYP-007  
**Critérios de aceite**

- avalia conclusão, essenciais, contradições e coerência;
- não avalia atributos pessoais do jogador;
- feedback aponta falhas lógicas;
- não revela pistas ainda não encontradas.

---

### AZ-REPORT-006 — Exportar Markdown e JSON

**Tipo:** `impl`  
**Dependências:** AZ-REPORT-004  
**Critérios de aceite**

- exportação reproduz o relatório salvo;
- IDs de evidência são preservados;
- saída não contém conteúdo executável;
- caracteres em português são preservados.

---

### AZ-QA-004 — Revisar relatório e conclusão

**Tipo:** `qa`  
**Dependências:** AZ-REPORT-005, AZ-REPORT-006, AZ-HYP-007  
**Critérios de aceite**

- relatório incorreto não valida prisão;
- relatório correto referencia provas suficientes;
- contradições são tratadas;
- exportações são reproduzíveis.

---

## Épico 9 — Expansão territorial

### AZ-TERR-001 — Especificar catálogo territorial

**Tipo:** `spec`  
**Dependências:** AZ-ARCH-001  
**Objetivo:** definir Brasil, região, UF, município e local investigável.

**Critérios de aceite**

- cada nível possui ID e relacionamento explícito;
- atributos investigativos têm fonte de conteúdo;
- município e local não são a mesma entidade;
- posições do mapa são separadas de coordenadas geográficas.

---

### AZ-TERR-002 — Migrar as cinco cidades atuais

**Tipo:** `content`  
**Dependências:** AZ-TERR-001, AZ-ARCH-003  
**Critérios de aceite**

- São Paulo, Recife, Brasília, Manaus e Porto Alegre são municípios;
- suas UFs e regiões são explícitas;
- locais e ações atuais são preservados;
- rotas existentes continuam válidas.

---

### AZ-TERR-003 — Cadastrar 27 unidades federativas e capitais

**Tipo:** `content`  
**Dependências:** AZ-TERR-001  
**Critérios de aceite**

- catálogo contém 26 estados e Distrito Federal;
- capitais referenciam UFs corretas;
- IDs são únicos;
- artes existentes são mapeadas sem fallback silencioso;
- dados incompletos são marcados, não inventados pelo runtime.

---

### AZ-TERR-004 — Implementar repositório territorial

**Tipo:** `impl`  
**Dependências:** AZ-TERR-002, AZ-TERR-003  
**Critérios de aceite**

- consultas por região, UF, município e atributo;
- catálogo independente do DOM;
- referências inválidas são recusadas;
- dados podem ser carregados sob demanda.

---

### AZ-TERR-005 — Implementar mapa em dois níveis

**Tipo:** `impl`  
**Dependências:** AZ-TERR-004, AZ-CONSTRAINT-004  
**Critérios de aceite**

- seleção estratégica de UF ou município;
- seleção local separada;
- apenas destinos permitidos são habilitados;
- rota visitada permanece visível;
- teclado e texto alternativo suportados.

---

### AZ-TERR-006 — Implementar grafo e política de custos

**Tipo:** `impl`  
**Dependências:** AZ-TERR-004, AZ-HOTFIX-001  
**Critérios de aceite**

- arestas e custos são validados;
- conexão ausente não usa custo implícito;
- saldo insuficiente é recusado sem derrota arbitrária;
- custo mínimo da solução pode ser calculado.

---

### AZ-TERR-007 — Validar rotas nacionais

**Tipo:** `test`  
**Dependências:** AZ-TERR-005, AZ-TERR-006  
**Critérios de aceite**

- detecta destino inalcançável;
- detecta rota sem arte ou catálogo;
- detecta orçamento insolúvel;
- valida cenários legados e novos.

---

## Épico 10 — Minijogos produtores de evidência

### AZ-MINI-001 — Especificar contrato comum

**Tipo:** `spec`  
**Dependências:** AZ-ARCH-001, AZ-CONSTRAINT-005  
**Critérios de aceite**

- entrada, saída, custo e qualidade definidos;
- resultado pode ser completo, parcial, degradado ou ausente;
- alternativa acessível obrigatória;
- repetição e custo adicional definidos.

---

### AZ-MINI-002 — Implementar runtime de minijogos

**Tipo:** `impl`  
**Dependências:** AZ-MINI-001, AZ-ARCH-005  
**Critérios de aceite**

- inicia, pausa, conclui e cancela;
- devolve resultado padronizado;
- não altera evidência diretamente fora do serviço autorizado;
- persistência durante interrupção definida.

---

### AZ-MINI-003 — Minijogo de análise de logs

**Tipo:** `impl`  
**Dependências:** AZ-MINI-002  
**Critérios de aceite:** identifica eventos relevantes, produz evidência digital e oferece alternativa textual.

### AZ-MINI-004 — Minijogo de correlação de dados

**Tipo:** `impl`  
**Dependências:** AZ-MINI-002  
**Critérios de aceite:** relaciona registros, produz vínculo ou restrição e explica erros.

### AZ-MINI-005 — Minijogo de recuperação documental

**Tipo:** `impl`  
**Dependências:** AZ-MINI-002  
**Critérios de aceite:** reconstrói informação incompleta e produz evidência com qualidade proporcional.

### AZ-MINI-006 — Minijogo de decodificação

**Tipo:** `impl`  
**Dependências:** AZ-MINI-002  
**Critérios de aceite:** resolve mensagem estruturada, evita conhecimento externo obrigatório e produz pista utilizável.

### AZ-MINI-007 — Minijogo de reconstrução de eventos

**Tipo:** `impl`  
**Dependências:** AZ-MINI-002, AZ-REPORT-002  
**Critérios de aceite:** ordena eventos, registra conflitos e alimenta cronologia.

### AZ-MINI-008 — Integrar qualidade da evidência

**Tipo:** `impl`  
**Dependências:** AZ-MINI-003, AZ-MINI-004, AZ-MINI-005, AZ-MINI-006, AZ-MINI-007, AZ-HYP-004  
**Critérios de aceite**

- desempenho altera qualidade, não a verdade dos fatos;
- evidência parcial pode exigir confirmação;
- falha única não torna o caso insolúvel;
- repetir consome custo configurado.

### AZ-MINI-009 — Validar acessibilidade dos minijogos

**Tipo:** `qa`  
**Dependências:** AZ-MINI-008  
**Critérios de aceite**

- todos possuem alternativa equivalente;
- teclado completo;
- ausência de dependência exclusiva de cor;
- movimento reduzido respeitado;
- instruções e feedback disponíveis.

---

## Épico 11 — Progressão profissional

### AZ-CAREER-001 — Especificar competências e patentes

**Tipo:** `spec`  
**Dependências:** AZ-REPORT-001  
**Escopo:** observação, análise, território, hipótese, eficiência, relatório e procedimento.

**Critérios de aceite**

- Trainee, Júnior, Pleno, Sênior, Especialista e Elite definidos;
- critérios de promoção configuráveis;
- patente não depende só de pontuação acumulada;
- competência não avalia características pessoais do jogador.

---

### AZ-CAREER-002 — Implementar avaliação por caso

**Tipo:** `impl`  
**Dependências:** AZ-CAREER-001, AZ-REPORT-005, AZ-HYP-007  
**Critérios de aceite**

- cálculo determinístico;
- cada resultado possui explicação;
- prisão correta com procedimento ruim afeta competência correspondente;
- caso inconclusivo pode gerar aprendizagem sem promoção automática.

---

### AZ-CAREER-003 — Implementar perfil e histórico

**Tipo:** `impl`  
**Dependências:** AZ-CAREER-002  
**Critérios de aceite**

- histórico de casos preservado;
- competências e patente persistidas;
- perfil corrompido é recuperável;
- dados antigos não são apagados silenciosamente.

---

### AZ-CAREER-004 — Migrar estrelas

**Tipo:** `impl`  
**Dependências:** AZ-CAREER-003  
**Critérios de aceite**

- estrelas viram histórico ou crédito inicial limitado;
- migração é idempotente;
- não concede patente avançada automaticamente;
- jogador é informado da conversão.

---

### AZ-CAREER-005 — Implementar promoções e desbloqueios

**Tipo:** `impl`  
**Dependências:** AZ-CAREER-003  
**Critérios de aceite**

- promoção exige casos e competências;
- desbloqueios ampliam ferramentas e conteúdo;
- nenhuma ferramenta revela automaticamente culpado ou solução;
- regras são configuráveis.

---

### AZ-CAREER-006 — Implementar painel profissional

**Tipo:** `impl`  
**Dependências:** AZ-CAREER-004, AZ-CAREER-005  
**Critérios de aceite**

- patente, competências e requisitos visíveis;
- histórico consultável;
- critérios de promoção explicáveis;
- acessibilidade validada.

---

### AZ-QA-005 — Revisar progressão

**Tipo:** `qa`  
**Dependências:** AZ-CAREER-006  
**Critérios de aceite**

- progressão não recompensa adivinhação;
- competências refletem ações observáveis do jogo;
- migração não perde estrelas;
- desbloqueios preservam o desafio investigativo.

---

## Épico 12 — Integração, QA e publicação

### AZ-QA-006 — Criar validador completo de casos

**Tipo:** `test`  
**Dependências:** AZ-CONSTRAINT-007, AZ-TERR-007, AZ-MINI-008, AZ-HYP-007  
**Critérios de aceite**

- valida esquema, referências, solução, orçamento, mandado e relatório;
- acusa evidência sem produtor;
- acusa pista essencial fora da rota;
- acusa minijogo sem alternativa acessível;
- saída contém caminho e correção sugerida.

---

### AZ-QA-007 — Criar vertical slice evoluído

**Tipo:** `content`  
**Dependências:** AZ-QA-004, AZ-TERR-007, AZ-MINI-009, AZ-QA-005, AZ-QA-006  
**Objetivo:** migrar um capítulo completo para todos os sistemas novos.

**Critérios de aceite**

- usa território explícito;
- usa restrições reais;
- suspeitos compartilham atributos;
- jogador formula hipótese;
- ao menos um minijogo produz evidência;
- relatório é obrigatório;
- prisão falha com culpado correto e prova insuficiente;
- carreira recebe avaliação.

---

### AZ-QA-008 — Testar regressão da campanha legada

**Tipo:** `test`  
**Dependências:** AZ-QA-007  
**Critérios de aceite**

- quatro capítulos legados carregam pelo adaptador;
- nove cenários são solucionáveis;
- persistência e importação funcionam;
- desfechos antigos continuam coerentes.

---

### AZ-QA-009 — Atualizar documentação operacional

**Tipo:** `spec`  
**Dependências:** AZ-QA-007, AZ-QA-008  
**Critérios de aceite**

- contratos refletem o motor atual;
- hashes e mapa de funções atualizados;
- documentação obsoleta removida ou marcada;
- guia de criação de caso 3.0 incluído;
- regra canônica da prisão aparece no PRD, arquitetura e guia.

---

### AZ-QA-010 — Revisão independente de release

**Tipo:** `qa`  
**Dependências:** AZ-QA-009  
**Critérios de aceite**

- verificação ESAA está íntegra;
- testes automatizados passam;
- vertical slice novo passa pelos critérios;
- regressão legada passa;
- riscos residuais são registrados;
- nenhuma conclusão de tarefa depende apenas de declaração do implementador.

---

# 7. Ondas de execução

## Onda 0 — Baseline e estabilidade

- AZ-SPEC-001
- AZ-SPEC-002
- AZ-HOTFIX-001 a AZ-HOTFIX-005
- AZ-QA-001

## Onda 1 — Fundação arquitetural

- AZ-ARCH-001 a AZ-ARCH-005
- AZ-QA-002

## Onda 2 — Evidência

- AZ-EVIDENCE-001 a AZ-EVIDENCE-005
- AZ-QA-EVIDENCE-001

**Saída obrigatória:** `EvidenceRecord[]` válido, rastreável e compatível com os casos atuais.

## Onda 3 — Restrição

- AZ-CONSTRAINT-001 a AZ-CONSTRAINT-005
- AZ-TERR-001
- AZ-SUSPECT-001 a AZ-SUSPECT-003
- AZ-CONSTRAINT-007

**Saída obrigatória:** `ConstraintEvaluation[]` explicável, com resultados compatíveis, incompatíveis e indeterminados.

## Onda 4 — Hipótese

- AZ-HYP-001 a AZ-HYP-003
- AZ-CONSTRAINT-006

**Saída obrigatória:** `HypothesisRecord[]` com evidências favoráveis, contrárias e confiança declarada.

## Onda 5 — Validação

- AZ-VALIDATION-001
- AZ-HYP-004 a AZ-HYP-007
- AZ-SUSPECT-004
- AZ-QA-003

**Saída obrigatória:** `ValidationDecision` que preserve a regra “identificar não é provar”.

## Onda 6 — Relatório

- AZ-REPORT-001 a AZ-REPORT-006
- AZ-QA-004

**Saída obrigatória:** `InvestigationReport` que distinga fatos, inferências, contradições, limitações e decisão.

## Onda 7 — Expansão e enriquecimento

- AZ-TERR-002 a AZ-TERR-007
- AZ-CONSTRAINT-004
- AZ-MINI-001 a AZ-MINI-009

## Onda 8 — Progressão profissional

- AZ-CAREER-001 a AZ-CAREER-006
- AZ-QA-005

## Onda 9 — Integração e release

- AZ-QA-006 a AZ-QA-010

---

# 8. Caminho crítico

```text
AZ-SPEC-001
→ AZ-SPEC-002
→ AZ-QA-001
→ AZ-ARCH-001
→ AZ-ARCH-003
→ AZ-ARCH-004
→ AZ-EVIDENCE-001
→ AZ-EVIDENCE-002
→ AZ-EVIDENCE-003
→ AZ-CONSTRAINT-001
→ AZ-CONSTRAINT-002
→ AZ-CONSTRAINT-003
→ AZ-CONSTRAINT-005
→ AZ-HYP-001
→ AZ-HYP-002
→ AZ-HYP-003
→ AZ-VALIDATION-001
→ AZ-HYP-004
→ AZ-SUSPECT-004
→ AZ-HYP-005
→ AZ-HYP-006
→ AZ-HYP-007
→ AZ-REPORT-001
→ AZ-REPORT-004
→ AZ-REPORT-005
→ AZ-QA-004
→ AZ-QA-007
→ AZ-QA-010
```

O caminho crítico materializa a sequência:

```text
Evidência → Restrição → Hipótese → Validação → Relatório
```

Nenhuma tarefa posterior pode contornar o contrato produzido pela etapa anterior.

---

# 9. Paralelismo seguro

Após AZ-ARCH-001, podem avançar em paralelo:

- especificação territorial;
- especificação de suspeitos;
- especificação de hipóteses;
- especificação de minijogos;
- esquema de restrições.

Não devem ser paralelizadas sem integração prévia:

- política de mandado e força probatória;
- dossiê novo e serviço de candidatos;
- relatório final e avaliação lógica;
- carreira e avaliação do caso;
- mapa nacional e repositório territorial.

---

# 10. Política de conclusão das tarefas

Uma tarefa de implementação só pode ser considerada completa quando apresentar:

- arquivos alterados dentro do limite autorizado;
- verificações executadas;
- critérios de aceite demonstrados;
- testes novos ou atualizados;
- ausência de regressão conhecida no escopo;
- notas de migração, quando aplicável;
- demonstração de que a saída respeita o contrato da etapa anterior e serve como entrada válida para a etapa seguinte.

Uma tarefa `qa` deve ser revisada por ator autorizado diferente do implementador, conforme a política configurada no workspace.

Tarefas concluídas não devem ser reabertas por edição histórica. Correções posteriores devem ser registradas como hotfixes dependentes.

---

# 11. Primeiras tarefas elegíveis

Em um roadmap inicialmente vazio, somente esta tarefa deve iniciar sem dependências:

```text
AZ-SPEC-001 — Congelar baseline verificável
```

Após sua conclusão, tornam-se candidatas:

```text
AZ-SPEC-002
AZ-HOTFIX-001
AZ-HOTFIX-002
AZ-HOTFIX-003
AZ-HOTFIX-004
```

AZ-HOTFIX-005 aguarda AZ-SPEC-002 porque depende da decisão sobre a fonte canônica dos cenários.

---

# 12. Resultado esperado

Ao concluir a WBS, o Arquivo Zero terá:

- runtime estável e compatível;
- casos versionados e validados;
- dedução por restrições explicáveis;
- suspeitos multidimensionais;
- hipóteses sustentadas e contraditáveis;
- mandado e prisão governados por prova;
- relatórios investigativos exportáveis;
- território nacional hierárquico;
- minijogos que produzem evidências;
- carreira baseada em competências;
- processo de construção auditável pelo ESAA.

A definição final de sucesso permanece:

> O jogador pode saber quem é o criminoso e ainda fracassar na prisão se não conseguir demonstrar a responsabilidade com evidências suficientes, hipóteses consistentes e procedimento válido.
