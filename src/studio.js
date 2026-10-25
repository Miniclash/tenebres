/* Bismillah Studio : atelier de pièces, tirages et aperçu de foule au-dessus de src/sprites.js. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const S = window.TenebresSprites, PAL = window.TENEBRES_PALETTE;
const clone = o => JSON.parse(JSON.stringify(o));
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const KEY = 'bismillah-studio-v1';
const store = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} },
  del(k){ try { localStorage.removeItem(k); } catch(e){} }
};
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const RAMPES = Object.keys(PAL.rampes);
const REFS = RAMPES.flatMap(r => PAL.rampes[r].map((_, i) => r + '.' + i));
const REF = /^[a-z]+\.\d+$/;
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&*+=?';

/* ============ Données ============ */
const FILE = clone(window.TENEBRES_SPRITES);
const valide = d => d && d.cadre && Array.isArray(d.pieces) && Array.isArray(d.types) && Array.isArray(d.calques) && Array.isArray(d.canaux) && Array.isArray(d.poses);
const nettoye = d => { const c = clone(d); delete c.rev; c.pieces.forEach(gcLegende); return c; };
let D = valide(store.get(KEY)) ? store.get(KEY) : clone(FILE);
D.rev = 1;

const E = {
  calque: 'corps', piece: 'haut', pose: D.poses[0].id, img: 0,
  outil: 'crayon', encre: 'haut', miroir: false, mannequin: true, pelure: true,
  mqType: 'manifestant', mqSeed: 7, type: 'manifestant', canal: 'haut'
};
if (!S.piece(D, E.piece)){ const p = D.pieces[0]; if (p){ E.piece = p.id; E.calque = p.calque; } }

let saveT = 0;
function changed(light){
  D.rev++;
  if (light){ drawGrid(); return; }
  clearTimeout(saveT); saveT = setTimeout(() => { store.set(KEY, nettoye(D)); fileState(); }, 300);
  renderAll();
}

/* ============ Pièces : lecture / écriture ============ */
const vide = () => Array.from({ length: D.cadre.h }, () => '.'.repeat(D.cadre.l));
const piece = () => S.piece(D, E.piece);
function lireImage(p, pose, n){
  const l = p.poses[pose];
  if (l && l.length) return l[n] || l[0];
  return S.image(p, pose, n) || vide();
}
function aImagePropre(p, pose, n){ const l = p.poses[pose]; return !!(l && l[n]); }
function ecrireImage(p, pose, n, rows){
  const l = p.poses[pose] = p.poses[pose] || [];
  while (l.length < n) l.push(clone(l[0] || lireImage(p, pose, 0)));
  l[n] = rows;
}
function lireCase(p, rows, x, y){ const ch = (rows[y] || '')[x]; return !ch || ch === '.' ? null : (p.legende[ch] ?? null); }
function charPour(p, v){
  if (v == null) return '.';
  for (const c in p.legende) if (p.legende[c] === v) return c;
  const used = new Set(Object.keys(p.legende));
  const pref = /^[a-z]/.test(v) ? v[0] : 'x';
  const c = !used.has(pref) && v.length && !REF.test(v) ? pref : [...CHARS].find(c => !used.has(c));
  p.legende[c] = v; return c;
}
function gcLegende(p){
  const used = new Set();
  for (const k in p.poses) for (const im of p.poses[k]) for (const r of im) for (const c of r) used.add(c);
  for (const c in p.legende) if (!used.has(c)) delete p.legende[c];
}
function ecrireCases(p, pts, v){
  const rows = lireImage(p, E.pose, E.img).slice(), c = charPour(p, v);
  let touche = false;
  for (const [x, y] of pts){
    if (x < 0 || y < 0 || x >= D.cadre.l || y >= D.cadre.h) continue;
    if (rows[y][x] === c) continue;
    rows[y] = rows[y].slice(0, x) + c + rows[y].slice(x + 1); touche = true;
  }
  if (touche || !aImagePropre(p, E.pose, E.img)) ecrireImage(p, E.pose, E.img, rows);
  return touche;
}

/* ============ Annuler ============ */
const undo = [];
function snap(){
  const p = piece(); if (!p) return;
  undo.push({ id: p.id, poses: clone(p.poses), legende: clone(p.legende) });
  if (undo.length > 80) undo.shift();
}
function annuler(){
  const u = undo.pop(); if (!u) return;
  const p = S.piece(D, u.id); if (!p) return;
  p.poses = u.poses; p.legende = u.legende;
  if (E.piece !== p.id){ E.piece = p.id; E.calque = p.calque; }
  changed();
}

/* ============ Mannequin ============ */
function premierePool(k){
  for (const t of D.types){ const T = S.typeComplet(D, t.id); if (T.canaux[k] && T.canaux[k].length) return T.canaux[k][0]; }
  return 'gris.8';
}
function mannequin(){
  const ind = S.tirer(D, E.mqType, S.hasard(E.mqSeed));
  const p = piece(); if (p) ind.pieces[p.calque] = p.id;
  for (const c of D.canaux) if (!ind.couleurs[c.id]) ind.couleurs[c.id] = premierePool(c.id);
  return ind;
}
function typeUtilisant(id){
  for (const t of D.types){ const T = S.typeComplet(D, t.id); for (const k in T.calques) if (T.calques[k].some(x => x.piece === id)) return t.id; }
  return null;
}
const decor = k => S.couleur(PAL.decor[k]);

