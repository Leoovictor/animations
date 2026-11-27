# Roadmap de implementação

Status das fases:

| Fase | Status |
|---|---|
| 0 | **concluída** |
| 1 | guia v1 escrito (`docs/MYTHOLOGY_CHIBI_STYLE.md`), proporções chibi aprovadas; **imagem de referência do jogo ainda pendente** |
| 2 (engine compartilhada) | **itens 1–3 feitos**; itens 6 e 7 com a parte de código pronta, testada num rig placeholder |
| 3 (assets e rig do Zeus) | **aprovada** (1ª aprovação visual, `assets/characters/zeus/preview.jpg`) |
| 4 (movimentos do piloto) | **aprovada em 2026-11-27** (rig v2 em perfil, tornozelo com pé plano, passada simples, ajustes finos do usuário no editor) |
| 5 a 8 | não iniciadas |

## Progresso (2026-11-26)

| Item | Estado | Evidência |
|---|---|---|
| 1 · `engine/core/{math,timeline,assets}.js` | feito | `node --test engine/tests/engine.test.mjs`: 15/15 |
| 2 · `engine/camera/camera.js` (cam/apply/screen/bg/flash/shake + `layers()`) | feito; `layers()` ainda sem arte real | teste de shake; `layers()` será verificado com o cenário da floresta |
| 3 · symlinks `demos/rig-test/{engine,assets}` | feito | o demo carrega os módulos pelo symlink no `still.mjs` |
| 6 · visualizador `demos/rig-test` | código pronto; aceita `?rig=<rig.json>` | stills de limites, IK e espelhamento com o rig placeholder |
| 7 · `engine/characters/rig.js` (FK, limites, IK 2 ossos com `bend` automático, sockets, flip) | código pronto | testes de FK, IK (< 1 px nas duas direções), limites, anatomia do joelho, espelhamento e determinismo; MD5 igual do frame 4.6 isolado e fora de ordem |
| 4 · folhas do Zeus chibi (`assets/characters/zeus/sheets/`) | feito: 1 model sheet (2 gerações; a 1ª saiu com ~5 cabeças de altura e foi refeita) + 2 folhas de peças com marcadores | `zeus_model.png`, `zeus_parts_a.png`, `zeus_parts_b.png` |
| 5 · `tools/extract_rig.py` | feito: recorta, mede pivôs (magenta) e encaixes (ciano), apaga os marcadores e o anel escuro em volta preenchendo só a partir do interior da peça, e aplica escala por peça | 14 peças, 14 pivôs; sem resíduo visível na inspeção em tamanho real |
| 5b · `tools/assemble_rig.py` + `rig_plan.json` | feito: posições vêm dos marcadores; `offset` manual só no pescoço (+16 px) | `assets/characters/zeus/rig.json` (11 ossos, 4 sockets, variantes de rosto e de mão) |
| 8 · `engine/characters/animator.js` + `clips.js` | feito: camadas por prioridade com blend de entrada e saída pelo caminho mais curto do ângulo; pernas por IK com o lado do joelho escolhido uma vez; joelhos sempre um pouco dobrados; alvo fora de alcance levanta o pé em vez de arrastar; follow-through da cabeça; sombra de contato. Clips: idle, walk, lookUp, surprised, anticipation, castLightning, recoil | `engine/tests/animator.test.mjs` 8/8 (pé de apoio < 2 px entre frames; pés no alvo < 2 px no piloto inteiro; joelho na frente; nenhum salto > 25° por frame fora do golpe; deslocamento só na caminhada; ordem de avaliação indiferente; mão acima do pescoço no golpe) |
| 8b · `demos/clips` | feito: galeria com a atuação dos 12 s do piloto (`acting.js`, a mesma usada nos testes) | `demos/clips/out/galeria.mp4` (1080×1920, 30 fps, 12,0 s, 360 frames) |
| 9–12 | não iniciados | efeitos, luz, cenário em camadas e o piloto final |

**Limitações dos movimentos v1:**
- Sem piscada: os rostos são imagens inteiras, sem camada de olhos.
- Sem boca falando: não há visemas.
- O braço de trás é animado só em FK.
- A caminhada tem um único ritmo (0,9 s por ciclo).
- Os clips run, talk, fear, point, weaponAttack, hitReaction, fall, land e heroPose ficam para depois do piloto.

**Limitações conhecidas do Zeus v1:**
- Tronco e quadril saíram mais em três quartos do que de perfil, então o corpo fica em três quartos e a cabeça de perfil.
- O ombro do braço de trás aparece um pouco "embolado".
- A pose de repouso tem as pernas afastadas.
- As escalas por peça foram medidas no model sheet e ainda podem ser afinadas.
- Os limites de ângulo são genéricos e serão ajustados com os clips.

**Placeholder:** `engine/tests/fixtures.mjs` é um boneco de cápsulas feito em código, só para testar a matemática. Não é arte de personagem e não entra em vídeo nenhum.

