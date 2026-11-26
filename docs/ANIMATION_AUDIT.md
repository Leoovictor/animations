# Auditoria do pipeline de animação (Fase 0)

Data: 2026-11-26 · Branch: `feature/animation-engine-v2` (a partir de `origin/main` d975ac9) · Nenhum episódio, MP4, narração ou asset original foi alterado.

O que foi **executado** nesta fase (não é análise estática):
- leitura do código;
- renderização de frames isolados e em sequência;
- comparação de hash;
- teste de import por symlink no servidor da biblioteca;
- leitura dos logs de render.

Nenhum render completo foi refeito.

## 1. Ambiente verificado

| Item | Versão / caminho |
|---|---|
| Lemo-Opuscar | `~/lemo-opuscar`, commit `00a7f9e` (2026-11-17), sem alterações locais |
| Node | v24.19.0 |
| Python (venv da biblioteca) | 3.12.16 (o `python3` do sistema é 3.9.6 e não é usado pelo pipeline) |
| FFmpeg | 9.0.2 |
| Renderizador | `playwright-core` ^1.63 (Chromium headless), `three` ^0.170 (só Umbral) |
| Geração de imagem | Codex CLI 0.169 via `core/image/gen_image.py` (`--check` passa) |
| Voz / ASR | Edge TTS (`core/tts/tts_zh.py`), faster-whisper `medium` (`core/tts/asr_check.py`) |
| CLAUDE.md | não existe no repositório |
| `gh` / Git LFS | não instalados; o push funciona por HTTPS com credencial do keychain |

## 2. Contrato de renderização (Opuscar)

Verificado em `core/render/page.mjs`, `video.mjs`, `still.mjs`, `events.mjs`, `readcheck.mjs` e `serve.mjs`.

- **A página precisa expor:**

  | Item | Função |
  |---|---|
  | `window.DUR` | duração em segundos |
  | `window.render(t)` | desenha o frame no tempo `t` |
  | `window.READY` | avisa que a página carregou |
  | `window.EV` | eventos de áudio |
  | `window.TEXTS(t)` | caixas de texto, para o readcheck |

- **Workers:** o `video.mjs` divide o filme em blocos contíguos, um por worker. Cada worker abre o próprio Chromium, renderiza o bloco em ordem e captura JPEG com qualidade 95, enviado ao ffmpeg. Os blocos rodam em paralelo, então **o estado não pode depender de frames anteriores**.
- **Servidor:** serve a raiz da biblioteca (`/core`, `/node_modules`, `/styles`) e monta **apenas a pasta do filme** em `/@film/`.
  - **Teste:** `import '../engine/x.js'` a partir da página dá 404, e o renderizador aborta.
  - **Teste:** `./engine/x.js`, quando `engine` é um symlink dentro da pasta do filme, carrega normalmente (frame verde de confirmação).
- **Script de erro:** um 404 de script interrompe o render; um 404 de fetch ou imagem gera só um aviso.

## 3. Pipeline atual (Panteões 1–3, o mais recente)

```
tools/sheets.py ─► tools/gen.sh ─► src/*.png (Codex image_gen, fundo verde #00B140; fundos 9:16 sem chroma)
                         │ (manual, fora do build.sh)
tools/extract.py ─► parts/<folha>_<n>.png + parts/index.json  ← só {w,h} por sprite; cada sprite = uma figura inteira
lines.json ─► tts_zh.py ─► voices/*.wav, dur.json ─► asr_check.py ─► voices/words.json (tempo por palavra)
tools/timeline.py ─► timeline.json (cenas na grade de 0,25/0,5 s, falas, palavras, blocos de legenda 2–5 palavras) ─► srt.py
index.html + film.js (Canvas 2D, ES module) ─► events.mjs ─► events.json ─► audio.py (sampler + SFX sintetizados, ducking) ─► out/mix.wav
video.mjs (4 workers, 30 fps, 1080×1920) ─► out/video.mp4 ─► mux.sh (−14 LUFS) ─► <nome>.mp4 ─► readcheck.mjs ─► out/readcheck.txt
```

