// Asset loading with a cache. Images are decoded once before READY; nothing loads during render(t).
const CACHE = new Map();
export function loadImage(url) {
  if (!CACHE.has(url)) CACHE.set(url, new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('image failed: ' + url)); im.src = url; }));
  return CACHE.get(url);
}
// o.canvas: copy each image into a canvas once. Chrome caches scaled decodes of <img> elements, and what it reuses depends on what was drawn
// before, so the same frame could come out slightly different after other frames; canvas sources are drawn the same way every time.
export async function loadImages(map, o = {}) { const out = {}; await Promise.all(Object.entries(map).map(async ([k, u]) => { const im = await loadImage(u); out[k] = o.canvas ? toCanvas(im) : im; })); return out; }
export function toCanvas(im) { const c = canvas(im.naturalWidth || im.width, im.naturalHeight || im.height); c.getContext('2d').drawImage(im, 0, 0); return c; }
export async function loadJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(`json ${r.status}: ${url}`); return r.json(); }
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