Esforço estimado: P (pequeno, até ~2 h), M (meio dia), G (1–2 dias). As estimativas são para trabalho no ambiente verificado e não incluem rodadas de aprovação visual.

## Menor conjunto de mudanças para o piloto de 12 s

| # | Arquivo | Problema | Solução | Prioridade | Esforço | Risco | Teste |
|---|---|---|---|---|---|---|---|
| 1 | `engine/core/{math,timeline,assets}.js` | O motor é copiado em cada `film.js` (209–282 linhas comuns) | Extrair `clamp`/`lerp`/easing/`K()`/`rnd`, `wt`/`L0`/`S0` e o loader para módulos, mantendo as assinaturas | Alta | P | Baixo: os episódios antigos não importam | Teste unitário em Node das funções puras; frame de teste igual ao Ep. 03 para `rnd`/easing |
| 2 | `engine/camera/camera.js` + `layers()` | Parallax de uma pintura só | Portar `cam`/`apply`/`bg`/`shake`/`flash` e adicionar `layers()` por profundidade | Alta | P | Baixo | Demo com 4 camadas e pan: a camada próxima se move mais que a distante (medição de offset em 2 frames) |
| 3 | `demos/*/engine`, `demos/*/assets` (symlinks) | O servidor não serve `../` | Symlinks para `../../engine` e `../../assets` | Alta | P | Médio no Windows | Já testado no scratchpad; repetir no demo real |
| 4 | `assets/characters/zeus/sheets/*` + `tools/sheets_rig.py` | Não há peças articuladas | Folhas de peças por vista (lateral primeiro), com pontos magenta de pivô, a partir da folha do Ep. 01 | Alta | M | **Alto**: o gerador pode errar proporções ou encaixes (pode exigir 2–4 gerações) | Contact sheet das peças; conferência visual da identidade com o Zeus do Ep. 01 |
| 5 | `tools/extract_rig.py` | O gerador do `rig.json` do Cisma está ausente | Recortar, detectar pivôs magenta, apagar marcadores e gravar `rig.draft.json` | Alta | M | Médio | Debug com pivôs desenhados; nenhum pixel magenta restante (contagem) |
| 6 | `demos/rig-test/` | Pivôs não são verificáveis | Visualizador: esqueleto, pivôs, limites, juntas e sobreposição; manifesto final | Alta | M | Baixo | Frames com cada junta em −limite/0/+limite; inspeção de buracos nas juntas |
| 7 | `engine/characters/rig.js` | `spr()` só transforma sprites inteiros | FK hierárquica, limites, IK de 2 ossos (do Cisma) para mão e pé, espelhamento, sockets | Alta | M | Médio | Testes: mesma pose → mesma matriz; IK alcança o alvo dentro de 1 px; o flip preserva a ordem de desenho |
| 8 | `engine/characters/animator.js` + 7 clips | Não há atuação | Canais, prioridade, blend; clips idle, walk, lookUp, surprised, anticipation, castLightning, recoil | Alta | G | Médio | Galeria de clips; pé de apoio parado durante o contato (deslocamento < 2 px entre frames de apoio) |
| 9 | `engine/effects/*`, `engine/lighting/light.js` | O raio sai de frações a olho; não há luz local | Portar `bolt`/`particles`/`glow`; raio a partir do socket; luz aditiva + rim + sombra de contato | Média | M | Baixo | Frame do impacto: origem do raio = socket (distância < 3 px); luz desliga fora do evento |
| 10 | `assets/backgrounds/forest/*` | Não há cenário em camadas | Gerar fundo distante, plano médio (verde), chão com margem e primeiro plano | Média | M | Médio (consistência entre camadas) | Contact sheet; pan de 3 s sem bordas visíveis |
| 11 | `demos/pilot-zeus/{index.html,film.js,audio.py,build.sh}` | — | Piloto de 360 frames conforme o storyboard da Fase 8; áudio: passos, vento, carga, impacto (sem narração) | Alta | M | Médio | `ffprobe` (1080×1920, 30 fps, 12,0 s); render fora de ordem = MD5 igual; −14 LUFS; frames de comparação antes/depois |
| 12 | `demos/pilot-zeus/build.sh` | `|| true` esconde falhas | `STRICT=1`: readcheck/ASR falham o build (o piloto quase não tem texto) | Média | P | Baixo | Forçar um texto curto e confirmar que o build para |

**Não entra no piloto** (fica para depois da aprovação):
- vistas frontal e três quartos;
- clips run, talk, fear, point, weaponAttack, hitReaction, fall, land e heroPose;
- visemas;
- HUD e legenda na engine;
- `sfx.py` compartilhado;
- Xangô, Tupã e Thor;
- Ep. 04.

## Ordem proposta

