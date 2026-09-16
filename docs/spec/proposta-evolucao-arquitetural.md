# Proposta de Evolução Arquitetural do Arquivo Zero

## Sistema de Restrições, Expansão Territorial, Suspeitos, Hipóteses, Minijogos e Progressão

**Versão:** 1.0  
**Data:** 16/09/2026  
**Produto:** Arquivo Zero — Caçada Digital  
**Referência:** PRD Investigador Brasil v2.0  
**Status:** Proposta para análise e planejamento  

---

# 1. Resumo executivo

Esta proposta define a evolução do protótipo atual do **Arquivo Zero** para um produto nacional de investigação educacional orientado por evidências. O objetivo não é descartar o motor existente, mas preservar seus elementos mais valiosos e introduzir, de forma incremental, seis capacidades estruturantes:

1. sistema de restrições;
2. expansão territorial;
3. modelagem rica de suspeitos;
4. relatórios e hipóteses;
5. minijogos produtores de evidência;
6. progressão profissional.

A implementação atual já oferece um vertical slice funcional com carregamento de casos em JSON, cinco cidades, grafo de deslocamento, orçamento temporal, cenários, campanha, evidências, dossiê, mandado, prisão e persistência local. A evolução proposta transforma esse motor em uma plataforma extensível sem invalidar o conteúdo existente.

A principal mudança conceitual será passar de:

```text
Grafo + tempo + igualdade de atributos + lista de provas
```

para:

```text
Grafo territorial
+
Evidências estruturadas
+
Restrições combináveis
+
Hipóteses verificáveis
+
Decisões sob custo
+
Progressão por competência demonstrada
```

---

# 2. Diagnóstico do estado atual

## 2.1 Capacidades que devem ser preservadas

- carregamento declarativo de conteúdo por JSON;
- separação prática entre motor e caso;
- campanha formada por capítulos;
- seleção de cenários alternativos;
- navegação por grafo;
- consumo de horas em viagens e investigações;
- persistência de estado no navegador;
- quadro de evidências;
- dossiê de suspeitos;
- mandado e validação do conjunto probatório;
- importação de novos casos;
- interface responsiva e identidade visual retrô.

## 2.2 Limitações que motivam esta proposta

- a dedução atual ocorre por igualdade direta de poucos atributos;
- um único atributo pode identificar univocamente um suspeito;
- pistas são textos com etiquetas, não restrições computáveis;
- cidades e estados não possuem um modelo territorial explícito;
- não existe entidade de hipótese;
- não existe relatório final elaborado pelo jogador;
- ações investigativas são resolvidas por clique, sem desafio intermediário;
- estrelas não representam uma carreira baseada em competências;
- o motor está concentrado em um único arquivo JavaScript;
- as regras de conteúdo possuem duplicações entre cenário-base e capítulos.

---

# 3. Princípios de evolução

## 3.1 Compatibilidade progressiva

Casos atuais devem continuar carregando. O motor poderá normalizar o esquema antigo para o novo durante a leitura.

## 3.2 Conteúdo declarativo

Estados, municípios, locais, suspeitos, restrições, minijogos e critérios de progressão devem permanecer configuráveis em dados, evitando lógica específica de cada caso no núcleo do motor.

## 3.3 Dedução explicável

Toda eliminação de destino ou suspeito deve informar ao jogador:

- qual evidência foi usada;
- qual restrição foi aplicada;
- quais candidatos foram afetados;
- por que uma hipótese ganhou ou perdeu força.

## 3.4 Evidência não é conclusão

Uma evidência pode sustentar, enfraquecer ou contradizer uma hipótese. O jogo não deve transformar automaticamente toda pista em verdade absoluta.

## 3.5 Dificuldade por complexidade, não por obscuridade

A dificuldade deve crescer por quantidade de candidatos, combinação de restrições, confiabilidade das fontes e custo das decisões. Não deve depender de pistas ambíguas sem solução verificável.

## 3.6 Produto educacional observável

A avaliação deve considerar o raciocínio utilizado, não apenas a prisão final. Hipóteses, evidências citadas e justificativas devem compor o desempenho.

---

# 3.7 Princípio essencial: identificar não é provar

A essência do **Arquivo Zero** é a separação entre a convicção investigativa e a suficiência probatória. O jogador pode descobrir corretamente quem cometeu o crime e, ainda assim, não conseguir concluir legalmente o caso.

```text
Saber quem é o criminoso
≠
Demonstrar sua responsabilidade
```

