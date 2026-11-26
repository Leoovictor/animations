"""Prompts for every generated image (Codex CLI image_gen via $LIB/core/image/gen_image.py).
Characters on chroma green (#00B140) are keyed by tools/extract.py; backgrounds are full frames.
All characters are our own original designs; the Orixás are drawn with respect, as dignified heroes."""
STYLE = ("Bold 2D vector cartoon style for an animated adventure series with a video-game look: clean flat colours with "
 "simple two-tone cel shading, thick dark brown-black outlines of even weight, crisp shapes, heroic stylized proportions, "
 "strong silhouettes, big expressive readable faces, vibrant saturated palette. ")
KEY = ("Every figure is complete, fully inside the image and separated from the others by wide gaps, on a pure flat "
 "chroma-green background (#00B140). No ground, no floor line, no shadows on the green, no text, no letters, no labels, "
 "no logos, no watermark, nothing overlapping, and no green colour anywhere on the characters or their props.")
RESPECT = ("Drawn with respect as a dignified heroic figure, natural attractive African facial features, never a caricature. ")
ZEUS = ("Zeus, king of the Greek gods, our own original design: a robust broad-chested older man with big flowing white hair "
 "and a full white beard, thick white eyebrows, a white tunic with gold trim, a gold belt, gold arm cuffs, a small gold "
 "laurel crown, brown leather sandals. ")
XANGO = ("Xangô, the Yoruba Orixá of justice, thunder and lightning, our own original design: a majestic Black African warrior "
 "king with a strong build, dark brown skin, a short neat beard, a red and white beaded crown that leaves his face uncovered, "
 "a red tunic with white geometric patterns and a white sash, red and white bead necklaces, gold bracelets, and the oxé: a "
 "double-bladed axe with two symmetric crescent blades on a short carved handle, in polished bronze. ")
SHEETS = [
 dict(name="zeus", aspect="16:9", ref=None, prompt=STYLE + "Character sheet with five full-body poses of the same character, in a row. " + ZEUS +
  "1) standing proud with arms crossed, chin up, arrogant smirk, three-quarter view facing right; "
  "2) pointing forward with one arm, arrogant scowl, facing right; "
  "3) one arm raised high over his head with the hand open as if about to hurl a lightning bolt, fierce shout, facing right (no bolt drawn); "
  "4) striding forward confidently in side view, facing right; "
  "5) sitting relaxed and smug on a big white marble throne with gold details (draw the throne), facing the viewer. " + KEY),
 dict(name="zeusb", aspect="16:9", ref="zeus", prompt=STYLE + "Three large head-and-shoulders portraits side by side of the same character from the reference sheet, matching his design exactly. " + ZEUS +
  "1) arrogant and smug, one eyebrow raised, half smile, looking to the right; "
  "2) totally shocked, eyes wide open, tiny pupils, mouth wide open, eyebrows high, looking to the right; "
  "3) confused, one eyebrow down, mouth twisted sideways, looking around. " + KEY),
 dict(name="xango", aspect="16:9", ref="zeus", prompt=STYLE + RESPECT + "Character sheet in the same style as the reference, with three full-body poses of a new character. " + XANGO +
  "1) standing firm and calm, holding the oxé at his side, confident, three-quarter view facing left; "
  "2) raising the oxé high above his head with both hands, determined, facing left; "
  "3) walking forward calmly with the oxé resting on his shoulder, facing left. " + KEY),
 dict(name="xangob", aspect="16:9", ref="xango", prompt=STYLE + RESPECT + "Two large head-and-shoulders portraits side by side of the same character from the reference sheet, matching his design exactly. " + XANGO +
  "1) firm, confident, unshaken gaze looking to the left, slight knowing smile, the oxé blade visible by his shoulder; "
  "2) looking straight at the viewer, calm and serious. " + KEY),
 dict(name="ogum", aspect="16:9", ref="zeus", prompt=STYLE + RESPECT + "Character sheet in the same style as the reference, three drawings of a new character: "
  "Ogum, the Yoruba Orixá of iron, our own original design: a determined athletic Black African warrior with dark skin and short hair, stylized armour of dark iron plates (chest plate, shoulder guards, bracers) over dark navy-blue cloth, dark-blue bead necklaces, a straw-gold fringe at the waist, and a long straight iron sword. "
  "1) full body, protective stance, sword held up in front of him, facing left; "
  "2) full body, striding in from the side, sword in hand, facing left; "
  "3) large head-and-shoulders portrait, determined, looking up and to the left. " + KEY),
 dict(name="iansa", aspect="16:9", ref="zeus", prompt=STYLE + RESPECT + "Character sheet in the same style as the reference, three drawings of a new character: "
  "Iansã (Oyá), the Yoruba Orixá of winds and storms, our own original design: a powerful, elegant Black African warrior woman with dark skin and fierce confident eyes, a copper and coral crown, long flowing garments in coral red, burnt orange and copper that billow in the wind, coral bead necklaces, long braids, a short curved sword in one hand and a horsetail whisk in the other. "
  "1) full body in a dynamic spinning pose, arms spread, fabrics and braids whipping in the wind, facing left; "
  "2) full body striding forward elegantly with the sword, facing left; "
  "3) large head-and-shoulders portrait, intense gaze looking to the left, braids blown by the wind. " + KEY),
 dict(name="oxala", aspect="16:9", ref="zeus", prompt=STYLE + RESPECT + "Character sheet in the same style as the reference, two drawings of a new character: "
  "Oxalá, the Yoruba Orixá of creation and peace, our own original design: a serene, wise elderly Black African man with dark skin, kind calm eyes and a short white beard, dressed entirely in flowing white robes and a white cloth crown, white bead necklaces, holding the opaxorô: a tall silver staff topped with stacked silver discs, small bells and a little silver bird. "
  "1) full body standing serenely, staff in one hand, the other palm raised in a calming gesture, facing the viewer; "
  "2) large head-and-shoulders portrait, looking at the viewer with a gentle serene smile. " + KEY),
 dict(name="beast", aspect="16:9", ref="zeus", prompt=STYLE + "Same style as the reference. Pieces of a huge unknown monster for the same cartoon, never the whole creature: "
  "1) a gigantic clawed hand with long bony fingers spread wide, reaching toward the viewer, cut off at the wrist, dark violet-black skin with glowing magenta cracks and long pale claws; "
  "2) the same hand seen from the side, fingers curled as if gripping an edge, cut off at the wrist. " + KEY),
 dict(name="bg_olympus", aspect="9:16", ref="zeus", prompt=STYLE + "Same style as the reference. A vertical background painting for the series, no characters: "
  "Mount Olympus above the clouds, a wide terrace of white marble with tall white columns and gold details, an empty open space in the centre of the terrace, a sea of fluffy clouds below, distant mountain peaks, bright blue sky with soft golden heavenly light from above. Leave the centre of the image open. No people, no text."),
 dict(name="bg_africa", aspect="9:16", ref="zeus", prompt=STYLE + "Same style as the reference. A vertical background painting for the series, no characters: "
  "a fantastic landscape inspired by West Africa: rocky mesas and green mountains in the distance, a wide winding river, baobab and palm trees, tall golden grass, a big flat-topped boulder in the middle ground on the right, a large open stretch of reddish earth in the lower half of the image, warm golden afternoon sky with big clouds. No people, no animals, no text."),
]
