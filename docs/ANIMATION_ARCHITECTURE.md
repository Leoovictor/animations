# Arquitetura proposta — Animation Engine 2.0

Status: **proposta**, ainda não implementada. Ela respeita o contrato do Opuscar (seção 2 da auditoria) e não altera os episódios publicados.

## 1. Princípios

- **Tempo absoluto:** todo frame é uma função pura de `t` e dos assets. A aleatoriedade usa um hash com seed, e não há estado acumulado entre frames (requisito dos workers paralelos).
- **Sem build step:** ES modules carregados direto pelo Chromium do Opuscar. Os `film.js` atuais já são `type="module"`, então não é preciso bundler nem bibliotecas novas.
- **Sem migração em massa:** os episódios 01–03, Cisma e Umbral ficam como estão. A engine nasce ao lado deles; só os novos demos e o Ep. 04 a usam.
- **Adaptadores:** as funções atuais (`cam`, `apply`, `bg`, `spr`, `bolt`, `portal`, `shake`, `flash`, `wt`, `L0`/`L1`/`S0`/`S1`) passam para a engine com a **mesma assinatura**, para que um `film.js` antigo pudesse migrar trocando cópias por imports.

## 2. Como a engine chega à página (testado)

O servidor do Opuscar só monta a pasta do filme. Por isso:

```
animations/
  engine/                       ← código compartilhado (fonte única)
  assets/                       ← arte compartilhada entre demos e episódios
  demos/pilot-zeus/
    engine -> ../../engine      ← symlink (testado: carrega via /@film/engine/...)
    assets -> ../../assets      ← mesmo motivo: o servidor não serve nada fora da pasta do filme
    index.html  film.js  ...
```

- O symlink fica commitado no git, funciona no macOS e no Linux e é o que o servidor aceita.
- **Alternativa** (Windows ou sem symlink): o script `tools/vendor-engine.sh` copia `engine/` para dentro do demo antes do build. Não será criado agora.

## 3. Estrutura de pastas

Adaptada da sugestão do documento; só o que o piloto usa é criado primeiro (marcado com ★).

```
engine/
  core/        ★ math.js (clamp, lerp, easing, K() keyframes do Cisma, rnd/hash com seed)
               ★ timeline.js (wt, L0/L1/S0/S1 a partir de timeline.json; seg)
               ★ assets.js (carrega imagens e manifestos; cache)
  camera/      ★ camera.js (cam/apply/bg com camadas; shake/flash a partir de uma lista de impactos)
  characters/  ★ rig.js (manifesto, FK hierárquica, IK de 2 ossos do Cisma, espelhamento, sockets)
               ★ animator.js (clips por canal, blend, prioridade)
               ★ clips/ idle, walk, lookUp, surprised, anticipation, castLightning, recoil (só os do piloto)
                 expressions.js (troca de boca, olhos e sobrancelhas)
  effects/     ★ bolt.js, particles.js, glow.js (portados do Ep. 03); portal.js, rift.js depois
  lighting/    ★ light.js (luz local aditiva + sombra de contato)
  audio/         (fica no Python: engine/audio/sfx.py compartilhado na Fase 7)
  ui/            caption.js, hud.js, cards.js (Fase 6; o piloto não tem narração)
assets/characters/zeus/   parts/*.png, rig.json, sheets/ (prompts e originais)
assets/backgrounds/forest/ far.png, mid.png, ground.png, fg.png
styles/mythology-chibi/   STYLE.md, paleta.json
demos/rig-test/ ★  (visualizador de pivôs e juntas)
demos/pilot-zeus/ ★ (piloto de 12 s)
demos/walk-cycle/, demos/combat-test/ (depois)
docs/
```

## 4. Rig: manifesto e desenho

`assets/characters/zeus/rig.json` (um por vista: `side`, `three_quarter`, `front`):

```json
{
  "view": "side", "units": "px", "scale": 1.0,
  "bones": [
    {"id": "pelvis",   "parent": null,       "image": "pelvis.png",   "pivot": [80, 40], "position": [0, 0],    "z": 5},
    {"id": "torso",    "parent": "pelvis",   "image": "torso.png",    "pivot": [90, 210],"position": [0, -10],  "z": 6, "limits": [-25, 25]},
    {"id": "head",     "parent": "torso",    "image": "head.png",     "pivot": [70, 150],"position": [10, -200],"z": 9, "limits": [-30, 35]},
    {"id": "upperArmR","parent": "torso",    "image": "uarm-r.png",   "pivot": [30, 25], "position": [20, -170],"z": 8, "limits": [-170, 60]},
    {"id": "forearmR", "parent": "upperArmR","image": "farm-r.png",   "pivot": [40, 35], "position": [0, 110],  "z": 8, "limits": [-140, 0]},
    {"id": "thighR",   "parent": "pelvis",   "image": "thigh-r.png",  "pivot": [35, 20], "position": [15, 30],  "z": 4, "limits": [-90, 60]},
    {"id": "shinR",    "parent": "thighR",   "image": "shin-r.png",   "pivot": [30, 20], "position": [0, 120],  "z": 4, "limits": [0, 140]}
  ],
  "sockets": {"handR": {"bone": "forearmR", "at": [40, 150]}, "footR": {"bone": "shinR", "at": [30, 150]}, "eyeL": {"bone": "head", "at": [95, 70]}},
  "faces": {"head": {"neutral": "head.png"}, "mouth": {"closed": "m0.png", "open": "m1.png", "shout": "m2.png"}, "brows": {"calm": "b0.png", "up": "b1.png", "angry": "b2.png"}}
}
```