/* ============ Grille ============ */
const grid = $('#grid'), gctx = grid.getContext('2d');
const CELL = 32;
const ghost = document.createElement('canvas'); ghost.width = D.cadre.l; ghost.height = D.cadre.h;
const gg = ghost.getContext('2d');
let hover = null;
function drawGhost(fn, alpha){
  gg.clearRect(0, 0, ghost.width, ghost.height); fn(gg);
  gctx.globalAlpha = alpha; gctx.drawImage(ghost, 0, 0, grid.width, grid.height); gctx.globalAlpha = 1;
}
function drawGrid(){
  const p = piece(), L = D.cadre.l, H = D.cadre.h;
  gctx.imageSmoothingEnabled = false;
  const a = decor('bitume'), b = S.couleur(S.decale(PAL.decor.bitume, 1));
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++){ gctx.fillStyle = (x + y) % 2 ? a : b; gctx.fillRect(x * CELL, y * CELL, CELL, CELL); }
  if (!p) return;
  const mq = mannequin();
  if (E.mannequin) drawGhost(g => { for (const c of D.calques){ if (c.id === p.calque) continue; const id = mq.pieces[c.id]; const q = id && S.piece(D, id); if (q) S.peindrePiece(g, q, E.pose, E.img, mq.couleurs, 0, 0); } }, .38);
  if (E.pelure){
    const autre = E.img === 0 ? 1 : 0, n = S.nbImages(D, E.pose);
    if (autre < n && aImagePropre(p, E.pose, Math.max(E.img, autre))) drawGhost(g => S.peindrePiece(g, { legende: p.legende, poses: { x: [lireImage(p, E.pose, autre)] } }, 'x', 0, mq.couleurs, 0, 0), .28);
  }
  drawGhost(g => S.peindrePiece(g, { legende: p.legende, poses: { x: [lireImage(p, E.pose, E.img)] } }, 'x', 0, mq.couleurs, 0, 0), 1);
  gctx.strokeStyle = 'rgba(255,255,255,.08)'; gctx.lineWidth = 1;
  for (let x = 1; x < L; x++){ gctx.beginPath(); gctx.moveTo(x * CELL + .5, 0); gctx.lineTo(x * CELL + .5, H * CELL); gctx.stroke(); }
  for (let y = 1; y < H; y++){ gctx.beginPath(); gctx.moveTo(0, y * CELL + .5); gctx.lineTo(L * CELL, y * CELL + .5); gctx.stroke(); }
  gctx.setLineDash([5, 4]); gctx.strokeStyle = 'rgba(224,162,74,.75)'; gctx.lineWidth = 2;
  gctx.strokeRect(2 * CELL + 1, 4 * CELL + 1, 5 * CELL - 2, 7 * CELL - 2); gctx.setLineDash([]);
  const [px, py] = D.cadre.pied;
  gctx.strokeStyle = 'rgba(138,242,162,.8)'; gctx.lineWidth = 2; gctx.beginPath();
  gctx.moveTo(px * CELL + 10, (py + 1) * CELL - 6); gctx.lineTo((px + 1) * CELL - 10, (py + 1) * CELL - 6);
  gctx.moveTo(px * CELL + CELL / 2, (py + 1) * CELL - 12); gctx.lineTo(px * CELL + CELL / 2, (py + 1) * CELL); gctx.stroke();
  if (hover){
    gctx.strokeStyle = '#fff'; gctx.lineWidth = 2; gctx.strokeRect(hover[0] * CELL + 1, hover[1] * CELL + 1, CELL - 2, CELL - 2);
    if (E.miroir){ gctx.strokeStyle = 'rgba(255,255,255,.4)'; gctx.strokeRect((L - 1 - hover[0]) * CELL + 1, hover[1] * CELL + 1, CELL - 2, CELL - 2); }
  }
}
function caseSous(e){
  const r = grid.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / r.width * D.cadre.l), y = Math.floor((e.clientY - r.top) / r.height * D.cadre.h);
  return x >= 0 && y >= 0 && x < D.cadre.l && y < D.cadre.h ? [x, y] : null;
}
const miroirDe = pts => E.miroir ? pts.concat(pts.map(([x, y]) => [D.cadre.l - 1 - x, y])) : pts;
function remplir(p, x, y){
  const rows = lireImage(p, E.pose, E.img), cible = lireCase(p, rows, x, y);
  if (cible === E.encre) return [];
  const seen = new Set(), pile = [[x, y]], out = [];
  while (pile.length){
    const [cx, cy] = pile.pop(), k = cx + ',' + cy;
    if (seen.has(k) || cx < 0 || cy < 0 || cx >= D.cadre.l || cy >= D.cadre.h) continue;
    seen.add(k);
    if (lireCase(p, rows, cx, cy) !== cible) continue;
    out.push([cx, cy]); pile.push([cx + 1, cy], [cx - 1, cy], [cx, cy + 1], [cx, cy - 1]);
  }
  return out;
}
let drawing = false, strokeTouched = false;
function appliquer(c){
  const p = piece(); if (!p || !c) return;
  if (E.outil === 'pipette'){
    const v = lireCase(p, lireImage(p, E.pose, E.img), c[0], c[1]);
    if (v){ E.encre = v; setOutil('crayon'); renderEncre(); }
    return;
  }
  let pts, v;
  if (E.outil === 'remplir'){ pts = remplir(p, c[0], c[1]); if (E.miroir) pts = pts.concat(remplir(p, D.cadre.l - 1 - c[0], c[1])); v = E.encre; }
  else { pts = miroirDe([c]); v = E.outil === 'gomme' ? null : E.encre; }
  if (ecrireCases(p, pts, v)){ strokeTouched = true; changed(true); }
}
grid.addEventListener('pointerdown', e => {
  const c = caseSous(e); if (!c) return;
  e.preventDefault(); grid.setPointerCapture(e.pointerId);
  snap(); drawing = E.outil === 'crayon' || E.outil === 'gomme'; strokeTouched = false;
  const avant = E.outil;
  appliquer(c);
  if (avant === 'pipette') { undo.pop(); return; }
  if (!drawing){ if (strokeTouched) changed(); else undo.pop(); }
});
grid.addEventListener('pointermove', e => {
  const c = caseSous(e);
  if (String(c) !== String(hover)){ hover = c; drawGrid(); }
  if (drawing && c) appliquer(c);
});
const finTrait = () => { if (!drawing) return; drawing = false; if (strokeTouched) changed(); else undo.pop(); };
grid.addEventListener('pointerup', finTrait);
grid.addEventListener('pointercancel', finTrait);
grid.addEventListener('pointerleave', () => { hover = null; drawGrid(); });

