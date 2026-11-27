// Local light: a character lit by a nearby source (the bolt), only on its own pixels, plus a pool of light on the ground.
// The character is drawn into its own layer (one per call site), then a coloured gradient is laid over that layer with source-atop
// and added onto the frame. Nothing carries over between frames.
const LAYERS = new Map();
function layer(g, key) { const c = g.canvas; let L = LAYERS.get(key); if (!L || L.width !== c.width || L.height !== c.height) { L = document.createElement('canvas'); L.width = c.width; L.height = c.height; LAYERS.set(key, L); } return L; }
// draw(ctx) draws the character into the layer (the layer has the same transform rules as the frame: identity, screen pixels)
// light = { x, y (screen px), radius, col 'r,g,b', k 0..1 }
export function drawLit(g, draw, light, key = 'char') {
  const L = layer(g, key), x = L.getContext('2d'); x.setTransform(1, 0, 0, 1, 0, 0); x.globalCompositeOperation = 'source-over'; x.globalAlpha = 1; x.clearRect(0, 0, L.width, L.height);
  x.imageSmoothingEnabled = true; x.imageSmoothingQuality = 'high'; draw(x); g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.drawImage(L, 0, 0);
  if (light && light.k > 0) {   // the light alone (a gradient), cut to the character's pixels, then screened on: lit where the light reaches, untouched elsewhere
    const M = layer(g, key + ':light'), y = M.getContext('2d'); y.setTransform(1, 0, 0, 1, 0, 0); y.globalCompositeOperation = 'source-over'; y.clearRect(0, 0, M.width, M.height);
    const gr = y.createRadialGradient(light.x, light.y, 0, light.x, light.y, light.radius); gr.addColorStop(0, `rgba(${light.col},${.75 * light.k})`); gr.addColorStop(.5, `rgba(${light.col},${.3 * light.k})`); gr.addColorStop(1, `rgba(${light.col},0)`);
    y.fillStyle = gr; y.fillRect(0, 0, M.width, M.height); y.globalCompositeOperation = 'destination-in'; y.drawImage(L, 0, 0);
    g.globalCompositeOperation = 'screen'; g.drawImage(M, 0, 0);
  }
  g.restore();
}
export function groundLight(g, x, y, rx, col, k) { if (k <= 0) return; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'lighter'; g.translate(x, y); g.scale(1, .22);
  const gr = g.createRadialGradient(0, 0, 0, 0, 0, rx); gr.addColorStop(0, `rgba(${col},${.6 * k})`); gr.addColorStop(1, `rgba(${col},0)`); g.fillStyle = gr; g.fillRect(-rx, -rx, 2 * rx, 2 * rx); g.restore(); }
// whole-frame tint (ambient change: the light dims when the clouds gather)
export function grade(g, col, a, mode = 'multiply') { if (a <= 0) return; g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = mode; g.globalAlpha = a; g.fillStyle = col; g.fillRect(0, 0, g.canvas.width, g.canvas.height); g.restore(); }
