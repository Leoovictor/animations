# Roadmap de implementação

Status das fases:

| Fase | Status |
|---|---|
| 0 | **concluída** |
| 1 | aguardando a imagem de referência e aprovação |
| 2 a 8 | não iniciadas |

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
