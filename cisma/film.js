// O Grande Cisma de 1054 — the film: 12 scenes on one timeline (timeline.json), each a paper panel; a page slide between them.
const cv = document.getElementById('c'), MAIN = cv.getContext('2d');
let TL, DUR, SEA, PW, PE, PWn, PEn, AV, SCV = [], SCORD;
const Q = new URLSearchParams(location.search);
const SCN = id => TL.scenes[id];
const norm = s => s.normalize('NFD').replace(/[^\p{L}\p{N}]/gu, '').toLowerCase();
function wt(lid, word, n = 0, end = false) {   // when a word of a line is spoken (n-th match)
  const ws = TL.words[lid], q = norm(word); let k = 0;
  for (const w of ws) if (norm(w[0]).startsWith(q)) { if (k++ === n) return end ? w[2] : w[1]; }
  throw new Error(`wt: ${lid} ${word}`);
}
const L0 = id => TL.lines[id].t0, L1 = id => TL.lines[id].t1;
const TR = .42;   // page slide

// ---------------------------------------------------------------- shared pieces
function camSet(g, x, y, z) { g.setTransform(z, 0, 0, z, 540 - x * z, 900 - y * z); }
function panelBG(g, col, seed = 0) { g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = col; g.fillRect(0, 0, W, H); texture(g, 0, 0, W, H, .55); }
function floor(g, y, col = '#9A7552') { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); shadowOn(g, .2); g.fillStyle = col; g.fillRect(-20, y, W + 40, H - y + 20); shadowOff(g); texture(g, 0, y, W, H - y, .6);
  g.strokeStyle = 'rgba(50,30,15,.35)'; g.lineWidth = 2; for (let x = 60; x < W; x += 170) { g.beginPath(); g.moveTo(x, y + 8); g.lineTo(x - 30, H); g.stroke(); } g.restore(); }
function seaSheet(g) { g.drawImage(SEA, MAPB.x0, MAPB.y0, MAPB.x1 - MAPB.x0, MAPB.y1 - MAPB.y0); }
// the two land pieces: d = separation (px each way), tint 0..1, rot (deg each way)
const PVW = () => P(6, 46), PVE = () => P(33, 46);
function pieces(g, d, tint, rot = 0, lift = 0) {
  for (const [neu, col, sg, pv] of [[PWn, PW, -1, PVW()], [PEn, PE, 1, PVE()]]) {
    const o = { d: [sg * d, 0], rot: sg * rot, pv, h: lift };
    if (tint < 1) drawPiece(g, neu, o);
    if (tint > 0) drawPiece(g, col, { ...o, a: tint, h: tint < 1 ? -1 : lift });
  }
}
function walkLegs(t, on, amp = 16) { const ph = Math.sin(twos(t) * TAU * 2.2) * amp * on; return { L: ph, R: -ph }; }
// a puppet that walks between keyed x positions (hops on twos)
function walker(t, keys) { const x = K(t, keys, 'io'); let moving = 0; for (let i = 1; i < keys.length; i++) if (t > keys[i - 1][0] && t < keys[i][0] && keys[i][1] !== keys[i - 1][1]) moving = 1; return { x, moving, bob: moving ? -Math.abs(Math.sin(twos(t) * TAU * 2.2)) * 14 : 0 }; }
function roundCard(g, t, t0, n) {   // BRIGA Nº n: slapped big in the middle, then parked in the top-left corner
  const u = popIn(t, t0, .25), m = EASE.io(seg(t, t0 + 1.3, t0 + 1.8)); if (u <= 0) return;
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  g.translate(lerp(540, 205, m), lerp(560, 330, m)); g.rotate(lerp(-4, -6, m) * D2R); g.scale(u * lerp(1.25, .72, m), u * lerp(1.25, .72, m));
  const w = 400, h = 190; shadowOn(g, .3); g.fillStyle = '#1F1A16'; g.fillRect(-w / 2, -h / 2, w, h); shadowOff(g);
  g.fillStyle = C.fireL; g.fillRect(-w / 2 + 10, -h / 2 + 10, w - 20, h - 20); g.fillStyle = '#1F1A16'; g.fillRect(-w / 2 + 18, -h / 2 + 18, w - 36, h - 36);
  g.fillStyle = C.fireL; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '84px Lilita'; spaced(g, 'BRIGA', -48, 6, 3);
  g.font = '40px OldStdB'; g.fillText('Nº', 108, -24); g.font = '96px OldStdB'; g.fillText(String(n), 120, 30);
  if (u >= 1) noteText(g, 'round' + n, `BRIGA Nº ${n}`, -w / 2 + 20, -h / 2 + 20, w / 2 - 20, h / 2 - 20);
  g.restore();
}

