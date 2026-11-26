# Mythology Chibi Cartoon — guia de estilo

Status: **versão 1**, escrita a partir da descrição da seção 5 do `ANIMATION_ENGINE_V2.md` e da identidade dos personagens dos Ep. 01–03. **A imagem de referência do jogo ainda não foi recebida.** Quando chegar, este guia será revisado só como referência de linguagem: nada de personagens, interface, moedas, botões ou barras de vida do jogo.

## 1. Linguagem

Desenho animado 2D de fantasia, com cara de desenhado à mão:
- **Personagens:** silhueta clara, cabeça grande, tronco robusto e pernas curtas.
- **Contorno:** escuro e grosso.
- **Sombra:** 2 a 3 tons por material, com textura pintada discreta.
- **Pose:** expressiva e legível no celular.

**Evitar:** aparência de emoji, bonecos geométricos, deformação exagerada, brilho que esconde o desenho e composição de slide.

## 2. Proporções (vista lateral e três quartos)

| Medida | Chibi (novo) | Ep. 01–03 (antigo) |
|---|---|---|
| Altura total | 3 cabeças | ~6,5 cabeças |
| Cabeça (com cabelo) | ~1/3 da altura | ~1/6,5 |
| Tronco | largo, ~1,1 cabeça de altura, peito e ombros robustos | atlético |
| Pernas | curtas, ~0,9 cabeça, pés grandes e firmes | longas |
| Braços | grossos, mãos grandes (cerca de 0,45 da cabeça) | proporcionais |

A identidade se mantém pelo rosto, cabelo, barba, roupa, cores e acessórios, não pelo corpo.

## 3. Contorno, cor e luz

- **Contorno:** marrom-escuro `#2A1A10`, com espessura uniforme de ~6 px numa figura de 1000 px de altura. A linha interna é mais fina (~3 px).
- **Sombra:** em células, com 2 tons (base e sombra) mais um realce pequeno quando o material brilha (ouro, metal). A luz-chave vem de cima e da frente.
- **Textura:** pintada, leve, só nos materiais grandes (túnica, capa). Nunca sobre o contorno.
- **Contraste personagem × cenário:** personagens saturados e com contorno; cenário com contorno mais fino e menos saturação no fundo distante.

### Paleta do Zeus (continuidade com o Ep. 01)

| Material | Base | Sombra | Realce |
|---|---|---|---|
| Pele | `#F2B98A` | `#D18E62` | — |
| Cabelo e barba | `#F4F1EA` | `#C9C4BA` | `#FFFFFF` |
| Túnica | `#F7F4EC` | `#D8D2C3` | — |
| Ouro (louros, cinto, braceletes, faixa grega) | `#E8B230` | `#B47F14` | `#FFE48A` |
| Sandálias | `#8A5A33` | `#5E3B1F` | — |
| Raio (efeito) | `#9ED8FF` | — | núcleo `#FFFFFF` |

## 4. Rostos e expressões

Olhos grandes e legíveis, sobrancelhas grossas (são elas que carregam a emoção) e boca simples.

**Expressões do piloto:**
- **neutra-confiante:** sorriso de canto;
- **surpresa:** olhos arregalados, pupilas pequenas, boca em "O";
- **determinada / grito:** sobrancelhas baixas, boca aberta mostrando os dentes.

## 5. Tipografia e interface

- Mantém a identidade do canal: Anton para legendas e HUD, Fredoka para o selo "Histórias e Crenças".
- Só um HUD narrativo próprio, e só quando acrescenta informação.

## 6. Composição vertical (1080×1920)

| Faixa | Altura | Uso |
|---|---|---|
| Topo | 0–450 px | selo do canal e HUD, quando houver; nenhum rosto aqui |
| Meio | 450–1300 px | onde rostos e ações acontecem |
| Legendas | ~1300–1420 px | |
| Inferior | 1500–1920 px | só cenário: área da interface do TikTok/Shorts |

- **Personagem em plano médio:** cabeça entre 600 e 900 px.
- **Plano geral:** figura inteira com cerca de 900 a 1100 px de altura.

## 7. Efeitos

- **Raios:** saem do socket da mão, com 3 passadas de brilho e um núcleo branco. A luz local tinge o personagem e o chão por perto.
- **Partículas:** com seed e moderadas. Nada de flashes rápidos repetidos.
- **Tremor:** só quando há impacto, curto.

## 8. Respeito

- A história é ficção inspirada em tradições diferentes. Nenhuma é colocada acima de outra.
- Os Orixás e os guardiões indígenas brasileiros são desenhados como heróis dignos, sem caricatura e sem estereótipo. O estilo chibi exagera proporções, não traços étnicos.
- Nada de imagens de povos da América do Norte nos guardiões brasileiros.
