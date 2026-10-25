/* Moteur de sprites de Bismillah : compose un perso à partir des pièces de data/sprites.js
 * et des couleurs de data/palette.js. Partagé par le studio et (bientôt) le jeu.
 *   const ind = TenebresSprites.tirer(DATA, 'manifestant', TenebresSprites.hasard(42));
 *   TenebresSprites.dessiner(ctx, DATA, ind, 'marche', image, x, y, { miroir:true });
 * x, y = le pied du perso, en pixels natifs. */
(function (root) {
'use strict';
const PAL = () => root.TENEBRES_PALETTE;
const REF = /^([a-z]+)\.(\d+)$/;

function couleur(ref){
  const m = REF.exec(ref || ''); if (!m) return '#ff00ff';
  const r = PAL().rampes[m[1]]; return r ? r[Math.min(15, +m[2])] : '#ff00ff';
}
function decale(ref, d){
  const m = REF.exec(ref || ''); if (!m) return ref;
  return m[1] + '.' + Math.max(0, Math.min(15, +m[2] + d));
}
// Valeur de légende → couleur « rampe.pas ». Les canaux absents sortent en magenta pour se voir.
function resoudre(val, couleurs){
  if (REF.test(val)) return val;
  const m = /^([a-z_]+)([+-]?)$/.exec(val || '');
  if (!m) return 'rose.10';
  const base = couleurs && couleurs[m[1]];
  if (!base) return 'rose.10';
  if (m[2] === '-') return decale(base, -PAL().ombre);
  if (m[2] === '+') return decale(base, PAL().lumiere);
  return base;
}
function hasard(seed){
  let a = (seed >>> 0) || 1;
  return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
const piece = (D, id) => D.pieces.find(p => p.id === id) || null;
function typeComplet(D, id, vus){
  const t = D.types.find(x => x.id === id); if (!t) return null;
  vus = vus || [];
  const parent = t.herite && !vus.includes(t.herite) ? typeComplet(D, t.herite, vus.concat(id)) : null;
  return {
    id: t.id, nom: t.nom,
    calques: Object.assign({}, parent ? parent.calques : {}, t.calques || {}),
    canaux: Object.assign({}, parent ? parent.canaux : {}, t.canaux || {})
  };
}
function choisir(liste, rnd){
  const tot = liste.reduce((s, x) => s + Math.max(0, +x.poids || 0), 0);
  if (!tot) return null;
  let r = rnd() * tot;
  for (const x of liste){ r -= Math.max(0, +x.poids || 0); if (r < 0) return x.piece; }
  return liste[liste.length - 1].piece;
}
function tirer(D, typeId, rnd){
  const T = typeComplet(D, typeId); rnd = rnd || Math.random;
  const ind = { type: typeId, pieces: {}, couleurs: {} };
  if (!T) return ind;
  for (const c of D.calques){ const l = T.calques[c.id]; ind.pieces[c.id] = l && l.length ? choisir(l, rnd) : null; }
  for (const k in T.canaux){ const l = T.canaux[k]; if (l && l.length) ind.couleurs[k] = l[Math.floor(rnd() * l.length)]; }
  return ind;
}
// Image d'une pièce pour une pose : retombe sur la première image, puis sur la première pose.
function image(p, pose, n){
  const poses = p.poses || {};
  const l = poses[pose] || poses[Object.keys(poses)[0]] || [];
  return l[n] || l[0] || null;
}
function peindrePiece(g, p, pose, n, couleurs, ox, oy){
  const lignes = image(p, pose, n); if (!lignes) return;
  const leg = p.legende || {};
  for (let y = 0; y < lignes.length; y++){
    const row = lignes[y];
    for (let x = 0; x < row.length; x++){
      const ch = row[x]; if (ch === '.' || !(ch in leg)) continue;
      g.fillStyle = couleur(resoudre(leg[ch], couleurs));
      g.fillRect(ox + x, oy + y, 1, 1);
    }
  }
}
function cle(ind){ return JSON.stringify([ind.pieces, ind.couleurs]); }
// Rend le perso dans un petit canvas mis en cache sur l'individu (vidé si D.rev change).
function rendre(D, ind, pose, n){
  const k = (D.rev || 0) + '|' + pose + '|' + n + '|' + cle(ind);
  ind._cache = ind._cache || {};
  if (ind._cache[k]) return ind._cache[k];
  if (Object.keys(ind._cache).length > 24) ind._cache = {};
  const cv = document.createElement('canvas'); cv.width = D.cadre.l; cv.height = D.cadre.h;
  const g = cv.getContext('2d');
  for (const c of D.calques){
    const id = ind.pieces[c.id]; if (!id) continue;
    const p = piece(D, id); if (p) peindrePiece(g, p, pose, n, ind.couleurs, 0, 0);
  }
  ind._cache[k] = cv;
  return cv;
}
function nbImages(D, pose){ const p = D.poses.find(x => x.id === pose); return p ? Math.max(1, p.images | 0) : 1; }
function dessiner(ctx, D, ind, pose, n, x, y, opt){
  opt = opt || {};
  const cv = rendre(D, ind, pose, n), [px, py] = D.cadre.pied;
  x = Math.round(x); y = Math.round(y);
  if (opt.ombre !== false){ ctx.fillStyle = 'rgba(0,0,0,.32)'; ctx.fillRect(x - 2, y, 5, 1); }
  if (opt.miroir){
    ctx.save(); ctx.translate(x + px + 1, y - py); ctx.scale(-1, 1); ctx.drawImage(cv, 0, 0); ctx.restore();
  } else ctx.drawImage(cv, x - px, y - py);
}

root.TenebresSprites = { couleur, decale, resoudre, hasard, piece, typeComplet, tirer, image, peindrePiece, rendre, dessiner, nbImages };
})(typeof window !== 'undefined' ? window : globalThis);