| Etapa | Onde | Observação |
|---|---|---|
| Geração de arte | `tools/sheets.py`, `tools/gen.sh` | Uma folha por personagem com poses inteiras. A referência de estilo é a folha do Zeus do Ep. 01. Fica fora do `build.sh`. |
| Recorte | `tools/extract.py` | Chroma key, componentes conexos e ordenação por x. O índice muda se a imagem mudar. Não gera pivôs. |
| Poses | `spr(key, x, y, h, o)` | Desenha o sprite inteiro com translate/rotate/scale/flip, `sway` (fatias horizontais com seno) e `tint` (silhueta). Uma pose é trocada por outra sprite, sem transição. |
| Pontos de ação | `at(rect, fx, fy)` | Mão, machado e espada são frações medidas a olho numa grade (ex.: `zeus_2` mão = .3,.05). Quebram se a arte mudar. |
| Câmera | `cam(z,x,y,r)` + `apply(depth)` | Câmera 2D única. O parallax é feito escalando o mesmo transform por `depth`. |
| Cenário | `bg(key, depth, o)` | **Uma pintura 9:16 por cenário**, com escurecimento por overlay. As camadas extras (nuvens, folhas, neve, névoa) são feitas em código. Não há arte separada de plano médio ou chão. |
| Efeitos | `bolt`, `portal`, `rift`, `particles`, `glitch`, `fog`, `wind`, `rays` | Determinísticos com `rnd(i,k)` (hash de seno) e `floor(t*k)`. O `glitch` copia o canvas inteiro (o frame mais caro). |
| Impacto | lista `IMP` → `shake()` / `flash()` | O mesmo evento alimenta o som (`events()`): sincronização boa. |
| Legendas | `caption()` + `timeline.cues` | Palavra por palavra a partir do Whisper, em Anton com destaques amarelo/vermelho, y≈1340. `NOCAP` é manual. |
| HUD | `hud()` por episódio | Reescrito a cada episódio. |
| Áudio | `audio.py` | Trilha montada por funções (`ostinato`, `pads`, `drums`, `horns`, `stab`), SFX sintetizados, ducking por envelope da voz, compressão e limitador; −14 LUFS no `mux.sh`. |

### Cisma (bonecos articulados)

O Cisma (`cisma/lib.js`, `cisma/parts/rig.json`) é o único filme com bonecos articulados. Ele foi lido inteiro.

**O que existe:**
- `rig.json`: para cada parte, `bb`, `top`, `bot`, `W` e `H`. O `top` e o `bot` são os pontos de encaixe (pivô e ponta).
- `drawPuppet()`:
  - pernas em FK, cada uma uma peça única, sem joelho;
  - braços em FK, ou IK analítico de 2 ossos (`ik(S, alvo, L1, L2, bend)`, com dobra escolhida);
  - cabeça trocada por expressão (`heads: {n, angry, smug, wow}`);
  - chapéu e acessórios presos à cabeça;
  - objetos na mão por callback (`hold`);
  - devolve a posição das mãos e da cabeça (funciona como sockets).
- `pup()`: monta o boneco numa camada própria e aplica uma sombra única.

**Limitações reais:**
- não há hierarquia declarada: ombros, quadril e pescoço vêm de frações fixas da caixa do tronco (`torsoPts`);
- não há limites de rotação, joelhos, pés, IK de pernas nem contato com o chão;
- o boneco é sempre frontal: não há vistas lateral e três quartos, nem regra de espelhamento;
- usa variáveis globais (`RIGJ`, `IMG`, `LAYER`, `CUR_S`) e um mapa de índices escrito à mão (`PUP`);
- **o script que gerou `top` e `bot` não está no repositório** (o `extract.py` do Cisma só grava `index.json`). Não dá para regenerar o rig a partir das folhas; isso é um bloqueio para reaproveitar a ferramenta como está.

**O que é reaproveitável:**
- `ik()`;
- `follow()` (transformar um ponto local para a tela);
- `put()` (desenhar a parte pelo pivô);
- `K()` (keyframes com easing por chave);
- `wob`, `hop` e `rng(seed)`;
- a ideia de camada + sombra única.

## 4. Duplicação entre episódios

Contagem de linhas únicas iguais com `comm` (indicador aproximado):