1. Fase 1 — Direção artística: `docs/MYTHOLOGY_CHIBI_STYLE.md`. **Precisa da imagem do jogo** e da sua decisão sobre as proporções chibi.
2. Itens 1–3 (engine mínima e symlink).
3. Itens 4–6 (peças do Zeus, extração e visualizador). **Primeira aprovação visual:** o Zeus montado em pose neutra e em poses-limite.
4. Itens 7–8 (rig e animator). **Segunda aprovação:** a galeria de clips.
5. Itens 9–10 (efeitos, luz e cenário).
6. Itens 11–12 (piloto e QA). **Aprovação final** antes de expandir para os outros personagens.

## Decisões pendentes (suas)

1. Enviar a **imagem de referência do jogo** citada na Fase 1.
2. **Proporções chibi:** confirmar se o Zeus do piloto pode ter cabeça maior e pernas curtas. Rosto, cabelo, roupa e cores seriam mantidos; o corpo não ficaria igual ao dos Ep. 01–03.
3. **Vista do piloto:** começar só pela **vista lateral** (recomendado: é o que a caminhada e o ataque precisam).
4. **Gerações de imagem:** autorizar várias gerações no Codex para as folhas de peças e as camadas do cenário (estimativa de 6–10 gerações).
5. **Symlink no repositório:** aceitar (funciona no macOS e no Linux; no Windows exige `core.symlinks`).


## Revisão após a 2ª aprovação visual (2026-11-26): rig v2 em perfil

**Problema apontado:** as partes não casavam. A cabeça estava de perfil, mas o tronco e o quadril em três quartos, quase de frente, e os braços e pernas pendiam das bordas de um peito frontal.

**Causa:** cada folha de peças foi gerada separadamente, e o gerador não manteve nem a vista nem a proporção. Uma segunda tentativa, com folhas "cortadas da figura de perfil", ainda saiu com membros finos e longos.

**Solução que funcionou:**
1. `zeus_side.png`: um Zeus chibi em perfil puro, usado como referência.
2. `zeus_exploded.png`: uma **edição** dessa mesma figura, explodida em peças (`--edit` no `gen_image.py`). Assim todas as peças saem na mesma escala, com as proporções chibi e com tampas arredondadas nas juntas.
3. As expressões de surpresa e grito vêm da folha antiga, escaladas para a nova cabeça.
4. O visualizador ganhou `?ref=1`: desenha a referência, a sobreposição e o rig lado a lado. Foi assim que conferi o encaixe e ajustei o quadril (a junta fica alta, sob a saia), a cintura e o pescoço.

**Mudanças no extrator:**
- **Apagar os marcadores por preenchimento suave:** convolução normalizada a partir dos pixels claros da própria peça. O método anterior, por vizinho mais próximo, deixava cunhas escuras.
- **`trim`:** corta as tampas da cintura, que quase não dobra.
- **`copies`:** cria os membros de trás escurecidos.

**Camadas:**
- O braço da frente (z 10) é desenhado sobre a cabeça, porque de perfil ele está mais perto da câmera que a barba. Antes, o golpe sumia atrás dela.
- O braço de trás pende mais à frente, escondido pelo tronco.

**Limitações:**
- A mão é sempre o punho, porque a edição só gerou o punho.
- Ainda há um leve borrão onde estavam alguns marcadores (base do pescoço, tampa do cotovelo).


## 2ª aprovação visual (2026-11-27)

O usuário aprovou o Zeus e os movimentos ("está perfeito agora").

**Mudanças desde a revisão v2:**
- toco de pescoço removido do tronco e encurtado na cabeça;
- antebraço de trás com o punho visto por dentro (nova peça a partir da foto de referência);
- bolinhas sob as sandálias removidas;
- tornozelo: a canela foi dividida em perna e pé, e o pé fica sempre plano;
- passada simplificada;
- editor de encaixe (`demos/rig-editor`), com os ajustes finos feitos pelo usuário.

**Próximo:** itens 9–12 (cenário da floresta em camadas, raio a partir do socket da mão, luz local, partículas e vento, câmera, áudio e o piloto de 12 s).


## Fases 5–8: piloto de 12 s (2026-11-27), aprovado pelo usuário

- **Cenário em camadas** (`assets/backgrounds/forest/`): 4 imagens geradas, preparadas por `tools/key_layer.py` (recorte por distância à cor do fundo, para a folhagem verde não sumir; detecção da linha do caminho).
- **Engine:**
  - `engine/effects/fx.js`: raio, faíscas, partículas e brilho;
  - `engine/lighting/light.js`: luz local só nos pixels do personagem, luz no chão e gradação;
  - o rig respeita a câmera (antes desenhava em coordenadas absolutas);
  - `loadImages({ canvas: true })` deixa os frames iguais em qualquer ordem.
- **Piloto** (`demos/pilot-zeus/`): câmera por trecho, raio saindo do encaixe da mão, luz, vento e folhas, som com os mesmos eventos da imagem e build estrito.
- **QA:** ver `demos/pilot-zeus/README.md`.

**Próximo, depois da aprovação:** expandir para Xangô, Tupã e Thor e produzir o Panteões Ep. 04.
