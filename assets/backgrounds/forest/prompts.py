"""Forest layers for the Zeus pilot (Mythology Chibi style, docs/MYTHOLOGY_CHIBI_STYLE.md). Generated with tools/gen_sheets.py.
Wide 16:9 layers so the camera can pan; far and ground are full paintings, mid and front are cut out of chroma green.
Style reference: the Zeus profile figure (same outline and shading)."""
STYLE = ("Hand-drawn 2D fantasy cartoon background art matching the attached reference's style: thick dark-brown outlines (thinner than the character's), "
 "cel shading with 2-3 tones, subtle painted texture, saturated but softer than the character so he stands out. A magical ancient Greek forest. ")
KEY = (" Pure flat chroma-green background (#00B140) everywhere that is not part of the drawing, no shadows on the green, no green anywhere in the drawing "
 "(use blue-teal and olive-brown foliage instead of pure green), no text, no people, no animals.")
SHEETS = [
 dict(name="far", aspect="16:9", ref="../../characters/zeus/sheets/zeus_side.png", prompt=STYLE +
  "Wide panoramic far background, no characters: soft blue sky with big cartoon clouds, distant blue-violet mountains with a small white Greek temple on one peak, "
  "rows of misty blue-teal tree tops fading into the distance in the lower half. Low contrast and slightly hazy, it is the farthest layer. No text, no people."),
 dict(name="mid", aspect="16:9", ref="../../characters/zeus/sheets/zeus_side.png", prompt=STYLE +
  "Wide strip of the middle layer: a row of big ancient olive and oak trees with thick twisted trunks and round teal-olive canopies, a few broken white marble columns "
  "between them, all standing on one common base line at the bottom of the image, the bottom edge flat. Leave clear gaps of background between some trees." + KEY),
 dict(name="ground", aspect="16:9", ref="../../characters/zeus/sheets/zeus_side.png", prompt=STYLE +
  "Wide flat forest floor seen from the side for a side-scrolling scene: a warm earthen path across the whole width in the middle, small rocks, tufts of olive-gold grass "
  "and tiny flowers along it, darker soil and roots below the path. The top part of the image is plain light sky colour (it will be covered), "
  "the path's top edge is a nearly straight horizontal line across the whole width. No text, no people."),
 dict(name="front", aspect="16:9", ref="../../characters/zeus/sheets/zeus_side.png", prompt=STYLE +
  "Foreground framing elements for the very front layer, separated with gaps: 1) a large clump of ferns and big leaves rising from the bottom-left corner; "
  "2) a large clump of bushes and leaves rising from the bottom-right corner; 3) a hanging branch of olive leaves coming down from the top. Dark, a little out of focus look." + KEY),
]