/* ============ Outils ============ */
const OUTILS = [['crayon', 'Crayon', 'B'], ['gomme', 'Gomme', 'E'], ['pipette', 'Pipette', 'I'], ['remplir', 'Remplir', 'G']];
$('#tools').innerHTML = OUTILS.map(([k, n, s]) => `<button class="tool" data-outil="${k}" title="${n} (${s})">${n}</button>`).join('');
function setOutil(k){ E.outil = k; document.querySelectorAll('[data-outil]').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.outil === k))); }
$('#tools').addEventListener('click', e => { const b = e.target.closest('[data-outil]'); if (b) setOutil(b.dataset.outil); });
setOutil('crayon');
$('#tUndo').onclick = annuler;
$('#tCopy').onclick = () => {
  const p = piece(); if (!p) return;
  if (E.img === 0) return;
  snap(); ecrireImage(p, E.pose, E.img, lireImage(p, E.pose, 0).slice()); changed();
};
$('#tClear').onclick = () => { const p = piece(); if (!p) return; snap(); ecrireImage(p, E.pose, E.img, vide()); changed(); };
function decaler(dx, dy){
  const p = piece(); if (!p) return;
  snap();
  const src = lireImage(p, E.pose, E.img), L = D.cadre.l, H = D.cadre.h;
  const rows = Array.from({ length: H }, (_, y) => Array.from({ length: L }, (_, x) => { const sx = x - dx, sy = y - dy; return sx < 0 || sy < 0 || sx >= L || sy >= H ? '.' : src[sy][sx]; }).join(''));
  ecrireImage(p, E.pose, E.img, rows); changed();
}
document.querySelectorAll('[data-shift]').forEach(b => b.onclick = () => { const [dx, dy] = b.dataset.shift.split(',').map(Number); decaler(dx, dy); });
const opt = (id, k) => { const el = $(id); el.checked = E[k]; el.onchange = () => { E[k] = el.checked; drawGrid(); }; };
opt('#optMiroir', 'miroir'); opt('#optMannequin', 'mannequin'); opt('#optPelure', 'pelure');

document.addEventListener('keydown', e => {
  if (/^(INPUT|TEXTAREA|SELECT)$/.test(e.target.tagName)) return;
  if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){ e.preventDefault(); annuler(); return; }
  if (e.ctrlKey || e.metaKey || e.altKey) return;
  const k = e.key.toLowerCase();
  const map = { b: 'crayon', e: 'gomme', i: 'pipette', g: 'remplir' };
  if (map[k]){ setOutil(map[k]); return; }
  if (k === 'm'){ E.miroir = !E.miroir; $('#optMiroir').checked = E.miroir; drawGrid(); return; }
  const fl = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (fl){ e.preventDefault(); decaler(fl[0], fl[1]); }
});

