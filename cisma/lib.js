// O Grande Cisma — Comic History Cartoon, vertical (1080×1920). Shared kit: maths, paper, type, the printed map, paper puppets, props.
// Built on the Lemo-Opuscar comic-history demo (puppet IK, paper texture, balloons, scissors, stamp, caption box), re-laid for a phone screen.
const W = 1080, H = 1920;
const C = {
  paper: '#F1E8D2', ink: '#2B2219', inkS: '#5A4A3A', card: '#FBF6EA', caption: '#F5E9C4',
  sea: '#A9CDD0', land: '#E6D7B2', west: '#D7604E', westD: '#A8402F', east: '#7E5A9E', eastD: '#57376F',
  red: '#C8463A', stamp: '#B8322A', brass: '#D9B158', gold: '#E1AE3F', table: '#7B6A57',
  night: '#1E1B2A', fire: '#E8783A', fireL: '#F6C35A', stone: '#D8B48C', stoneD: '#B08664', lead: '#8C939C',
};
const clamp = (x, a = 0, b = 1) => Math.max(a, Math.min(b, x)), lerp = (a, b, u) => a + (b - a) * u;
const EASE = {
  lin: u => u, i: u => u * u, o: u => 1 - (1 - u) * (1 - u), io: u => u < .5 ? 2 * u * u : 1 - 2 * (1 - u) * (1 - u),
  back: u => { const c = 1.9; return 1 + (c + 1) * Math.pow(u - 1, 3) + c * Math.pow(u - 1, 2); },
  el: u => u === 0 || u === 1 ? u : Math.pow(2, -10 * u) * Math.sin((u * 10 - .75) * (2 * Math.PI / 3)) + 1,
};
const seg = (t, a, b) => clamp((t - a) / (b - a));
function K(t, keys, ease = 'io') {   // keys [[t, v], ...]: eased between keys, held outside
  if (t <= keys[0][0]) return keys[0][1];
  for (let i = 1; i < keys.length; i++) if (t < keys[i][0]) { const [a, va] = keys[i - 1], [b, vb] = keys[i]; return lerp(va, vb, EASE[keys[i][2] || ease]((t - a) / (b - a))); }
  return keys[keys.length - 1][1];
}
const wob = (t, t0, amp, f = 5, d = 7) => t < t0 ? 0 : amp * Math.exp(-(t - t0) * d) * Math.sin(2 * Math.PI * f * (t - t0));
const hop = (t, t0, t1, h) => t > t0 && t < t1 ? -h * Math.sin(Math.PI * (t - t0) / (t1 - t0)) : 0;
const popIn = (t, t0, d = .2) => t < t0 ? 0 : t - t0 < d ? EASE.back((t - t0) / d) : 1;
const popOut = (t, t1, d = .15) => t < t1 ? 1 : t - t1 < d ? 1 - EASE.i((t - t1) / d) : 0;
function rng(seed) { let s = seed >>> 0; return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; }; }
const D2R = Math.PI / 180, TAU = Math.PI * 2;
const twos = t => Math.floor(t * 12 + 1e-6) / 12;
function canvas(w, h) { const c = document.createElement('canvas'); c.width = Math.ceil(w); c.height = Math.ceil(h); return c; }
const len = (a, b) => Math.hypot(b[0] - a[0], b[1] - a[1]), angOf = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
function shake(t, t0, amp, f = 15, d = 11) { if (t < t0) return [0, 0]; const u = t - t0, e = Math.exp(-u * d); return [-amp * .45 * e * Math.sin(TAU * (f - 4) * u + 1), amp * e * Math.sin(TAU * f * u)]; }

// ---------------------------------------------------------------- paper
function makePaper(w, h, seed) {
  const c = canvas(w, h), g = c.getContext('2d'), r = rng(seed);
  g.fillStyle = '#808080'; g.fillRect(0, 0, w, h);
  for (let i = 0; i < 900 * w * h / (1920 * 1080); i++) {
    const x = r() * w, y = r() * h, rad = 20 + r() * 150, v = r() < .5 ? 0 : 255, gr = g.createRadialGradient(x, y, 0, x, y, rad);
    gr.addColorStop(0, `rgba(${v},${v},${v},${.03 + r() * .03})`); gr.addColorStop(1, `rgba(${v},${v},${v},0)`); g.fillStyle = gr; g.fillRect(x - rad, y - rad, rad * 2, rad * 2);
  }
  for (let i = 0; i < 6000 * w * h / (1920 * 1080); i++) {
    const x = r() * w, y = r() * h, a = r() * TAU, l = 4 + r() * 20, v = r() < .55 ? 40 : 230;
    g.strokeStyle = `rgba(${v},${v},${v},${.04 + r() * .07})`; g.lineWidth = .6 + r() * .9;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + Math.cos(a + 1) * l * .5, y + Math.sin(a + 1) * l * .5, x + Math.cos(a) * l, y + Math.sin(a) * l); g.stroke();
  }
  const d = g.getImageData(0, 0, w, h), p = d.data;
  for (let i = 0; i < p.length; i += 4) { const n = (r() - .5) * 22; p[i] += n; p[i + 1] += n; p[i + 2] += n; }
  g.putImageData(d, 0, 0); return c;
}
let TEX, PAGEPAT, TABLEPAT, DARKPAT;
function paperFill(col, seed, w = 1024, h = 1024, a = .6) { const c = canvas(w, h), g = c.getContext('2d'); g.fillStyle = col; g.fillRect(0, 0, w, h); g.globalCompositeOperation = 'overlay'; g.globalAlpha = a; g.drawImage(makePaper(w, h, seed), 0, 0); return c; }
function texture(g, x, y, w, h, a = .5) { g.save(); g.globalCompositeOperation = 'overlay'; g.globalAlpha = a; g.fillStyle = g.createPattern(TEX, 'repeat'); g.fillRect(x, y, w, h); g.restore(); }
function cardStroke(g, path, fill, w = 7) { g.lineJoin = 'round'; g.lineWidth = w; g.strokeStyle = C.paper; g.stroke(path); g.fillStyle = fill; g.fill(path); }
function shadowOn(g, lift = 0, z = 1) { g.shadowColor = `rgba(30,20,10,${.42 - .12 * lift})`; g.shadowBlur = (4 + 22 * lift) * z; g.shadowOffsetX = (3 + 18 * lift) * z; g.shadowOffsetY = (5 + 28 * lift) * z; }
function shadowOff(g) { g.shadowColor = 'transparent'; g.shadowBlur = 0; g.shadowOffsetX = 0; g.shadowOffsetY = 0; }
const P2 = f => { const p = new Path2D(); f(p); return p; };
function brass(g, x, y, r) {
  const gr = g.createRadialGradient(x - r * .35, y - r * .4, r * .1, x, y, r);
  gr.addColorStop(0, '#FFF1BF'); gr.addColorStop(.35, C.brass); gr.addColorStop(1, '#7A5A1E');
  g.fillStyle = gr; g.beginPath(); g.arc(x, y, r, 0, TAU); g.fill(); g.strokeStyle = 'rgba(60,40,10,.55)'; g.lineWidth = 1; g.stroke();
}