// ---------------------------------------------------------------- props drawn in code
function pillar(g, x, base, h, w = 150, col = C.stone) {
  const top = base - h, p = P2(q => { q.rect(x - w / 2 + 14, top + 40, w - 28, h - 70); });
  shadowOn(g, .25); cardStroke(g, P2(q => q.rect(x - w / 2, base - 34, w, 34)), C.stoneD); cardStroke(g, p, col); cardStroke(g, P2(q => q.rect(x - w / 2 - 8, top, w + 16, 44)), C.stoneD); shadowOff(g);
  g.strokeStyle = 'rgba(90,60,35,.35)'; g.lineWidth = 2; for (let i = -1; i <= 1; i++) { g.beginPath(); g.moveTo(x + i * (w / 5), top + 48); g.lineTo(x + i * (w / 5), base - 40); g.stroke(); }
  return top;
}
function hagia(g, cx, by, k = 1, night = 0) {   // Hagia Sophia as it stood in 1054: a domed church (no minarets: those came after 1453)
  g.save(); g.translate(cx, by); g.scale(k, k); shadowOn(g, .3);
  const st = night ? '#5B4250' : '#D9A57E', stD = night ? '#47323F' : '#B98763', dm = night ? '#3E4552' : C.lead;
  cardStroke(g, P2(q => { q.rect(-390, -300, 70, 300); q.rect(320, -300, 70, 300); }), stD);
  cardStroke(g, P2(q => q.rect(-330, -250, 660, 250)), st);
  cardStroke(g, P2(q => { q.moveTo(-320, -250); q.arc(-180, -250, 140, Math.PI, 0); q.closePath(); q.moveTo(40, -250); q.arc(180, -250, 140, Math.PI, 0); q.closePath(); }), dm);
  cardStroke(g, P2(q => q.rect(-170, -330, 340, 90)), st);
  cardStroke(g, P2(q => { q.moveTo(-180, -330); q.bezierCurveTo(-180, -500, 180, -500, 180, -330); q.closePath(); }), dm);
  shadowOff(g);
  g.strokeStyle = night ? 'rgba(20,20,30,.5)' : 'rgba(50,55,65,.45)'; g.lineWidth = 2;
  for (let i = -4; i <= 4; i++) { g.beginPath(); g.moveTo(i * 38, -330); g.quadraticCurveTo(i * 30, -420, 0, -458); g.stroke(); }
  g.fillStyle = night ? '#F2B45A' : '#4A3426';
  for (let i = -6; i <= 6; i++) { g.beginPath(); g.moveTo(i * 24 - 7, -250); g.lineTo(i * 24 - 7, -290); g.arc(i * 24, -290, 7, Math.PI, 0); g.lineTo(i * 24 + 7, -250); g.fill(); }
  for (const x of [-240, -150, -60, 30, 120, 210]) { g.beginPath(); g.moveTo(x, -20); g.lineTo(x, -130); g.arc(x + 30, -130, 30, Math.PI, 0); g.lineTo(x + 60, -20); g.fill(); }
  g.fillStyle = C.gold; g.strokeStyle = C.paper; g.lineWidth = 4; const cr = P2(q => { q.rect(-5, -520, 10, 66); q.rect(-22, -500, 44, 10); }); g.stroke(cr); g.fill(cr);
  g.restore();
}
function altar(g, cx, top, w = 460, h = 200) {
  shadowOn(g, .3); cardStroke(g, P2(q => q.rect(cx - w / 2, top, w, h)), '#8A5A3A');
  cardStroke(g, P2(q => { q.moveTo(cx - w / 2 - 14, top - 6); q.lineTo(cx + w / 2 + 14, top - 6); q.lineTo(cx + w / 2 - 20, top + h * .7); q.lineTo(cx - w / 2 + 20, top + h * .7); q.closePath(); }), '#F4EEDC'); shadowOff(g);
  g.strokeStyle = C.gold; g.lineWidth = 6; g.beginPath(); g.moveTo(cx - w / 2 + 24, top + h * .7 - 10); g.lineTo(cx + w / 2 - 24, top + h * .7 - 10); g.stroke();
  g.fillStyle = C.gold; g.fillRect(cx - 6, top + 30, 12, 70); g.fillRect(cx - 26, top + 50, 52, 12);
}
function bull(g, x, y, rot, k, id, t, tread) {   // the bull of excommunication lying flat: a sheet with a lead seal on a cord
  g.save(); g.translate(x, y); g.rotate(rot * D2R); g.scale(k, k);
  shadowOn(g, .15); g.fillStyle = '#F1E4C2'; g.fillRect(-150, -100, 300, 200); shadowOff(g); texture(g, -150, -100, 300, 200, .5);
  g.strokeStyle = 'rgba(120,90,50,.45)'; g.lineWidth = 2; g.strokeRect(-138, -88, 276, 176);
  g.fillStyle = C.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '30px FellSC'; spaced(g, 'EXCOMUNHÃO', 0, -56, 2);
  g.strokeStyle = 'rgba(43,34,25,.45)'; g.lineWidth = 3; const r = rng(4); for (let i = 0; i < 4; i++) { g.beginPath(); let xx = -110; g.moveTo(xx, -14 + i * 24); while (xx < 110) { xx += 10 + r() * 14; g.lineTo(Math.min(xx, 110), -14 + i * 24 + (r() - .5) * 3); } g.stroke(); }
  g.strokeStyle = '#A3241C'; g.lineWidth = 3; g.beginPath(); g.moveTo(0, 100); g.lineTo(0, 130); g.stroke();
  g.fillStyle = '#8C9198'; g.beginPath(); g.arc(0, 146, 20, 0, TAU); g.fill(); g.strokeStyle = 'rgba(40,40,50,.5)'; g.lineWidth = 2; g.stroke();
  if (tread) noteText(g, id, 'EXCOMUNHÃO', -130, -74, 130, -38);
  g.restore();
}
function chair(g, cx, base, k = 1) {   // an empty throne-chair
  g.save(); g.translate(cx, base); g.scale(k, k); shadowOn(g, .3);
  cardStroke(g, P2(q => { q.moveTo(-170, -260); q.lineTo(-170, -620); q.lineTo(-120, -700); q.lineTo(0, -760); q.lineTo(120, -700); q.lineTo(170, -620); q.lineTo(170, -260); q.closePath(); }), '#7A4A2C');
  cardStroke(g, P2(q => { q.moveTo(-130, -280); q.lineTo(-130, -600); q.lineTo(0, -690); q.lineTo(130, -600); q.lineTo(130, -280); q.closePath(); }), '#A8322C');
  cardStroke(g, P2(q => q.rect(-200, -290, 400, 70)), '#B03A2E');
  cardStroke(g, P2(q => { q.rect(-190, -230, 40, 230); q.rect(150, -230, 40, 230); }), '#6A3E24');
  cardStroke(g, P2(q => { q.rect(-230, -300, 50, 120); q.rect(180, -300, 50, 120); }), '#7A4A2C');
  shadowOff(g); g.strokeStyle = C.gold; g.lineWidth = 5; g.beginPath(); g.moveTo(-130, -600); g.lineTo(0, -690); g.lineTo(130, -600); g.stroke();
  g.restore();
}
function calendar(g, x, y, day, month, year, k = 1, flyU = -1, flyPage = null) {
  const page = (d, m, yy, id, pass) => {
    g.fillStyle = '#FBF6EA'; g.fillRect(-120, -110, 240, 250); g.fillStyle = C.ink; g.textAlign = 'center'; g.textBaseline = 'alphabetic';
    g.font = '104px OldStdB'; g.fillText(d, 0, 20); g.font = '42px FellSC'; spaced(g, m, 0, 76, 3); g.font = '34px OldStd'; g.fillText(yy, 0, 120);
    if (id) noteText(g, id, `${d} ${m} ${yy}`, -100, -60, 100, 128, pass);
  };
  g.save(); g.translate(x, y); g.scale(k, k);
  shadowOn(g, .2); g.fillStyle = '#5B3B28'; g.fillRect(-130, -170, 260, 320); shadowOff(g);
  g.fillStyle = C.red; g.fillRect(-120, -160, 240, 50);
  for (const xx of [-70, 0, 70]) brass(g, xx, -150, 8);
  page(day, month, year, 'cal', false);
  if (flyPage && flyU >= 0 && flyU < 1) { g.save(); g.translate(lerp(0, 380, EASE.i(flyU)), lerp(0, -260, EASE.o(flyU))); g.rotate(flyU * 1.4); g.globalAlpha = 1 - flyU; shadowOn(g, .4); page(...flyPage, null); g.restore(); }
  g.restore();
}
function ribbon(g, x, y, k) {   // black mourning ribbon
  if (k <= 0) return; g.save(); g.translate(x, y); g.scale(k, k); shadowOn(g, .25);
  cardStroke(g, P2(q => { q.moveTo(-10, 0); q.lineTo(-60, 120); q.lineTo(-30, 112); q.lineTo(-14, 140); q.lineTo(4, 10); q.closePath(); q.moveTo(10, 0); q.lineTo(70, 110); q.lineTo(40, 106); q.lineTo(30, 136); q.lineTo(-4, 10); q.closePath(); }), '#1E1B1E');
  cardStroke(g, P2(q => { q.ellipse(-30, -8, 36, 20, -.4, 0, TAU); q.ellipse(30, -8, 36, 20, .4, 0, TAU); }), '#1E1B1E'); cardStroke(g, P2(q => q.ellipse(0, -4, 14, 14, 0, 0, TAU)), '#2E2A2E');
  g.restore();
}
function snail(g, x, y, k, t) {
  g.save(); g.translate(x, y); g.scale(k, k); shadowOn(g, .2);
  const st = Math.sin(twos(t) * 6) * 4;
  cardStroke(g, P2(q => { q.moveTo(-90, 0); q.quadraticCurveTo(-90, -30, -40, -26); q.lineTo(70, -24); q.quadraticCurveTo(110, -30, 116, -64 + st); q.lineTo(126, -64 + st); q.quadraticCurveTo(128, -10, 100, 0); q.closePath(); }), '#A8B28A');
  cardStroke(g, P2(q => q.arc(-10, -70, 66, 0, TAU)), '#C98A4B'); shadowOff(g);
  g.strokeStyle = '#7A4E25'; g.lineWidth = 6; g.beginPath(); for (let a = 0; a < 5 * Math.PI; a += .2) { const r = 6 + a * 3.6; g.lineTo(-10 + Math.cos(a) * r, -70 + Math.sin(a) * r); } g.stroke();
  g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.moveTo(118, -60 + st); g.lineTo(130, -96 + st); g.moveTo(108, -60 + st); g.lineTo(106, -98 + st); g.stroke();
  g.fillStyle = C.ink; g.beginPath(); g.arc(130, -98 + st, 5, 0, TAU); g.arc(106, -100 + st, 5, 0, TAU); g.fill();
  g.restore();
}
function wafer(g, x, y, k) { g.save(); g.translate(x, y); g.scale(k, k); shadowOn(g, .2); cardStroke(g, P2(q => q.ellipse(0, 0, 74, 74, 0, 0, TAU)), '#FBF5E4'); shadowOff(g); g.strokeStyle = 'rgba(160,130,90,.6)'; g.lineWidth = 3; g.beginPath(); g.arc(0, 0, 60, 0, TAU); g.moveTo(0, -36); g.lineTo(0, 36); g.moveTo(-26, -10); g.lineTo(26, -10); g.stroke(); g.restore(); }
function loaf(g, x, y, k, puff) {
  g.save(); g.translate(x, y); g.scale(k * (1 + .06 * puff), k * (1 + .22 * puff)); shadowOn(g, .25);
  cardStroke(g, P2(q => { q.moveTo(-110, 20); q.bezierCurveTo(-118, -86, 118, -86, 110, 20); q.closePath(); }), '#C98B4A');
  cardStroke(g, P2(q => { q.moveTo(-70, -36); q.bezierCurveTo(-72, -110, 72, -110, 70, -36); q.closePath(); }), '#D69A57'); shadowOff(g);
  g.fillStyle = 'rgba(120,70,30,.6)'; g.fillRect(-4, -100, 8, 54); g.fillRect(-24, -80, 48, 8); g.restore();
}
function flames(g, x, y, k, t, seed, col1 = C.fire, col2 = C.fireL) {
  const r = rng(seed + Math.floor(twos(t) * 12) % 3 * 31);
  g.save(); g.translate(x, y); g.scale(k, k);
  for (const [cl, sc] of [[col1, 1], [col2, .6]]) {
    g.fillStyle = cl; g.beginPath();
    for (let i = 0; i < 5; i++) { const fx = (i - 2) * 34 * sc + (r() - .5) * 10, fh = (110 + r() * 80) * sc; g.moveTo(fx - 26 * sc, 0); g.quadraticCurveTo(fx - 30 * sc, -fh * .5, fx + (r() - .5) * 20, -fh); g.quadraticCurveTo(fx + 30 * sc, -fh * .5, fx + 26 * sc, 0); }
    g.fill();
  }
  g.restore();
}
function skyline(g, by, night) {   // Constantinople: land walls, towers, domes
  const r = rng(12); shadowOn(g, .2);
  const col = night ? '#2A2233' : '#B99A7A';
  cardStroke(g, P2(q => { q.moveTo(-20, by); for (let x = -20; x <= W + 20; x += 120) { q.lineTo(x, by - 160); for (let m = 0; m < 4; m++) { q.lineTo(x + m * 30, by - 160); q.lineTo(x + m * 30, by - 176); q.lineTo(x + m * 30 + 15, by - 176); q.lineTo(x + m * 30 + 15, by - 160); } } q.lineTo(W + 20, by); q.closePath(); }), col);
  for (const [x, w, h] of [[90, 90, 300], [330, 80, 260], [760, 90, 320], [1000, 80, 270]]) cardStroke(g, P2(q => q.rect(x - w / 2, by - h, w, h)), night ? '#251E2D' : '#A88A6B');
  for (const [x, rr] of [[540, 150], [220, 80], [880, 90]]) cardStroke(g, P2(q => { q.moveTo(x - rr, by - 200); q.bezierCurveTo(x - rr, by - 200 - rr * 1.3, x + rr, by - 200 - rr * 1.3, x + rr, by - 200); q.closePath(); }), night ? '#332A3A' : '#8C939C');
  shadowOff(g);
  g.fillStyle = night ? '#F2A64A' : '#4A3426';
  for (let i = 0; i < 22; i++) { const x = 40 + r() * 1000, y = by - 40 - r() * 100; g.fillRect(x, y, 10, 16); }
  g.fillStyle = C.gold; g.fillRect(536, by - 200 - 150 * .97 - 60, 8, 50); g.fillRect(522, by - 200 - 150 * .97 - 46, 36, 8);
}
function sticker(g, id, text, x, y, k, t) {   // "comenta aqui embaixo!": a yellow sticker with an ink arrow pointing down
  if (k <= .001) return; g.save(); g.translate(x, y); g.rotate((-4 + Math.sin(t * 3) * 1.5) * D2R); g.scale(k, k);
  g.font = '70px Lilita'; const tw = g.measureText(text).width, w = tw + 90, h = 150;
  shadowOn(g, .35); g.fillStyle = '#F7D35A'; g.beginPath(); g.roundRect(-w / 2, -h / 2, w, h, 26); g.fill(); shadowOff(g);
  g.strokeStyle = C.ink; g.lineWidth = 5; g.stroke(); g.fillStyle = C.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, 0, 4);
  const b = Math.sin(t * 8) * 10; g.lineWidth = 12; g.lineCap = 'round'; g.beginPath(); g.moveTo(0, h / 2 + 24 + b); g.lineTo(0, h / 2 + 120 + b); g.moveTo(-36, h / 2 + 84 + b); g.lineTo(0, h / 2 + 122 + b); g.lineTo(36, h / 2 + 84 + b); g.stroke();
  if (k > .97) noteText(g, id, text, -tw / 2, -h / 2 + 20, tw / 2, h / 2 - 20);
  g.restore();
}
function tornPaper(g, x, y, rot, half, u, id, tread) {   // a small excommunication sheet; half = 0 whole, ±1 the halves flying apart
  g.save(); g.translate(x, y); g.rotate(rot * D2R);
  const draw = () => { shadowOn(g, .2); g.fillStyle = '#F1E4C2'; g.fillRect(-100, -130, 200, 260); shadowOff(g); g.strokeStyle = 'rgba(120,90,50,.45)'; g.lineWidth = 2; g.strokeRect(-90, -120, 180, 240);
    g.fillStyle = C.ink; g.textAlign = 'center'; g.textBaseline = 'middle'; g.font = '26px FellSC'; spaced(g, 'EXCOMUNHÃO', 0, -80, 1); g.font = '64px OldStdB'; g.fillText('1054', 0, 0); waxSeal(g, 0, 80, 26); };
  if (!half) { draw(); if (tread) noteText(g, id, 'EXCOMUNHÃO 1054', -84, -96, 84, 34); }
  else for (const sd of [-1, 1]) { g.save(); g.translate(sd * u * 140, -u * 60 + u * u * 300); g.rotate(sd * u * .9); g.beginPath(); const r = rng(3); g.moveTo(0, -140); for (let yy = -140; yy <= 140; yy += 20) g.lineTo((r() - .5) * 18, yy); g.lineTo(sd * 200, 140); g.lineTo(sd * 200, -140); g.closePath(); g.clip(); g.globalAlpha = 1 - clamp((u - .6) / .4); draw(); g.restore(); }
  g.restore();
}