**Como o rig funciona:**
- **FK:** a matriz de cada osso é a matriz do pai × `translate(position)` × `rotate(ângulo limitado)` × `translate(-pivot)`. É calculada por frame e sem estado.
- **IK:** `ik()` do Cisma (2 ossos, analítico) para mão→alvo e pé→chão. O ângulo resultante é limitado pelos `limits`. O pé de apoio fica preso a um ponto do mundo durante o contato (evita o deslizamento).
- **Espelhamento:** `flip` aplica escala −1 no nível do personagem. Ossos com lado (`L`/`R`) **não** trocam de imagem; trocam só a ordem de desenho (o braço de trás vai atrás do tronco). Assim o espelhamento não muda a identidade.
- **Faces:** a cabeça é uma base sem boca e sem sobrancelhas, com camadas trocáveis por cima. A expressão é um canal do animator.
- **Sockets:** `rig.socket('handR', t)` devolve a posição na tela. O `bolt()` sai daí, em vez das frações a olho atuais.
- **Juntas sem buracos:** cada peça é gerada com tampa arredondada na junta, sobreposta ao pai. A ordem `z` decide quem cobre quem.
- **Desempenho:** cada parte é um `drawImage` com transform; sem alocação por frame além das matrizes; imagens decodificadas uma vez.

### Geração das peças (resolve o bloqueio do `rig.json`)

1. Uma folha por vista no Codex image_gen, com a folha do Zeus do Ep. 01 como referência de identidade. Cada peça vem separada no verde, **com um ponto magenta (#FF00FF) puro no pivô e outro na ponta**.
2. `tools/extract_rig.py` (novo, ao lado do `extract.py`):
   - recorta as peças;
   - detecta os pontos magenta → `pivot`/`tip`;
   - apaga os pontos com inpainting simples a partir da vizinhança;
   - grava `parts/*.png` e um `rig.draft.json` com nomes provisórios.
3. A identificação de cada peça (qual é "forearmR") e as posições locais são revistas no **visualizador** (`demos/rig-test`). Ele desenha o esqueleto, os pivôs, os limites e as sobreposições, e salva o manifesto final à mão.

   Não é possível presumir que um gerador de imagem acerte proporções e encaixes. Por isso existe esse passo de revisão humana, previsto no roteiro.

## 5. Animator

```js
const zeus = await Character.load('assets/characters/zeus', { view: 'side' });   // caminho via symlink da pasta do demo
zeus.play({ action: 'walk', start: 0, duration: 3, speed: 1, direction: 1, channel: 'legs' });
zeus.play({ action: 'lookUp', start: 3.2, duration: .8, channel: 'head', expression: 'surprised' });
zeus.play({ action: 'castLightning', start: 6, duration: 3, intensity: .8, channel: 'body', priority: 2 });
zeus.draw(ctx, t, { x, y, scale, flip });   // pura: só depende de t
```

- **Clip:** uma função `(u, params) → {bone: ângulo, ...}` com `u` normalizado de 0 a 1. Os keyframes usam `K()` do Cisma, com easing por chave: antecipação, arcos e overshoot.
- **Canais:** pernas, tronco, braços, cabeça e rosto. Em cada canal vale o clip de maior prioridade ativo, com cross-fade de entrada e saída (`blendIn`/`blendOut`, padrão 0,15 s), calculado a partir de `t`.
- **Secundários:** cabelo, barba e túnica seguem com atraso (follow-through calculado por `t − δ`, sem simulação com estado). Piscada a cada ~3,3 s com seed.
- **Caminhada:** ciclo com contato, passagem, elevação e aterrissagem. O deslocamento do corpo é derivado do passo (comprimento da perna × fase), não de um `lerp` livre, para os pés não patinarem.

## 6. Câmera e cenário em camadas

- `bg()` atual = uma pintura. O novo `layers([{img, depth, y, scale}])` desenha fundo distante, plano médio, chão, personagens, primeiro plano e atmosfera, cada um com seu `depth`, usando o mesmo `apply(depth)`.
- **Arte:** geração separada por camada. As camadas com recorte (plano médio, primeiro plano) vêm no verde e passam pelo `extract.py`; o fundo distante e o chão são pinturas com margem horizontal (~1,6× a largura) para permitir pan.
- **Movimentos de câmera:** keyframes `K()` em `x`, `y`, `z` e rotação (tracking, pan, tilt, push). O shake só vem de impactos registrados (lista `IMP`, como hoje).

## 7. Luz e efeitos

- **Luz local:** gradiente radial aditivo em uma camada, mais um "rim" no personagem (desenho do rig de novo em modo `source-atop` com a cor da luz, com intensidade pela distância da fonte). Acontece só quando há raio, então não pesa nos outros frames.
- **Sombra de contato:** uma elipse escura sob cada pé apoiado, com a escala ligada à altura do pé.
- **Partículas e efeitos:** os do Ep. 03 portados (`rnd` com seed). O `glitch` continua opcional por ser o mais caro (78 ms no frame de teste).

## 8. Áudio, legenda e build

- **Áudio:** o `audio.py` continua por projeto. As funções comuns (`ostinato`, `pads`, `drums`, SFX sintetizados) vão para `engine/audio/sfx.py` na Fase 7, importado por caminho relativo ao repositório.
- **Eventos:** um único `EV` por página, como hoje; o mesmo objeto de impacto dispara imagem e som.
- **Modo estrito** para builds novos: `STRICT=1` (padrão nos demos novos) faz o `build.sh` falhar se o `readcheck` ou o ASR falharem. Os episódios antigos mantêm o `|| true`.
- **Render:** o mesmo `video.mjs` / `mux.sh`. O piloto usa `--fps 30 --size 1080x1920` (360 frames).
