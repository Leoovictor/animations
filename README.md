# Animações — Histórias e Crenças

Vídeos verticais (1080×1920) do canal **Histórias e Crenças**, feitos inteiramente em código: narração, legendas, trilha, efeitos e animação.

| Pasta | Filme | Estilo | Duração |
|---|---|---|---|
| `cisma/` | O Grande Cisma de 1054 | Comic History Cartoon (bonecos de papel) | 2min12s |
| `umbral/` | Umbral — parte 1 | 3D toon (three.js) | 2min12s |
| `umbral2/` | Umbral — parte 2 | 3D toon (three.js) | 2min07s |
| `panteoes/` | O Encontro dos Panteões — Ep. 01: Zeus e os Orixás | Cartoon 2D estilo videogame | 2min05s |
| `panteoes2/` | Ep. 02: O despertar dos guardiões brasileiros | Cartoon 2D estilo videogame | 2min06s |
| `panteoes3/` | Ep. 03: O segredo de Asgard | Cartoon 2D estilo videogame | 2min07s |

Cada pasta tem:
- `<nome>.mp4`: o vídeo final, numa cópia mais leve (~2,4 Mbps) para caber no GitHub; o master fica fora do repositório;
- `poster.jpg`: a capa;
- a legenda (`subtitles_pt.srt` ou `<nome>.srt`);
- `TREATMENT.md`: o roteiro resumido e as decisões;
- `CREDITS`: voz, fontes, instrumentos e licenças;
- o código: `film.js`, `index.html`, `audio.py`, `lines.json` (as falas), `tools/` e `build.sh`.

A arte gerada fica em `src/` (originais) e `parts/` (recortes); os prompts estão em `tools/sheets.py` ou `tools/sheets.json`.

## Como refazer um vídeo

É preciso ter a biblioteca [lemo-opuscar](https://github.com/lemomo-ai/lemo-opuscar) instalada (por padrão em `~/lemo-opuscar`, ou indique o caminho em `LIB`), além de Node, Python e ffmpeg. Depois:

```sh
sh panteoes3/build.sh
```

O script gera a narração (Edge TTS), confere as falas com o Whisper, monta a linha do tempo, mixa o áudio, renderiza o vídeo, faz a masterização em −14 LUFS e roda o teste de leitura dos textos. O resultado sai em `out/` e no `<nome>.mp4` da pasta.

## Observações

As histórias são ficção inspirada em diferentes tradições culturais e religiosas, sem colocar nenhuma acima da outra. Os personagens são desenhos próprios; os Orixás e os guardiões brasileiros são representados com respeito, sem caricatura.
