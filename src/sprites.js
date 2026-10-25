/* Moteur de sprites de Bismillah : compose un perso à partir des pièces de data/sprites.js
 * et des couleurs de data/palette.js. Partagé par le studio et (bientôt) le jeu.
 *   const ind = TenebresSprites.tirer(DATA, 'manifestant', TenebresSprites.hasard(42));
 *   TenebresSprites.dessiner(ctx, DATA, ind, 'marche', image, x, y, { miroir:true });
 *   const foule = TenebresSprites.composer(DATA, 200, rnd);   // [{ type, paquet }]
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
    id: t.id, nom: t.nom, parent: parent ? parent.id : null,
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
// Une pièce peut imposer une pièce d'un autre calque (la pancarte impose les bras levés).
// garder : un calque à ne pas toucher (celui qu'on dessine dans le studio).
function contraindre(D, ind, garder){
  for (const c of D.calques){
    const p = ind.pieces[c.id] && piece(D, ind.pieces[c.id]);
    if (!p || !p.impose) continue;
    for (const k in p.impose) if (k !== garder && k !== c.id) ind.pieces[k] = p.impose[k];
  }
  return ind;
}
// Calques cachés par une pièce (un costume de banane cache la tête et les bras).
function masques(D, ind, garder){
  const s = new Set();
  for (const c of D.calques){
    const p = ind.pieces[c.id] && piece(D, ind.pieces[c.id]);
    if (p && p.masque) for (const k of p.masque) if (k !== garder) s.add(k);
  }
  return s;
}
function tirer(D, typeId, rnd){
  const T = typeComplet(D, typeId); rnd = rnd || Math.random;
  const ind = { type: typeId, pieces: {}, couleurs: {} };
  if (!T) return ind;
  for (const c of D.calques){ const l = T.calques[c.id]; ind.pieces[c.id] = l && l.length ? choisir(l, rnd) : null; }
  for (const k in T.canaux){ const l = T.canaux[k]; if (l && l.length) ind.couleurs[k] = l[Math.floor(rnd() * l.length)]; }
  return contraindre(D, ind);
}
// Composition de la foule : D.foule.reste remplit, chaque groupe prend « 1 sur N ».
// Les groupes à paquet arrivent en grappes (paquet: [min, max]).
function composer(D, n, rnd){
  rnd = rnd || Math.random;
  const F = D.foule || { reste: 'manifestant', groupes: [] }, out = [];
  let paquet = 0;
  for (const g of F.groupes || []){
    const types = (g.types || []).filter(t => D.types.some(x => x.id === t));
    if (!types.length || !(g.un_sur > 0)) continue;
    let k = Math.floor(n / g.un_sur + rnd());
    if (g.paquet){
      const [a, b] = g.paquet;
      while (k > 0){ const m = Math.min(k, a + Math.floor(rnd() * (b - a + 1))); paquet++; for (let i = 0; i < m; i++) out.push({ type: types[Math.floor(rnd() * types.length)], paquet }); k -= m; }
    } else for (let i = 0; i < k; i++) out.push({ type: types[Math.floor(rnd() * types.length)], paquet: 0 });
  }
  while (out.length < n) out.push({ type: F.reste || 'manifestant', paquet: 0 });
  return out.slice(0, n);
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
// Peint les calques du perso, sauf ceux masqués et ceux de « sauf ».
function peindre(g, D, ind, pose, n, sauf, garder){
  const cache = masques(D, ind, garder);
  for (const c of D.calques){
    if (cache.has(c.id) || (sauf && sauf.includes(c.id))) continue;
    const id = ind.pieces[c.id]; if (!id) continue;
    const p = piece(D, id); if (p) peindrePiece(g, p, pose, n, ind.couleurs, 0, 0);
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
  peindre(cv.getContext('2d'), D, ind, pose, n);
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

/* ===== Export : data/sprites.js dans la même mise en forme que le fichier fait main ===== */
const ENTETE = `/*
 * Sprites de Bismillah : les pièces, les persos et la composition de la foule.
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
 *   impose  : (facultatif) force une pièce dans un autre calque, ex. { "bras": "bras_leves" }
 *   masque  : (facultatif) calques cachés quand cette pièce est portée, ex. ["tete", "bras"]
 *
 * types : les persos.
 *   herite  : reprend un autre perso, puis remplace ce qui est précisé
 *   calques : pour chaque calque, les pièces possibles et leur poids (piece: null = rien)
 *   canaux  : pour chaque canal, les couleurs possibles (répéter une couleur = plus fréquente)
 *
 * foule : la composition d'une manif.
 *   reste   : le perso qui remplit tout ce que les groupes ne prennent pas
 *   groupes : chaque groupe prend « un_sur » N manifestants, tirés parmi ses types ;
 *             paquet: [min, max] les fait arriver en grappes.
 */
`;
function formater(d){
  const j = JSON.stringify;
  const inline = v => Array.isArray(v) ? '[' + v.map(inline).join(', ') + ']'
    : v && typeof v === 'object' ? (Object.keys(v).length ? '{ ' + Object.entries(v).map(([k, x]) => j(k) + ': ' + inline(x)).join(', ') + ' }' : '{}')
    : j(v);
  const reste = (o, connus, ind) => Object.keys(o).filter(k => !connus.includes(k)).map(k => ',\n' + ind + j(k) + ': ' + inline(o[k])).join('');
  const liste = (l, f) => '[\n' + l.map(f).join(',\n') + '\n  ]';
  const dico = (o, ind) => { const e = Object.entries(o || {}); return e.length ? '{\n' + e.map(([k, v]) => ind + '  ' + j(k) + ': ' + inline(v)).join(',\n') + '\n' + ind + '}' : '{}'; };
  const pc = p => '    {\n      "id": ' + j(p.id) + ', "nom": ' + j(p.nom) + ', "calque": ' + j(p.calque) + ',\n'
    + '      "legende": ' + inline(p.legende || {}) + ',\n'
    + '      "poses": { ' + Object.entries(p.poses || {}).map(([k, ims]) => j(k) + ': [' + ims.map(im => '[\n' + im.map(r => '        ' + j(r)).join(',\n') + '\n      ]').join(', ') + ']').join(', ') + ' }'
    + reste(p, ['id', 'nom', 'calque', 'legende', 'poses'], '      ') + '\n    }';
  const ty = t => '    {\n      "id": ' + j(t.id) + ', "nom": ' + j(t.nom) + (t.herite ? ', "herite": ' + j(t.herite) : '') + ',\n'
    + '      "calques": ' + dico(t.calques, '      ') + ',\n'
    + '      "canaux": ' + dico(t.canaux, '      ')
    + reste(t, ['id', 'nom', 'herite', 'calques', 'canaux'], '      ') + '\n    }';
  const fl = f => '{\n    "reste": ' + j(f.reste) + ',\n    "groupes": [\n' + (f.groupes || []).map(g => '      ' + inline(g)).join(',\n') + '\n    ]\n  }';
  return '{\n  "version": ' + j(d.version) + ',\n  "cadre": ' + inline(d.cadre) + ',\n'
    + '  "poses": ' + liste(d.poses, x => '    ' + inline(x)) + ',\n'
    + '  "calques": ' + liste(d.calques, x => '    ' + inline(x)) + ',\n'
    + '  "canaux": ' + liste(d.canaux, x => '    ' + inline(x)) + ',\n'
    + '  "pieces": ' + liste(d.pieces, pc) + ',\n'
    + '  "types": ' + liste(d.types, ty)
    + (d.foule ? ',\n  "foule": ' + fl(d.foule) : '')
    + reste(d, ['version', 'cadre', 'poses', 'calques', 'canaux', 'pieces', 'types', 'foule', 'rev'], '  ') + '\n}';
}
const exporter = d => ENTETE + 'window.TENEBRES_SPRITES = ' + formater(d) + ';\n';

root.TenebresSprites = { couleur, decale, resoudre, hasard, piece, typeComplet, tirer, contraindre, masques, composer, image, peindrePiece, peindre, rendre, dessiner, nbImages, formater, exporter };
})(typeof window !== 'undefined' ? window : globalThis);