A identificação correta do suspeito é necessária, mas não suficiente. A conclusão exige que o jogador demonstre, por meio de evidências admissíveis e hipóteses sustentadas, uma ligação consistente entre o suspeito, o crime, o método, a oportunidade e os eventos investigados.

O sistema deve avaliar separadamente:

- **identificação:** quem é o suspeito indicado;
- **força probatória:** quanto as evidências sustentam a autoria;
- **consistência das hipóteses:** se a reconstrução explica os fatos sem contradições críticas;
- **conformidade processual:** se os requisitos para mandado, abordagem e prisão foram respeitados;
- **localização operacional:** se a pessoa abordada corresponde ao alvo e está no local correto;
- **suficiência para conclusão:** se o conjunto reunido alcança os critérios mínimos do caso.

A prisão somente será validada quando todos os critérios obrigatórios forem atendidos. Caso o jogador identifique corretamente o criminoso, mas apresente provas insuficientes, hipóteses contraditórias ou procedimento inválido, a prisão poderá falhar e o caso terminar sem solução.

Essa possibilidade não deve ser tratada como punição arbitrária. A interface deve explicar claramente qual dimensão falhou e quais elementos estavam ausentes, sem revelar antecipadamente evidências ainda não descobertas.

## 3.7.1 Regra canônica de conclusão

```text
PRISÃO VÁLIDA =
    suspeito correto
    AND localização correta
    AND hipótese de autoria sustentada
    AND força probatória suficiente
    AND evidências essenciais presentes
    AND procedimento válido
    AND prazo não encerrado
```

## 3.7.2 Resultados possíveis

- **Prisão validada:** todos os critérios obrigatórios foram atendidos.
- **Mandado negado:** o jogador ainda não demonstrou base suficiente para a abordagem.
- **Pessoa liberada por mandado incorreto:** a identidade abordada não corresponde ao alvo autorizado.
- **Pessoa liberada por insuficiência probatória:** o suspeito foi identificado corretamente, mas a ligação com o crime não foi demonstrada.
- **Hipótese rejeitada:** as evidências selecionadas não sustentam a narrativa apresentada.
- **Procedimento invalidado:** uma etapa obrigatória não foi respeitada.
- **Caso inconclusivo:** o prazo terminou sem uma conclusão suficientemente sustentada.

## 3.7.3 Implicação pedagógica

O jogo não recompensa adivinhação. Ele recompensa a capacidade de observar, comparar, justificar e demonstrar. Portanto, acertar o nome do criminoso sem construir um argumento probatório consistente não equivale a resolver o caso.

---

# 4. Visão da arquitetura-alvo

```text
Interface do jogo
        │
        ▼
Camada de aplicação
  ├── serviços de caso
  ├── serviços de viagem
  ├── serviços de investigação
  ├── serviços de hipótese
  ├── serviços de relatório
  └── serviços de carreira
        │
        ▼
Camada de domínio
  ├── território
  ├── investigação
  ├── evidências
  ├── restrições
  ├── suspeitos
  ├── hipóteses
  ├── minijogos
  └── progressão
        │
        ▼
Infraestrutura
  ├── repositórios JSON
  ├── persistência local
  ├── validador de esquema
  ├── importação/exportação
  └── telemetria opcional
```

## 4.1 Módulos sugeridos

```text
src/
├── core/
│   ├── game-engine.js
│   ├── state-machine.js
│   └── event-bus.js
├── domain/
│   ├── constraints/
│   ├── evidence/
│   ├── geography/
│   ├── hypotheses/
│   ├── investigations/
│   ├── minigames/
│   ├── progression/
│   └── suspects/
├── application/
│   ├── case-service.js
│   ├── investigation-service.js
│   ├── report-service.js
│   └── travel-service.js
├── infrastructure/
│   ├── repositories/
│   ├── persistence/
│   └── schema/
└── ui/
    ├── map/
    ├── evidence-board/
    ├── dossier/
    ├── reports/
    └── career/
```

Essa separação é uma arquitetura-alvo. A migração pode ocorrer módulo a módulo, sem uma reescrita completa imediata.

---

# 5. Sistema de restrições

## 5.1 Objetivo

Transformar evidências textuais em regras computáveis capazes de reduzir conjuntos de destinos, suspeitos, organizações, veículos e eventos.

## 5.2 Modelo conceitual

```text
Evidência
    ↓ interpreta
Restrição
    ↓ avalia
Candidatos
    ↓ produz
Compatíveis + incompatíveis + indeterminados
```

Uma restrição não deve retornar apenas verdadeiro ou falso. Em uma investigação, pode não haver informação suficiente.

