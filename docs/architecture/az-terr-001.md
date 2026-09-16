# AZ-TERR-001 — Catálogo territorial brasileiro

**Status:** especificação 3.0  
**Escopo:** contrato territorial e regras de migração; não altera o motor nem `dist/game.json`.  
**Dependência:** `AZ-ARCH-001`

## Hierarquia

```text
Brasil
└── Região (5 regiões)
    └── Unidade Federativa (26 estados + Distrito Federal)
        └── Município
            └── Local investigável
```

Cada entidade possui ID estável e referência explícita ao pai. Município e local
investigável são entidades diferentes: o município organiza geografia e rotas;
o local contém ações e contexto do caso.

## Estruturas JSON

### Brasil

```json
{
  "id": "country-br",
  "name": "Brasil",
  "isoCode": "BR",
  "regionIds": ["region-norte", "region-nordeste", "region-centro-oeste", "region-sudeste", "region-sul"]
}
```

Obrigatórios: `id`, `name`, `isoCode`, `regionIds`. Opcionais: `metadata` e
`contentSourceIds`.

### Região

```json
{
  "id": "region-sudeste",
  "countryId": "country-br",
  "name": "Sudeste",
  "ufIds": ["uf-sp", "uf-rj", "uf-mg", "uf-es"]
}
```

Obrigatórios: `id`, `countryId`, `name`, `ufIds`. Opcionais: `summary`,
`contentSourceIds` e atributos regionais documentais sem efeito automático.

### Unidade Federativa

```json
{
  "id": "uf-sp",
  "regionId": "region-sudeste",
  "name": "São Paulo",
  "abbreviation": "SP",
  "type": "state",
  "capitalMunicipalityId": "municipality-sao-paulo",
  "municipalityIds": ["municipality-sao-paulo"],
  "investigativeAttributes": {
    "biomes": [],
    "economy": [],
    "airports": [],
    "highways": [],
    "universities": [],
    "productiveSectors": []
  },
  "contentSourceIds": []
}
```

Obrigatórios: `id`, `regionId`, `name`, `abbreviation`, `type`,
`capitalMunicipalityId`, `municipalityIds`, `investigativeAttributes` e
`contentSourceIds`. `type` aceita `state` ou `federal-district`.

Os atributos investigativos por UF são bioma, economia, aeroportos, rodovias,
universidades e setor produtivo. Cada item factual deve referenciar uma fonte de
conteúdo; lista vazia significa “não cadastrado”, não “inexistente”. Opcionais:
`aliases`, `summary` e `metadata`.

### Município

```json
{
  "id": "municipality-sao-paulo",
  "ufId": "uf-sp",
  "name": "São Paulo",
  "ibgeCode": null,
  "coords": { "latitude": -23.5505, "longitude": -46.6333 },
  "mapPosition": { "x": 570, "y": 690, "canvasId": "brazil-main" },
  "locationIds": ["location-laboratorio-horus"],
  "art": { "asset": "assets/cities/sao-paulo.webp", "status": "available" }
}
```

Obrigatórios: `id`, `ufId`, `name`, `coords`, `mapPosition`, `locationIds` e
`art`. Opcionais: `ibgeCode`, `aliases`, `summary`, `facts` e
`contentSourceIds`; valores desconhecidos usam `null` ou ausência documentada.

### Local investigável

```json
{
  "id": "location-laboratorio-horus",
  "municipalityId": "municipality-sao-paulo",
  "name": "Laboratório Hórus",
  "type": "crime-scene",
  "description": "Cena inicial do caso.",
  "actionIds": ["sp_camera", "sp_desk", "sp_cafe"]
}
```

Obrigatórios: `id`, `municipalityId`, `name`, `type`, `description` e
`actionIds`. Opcionais: `address`, `coords`, `openingConditions`, `tags`,
`contentSourceIds` e metadados do caso. Ações continuam entidades do caso e são
referenciadas por IDs.

## Coordenadas e posição no mapa

- `coords` representa geografia real em latitude/longitude WGS84, números em
  graus decimais. Serve a distância, fonte cartográfica e interoperabilidade.