| Par | film.js | audio.py |
|---|---|---|
| Ep. 01 × Ep. 02 | 209 | 146 |
| Ep. 02 × Ep. 03 | 282 | 201 |
| Ep. 01 × Ep. 03 | 209 | 149 |

Cada episódio copia o motor inteiro (helpers, legenda, `pill`, `unlock`, `brand`, HUD) e altera partes. As cópias já divergiram: por exemplo, `unlock` ganhou `o.banner` no Ep. 02 e `bar` mudou de regra de perigo. Corrigir um bug exige editar três arquivos.

## 5. Falhas silenciosas

| Arquivo | Linha | Efeito |
|---|---|---|
| `*/build.sh` (6 filmes) | `readcheck.mjs … || true` | O build termina "ok" mesmo com texto ilegível; o resultado só aparece em `out/readcheck.txt`. |
| `panteoes*/build.sh` | `asr_check.py … || true` | Uma fala mal pronunciada (ex.: "Heimdall" → "Endau") não para o build. |
| `*/build.sh` | geração e recorte da arte fora do script | Rodar `build.sh` não reproduz a arte; depende de `src/` e `parts/` já presentes. |
| `tools/extract.py` | índices por ordem de x | Uma folha regenerada pode trocar `zeus_1` por `zeus_2` sem aviso. |

## 6. Determinismo (testado)

- Nenhum uso de `Date.now`, `requestAnimationFrame` ou `Math.random` nos `film.js`, `lib.js` e `world.js`.
- **Teste:** o frame `t=50` do Ep. 03 renderizado sozinho e o mesmo frame renderizado depois de `t=10`, `88` e `30` (ordem embaralhada) deram **MD5 idêntico** (`4a5e9fd5…`).
- Caches usados (`TINT` e camadas assadas do Cisma) dependem só da chave, não do tempo. São seguros.

## 7. Baseline de desempenho e qualidade

| Medida | Valor | Origem |
|---|---|---|
| Render completo do Ep. 01 / 02 / 03 | 3748 / 3771 / 3796 frames em 40 / 41 / 40 s | `out/video.log`, 4 workers, 1080×1920 |
| Vazão agregada | ≈ 94 frames/s, incluindo captura JPEG e ffmpeg | idem |
| Frame isolado | 19–78 ms (t=10: 19 ms; t=50: 31–37 ms; t=88, com glitch e raios: 78 ms) | `still.mjs`, Ep. 03 |
| Loudness final | −14,0 LUFS integrados, pico −1,5 dBFS | `mux.sh` |
| Readcheck dos três episódios | 0 falhas no último build | `out/readcheck.txt` |

**Qualidade visual** (avaliação nos contact sheets já gerados nos episódios):
- arte forte e consistente;
- personagens "deslizam": a sprite de caminhada é transladada com quique e as pernas não se movem;
- troca brusca de pose entre sprites;
- expressões só em closes, com troca de imagem;
- a origem dos raios é aproximada;
- o parallax vem de uma única pintura, então não há separação real entre planos.

São exatamente os pontos que a engine 2.0 precisa resolver.

## 8. Faltas e bloqueios

1. **Imagem de referência do jogo (Fase 1): não está no computador.** O único PNG recente em Downloads não é essa referência. Preciso que você envie a imagem.
2. **Gerador do `rig.json` do Cisma:** ausente. Precisa ser reescrito (proposta: marcadores de pivô detectáveis; ver arquitetura).
3. **Peças articuladas do Zeus:** não existem. As folhas atuais têm figuras inteiras. Precisam ser geradas.
4. **Fundos em camadas:** não existem. Cada cenário é uma pintura única.
5. **Decisão de estilo:** o estilo chibi (cabeça grande, pernas curtas) muda as proporções heroicas usadas nos Ep. 01–03. A identidade (cores, roupa, rosto) pode ser mantida, mas o Zeus do piloto não vai encaixar no corpo antigo. Isso precisa de aprovação.
6. **Código existente que o documento cita e foi verificado:** `cam`, `apply`, `bg`, `spr`, `breathe`, `shake`, `flash`, `bolt`, `portal`, `wt`, `L0`/`L1`/`S0`/`S1`. Estão no `panteoes3/film.js`, com assinaturas idênticas nos Ep. 02 e 03; no Ep. 01, `shake` e `flash` são as mesmas.