```text
MATCH       candidato compatível
NO_MATCH    candidato incompatível
UNKNOWN     dados insuficientes
```

## 5.3 Operadores iniciais

- igualdade;
- diferença;
- inclusão em conjunto;
- exclusão de conjunto;
- contém;
- intervalo numérico;
- proximidade territorial;
- pertence à região;
- possui infraestrutura;
- relacionado a setor econômico;
- anterior ou posterior a um evento;
- combinação lógica `AND`, `OR` e `NOT`.

## 5.4 Estrutura de dados sugerida

```json
{
  "id": "R-PORTO-001",
  "target": "territory",
  "field": "infrastructure.ports",
  "operator": "contains",
  "value": "Porto de Santos",
  "sourceEvidence": "E02",
  "weight": 1.0
}
```

Restrição composta:

```json
{
  "id": "R-COMPOSTA-001",
  "operator": "and",
  "rules": ["R-PORTO-001", "R-REGIAO-002"]
}
```

## 5.5 Motor de avaliação

Entrada:

```text
conjunto de candidatos
+
restrições selecionadas
+
contexto do caso
```

Saída:

```text
candidatos compatíveis
candidatos eliminados
candidatos indeterminados
explicação de cada avaliação
```

## 5.6 Exemplo territorial

```text
Evidência A: carga passou pelo Porto de Santos
Evidência B: destino possui polo aeronáutico relevante
```

O sistema poderá aplicar as duas restrições e exibir somente os estados ou municípios compatíveis com os dados cadastrados no caso. Não é necessário que a interface revele automaticamente a resposta. O jogador pode escolher quais evidências cruzar.

## 5.7 Regras de design

- nenhuma pista essencial pode produzir zero soluções por erro de conteúdo;
- todo caso deve possuir ao menos uma solução única ao final;
- pistas redundantes podem confirmar uma conclusão;
- pistas falsas precisam ser identificáveis como frágeis, contraditórias ou não admissíveis;
- uma única pista não deve identificar o culpado nos níveis intermediário e avançado;
- o motor deve registrar a explicação de cada filtragem.

## 5.8 Critérios de aceite

- o jogador consegue combinar duas ou mais restrições;
- o sistema apresenta candidatos compatíveis, incompatíveis e indeterminados;
- cada eliminação possui justificativa consultável;
- o caso é validado antes de ser publicado;
- o esquema antigo de evidência continua carregando por normalização;
- o mandado exige uma correspondência única e suporte probatório mínimo.

---

# 6. Expansão territorial

## 6.1 Objetivo

Evoluir o mundo atual de cinco capitais para uma estrutura nacional hierárquica, permitindo investigações entre estados, municípios e locais específicos.

## 6.2 Hierarquia territorial

```text
Brasil
└── Região
    └── Unidade Federativa
        └── Município
            └── Local investigável
```

## 6.3 Entidades propostas

### Unidade federativa

```json
{
  "id": "SP",
  "name": "São Paulo",
  "region": "Sudeste",
  "capitalCityId": "sao_paulo",
  "biomes": ["Mata Atlântica", "Cerrado"],
  "economicSectors": ["serviços", "indústria", "tecnologia"],
  "infrastructure": {
    "airports": [],
    "ports": [],
    "highways": [],
    "universities": []
  }
}
```

### Município

```json
{
  "id": "sao_paulo",
  "name": "São Paulo",
  "stateId": "SP",
  "coordinates": {"lat": -23.5, "lon": -46.6},
  "mapPosition": {"x": 57, "y": 69},
  "tags": ["metrópole", "centro financeiro", "universidades"]
}
```

### Local investigável

```json
{
  "id": "laboratorio_horus",
  "cityId": "sao_paulo",
  "type": "laboratory",
  "name": "Laboratório Hórus",
  "actions": ["sp_camera", "sp_desk", "sp_cafe"]
}
```

## 6.4 Navegação em dois níveis

### Nível estratégico

O jogador escolhe estado ou município no mapa brasileiro.

### Nível local

Após chegar, escolhe um local investigável dentro do município.

Esse modelo resolve a limitação atual em que cidade e local são tratados como a mesma entidade.

## 6.5 Custos de deslocamento

O custo poderá considerar:

- origem e destino;
- modal disponível;
- conexão direta ou escala;
- urgência;
- condição definida pelo caso;
- benefício desbloqueado na carreira.

O modelo inicial pode continuar usando matriz explícita de custos. Uma evolução posterior poderá calcular rotas a partir de arestas.