// ================================================================ SCENES (t is film time)
const S = {};
// ---------------------------------------------------------------- 1 · hook: the map is cut in two; one word; a dead pope; 900 years
const HOOK_RO = 410, HOOK_CO = 670, MAPNECK = 1120, MAPS = .32;
S.hook = (g, t) => {
  const tCut0 = wt('l01', 'partiu') - .55, tCut1 = wt('l01', 'meio') + .05, tSplit = tCut1 + .08;
  const split = EASE.back(seg(t, tSplit, tSplit + .5)), dSep = 70 * split, tint = seg(t, tSplit, tSplit + .25);
  const zoom = K(t, [[0, 1.0], [tSplit - .1, 1.0], [tSplit + .15, 1.04], [tSplit + .6, 1.0]]), [sx, sy] = shake(t, tSplit, 14);
  camSet(g, 540 - sx, 900 - sy, zoom); seaSheet(g);
  pieces(g, dSep, tint, 2.5 * split, 0);
  // the printed cut line, the scissors running down it
  const sp = splitPts();
  if (t < tSplit) {
    g.save(); g.setLineDash([14, 10]); g.strokeStyle = C.ink; g.lineWidth = 4; polyUpTo(g, sp, seg(t, tCut0 - .8, tCut0)); g.stroke(); g.restore();
    const cu = seg(t, tCut0, tCut1); g.save(); g.strokeStyle = 'rgba(250,244,228,.95)'; g.lineWidth = 8; polyUpTo(g, sp, .06 + .9 * cu); g.stroke(); g.restore();
    if (t > tCut0 - .3) { const a = polyAlong(sp, .06 + .9 * EASE.io(cu)); scissors(g, a.p[0], a.p[1], a.a, .35 + .3 * Math.abs(Math.sin(twos(t) * 26)), 1.4); }
  }
  // puppets: holding hands, then thrown apart with their halves
  const rx = HOOK_RO - dSep - 90 * split, cx = HOOK_CO + dSep + 90 * split;
  const tW = wt('l01', 'brigas'), tWord = wt('l01', 'palavra'), slipOut = wt('l02', 'estranho');
  const together = t < tSplit, slipK = popIn(t, tW, .3) * popOut(t, slipOut, .25), tug = t > tW + .3 && t < slipOut ? Math.sin(twos(t) * 18) * 10 : 0;
  const tBull = wt('l02', 'excomunh') - .5, tDead = wt('l02', 'morrido'), tTime = wt('l03', 'comigo');
  const headR = t > tDead ? 'wow' : t > tSplit ? 'angry' : 'n', headC = t > tDead ? 'wow' : t > tSplit ? 'angry' : 'n';
  const hopS = hop(t, tSplit, tSplit + .45, 60), slipY = 1290;
  const ro = pup(g, 'ro', { x: rx, y: MAPNECK + hopS, s: MAPS, head: headR, hrot: wob(t, tSplit, 8), arm: { L: [10, 8], R: together ? { to: [540, 1280], bend: 1 } : slipK > .5 ? { to: [540 - 190 - tug, slipY], bend: 1 } : [14, 10] }, hold: { L: holdPart('ro', 1, .4, -4) } });
  const co = pup(g, 'co', { x: cx, y: MAPNECK + hopS, s: MAPS, head: headC, hrot: -wob(t, tSplit, 8), arm: { R: [12, 10], L: together ? { to: [540, 1280], bend: -1 } : slipK > .5 ? { to: [540 + 190 - tug, slipY], bend: -1 } : [14, 10] }, hold: { R: holdPart('co', 5, .5, 8) } });
  slip(g, 'teaser', 'F______E', 540 - tug, slipY - (1 - slipK) * 120, -2 + tug * .2, slipK, { px: 50, font: 'Lilita', pad: 30, sp: 12 });
  // year tag (it falls in at the very start: the loop lands on it)
  yearTag(g, 'y1054', t, wt('l01', '1054') - .25, 540, 360, '1054', null, tBull - .3);
  // the bull: unrolls; "em nome do papa"; FALECIDO
  const bOpen = EASE.o(seg(t, tBull, tBull + .55)), bOut = EASE.i(seg(t, tTime + .9, tTime + 1.3));
  if (bOpen > 0 && bOut < 1) {
    g.save(); g.translate(0, -bOut * 1400);
    const tNome = wt('l02', 'nome') - .1, tPapa = wt('l02', 'papa');
    scroll(g, 540, 600, 720, 620, bOpen, -1.5, (q, w, h) => {
      q.fillStyle = C.ink; q.textAlign = 'center'; q.textBaseline = 'alphabetic'; q.font = '64px FellSC'; spaced(q, 'EXCOMUNHÃO', 0, -h / 2 + 110, 5);
      if (bOpen > .97) noteText(q, 'bulltitle', 'EXCOMUNHÃO', -230, -h / 2 + 60, 230, -h / 2 + 120);
      q.strokeStyle = 'rgba(43,34,25,.42)'; q.lineWidth = 4; const r = rng(8); for (let i = 0; i < 5; i++) { q.beginPath(); let xx = -270; q.moveTo(xx, -130 + i * 40); while (xx < 270) { xx += 14 + r() * 18; q.lineTo(Math.min(xx, 270), -130 + i * 40 + (r() - .5) * 4); } q.stroke(); }
      if (t > tNome) { q.globalAlpha = seg(t, tNome, tNome + .3); q.font = 'italic 46px FellIt'; q.fillStyle = C.ink; q.textAlign = 'left'; q.fillText('em nome do papa', -270, 120); q.globalAlpha = 1; if (t > tNome + .3) noteText(q, 'nome', 'em nome do papa', -270, 86, 40, 132); }
      q.strokeStyle = C.ink; q.lineWidth = 2; q.beginPath(); q.moveTo(-270, 226); q.lineTo(270, 226); q.stroke();
    }, { lift: .3 });
    if (t > tPapa) { const k = 1 + .4 * Math.max(0, 1 - (t - tPapa) / .12); g.save(); g.translate(805, 520); g.scale(k, k); waxSeal(g, 0, 0, 52); g.restore(); }
    stampAt(g, 'falecido', 'FALECIDO', 600, 790, -9, t, tDead, '#232026', 64);
    ticks(g, t, tDead, [600, 790], 1.6);
    g.restore();
  }
  // 900 years: a strip from 1054 to "?"
  const sOpen = EASE.o(seg(t, tTime + .9, tTime + 1.5)), tArrow = wt('l03', 'chegou') - .1;
  if (sOpen > 0) {
    const x0 = 90, x1 = lerp(x0 + 40, 990, sOpen), y = 610;
    g.save(); shadowOn(g, .2); g.fillStyle = '#F3EAD6'; g.fillRect(x0, y - 70, x1 - x0, 140); shadowOff(g);
    g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(x0 + 8, y - 62, x1 - x0 - 16, 124);
    g.beginPath(); g.rect(x0, y - 70, x1 - x0, 140); g.clip();
    g.fillStyle = C.ink; g.font = '72px OldStdB'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('1054', 210, y + 4);
    if (sOpen > .97) noteText(g, 'strip1054', '1054', 130, y - 34, 290, y + 34);
    g.font = '96px Lilita'; g.fillStyle = C.red; g.fillText('?', 900, y + 6); if (sOpen > .97) noteText(g, 'stripq', '?', 875, y - 40, 925, y + 40);
    for (let i = 0; i < 18; i++) { const xx = 320 + i * 28; g.fillStyle = C.ink; g.fillRect(xx, y - (i % 5 ? 10 : 20), 3, i % 5 ? 20 : 40); }
    g.restore();
    const au = EASE.io(seg(t, tArrow, tArrow + .6));
    if (au > 0) { g.save(); g.strokeStyle = C.red; g.lineWidth = 8; g.lineCap = 'round'; g.beginPath(); g.moveTo(310, y + 110); g.lineTo(lerp(310, 840, au), y + 110); if (au > .95) { g.moveTo(810, y + 85); g.lineTo(842, y + 110); g.lineTo(810, y + 135); } g.stroke(); g.restore();
      slip(g, 'anos900', '+900 ANOS', 575, y + 200, -3, popIn(t, tArrow + .3, .25), { px: 54, font: 'Lilita', fg: C.red, pad: 30 }); }
  }
  if (t > tDead) bubble(g, 'qq', '?!', ro.top[0] + 190, ro.top[1] + 30, [ro.top[0] + 70, ro.top[1] + 90], popIn(t, tDead + .15, .2) * popOut(t, tTime + .9), true, 70);
};
// ---------------------------------------------------------------- 2 · mapa: one map; the West (Rome, Latin), the East (Constantinople, Greek); drifting apart
S.mapa = (g, t) => {
  const tW = wt('l04', 'Ocidente'), tRoma = wt('l04', 'Roma'), tLat = wt('l04', 'latim'), tE = wt('l04', 'Oriente'), tC = wt('l04', 'Constantinopla'), tGr = wt('l04', 'grego');
  const tAp = wt('l05', 'afastando') - .6, tLi = wt('l05', 'língua'), tCo = wt('l05', 'costumes'), tPo = wt('l05', 'política');
  const dSep = 90 * EASE.io(seg(t, tAp, tAp + 3.2)), rot = 2 * EASE.io(seg(t, tAp, tAp + 3.2));
  camSet(g, 540, 900, 1); seaSheet(g);
  for (const [neu, col, sg, pv, ta] of [[PWn, PW, -1, PVW(), tW], [PEn, PE, 1, PVE(), tE]]) {
    const o = { d: [sg * dSep, 0], rot: sg * rot, pv }, tint = seg(t, ta, ta + .45);
    drawPiece(g, neu, o); if (tint > 0) { g.save(); const [px, py] = P(sg < 0 ? 4 : 36, 40); g.beginPath(); g.arc(px + sg * dSep, py, 1500 * EASE.o(tint), 0, TAU); g.clip(); drawPiece(g, col, { ...o, h: -1 }); g.restore(); }
  }
  slip(g, 'antes', 'ANTES DE 1054', 540, 330, -2, popIn(t, SCN('mapa').t0 + .5, .25) * popOut(t, tW - .2), { px: 46 });
  const [rX, rY] = P(...CITY.roma), [cX, cY] = P(...CITY.cpla);
  pin(g, 'pRoma', 'ROMA', rX - dSep, rY, popIn(t, tRoma - .1, .25), -1);
  pin(g, 'pCpla', 'CONSTANTINOPLA', cX + dSep, cY, popIn(t, tC - .1, .25), -1);
  const ro = walker(t, [[tW + .1, -200], [tW + 1.3, 300]]), co = walker(t, [[tE + .1, 1300], [tE + 1.3, 790]]);
  pup(g, 'ro', { x: ro.x - dSep, y: MAPNECK + ro.bob, s: MAPS, head: t > tAp + 1 ? 'angry' : 'smug', arm: { L: [10, 8], R: [14, 12] }, leg: walkLegs(t, ro.moving), hold: { L: holdPart('ro', 1, .4, -4) } });
  pup(g, 'co', { x: co.x + dSep, y: MAPNECK + co.bob, s: MAPS, head: t > tAp + 1 ? 'angry' : 'smug', arm: { L: [14, 12], R: [12, 10] }, leg: walkLegs(t, co.moving), hold: { R: holdPart('co', 5, .5, 8) } });
  slip(g, 'latim', 'LATIM', rX - dSep - 70, 640, -4, popIn(t, tLat - .1, .25), { px: 42 });
  slip(g, 'grego', 'GREGO', cX + dSep - 40, 640, 3, popIn(t, tGr - .1, .25), { px: 42 });
  [['lingua', 'LÍNGUA', tLi, 1060], ['cost', 'COSTUMES', tCo, 1170], ['pol', 'POLÍTICA', tPo, 1280]].forEach(([id, s, t0, y], i) => slip(g, id, s, 540, y, (i - 1) * 3, popIn(t, t0 - .3, .25), { px: 38, bg: '#F3EAD6' }));
};
// ---------------------------------------------------------------- 3 · quem manda: Rome on a tall pillar; five equal pillars
S.quem = (g, t) => {
  const t0 = SCN('quem').t0, tQ = wt('l06', 'quem'), tAu = wt('l06', 'autoridade') - .3, tCp = wt('l06', 'Constantinopla'), tPr = wt('l06', 'primeiro') - .1;
  panelBG(g, '#E9D7B0'); floor(g, 1480);
  const eqH = 250, tallH = lerp(eqH, 620, EASE.back(seg(t, tAu, tAu + .6))) , down = EASE.back(seg(t, tPr, tPr + .5));
  const h = lerp(tallH, eqH, down) + wob(t, tPr + .5, 18, 4, 6), others = popIn(t, tCp, .3);
  g.setTransform(1, 0, 0, 1, 0, 0);
  for (const [i, x] of [[0, 120], [1, 330], [3, 750], [4, 960]].map(a => a)) if (others > 0) { g.save(); g.translate(x, 1480); g.scale(1, others); g.translate(-x, -1480); pillar(g, x, 1480, eqH, 150); g.restore(); }
  const top = pillar(g, 540, 1480, h, 160);
  const s = .3, foot = 1080 * s;
  const roY = top - foot + hop(t, tPr, tPr + .5, 40);
  pup(g, 'ro', { x: 540, y: roY, s, head: t > tPr ? 'angry' : t > tAu ? 'smug' : 'n', hrot: wob(t, tPr + .4, 10), arm: { L: [10, 8], R: t > tAu && t < tPr ? [120, 30] : [14, 10] }, hold: { L: holdPart('ro', 1, .4, -4) } });
  const coX = K(t, [[tCp, 900], [tCp + .6, 750]]), coTop = lerp(1480, 1480 - eqH, others), coY = coTop - foot + hop(t, tCp, tCp + .6, 80);
  pup(g, 'co', { x: coX, y: coY, s, head: t > tPr ? 'smug' : 'angry', arm: { L: t > tPr ? { to: [620, roY + 70], bend: -1 } : [12, 10], R: [12, 10] }, hold: { R: holdPart('co', 5, .5, 8) } });
  const label = t < tPr ? 'TODA A IGREJA' : '1º ENTRE IGUAIS';
  if (t < tPr) slip(g, 'pil1', label, 540, top + 110, -3, popIn(t, tAu + .4, .25) * popOut(t, tPr + .15, .12), { px: 36 });
  else slip(g, 'pil2', label, 540, 640, -3, popIn(t, tPr + .05, .2), { px: 58, font: 'Lilita', fg: C.red, pad: 36 });
  roundCard(g, t, t0 + .1, 1);
  bubble(g, 'qm', 'QUEM MANDA?', 600, 620, [coX - 10, coY - 150], popIn(t, tQ - .1, .25) * popOut(t, tAu - .1), true, 66);
};
// ---------------------------------------------------------------- 4 · filioque: the Creed, a slip pasted on; "não mexe!"
S.filioque = (g, t) => {
  const t0 = SCN('filioque').t0, tPal = wt('l07', 'palavra') - .2, tCr = wt('l07', 'Credo') - .3, tPai = wt('l07', 'procede'), tFi = wt('l07', 'Filho') - .45, tFq = wt('l07', 'Filioque') - .1;
  const tCo = L0('l08') - .2, tMx = wt('l08', 'mexer') - .1, tCc = wt('l08', 'concílio') - .2;
  panelBG(g, '#E6D3B4');
  const open = EASE.o(seg(t, tPal + .25, tPal + .85));
  if (open > 0) scroll(g, 540, 820, 780, 700, open, -1, (q, w, h) => {
    q.fillStyle = C.ink; q.textAlign = 'center'; q.textBaseline = 'alphabetic';
    q.font = '70px FellSC'; spaced(q, 'CREDO', 0, -h / 2 + 120, 8); q.font = '48px Fell';
    q.fillText('Creio no Espírito Santo,', 0, -120); q.fillText('que procede do Pai', -40, -40);
    if (open > .97) { noteText(q, 'credo', 'CREDO', -130, -h / 2 + 70, 130, -h / 2 + 128); noteText(q, 'cr1', 'Creio no Espírito Santo,', -250, -160, 250, -108); noteText(q, 'cr2', 'que procede do Pai', -240, -80, 160, -28); }
    const ul = EASE.io(seg(t, tPai, tPai + .5)); if (ul > 0) { q.strokeStyle = C.red; q.lineWidth = 5; q.beginPath(); q.moveTo(-230, -22); q.lineTo(lerp(-230, 150, ul), -22); q.stroke(); }
    if (t > tFi + .35) { q.strokeStyle = C.red; q.lineWidth = 5; q.beginPath(); q.moveTo(150, -30); q.lineTo(170, -60); q.lineTo(190, -30); q.stroke(); }
  }, { lift: .2 });
  // the pasted slip "e do Filho"; then the word stamped on it
  const ro = walker(t, [[wt('l07', 'Ocidente') - .2, -150], [wt('l07', 'Ocidente') + .9, 190]]);
  const reach = t > tFi - .2 && t < tFi + .5;
  const roP = pup(g, 'ro', { x: ro.x, y: 1190 + ro.bob, s: .3, head: t > tMx ? 'angry' : 'smug', arm: { L: [10, 8], R: reach ? { to: [470, 900], bend: 1 } : [14, 10] }, leg: walkLegs(t, ro.moving), hold: { L: holdPart('ro', 1, .4, -4) } });
  const sk = t < tFi - .2 ? 0 : t < tFi + .35 ? 1 : 1; const sx = t < tFi + .35 ? lerp(roP.hand.R[0], 700, seg(t, tFi - .2, tFi + .35)) : 700, sy = t < tFi + .35 ? lerp(roP.hand.R[1], 862, seg(t, tFi - .2, tFi + .35)) : 862;
  if (t > tFi - .2) slip(g, 'edofilho', 'e do Filho', sx, sy, -4, sk, { px: 46, font: 'Fell', bg: '#F6D9C8', fg: '#8E2A20', lift: t < tFi + .35 ? .4 : .1 });
  // the seal of the council, on the scroll from the start
  if (open > .9) { const k = 1 + .25 * wob(t, tCc, 1, 3, 6); g.save(); g.translate(540, 1040); g.scale(k, k); waxSeal(g, 0, 0, 50); g.restore(); slip(g, 'conc', 'CONCÍLIO', 540, 1120, 2, popIn(t, tCr + .7, .25), { px: 34 }); }
  // the teaser slip comes back, then shows the word
  const tk = popIn(t, tPal, .3), revealed = t > tFq;
  slip(g, revealed ? 'fq' : 'teaser2', revealed ? 'FILIOQUE' : 'F______E', 720, 350, 3, tk * (revealed ? 1 + .15 * Math.max(0, 1 - (t - tFq) / .15) : 1), { px: 56, font: 'Lilita', pad: 30, sp: 12, fg: revealed ? C.red : C.ink });
  const co = walker(t, [[tCo, 1300], [tCo + 1.0, 900]]);
  const coP = pup(g, 'co', { x: co.x, y: 1190 + co.bob, s: .3, head: 'angry', hrot: wob(t, tMx, 8), arm: { L: t > tMx ? [140, 20] : [14, 12], R: [12, 10] }, leg: walkLegs(t, co.moving), hold: { R: holdPart('co', 5, .5, 8) } });
  bubble(g, 'naomexe', 'NÃO MEXE!', 640, 1330, [coP.top[0] - 40, coP.top[1] + 90], popIn(t, tMx, .25), true, 64);
  roundCard(g, t, t0 + .1, 2);
};
// ---------------------------------------------------------------- 5 · pão: unleavened and leavened
S.pao = (g, t) => {
  const t0 = SCN('pao').t0, tP = wt('l09', 'pão') - .2, tR = wt('l09', 'Roma'), tSem = wt('l09', 'sem') - .2, tC = wt('l09', 'Constantinopla'), tCom = wt('l09', 'com') - .1, tF = wt('l09', 'fermento', 1);
  panelBG(g, '#EAD5B8');
  const s = .34;
  const roUp = t > tR, coUp = t > tC;
  const ro = pup(g, 'ro', { x: 250, y: 1000 + hop(t, tR - .1, tR + .3, 30), s, head: roUp ? 'smug' : 'n', arm: { L: [10, 8], R: roUp ? { to: [390, 760], bend: 1 } : [14, 10] }, hold: { L: holdPart('ro', 1, .4, -4) } });
  const co = pup(g, 'co', { x: 830, y: 1000 + hop(t, tC - .1, tC + .3, 30), s, head: coUp ? 'smug' : 'n', arm: { R: [12, 10], L: coUp ? { to: [690, 760], bend: -1 } : [14, 10] }, hold: { R: holdPart('co', 5, .5, 8) } });
  if (roUp) wafer(g, ro.hand.R[0] + 10, ro.hand.R[1] - 60, popIn(t, tR, .25) * 1.2);
  if (coUp) { const pf = EASE.back(seg(t, tF - .1, tF + .35)); loaf(g, co.hand.L[0] - 10, co.hand.L[1] - 10, popIn(t, tC, .25) * 1.55, pf + wob(t, tF + .25, .25, 4, 6)); }
  g.setTransform(1, 0, 0, 1, 0, 0); altar(g, 540, 1250, 1000, 260);
  slip(g, 'sem', 'SEM FERMENTO', 270, 1330, -3, popIn(t, tSem, .25), { px: 36 });
  slip(g, 'com', 'COM FERMENTO', 810, 1330, 3, popIn(t, tC, .25), { px: 36 });
  slip(g, 'missa', 'O PÃO DA MISSA', 540, 560, -2, popIn(t, tP, .25) * popOut(t, tR + .6), { px: 44 });
  roundCard(g, t, t0 + .1, 3);
};
// ---------------------------------------------------------------- 6 · bula: 16 July 1054, Hagia Sophia: the bull on the altar; the counter-stamp
S.bula = (g, t) => {
  const tY = wt('l10', '1054') - .3, tEnv = wt('l10', 'enviados') - .3, tBula = wt('l10', 'bula') - .05, tHS = wt('l10', 'Hagia') - .1;
  const tPat = wt('l11', 'patriarca') - .3, tExc = wt('l11', 'excomungando') + .15;
  panelBG(g, '#E3CDAE');
  g.setTransform(1, 0, 0, 1, 0, 0); hagia(g, 540, 1180, 1.05);
  slip(g, 'hs', 'HAGIA SOPHIA', 540, 540, -2, popIn(t, tHS, .25), { px: 44 });
  floor(g, 1440, '#8C6A4C');
  const slap = tBula, ro = walker(t, [[tEnv, -200], [tEnv + 1.1, 300]]);
  const hit = t > tExc;
  const roP = pup(g, 'ro', { x: ro.x + (hit ? shake(t, tExc, 16)[0] : 0), y: 1100 + ro.bob + hop(t, tExc, tExc + .35, 40), s: .33, head: hit ? 'wow' : t > slap ? 'smug' : 'n', hrot: hit ? wob(t, tExc, 10) : 0,
    arm: { L: [10, 8], R: t > slap - .5 && t < slap + .6 ? { to: [t < slap ? 420 : 470, t < slap ? 980 : 1235], bend: 1 } : [16, 14] }, leg: walkLegs(t, ro.moving), hold: { L: holdPart('ro', 1, .4, -4) } });
  g.setTransform(1, 0, 0, 1, 0, 0); altar(g, 540, 1250, 460, 220);
  if (t < slap && t > tEnv) { g.save(); g.translate(roP.hand.R[0], roP.hand.R[1]); g.rotate(-.3); shadowOn(g, .2); g.fillStyle = '#F1E4C2'; g.fillRect(-20, -70, 40, 140); shadowOff(g); g.restore(); }
  if (t >= slap) bull(g, 540, 1205, -5, .9 + .15 * Math.max(0, 1 - (t - slap) / .1), 'bull', t, t > slap + .1);
  ticks(g, t, slap, [540, 1205], 1.1);
  const co = walker(t, [[tPat, 1300], [tPat + 1.0, 820], [tExc - .4, 820], [tExc - .1, 680]]);
  const stampX = t > tExc - .4 && t < tExc + .45 ? { to: [lerp(600, 420, seg(t, tExc - .35, tExc - .05)), t < tExc ? 1030 : 1110], bend: -1 } : [20, 30];
  const coP = pup(g, 'co', { x: co.x, y: 1100 + co.bob, s: .33, head: t > tPat + .8 ? 'angry' : 'n', arm: { L: stampX, R: [12, 10] }, leg: walkLegs(t, co.moving), hold: { R: holdPart('co', 5, .5, 8) } });
  if (t > tPat + .2) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); const h = coP.hand.L; g.translate(h[0], h[1] + 60); g.scale(.42, .42); stampTool(g, 0, 0, t > tExc && t < tExc + .15 ? 1 : 0); g.restore(); }
  stampAt(g, 'excs', 'EXCOMUNGADOS', 330, 1230, -9, t, tExc, C.stamp, 50);
  ticks(g, t, tExc, [330, 1180], 1.2);
  yearTag(g, 'y1054b', t, tY, 300, 360, '1054', '16 de julho');
};
// ---------------------------------------------------------------- 7 · morto: an empty chair; the calendar runs on three months
S.morto = (g, t) => {
  const tL = wt('l12', 'Leão') - .15, tM = wt('l12', 'morrido') - .15, tTr = wt('l12', 'três') - .1;
  panelBG(g, '#D9CDB9');
  g.setTransform(1, 0, 0, 1, 0, 0); floor(g, 1420, '#7E6450');
  chair(g, 590, 1430, 1);
  { const r = PI('ro', 0); g.save(); g.translate(590, 1120); g.rotate(-.25); g.scale(.36, .36); shadowOn(g, .2); g.drawImage(IMG.ro_0, -(r.bb[0] + r.bb[2]) / 2, -r.bb[3]); g.restore(); }
  slip(g, 'leao', 'LEÃO IX', 590, 870, -2, popIn(t, tL, .25), { px: 48 });
  ribbon(g, 700, 690, popIn(t, tM, .3));
  const pages = [['19', 'ABRIL', '1054'], ['19', 'MAIO', '1054'], ['19', 'JUNHO', '1054'], ['16', 'JULHO', '1054']];
  let pi = 0, flyU = -1; for (let i = 0; i < 3; i++) { const ti = tTr + i * .3; if (t > ti) { pi = i + 1; flyU = -1; } if (t > ti && t < ti + .45) flyU = (t - ti) / .45; }
  { const ip = pages[pi], fp = flyU >= 0 ? pages[pi - 1] : null; const cal = popIn(t, SCN('morto').t0 + .3, .3);
    g.save(); g.translate(880, 560); g.scale(cal, cal); calendar(g, 0, 0, ip[0], ip[1], ip[2], 1, flyU, fp); g.restore();
    if (pi < 3) TX = TX.map(o => o.id === 'cal' ? { ...o, pass: true } : o); }
  const ro = pup(g, 'ro', { x: 190, y: 1060 + hop(t, tM, tM + .3, 50), s: .32, head: t > tM ? 'wow' : 'n', hrot: wob(t, tM, 10), arm: { L: [10, 8], R: t > tM ? [60, 80] : [14, 10] }, hold: { L: holdPart('ro', 1, .4, -4) } });
  bubble(g, 'qq2', '?!', 200, 760, [ro.top[0] + 10, ro.top[1] - 10], popIn(t, tM + .2, .2), true, 76);
};
// ---------------------------------------------------------------- 8 · lento: not one day; a slow drifting apart (a snail crosses the gap)
S.lento = (g, t) => {
  const t0 = SCN('lento').t0, tDia = wt('l13', 'dia') - .2, tLe = wt('l13', 'afastamento') - .3;
  const dSep = lerp(90, 150, seg(t, t0, SCN('lento').t1)), rot = 2;
  camSet(g, 540, 900, 1); seaSheet(g); pieces(g, dSep, 1, rot);
  const [rX, rY] = P(...CITY.roma), [cX, cY] = P(...CITY.cpla);
  pin(g, 'pRoma2', 'ROMA', rX - dSep, rY, 1, -1); pin(g, 'pCpla2', 'CONSTANTINOPLA', cX + dSep, cY, 1, -1);
  pup(g, 'ro', { x: 300 - dSep, y: MAPNECK, s: MAPS, head: 'n', hrot: -6, arm: { L: [10, 8], R: [14, 12] }, hold: { L: holdPart('ro', 1, .4, -4) } });
  pup(g, 'co', { x: 790 + dSep, y: MAPNECK, s: MAPS, head: 'n', hrot: 6, arm: { L: [14, 12], R: [12, 10] }, hold: { R: holdPart('co', 5, .5, 8) } });
  const yu = seg(t, t0 + .4, tLe + .8), yr = Math.round(lerp(1054, 1204, EASE.io(yu)));
  slip(g, 'roll' + yr, String(yr), 540, 330, -2, popIn(t, t0 + .4, .25), { px: 64, font: 'OldStdB', pad: 40, pass: true });
  slip(g, 'umdia', 'NÃO FOI NUM DIA SÓ', 540, 470, 2, popIn(t, tDia, .25), { px: 42 });
  const sk = popIn(t, tLe - .2, .3); if (sk > 0) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); snail(g, lerp(380, 560, seg(t, tLe, SCN('lento').t1)), 1430, .8 * sk, t); g.restore(); slip(g, 'lento', 'LENTO', lerp(380, 560, seg(t, tLe, SCN('lento').t1)) - 10, 1250, -3, sk, { px: 40 }); }
};
// ---------------------------------------------------------------- 9 · 1204: the sack of Constantinople (serious, dark, no gags); then the wound
S.s1204 = (g, t) => {
  const t0 = SCN('s1204').t0, tY = wt('l14', 'golpe') - .2, tCr = wt('l14', 'cruzados') - .4, tCp = wt('l14', 'Constantinopla') - .1, tCrist = wt('l14', 'cidade') - .1;
  const tMap = L0('l15') + .25, tF = wt('l15', 'fechar') - .3, mapU = seg(t, tMap, tMap + .5);
  if (mapU < 1) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    const sky = g.createLinearGradient(0, 0, 0, H); sky.addColorStop(0, '#120F1C'); sky.addColorStop(.55, '#3A1A22'); sky.addColorStop(.8, '#7A2E22'); sky.addColorStop(1, '#2A1A18');
    g.fillStyle = sky; g.fillRect(0, 0, W, H); texture(g, 0, 0, W, H, .4);
    const glow = g.createRadialGradient(540, 1150, 50, 540, 1150, 700); glow.addColorStop(0, `rgba(240,120,50,${.35 + .08 * Math.sin(twos(t) * 9)})`); glow.addColorStop(1, 'rgba(240,120,50,0)'); g.fillStyle = glow; g.fillRect(0, 0, W, H);
    skyline(g, 1250, true);
    for (const [x, y, k, sd] of [[150, 1100, .9, 1], [400, 1095, .7, 2], [700, 1092, 1, 3], [930, 1100, .8, 4], [560, 920, .6, 5]]) flames(g, x, y, k, t, sd);
    g.fillStyle = '#1A1416'; g.fillRect(0, 1250, W, H - 1250); texture(g, 0, 1250, W, H - 1250, .5);
    pin(g, 'pCp', 'CONSTANTINOPLA', 540, 760, popIn(t, tCp, .25), -1 * 0 + 1);
    const cr = walker(t, [[tY + .2, -220], [tCr + .3, 360]]);
    pup(g, 'cr', { x: cr.x, y: 1120 + cr.bob, s: .38, head: 'grim', helm: 1, arm: { L: [16, 20], R: t > tCr + .3 ? { to: [480, 840], bend: 1 } : [20, 10] }, leg: walkLegs(t, cr.moving), hold: { R: holdPart('cr', 0, .86, t > tCr + .3 ? 20 : 170) } });
    pup(g, 'co', { x: 840, y: 1180, s: .3, rot: 5, head: 'n', hrot: 12, arm: { L: [4, 30], R: [4, 30] }, hold: {} });
    slip(g, 'crista', 'UMA CIDADE CRISTÃ', 540, 1560 - 120, -1, popIn(t, tCrist - 1.0, .25), { px: 40, bg: '#E8D9BE' });
    yearTag(g, 'y1204', t, tY, 540, 380, '1204', 'a quarta cruzada');
    if (t < tMap) return;
    g.save(); g.globalAlpha = mapU;
  }
  camSet(g, 540, 900, 1); seaSheet(g);
  const dSep = 150 + 20 * EASE.io(seg(t, tMap, tF));
  pieces(g, dSep, 1, 2);
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = 'rgba(20,12,20,.45)'; g.fillRect(0, 0, W, H);
  // the wound: a red jagged line down the gap; tape tries to close it and peels off
  const sp = splitPts(), wu = EASE.o(seg(t, tMap + .4, tMap + 1.6));
  g.save(); g.strokeStyle = '#B3261E'; g.lineWidth = 10; g.lineJoin = 'miter'; g.beginPath(); const r = rng(14);
  for (let i = 0; i <= 60 * wu; i++) { const q = polyAlong(sp, i / 60).p; g.lineTo(q[0] + (i % 2 ? -1 : 1) * (10 + r() * 14), q[1]); } g.stroke(); g.restore();
  for (let i = 0; i < 3; i++) { const ti = wt('l15', 'difícil') - .3 + i * .35, a = polyAlong(sp, .3 + i * .17).p, peel = seg(t, tF + i * .12, tF + i * .12 + .5);
    if (t < ti) continue; const k = popIn(t, ti, .2);
    g.save(); g.translate(a[0], a[1] + peel * 200); g.rotate((-8 + i * 7 + peel * 60) * D2R); g.globalAlpha = (1 - peel) * mapU; g.scale(k, k); shadowOn(g, .2); g.fillStyle = 'rgba(232,215,175,.95)'; g.fillRect(-150, -26, 300, 52); shadowOff(g); g.restore(); }
  slip(g, 'ferida', 'A FERIDA', 540, 360, -2, popIn(t, wt('l15', 'ferida') - .1, .25), { px: 52, bg: '#E8D9BE', fg: '#7E1D17' });
  if (mapU < 1) g.restore();
};
// ---------------------------------------------------------------- 10 · 1965: both lift the excommunications (the papers torn) and shake hands
S.s1965 = (g, t) => {
  const t0 = SCN('s1965').t0, tFin = wt('l16', 'final') - .2, tY = wt('l16', '1965') - .3, tRet = wt('l16', 'retiraram') - .05, tShake = wt('l16', '1054', 0) + .3;
  panelBG(g, '#DCE6E0');
  { g.setTransform(1, 0, 0, 1, 0, 0); const sun = g.createRadialGradient(540, 900, 50, 540, 900, 900); sun.addColorStop(0, 'rgba(255,240,190,.55)'); sun.addColorStop(1, 'rgba(255,240,190,0)'); g.fillStyle = sun; g.fillRect(0, 0, W, H); }
  floor(g, 1440, '#9C8A6E');
  const near = EASE.io(seg(t, tShake - .3, tShake + .5)), rx = lerp(300, 380, near), cx = lerp(780, 700, near), torn = t > tRet;
  const shakeY = t > tShake + .4 ? Math.sin(twos(t) * 14) * 12 : 0;
  const ro = pup(g, 'ro', { x: rx, y: 1080 + hop(t, tShake + .3, tShake + .7, 30), s: .35, head: torn ? 'smug' : 'n', arm: { L: [10, 8], R: t > tShake ? { to: [540, 1190 + shakeY], bend: 1 } : { to: [rx + 120, 1170], bend: 1 } }, hold: { L: holdPart('ro', 1, .4, -4) } });
  const co = pup(g, 'co', { x: cx, y: 1080 + hop(t, tShake + .3, tShake + .7, 30), s: .35, head: torn ? 'smug' : 'n', arm: { R: [12, 10], L: t > tShake ? { to: [548, 1192 + shakeY], bend: -1 } : { to: [cx - 120, 1170], bend: -1 } }, hold: { R: holdPart('co', 5, .5, 8) } });
  const tu = seg(t, tRet, tRet + 1.0);
  if (t > tFin) for (const [p, sd, id] of [[ro.hand.R, -1, 'xr'], [co.hand.L, 1, 'xc']]) if (tu < 1) tornPaper(g, p[0] + sd * 10, p[1] - 120, sd * 4, torn ? sd : 0, tu, id, !torn && t > tFin + .3);
  flecks(g, t, tRet + .05, [540, 1000], ['#F1E4C2', '#E8D9BE', C.red, C.gold], 22, 1.2, 4);
  stampAt(g, 'revog', 'REVOGADAS', 540, 650, -6, t, tRet + .5, '#2F6B3A', 66);
  yearTag(g, 'y1965', t, tY, 540, 380, '1965', 'Roma e Constantinopla');
};
// ---------------------------------------------------------------- 11 · hoje: catholics and orthodox; much faith in common (a paper bridge), differences
S.hoje = (g, t) => {
  const tCat = wt('l17', 'católicos') - .15, tOrt = wt('l17', 'ortodoxos') - .15, tFe = wt('l17', 'fé') - .3, tDif = wt('l17', 'diferenças') - .1;
  const dSep = 70 + wob(t, tDif, 10, 6, 6);
  camSet(g, 540, 900, 1); seaSheet(g); pieces(g, dSep, 1, 1.5);
  const [rX, rY] = P(...CITY.roma), [cX, cY] = P(...CITY.cpla);
  pin(g, 'pRoma3', 'ROMA', rX - dSep, rY, 1, -1); pin(g, 'pCpla3', 'CONSTANTINOPLA', cX + dSep, cY, 1, -1);
  pup(g, 'ro', { x: 300 - dSep, y: MAPNECK, s: MAPS, head: 'smug', arm: { L: [10, 8], R: t > tFe ? [100, 20] : [14, 12] }, hold: { L: holdPart('ro', 1, .4, -4) } });
  pup(g, 'co', { x: 790 + dSep, y: MAPNECK, s: MAPS, head: 'smug', arm: { L: t > tFe ? [100, 20] : [14, 12], R: [12, 10] }, hold: { R: holdPart('co', 5, .5, 8) } });
  slip(g, 'cat', 'CATÓLICOS', 270, 380, -4, popIn(t, tCat, .25), { px: 46, bg: '#F6DCD3', fg: '#8E2A20' });
  slip(g, 'ort', 'ORTODOXOS', 810, 380, 4, popIn(t, tOrt, .25), { px: 46, bg: '#E4DAF0', fg: '#4E2F6B' });
  const bk = EASE.back(seg(t, tFe, tFe + .4)); if (bk > 0) { g.save(); g.setTransform(1, 0, 0, 1, 0, 0); g.translate(540, 540); g.scale(bk, 1); shadowOn(g, .3); g.fillStyle = '#F3EAD6'; g.fillRect(-260, -50, 520, 100); shadowOff(g); g.strokeStyle = C.ink; g.lineWidth = 2; g.strokeRect(-250, -40, 500, 80); g.restore();
    slip(g, 'fe', 'FÉ EM COMUM', 540, 540, 0, bk, { px: 44, border: false, tape: false, bg: 'rgba(0,0,0,0)', lift: 0 }); }
  slip(g, 'dif', 'DIFERENÇAS', 540, 665, -3, popIn(t, tDif, .25), { px: 40, bg: '#F3EAD6' });
};
// ---------------------------------------------------------------- 12 · ret: back to one map ("they were once one Church"), the comment sticker, and the loop to 1054
S.ret = (g, t) => {
  const t0 = SCN('ret').t0, tIg = wt('l18', 'Igreja') - .3, tPq = wt('l18', 'Porque') - .2, t1 = SCN('ret').t1;
  const back = EASE.io(seg(t, t0 + .4, tIg + .3)), dSep = 70 * (1 - back), tint = 1 - seg(t, tIg, tIg + .6);
  camSet(g, 540, 900, 1); seaSheet(g); pieces(g, dSep, tint, 1.5 * (1 - back));
  const [rX, rY] = P(...CITY.roma), [cX, cY] = P(...CITY.cpla), pk = popOut(t, tIg, .2);
  pin(g, 'pRoma3', 'ROMA', rX - dSep, rY, pk, -1); pin(g, 'pCpla3', 'CONSTANTINOPLA', cX + dSep, cY, pk, -1);
  const w = seg(t, tPq - .2, t1 - .7), rx = lerp(300 - dSep, HOOK_RO, EASE.io(w)), cx = lerp(790 + dSep, HOOK_CO, EASE.io(w)), mv = w > 0 && w < 1 ? 1 : 0, bob = mv ? -Math.abs(Math.sin(twos(t) * TAU * 2.2)) * 14 : 0;
  const join = t > t1 - .55;
  pup(g, 'ro', { x: rx, y: MAPNECK + bob, s: MAPS, head: 'n', arm: { L: [10, 8], R: join ? { to: [540, 1280], bend: 1 } : [14, 10] }, leg: walkLegs(t, mv), hold: { L: holdPart('ro', 1, .4, -4) } });
  pup(g, 'co', { x: cx, y: MAPNECK + bob, s: MAPS, head: 'n', arm: { R: [12, 10], L: join ? { to: [540, 1280], bend: -1 } : [14, 10] }, leg: walkLegs(t, mv), hold: { R: holdPart('co', 5, .5, 8) } });
  sticker(g, 'comenta', 'COMENTA AQUI EMBAIXO!', 540, 430, popIn(t, t0 + .2, .3) * popOut(t, tPq + .9, .2), t);
  slip(g, 'umaso', 'UMA IGREJA SÓ', 540, 780, -2, popIn(t, tIg, .25) * popOut(t, t1 - .45, .2), { px: 50 });
};