/* ============ Calques, pièces, images ============ */
function seg(el, items, cur, onPick){
  el.innerHTML = items.map(([k, n]) => `<button type="button" data-k="${esc(k)}" aria-pressed="${String(k) === String(cur)}">${esc(n)}</button>`).join('');
  el.onclick = e => { const b = e.target.closest('button[data-k]'); if (b) onPick(b.dataset.k); };
}
function renderCalques(){ seg($('#segCalque'), D.calques.map(c => [c.id, c.nom]), E.calque, k => { E.calque = k; const p = D.pieces.find(x => x.calque === k); if (p) choisirPiece(p.id); else { E.piece = null; renderAll(); } }); }
function choisirPiece(id){
  E.piece = id; const p = piece(); if (p) E.calque = p.calque;
  const t = typeUtilisant(id); if (t) E.mqType = t;
  E.img = 0; renderAll();
}
function miniPiece(p){
  const cv = document.createElement('canvas'); cv.width = D.cadre.l; cv.height = D.cadre.h;
  const mq = mannequin(); S.peindrePiece(cv.getContext('2d'), p, E.pose, 0, mq.couleurs, 0, 0);
  return cv;
}
function nbUsages(id){ return D.types.filter(t => Object.values(t.calques || {}).some(l => l.some(x => x.piece === id))).length; }
function renderPieces(){
  const box = $('#pieces'); box.innerHTML = '';
  const list = D.pieces.filter(p => p.calque === E.calque);
  if (!list.length) box.innerHTML = '<p class="pane-intro">Aucune pièce dans ce calque. Crée-en une.</p>';
  for (const p of list){
    const b = document.createElement('button'); b.type = 'button'; b.className = 'pc'; b.setAttribute('aria-pressed', String(p.id === E.piece));
    b.appendChild(miniPiece(p));
    const n = nbUsages(p.id);
    b.insertAdjacentHTML('beforeend', `<span>${esc(p.nom)}</span><span class="used">${n ? n + ' type' + (n > 1 ? 's' : '') : 'inutilisée'}</span>`);
    b.onclick = () => choisirPiece(p.id);
    box.appendChild(b);
  }
}
function renderImages(){
  const items = [];
  for (const po of D.poses){ const n = Math.max(1, po.images | 0); for (let i = 0; i < n; i++) items.push([po.id + ':' + i, n > 1 ? po.nom + ' ' + String.fromCharCode(65 + i) : po.nom]); }
  seg($('#segImage'), items, E.pose + ':' + E.img, k => { const [po, i] = k.split(':'); E.pose = po; E.img = +i; renderAll(); });
  const p = piece(), note = $('#frameNote');
  if (!p) note.textContent = '';
  else if (E.img > 0 && !aImagePropre(p, E.pose, E.img)) note.textContent = 'Reprend l\'image A tant que tu n\'y dessines pas.';
  else note.textContent = '';
}
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'piece';
function idLibre(base){ let id = slug(base), i = 2; while (S.piece(D, id)) id = slug(base) + '_' + i++; return id; }
$('#pNew').onclick = () => {
  const nom = (prompt('Nom de la nouvelle pièce', 'Nouvelle pièce') || '').trim(); if (!nom) return;
  const p = { id: idLibre(nom), nom, calque: E.calque, legende: {}, poses: { [D.poses[0].id]: [vide()] } };
  D.pieces.push(p); choisirPiece(p.id); changed();
};
$('#pDup').onclick = () => {
  const s = piece(); if (!s) return;
  const p = clone(s); p.nom = s.nom + ' (copie)'; p.id = idLibre(p.nom);
  D.pieces.splice(D.pieces.indexOf(s) + 1, 0, p); choisirPiece(p.id); changed();
};
$('#pRen').onclick = () => {
  const p = piece(); if (!p) return;
  const nom = (prompt('Nouveau nom', p.nom) || '').trim(); if (!nom) return;
  p.nom = nom; changed();
};
$('#pDel').onclick = () => {
  const p = piece(); if (!p) return;
  const n = nbUsages(p.id);
  if (!confirm(`Supprimer « ${p.nom} » ?` + (n ? ` Elle sera retirée des tirages de ${n} type${n > 1 ? 's' : ''}.` : ''))) return;
  D.pieces = D.pieces.filter(x => x !== p);
  for (const t of D.types) for (const k in t.calques || {}) t.calques[k] = t.calques[k].filter(x => x.piece !== p.id);
  const next = D.pieces.find(x => x.calque === E.calque);
  E.piece = next ? next.id : null; changed();
};

