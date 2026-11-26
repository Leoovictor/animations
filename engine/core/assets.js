// Asset loading with a cache. Images are decoded once before READY; nothing loads during render(t).
const CACHE = new Map();
export function loadImage(url) {
  if (!CACHE.has(url)) CACHE.set(url, new Promise((res, rej) => { const im = new Image(); im.onload = () => res(im); im.onerror = () => rej(new Error('image failed: ' + url)); im.src = url; }));
  return CACHE.get(url);
}
export async function loadImages(map) { const out = {}; await Promise.all(Object.entries(map).map(async ([k, u]) => { out[k] = await loadImage(u); })); return out; }
export async function loadJSON(url) { const r = await fetch(url); if (!r.ok) throw new Error(`json ${r.status}: ${url}`); return r.json(); }
export function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