## 6.6 Estratégia de expansão

### Etapa territorial A

Preservar as cinco cidades existentes e introduzir explicitamente suas unidades federativas.

### Etapa territorial B

Conectar as 27 capitais já previstas no acervo visual, sem exigir conteúdo investigativo completo para todas.

### Etapa territorial C

Adicionar municípios secundários por caso, priorizando relevância narrativa.

### Etapa territorial D

Permitir pacotes temáticos regionais e expansão até a meta definida pelo produto.

## 6.7 Critérios de aceite

- estado, município e local são entidades distintas;
- mapa suporta as 27 unidades federativas;
- o jogador visualiza somente destinos permitidos pelo caso;
- custos inválidos ou superiores ao saldo não causam derrota sem confirmação adequada;
- todo destino utilizado por uma rota possui dados e arte válidos;
- o validador identifica conexões ausentes e rotas insolúveis.

---

# 7. Modelagem rica de suspeitos

## 7.1 Objetivo

Eliminar a identificação trivial e permitir raciocínio progressivo envolvendo identidade, atuação, vínculos, oportunidade, capacidade e meios de deslocamento.

## 7.2 Estrutura sugerida

```json
{
  "id": "cifra",
  "codename": "Cifra",
  "profile": {
    "specialties": ["engenharia social", "fraude de identidade"],
    "skills": ["persuasão", "falsificação documental"],
    "roles": ["intermediário"],
    "organizations": ["grupo_zero"],
    "operatingRegions": ["Sudeste", "Centro-Oeste", "Sul"],
    "mobility": ["avião cargueiro", "voo privado"],
    "knownMethods": ["credencial clonada", "abordagem social"]
  },
  "caseData": {
    "opportunity": true,
    "possibleLocations": ["SP", "DF", "RS"],
    "alibiEvidenceIds": [],
    "incriminatingEvidenceIds": ["E01", "E03", "E04"]
  }
}
```

## 7.3 Dimensões de investigação

- **identidade:** codinome e características reconhecíveis;
- **capacidade:** conhecimento necessário para executar o crime;
- **oportunidade:** acesso ao local ou sistema;
- **motivação:** interesse coerente com o caso, quando aplicável;
- **método:** padrão operacional;
- **mobilidade:** meios e regiões de atuação;
- **vínculos:** organizações, contatos e operações anteriores;
- **álibi:** evidências que afastam ou limitam a participação;
- **situação probatória:** evidências favoráveis, contrárias e pendentes.

## 7.4 Regras contra trivialidade

- campos principais devem ser compartilhados por mais de um suspeito;
- nenhum atributo isolado deve produzir correspondência única nos casos normais;
- suspeitos devem compartilhar parcialmente métodos, regiões e competências;
- álibis podem eliminar suspeitos, mas devem exigir evidência válida;
- o culpado deve ser identificável pela interseção de múltiplas dimensões;
- a seleção pelo nome pode existir em modo de acessibilidade, mas não desbloqueia sozinha o mandado.

## 7.5 Mandado revisado

O mandado deve exigir:

```text
suspeito único
AND
limiar mínimo de suporte
AND
evidências essenciais
AND
hipótese de autoria validada
AND
conformidade processual
```

O sistema poderá indicar que um suspeito é provável, sem autorizar automaticamente a ação final. Mesmo quando o suspeito correto for identificado, a prisão poderá falhar se o conjunto probatório, a hipótese de autoria ou o procedimento forem insuficientes. Essa separação entre **saber** e **provar** é uma regra canônica do produto e não poderá ser removida por implementações futuras.

## 7.6 Critérios de aceite

- cada caso apresenta múltiplos suspeitos parcialmente compatíveis;
- uma característica isolada não emite mandado;
- o jogador visualiza por que cada suspeito permanece ou foi eliminado;
- evidências podem incriminar, excluir ou deixar o resultado indeterminado;
- o caso possui teste automatizado de unicidade da solução.

---

# 8. Relatórios e hipóteses

## 8.1 Objetivo

Transformar o raciocínio do jogador em um artefato explícito, verificável e avaliável, aproximando a experiência de investigação profissional e aprendizagem baseada em evidências.

## 8.2 Entidade hipótese

```json
{
  "id": "H-001",
  "type": "route",
  "statement": "O suspeito seguiu de São Paulo para Brasília.",
  "subjectId": "cifra",
  "targetId": "brasilia",
  "supportingEvidenceIds": ["E02", "E05"],
  "contradictingEvidenceIds": [],
  "status": "active",
  "confidence": "medium"
}
```

