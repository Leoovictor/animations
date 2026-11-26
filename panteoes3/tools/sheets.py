"""Prompts for the new images of Ep. 03 (Codex CLI image_gen). Zeus, Xangô, Tupã, the jaguar and the rest are re-used from Ep. 01–02.
Thor keeps the design he had as a silhouette in Ep. 02 (src/gods.png is his reference)."""
STYLE = ("Bold 2D vector cartoon style for an animated adventure series with a video-game look: clean flat colours with "
 "simple two-tone cel shading, thick dark brown-black outlines of even weight, crisp shapes, heroic stylized proportions, "
 "strong silhouettes, big expressive readable faces, vibrant saturated palette. Match the attached reference sheet's style exactly. ")
KEY = ("Every figure is complete, fully inside the image and separated from the others by wide gaps, on a pure flat "
 "chroma-green background (#00B140). No ground, no floor line, no shadows on the green, no text, no letters, no labels, "
 "no logos, no watermark, nothing overlapping, and no green colour anywhere on the characters or their props.")
THOR = ("the Norse thunder god warrior from the reference image (left figure), with exactly the same design: long red beard in braids, braided red hair, "
 "heavy grey fur cloak, iron armour with gold knotwork, leather boots and his short heavy iron war hammer with knotwork on its head. ")
SHEETS = [
 dict(name="thor", aspect="16:9", ref="gods", prompt=STYLE + "Character sheet with five drawings of " + THOR +
  "1) full body, one arm stretched out with the open hand catching the flying hammer, facing left; "
  "2) full body raising the hammer high above his head with both hands, fierce shout, facing left; "
  "3) large head-and-shoulders portrait, stern and annoyed, looking to the left; "
  "4) large head-and-shoulders portrait, eyes wide in sudden recognition, looking down to the left; "
  "5) the hammer alone, flying, seen from the side. " + KEY),
 dict(name="heimdall", aspect="16:9", ref="ref_zeus", prompt=STYLE + "Character sheet with two drawings of a new character, our own original design: "
  "Heimdall, the watchful guardian of the rainbow bridge in Norse stories: a tall calm warrior with fair skin, glowing golden eyes, long pale-blond hair in braids, "
  "polished golden armour with a white cloak, a long sword planted point-down in front of him, and a large curved golden horn hanging at his side. "
  "1) full body standing on guard, both hands resting on the sword hilt, facing the viewer; "
  "2) large head-and-shoulders portrait looking straight at the viewer with glowing golden eyes, serious. " + KEY),
 dict(name="bg_bifrost", aspect="9:16", ref="ref_zeus", prompt=STYLE + "A vertical background painting for the series, no characters: "
  "a shining rainbow bridge rising from snowy cliffs into a starry night sky with green and violet aurora, crossing to a distant golden hall on a floating mountain, "
  "the bridge glowing in bands of red, orange, yellow, blue and violet, mist below. The near end of the bridge fills the lower part of the image. No people, no text."),
 dict(name="bg_tree", aspect="9:16", ref="ref_zeus", prompt=STYLE + "A vertical background painting for the series, no characters: "
  "a gigantic ancient ash tree whose huge roots spread down into a starry cosmic void, small floating islands with different worlds caught in its roots and branches, "
  "glowing pale-gold veins along the bark, mist and stars around. No people, no text."),
]
