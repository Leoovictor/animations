# Piloto do Zeus (12 s)

Demo isolada da Animation Engine 2.0: 1080×1920, 30 fps, 360 frames. Nenhum episódio foi alterado.

| Intervalo | Ação | Câmera, efeitos e som |
|---|---|---|
| 0–3 s | Zeus caminha, com pernas articuladas e pés plantados | Acompanha lateralmente; floresta em 4 camadas (parallax); passos |
| 3–6 s | Para, olha para cima e se surpreende | Plano médio com um empurrão curto no susto; vento, folhas e nuvens escuras; a luz ambiente cai |
| 6–9 s | Prepara o golpe e acumula energia no punho | Aproximação lenta; faíscas no encaixe da mão; zumbido elétrico crescente |
| 9–12 s | Lança o raio, recua e se recupera | Raio sai do encaixe da mão; luz azul só no Zeus e no chão; um tremor no impacto; trovão |

## Como refazer

```sh
sh demos/pilot-zeus/build.sh
```

O script gera os eventos, o som, o vídeo, a masterização e o readcheck. O build para se algo falhar (`set -e`). O readcheck devolve 2 porque o piloto não tem texto na tela, e o script aceita esse caso.

## Arquivos

- `pilot-zeus.mp4`: o piloto.
- `frames/storyboard.jpg`: um quadro por trecho.
- `frames/antes_depois.jpg`: Ep. 03 × piloto.
- `film.js` (imagem), `audio.py` (som), `acting.js` → `../clips/acting.js` (a atuação, a mesma da galeria e dos testes).
- Arte: `assets/characters/zeus/` e `assets/backgrounds/forest/` (prompts em `prompts.py`; as camadas são preparadas por `tools/key_layer.py`).

## QA (2026-11-27)

| Verificação | Resultado |
|---|---|
| `ffprobe` | 1080×1920, 30/1, 360 frames, 12,000 s, com áudio |
| Loudness | −14,4 LUFS, pico −1,7 dBFS; sem trechos pretos |
| Determinismo | os frames 1,3 s, 4,2 s e 9,15 s dão o mesmo MD5 renderizados sozinhos ou depois de 11 s, 2 s e 6,5 s |
| Testes da engine | `node --test engine/tests/*.test.mjs` 24/24 |

Achado do QA: o Chrome guarda versões reduzidas de imagens `<img>`, e o resultado dependia do que tinha sido desenhado antes. Por isso as imagens agora são copiadas para canvas no carregamento (`loadImages(..., { canvas: true })`).

**Limitações:**
- Na faixa de baixo (área da interface do TikTok) aparecem as plantas do primeiro plano e o fim da faixa de chão.
- O Zeus não pisca nem fala.