## 8.3 Tipos de hipótese

- autoria;
- rota;
- destino atual;
- método utilizado;
- motivação;
- vínculo entre suspeitos;
- local ou horário do evento final.

## 8.4 Ciclo da hipótese

```text
Criada
  ↓
Em análise
  ├── sustentada
  ├── enfraquecida
  ├── refutada
  └── inconclusiva
```

## 8.5 Quadro de hipóteses

O jogador poderá:

1. declarar uma hipótese;
2. vincular evidências favoráveis;
3. registrar evidências contrárias;
4. informar o grau de confiança;
5. revisar a hipótese quando surgirem novas informações;
6. submetê-la como base do relatório ou mandado.

## 8.6 Relatório final

Seções mínimas:

- identificação do caso;
- síntese dos fatos;
- linha cronológica;
- rota reconstruída;
- suspeito indicado;
- hipótese de autoria;
- evidências que sustentam a conclusão;
- evidências contraditórias consideradas;
- justificativa do mandado;
- limitações da investigação;
- conclusão.

## 8.7 Avaliação do relatório

O relatório pode ser pontuado por critérios objetivos:

- conclusão compatível com a solução;
- uso de evidências essenciais;
- ausência de evidências inválidas;
- coerência cronológica;
- tratamento de contradições;
- justificativa territorial;
- proporcionalidade da confiança declarada.

A pontuação não deve avaliar estilo subjetivo de escrita. O foco é consistência lógica e uso correto das evidências.

## 8.8 Exportação

O relatório deve poder ser:

- salvo no estado da campanha;
- visualizado no encerramento;
- exportado em Markdown ou JSON;
- disponibilizado ao professor em modo educacional, conforme a infraestrutura futura.

## 8.9 Critérios de aceite

- o jogador cria e edita hipóteses;
- toda hipótese possui evidências vinculadas;
- contradições são aceitas e exibidas;
- o mandado pode exigir uma hipótese de autoria sustentada;
- o relatório final é gerado com os dados selecionados pelo jogador;
- a avaliação explica erros de raciocínio sem revelar antecipadamente a solução.

---

# 9. Minijogos produtores de evidência

## 9.1 Objetivo

Substituir parte das ações resolvidas por clique por desafios breves que representem procedimentos investigativos e produzam evidências com qualidade variável.

## 9.2 Princípio de integração

```text
Ação investigativa
    ↓
Minijogo
    ↓
Resultado de desempenho
    ↓
Evidência completa, parcial, degradada ou ausente
```

O minijogo não deve existir apenas para entretenimento. Seu resultado precisa alterar o estado investigativo.

## 9.3 Interface de minijogo

```javascript
class MinigameStrategy {
  start(context) {}
  submit(input) {}
  getResult() {}
}
```

Resultado padronizado:

```json
{
  "status": "success",
  "score": 82,
  "timeCost": 3,
  "evidenceIds": ["E05"],
  "quality": 0.9,
  "mistakes": [],
  "feedback": "A sequência temporal foi reconstruída."
}
```

## 9.4 Cinco minijogos iniciais

### 9.4.1 Análise de logs

O jogador organiza ou filtra eventos para identificar acessos relevantes.

**Produz:** evidência digital, sequência temporal ou origem provável.

### 9.4.2 Correlação de dados

O jogador relaciona registros de viagem, transações, acessos ou comunicações.

**Produz:** vínculo entre entidades ou restrição territorial.

### 9.4.3 Recuperação documental

O jogador reconstrói um documento incompleto ou identifica inconsistências entre versões.

**Produz:** evidência documental parcial ou completa.

### 9.4.4 Decodificação

O jogador resolve uma regra lógica, cifra simples ou mensagem estruturada compatível com o contexto educacional.

**Produz:** pista de rota, identidade ou evento.

### 9.4.5 Reconstrução de eventos

O jogador ordena acontecimentos usando horários, locais e dependências.

**Produz:** linha temporal e suporte para hipóteses.

## 9.5 Qualidade da evidência

O desempenho pode afetar:

- completude;
- confiabilidade;
- tempo consumido;
- clareza da restrição;
- necessidade de confirmação por outra fonte.

Não se recomenda destruir uma campanha por um único erro de minijogo. O jogador pode receber evidência parcial ou optar por repetir com novo custo temporal.

## 9.6 Acessibilidade

- alternativa textual equivalente;
- navegação por teclado;
- ausência de dependência exclusiva de cor;
- opção sem limite de tempo real;
- instruções antes do início;
- feedback após a conclusão;
- respeito a preferências de movimento reduzido.