/* ============ Encre ============ */
function renderEncre(){
  const mq = mannequin(), box = $('#canaux');
  box.innerHTML = D.canaux.map(c => {
    const base = mq.couleurs[c.id];
    const sw = (suf, ref, t) => `<button type="button" class="sw" title="${esc(c.nom)} ${t}" data-encre="${c.id}${suf}" aria-pressed="${E.encre === c.id + suf}" style="background:${S.couleur(ref)}"></button>`;
    return `<div class="canal"><span class="nm">${esc(c.nom)}</span>${sw('-', S.decale(base, -PAL.ombre), 'ombre')}${sw('', base, 'base')}${sw('+', S.decale(base, PAL.lumiere), 'lumière')}</div>`;
  }).join('');
  document.querySelectorAll('#palette button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.ref === E.encre)));
  $('#encreNom').textContent = nomEncre(E.encre);
}
function nomEncre(v){
  if (!v) return 'aucune';
  if (REF.test(v)) return v + (PAL.reservees[v] ? ' (réservée : ' + PAL.reservees[v] + ')' : '');
  const m = /^([a-z_]+)([+-]?)$/.exec(v); const c = D.canaux.find(x => x.id === m[1]);
  return (c ? c.nom : m[1]) + (m[2] === '-' ? ', ombre' : m[2] === '+' ? ', lumière' : '');
}
$('#canaux').onclick = e => { const b = e.target.closest('[data-encre]'); if (!b) return; E.encre = b.dataset.encre; if (E.outil !== 'remplir') setOutil('crayon'); renderEncre(); };
function construirePalette(el, onPick){
  el.innerHTML = REFS.map(r => `<button type="button" data-ref="${r}" title="${r}${PAL.reservees[r] ? ' · réservée : ' + esc(PAL.reservees[r]) : ''}" class="${PAL.reservees[r] ? 'res' : ''}" style="background:${S.couleur(r)}"></button>`).join('');
  el.onclick = e => { const b = e.target.closest('[data-ref]'); if (b) onPick(b.dataset.ref); };
}
construirePalette($('#palette'), r => { E.encre = r; if (E.outil !== 'remplir') setOutil('crayon'); renderEncre(); });

/* ============ Aperçu animé ============ */
const prev = $('#preview'), pctx = prev.getContext('2d');
function drawPreview(t){
  const mq = mannequin(), n = S.nbImages(D, E.pose), f = Math.floor(t * 4) % n;
  pctx.fillStyle = decor('bitume'); pctx.fillRect(0, 0, prev.width, prev.height);
  S.dessiner(pctx, D, mq, E.pose, f, 8, 12, { miroir: true });
  S.dessiner(pctx, D, mq, E.pose, (f + 1) % n, 18, 12);
}
function renderMannequin(){ seg($('#segMannequin'), D.types.map(t => [t.id, t.nom]), E.mqType, k => { E.mqType = k; renderAll(); }); }
$('#mqTirer').onclick = () => { E.mqSeed = (Math.random() * 1e9) | 0; renderAll(); };

/* ============ Tirages ============ */
const typeBrut = () => D.types.find(t => t.id === E.type);
function canauxUtilises(T){
  const s = new Set();
  for (const k in T.calques) for (const x of T.calques[k]){ const p = x.piece && S.piece(D, x.piece); if (!p) continue; for (const c in p.legende){ const m = /^([a-z_]+)[+-]?$/.exec(p.legende[c]); if (m && !REF.test(p.legende[c])) s.add(m[1]); } }
  for (const k in T.canaux) if (T.canaux[k] && T.canaux[k].length) s.add(k);
  return s;
}
function renderTirages(){
  seg($('#segType'), D.types.map(t => [t.id, t.nom]), E.type, k => { E.type = k; renderTirages(); });
  const t = typeBrut(); if (!t) return;
  const T = S.typeComplet(D, t.id), parent = t.herite && D.types.find(x => x.id === t.herite);
  $('#typeNote').textContent = parent ? `Hérite de ${parent.nom} : ce qui n'est pas personnalisé ici vient de lui.` : '';
  $('#tirCalques').innerHTML = D.calques.map(c => {
    const own = t.calques && c.id in t.calques, list = T.calques[c.id] || [];
    const items = list.map((x, i) => { const p = x.piece && S.piece(D, x.piece); return `<span class="tir-item">${esc(x.piece ? (p ? p.nom : x.piece + ' ?') : 'Rien')}<input type="number" min="0" max="99" step="1" value="${x.poids}" data-cal="${c.id}" data-i="${i}" aria-label="Poids"><button type="button" class="x" data-cal="${c.id}" data-del="${i}" aria-label="Retirer">×</button></span>`; }).join('');
    const opts = [['', '+ Ajouter'], ['__rien', 'Rien']].concat(D.pieces.filter(p => p.calque === c.id && !list.some(x => x.piece === p.id)).map(p => [p.id, p.nom]));
    const add = `<select class="add" data-add="${c.id}">${opts.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join('')}</select>`;
    const tag = parent ? (own ? ` <button type="button" class="mini" data-reset="${c.id}">rétablir l'héritage</button>` : '<small>hérité</small>') : '';
    return `<div class="tir-row"><div class="nm">${esc(c.nom)}${tag}</div><div class="tir-items">${items}${add}</div></div>`;
  }).join('');
  const used = canauxUtilises(T);
  if (!used.has(E.canal)) E.canal = [...used][0] || null;
  $('#tirCanaux').innerHTML = D.canaux.filter(c => used.has(c.id)).map(c => {
    const own = t.canaux && c.id in t.canaux, list = T.canaux[c.id] || [];
    const sws = list.map((r, i) => `<button type="button" class="sw" data-canal="${c.id}" data-del="${i}" title="${r} · retirer" style="background:${S.couleur(r)}"></button>`).join('');
    const tag = parent ? (own ? ` <button type="button" class="mini" data-resetc="${c.id}">rétablir l'héritage</button>` : '<small>hérité</small>') : '';
    return `<div class="tir-row${E.canal === c.id ? ' sel' : ''}" data-sel="${c.id}"><div class="nm">${esc(c.nom)}${tag}</div><div class="tir-items">${sws || '<span class="hint" style="margin:0">Vide : magenta en jeu</span>'}</div></div>`;
  }).join('');
  const pool = E.canal ? (T.canaux[E.canal] || []) : [];
  document.querySelectorAll('#tirPalette button').forEach(b => b.setAttribute('aria-pressed', String(pool.includes(b.dataset.ref))));
}
function propreCalque(k){ const t = typeBrut(); t.calques = t.calques || {}; if (!(k in t.calques)) t.calques[k] = clone(S.typeComplet(D, t.id).calques[k] || []); return t.calques[k]; }
function propreCanal(k){ const t = typeBrut(); t.canaux = t.canaux || {}; if (!(k in t.canaux)) t.canaux[k] = clone(S.typeComplet(D, t.id).canaux[k] || []); return t.canaux[k]; }
$('#tirCalques').addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.add !== undefined){
    const v = el.value; if (!v) return;
    propreCalque(el.dataset.add).push({ piece: v === '__rien' ? null : v, poids: 1 }); changed(); return;
  }
  if (el.dataset.i !== undefined){ const l = propreCalque(el.dataset.cal); l[+el.dataset.i].poids = Math.max(0, Math.min(99, Math.round(+el.value || 0))); changed(); }
});
$('#tirCalques').addEventListener('click', e => {
  const d = e.target.closest('[data-del]'), r = e.target.closest('[data-reset]');
  if (d){ propreCalque(d.dataset.cal).splice(+d.dataset.del, 1); changed(); }
  if (r){ delete typeBrut().calques[r.dataset.reset]; changed(); }
});
$('#tirCanaux').addEventListener('click', e => {
  const d = e.target.closest('[data-del]'), r = e.target.closest('[data-resetc]'), s = e.target.closest('[data-sel]');
  if (d){ propreCanal(d.dataset.canal).splice(+d.dataset.del, 1); E.canal = d.dataset.canal; changed(); return; }
  if (r){ delete typeBrut().canaux[r.dataset.resetc]; changed(); return; }
  if (s){ E.canal = s.dataset.sel; renderTirages(); }
});
construirePalette($('#tirPalette'), ref => {
  if (!E.canal){ flash('#tirMsg', 'Choisis d\'abord un canal.', true); return; }
  propreCanal(E.canal).push(ref);
  const res = PAL.reservees[ref];
  flash('#tirMsg', res ? `Ajoutée, mais ${ref} est réservée : ${res}. La foule risque de brouiller ce rôle.` : `${ref} ajoutée.`, !!res);
  changed();
});