// ---------------------------------------------------------------- channel identity (top) and the caption box (bottom)
function brand(g) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  const y = 120; g.save(); shadowOn(g, .25); g.fillStyle = '#F3EAD6'; g.beginPath(); g.moveTo(150, y - 46); g.lineTo(960, y - 46); g.lineTo(930, y); g.lineTo(960, y + 46); g.lineTo(150, y + 46); g.closePath(); g.fill(); shadowOff(g);
  g.strokeStyle = C.ink; g.lineWidth = 3; g.stroke(); g.lineWidth = 1.2; g.beginPath(); g.moveTo(170, y - 36); g.lineTo(940, y - 36); g.moveTo(170, y + 36); g.lineTo(940, y + 36); g.stroke();
  g.fillStyle = '#7E1D17'; g.font = '50px FellSC'; g.textAlign = 'center'; g.textBaseline = 'middle'; spaced(g, 'HISTÓRIAS E CRENÇAS', 560, y + 4, 3);
  noteText(g, 'brand', 'HISTÓRIAS E CRENÇAS', 250, y - 26, 870, y + 26);
  const cx = 120, cy = 120, r = 82; shadowOn(g, .35); g.fillStyle = '#3A2A20'; g.beginPath(); g.arc(cx, cy, r + 14, 0, TAU); g.fill(); shadowOff(g);
  brass(g, cx, cy, r + 9); g.save(); g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.clip(); if (AV) g.drawImage(AV, 25, 18, 360, 360, cx - r, cy - r, 2 * r, 2 * r); g.restore();
  g.strokeStyle = C.ink; g.lineWidth = 3; g.beginPath(); g.arc(cx, cy, r, 0, TAU); g.stroke();
  g.restore();
}
function wrap2(g, str, font, maxW) { g.font = font; if (measureMixed(g, str, font) <= maxW) return [str]; const ws = str.split(' '); let bi = 1, bd = 1e9;
  for (let i = 1; i < ws.length; i++) { const a = ws.slice(0, i).join(' '), b = ws.slice(i).join(' '), d = Math.abs(measureMixed(g, a, font) - measureMixed(g, b, font)) + (ws[i - 1].length <= 2 ? 90 : 0); if (d < bd) { bd = d; bi = i; } }
  return [ws.slice(0, bi).join(' '), ws.slice(bi).join(' ')]; }