## 9.7 Critérios de aceite

- todo minijogo implementa um contrato uniforme;
- o resultado produz ou altera evidência;
- o minijogo informa custo e consequência antes do início;
- existe alternativa acessível;
- o caso continua solucionável dentro do orçamento;
- o validador de conteúdo calcula o custo mínimo e máximo relevante.

---

# 10. Progressão profissional

## 10.1 Objetivo

Substituir o contador isolado de estrelas por uma carreira legível, baseada em competências demonstradas e capaz de liberar novos recursos sem transformar o jogo em uma progressão puramente numérica.

## 10.2 Patentes propostas

```text
Trainee
Júnior
Pleno
Sênior
Especialista
Elite
```

## 10.3 Competências

- observação;
- análise de evidências;
- raciocínio territorial;
- formulação de hipóteses;
- eficiência temporal;
- consistência do relatório;
- uso responsável do mandado.

## 10.4 Avaliação por caso

```json
{
  "caseId": "caca_algoritmo_001",
  "outcome": "solved",
  "competencies": {
    "observation": 78,
    "evidenceAnalysis": 86,
    "territorialReasoning": 72,
    "hypothesisQuality": 90,
    "timeEfficiency": 64,
    "reportConsistency": 88,
    "legalProcedure": 100
  },
  "unlocks": ["advanced_log_tool"]
}
```

Os valores acima são apenas um exemplo de esquema, não uma regra definitiva de balanceamento.

## 10.5 Regras de promoção

A promoção deve considerar:

- quantidade mínima de casos concluídos;
- desempenho mínimo em competências essenciais;
- conclusão de categorias diferentes;
- ausência de violações processuais críticas;
- domínio demonstrado em relatórios e hipóteses.

O simples acúmulo de estrelas não deve ser suficiente.

## 10.6 Desbloqueios possíveis

- novas categorias de investigação;
- instrumentos de análise;
- filtros avançados;
- visualizações territoriais;
- relatórios mais complexos;
- casos com fontes contraditórias;
- campanhas regionais;
- modo de autoria para professores, em fase posterior.

Os desbloqueios devem ampliar possibilidades de análise, não oferecer respostas automáticas.

## 10.7 Retrocompatibilidade das estrelas

As estrelas atuais podem ser convertidas em:

- registro histórico de casos concluídos; ou
- créditos iniciais de carreira limitados.

A conversão não deve conceder patente elevada sem evidência das competências novas.

## 10.8 Critérios de aceite

- o jogador visualiza patente, competências e requisitos de promoção;
- cada caso atualiza competências explicavelmente;
- promoções dependem de critérios configuráveis;
- estrelas existentes são migradas sem perda silenciosa;
- desbloqueios não tornam a dedução automática;
- o progresso permanece persistente entre campanhas.

---

# 11. Integração entre os seis sistemas

Os sistemas não devem ser construídos como funcionalidades isoladas.

```text
Território
    ↓ fornece candidatos
Sistema de restrições
    ↓ reduz destinos e suspeitos
Modelagem de suspeitos
    ↓ oferece dimensões de autoria
Hipóteses
    ↓ organizam o raciocínio
Minijogos
    ↓ produzem evidências qualificadas
Relatórios
    ↓ demonstram a conclusão
Progressão
    ↓ reconhece as competências utilizadas
```

Exemplo de fluxo integrado:

1. o jogador investiga um terminal;
2. inicia um minijogo de correlação de dados;
3. obtém evidência documental com qualidade alta;
4. a evidência cria uma restrição sobre infraestrutura portuária;
5. o sistema reduz os destinos compatíveis;
6. o jogador formula uma hipótese de rota;
7. novas evidências sustentam ou refutam a hipótese;
8. o dossiê reduz os suspeitos por capacidade, método e oportunidade;
9. o jogador solicita o mandado;
10. no encerramento, apresenta relatório com evidências e limitações;
11. o sistema atualiza as competências profissionais.

---

# 12. Novo esquema do caso

## 12.1 Estrutura de alto nível

```json
{
  "schemaVersion": "3.0",
  "metadata": {},
  "territories": {},
  "locations": [],
  "travelGraph": {},
  "suspects": [],
  "evidence": [],
  "constraints": [],
  "hypothesisRules": [],
  "minigames": [],
  "arrestPolicy": {},
  "reportTemplate": {},
  "progressionRewards": {},
  "campaign": {}
}
```

## 12.2 Versionamento