/* ============ La rue ============ */
const scene = $('#scene'), sctx = scene.getContext('2d');
const CS = 12, SW = scene.width, SH = scene.height;
let foule = [], pause = false, zoom = 'plein';
const sceneBg = document.createElement('canvas'); sceneBg.width = SW; sceneBg.height = SH;
(function peindreRue(){
  const g = sceneBg.getContext('2d'), R = S.hasard(99);
  g.fillStyle = decor('bitume'); g.fillRect(0, 0, SW, SH);
  for (let i = 0; i < SW * SH * 0.06; i++){ g.fillStyle = S.couleur(PAL.decor.bitumeGrain[R() < .5 ? 0 : 1]); g.fillRect((R() * SW) | 0, (R() * SH) | 0, 1, 1); }
  for (const y0 of [0, SH - CS]){
    g.fillStyle = decor('trottoir'); g.fillRect(0, y0, SW, CS);
    g.fillStyle = decor('dalle');
    for (let x = 0; x < SW; x += CS) g.fillRect(x, y0, 1, CS);
    g.fillRect(0, y0 + CS / 2, SW, 1);
  }
  g.fillStyle = decor('bordure'); g.fillRect(0, CS - 1, SW, 1); g.fillRect(0, SH - CS, SW, 1);
  g.fillStyle = decor('marquage');
  for (let x = 2; x < SW; x += CS) g.fillRect(x, SH / 2, CS / 2, 1);
})();
function peupler(seed){
  const R = S.hasard(seed), nF = +$('#nFoule').value, nM = +$('#nMedic').value, nC = +$('#nCrs').value;
  foule = [];
  const placer = (type, n) => { for (let i = 0; i < n; i++) foule.push({ ind: S.tirer(D, type, R), bx: (0.4 + R() * 10) * CS, by: (1.6 + R() * 4.6) * CS, ph: R() * 6.28, sp: .7 + R() * .6, miroir: true, foule: true }); };
  placer('manifestant', nF); placer('medic', nM);
  for (let i = 0; i < nC; i++) foule.push({ ind: S.tirer(D, 'crs_bouclier', R), bx: 11.6 * CS, by: (1.7 + (nC > 1 ? i * 4.6 / (nC - 1) : 2.3)) * CS, ph: R() * 6.28, sp: 1, miroir: false });
  if (nC) for (const f of [.3, .72]) foule.push({ ind: S.tirer(D, 'crs_matraque', R), bx: 13 * CS, by: (1.7 + f * 4.6) * CS, ph: R() * 6.28, sp: 1, miroir: false });
}
let sceneSeed = 3;
function drawScene(t){
  sctx.drawImage(sceneBg, 0, 0);
  const n = S.nbImages(D, 'marche'), items = foule.map(a => {
    const x = a.foule ? a.bx + Math.sin(t * .6 * a.sp + a.ph) * CS * .25 : a.bx + Math.sin(t * .4 + a.ph) * 1.2;
    const y = a.foule ? a.by + Math.sin(t * .9 + a.ph) * CS * .06 : a.by;
    const f = Math.floor(t * (a.foule ? 4 * a.sp : 1.5) + a.ph) % n;
    return { a, x, y, f };
  }).sort((p, q) => p.y - q.y);
  for (const it of items) S.dessiner(sctx, D, it.a.ind, 'marche', it.f, it.x, it.y, { miroir: it.a.miroir });
}
function appliquerZoom(){
  const w = $('#sceneWrap').clientWidth - 6;
  const z = zoom === 'jeu' ? 2 : zoom === 'plein' ? Math.max(2, Math.floor(w / SW)) : +zoom;
  scene.style.width = (SW * z) + 'px';
}
function zoomSeg(){ seg($('#segZoom'), [['jeu', 'Jeu'], ['3', '×3'], ['4', '×4'], ['plein', 'Plein']], zoom, k => { zoom = k; zoomSeg(); appliquerZoom(); }); }
zoomSeg();
window.addEventListener('resize', appliquerZoom);
$('#sceneTirer').onclick = () => { sceneSeed = (Math.random() * 1e9) | 0; peupler(sceneSeed); };
$('#scenePause').onclick = () => { pause = !pause; $('#scenePause').textContent = pause ? 'Reprendre' : 'Pause'; };
for (const [id, v] of [['#nFoule', '#vFoule'], ['#nMedic', '#vMedic'], ['#nCrs', '#vCrs']]){
  const el = $(id), out = $(v);
  const maj = () => { out.textContent = el.value; el.style.setProperty('--pct', (el.value - el.min) / (el.max - el.min) * 100 + '%'); };
  el.addEventListener('input', () => { maj(); peupler(sceneSeed); }); maj();
}