// ---------------------------------------------------------------- type: numbers always in Old Standard (lining), text in IM Fell, shouts in Lilita
const NUM_RE = /\d+(?:[.–]\d+)*/g;
function numFont(base) { const m = base.match(/(\d+(?:\.\d+)?)px\s+(\S+)/); if (!m) return base; const s = +m[1], f = m[2], face = /It/.test(f) ? 'OldStdIt' : /Lilita/.test(f) ? 'OldStdB' : /SC/.test(f) ? 'OldStdB' : 'OldStd'; return `${Math.round(s * .92)}px ${face}`; }
function textRuns(text) { const out = []; let i = 0; for (const m of text.matchAll(NUM_RE)) { if (m.index > i) out.push([text.slice(i, m.index), 0]); out.push([m[0], 1]); i = m.index + m[0].length; } if (i < text.length) out.push([text.slice(i), 0]); return out; }
function measureMixed(g, text, base) { const nf = numFont(base); let w = 0; for (const [t, n] of textRuns(text)) { g.font = n ? nf : base; w += g.measureText(t).width; } g.font = base; return w; }
function fillMixed(g, text, x, y, base, align = 'left') {
  const nf = numFont(base), w = measureMixed(g, text, base), a0 = g.textAlign; let cx = align === 'center' ? x - w / 2 : align === 'right' ? x - w : x;
  g.textAlign = 'left'; for (const [t, n] of textRuns(text)) { g.font = n ? nf : base; g.fillText(t, cx, y); cx += g.measureText(t).width; }
  g.font = base; g.textAlign = a0; return w;
}
function spaced(g, text, x, y, sp) { const ch = [...text], w = ch.map(c => g.measureText(c).width), tot = w.reduce((a, b) => a + b, 0) + sp * (ch.length - 1); let cx = x - tot / 2; const a0 = g.textAlign; g.textAlign = 'left'; ch.forEach((c, i) => { g.fillText(c, cx, y); cx += w[i] + sp; }); g.textAlign = a0; return tot; }
// every text drawn is noted with its box on screen (readcheck); `pass` for text not meant to be read
let TX = [];
function noteText(g, id, text, x0, y0, x1, y1, pass) {
  const m = g.getTransform(), pts = [[x0, y0], [x1, y0], [x0, y1], [x1, y1]].map(([x, y]) => [m.a * x + m.c * y + m.e, m.b * x + m.d * y + m.f]);
  TX.push({ id, text, x0: Math.min(...pts.map(p => p[0])), y0: Math.min(...pts.map(p => p[1])), x1: Math.max(...pts.map(p => p[0])), y1: Math.max(...pts.map(p => p[1])), ...(pass ? { pass: true } : {}) });
}