- `1.x`: caso linear anterior;
- `2.x`: campanha e cenários atuais;
- `3.x`: território, restrições, hipóteses, minijogos e carreira.

O carregador deverá detectar a versão e aplicar adaptadores de compatibilidade.

---

# 13. Máquina de estados proposta

```text
CASE_BRIEFING
    ↓
INITIAL_ANALYSIS
    ↓
TERRITORY_SELECTION
    ↓
LOCAL_INVESTIGATION
    ├── MINIGAME_ACTIVE
    ├── EVIDENCE_REVIEW
    └── HYPOTHESIS_REVIEW
    ↓
DOSSIER_ANALYSIS
    ↓
WARRANT_REQUEST
    ├── DENIED
    └── APPROVED
          ↓
FINAL_OPERATION
          ↓
REPORT_SUBMISSION
          ↓
CASE_EVALUATION
          ↓
CASE_CLOSED
```

Flags como `warrant`, `finished` e `rewarded` poderão continuar existindo na migração, mas a arquitetura-alvo deve representar transições explicitamente.

---

# 14. Validação automática de conteúdo

Antes de um caso ser aceito, o validador deverá verificar:

- referências inexistentes;
- evidências sem ação produtora;
- ações sem local;
- restrições sem campo correspondente;
- solução inexistente ou múltipla no final;
- pista essencial disponível fora da rota prevista;
- destino inalcançável;
- custo mínimo superior ao prazo;
- custo máximo razoável para os desvios previstos;
- suspeito identificável por um único atributo indevido;
- minijogo sem alternativa acessível;
- hipótese obrigatória sem evidência suficiente;
- relatório incompatível com a política de prisão;
- duplicação divergente entre cenário e capítulo.

Saída esperada:

```text
PASS
WARN
FAIL
```

Cada resultado deve incluir localização no JSON e explicação acionável.

---

# 15. Requisitos não funcionais

## 15.1 Desempenho

- filtragem deve responder imediatamente para conjuntos do MVP;
- dados territoriais devem ser carregados sob demanda quando necessário;
- minijogos não devem bloquear a interface principal.

## 15.2 Segurança

- conteúdo importado não deve ser inserido por `innerHTML` sem sanitização;
- casos importados devem passar por validação de esquema;
- arquivos devem possuir limites de tamanho e estrutura;
- dados de progresso não devem executar conteúdo do caso.

## 15.3 Resiliência

- save inválido deve ser recuperado ou isolado sem derrubar o jogo;
- localização ausente deve retornar à posição inicial válida;
- arquivos incompatíveis devem produzir mensagem de diagnóstico;
- falhas em recursos visuais não devem impedir a investigação.

## 15.4 Acessibilidade

- teclado em todas as ações;
- foco visível;
- textos equivalentes para elementos visuais;
- contraste adequado;
- suporte a movimento reduzido;
- minijogos com alternativa equivalente.

## 15.5 Testabilidade

- regras de domínio sem dependência do DOM;
- motor de restrições com testes unitários;
- rotas e orçamento com testes automatizados;
- casos com testes de solução;
- adaptadores de esquema com testes de compatibilidade.

---

# 16. Plano incremental de implementação

## Marco 0 — Estabilização do vertical slice

- corrigir derrota ao selecionar ação ou viagem sem saldo suficiente;
- recuperar save inválido;
- impedir conteúdo importado inseguro;
- revisar o significado de reiniciar;
- remover ou documentar campos não utilizados;
- consolidar as fontes duplicadas de cenário.

## Marco 1 — Evidência estruturada e restrições

- criar esquema de evidência enriquecida;
- implementar motor triestado de restrições;
- introduzir explicações de filtragem;
- migrar o dossiê atual por adaptador;
- reequilibrar suspeitos para impedir solução com um atributo.

## Marco 2 — Território hierárquico

- separar UF, município e local;
- migrar as cinco cidades existentes;
- conectar as 27 capitais ao catálogo territorial;
- adaptar mapa e viagens;
- validar rotas e custos.

## Marco 3 — Hipóteses e relatório

- criar quadro de hipóteses;
- vincular evidências favoráveis e contrárias;
- exigir hipótese de autoria no processo de mandado;
- implementar relatório final em Markdown e JSON;
- criar avaliação lógica do relatório.

## Marco 4 — Minijogos

- definir contrato comum;
- implementar os cinco tipos iniciais;
- integrar qualidade da evidência;
- adicionar alternativas acessíveis;
- recalcular orçamentos de tempo dos casos.

