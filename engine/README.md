# engine — Animation Engine 2.0

Código compartilhado pelos demos e episódios novos. Os episódios 01–03, Cisma e Umbral **não** usam a engine e continuam como estavam.

| Módulo | O que faz |
|---|---|
| `core/math.js` | `clamp`, `lerp`, `seg`, easings, `K()` (keyframes do Cisma), `rnd()` (o mesmo hash do Panteões), `rng(seed)`, `wob`, `hop` |
| `core/timeline.js` | `makeTimeline(timeline.json)` → `wt`, `L0`, `L1`, `S0`, `S1`, `sceneAt` |
| `core/assets.js` | carregamento de imagens e JSON com cache (tudo antes do `READY`) |
| `camera/camera.js` | `createCamera(g)` → `cam`, `apply(depth)`, `screen`, `bg`, `layers`, `impacts`, `begin(t)`, `flash` |
| `characters/rig.js` | `Rig`: FK hierárquica, limites, IK de 2 ossos (`bend` 1, −1 ou 0 = automático), sockets, espelhamento, `draw` e `debug` |

## Regras

- Todo frame é função de `t`. Sem `Date.now`, `requestAnimationFrame`, `Math.random` ou estado guardado de um frame para o outro, porque o Opuscar renderiza blocos de frames em paralelo.
- Uma página usa a engine por um symlink dentro da própria pasta (`demos/<demo>/engine -> ../../engine`). O servidor do Opuscar não serve `../`.

## Testes

```sh
node --test engine/tests/engine.test.mjs
```

## Visualizador de rig

```sh
cd ~/lemo-opuscar && node core/render/still.mjs ~/animations/demos/rig-test 1 3.5 7 --size 1080x1920 --out /tmp/rig
```

Sem parâmetros, o visualizador mostra o boneco placeholder. Com `--q 'rig=assets/characters/zeus/rig.json'`, mostra um personagem real.