function caption(g, t) {
  const c = TL.cues.find(c => t >= c.t0 && t < c.t1); if (!c) return;
  const u = EASE.o(clamp((t - c.t0) / .12)), v = clamp((c.t1 - t) / .08), font = '48px Fell';
  g.save(); g.setTransform(1, 0, 0, 1, 0, 0);
  const L = wrap2(g, c.text, font, 900), w = Math.max(...L.map(l => measureMixed(g, l, font))) + 70, h = L.length * 60 + 44, x = 540 - w / 2, y = 1650 - h / 2 + (1 - u) * 14;
  g.globalAlpha = Math.min(u, v); shadowOn(g, .25); g.fillStyle = C.caption; g.fillRect(x, y, w, h); shadowOff(g);
  g.strokeStyle = C.ink; g.lineWidth = 3; g.strokeRect(x + 1.5, y + 1.5, w - 3, h - 3);
  g.fillStyle = C.ink; g.textBaseline = 'middle'; L.forEach((l, i) => fillMixed(g, l, 540, y + 22 + 30 + i * 60, font, 'center'));
  g.restore();
}

// ---------------------------------------------------------------- render: the panel of the scene (a page slide when a new scene comes in)
function sceneIdx(t) { let i = SCORD.length - 1; for (let k = 0; k < SCORD.length; k++) if (t >= SCN(SCORD[k]).t0 && t < SCN(SCORD[k]).t1) { i = k; break; } return i; }
function drawScene(i, t, cvs) {
  const g = cvs.getContext('2d'); g.setTransform(1, 0, 0, 1, 0, 0); shadowOff(g); g.globalAlpha = 1; g.clearRect(0, 0, W, H);
  const before = TX.length; S[SCORD[i]](g, t); g.setTransform(1, 0, 0, 1, 0, 0); g.globalAlpha = 1; shadowOff(g);
  return before;
}
function render(t) {
  t = clamp(t, 0, DUR - 1e-4); TX = [];
  const i = sceneIdx(t), id = SCORD[i], s0 = SCN(id).t0, u = (t - s0) / TR, g = MAIN;
  g.setTransform(1, 0, 0, 1, 0, 0); g.fillStyle = '#2A221C'; g.fillRect(0, 0, W, H);
  const slide = i > 0 && u < 1 && !(id === 'ret');
  if (slide) {
    const e = EASE.io(clamp(u)), dy = -e * (H + 40);
    const bA = drawScene(i - 1, SCN(SCORD[i - 1]).t1 - 1e-3, SCV[0]); for (let k = bA; k < TX.length; k++) { TX[k].y0 += dy; TX[k].y1 += dy; }
    const bB = drawScene(i, t, SCV[1]); for (let k = bB; k < TX.length; k++) { TX[k].y0 += dy + H + 40; TX[k].y1 += dy + H + 40; }
    g.drawImage(SCV[0], 0, dy); g.drawImage(SCV[1], 0, dy + H + 40);
    g.save(); const r = rng(Math.floor(t * 24)); g.strokeStyle = 'rgba(43,34,25,.5)'; g.lineCap = 'round';
    for (let k = 0; k < 22; k++) { const x = r() * W, y = r() * H, l = 160 + r() * 380; g.lineWidth = 2 + r() * 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y + l); g.stroke(); } g.restore();
  } else { drawScene(i, t, SCV[1]); g.drawImage(SCV[1], 0, 0); }
  // panel border, vignette, identity, caption
  g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = '#2A221C'; g.lineWidth = 24; g.strokeRect(0, 0, W, H); g.strokeStyle = C.ink; g.lineWidth = 4; g.strokeRect(14, 14, W - 28, H - 28);
  const v = g.createRadialGradient(W / 2, H * .46, H * .32, W / 2, H / 2, H * .78); v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,25,10,.28)'); g.fillStyle = v; g.fillRect(0, 0, W, H);
  brand(g); caption(g, t);
  TX = TX.filter(b => b.x1 > 0 && b.x0 < W && b.y1 > 0 && b.y0 < H);
}