- `mapPosition` representa projeção visual em pixels (`x`, `y`, `canvasId`).
  Serve exclusivamente à interface e pode variar entre mapas responsivos.
- Um campo nunca é derivado silenciosamente do outro. Conversão exige projeção
  declarada e teste próprio.
- A string legada como `"23.5°S 46.6°W"` é entrada de migração, não o formato
  canônico 3.0.

## Catálogo de arte

O diretório `dist/assets/cities/` contém 27 WEBPs, um para cada capital:

```text
aracaju, belem, belo-horizonte, boa-vista, brasilia, campo-grande, cuiaba,
curitiba, florianopolis, fortaleza, goiania, joao-pessoa, macapa, maceio,
manaus, natal, palmas, porto-alegre, porto-velho, recife, rio-branco,
rio-de-janeiro, salvador, sao-luis, sao-paulo, teresina, vitoria
```

O valor canônico é o caminho relativo `assets/cities/<slug>.webp`. Ao carregar
um destino sem arte cadastrada ou cujo arquivo não exista, o runtime deve emitir
`WARN TERRITORY_ART_MISSING` com o ID do município e renderizar um estado visual
explícito de arte indisponível. É proibido usar São Paulo ou qualquer outra arte
como fallback silencioso.

## Migração das cinco cidades atuais

| ID legado | Município | UF | Região | Arte preservada |
|---|---|---|---|---|
| `sao_paulo` | São Paulo | SP | Sudeste | `sao-paulo.webp` |
| `recife` | Recife | PE | Nordeste | `recife.webp` |
| `brasilia` | Brasília | DF | Centro-Oeste | `brasilia.webp` |
| `manaus` | Manaus | AM | Norte | `manaus.webp` |
| `porto_alegre` | Porto Alegre | RS | Sul | `porto-alegre.webp` |

Estratégia para `AZ-TERR-002`:

1. criar IDs canônicos de região, UF e município e manter aliases dos cinco IDs
   legados durante a transição;
2. converter `coords` textual em latitude/longitude sem substituir `x/y`;
3. migrar `x/y` para `mapPosition`, preservando a posição visual atual;
4. transformar cada item atual de `locations` em município com um ou mais locais
   investigáveis, preservando descrição, `city_info`, ações e seus IDs;
5. reescrever referências de `travel`, `navigation`, rotas e cenários por meio
   de uma tabela explícita de aliases, sem alterar custos ou conectividade;
6. validar que os nove cenários continuam solucionáveis antes de remover aliases.

## Critérios de aceite de `AZ-TERR-002`

- São Paulo, Recife, Brasília, Manaus e Porto Alegre são municípios distintos de
  seus locais investigáveis, ligados às UFs e regiões corretas.
- IDs legados resolvem deterministicamente para IDs canônicos durante a migração.
- `coords` geográficas e `mapPosition` preservam, respectivamente, significado
  geográfico e posição visual atual.
- Locais, ações, custos, rotas, navegação e nove cenários permanecem íntegros e
  solucionáveis.
- As cinco artes existentes são resolvidas pelo catálogo; caminho ausente gera
  WARN explícito, nunca fallback silencioso.

## Critérios de aceite de `AZ-TERR-003`

- O catálogo contém exatamente cinco regiões, 26 estados e o Distrito Federal,
  com IDs e abreviações únicos.
- Cada UF referencia a região correta e uma capital que, por sua vez, referencia
  a UF correta.
- As 27 capitais possuem `coords`, `mapPosition` e vínculo explícito ao WEBP
  correspondente em `dist/assets/cities/`.
- Atributos investigativos por UF possuem fontes ou permanecem vazios/
  desconhecidos; o runtime não inventa valores.
- Validação detecta pai inexistente, ID duplicado, capital inconsistente, arte
  ausente e mistura entre coordenada geográfica e pixel.
- Toda arte ausente ou ilegível gera `WARN TERRITORY_ART_MISSING` identificável.

## Fora de escopo

- Migrar o JSON vivo (`AZ-TERR-002`).
- Cadastrar o catálogo completo das 27 UFs/capitais (`AZ-TERR-003`).
- Implementar consultas territoriais (`AZ-TERR-004`).