## Marco 5 — Progressão profissional

- criar perfil persistente;
- migrar estrelas;
- introduzir competências e patentes;
- configurar regras de promoção;
- liberar conteúdo por domínio demonstrado.

## Marco 6 — Escala de conteúdo

- publicar novos pacotes territoriais;
- ampliar categorias;
- introduzir editor de casos validado;
- criar painéis educacionais somente após estabilização do modelo de dados.

---

# 17. Priorização recomendada

```text
1. Estabilidade e segurança
2. Sistema de restrições
3. Modelagem de suspeitos
4. Hipóteses e relatórios
5. Expansão territorial
6. Minijogos
7. Progressão profissional
```

A expansão territorial não deve preceder o sistema de restrições. Acrescentar 27 estados ao modelo atual apenas aumentaria o volume de conteúdo sem aprofundar a dedução. Primeiro deve existir um mecanismo capaz de usar os atributos territoriais como informação investigativa.

---

# 18. Riscos e mitigação

## Risco: crescimento excessivo do JSON

**Mitigação:** separar catálogos territoriais, casos, campanhas e recursos, mantendo referências por identificador.

## Risco: restrições difíceis de explicar

**Mitigação:** exigir que cada operador produza uma explicação legível e testável.

## Risco: caso insolúvel

**Mitigação:** validador de solução, orçamento e unicidade antes da publicação.

## Risco: minijogos desconectados do aprendizado

**Mitigação:** nenhum minijogo é aceito sem declarar qual evidência produz e qual competência mobiliza.

## Risco: progressão transforma-se em pontos sem significado

**Mitigação:** promoções baseadas em competências demonstradas e variedade de casos.

## Risco: reescrita total paralisa o protótipo

**Mitigação:** adaptadores de compatibilidade e migração incremental por domínio.

## Risco: excesso de automatização remove a dedução

**Mitigação:** o sistema explica filtros, mas o jogador escolhe evidências, formula hipóteses e assume decisões.

---

# 19. Indicadores de sucesso

Os indicadores devem ser definidos durante o balanceamento, mas o produto deverá observar:

- proporção de casos concluídos com solução correta;
- quantidade de hipóteses revisadas após nova evidência;
- frequência de uso de múltiplas evidências por conclusão;
- ocorrências de mandado incorreto;
- tempo gasto em decisões relevantes e desvios;
- qualidade lógica dos relatórios;
- desempenho por competência;
- taxa de casos invalidados automaticamente antes da publicação;
- acessibilidade e conclusão dos minijogos por modalidade.

Não é proposta, neste documento, uma meta numérica sem dados de testes com usuários.

---

# 20. Definição de pronto da evolução

A evolução será considerada funcionalmente integrada quando:

- o jogador navegar entre entidades territoriais explícitas;
- evidências gerarem restrições computáveis;
- suspeitos forem reduzidos por múltiplas dimensões;
- uma hipótese sustentada for necessária para solicitar o mandado;
- pelo menos um minijogo produzir evidência de qualidade variável;
- o encerramento exigir relatório;
- a identificação correta, isoladamente, não garantir vitória;
- a prisão falhar de forma explicada quando houver insuficiência probatória, hipótese inconsistente ou procedimento inválido;
- o desempenho alimentar competências e carreira;
- casos antigos continuarem carregando por compatibilidade;
- o validador garantir solução única e orçamento viável;
- os principais fluxos possuírem testes automatizados.

---

# 21. Conclusão

O **Arquivo Zero** já possui uma base coerente para investigação orientada por dados. Seu maior valor está no motor configurável, na campanha por overlays, nos cenários alternativos, no orçamento temporal, na persistência e na separação prática entre lógica e conteúdo.

A evolução proposta não recomenda expandir apenas a quantidade de cidades ou casos. Recomenda aprofundar o núcleo cognitivo do produto.

O novo centro da experiência deverá ser:

```text
Obter evidência
    ↓
Interpretar restrição
    ↓
Comparar candidatos
    ↓
Formular hipótese
    ↓
Buscar confirmação ou contradição
    ↓
Justificar decisão
    ↓
Produzir relatório
```

Com essa transformação, o projeto deixa de ser somente uma caçada por rotas predefinidas e passa a funcionar como uma plataforma nacional de investigação, aprendizagem baseada em evidências e desenvolvimento de competências profissionais. Sua regra essencial permanece explícita: **identificar corretamente o criminoso não basta; o jogador precisa demonstrar sua responsabilidade com evidências, hipóteses consistentes e procedimento válido**.