// ---------------------------------------------------------------- sound events (core/render/events.mjs → events.json → audio.py)
function buildEvents() {
  const ev = [], E = (t, type, o = {}) => ev.push({ t: +t.toFixed(3), type, ...o });
  for (const [id, l] of Object.entries(TL.lines)) E(l.t0, 'vo', { id });
  SCORD.slice(1).forEach(id => { if (id !== 'ret') E(SCN(id).t0, 'slide'); });
  // hook
  E(wt('l01', '1054') - .25, 'tag'); E(wt('l01', 'partiu') - .55, 'snip', { d: .6 }); E(wt('l01', 'meio') + .13, 'rip'); E(wt('l01', 'meio') + .13, 'hit');
  E(wt('l01', 'brigas'), 'pop'); E(wt('l01', 'palavra'), 'tug'); E(wt('l02', 'excomunh') - .5, 'unroll'); E(wt('l02', 'nome') - .1, 'quill'); E(wt('l02', 'papa'), 'seal');
  E(wt('l02', 'morrido'), 'stamp'); E(wt('l02', 'morrido') + .15, 'boing'); E(wt('l03', 'comigo') + .9, 'whoosh'); E(wt('l03', 'chegou') - .1, 'swish'); E(wt('l03', 'chegou') + .2, 'pop');
  // mapa
  E(SCN('mapa').t0 + .5, 'pop'); E(wt('l04', 'Ocidente'), 'wash'); E(wt('l04', 'Roma') - .1, 'pin'); E(wt('l04', 'latim') - .1, 'pop'); E(wt('l04', 'Oriente'), 'wash'); E(wt('l04', 'Constantinopla') - .1, 'pin'); E(wt('l04', 'grego') - .1, 'pop');
  E(wt('l05', 'afastando') - .6, 'slidepaper', { d: 3 }); ['língua', 'costumes', 'política'].forEach(w => E(wt('l05', w) - .15, 'pop'));
  // brigas
  for (const [sid, n] of [['quem', 1], ['filioque', 2], ['pao', 3]]) E(SCN(sid).t0 + .1, 'bell', { n });
  E(wt('l06', 'quem') - .1, 'shout'); E(wt('l06', 'autoridade') - .3, 'grow', { d: .6 }); E(wt('l06', 'Constantinopla'), 'pop'); E(wt('l06', 'primeiro') - .1, 'squash'); E(wt('l06', 'primeiro') + .4, 'pop');
  E(wt('l07', 'palavra') - .2, 'pop'); E(wt('l07', 'Credo') - .3, 'unroll'); E(wt('l07', 'procede'), 'quill'); E(wt('l07', 'Filho') - .1, 'paste'); E(wt('l07', 'Filioque') - .1, 'reveal'); E(wt('l08', 'mexer') - .1, 'shout'); E(wt('l08', 'concílio') - .2, 'seal');
  E(wt('l09', 'pão') - .2, 'pop'); E(wt('l09', 'Roma'), 'ding'); E(wt('l09', 'Constantinopla'), 'pop'); E(wt('l09', 'fermento', 1) - .1, 'puff');
  // bula
  E(wt('l10', '1054') - .3, 'tag'); E(wt('l10', 'enviados') - .3, 'steps', { d: 1.1 }); E(wt('l10', 'bula') - .05, 'slap'); E(wt('l10', 'Hagia') - .1, 'pop');
  E(wt('l11', 'patriarca') - .3, 'steps', { d: 1 }); E(wt('l11', 'excomungando') + .15, 'stamp'); E(wt('l11', 'excomungando') + .2, 'boing');
  // morto
  E(wt('l12', 'Leão') - .15, 'pop'); E(wt('l12', 'morrido') - .15, 'bellsad'); for (let i = 0; i < 3; i++) E(wt('l12', 'três') - .1 + i * .3, 'flip');
  // lento
  E(SCN('lento').t0 + .4, 'tick', { d: wt('l13', 'afastamento') + .5 - SCN('lento').t0 }); E(wt('l13', 'dia') - .2, 'pop'); E(wt('l13', 'afastamento') - .5, 'slow');
  // 1204
  E(SCN('s1204').t0, 'fire', { d: L0('l15') - SCN('s1204').t0 }); E(wt('l14', 'golpe') - .2, 'drum'); E(wt('l14', 'cruzados') - .4, 'march', { d: 1.4 }); E(L0('l15') + .15, 'tear'); E(wt('l15', 'fechar') - .3, 'peel');
  // 1965
  E(wt('l16', '1965') - .3, 'tag'); E(wt('l16', 'retiraram') - .05, 'rip'); E(wt('l16', 'retiraram') + .45, 'stamp'); E(wt('l16', '1054') + .3, 'cheer');
  // hoje
  E(wt('l17', 'católicos') - .15, 'pop'); E(wt('l17', 'ortodoxos') - .15, 'pop'); E(wt('l17', 'fé') - .3, 'bridge'); E(wt('l17', 'diferenças') - .1, 'crack');
  // ret
  E(SCN('ret').t0 + .2, 'sticker'); E(SCN('ret').t0 + .4, 'rewind', { d: wt('l18', 'Igreja') - SCN('ret').t0 }); E(wt('l18', 'Igreja') - .3, 'pop'); E(wt('l18', 'Porque') - .4, 'steps', { d: 1.2 });
  return ev.sort((a, b) => a.t - b.t);
}