// ---------------------------------------------------------------- the printed map: one sheet of sea, two paper pieces of land (the Latin West, the Greek East)
const LON0 = 20.5, LAT0 = 40, KS = 40, KX = KS * Math.cos(LAT0 * D2R);
const P = (lon, lat) => [540 + (lon - LON0) * KX, 900 - (lat - LAT0) * KS];
// schematic line between the Latin and the Greek Church about 1054 (see FACTS.md): Baltic → Carpathians → Sava/Drina → Adriatic/Ionian → Cyrenaica
const SPLIT = [[24.5, 61], [24, 55], [23, 50.5], [21.5, 47.5], [19.4, 45.2], [19.3, 42.6], [19.2, 40.2], [19.6, 37.5], [20.6, 34.5], [22.5, 30], [24.6, 23]];
const WPOLY = [...SPLIT, [-20, 23], [-20, 61]], EPOLY = [...SPLIT, [60, 23], [60, 61]];
const CITY = { roma: [12.5, 41.9], cpla: [28.98, 41.01], alex: [29.9, 31.2], anti: [36.2, 36.2], jeru: [35.2, 31.8] };
let LAND, MAPB = { x0: -330, y0: -160, x1: 1410, y1: 1960 }, MR = 1.25;   // map world window and bake scale
function landPath(g) { g.beginPath(); for (const r of LAND) { r.forEach(([lo, la], i) => { const [x, y] = P(lo, la); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); } }
function polyPath(g, pts) { g.beginPath(); pts.forEach(([lo, la], i) => { const [x, y] = P(lo, la); i ? g.lineTo(x, y) : g.moveTo(x, y); }); g.closePath(); }
function bakeSea() {
  const w = (MAPB.x1 - MAPB.x0) * MR, h = (MAPB.y1 - MAPB.y0) * MR, c = canvas(w, h), g = c.getContext('2d');
  g.setTransform(MR, 0, 0, MR, -MAPB.x0 * MR, -MAPB.y0 * MR);
  g.fillStyle = C.sea; g.fillRect(MAPB.x0, MAPB.y0, MAPB.x1 - MAPB.x0, MAPB.y1 - MAPB.y0);
  g.save(); g.strokeStyle = 'rgba(40,80,95,.13)'; g.lineWidth = 1.2;   // engraved sea: horizontal hatching
  for (let y = MAPB.y0; y < MAPB.y1; y += 7) { g.beginPath(); g.moveTo(MAPB.x0, y); g.lineTo(MAPB.x1, y); g.stroke(); }
  g.restore();
  g.save(); g.lineJoin = 'round';   // coast ripples, printed on the sea around every shore
  for (let i = 6; i >= 1; i--) { landPath(g); g.lineWidth = i * 7; g.strokeStyle = i % 2 ? '#96BFC2' : '#A9CDD0'; g.stroke(); }
  g.restore();
  g.save(); g.strokeStyle = 'rgba(40,70,90,.2)'; g.lineWidth = 1; g.setLineDash([2, 5]);   // graticule
  for (let lon = -10; lon <= 50; lon += 10) { const [x0, y0] = P(lon, 62), [x1, y1] = P(lon, 22); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  for (let lat = 25; lat <= 60; lat += 5) { const [x0, y0] = P(-20, lat), [x1, y1] = P(60, lat); g.beginPath(); g.moveTo(x0, y0); g.lineTo(x1, y1); g.stroke(); }
  g.restore();
  g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'overlay'; g.globalAlpha = .55; g.drawImage(makePaper(w, h, 7), 0, 0);
  return c;
}
// a land piece: the land inside one half, printed in col, cut out with a cream card margin (so it can be lifted and moved)
function bakePiece(half, col, seed, label) {
  const w = (MAPB.x1 - MAPB.x0) * MR, h = (MAPB.y1 - MAPB.y0) * MR, toW = g => g.setTransform(MR, 0, 0, MR, -MAPB.x0 * MR, -MAPB.y0 * MR);
  const shape = canvas(w, h), k = shape.getContext('2d');
  toW(k); k.save(); polyPath(k, half); k.clip(); landPath(k); k.fillStyle = col; k.fill('nonzero');
  k.save(); landPath(k); k.clip(); landPath(k); k.lineWidth = 10; k.strokeStyle = 'rgba(255,248,230,.22)'; k.stroke(); k.restore();
  landPath(k); k.lineWidth = 1.6; k.strokeStyle = 'rgba(40,55,70,.65)'; k.stroke(); k.restore();
  if (label) label(k);
  k.setTransform(1, 0, 0, 1, 0, 0);
  const tex = makePaper(Math.ceil(w), Math.ceil(h), seed), t2 = canvas(w, h), q2 = t2.getContext('2d');
  q2.drawImage(shape, 0, 0); q2.globalCompositeOperation = 'source-atop'; q2.globalAlpha = .55; q2.globalCompositeOperation = 'overlay'; q2.drawImage(tex, 0, 0);
  q2.globalCompositeOperation = 'destination-in'; q2.globalAlpha = 1; q2.drawImage(shape, 0, 0);
  const card = canvas(w, h), q = card.getContext('2d'), r = rng(seed + 3);
  for (let i = 0; i < 20; i++) { const a = i / 20 * TAU, rr = 4 * MR * (.9 + r() * .2); q.drawImage(shape, Math.cos(a) * rr, Math.sin(a) * rr); }
  q.globalCompositeOperation = 'source-in'; q.fillStyle = C.paper; q.fillRect(0, 0, w, h); q.globalCompositeOperation = 'source-over';
  q.drawImage(t2, 0, 0);
  return card;
}
// draw a land piece: offset d (world px), rotation rot (deg) about pivot, lift h
function drawPiece(g, cv, o = {}) {
  const [dx, dy] = o.d || [0, 0], pv = o.pv || [540, 900], h = o.h || 0;
  g.save(); if (h < 0) shadowOff(g); else shadowOn(g, h, o.z || 1);
  const hk = 1 + .03 * Math.max(h, 0); g.translate(pv[0] + dx, pv[1] + dy); g.rotate((o.rot || 0) * D2R); g.scale(hk, hk); g.translate(-pv[0], -pv[1]);
  if (o.a !== undefined) g.globalAlpha = o.a;
  g.drawImage(cv, MAPB.x0, MAPB.y0, MAPB.x1 - MAPB.x0, MAPB.y1 - MAPB.y0);
  g.restore();
}
function splitPts() { return SPLIT.map(([lo, la]) => P(lo, la)); }

// ---------------------------------------------------------------- paper puppets (parts cut from the Codex sheets by tools/extract.py; pivots from parts/rig.json)
let RIGJ, IMG = {};
const PUP = {
  ro: { torso: 6, heads: { n: 3, angry: 4, smug: 2, wow: 5 }, uarm: { L: 9, R: 7 }, farm: { L: 11, R: 12 }, leg: { L: 8, R: 10 }, hat: 0, prop: 1, legK: .78, hatAt: .2, hatPv: .93 },
  co: { torso: 6, heads: { n: 3, angry: 1, smug: 2, wow: 4 }, uarm: { L: 7, R: 10 }, farm: { L: 11, R: 12 }, leg: { L: 8, R: 9 }, hat: 0, prop: 5, legK: .78, hatAt: .2, hatPv: .47 },
  cr: { torso: 6, heads: { n: 3, grim: 4, angry: 2, smug: 5 }, uarm: { L: 10, R: 12 }, farm: { L: 11, R: 9 }, leg: { L: 7, R: 8 }, hat: 1, prop: 0, legK: .8, hatAt: .5, hatPv: .5 },
};
const PI = (k, id) => RIGJ[k][id];
function torsoPts(k) {
  const r = PI(k, PUP[k].torso), [x0, y0, x1, y1] = r.bb, w = x1 - x0, h = y1 - y0, cx = (x0 + x1) / 2;
  const sw = k === 'cr' ? .2 : .24, hy = k === 'cr' ? .72 : .8;
  return { neck: [cx, y0 + .06 * h], sh: { L: [x0 + sw * w, y0 + .17 * h], R: [x1 - sw * w, y0 + .17 * h] }, hip: { L: [cx - .14 * w, y0 + hy * h], R: [cx + .14 * w, y0 + hy * h] } };
}
function put(g, k, id, pv, at, rot, s) { const im = IMG[`${k}_${id}`]; g.save(); g.translate(at[0], at[1]); g.rotate(rot); g.scale(s, s); g.drawImage(im, -pv[0], -pv[1]); g.restore(); }
function follow(pv, q, at, rot, s) { const dx = (q[0] - pv[0]) * s, dy = (q[1] - pv[1]) * s, c = Math.cos(rot), sn = Math.sin(rot); return [at[0] + dx * c - dy * sn, at[1] + dx * sn + dy * c]; }
function ik(S, Tg, L1, L2, bend) {
  const d = clamp(len(S, Tg), Math.abs(L1 - L2) + 1, L1 + L2 - .5), a = angOf(S, Tg);
  const th = a + bend * Math.acos(clamp((L1 * L1 + d * d - L2 * L2) / (2 * L1 * d), -1, 1));
  const E = [S[0] + L1 * Math.cos(th), S[1] + L1 * Math.sin(th)], Hh = [S[0] + d * Math.cos(a), S[1] + d * Math.sin(a)];
  return { E, H: Hh, ua: th, fa: angOf(E, Hh) };
}
// pose o: { x, y (neck on screen), s, rot (deg), head, hrot (deg), pop, arm: { L: [ua, fa] deg out from hanging | { to:[x,y], bend } }, leg: { L, R } deg, hat (bool), helm (0..1), hold: { L|R: fn(g, hand, ang) } }
function drawPuppet(g, k, o) {
  const D = PUP[k], T = torsoPts(k), s = o.s || .4, tr = (o.rot || 0) * D2R, at = [o.x, o.y];
  const Tf = q => follow(T.neck, q, at, tr, s);
  for (const side of ['L', 'R']) {
    const id = D.leg[side], r = PI(k, id), a = (o.leg && o.leg[side] || 0) * (side === 'L' ? 1 : -1);
    const want = Math.PI / 2 + a * D2R + tr; put(g, k, id, r.top, Tf(T.hip[side]), want - angOf(r.top, r.bot), s * D.legK);
  }
  const arms = {};
  for (const side of ['L', 'R']) {
    const U = PI(k, D.uarm[side]), F = PI(k, D.farm[side]), S = Tf(T.sh[side]), L1 = len(U.top, U.bot) * s, L2 = len(F.top, F.bot) * s, a = o.arm && o.arm[side];
    let sol;
    if (a && a.to) sol = ik(S, a.to, L1, L2, a.bend ?? (side === 'L' ? -1 : 1));
    else {
      const sg = side === 'L' ? 1 : -1, ua = Math.PI / 2 + sg * (a ? a[0] : 8) * D2R + tr, fa = ua + sg * (a ? a[1] : 6) * D2R;
      const E = [S[0] + L1 * Math.cos(ua), S[1] + L1 * Math.sin(ua)]; sol = { E, H: [E[0] + L2 * Math.cos(fa), E[1] + L2 * Math.sin(fa)], ua, fa };
    }
    arms[side] = { U, F, S, sol, uid: D.uarm[side], fid: D.farm[side] };
  }
  const upper = side => { const a = arms[side]; put(g, k, a.uid, a.U.top, a.S, a.sol.ua - angOf(a.U.top, a.U.bot), s); };
  const fore = side => { const a = arms[side]; put(g, k, a.fid, a.F.top, a.sol.E, a.sol.fa - angOf(a.F.top, a.F.bot), s); };
  const back = o.behind || {};
  for (const side of ['L', 'R']) if (back[side]) { if (o.hold && o.hold[side]) o.hold[side](g, arms[side].sol.H, arms[side].sol.fa); upper(side); fore(side); }
  for (const side of ['L', 'R']) if (!back[side]) upper(side);
  const tor = PI(k, D.torso); put(g, k, D.torso, T.neck, at, tr, s);
  const hid = D.heads[o.head || 'n'], hr = PI(k, hid), hrot = tr + (o.hrot || 0) * D2R, hs = s * (o.pop || 1);
  const [hx0, hy0, hx1, hy1] = hr.bb, hh = hy1 - hy0, chin = [(hx0 + hx1) / 2, hy1 - .07 * hh], hat = PI(k, D.hat), [ax0, ay0, ax1, ay1] = hat.bb;
  const hatPt = follow(chin, [(hx0 + hx1) / 2, hy0 + D.hatAt * hh], at, hrot, hs), hatPv = [(ax0 + ax1) / 2, ay0 + D.hatPv * (ay1 - ay0)];
  if (k === 'co' && o.hat !== false) put(g, k, D.hat, hatPv, hatPt, hrot, hs * .92);   // the veil hangs behind the head
  put(g, k, hid, chin, at, hrot, hs);
  if (k === 'ro' && o.hat !== false) put(g, k, D.hat, hatPv, hatPt, hrot, hs * .7);
  if (k === 'co' && o.hat !== false) { g.save(); const p = follow(chin, [(hx0 + hx1) / 2, hy0 + D.hatAt * hh], at, hrot, hs); g.translate(p[0], p[1]); g.rotate(hrot); g.scale(hs * .92, hs * .92); g.beginPath(); g.rect(ax0 - hatPv[0], ay0 - hatPv[1], ax1 - ax0, (ay1 - ay0) * .5); g.clip(); g.drawImage(IMG[`co_${D.hat}`], -hatPv[0], -hatPv[1]); g.restore(); }
  if (k === 'cr' && (o.helm || 0) > 0) { const hp = follow(chin, [(hx0 + hx1) / 2, hy0 + .48 * hh], at, hrot, hs), dy = (1 - o.helm) * -260 * s; put(g, k, D.hat, hatPv, [hp[0], hp[1] + dy], hrot, hs * .98); }
  for (const side of ['L', 'R']) if (!back[side]) { if (o.hold && o.hold[side]) o.hold[side](g, arms[side].sol.H, arms[side].sol.fa); fore(side); }
  const top = follow(chin, [(hx0 + hx1) / 2, hy0], at, hrot, hs);
  return { hand: { L: arms.L.sol.H, R: arms.R.sol.H }, head: follow(chin, [(hx0 + hx1) / 2, (hy0 + hy1) / 2], at, hrot, hs), top };
}
// the crozier / sword / book held in a hand: the part image hung from its grip point
function holdPart(k, id, grip, rot = 0, abs = true, sk = 1) { return (g, hand, fa) => { const r = PI(k, id), gp = [lerp(r.top[0], r.bot[0], grip), lerp(r.top[1], r.bot[1], grip)]; put(g, k, id, gp, hand, (abs ? 0 : fa - Math.PI / 2) + rot * D2R, CUR_S * sk); }; }
let CUR_S = .4, LAYER;
// a puppet is put together on its own layer, then dropped on the scene with one soft shadow (all its parts lift together)
function pup(g, k, o, lift = 0) {
  CUR_S = o.s || .4;
  const L = LAYER.getContext('2d'); L.setTransform(1, 0, 0, 1, 0, 0); L.clearRect(0, 0, W, H); L.setTransform(g.getTransform());
  L.shadowColor = 'rgba(35,22,8,.35)'; L.shadowBlur = 5; L.shadowOffsetX = 2; L.shadowOffsetY = 3;
  const r = drawPuppet(L, k, o); shadowOff(L);
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0); shadowOn(g, .35 + lift); if (o.alpha !== undefined) g.globalAlpha = o.alpha; g.drawImage(LAYER, 0, 0); g.restore();
  return r;
}

// ---------------------------------------------------------------- props
function scissors(g, x, y, ang, open, k = 1) {
  g.save(); g.translate(x, y); g.rotate(ang); g.scale(k, k);
  for (const sgn of [-1, 1]) {
    g.save(); g.rotate(sgn * open / 2); shadowOn(g, .4);
    cardStroke(g, P2(b => { b.moveTo(-8, -9 * sgn); b.quadraticCurveTo(70, -10 * sgn, 132, 0); b.quadraticCurveTo(70, 4 * sgn, -8, 7 * sgn); b.closePath(); }), '#B8C0C7');
    shadowOff(g); g.strokeStyle = 'rgba(70,80,90,.55)'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(4, 0); g.quadraticCurveTo(70, -3 * sgn, 126, 0); g.stroke();
    shadowOn(g, .4);
    cardStroke(g, P2(a => { a.moveTo(-8, -8 * sgn); a.lineTo(-30, 10 * sgn); a.lineTo(-22, 18 * sgn); a.lineTo(2, 4 * sgn); a.closePath(); }), C.red);
    cardStroke(g, P2(r => { r.ellipse(-46, 22 * sgn, 30, 20, -.35 * sgn, 0, TAU); r.moveTo(-28, 22 * sgn); r.ellipse(-46, 22 * sgn, 17, 10, -.35 * sgn, 0, TAU, true); }), C.red);
    g.restore();
  }
  brass(g, 0, 0, 8); g.restore();
}
function polyAlong(pts, s) {   // point and heading at fraction s of a polyline
  let tot = 0; for (let i = 1; i < pts.length; i++) tot += len(pts[i - 1], pts[i]);
  let d = clamp(s) * tot;
  for (let i = 1; i < pts.length; i++) { const l = len(pts[i - 1], pts[i]); if (d <= l || i === pts.length - 1) { const u = clamp(d / l); return { p: [lerp(pts[i - 1][0], pts[i][0], u), lerp(pts[i - 1][1], pts[i][1], u)], a: angOf(pts[i - 1], pts[i]) }; } d -= l; }
}
function polyUpTo(g, pts, s) { const n = 160; g.beginPath(); for (let i = 0; i <= n * clamp(s); i++) { const q = polyAlong(pts, i / n).p; i ? g.lineTo(...q) : g.moveTo(...q); } }
function stampTool(g, x, y, sq, col = C.stamp) {
  g.save(); g.translate(x, y); g.scale(1 + sq * .08, 1 - sq * .1); shadowOn(g, .5);
  cardStroke(g, P2(p => p.ellipse(0, -230, 52, 40, 0, 0, TAU)), '#9A6B45'); cardStroke(g, P2(p => p.rect(-22, -200, 44, 110)), '#8A5C3A');
  cardStroke(g, P2(p => p.rect(-150, -96, 300, 70)), '#3A2F28'); cardStroke(g, P2(p => p.rect(-142, -26, 284, 22)), col, 4);
  g.restore();
}
// a rough rubber-stamp impression (baked once per word)
const STAMPC = {};
function stampMark(word, col = C.stamp, px = 64) {
  const key = word + col + px; if (STAMPC[key]) return STAMPC[key];
  const t = canvas(10, 10).getContext('2d'); t.font = `${px}px Lilita`; const tw = t.measureText(word).width + 40 + word.length * 4, h = px * 1.6;
  const c = canvas(tw + 20, h + 20), s = c.getContext('2d');
  s.translate(10, 10); s.strokeStyle = col; s.lineWidth = 6; s.strokeRect(4, 4, tw - 8, h - 8); s.lineWidth = 2; s.strokeRect(13, 13, tw - 26, h - 26);
  s.fillStyle = col; s.font = `${px}px Lilita`; s.textBaseline = 'middle'; spaced(s, word, tw / 2, h / 2 + 3, 4);
  s.setTransform(1, 0, 0, 1, 0, 0); s.globalCompositeOperation = 'destination-out';
  const r = rng(word.length * 77); for (let i = 0; i < c.width * c.height / 60; i++) { s.fillStyle = `rgba(0,0,0,${.3 + r() * .7})`; s.fillRect(r() * c.width, r() * c.height, 1 + r() * 3, 1 + r() * 2); }
  return STAMPC[key] = c;
}
function stampAt(g, id, word, x, y, rot, t, t0, col, px = 64) {   // the impression appears at t0 with a little punch
  if (t < t0) return; const c = stampMark(word, col, px), k = 1 + .25 * Math.max(0, 1 - (t - t0) / .1);
  g.save(); g.translate(x, y); g.rotate(rot * D2R); g.scale(k, k); g.globalAlpha = .92; g.drawImage(c, -c.width / 2, -c.height / 2); g.globalAlpha = 1;
  if (t - t0 > .1) noteText(g, id, word, -c.width / 2 + 14, -c.height / 2 + 14, c.width / 2 - 14, c.height / 2 - 14);
  g.restore();
}
function ticks(g, t, t0, c, sc = 1) {   // ink strokes around a hit, three drawings on twos
  const u = (twos(t) - t0) / .25; if (u < 0 || u > 1) return; const r = rng(5);
  g.save(); g.strokeStyle = C.ink; g.lineCap = 'round'; g.lineWidth = 6;
  for (let i = 0; i < 10; i++) { const a = i / 10 * TAU + (r() - .5) * .2, l = 34 * (1 - u * .5), ex = 130 * sc * (1 + u * .35), ey = 130 * sc * (1 + u * .35); g.beginPath(); g.moveTo(c[0] + Math.cos(a) * ex, c[1] + Math.sin(a) * ey); g.lineTo(c[0] + Math.cos(a) * (ex + l), c[1] + Math.sin(a) * (ey + l)); g.stroke(); }
  g.restore();
}
function flecks(g, t, t0, c, cols, n = 14, sc = 1, seed = 19) {
  const tt = t - t0; if (tt < 0 || tt > 1.1) return; const r = rng(seed + Math.round(t0 * 10));
  for (let i = 0; i < n; i++) {
    const a = r() * TAU, v = (260 + r() * 320) * sc, spin = (r() - .5) * 18, sz = (8 + r() * 10) * sc, col = cols[Math.floor(r() * cols.length)];
    const x = c[0] + Math.cos(a) * (60 * sc + v * tt), y = c[1] + Math.sin(a) * (60 * sc + v * tt) + 900 * tt * tt, k = 1 - clamp((tt - .8) / .3);
    g.save(); g.translate(x, y); g.rotate(spin * tt); g.scale(k, k); g.fillStyle = col; shadowOn(g, .1);
    g.beginPath(); g.moveTo(-sz, -sz * .4); g.lineTo(sz * .8, -sz * .6); g.lineTo(sz * .2, sz * .7); g.closePath(); g.fill(); g.restore();
  }
}
// speech balloon: Lilita, ink outline; spiky = a shout
function bubble(g, id, text, x, y, tail, k, spiky, px = 60) {
  if (k <= .001) return;
  g.save(); g.font = `${px}px Lilita`; const lines = text.split('\n'), tw = Math.max(...lines.map(l => measureMixed(g, l, `${px}px Lilita`)));
  const w = tw + 80, h = px * 1.15 * lines.length + 50;
  g.translate(x, y); g.rotate(-1.5 * D2R); g.scale(k, k);
  const b = new Path2D(), tx = (tail[0] - x) / k, ty = (tail[1] - y) / k;
  if (spiky) {
    const n = 20, r = rng(3); for (let i = 0; i <= n; i++) { const a = i / n * TAU, rr = (i % 2 ? 1 : 1.2) + (r() - .5) * .05, px_ = Math.cos(a) * w * .58 * rr, py = Math.sin(a) * h * .66 * rr; i ? b.lineTo(px_, py) : b.moveTo(px_, py); } b.closePath();
    const base = Math.atan2(ty, tx), bx = Math.cos(base) * w * .45, by = Math.sin(base) * h * .5;
    const wd = new Path2D(); wd.moveTo(bx - 18 * Math.sin(base), by + 18 * Math.cos(base)); wd.lineTo(tx, ty); wd.lineTo(bx + 18 * Math.sin(base), by - 18 * Math.cos(base)); wd.closePath(); b.addPath(wd);
  } else {
    const rr = 46, tb = ty > 0, sy = tb ? h / 2 : -h / 2, txc = clamp(tx * .4, -w / 2 + 70, w / 2 - 70);
    b.moveTo(-w / 2 + rr, -h / 2);
    if (!tb) { b.lineTo(txc - 32, -h / 2); b.lineTo(tx, ty); b.lineTo(txc + 32, -h / 2); }
    b.lineTo(w / 2 - rr, -h / 2); b.quadraticCurveTo(w / 2, -h / 2, w / 2, 0); b.quadraticCurveTo(w / 2, h / 2, w / 2 - rr, h / 2);
    if (tb) { b.lineTo(txc + 32, sy); b.lineTo(tx, ty); b.lineTo(txc - 32, sy); }
    b.lineTo(-w / 2 + rr, h / 2); b.quadraticCurveTo(-w / 2, h / 2, -w / 2, 0); b.quadraticCurveTo(-w / 2, -h / 2, -w / 2 + rr, -h / 2); b.closePath();
  }
  shadowOn(g, .3); g.fillStyle = '#FBF6EA'; g.fill(b); shadowOff(g);
  g.lineWidth = 4.5; g.strokeStyle = C.ink; g.lineJoin = 'round'; g.stroke(b);
  g.fillStyle = C.ink; g.textAlign = 'center'; g.textBaseline = 'middle';
  lines.forEach((l, i) => fillMixed(g, l, 0, (i - (lines.length - 1) / 2) * px * 1.12 + 3, `${px}px Lilita`, 'center'));
  if (k > .97) noteText(g, id, text.replace('\n', ' '), -tw / 2, -h / 2 + 20, tw / 2, h / 2 - 20);
  g.restore();
}
// a printed paper slip (a label), pasted on with two bits of tape
function slip(g, id, text, x, y, rot, k, o = {}) {
  if (k <= .001) return; const px = o.px || 40, font = `${o.font || 'FellSC'}`, base = `${px}px ${font}`;
  g.save(); g.translate(x, y); g.rotate(rot * D2R); g.scale(k, k);
  g.font = base; const tw = (o.sp ? [...text].reduce((a, c) => a + g.measureText(c).width + o.sp, -o.sp) : measureMixed(g, text, base)), w = tw + 2 * (o.pad || 30), h = px * 1.55;
  shadowOn(g, o.lift || .1); g.fillStyle = o.bg || C.card; g.fillRect(-w / 2, -h / 2, w, h); shadowOff(g);
  if (o.border !== false) { g.strokeStyle = o.fg || C.ink; g.lineWidth = 2; g.strokeRect(-w / 2 + 7, -h / 2 + 7, w - 14, h - 14); }
  g.fillStyle = o.fg || C.ink; g.textBaseline = 'middle'; g.textAlign = 'center';
  if (o.sp) spaced(g, text, 0, 3, o.sp); else fillMixed(g, text, 0, 3, base, 'center');
  if (o.tape !== false) { g.fillStyle = 'rgba(222,205,165,.92)'; [[-w / 2 + 4, -h / 2 + 2, -14], [w / 2 - 4, -h / 2 + 2, 12]].forEach(([tx, ty, ta]) => { g.save(); g.translate(tx, ty); g.rotate(ta * D2R); g.fillRect(-22, -11, 44, 22); g.restore(); }); }
  if (k > .97 && !o.noread) noteText(g, id, text, -tw / 2, -h / 2 + 6, tw / 2, h / 2 - 6, o.pass);
  g.restore();
  return w;
}
// a map pin: brass head, little paper flag with the place name
function pin(g, id, name, x, y, k, side = 1, px = 30) {
  if (k <= .001) return;
  g.save(); g.translate(x, y); g.scale(k, k);
  g.font = `${px}px FellSC`; const tw = [...name].reduce((a, c) => a + g.measureText(c).width + 2, -2), w = tw + 30, h = px * 1.45;
  const fx = side > 0 ? 6 : -6 - w, fy = -62 - h;
  shadowOn(g, .15); g.strokeStyle = '#555'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, -64); g.stroke();
  g.fillStyle = C.card; g.fillRect(fx, fy, w, h); shadowOff(g); g.strokeStyle = C.ink; g.lineWidth = 1.5; g.strokeRect(fx + 4, fy + 4, w - 8, h - 8);
  g.fillStyle = C.ink; g.textBaseline = 'middle'; spaced(g, name, fx + w / 2, fy + h / 2 + 2, 2);
  brass(g, 0, -66, 10);
  if (k > .97) noteText(g, id, name, fx + 15, fy + 5, fx + 15 + tw, fy + h - 5);
  g.restore();
}
// year tag: a printed slip, big year in Old Standard Bold and one line under it
function yearTag(g, id, t, t0, x, y, year, line, out = 1e9) {
  const u = clamp((t - t0) / .24), v = clamp((out - t) / .2); if (u <= 0 || v <= 0) return;
  g.save(); g.font = '96px OldStdB'; const yw = [...year].reduce((a, c) => a + g.measureText(c).width + 3, -3);
  g.font = 'italic 40px FellIt'; const lw = line ? g.measureText(line).width : 0, w = Math.max(300, lw + 64, yw + 70), h = line ? 190 : 140;
  g.translate(x, lerp(y - 300, y, EASE.back(u)) - (1 - v) * 40); g.rotate(lerp(-10, -2, EASE.o(u)) * D2R); g.globalAlpha = v;
  shadowOn(g, .25); g.fillStyle = '#F3EAD6'; g.fillRect(-w / 2, -h / 2, w, h); shadowOff(g);
  g.strokeStyle = C.ink; g.lineWidth = 2.5; g.strokeRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20); g.lineWidth = 1; g.strokeRect(-w / 2 + 16, -h / 2 + 16, w - 32, h - 32);
  g.fillStyle = C.ink; g.textBaseline = 'alphabetic'; g.textAlign = 'left'; g.font = '96px OldStdB';
  let cx = -yw / 2; for (const ch of year) { g.fillText(ch, cx, -h / 2 + 112); cx += g.measureText(ch).width + 3; }
  if (u >= 1 && v >= 1) noteText(g, id, year, -yw / 2, -h / 2 + 40, yw / 2, -h / 2 + 116);
  if (line) { g.strokeStyle = 'rgba(43,34,25,.55)'; g.lineWidth = 1.2; g.beginPath(); g.moveTo(-yw / 2, -h / 2 + 128); g.lineTo(yw / 2, -h / 2 + 128); g.stroke();
    g.font = 'italic 40px FellIt'; g.fillStyle = C.inkS; g.textAlign = 'center'; g.fillText(line, 0, -h / 2 + 166); if (u >= 1 && v >= 1) noteText(g, id + '-l', line, -lw / 2, -h / 2 + 136, lw / 2, -h / 2 + 176); }
  g.restore();
}
// a scroll: parchment with rolled ends; content(g, w, h) draws the text; open 0..1 unrolls it downward
function scroll(g, x, y, w, h, open, rot, content, o = {}) {
  const hh = h * clamp(open); g.save(); g.translate(x, y); g.rotate(rot * D2R);
  shadowOn(g, o.lift || .15); g.fillStyle = o.col || '#EFE2C0'; g.fillRect(-w / 2, -h / 2, w, hh); shadowOff(g);
  g.save(); g.beginPath(); g.rect(-w / 2, -h / 2, w, hh); g.clip(); texture(g, -w / 2, -h / 2, w, hh, .5);
  g.strokeStyle = 'rgba(120,90,50,.35)'; g.lineWidth = 2; g.strokeRect(-w / 2 + 16, -h / 2 + 16, w - 32, h - 32); content(g, w, h); g.restore();
  const roll = (yy) => { const gr = g.createLinearGradient(0, yy - 20, 0, yy + 20); gr.addColorStop(0, '#CDB98E'); gr.addColorStop(.5, '#F4E8C8'); gr.addColorStop(1, '#B59E70'); shadowOn(g, .1); g.fillStyle = gr; g.beginPath(); g.roundRect(-w / 2 - 14, yy - 20, w + 28, 40, 20); g.fill(); shadowOff(g); g.strokeStyle = 'rgba(80,60,30,.6)'; g.lineWidth = 2; g.stroke(); };
  roll(-h / 2); roll(-h / 2 + hh);
  g.restore();
}
function waxSeal(g, x, y, r, col = '#A3241C') {
  g.save(); g.translate(x, y); shadowOn(g, .1);
  g.fillStyle = col; g.beginPath(); for (let i = 0; i <= 24; i++) { const a = i / 24 * TAU, rr = r * (1 + (i % 2 ? .06 : -.04)); i ? g.lineTo(Math.cos(a) * rr, Math.sin(a) * rr) : g.moveTo(Math.cos(a) * rr, Math.sin(a) * rr); } g.closePath(); g.fill(); shadowOff(g);
  g.strokeStyle = 'rgba(255,220,200,.35)'; g.lineWidth = 2; g.beginPath(); g.arc(0, 0, r * .68, 0, TAU); g.stroke();
  g.strokeStyle = 'rgba(60,10,8,.6)'; g.lineWidth = r * .14; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, -r * .4); g.lineTo(0, r * .4); g.moveTo(-r * .3, -r * .1); g.lineTo(r * .3, -r * .1); g.stroke();
  g.restore();
}