/* ============ Le cortège ============ */
const DECK = ['manifestant', 'manifestant', 'manifestant', 'medic', 'manifestant', 'manifestant', 'crs_bouclier', 'manifestant', 'manifestant', 'crs_matraque', 'manifestant', 'manifestant'];
let deck = [], deckSel = -1;
function tirerDeck(){
  deck = DECK.filter(t => D.types.some(x => x.id === t)).map((type, i) => { const seed = (Math.random() * 1e9) | 0; return { type, seed, ind: S.tirer(D, type, S.hasard(seed)), rot: (Math.random() * 4 - 2).toFixed(1) }; });
  deckSel = -1; renderDeck();
}
function renderDeck(){
  const box = $('#deck'); box.innerHTML = '';
  deck.forEach((c, i) => {
    c.ind = S.tirer(D, c.type, S.hasard(c.seed));
    const b = document.createElement('button'); b.type = 'button'; b.className = 'card'; b.style.setProperty('--rot', c.rot + 'deg');
    b.setAttribute('aria-pressed', String(i === deckSel));
    const cv = document.createElement('canvas'); cv.width = 11; cv.height = 12; c.cv = cv;
    b.appendChild(cv);
    const T = D.types.find(t => t.id === c.type);
    b.insertAdjacentHTML('beforeend', `<span class="nm">${esc(T ? T.nom : c.type)}</span>`);
    b.onclick = () => { deckSel = i; E.mqType = c.type; E.mqSeed = c.seed; renderAll(); };
    box.appendChild(b);
  });
}
function drawDeck(t){
  const n = S.nbImages(D, 'marche');
  for (const c of deck){
    if (!c.cv) continue;
    const g = c.cv.getContext('2d');
    g.fillStyle = decor('bitume'); g.fillRect(0, 0, 11, 12);
    S.dessiner(g, D, c.ind, 'marche', Math.floor(t * 3 + c.seed % 7) % n, 5, 10, { miroir: c.type.indexOf('crs') !== 0 });
  }
}
$('#deckTirer').onclick = tirerDeck;

/* ============ Fichier ============ */
const ENTETE = `/*
 * Sprites de Bismillah : les pièces et les tirages de la foule.
 *
 * Ce fichier se modifie à la main OU dans le studio (studio.html) :
 * dessine dans le studio, télécharge sprites.js, remplace celui-ci.
 *
 * cadre   : toutes les pièces se dessinent sur la même grille de 9 × 11 pixels.
 *           Le corps d'un manifestant occupe les colonnes 2 à 6 et les lignes 4 à 10 (5 × 7).
 *           pied = le point posé au sol, celui qui suit la position du perso dans le jeu.
 *           Les pièces sont dessinées tournées vers la gauche ; le jeu les retourne pour aller à droite.
 * poses   : les animations. Chaque pièce a des images pour chaque pose ; une seule image = immobile.
 * calques : l'ordre de dessin, du fond vers l'avant. Un perso = au plus une pièce par calque.
 * canaux  : les couleurs tirées au hasard pour chaque perso (peau, haut…).
 *
 * pieces : chaque pièce a
 *   calque  : où elle se range
 *   legende : à quoi correspond chaque lettre de la grille
 *             "haut"   → la couleur tirée pour le canal haut
 *             "haut-"  → la même, en ombre (quelques pas plus sombre dans la même rampe)
 *             "haut+"  → la même, en lumière
 *             "gris.15" → une couleur fixe de la palette (data/palette.js)
 *   poses   : pour chaque pose, la liste des images ; chaque image = 11 lignes de 9 caractères, « . » = vide.
 *
 * types : les sortes de persos.
 *   herite  : reprend un autre type, puis remplace ce qui est précisé
 *   calques : pour chaque calque, les pièces possibles et leur poids (piece: null = rien)
 *   canaux  : pour chaque canal, les couleurs possibles (répéter une couleur = plus fréquente)
 */
`;
// Écrit le JSON dans la même mise en forme que le fichier fait main, pour des diffs git lisibles.
function formatJSON(d){
  const j = JSON.stringify;
  const inline = v => Array.isArray(v) ? '[' + v.map(inline).join(', ') + ']'
    : v && typeof v === 'object' ? (Object.keys(v).length ? '{ ' + Object.entries(v).map(([k, x]) => j(k) + ': ' + inline(x)).join(', ') + ' }' : '{}')
    : j(v);
  const reste = (o, connus, ind) => Object.keys(o).filter(k => !connus.includes(k)).map(k => ',\n' + ind + j(k) + ': ' + inline(o[k])).join('');
  const liste = (l, f) => '[\n' + l.map(f).join(',\n') + '\n  ]';
  const dico = (o, ind) => { const e = Object.entries(o || {}); return e.length ? '{\n' + e.map(([k, v]) => ind + '  ' + j(k) + ': ' + inline(v)).join(',\n') + '\n' + ind + '}' : '{}'; };
  const piece = p => '    {\n      "id": ' + j(p.id) + ', "nom": ' + j(p.nom) + ', "calque": ' + j(p.calque) + ',\n'
    + '      "legende": ' + inline(p.legende || {}) + ',\n'
    + '      "poses": { ' + Object.entries(p.poses || {}).map(([k, ims]) => j(k) + ': [' + ims.map(im => '[\n' + im.map(r => '        ' + j(r)).join(',\n') + '\n      ]').join(', ') + ']').join(', ') + ' }'
    + reste(p, ['id', 'nom', 'calque', 'legende', 'poses'], '      ') + '\n    }';
  const type = t => '    {\n      "id": ' + j(t.id) + ', "nom": ' + j(t.nom) + (t.herite ? ', "herite": ' + j(t.herite) : '') + ',\n'
    + '      "calques": ' + dico(t.calques, '      ') + ',\n'
    + '      "canaux": ' + dico(t.canaux, '      ')
    + reste(t, ['id', 'nom', 'herite', 'calques', 'canaux'], '      ') + '\n    }';
  return '{\n  "version": ' + j(d.version) + ',\n  "cadre": ' + inline(d.cadre) + ',\n'
    + '  "poses": ' + liste(d.poses, x => '    ' + inline(x)) + ',\n'
    + '  "calques": ' + liste(d.calques, x => '    ' + inline(x)) + ',\n'
    + '  "canaux": ' + liste(d.canaux, x => '    ' + inline(x)) + ',\n'
    + '  "pieces": ' + liste(d.pieces, piece) + ',\n'
    + '  "types": ' + liste(d.types, type)
    + reste(d, ['version', 'cadre', 'poses', 'calques', 'canaux', 'pieces', 'types'], '  ') + '\n}';
}
const exporter = () => ENTETE + 'window.TENEBRES_SPRITES = ' + formatJSON(nettoye(D)) + ';\n';
function fileState(){
  const same = JSON.stringify(nettoye(D)) === JSON.stringify(nettoye(FILE));
  const el = $('#fileState');
  el.textContent = same ? 'Identique au fichier du repo.' : 'Modifié par rapport au fichier du repo, sauvegardé dans ce navigateur.';
  el.classList.toggle('err', !same);
}
let flashT = {};
function flash(sel, txt, err){
  const el = $(sel); el.textContent = txt; el.classList.toggle('err', !!err);
  clearTimeout(flashT[sel]); flashT[sel] = setTimeout(() => { el.textContent = ''; }, 4200);
}
$('#fDown').onclick = () => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([exporter()], { type: 'text/javascript' }));
  a.download = 'sprites.js'; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  flash('#fileMsg', 'sprites.js téléchargé. Remplace data/sprites.js dans le repo.');
};
$('#fCopy').onclick = async () => {
  try { await navigator.clipboard.writeText(exporter()); flash('#fileMsg', 'Contenu de sprites.js copié.'); }
  catch(e){ flash('#fileMsg', 'Le presse-papier est bloqué ici. Utilise le téléchargement.', true); }
};
$('#fReset').onclick = () => {
  if (!confirm('Revenir au fichier du repo ? Ton travail local sera perdu (télécharge-le avant si besoin).')) return;
  D = clone(FILE); D.rev = 1; store.del(KEY); undo.length = 0;
  if (!S.piece(D, E.piece)){ const p = D.pieces[0]; E.piece = p ? p.id : null; E.calque = p ? p.calque : E.calque; }
  changed(); peupler(sceneSeed); flash('#fileMsg', 'Revenu au fichier du repo.');
};
$('#fLoad').onclick = () => {
  let txt = $('#fIn').value.trim();
  const eq = txt.indexOf('TENEBRES_SPRITES');
  if (eq >= 0) txt = txt.slice(txt.indexOf('{', eq)).replace(/;\s*$/, '');
  try {
    const d = JSON.parse(txt);
    if (!valide(d)) throw new Error('format');
    D = d; D.rev = 1; undo.length = 0;
    const p = D.pieces[0]; E.piece = p ? p.id : null; E.calque = p ? p.calque : E.calque;
    changed(); peupler(sceneSeed); $('#fIn').value = '';
    flash('#fileMsg', 'Fichier chargé.');
  } catch(e){ flash('#fileMsg', 'Je ne reconnais pas ce contenu. Colle tout le fichier sprites.js, ou son JSON.', true); }
};

