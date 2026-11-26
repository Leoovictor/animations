"""Prompts for every new image of Ep. 02 (Codex CLI image_gen via $LIB/core/image/gen_image.py). Zeus, Xangô, Ogum, Iansã and
the creature's hands are re-used unchanged from Ep. 01 (parts/). Every sheet uses Ep. 01's Zeus sheet (src/ref_zeus.png) as the
style reference. The Brazilian guardians are drawn as Indigenous Brazilian people (Amazon / Atlantic-forest peoples), never with
North-American Plains imagery, and as our own original, respectful designs."""
STYLE = ("Bold 2D vector cartoon style for an animated adventure series with a video-game look: clean flat colours with "
 "simple two-tone cel shading, thick dark brown-black outlines of even weight, crisp shapes, heroic stylized proportions, "
 "strong silhouettes, big expressive readable faces, vibrant saturated palette. Match the attached reference sheet's style exactly. ")
KEY = ("Every figure is complete, fully inside the image and separated from the others by wide gaps, on a pure flat "
 "chroma-green background (#00B140). No ground, no floor line, no shadows on the green, no text, no letters, no labels, "
 "no logos, no watermark, nothing overlapping, and no green colour anywhere on the characters or their props.")
IND = ("Drawn with respect as a dignified heroic figure inspired by Indigenous peoples of Brazil, natural attractive Indigenous Brazilian "
 "facial features, never a caricature; no North-American Plains imagery (no war bonnet, no tipi, no totem). ")
TUPA = ("Tupã, inspired by the thunder in Tupi-Guarani stories, our own original design: a tall, powerful Indigenous Brazilian man with long "
 "straight black hair and a straight fringe, a round crown of short red, yellow and blue macaw feathers set close to the head, geometric black "
 "body paint and red urucum stripes across the cheeks and arms, seed and bead necklaces, woven armbands, a woven cotton waistband with a short "
 "fibre skirt, barefoot, holding a long carved wooden staff. ")
SHEETS = [
 dict(name="tupa", aspect="16:9", ref="ref_zeus", prompt=STYLE + IND + "Character sheet with four drawings of the same new character. " + TUPA +
  "1) full body standing firm and protective, staff planted beside him, facing left; "
  "2) full body kneeling on one knee, one palm pressed flat on the ground, facing left; "
  "3) full body with one arm raised high to the sky, determined, facing left (no lightning drawn); "
  "4) large head-and-shoulders portrait, serious wise gaze looking to the left. " + KEY),
 dict(name="onca", aspect="16:9", ref="tupa", prompt=STYLE + "Three drawings of a giant spirit jaguar (onça-pintada) for the same series: golden-orange fur with black "
  "rosettes, glowing pale-gold eyes, a faint glowing outline as if made of light, powerful and noble. "
  "1) standing proud in side view, facing left; 2) crouched low in a defensive snarl, facing left; "
  "3) the same jaguar walking in side view facing left with the character from the reference sheet (Tupã) riding on its back, sitting upright holding his staff. " + KEY),
 dict(name="jaci", aspect="16:9", ref="ref_zeus", prompt=STYLE + IND + "Character sheet with two drawings of a new character: "
  "Jaci, the Moon in Tupi-Guarani stories, our own original design: a serene, mysterious Indigenous Brazilian woman with very long straight black hair "
  "flowing, fine silver body paint of dots and lines on her face and arms, a crescent-shaped crown of white and silver feathers, a white woven garment "
  "with silver details, white and silver seed necklaces. 1) full body standing as if floating, calm, one hand raised with the palm open, facing the viewer; "
  "2) large head-and-shoulders portrait looking at the viewer, mysterious faint smile. " + KEY),
 dict(name="guaraci", aspect="16:9", ref="tupa", prompt=STYLE + IND + "Character sheet with two drawings of a new character: "
  "Guaraci, the Sun in Tupi-Guarani stories, our own original design: a majestic Indigenous Brazilian man with long black hair, a large round crown of "
  "golden-yellow and orange feathers spreading like sun rays, orange urucum and gold body paint patterns made of dots and simple lines, golden seed necklaces, a plain woven cotton waistband with a short "
  "fibre skirt like the reference Tupã wears; no hanging loincloth panel, no Aztec, Maya or Inca motifs or stepped fret patterns. 1) full body standing with both arms spread wide, radiant, facing the viewer; 2) large head-and-shoulders portrait, majestic, looking at the viewer. " + KEY),
 dict(name="anhanga", aspect="16:9", ref="ref_zeus", prompt=STYLE + "Three drawings of a mysterious forest spirit for the same series, Anhangá, shown as a "
  "noble white deer: pure white fur with faint silvery markings, small branching antlers, large glowing pale-cyan eyes, calm and enigmatic, not evil. "
  "1) full body standing alert in side view, facing left; 2) head and neck close-up looking straight at the viewer; "
  "3) full body walking slowly in side view facing left, head slightly lowered. " + KEY),
 dict(name="gods", aspect="16:9", ref="ref_zeus", prompt=STYLE + "Two new full-body characters for the same series, our own original designs: "
  "1) a huge Norse thunder god warrior: long red beard in braids, braided red hair, a heavy grey fur cloak, iron armour with knotwork, leather boots, "
  "holding up a short heavy iron war hammer, facing right, stern; no winged helmet, no red cape; "
  "2) an ancient Egyptian god with the head of a black jackal, tall pointed ears, glowing gold eyes, a broad gold and blue collar, a white pleated kilt, "
  "gold arm bands, holding a long was-sceptre, looking down at a small dark stone in his open hand, facing left. " + KEY),
 dict(name="arara", aspect="16:9", ref="ref_zeus", prompt=STYLE + "Three drawings of a scarlet macaw for the same series: bright red body, yellow and blue wing feathers, "
  "long red and blue tail, pale face. 1) flying with wings raised, side view facing right; 2) flying with wings down, side view facing right; "
  "3) flying with wings spread, seen from below. " + KEY),
 dict(name="bg_amazon", aspect="9:16", ref="ref_zeus", prompt=STYLE + "A vertical background painting for the series, no characters: a fantastic Amazon "
  "rainforest: gigantic kapok trees with huge buttress roots, hanging lianas, layers of lush foliage, a wide calm river across the lower half of the image "
  "reflecting the sky, a sandy river bank in the foreground, a tall misty mountain peak in the distance, soft morning light and mist. No animals, no people, no text."),
 dict(name="bg_nordic", aspect="9:16", ref="ref_zeus", prompt=STYLE + "A vertical background painting for the series, no characters: a frozen Nordic land: "
  "snowy mountains and a frozen fjord, pine forest covered in snow, a dark stormy sky with a green-and-violet aurora, falling snow. No people, no text."),
 dict(name="bg_egypt", aspect="9:16", ref="ref_zeus", prompt=STYLE + "A vertical background painting for the series, no characters: three great pyramids "
  "under a golden sunset sky, desert dunes, an obelisk and palm trees by the Nile in the middle ground, warm glowing light. No people, no text."),
 dict(name="bg_asia", aspect="9:16", ref="ref_zeus", prompt=STYLE + "A vertical background painting for the series, no characters: misty steep karst "
  "mountains in East Asia, a winding river, pine trees on the cliffs, a small temple with curved roofs on a peak, clouds between the peaks, dawn light. No people, no text."),
]
