/* Bismillah Studio : tout tourne autour du perso en cours.
 * On choisit un perso, un calque, une variante, et on dessine. Les tirages (variantes, poids, couleurs)
 * se règlent au même endroit. La rue et le cortège montrent le résultat. */
(() => {
'use strict';
const $ = s => document.querySelector(s);
const S = window.TenebresSprites, PAL = window.TENEBRES_PALETTE;
const clone = o => JSON.parse(JSON.stringify(o));
const esc = t => String(t).replace(/[&<>"]/g, c => ({ '&':'&amp;', '<':'&lt;', '>':'&gt;', '"':'&quot;' }[c]));
const KEY = 'bismillah-studio-v2', OLD_KEY = 'bismillah-studio-v1';
const store = {
  get(k){ try { return JSON.parse(localStorage.getItem(k)); } catch(e){ return null; } },
  set(k, v){ try { localStorage.setItem(k, JSON.stringify(v)); } catch(e){} },
  del(k){ try { localStorage.removeItem(k); } catch(e){} }
};
const reduceMotion = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
const REFS = Object.keys(PAL.rampes).flatMap(r => PAL.rampes[r].map((_, i) => r + '.' + i));
const REF = /^[a-z]+\.\d+$/;
const CHARS = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789#@%&*+=?';

/* ============ Données ============ */
const FILE = clone(window.TENEBRES_SPRITES);
const valide = d => d && d.cadre && Array.isArray(d.pieces) && Array.isArray(d.types) && Array.isArray(d.calques) && Array.isArray(d.canaux) && Array.isArray(d.poses);
const local = store.get(KEY);
let D = valide(local) && local.version === FILE.version ? local : clone(FILE);
let rev = 1; D.rev = rev;
const bump = () => { D.rev = ++rev; };
function gcLegende(p){
  const used = new Set();
  for (const k in p.poses) for (const im of p.poses[k]) for (const r of im) for (const c of r) used.add(c);
  for (const c in p.legende) if (!used.has(c)) delete p.legende[c];
}
const nettoye = d => { const c = clone(d); delete c.rev; c.pieces.forEach(gcLegende); return c; };

const E = { type: 'manifestant', calque: 'corps', piece: 'haut', pose: D.poses[0].id, img: 0, outil: 'crayon', encre: 'haut', miroir: false, seed: 7, ajout: null };
const T = () => S.typeComplet(D, E.type);
const typeBrut = () => D.types.find(t => t.id === E.type);
const piece = () => E.piece ? S.piece(D, E.piece) : null;
const variantes = (c, Tc) => ((Tc || T()).calques[c] || []);
function premierePiece(c){ const v = variantes(c).find(x => x.piece && S.piece(D, x.piece)); return v ? v.piece : null; }
function verifierSelection(){
  if (!D.types.some(t => t.id === E.type)) E.type = D.types[0].id;
  if (!D.calques.some(c => c.id === E.calque)) E.calque = D.calques[0].id;
  if (!E.piece || !variantes(E.calque).some(x => x.piece === E.piece)) E.piece = premierePiece(E.calque);
  if (!D.poses.some(p => p.id === E.pose)){ E.pose = D.poses[0].id; E.img = 0; }
}
verifierSelection();

/* ============ Sauvegarde, annuler, refaire ============ */
let saveT = 0;
function changed(){
  bump(); verifierSelection();
  clearTimeout(saveT); saveT = setTimeout(() => store.set(KEY, nettoye(D)), 250);
  renderAll();
}
const undo = [], redo = [];
const etat = () => JSON.stringify({ D: nettoye(D), E: { type: E.type, calque: E.calque, piece: E.piece, img: E.img } });
function snap(){ undo.push(etat()); if (undo.length > 100) undo.shift(); redo.length = 0; }
function restaurer(s){ const o = JSON.parse(s); D = o.D; Object.assign(E, o.E); changed(); }
function annuler(){ if (!undo.length){ flash('Rien à annuler.'); return; } redo.push(etat()); restaurer(undo.pop()); }
function refaire(){ if (!redo.length){ flash('Rien à refaire.'); return; } undo.push(etat()); restaurer(redo.pop()); }
function muter(fn){ snap(); fn(); changed(); }

/* ============ Mannequin : le perso en cours, avec la pièce qu'on dessine ============ */
function premierePool(k){
  for (const t of D.types){ const l = S.typeComplet(D, t.id).canaux[k]; if (l && l.length) return l[0]; }
  return 'gris.8';
}
function mannequin(type, seed){
  type = type || E.type;
  const ind = S.tirer(D, type, S.hasard(seed == null ? E.seed : seed));
  if (type === E.type){ ind.pieces[E.calque] = E.piece; S.contraindre(D, ind, E.calque); }
  for (const c of D.canaux) if (!ind.couleurs[c.id]) ind.couleurs[c.id] = premierePool(c.id);
  return ind;
}
const decor = k => S.couleur(PAL.decor[k]);

/* ============ Lecture / écriture des pixels ============ */
const vide = () => Array.from({ length: D.cadre.h }, () => '.'.repeat(D.cadre.l));
function lireImage(p, n){
  const l = p.poses[E.pose];
  if (l && l.length) return l[n] || l[0];
  return S.image(p, E.pose, n) || vide();
}
const aImagePropre = (p, n) => !!(p.poses[E.pose] && p.poses[E.pose][n]);
function ecrireImage(p, n, rows){
  const l = p.poses[E.pose] = p.poses[E.pose] || [];
  while (l.length < n) l.push(clone(l[0] || lireImage(p, 0)));
  l[n] = rows;
}
const lireCase = (p, rows, x, y) => { const ch = (rows[y] || '')[x]; return !ch || ch === '.' ? null : (p.legende[ch] ?? null); };
function charPour(p, v){
  if (v == null) return '.';
  for (const c in p.legende) if (p.legende[c] === v) return c;
  const used = new Set(Object.keys(p.legende));
  const pref = !REF.test(v) ? v[0] : null;
  const c = pref && !used.has(pref) ? pref : [...CHARS].find(c => !used.has(c));
  p.legende[c] = v; return c;
}
function ecrireCases(p, pts, v){
  const rows = lireImage(p, E.img).slice(), c = charPour(p, v);
  let touche = false;
  for (const [x, y] of pts){
    if (x < 0 || y < 0 || x >= D.cadre.l || y >= D.cadre.h || rows[y][x] === c) continue;
    rows[y] = rows[y].slice(0, x) + c + rows[y].slice(x + 1); touche = true;
  }
  if (touche) ecrireImage(p, E.img, rows);
  return touche;
}

/* ============ Icônes pixel ============ */
const INK = '#f3efe3';
const ICONES = {
  crayon: [['........pp', '.......ppp', '......mmp.', '.....ymm..', '....yyy...', '...yyy....', '..yyy.....', '.wyy......', 'gww.......', 'g.........'], { p:'#ef8fa0', m:'#aeb2b8', y:'#f2c14e', w:'#e8c99a', g:'#3a3b42' }],
  gomme: [['..........', '.....pppp.', '....ppppP.', '...ppppP..', '..wwwwP...', '.wwwwW....', '.wwwW.....', '.WWW......'], { p:'#ef8fa0', P:'#b85b6c', w:'#cfe1f5', W:'#8aa8c9' }],
  pipette: [['.......rr.', '......rrrr', '......rrrr', '.....mmrr.', '....wwm...', '...wbw....', '..wbw.....', '.wbw......', '.bw.......', 'b.........'], { r:'#ef4f45', m:'#aeb2b8', w:'#cfe1f5', b:'#2f7bff' }],
  pot: [['...mmmm...', '..m....m..', '.bbbbbbbb.', '.gGGGGGGgb', '.gGGGGGGgb', '..gGGGGg.b', '..gGGGGg..', '..gggggg..'], { m:'#aeb2b8', b:'#2f7bff', g:'#6d737d', G:'#aeb2b8' }],
  miroir: [['....o....', 'b.......w', 'bb..o..ww', 'bbb...www', 'bb..o..ww', 'b.......w', '....o....'], { o:INK, b:'#2f7bff', w:'#aeb2b8' }],
  annuler: [['..........', '..o.......', '.oo.......', 'oooooooo..', '.oo.....o.', '..o......o', '.........o', '........o.', '...oooooo.'], { o:INK }],
  copier: [['oooooo....', 'o....o....', 'o..aaaaaa.', 'o..a....a.', 'oooa....a.', '...a....a.', '...a....a.', '...aaaaaa.'], { o:'#7c828b', a:INK }],
  vider: [['...oooo...', 'oooooooooo', '.o......o.', '.o.o..o.o.', '.o.o..o.o.', '.o.o..o.o.', '.o.o..o.o.', '.o......o.', '.oooooooo.'], { o:'#ef4f45' }],
  gauche: [['...o.....', '..oo.....', '.oooooooo', 'ooooooooo', '.oooooooo', '..oo.....', '...o.....'], { o:INK }]
};
const inverse = px => px.map(r => [...r].reverse().join(''));
const transpose = px => Array.from({ length: Math.max(...px.map(r => r.length)) }, (_, x) => px.map(r => r[x] || '.').join(''));
ICONES.refaire = [inverse(ICONES.annuler[0]), ICONES.annuler[1]];
ICONES.droite = [inverse(ICONES.gauche[0]), ICONES.gauche[1]];
ICONES.haut = [transpose(ICONES.gauche[0]), ICONES.gauche[1]];
ICONES.bas = [transpose(ICONES.gauche[0]).slice().reverse(), ICONES.gauche[1]];
function icone(nom){
  const [px, col] = ICONES[nom], w = Math.max(...px.map(r => r.length));
  const cv = document.createElement('canvas'); cv.width = 10; cv.height = 10;
  const g = cv.getContext('2d'), ox = Math.floor((10 - w) / 2), oy = Math.floor((10 - px.length) / 2);
  px.forEach((r, y) => [...r].forEach((c, x) => { if (col[c]){ g.fillStyle = col[c]; g.fillRect(ox + x, oy + y, 1, 1); } }));
  return cv;
}

/* ============ Barre d'outils ============ */
const OUTILS = [
  ['crayon', 'Crayon (B)'], ['gomme', 'Gomme (E)'], ['pipette', 'Pipette (I)'], ['pot', 'Pot de peinture (G)'],
  ['miroir', 'Miroir : dessine des deux côtés (M)'], ['vider', 'Vider cette image'],
  ['annuler', 'Annuler (Ctrl+Z)'], ['refaire', 'Refaire (Ctrl+Maj+Z)'],
  ['copier', 'Recopier l\'image A ici'], null,
  ['gauche', 'Décaler à gauche (←)'], ['droite', 'Décaler à droite (→)'], ['haut', 'Décaler en haut (↑)'], ['bas', 'Décaler en bas (↓)']
];
const tb = $('#toolbar');
tb.style.gridTemplateColumns = 'repeat(2,40px)';
for (const o of OUTILS){
  if (!o){ tb.appendChild(document.createElement('span')); continue; }
  const b = document.createElement('button'); b.type = 'button'; b.className = 'tool'; b.dataset.t = o[0]; b.title = o[1]; b.setAttribute('aria-label', o[1]);
  b.appendChild(icone(o[0])); tb.appendChild(b);
}
function majOutils(){ tb.querySelectorAll('.tool').forEach(b => { const t = b.dataset.t; if (['crayon', 'gomme', 'pipette', 'pot'].includes(t)) b.setAttribute('aria-pressed', String(E.outil === t)); if (t === 'miroir') b.setAttribute('aria-pressed', String(E.miroir)); }); }
function setOutil(k){ E.outil = k; majOutils(); }
tb.addEventListener('click', e => {
  const b = e.target.closest('.tool'); if (!b) return;
  const t = b.dataset.t, p = piece();
  if (['crayon', 'gomme', 'pipette', 'pot'].includes(t)) setOutil(t);
  else if (t === 'miroir'){ E.miroir = !E.miroir; majOutils(); drawGrid(); }
  else if (t === 'annuler') annuler();
  else if (t === 'refaire') refaire();
  else if (t === 'vider'){ if (p) muter(() => ecrireImage(p, E.img, vide())); }
  else if (t === 'copier'){ if (p && E.img > 0) muter(() => ecrireImage(p, E.img, lireImage(p, 0).slice())); else flash('Tu es déjà sur l\'image A.'); }
  else decaler(...{ gauche: [-1, 0], droite: [1, 0], haut: [0, -1], bas: [0, 1] }[t]);
});
function decaler(dx, dy){
  const p = piece(); if (!p) return;
  const src = lireImage(p, E.img), L = D.cadre.l, H = D.cadre.h;
  muter(() => ecrireImage(p, E.img, Array.from({ length: H }, (_, y) => Array.from({ length: L }, (_, x) => { const sx = x - dx, sy = y - dy; return sx < 0 || sy < 0 || sx >= L || sy >= H ? '.' : src[sy][sx]; }).join(''))));
}

/* ============ Grille ============ */
const grid = $('#grid'), gctx = grid.getContext('2d'), CELL = 32;
const ghost = document.createElement('canvas'); ghost.width = D.cadre.l; ghost.height = D.cadre.h;
const gg = ghost.getContext('2d');
let hover = null;
function voile(fn, alpha){
  gg.clearRect(0, 0, ghost.width, ghost.height); fn(gg);
  gctx.globalAlpha = alpha; gctx.drawImage(ghost, 0, 0, grid.width, grid.height); gctx.globalAlpha = 1;
}
const seule = (p, rows) => ({ legende: p.legende, poses: { x: [rows] } });
function drawGrid(){
  const p = piece(), L = D.cadre.l, H = D.cadre.h;
  gctx.imageSmoothingEnabled = false;
  const a = decor('bitume'), b = S.couleur(S.decale(PAL.decor.bitume, 1));
  for (let y = 0; y < H; y++) for (let x = 0; x < L; x++){ gctx.fillStyle = (x + y) % 2 ? a : b; gctx.fillRect(x * CELL, y * CELL, CELL, CELL); }
  const mq = mannequin();
  voile(g => S.peindre(g, D, mq, E.pose, E.img, [E.calque], E.calque), .4);
  if (p){
    const autre = E.img === 0 ? 1 : 0;
    if (autre < S.nbImages(D, E.pose) && aImagePropre(p, Math.max(E.img, autre))) voile(g => S.peindrePiece(g, seule(p, lireImage(p, autre)), 'x', 0, mq.couleurs, 0, 0), .25);
    voile(g => S.peindrePiece(g, seule(p, lireImage(p, E.img)), 'x', 0, mq.couleurs, 0, 0), 1);
  }
  gctx.strokeStyle = 'rgba(255,255,255,.08)'; gctx.lineWidth = 1;
  for (let x = 1; x < L; x++){ gctx.beginPath(); gctx.moveTo(x * CELL + .5, 0); gctx.lineTo(x * CELL + .5, H * CELL); gctx.stroke(); }
  for (let y = 1; y < H; y++){ gctx.beginPath(); gctx.moveTo(0, y * CELL + .5); gctx.lineTo(L * CELL, y * CELL + .5); gctx.stroke(); }
  if (E.miroir){ gctx.strokeStyle = 'rgba(47,123,255,.6)'; gctx.setLineDash([3, 5]); gctx.beginPath(); gctx.moveTo(L * CELL / 2, 0); gctx.lineTo(L * CELL / 2, H * CELL); gctx.stroke(); gctx.setLineDash([]); }
  gctx.setLineDash([5, 4]); gctx.strokeStyle = 'rgba(224,162,74,.7)'; gctx.lineWidth = 2;
  gctx.strokeRect(2 * CELL + 1, 4 * CELL + 1, 5 * CELL - 2, 7 * CELL - 2); gctx.setLineDash([]);
  const [px, py] = D.cadre.pied;
  gctx.strokeStyle = 'rgba(138,242,162,.8)'; gctx.lineWidth = 2; gctx.beginPath();
  gctx.moveTo(px * CELL + 10, (py + 1) * CELL - 6); gctx.lineTo((px + 1) * CELL - 10, (py + 1) * CELL - 6);
  gctx.moveTo(px * CELL + CELL / 2, (py + 1) * CELL - 12); gctx.lineTo(px * CELL + CELL / 2, (py + 1) * CELL); gctx.stroke();
  if (hover && p){
    gctx.strokeStyle = '#fff'; gctx.lineWidth = 2; gctx.strokeRect(hover[0] * CELL + 1, hover[1] * CELL + 1, CELL - 2, CELL - 2);
    if (E.miroir){ gctx.strokeStyle = 'rgba(255,255,255,.4)'; gctx.strokeRect((L - 1 - hover[0]) * CELL + 1, hover[1] * CELL + 1, CELL - 2, CELL - 2); }
  }
  const vid = $('#gridEmpty');
  vid.hidden = !!p;
  if (!p){
    const c = D.calques.find(x => x.id === E.calque);
    vid.textContent = variantes(E.calque).length ? `Variante « Rien » sélectionnée : ce perso n'a parfois rien dans le calque ${c ? c.nom : ''}. Choisis une autre variante pour dessiner.` : `${T().nom} n'a rien dans le calque ${c ? c.nom : ''}. Ajoute une variante à gauche pour dessiner.`;
  }
}
function caseSous(e){
  const r = grid.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / r.width * D.cadre.l), y = Math.floor((e.clientY - r.top) / r.height * D.cadre.h);
  return x >= 0 && y >= 0 && x < D.cadre.l && y < D.cadre.h ? [x, y] : null;
}
const avecMiroir = pts => E.miroir ? pts.concat(pts.map(([x, y]) => [D.cadre.l - 1 - x, y])) : pts;
function remplir(p, x, y){
  const rows = lireImage(p, E.img), cible = lireCase(p, rows, x, y);
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
let trait = false, touche = false;
function appliquer(c){
  const p = piece(); if (!p || !c) return;
  if (E.outil === 'pipette'){
    const v = lireCase(p, lireImage(p, E.img), c[0], c[1]);
    if (v){ E.encre = v; setOutil('crayon'); renderCouleurs(); }
    return;
  }
  let pts, v;
  if (E.outil === 'pot'){ pts = remplir(p, c[0], c[1]); if (E.miroir) pts = pts.concat(remplir(p, D.cadre.l - 1 - c[0], c[1])); v = E.encre; }
  else { pts = avecMiroir([c]); v = E.outil === 'gomme' ? null : E.encre; }
  if (ecrireCases(p, pts, v)){ touche = true; bump(); drawGrid(); }
}
grid.addEventListener('pointerdown', e => {
  const c = caseSous(e); if (!c || !piece()) return;
  e.preventDefault(); grid.setPointerCapture(e.pointerId);
  if (E.outil === 'pipette'){ appliquer(c); return; }
  snap(); touche = false; trait = E.outil !== 'pot';
  appliquer(c);
  if (!trait) finir();
});
grid.addEventListener('pointermove', e => {
  const c = caseSous(e);
  if (String(c) !== String(hover)){ hover = c; drawGrid(); }
  if (trait && c) appliquer(c);
});
function finir(){ trait = false; if (touche) changed(); else undo.pop(); }
grid.addEventListener('pointerup', () => { if (trait) finir(); });
grid.addEventListener('pointercancel', () => { if (trait) finir(); });
grid.addEventListener('pointerleave', () => { hover = null; drawGrid(); });

/* ============ Clavier ============ */
document.addEventListener('keydown', e => {
  const tg = e.target;
  const saisie = tg.tagName === 'TEXTAREA' || tg.tagName === 'SELECT' || (tg.tagName === 'INPUT' && /^(text|number|search)$/.test(tg.type));
  const mod = e.ctrlKey || e.metaKey, k = e.key.toLowerCase();
  if (mod && (k === 'z' || k === 'y') && !saisie){ e.preventDefault(); (k === 'y' || e.shiftKey) ? refaire() : annuler(); return; }
  if (saisie || mod || e.altKey) return;
  if (e.key === 'Escape'){ E.ajout = null; $('#fileMenu').open = false; renderCouleurs(); return; }
  const map = { b: 'crayon', e: 'gomme', i: 'pipette', g: 'pot' };
  if (map[k]){ setOutil(map[k]); return; }
  if (k === 'm'){ E.miroir = !E.miroir; majOutils(); drawGrid(); return; }
  const fl = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[e.key];
  if (fl && piece()){ e.preventDefault(); decaler(fl[0], fl[1]); }
});

/* ============ Persos ============ */
const persoCanvases = [];
function renderPersos(){
  const box = $('#persos'); box.innerHTML = ''; persoCanvases.length = 0;
  for (const t of D.types){
    const b = document.createElement('button'); b.type = 'button'; b.className = 'perso'; b.setAttribute('aria-pressed', String(t.id === E.type));
    const cv = document.createElement('canvas'); cv.width = 11; cv.height = 12; b.appendChild(cv);
    persoCanvases.push({ cv, type: t.id });
    b.insertAdjacentHTML('beforeend', `<span>${esc(t.nom)}</span>`);
    b.onclick = () => choisirType(t.id);
    box.appendChild(b);
  }
}
function choisirType(id, seed){
  E.type = id; if (seed != null) E.seed = seed;
  E.piece = premierePiece(E.calque); E.img = 0; E.ajout = null;
  renderAll();
}

/* ============ Calques et variantes ============ */
function propreCalque(k){ const t = typeBrut(); t.calques = t.calques || {}; if (!(k in t.calques)) t.calques[k] = clone(variantes(k)); return t.calques[k]; }
function propreCanal(k){ const t = typeBrut(); t.canaux = t.canaux || {}; if (!(k in t.canaux)) t.canaux[k] = clone(T().canaux[k] || []); return t.canaux[k]; }
function mini(p, couleurs){
  const cv = document.createElement('canvas'); cv.width = D.cadre.l; cv.height = D.cadre.h;
  S.peindrePiece(cv.getContext('2d'), p, E.pose, 0, couleurs, 0, 0);
  return cv;
}
const usages = id => D.types.filter(t => Object.values(t.calques || {}).some(l => l.some(x => x.piece === id)));
function renderCalques(){
  const box = $('#calques'), Tc = T(), t = typeBrut(), parent = t.herite && D.types.find(x => x.id === t.herite);
  const mq = mannequin(), caches = S.masques(D, mq, E.calque);
  box.innerHTML = '';
  for (const c of D.calques){
    const list = variantes(c.id, Tc), own = t.calques && c.id in t.calques;
    const tot = list.reduce((s, x) => s + Math.max(0, +x.poids || 0), 0);
    const div = document.createElement('div'); div.className = 'calque' + (c.id === E.calque ? ' on' : '');
    let tag = '';
    if (caches.has(c.id)){ const qui = D.calques.map(k => mq.pieces[k.id] && S.piece(D, mq.pieces[k.id])).find(p => p && p.masque && p.masque.includes(c.id)); tag = `<small>caché par ${esc(qui ? qui.nom : '?')}</small>`; }
    else if (parent) tag = own ? `<button type="button" class="link" data-herite="${c.id}" title="Reprendre les variantes de ${esc(parent.nom)}">↺ comme ${esc(parent.nom)}</button>` : `<small>comme ${esc(parent.nom)}</small>`;
    div.innerHTML = `<div class="calque-head" data-cal="${c.id}"><b>${esc(c.nom)}</b>${tag}</div><div class="variantes"></div>
      <div class="calque-foot"><select class="add" data-add="${c.id}" aria-label="Ajouter une variante au calque ${esc(c.nom)}"></select></div>`;
    const vb = div.querySelector('.variantes');
    list.forEach((x, i) => {
      const p = x.piece && S.piece(D, x.piece);
      const row = document.createElement('div');
      row.className = 'var' + (c.id === E.calque && x.piece === E.piece && (x.piece || !E.piece) ? ' sel' : '');
      row.dataset.cal = c.id; row.dataset.piece = x.piece || '';
      row.appendChild(p ? mini(p, mq.couleurs) : Object.assign(document.createElement('span'), { className: 'rien' }));
      row.insertAdjacentHTML('beforeend', `<span class="nm">${esc(p ? p.nom : x.piece ? x.piece + ' ?' : 'Rien')}</span>
        <span class="pct" title="Probabilité">${tot ? Math.round((Math.max(0, +x.poids || 0)) / tot * 100) : 0} %</span>
        <span><input type="number" min="0" max="99" step="1" value="${x.poids}" data-cal="${c.id}" data-i="${i}" title="Poids : plus il est grand, plus cette variante sort souvent" aria-label="Poids"><button type="button" class="x" data-cal="${c.id}" data-del="${i}" title="Retirer de ce perso" aria-label="Retirer">×</button></span>`);
      vb.appendChild(row);
    });
    if (!list.length) vb.innerHTML = '<span class="frame-note">Rien dans ce calque.</span>';
    const sel = div.querySelector('select');
    const opts = [['', '+ Ajouter une variante…']];
    if (!list.some(x => !x.piece)) opts.push(['__rien', 'Rien (parfois sans pièce)']);
    for (const p of D.pieces) if (p.calque === c.id && !list.some(x => x.piece === p.id)) opts.push([p.id, p.nom]);
    opts.push(['__new', 'Nouvelle pièce…']);
    sel.innerHTML = opts.map(([v, n]) => `<option value="${esc(v)}">${esc(n)}</option>`).join('');
    box.appendChild(div);
  }
}
$('#calques').addEventListener('click', e => {
  if (e.target.closest('input')) return;
  const del = e.target.closest('[data-del]'), her = e.target.closest('[data-herite]');
  if (del){ muter(() => propreCalque(del.dataset.cal).splice(+del.dataset.del, 1)); return; }
  if (her){ muter(() => { delete typeBrut().calques[her.dataset.herite]; }); return; }
  const v = e.target.closest('.var');
  if (v){ E.calque = v.dataset.cal; E.piece = v.dataset.piece || null; E.img = 0; renderAll(); return; }
  const h = e.target.closest('.calque-head');
  if (h){ E.calque = h.dataset.cal; E.piece = premierePiece(E.calque); E.img = 0; renderAll(); }
});
$('#calques').addEventListener('change', e => {
  const el = e.target;
  if (el.dataset.add){
    const cal = el.dataset.add, v = el.value; el.value = '';
    if (!v) return;
    if (v === '__new'){ nouvellePiece(cal); return; }
    muter(() => { propreCalque(cal).push({ piece: v === '__rien' ? null : v, poids: 1 }); if (v !== '__rien'){ E.calque = cal; E.piece = v; } });
    return;
  }
  if (el.dataset.i !== undefined){ const n = Math.max(0, Math.min(99, Math.round(+el.value || 0))); muter(() => { propreCalque(el.dataset.cal)[+el.dataset.i].poids = n; }); }
});

/* ============ Pièce en cours ============ */
const slug = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || 'piece';
function idLibre(base){ let id = slug(base), i = 2; while (S.piece(D, id)) id = slug(base) + '_' + i++; return id; }
function nouvellePiece(cal){
  const nom = (prompt('Nom de la nouvelle pièce', '') || '').trim(); if (!nom) return;
  muter(() => {
    const p = { id: idLibre(nom), nom, calque: cal, legende: {}, poses: { [D.poses[0].id]: [vide()] } };
    D.pieces.push(p); propreCalque(cal).push({ piece: p.id, poids: 1 });
    E.calque = cal; E.piece = p.id; E.img = 0;
  });
}
function renderPieceBar(){
  const p = piece(), others = p ? usages(p.id).filter(t => t.id !== E.type) : [];
  $('#pieceNom').innerHTML = p ? esc(p.nom) + (others.length ? ` <span class="frame-note">· aussi chez ${others.map(t => esc(t.nom)).join(', ')}</span>` : '') : '<span class="frame-note">Aucune pièce</span>';
  document.querySelector('.piece-actions').hidden = !p;
}
$('#pRen').onclick = () => { const p = piece(); if (!p) return; const nom = (prompt('Nouveau nom', p.nom) || '').trim(); if (nom) muter(() => { p.nom = nom; }); };
$('#pDup').onclick = () => {
  const s = piece(); if (!s) return;
  const nom = (prompt('Nom de la copie', s.nom + ' bis') || '').trim(); if (!nom) return;
  muter(() => {
    const p = clone(s); p.nom = nom; p.id = idLibre(nom);
    D.pieces.splice(D.pieces.indexOf(s) + 1, 0, p);
    propreCalque(s.calque).push({ piece: p.id, poids: 1 }); E.piece = p.id;
  });
  flash('Copie ajoutée à ' + T().nom + '. Tu peux retirer l\'originale de ce perso si tu veux les remplacer.');
};
$('#pDel').onclick = () => {
  const p = piece(); if (!p) return;
  const u = usages(p.id);
  if (!confirm(`Supprimer complètement la pièce « ${p.nom} » ?` + (u.length ? `\nElle sera retirée de : ${u.map(t => t.nom).join(', ')}.` : '') + '\n(Pour la retirer seulement de ce perso, utilise le × à côté de la variante.)')) return;
  muter(() => {
    D.pieces = D.pieces.filter(x => x !== p);
    for (const t of D.types) for (const k in t.calques || {}) t.calques[k] = t.calques[k].filter(x => x.piece !== p.id);
    for (const q of D.pieces) if (q.impose) for (const k in q.impose) if (q.impose[k] === p.id) delete q.impose[k];
    E.piece = null;
  });
};
function renderImages(){
  const items = [];
  for (const po of D.poses){ const n = Math.max(1, po.images | 0); for (let i = 0; i < n; i++) items.push([po.id + ':' + i, n > 1 ? po.nom + ' ' + String.fromCharCode(65 + i) : po.nom]); }
  const box = $('#segImage');
  box.innerHTML = items.map(([k, n]) => `<button type="button" data-k="${k}" aria-pressed="${k === E.pose + ':' + E.img}">${esc(n)}</button>`).join('');
  box.onclick = e => { const b = e.target.closest('button[data-k]'); if (!b) return; const [po, i] = b.dataset.k.split(':'); E.pose = po; E.img = +i; renderAll(); };
  const p = piece();
  $('#frameNote').textContent = p && E.img > 0 && !aImagePropre(p, E.img) ? 'Identique à A tant que tu n\'y dessines pas.' : '';
}
function renderOpts(){
  const p = piece(), box = $('#pieceOpts'); box.hidden = !p; if (!p) return;
  const bras = D.pieces.filter(x => x.calque === 'bras');
  const imp = (p.impose && p.impose.bras) || '';
  $('#optImpose').innerHTML = [['', 'Non']].concat(bras.map(b => [b.id, b.nom])).map(([v, n]) => `<option value="${esc(v)}"${v === imp ? ' selected' : ''}>${esc(n)}</option>`).join('');
  $('#optImpose').disabled = p.calque === 'bras';
  $('#optMasque').innerHTML = D.calques.filter(c => c.id !== p.calque).map(c => `<label><input type="checkbox" value="${c.id}"${(p.masque || []).includes(c.id) ? ' checked' : ''}> ${esc(c.nom)}</label>`).join('');
  const resume = [imp && 'impose ' + (S.piece(D, imp) || {}).nom, p.masque && p.masque.length && 'cache ' + p.masque.map(k => (D.calques.find(c => c.id === k) || {}).nom).join(', ')].filter(Boolean);
  box.querySelector('summary').textContent = 'Effets de la pièce' + (resume.length ? ' : ' + resume.join(', ') : '');
}
$('#optImpose').onchange = e => { const p = piece(); if (!p) return; muter(() => { const v = e.target.value; if (v) p.impose = Object.assign({}, p.impose, { bras: v }); else if (p.impose){ delete p.impose.bras; if (!Object.keys(p.impose).length) delete p.impose; } }); };
$('#optMasque').onchange = () => { const p = piece(); if (!p) return; const l = [...document.querySelectorAll('#optMasque input:checked')].map(i => i.value); muter(() => { if (l.length) p.masque = l; else delete p.masque; }); };

/* ============ Couleurs ============ */
function canauxUtilises(){
  const s = new Set(), Tc = T();
  const voir = p => { for (const c in p.legende){ const v = p.legende[c]; if (!REF.test(v)) s.add(v.replace(/[+-]$/, '')); } };
  for (const k in Tc.calques) for (const x of Tc.calques[k]){ const p = x.piece && S.piece(D, x.piece); if (p) voir(p); }
  for (const q of D.pieces) if (q.calque === 'bras') voir(q);
  const p = piece(); if (p) voir(p);
  return D.canaux.filter(c => s.has(c.id));
}
function nomEncre(v){
  if (!v) return 'aucune';
  if (REF.test(v)) return v + (PAL.reservees[v] ? ' (réservée : ' + PAL.reservees[v] + ')' : '');
  const m = /^([a-z_]+)([+-]?)$/.exec(v); const c = D.canaux.find(x => x.id === m[1]);
  return (c ? c.nom : m[1]) + (m[2] === '-' ? ', ombre' : m[2] === '+' ? ', lumière' : '');
}
function renderCouleurs(){
  const mq = mannequin(), Tc = T(), t = typeBrut(), parent = t.herite && D.types.find(x => x.id === t.herite);
  const cs = canauxUtilises();
  $('#canaux').innerHTML = cs.map(c => {
    const base = mq.couleurs[c.id], own = t.canaux && c.id in t.canaux, pool = Tc.canaux[c.id] || [];
    const ink = (suf, ref, nm) => `<button type="button" class="sw ink" data-encre="${c.id}${suf}" aria-pressed="${E.encre === c.id + suf}" title="Encre : ${esc(c.nom)}, ${nm}" style="background:${S.couleur(ref)}"></button>`;
    const sub = parent ? (own ? `<small><button type="button" class="link" data-heritec="${c.id}">↺ comme ${esc(parent.nom)}</button></small>` : `<small>comme ${esc(parent.nom)}</small>`) : '';
    return `<div class="canal${E.ajout === c.id ? ' adding' : ''}">
      <span class="trio">${ink('-', S.decale(base, -PAL.ombre), 'ombre')}${ink('', base, 'base')}${ink('+', S.decale(base, PAL.lumiere), 'lumière')}</span>
      <span class="nm">${esc(c.nom)}${sub}</span>
      <span class="pool">${pool.map((r, i) => `<button type="button" class="sw" data-canal="${c.id}" data-del="${i}" title="${r} : retirer de ${esc(Tc.nom)}" style="background:${S.couleur(r)}"></button>`).join('') || '<span class="frame-note">aucune</span>'}</span>
      <button type="button" class="plus" data-ajout="${c.id}" aria-pressed="${E.ajout === c.id}" title="Ajouter des couleurs possibles pour ${esc(c.nom)}">+</button>
    </div>`;
  }).join('');
  const ban = $('#addBanner'), c = D.canaux.find(x => x.id === E.ajout);
  ban.hidden = !c;
  if (c) ban.textContent = `Clique des couleurs pour les ajouter au canal ${c.nom} de ${Tc.nom}. Échap ou + pour finir.`;
  const pool = c ? (Tc.canaux[c.id] || []) : [];
  document.querySelectorAll('#palette button').forEach(b => { b.setAttribute('aria-pressed', String(!c && b.dataset.ref === E.encre)); b.classList.toggle('in', pool.includes(b.dataset.ref)); });
  $('#encreNom').textContent = nomEncre(E.encre);
  $('#encreSw').style.background = E.encre ? S.couleur(S.resoudre(E.encre, mq.couleurs)) : 'transparent';
}
$('#canaux').addEventListener('click', e => {
  const ink = e.target.closest('[data-encre]'), del = e.target.closest('[data-del]'), add = e.target.closest('[data-ajout]'), her = e.target.closest('[data-heritec]');
  if (ink){ E.encre = ink.dataset.encre; if (E.outil !== 'pot') setOutil('crayon'); renderCouleurs(); }
  else if (del){ muter(() => propreCanal(del.dataset.canal).splice(+del.dataset.del, 1)); }
  else if (add){ E.ajout = E.ajout === add.dataset.ajout ? null : add.dataset.ajout; renderCouleurs(); }
  else if (her){ muter(() => { delete typeBrut().canaux[her.dataset.heritec]; }); }
});
$('#palette').innerHTML = REFS.map(r => `<button type="button" data-ref="${r}" title="${r}${PAL.reservees[r] ? ' · réservée : ' + esc(PAL.reservees[r]) : ''}" class="${PAL.reservees[r] ? 'res' : ''}" style="background:${S.couleur(r)}"></button>`).join('');
$('#palette').onclick = e => {
  const b = e.target.closest('[data-ref]'); if (!b) return;
  const ref = b.dataset.ref;
  if (E.ajout){
    const res = PAL.reservees[ref];
    muter(() => propreCanal(E.ajout).push(ref));
    flash(res ? `Ajoutée, mais ${ref} est réservée (${res}) : ce rôle sera moins facile à repérer.` : `${ref} ajoutée.`, !!res);
    return;
  }
  E.encre = ref; if (E.outil !== 'pot') setOutil('crayon'); renderCouleurs();
};

/* ============ Aperçu ============ */
const prev = $('#preview'), pctx = prev.getContext('2d');
function drawPreview(t){
  const mq = mannequin(), n = S.nbImages(D, E.pose), f = Math.floor(t * 4) % n;
  pctx.fillStyle = decor('bitume'); pctx.fillRect(0, 0, prev.width, prev.height);
  S.dessiner(pctx, D, mq, E.pose, f, 9, 12, { miroir: true });
  S.dessiner(pctx, D, mq, E.pose, (f + 1) % n, 21, 12);
}
$('#mqTirer').onclick = () => { E.seed = (Math.random() * 1e9) | 0; renderAll(); };

/* ============ La rue ============ */
const scene = $('#scene'), sctx = scene.getContext('2d');
const CS = 12, SW = scene.width, SH = scene.height;
let foule = [], pause = false, zoom = 'plein', sceneSeed = 3;
const sceneBg = document.createElement('canvas'); sceneBg.width = SW; sceneBg.height = SH;
(function peindreRue(){
  const g = sceneBg.getContext('2d'), R = S.hasard(99);
  g.fillStyle = decor('bitume'); g.fillRect(0, 0, SW, SH);
  for (let i = 0; i < SW * SH * 0.06; i++){ g.fillStyle = S.couleur(PAL.decor.bitumeGrain[R() < .5 ? 0 : 1]); g.fillRect((R() * SW) | 0, (R() * SH) | 0, 1, 1); }
  for (const y0 of [0, SH - CS]){
    g.fillStyle = decor('trottoir'); g.fillRect(0, y0, SW, CS);
    g.fillStyle = decor('dalle'); for (let x = 0; x < SW; x += CS) g.fillRect(x, y0, 1, CS); g.fillRect(0, y0 + CS / 2, SW, 1);
  }
  g.fillStyle = decor('bordure'); g.fillRect(0, CS - 1, SW, 1); g.fillRect(0, SH - CS, SW, 1);
  g.fillStyle = decor('marquage'); for (let x = 2; x < SW; x += CS) g.fillRect(x, SH / 2, CS / 2, 1);
})();
const existe = id => D.types.some(t => t.id === id);
function peupler(){
  const R = S.hasard(sceneSeed), nF = +$('#nFoule').value, nM = +$('#nMedic').value, nC = +$('#nCrs').value;
  const centres = {};
  const zone = () => [(0.4 + R() * 10) * CS, (1.6 + R() * 4.6) * CS];
  foule = S.composer(D, nF, R).map(m => {
    let [x, y] = zone();
    if (m.paquet){ const c = centres[m.paquet] = centres[m.paquet] || zone(); x = c[0] + (R() - .5) * CS * 1.6; y = Math.min(6.2 * CS, Math.max(1.6 * CS, c[1] + (R() - .5) * CS * 1.4)); }
    return { ind: S.tirer(D, m.type, R), bx: x, by: y, ph: R() * 6.28, sp: .7 + R() * .6, miroir: true, foule: true };
  });
  if (existe('medic')) for (let i = 0; i < nM; i++){ const [x, y] = zone(); foule.push({ ind: S.tirer(D, 'medic', R), bx: x, by: y, ph: R() * 6.28, sp: .7 + R() * .6, miroir: true, foule: true }); }
  if (existe('crs_bouclier')) for (let i = 0; i < nC; i++) foule.push({ ind: S.tirer(D, 'crs_bouclier', R), bx: 11.6 * CS, by: (1.7 + (nC > 1 ? i * 4.6 / (nC - 1) : 2.3)) * CS, ph: R() * 6.28, sp: 1 });
  if (nC && existe('crs_matraque')) for (const f of [.3, .72]) foule.push({ ind: S.tirer(D, 'crs_matraque', R), bx: 13 * CS, by: (1.7 + f * 4.6) * CS, ph: R() * 6.28, sp: 1 });
}
function drawScene(t){
  sctx.drawImage(sceneBg, 0, 0);
  const n = S.nbImages(D, 'marche');
  foule.map(a => ({ a,
    x: a.foule ? a.bx + Math.sin(t * .6 * a.sp + a.ph) * CS * .25 : a.bx + Math.sin(t * .4 + a.ph) * 1.2,
    y: a.foule ? a.by + Math.sin(t * .9 + a.ph) * CS * .06 : a.by,
    f: Math.floor(t * (a.foule ? 4 * a.sp : 1.5) + a.ph) % n
  })).sort((p, q) => p.y - q.y).forEach(it => S.dessiner(sctx, D, it.a.ind, 'marche', it.f, it.x, it.y, { miroir: it.a.miroir }));
}
function appliquerZoom(){
  const w = $('#sceneWrap').clientWidth - 6;
  const z = zoom === 'jeu' ? 2 : zoom === 'plein' ? Math.max(2, Math.floor(w / SW)) : +zoom;
  scene.style.width = (SW * z) + 'px';
}
function zoomSeg(){
  const box = $('#segZoom');
  box.innerHTML = [['jeu', 'Taille jeu'], ['3', '×3'], ['plein', 'Plein']].map(([k, n]) => `<button type="button" data-k="${k}" aria-pressed="${k === zoom}">${n}</button>`).join('');
  box.onclick = e => { const b = e.target.closest('button[data-k]'); if (b){ zoom = b.dataset.k; zoomSeg(); appliquerZoom(); } };
}
zoomSeg();
window.addEventListener('resize', appliquerZoom);
$('#sceneTirer').onclick = () => { sceneSeed = (Math.random() * 1e9) | 0; peupler(); };
$('#scenePause').onclick = () => { pause = !pause; $('#scenePause').textContent = pause ? 'Reprendre' : 'Pause'; };
for (const [id, v] of [['#nFoule', '#vFoule'], ['#nMedic', '#vMedic'], ['#nCrs', '#vCrs']]){
  const el = $(id), out = $(v);
  const maj = () => { out.textContent = el.value; el.style.setProperty('--pct', (el.value - el.min) / (el.max - el.min) * 100 + '%'); };
  el.addEventListener('input', () => { maj(); peupler(); }); maj();
}
function renderCompo(){
  const F = D.foule || { reste: 'manifestant', groupes: [] }, reste = D.types.find(t => t.id === F.reste);
  $('#compo').innerHTML = `<div class="compo-row"><span class="lab">Composition de la foule</span></div>`
    + (F.groupes || []).map((g, i) => `<div class="compo-row"><span>${esc(g.nom)}${g.paquet ? ` <small>par ${g.paquet[0]} à ${g.paquet[1]}</small>` : ''}</span><span>1 sur <input type="number" min="1" max="9999" step="1" value="${g.un_sur}" data-g="${i}" aria-label="Fréquence : un sur combien"></span></div>`).join('')
    + `<div class="compo-row"><span>${esc(reste ? reste.nom : F.reste)}</span><small>tout le reste</small></div>`;
}
$('#compo').addEventListener('change', e => {
  const i = e.target.dataset.g; if (i === undefined) return;
  const n = Math.max(1, Math.round(+e.target.value || 1));
  muter(() => { D.foule.groupes[+i].un_sur = n; }); peupler();
});

/* ============ Le cortège ============ */
let deck = [];
function tirerDeck(){
  const types = D.types.map(t => t.id).concat(['manifestant', 'manifestant', 'manifestant'].filter(existe));
  deck = types.map(type => ({ type, seed: (Math.random() * 1e9) | 0, rot: (Math.random() * 4 - 2).toFixed(1) }));
  renderDeck();
}
function renderDeck(){
  const box = $('#deck'); box.innerHTML = '';
  deck = deck.filter(c => existe(c.type));
  for (const c of deck){
    c.ind = mannequin(c.type, c.seed);
    const b = document.createElement('button'); b.type = 'button'; b.className = 'card'; b.style.setProperty('--rot', c.rot + 'deg');
    b.setAttribute('aria-pressed', String(c.type === E.type && c.seed === E.seed));
    b.title = 'Modifier ce perso avec ces couleurs';
    const cv = document.createElement('canvas'); cv.width = 11; cv.height = 12; c.cv = cv; b.appendChild(cv);
    const Tt = D.types.find(t => t.id === c.type);
    b.insertAdjacentHTML('beforeend', `<span class="nm">${esc(Tt ? Tt.nom : c.type)}</span>`);
    b.onclick = () => choisirType(c.type, c.seed);
    box.appendChild(b);
  }
}
function vignette(cv, ind, t, miroir){
  const g = cv.getContext('2d'), n = S.nbImages(D, 'marche');
  g.fillStyle = decor('bitume'); g.fillRect(0, 0, cv.width, cv.height);
  S.dessiner(g, D, ind, 'marche', Math.floor(t) % n, 5, 10, { miroir });
}

/* ============ Fichier ============ */
let flashT = 0;
function flash(txt, err){
  const el = $('#fileMsg'); el.textContent = txt; el.classList.toggle('err', !!err);
  clearTimeout(flashT); flashT = setTimeout(() => { el.textContent = ''; }, 4500);
}
function fileState(){
  const same = JSON.stringify(nettoye(D)) === JSON.stringify(nettoye(FILE));
  const el = $('#fileState');
  el.textContent = same ? 'Identique au fichier du repo' : 'Modifié, pas encore exporté';
  el.classList.toggle('mod', !same);
}
function telecharger(nom, txt){
  const a = document.createElement('a');
  a.href = URL.createObjectURL(new Blob([txt], { type: 'text/javascript' }));
  a.download = nom; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 2000);
}
$('#fDown').onclick = () => { telecharger('sprites.js', S.exporter(nettoye(D))); flash('sprites.js téléchargé : remplace data/sprites.js dans le repo.'); };
$('#fCopy').onclick = async () => {
  $('#fileMenu').open = false;
  try { await navigator.clipboard.writeText(S.exporter(nettoye(D))); flash('Contenu de sprites.js copié.'); }
  catch(e){ flash('Le presse-papier est bloqué ici. Utilise le téléchargement.', true); }
};
$('#fImport').onclick = () => { $('#fileMenu').open = false; $('#importBox').hidden = false; $('#fIn').focus(); };
$('#fCancel').onclick = () => { $('#importBox').hidden = true; };
$('#fLoad').onclick = () => {
  let txt = $('#fIn').value.trim();
  const i = txt.indexOf('TENEBRES_SPRITES');
  if (i >= 0) txt = txt.slice(txt.indexOf('{', i)).replace(/;\s*$/, '');
  try {
    const d = JSON.parse(txt);
    if (!valide(d)) throw new Error('format');
    muter(() => { D = d; });
    $('#fIn').value = ''; $('#importBox').hidden = true; peupler();
    flash('Fichier chargé. Ctrl+Z pour revenir en arrière.');
  } catch(e){ flash('Je ne reconnais pas ce contenu. Colle tout le fichier sprites.js, ou son JSON.', true); }
};
$('#fReset').onclick = () => {
  $('#fileMenu').open = false;
  if (!confirm('Revenir au fichier du repo ? Tes modifications locales disparaissent (Ctrl+Z reste possible tant que la page est ouverte).')) return;
  muter(() => { D = clone(FILE); }); store.del(KEY); peupler(); flash('Revenu au fichier du repo.');
};
const ancien = store.get(OLD_KEY);
if (valide(ancien)){ $('#fOld').hidden = false; $('#fOld').onclick = () => { $('#fileMenu').open = false; telecharger('sprites-ancien-brouillon.js', S.exporter(ancien)); }; }

/* ============ Habillage ============ */
$('#logo').innerHTML = [...'Bismillah'].map((c, i) => `<span style="--i:${i}">${c}</span>`).join('') + '<span class="studio-badge">Studio</span>';
const crt = $('#crtToggle');
crt.onchange = () => { document.body.classList.toggle('crt-on', crt.checked); store.set(KEY + '-crt', crt.checked); };
if (store.get(KEY + '-crt') === false){ crt.checked = false; document.body.classList.remove('crt-on'); }
document.addEventListener('click', e => { const m = $('#fileMenu'); if (m.open && !m.contains(e.target)) m.open = false; });
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
  for (const [cx, col] of [[6, on ? '#2f7bff' : '#ef4f45'], [90, on ? '#ef4f45' : '#2f7bff']])
    for (let r = 14; r > 0; r -= 2){ bctx.globalAlpha = .045; bctx.fillStyle = col; bctx.fillRect(cx - r, 0, r * 2, r); }
  bctx.globalAlpha = 1;
}

/* ============ Boucle ============ */
function renderAll(){
  renderPersos(); renderCalques(); renderPieceBar(); renderImages(); renderOpts(); renderCouleurs(); majOutils(); drawGrid(); renderCompo(); renderDeck(); fileState();
}
let last = 0, bgLast = -1, sceneT = 0, peuplerRev = rev;
function loop(ms){
  const t = ms / 1000, dt = Math.min(.1, t - last); last = t;
  if (!pause && !reduceMotion) sceneT += dt;
  drawScene(sceneT);
  const ta = reduceMotion ? 0 : t;
  drawPreview(ta);
  for (const c of deck) if (c.cv) vignette(c.cv, c.ind, ta * 3 + c.seed % 7, c.type.indexOf('crs') !== 0);
  for (const p of persoCanvases){ p.ind = p.ind && p.rev === rev ? p.ind : Object.assign(mannequin(p.type, p.type === E.type ? E.seed : 11), {}); p.rev = rev; vignette(p.cv, p.ind, ta * 3, p.type.indexOf('crs') !== 0); }
  if (t - bgLast > .1){ drawBg(t); bgLast = t; }
  requestAnimationFrame(loop);
}
peupler(); tirerDeck(); renderAll(); appliquerZoom();
// La rue se re-tire quand les données changent (sans changer la graine), pour voir l'effet des réglages.
setInterval(() => { if (peuplerRev !== rev){ peuplerRev = rev; peupler(); } }, 600);
requestAnimationFrame(loop);
})();