/* ============ Habillage : logo, fond, CRT ============ */
$('#logo').innerHTML = [...'Bismillah'].map((c, i) => `<span style="--i:${i}">${c}</span>`).join('') + '<span class="studio-badge">Studio</span>';
const crt = $('#crtToggle');
crt.onchange = () => { document.body.classList.toggle('crt-on', crt.checked); store.set(KEY + '-crt', crt.checked); };
if (store.get(KEY + '-crt') === false){ crt.checked = false; document.body.classList.remove('crt-on'); }
const bg = $('#bg'), bctx = bg.getContext('2d'), bgBase = document.createElement('canvas');
bgBase.width = bg.width; bgBase.height = bg.height;
(function(){
  const g = bgBase.getContext('2d'), R = S.hasard(5);
  g.fillStyle = S.couleur('bitume.1'); g.fillRect(0, 0, bg.width, bg.height);
  for (let i = 0; i < 900; i++){ g.fillStyle = S.couleur(R() < .5 ? 'bitume.0' : 'bitume.2'); g.fillRect((R() * bg.width) | 0, (R() * bg.height) | 0, 1, 1); }
  g.fillStyle = S.couleur('bitume.3'); for (let x = 3; x < bg.width; x += 8) g.fillRect(x, 40, 4, 1);
})();
function drawBg(t){
  bctx.drawImage(bgBase, 0, 0);
  const on = Math.floor(t * 1.6) % 2;
  for (const [cx, col] of [[6, on ? '#2f7bff' : '#ef4f45'], [90, on ? '#ef4f45' : '#2f7bff']]){
    for (let r = 14; r > 0; r -= 2){ bctx.globalAlpha = .045; bctx.fillStyle = col; bctx.fillRect(cx - r, 0, r * 2, r); }
  }
  bctx.globalAlpha = 1;
}

/* ============ Boucle ============ */
function renderAll(){
  renderCalques(); renderPieces(); renderImages(); renderMannequin(); renderEncre(); drawGrid(); renderTirages(); renderDeck(); fileState();
}
let last = 0, bgLast = -1, sceneT = 0;
function loop(ms){
  const t = ms / 1000, dt = Math.min(.1, t - last); last = t;
  if (!pause && !reduceMotion) sceneT += dt;
  drawScene(sceneT);
  drawPreview(reduceMotion ? 0 : t); drawDeck(reduceMotion ? 0 : t);
  if (t - bgLast > .1){ drawBg(t); bgLast = t; }
  requestAnimationFrame(loop);
}
peupler(sceneSeed); tirerDeck(); renderAll(); appliquerZoom();
requestAnimationFrame(loop);
})();