(async () => {
  TL = await (await fetch('timeline.json')).json(); DUR = TL.dur; SCORD = Object.keys(TL.scenes);
  LAND = await (await fetch('data/med.json')).json(); RIGJ = await (await fetch('parts/rig.json')).json();
  const names = []; for (const k of ['ro', 'co', 'cr']) for (const id in RIGJ[k]) names.push(`${k}_${id}`);
  await Promise.all(names.map(n => new Promise((ok, no) => { const i = new Image(); i.onload = () => { IMG[n] = i; ok(); }; i.onerror = no; i.src = `parts/${n}.png`; })));
  await Promise.all(['50px FellSC', '48px Fell', 'italic 46px FellIt', '60px Lilita', '64px OldStdB', '34px OldStd'].map(f => document.fonts.load(f, 'AÃÉÍÓÇáãéíóç0123456789')));
  const av = new Image(); av.src = 'brand/avatar.jpg'; await av.decode().catch(() => {}); AV = av.naturalWidth ? av : null;
  TEX = makePaper(512, 512, 3); LAYER = canvas(W, H); SCV = [canvas(W, H), canvas(W, H)];
  SEA = bakeSea(); PWn = bakePiece(WPOLY, C.land, 11); PEn = bakePiece(EPOLY, C.land, 12); PW = bakePiece(WPOLY, C.west, 11); PE = bakePiece(EPOLY, C.east, 12);
  window.DUR = DUR; window.render = render; window.EV = buildEvents();
  window.TEXTS = t => { render(t); return TX.map(o => ({ ...o })); };
  render(Q.get('t') ? +Q.get('t') : 0); window.READY = true;
})();
