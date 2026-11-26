"""Prompts for Zeus in the Mythology Chibi style (docs/MYTHOLOGY_CHIBI_STYLE.md). Generated with the Codex CLI image tool through
$LIB/core/image/gen_image.py by tools/gen_sheets.py. Identity reference: panteoes/src/zeus.png (Ep. 01).
Pieces carry two marker colours the extractor reads and then erases: MAGENTA = this piece's own rotation pivot, CYAN = where a child piece attaches."""
STYLE = ("Hand-drawn 2D fantasy cartoon, CHIBI proportions: the whole body is only 3 heads tall, so the head (with hair and beard) is one third of the total height, "
 "as big as the torso, and the legs are short and stubby, shorter than the head; robust round chest and shoulders, short thick arms, "
 "big hands and feet. Thick even dark-brown outlines (#2A1A10), cel shading with 2-3 tones per material and subtle painted texture, clear silhouette, "
 "expressive readable face with big eyes and thick eyebrows. Not an emoji, not geometric, not glossy. ")
ZEUS = ("Zeus, king of the Greek gods, our own original design matching the attached reference character exactly in identity: big flowing white hair, "
 "full white beard, thick white eyebrows, small gold laurel crown, white tunic over one shoulder with a gold Greek-key border, gold belt with a lightning emblem, "
 "gold arm cuffs, brown leather sandals, warm peach skin. ")
KEY = ("Pure flat chroma-green background (#00B140), every figure or piece separated by wide gaps, nothing overlapping, no shadows on the green, "
 "no text, no letters, no labels, no logos, no watermark, and no green on the character.")
MARK = ("On every piece draw small solid round markers, about the size of a fingertip, in exact flat colours: one pure MAGENTA (#FF00FF) dot exactly at the "
 "joint where that piece rotates, and pure CYAN (#00FFFF) dots exactly where the next pieces attach. Each piece ends at its joints in a rounded cap that "
 "overlaps the neighbouring piece, so no gap shows when the joint bends. ")
SHEETS = [
 dict(name="zeus_model", aspect="16:9", ref="zeus_model_v1_too_tall.png", prompt=STYLE + ZEUS + "Same character as the reference but redrawn much more compact and cute, with a huge head and a short body. " +
  "Character model sheet, same character five times in a row: 1) full body side view facing right, standing relaxed; 2) full body three-quarter view facing right; "
  "3) full body front view; 4) head close-up, confident half smile; 5) head close-up, surprised: eyes wide, tiny pupils, mouth an open O. " + KEY),
 dict(name="zeus_parts_a", aspect="16:9", ref="zeus_model.png", prompt=STYLE + ZEUS + "Cut-out puppet part sheet for animation, side view facing right, "
  "matching the attached model sheet's side view exactly in style, colours and proportions. Separate pieces: "
  "1) head with hair, beard and laurel crown, confident half smile (MAGENTA at the bottom of the neck); "
  "2) the same head surprised, eyes wide and mouth an open O (MAGENTA at the bottom of the neck); "
  "3) the same head shouting with determination, eyebrows down, mouth open showing teeth (MAGENTA at the bottom of the neck); "
  "4) torso with the tunic and gold belt, no arms, no head, no legs (MAGENTA at the waist; CYAN at the base of the neck and at the near shoulder and at the far shoulder); "
  "5) hips with the short tunic skirt (MAGENTA at the waist; CYAN at the near hip and the far hip). " + MARK + KEY),
 dict(name="zeus_parts_b", aspect="16:9", ref="zeus_model.png", prompt=STYLE + ZEUS + "Cut-out puppet part sheet for animation, side view facing right, "
  "matching the attached model sheet's side view exactly in style, colours and proportions. Separate limb pieces, each drawn hanging straight down: "
  "1) near upper arm with a gold cuff (MAGENTA at the shoulder; CYAN at the elbow); 2) near forearm with an open hand, fingers spread (MAGENTA at the elbow; CYAN at the palm centre); "
  "3) near forearm with a closed fist (MAGENTA at the elbow; CYAN at the fist centre); 4) far upper arm, slightly darker (MAGENTA at the shoulder; CYAN at the elbow); "
  "5) far forearm with open hand, slightly darker (MAGENTA at the elbow; CYAN at the palm centre); 6) near thigh (MAGENTA at the hip; CYAN at the knee); "
  "7) near shin with sandal and foot pointing right (MAGENTA at the knee; CYAN at the sole under the ankle); 8) far thigh, slightly darker (MAGENTA at the hip; CYAN at the knee); "
  "9) far shin with sandal, slightly darker (MAGENTA at the knee; CYAN at the sole under the ankle). " + MARK + KEY),
]
