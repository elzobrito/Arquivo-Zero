# Arquivo Zero — Caçada Digital

Jogo educacional investigativo desenvolvido com HTML, CSS e JavaScript puro. O conteúdo do caso, os suspeitos, as cidades, as pistas, os custos de viagem e os critérios para prisão são definidos em `dist/game.json`.

![Vista de São Paulo em pixel art](dist/assets/cities/sao-paulo.webp)

## Arquivos

- `dist/index.html`: estrutura da interface.
- `dist/styles.css`: layout responsivo e identidade visual.
- `dist/app.js`: motor do jogo, persistência, tempo, viagens, mandado, prisão e estrelas.
- `dist/game.json`: definição completa do caso.
- `.openai/hosting.json`: configuração usada na publicação do site.

## Executar localmente

Na pasta raiz do projeto, execute:

```bash
python3 -m http.server 8000 -d dist
```

Depois, abra:

```text
http://localhost:8000
```

O servidor local é necessário porque o navegador carrega `game.json` com `fetch()`.

## Criar outro caso

Edite ou substitua `dist/game.json`. O arquivo controla:

- metadados e prazo;
- banco de suspeitos;
- campos do dossiê;
- quantidade e tipos de evidência;
- requisitos probatórios para a prisão;
- cidades e destinos disponíveis;
- rota verdadeira e destinos-isca;
- locais investigáveis e custo em horas;
- mandado, captura, liberação e derrota.

O botão **Importar caso** também permite testar outro JSON diretamente pela interface.

## Persistência

O progresso e as estrelas são armazenados em `localStorage` no navegador. Reiniciar uma investigação apaga apenas a partida atual; as estrelas acumuladas permanecem.
