/* Bismillah · la place de la République, en vertical.
 * Une seule place, rendue en pixels natifs (180 × 312) puis agrandie en entier.
 * Phase 1, rassemblement : tenir la place. Les CRS ferment les rues, chargent, reculent.
 * Phase 2, dispersion : faire sortir le monde par les rues encore ouvertes avant la nasse.
 * La foule pousse : un cordon trop pressé recule, et s'il est repoussé hors de la rue, la rue se rouvre.
 * Haut de l'écran = nord-ouest (Magenta, Saint-Martin), bas = sud-est (Voltaire). */
(() => {
'use strict';
const S = window.TenebresSprites, PAL = window.TENEBRES_PALETTE;
const $ = id => document.getElementById(id);
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const roman = n => { const m = [[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]; let s = ''; for (const [v, r] of m) while (n >= v){ s += r; n -= v; } return s; };
const fmt = n => Math.round(n).toLocaleString('fr-FR');
const mmss = s => { s = Math.max(0, Math.ceil(s)); return Math.floor(s / 60) + ':' + String(s % 60).padStart(2, '0'); };
const COLC = {}; const C = ref => COLC[ref] || (COLC[ref] = S.couleur(ref));
const reduceMotion = !!(window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches);

/* ---------- sprites : le brouillon du studio s'il existe ---------- */
let D = window.TENEBRES_SPRITES;
try {
  const l = JSON.parse(localStorage.getItem('bismillah-studio-v2'));
  if (l && l.version === D.version && Array.isArray(l.pieces) && Array.isArray(l.types) && Array.isArray(l.calques)) D = l;
} catch(e){}
D.rev = 1;
const hasType = id => D.types.some(t => t.id === id);
const NFR = Math.max(1, S.nbImages(D, 'marche'));

/* ---------- la carte : 15 × 26 cases de 12 px ---------- */
const T = 12, MW = 15, MH = 26, PW = MW*T, PH = MH*T;
//  # bâti   r chaussée   p place
const PLAN = [
  '#rr##rrrrr##rr#', //  0  René-Boulanger, Saint-Martin, Magenta
  '#rr##rrrrr##rr#',
  '#rr##rrrrr##rr#',
  '#ppppppppppppp#', //  3
  '##ppppppppppp##',
  '##ppppppppppp##',
  '##ppppppppppp##',
  'rrppppppppppprr', //  7  Turbigo | Léon-Jouhaux
  'rrppppppppppprr',
  '##ppppppppppp##',
  '##ppppppppppp##',
  '##ppppppppppp##',
  '##ppppppppppp##',
  '##ppppppppppp##',
  '##ppppppppppp##',
  '##ppppppppppp##',
  'rrppppppppppprr', // 16  Rue du Temple | Faubourg-du-Temple
  'rrppppppppppprr',
  '##ppppppppppp##',
  '##ppppppppppp##',
  '##ppppppppppp##',
  '##ppppppppppp##',
  '##ppppppppppp##',
  '##rrr#rrr#rrr##', // 23  Bd du Temple, Voltaire, Av. de la République
  '##rrr#rrr#rrr##',
  '##rrr#rrr#rrr##',
];
const SOLID = new Uint8Array(MW*MH), KIND = new Uint8Array(MW*MH); // KIND : 0 bâti, 1 chaussée, 2 place
for (let y = 0; y < MH; y++) for (let x = 0; x < MW; x++){
  const c = PLAN[y][x]; SOLID[y*MW+x] = c === '#' ? 1 : 0; KIND[y*MW+x] = c === '#' ? 0 : c === 'r' ? 1 : 2;
}
// Rues : côté, cases occupées sur le bord, profondeur. court = nom peint au sol.
const RUES = [
  { id:'rb', nom:'Rue René-Boulanger',      court:'BOULANGER',  cote:'haut',   a:[1,2] },
  { id:'sm', nom:'Boulevard Saint-Martin',  court:'ST-MARTIN',  cote:'haut',   a:[5,9] },
  { id:'mg', nom:'Boulevard de Magenta',    court:'MAGENTA',    cote:'haut',   a:[12,13] },
  { id:'tu', nom:'Rue de Turbigo',          court:'TURBIGO',    cote:'gauche', a:[7,8] },
  { id:'lj', nom:'Rue Léon-Jouhaux',        court:'JOUHAUX',    cote:'droite', a:[7,8] },
  { id:'rt', nom:'Rue du Temple',           court:'TEMPLE',     cote:'gauche', a:[16,17] },
  { id:'ft', nom:'Rue du Faubourg-du-Temple', court:'FG TEMPLE', cote:'droite', a:[16,17] },
  { id:'bt', nom:'Boulevard du Temple',     court:'BD TEMPLE',  cote:'bas',    a:[2,4] },
  { id:'vo', nom:'Boulevard Voltaire',      court:'VOLTAIRE',   cote:'bas',    a:[6,8] },
  { id:'ar', nom:'Avenue de la République', court:'REPUBLIQUE', cote:'bas',    a:[10,12] },
];
for (const r of RUES){
  const [a0, a1] = r.a;
  if (r.cote === 'haut'){ r.p0 = {x:a0*T, y:0}; r.p1 = {x:(a1+1)*T, y:0}; r.n = {x:0, y:1}; r.prof = 3*T; }
  if (r.cote === 'bas'){ r.p0 = {x:a0*T, y:PH}; r.p1 = {x:(a1+1)*T, y:PH}; r.n = {x:0, y:-1}; r.prof = 3*T; }
  if (r.cote === 'gauche'){ r.p0 = {x:0, y:a0*T}; r.p1 = {x:0, y:(a1+1)*T}; r.n = {x:1, y:0}; r.prof = 2*T; }
  if (r.cote === 'droite'){ r.p0 = {x:PW, y:a0*T}; r.p1 = {x:PW, y:(a1+1)*T}; r.n = {x:-1, y:0}; r.prof = 2*T; }
  r.mx = (r.p0.x + r.p1.x)/2; r.my = (r.p0.y + r.p1.y)/2;
  r.cordon = null; r.repos = 0;
}
const RUE = id => RUES.find(r => r.id === id);
// Décor qui bloque : arbres (troncs), statue, bouches de métro
const STATUE = { x: 90, y: 104, r: 11 };
const ARBRES = [];
for (const ty of [4, 6, 10, 12, 14, 19, 21]) for (const tx of [2.6, 12.4]) ARBRES.push({ x: tx*T, y: (ty+.5)*T, r: 2.5 });
for (const [tx, ty] of [[4.5,19.6],[10.5,19.6],[4.5,15.2],[10.5,15.2]]) ARBRES.push({ x: tx*T, y: ty*T, r: 2.5 });
const METROS = [ { x0: 38, y0: 152, x1: 50, y1: 159 }, { x0: 118, y0: 226, x1: 130, y1: 233 } ];
const OBST_C = [STATUE, ...ARBRES];

/* ---------- sauvegarde et améliorations ---------- */
const SAVE_KEY = 'bismillah-place-v1';
const UPG = [
  { id:'crowd',  nom:'Bouche-à-oreille',      d:'+20 manifestants',                       base:20, max:6 },
  { id:'ban',    nom:'Banderoles',            d:'+1 banderole par acte',                  base:16, max:5 },
  { id:'med',    nom:'Street medics',         d:'+1 medic par acte',                      base:16, max:5 },
  { id:'film',   nom:'Filmeurs',              d:'+1 filmeur par acte',                    base:16, max:5 },
  { id:'sono',   nom:'Sono',                  d:'Mégaphone : +2 s et plus de portée',     base:20, max:4 },
  { id:'sturdy', nom:'Banderole renforcée',   d:'+1 charge encaissée par banderole',      base:22, max:3 },
  { id:'legal',  nom:'Numéro de la legal team', d:'−15 % de risque d’interpellation',     base:26, max:4 },
  { id:'goggles',nom:'Lunettes de piscine',   d:'−20 % de panique dans le gaz',           base:22, max:4 },
];
let save = { colere: 0, acte: 1, rep: 1, lv: {}, runs: 0 };
try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && typeof s === 'object') save = Object.assign(save, s, { lv: Object.assign({}, s.lv || {}) }); } catch(e){}
const persist = () => { try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch(e){} };
const L = id => save.lv[id] || 0;
const cout = u => Math.round(u.base * Math.pow(1.6, L(u.id)));

/* ---------- bandeau ---------- */
const TICK = {
  start:["Quelques dizaines de manifestants place de la République selon nos informations","Rassemblement à République : les commerçants se disent très inquiets pour leurs terrasses","La préfecture appelle au calme et passe commande de grenades"],
  cordon:["Les forces de l'ordre protègent courageusement une rue","Un cordon de sécurité mis en place pour la sécurité du cordon","Selon nos experts, la rue était menacée"],
  charge:["Les forces de l'ordre avancent courageusement vers le dos des manifestants","Charge : la préfecture parle d'un « déplacement dynamique »","Un manifestant aurait foncé sur un bouclier à l'arrêt, selon une source policière"],
  recule:["Un cordon recule : la préfecture dénonce une foule « anormalement nombreuse »","Les forces de l'ordre se replient en bon ordre, affirment les forces de l'ordre","Le ministre salue un recul stratégique planifié depuis toujours"],
  grab:["Interpellation d'un individu au comportement suspect (il marchait)","Un lycéen interpellé en possession d'une banane, arme par destination","Interpellation préventive : il allait sans doute faire quelque chose"],
  gas:["Un nuage de lacrymogène aurait été agressé par des manifestants","Gaz : la préfecture évoque un brouillard naturel d'automne","Des manifestants se seraient jetés sur des grenades en plein vol"],
  down:["Un manifestant se serait blessé tout seul, selon une source policière","Blessé : il aurait percuté une matraque à vive allure"],
  film:["Des images non vérifiées circulent sur les réseaux sociaux","Vidéo virale : nos experts doutent qu'une vidéo puisse prouver quoi que ce soit"],
  banner:["Une banderole hostile déployée face aux forces de l'ordre","La banderole mesurerait trois mètres, un record selon la préfecture"],
  bloque:["Une charge stoppée net par du tissu, la préfecture demande l'interdiction du coton","Banderole : le ministère étudie une interdiction des mots écrits en gros"],
  medic:["Des individus en blouse blanche, probablement des casseurs","Street medics : la préfecture s'interroge sur ces soignants autoproclamés"],
  meg:["Un individu muni d'un mégaphone sème la confusion","Un mégaphone non déclaré repéré dans le cortège"],
  sommations:["SOMMATIONS : la place doit être évacuée dans le calme et sans sortie","La préfecture ordonne la dispersion, sortie conseillée par la rue que voici"],
  metro:["Station République fermée pour la sécurité de la station","Trafic perturbé : 25 stations fermées pour votre confort"],
  prefet:["ARRÊTÉ PRÉFECTORAL : la sortie est déplacée pour votre sécurité","La sortie prévue est une zone interdite depuis trente secondes"],
  nasse:["Encerclement en cours : un dispositif d'accompagnement des manifestants","Les manifestants sont invités à se disperser par la sortie qui n'existe pas"],
  exit:["La manifestation se disperse dans le calme (ils sont partis)","Des manifestants auraient réussi à rentrer chez eux, une enquête est ouverte"],
  idle:["Météo : brouillard de gaz sur République, éclaircies en fin de nasse","Le ministre salue le professionnalisme des forces en direct d'un plateau","Bourse : le cours de la grenade lacrymogène s'envole","Chiffres officiels : moins de manifestants que de policiers, comme d'habitude","Débat en plateau : faut-il interdire les jambes en manifestation ?","Marianne aurait été vue sans autorisation de manifester sur son socle"],
};
const tickEl = $('tick'), trackEl = $('track');
let tickQ = [], tickBusy = false, tickTimer = 0;
function tick(kind, force){
  const arr = TICK[kind]; if (!arr) return;
  const s = pick(arr);
  if (force){ tickQ.unshift(s); if (tickBusy){ nextTick(); return; } }
  else { if (tickQ.length > 1) return; tickQ.push(s); }
  if (!tickBusy) nextTick();
}
function nextTick(){
  clearTimeout(tickTimer);
  const s = tickQ.shift();
  if (!s){ tickBusy = false; return; }
  tickBusy = true; G.idleT = 0;
  tickEl.textContent = s;
  if (reduceMotion){ tickTimer = setTimeout(nextTick, 6000); return; }
  const tw = trackEl.clientWidth || 300;
  tickEl.style.setProperty('--tw', tw + 'px');
  tickEl.style.animation = 'none'; void tickEl.offsetWidth;
  tickEl.style.animation = `tick ${Math.max(6, (tw + s.length * 9) / 85)}s linear 1`;
}
tickEl.addEventListener('animationend', nextTick);

/* ---------- police de caractères 3 × 5 ---------- */
const GLY = {
  "A": ".#.#.#####.##.#",
  "B": "##.#.###.#.###.",
  "C": ".###..#..#...##",
  "D": "##.#.##.##.###.",
  "E": "####..##.#..###",
  "F": "####..##.#..#..",
  "G": ".###..#.##.#.##",
  "H": "#.##.#####.##.#",
  "I": "###.#..#..#.###",
  "J": "..#..#..##.#.#.",
  "K": "#.##.###.#.##.#",
  "L": "#..#..#..#..###",
  "M": "#.########.##.#",
  "N": "##.#.##.##.##.#",
  "O": ".#.#.##.##.#.#.",
  "P": "##.#.###.#..#..",
  "Q": ".#.#.##.###..##",
  "R": "##.#.###.#.##.#",
  "S": ".###...#...###.",
  "T": "###.#..#..#..#.",
  "U": "#.##.##.##.####",
  "V": "#.##.##.##.#.#.",
  "W": "#.##.########.#",
  "X": "#.##.#.#.#.##.#",
  "Y": "#.##.#.#..#..#.",
  "Z": "###..#.#.#..###",
  "0": "####.##.##.####",
  "1": ".#.##..#..#.###",
  "2": "##...#.#.#..###",
  "3": "##...#.#...###.",
  "4": "#.##.####..#..#",
  "5": "####..##...###.",
  "6": ".###..####.####",
  "7": "###..#.#..#..#.",
  "8": "####.#####.####",
  "9": "####.####..###.",
  "!": ".#..#..#.....#.",
  "?": "##...#.#.....#.",
  ".": ".............#.",
  ",": "..........#.#..",
  ":": "....#.....#....",
  "-": "......###......",
  "+": "....#.###.#....",
  "/": "..#..#.#.#..#..",
  "'": ".#..#..........",
  "%": "#.#..#.#.#..#.#",
  " ": "...............",
  "(": ".#.#..#..#...#.",
  ")": ".#...#..#..#.#."
};
const norm = s => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();
function texteL(s){ return norm(s).length * 4 - 1; }
function texte(g, s, x, y, col, opt){
  opt = opt || {}; const k = opt.k || 1; s = norm(s);
  let w = (s.length * 4 - 1) * k;
  if (opt.centre) x -= Math.floor(w / 2);
  const passe = (cx, cy, c) => {
    g.fillStyle = c;
    for (let i = 0; i < s.length; i++){
      const gl = GLY[s[i]] || GLY['?'];
      for (let p = 0; p < 15; p++) if (gl[p] === '#') g.fillRect(cx + (i*4 + p % 3) * k, cy + Math.floor(p / 3) * k, k, k);
    }
  };
  if (opt.ombre) passe(x + k, y + k, opt.ombre);
  passe(x, y, col);
  return w;
}

/* ---------- état ---------- */
const G = { agents: [], cordons: [], bans: [], gas: [], projs: [], floats: [], t: 0 };
let mode = 'titre', paused = false, outil = 'meg';
const P1 = 90, P2 = 150; // fin du rassemblement, fermeture totale
const MANIF_V = 17, PANIC_V = 34;

/* ---------- champ de sortie (Dijkstra sur les cases) ---------- */
const NB8 = [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.41],[1,-1,1.41],[-1,1,1.41],[-1,-1,1.41]];
let champ = null, champT = 0;
const crsCase = new Uint8Array(MW*MH), gazCase = new Uint8Array(MW*MH);
function calculerChamp(){
  crsCase.fill(0); gazCase.fill(0);
  for (const a of G.agents) if (a.crs && a.vivant){ const tx = Math.floor(a.x/T), ty = Math.floor(a.y/T); if (tx >= 0 && ty >= 0 && tx < MW && ty < MH) crsCase[ty*MW+tx] = 1; }
  for (const g of G.gas){ for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++){ const dx = (tx+.5)*T - g.x, dy = (ty+.5)*T - g.y; if (dx*dx+dy*dy < (g.r+6)*(g.r+6)) gazCase[ty*MW+tx] = 1; } }
  const dist = new Float32Array(MW*MH).fill(Infinity), q = [];
  for (const r of RUES){
    if (!rueOuverte(r)) continue;
    for (let a = r.a[0]; a <= r.a[1]; a++){
      const [tx, ty] = r.cote === 'haut' ? [a, 0] : r.cote === 'bas' ? [a, MH-1] : r.cote === 'gauche' ? [0, a] : [MW-1, a];
      dist[ty*MW+tx] = 0; q.push([0, ty*MW+tx]);
    }
  }
  while (q.length){
    let bi = 0; for (let i = 1; i < q.length; i++) if (q[i][0] < q[bi][0]) bi = i;
    const [d, i] = q[bi]; q[bi] = q[q.length-1]; q.pop();
    if (d > dist[i]) continue;
    const x = i % MW, y = (i / MW) | 0;
    for (const [dx, dy, s] of NB8){
      const nx = x+dx, ny = y+dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
      const n = ny*MW+nx; if (SOLID[n]) continue;
      if (dx && dy && (SOLID[y*MW+nx] || SOLID[ny*MW+x])) continue;
      const nd = d + s * (1 + crsCase[n]*25 + gazCase[n]*6);
      if (nd < dist[n]){ dist[n] = nd; q.push([nd, n]); }
    }
  }
  champ = dist;
}
function dirChamp(x, y){
  if (!champ) return null;
  const tx = clamp(Math.floor(x/T), 0, MW-1), ty = clamp(Math.floor(y/T), 0, MH-1), i = ty*MW+tx;
  if (!isFinite(champ[i])) return null;
  if (champ[i] === 0){ const r = rueAuBord(tx, ty); return r ? { x: -r.n.x, y: -r.n.y } : null; }
  let best = champ[i], bx = 0, by = 0;
  for (const [dx, dy] of NB8){
    const nx = tx+dx, ny = ty+dy; if (nx < 0 || ny < 0 || nx >= MW || ny >= MH) continue;
    const n = ny*MW+nx; if (SOLID[n]) continue; if (dx && dy && (SOLID[ty*MW+nx] || SOLID[ny*MW+tx])) continue;
    if (champ[n] < best){ best = champ[n]; bx = dx; by = dy; }
  }
  if (!bx && !by) return null;
  const cx = (tx + bx + .5)*T - x, cy = (ty + by + .5)*T - y, l = Math.hypot(cx, cy) || 1;
  return { x: cx/l, y: cy/l };
}
function rueAuBord(tx, ty){
  for (const r of RUES){
    if (r.cote === 'haut' && ty === 0 && tx >= r.a[0] && tx <= r.a[1]) return r;
    if (r.cote === 'bas' && ty === MH-1 && tx >= r.a[0] && tx <= r.a[1]) return r;
    if (r.cote === 'gauche' && tx === 0 && ty >= r.a[0] && ty <= r.a[1]) return r;
    if (r.cote === 'droite' && tx === MW-1 && ty >= r.a[0] && ty <= r.a[1]) return r;
  }
  return null;
}
const rueOuverte = r => !r.cordon || r.cordon.etat === 'replie';

/* ---------- agents ---------- */
let nextId = 1;
function nouveauManif(x, y, type){
  const ind = S.tirer(D, type || 'manifestant');
  const a = { id: nextId++, crs: false, x, y, vx: 0, vy: 0, r: 2.6, m: type === 'black_bloc' ? 1.4 : 1, ind, type: type || 'manifestant',
    vivant: true, st: 'ok', t: 0, ph: Math.random()*6, face: Math.random() < .5 ? 1 : -1, role: null,
    hx: 0, hy: 0, homeT: 0, tetu: type === 'black_bloc' || Math.random() < .14, pan: 0, panX: 0, panY: 0, gen: 0,
    comp: 0, pr: 0, preuves: 0, bat: 0, dvx: 0, dvy: 0, part: false };
  choisirHome(a); a.homeT = rnd(4, 12);
  G.agents.push(a);
  return a;
}
function choisirHome(a){
  for (let k = 0; k < 8; k++){
    const x = clamp(PW/2 + (Math.random()+Math.random()+Math.random()-1.5) * 70, 30, PW-30);
    const y = clamp(PH*0.52 + (Math.random()+Math.random()+Math.random()-1.5) * 150, 4*T, 22*T);
    if (Math.hypot(x - STATUE.x, y - STATUE.y) > 16){ a.hx = x; a.hy = y; return; }
  }
  a.hx = PW/2; a.hy = PH*0.6;
}
function nouveauCRS(x, y, c, i){
  const type = (i % 4 === 1 && hasType('crs_matraque')) ? 'crs_matraque' : 'crs_bouclier';
  const a = { id: nextId++, crs: true, x, y, vx: 0, vy: 0, r: 3, m: 5, ind: S.tirer(D, type), vivant: true, st: 'ok',
    ph: Math.random()*6, face: 1, cordon: c, idx: i, jit: 0, prise: false };
  G.agents.push(a);
  return a;
}

/* ---------- cordons ---------- */
function slot(c, i){
  const k = c.crs.length, u = (i + .5) / k;
  return { x: c.p0.x + (c.p1.x - c.p0.x)*u + c.n.x*c.s, y: c.p0.y + (c.p1.y - c.p0.y)*u + c.n.y*c.s };
}
function creerCordon(kind, p0, p1, n, o){
  const w = Math.hypot(p1.x - p0.x, p1.y - p0.y), k = Math.max(2, Math.round(w / 6.6));
  const c = { id: G.cordons.length, kind, p0, p1, n, s: o.s0, sHold: o.sHold, etat: 'arrive', t: 0, crs: [], rue: o.rue || null,
    avance: o.avance || 0, sMax: o.sMax || 1e9, grabs: 0, filme: false, prepD: 1.2, sCharge: 0, back: 0, vivant: true, prochaine: 0 };
  for (let i = 0; i < k; i++){ const s = slot(Object.assign({}, c, { crs: { length: k } }), i); c.crs.push(nouveauCRS(s.x + rnd(-1,1), s.y + rnd(-1,1), c, i)); }
  G.cordons.push(c);
  return c;
}
function fermerRue(r, immediat){
  if (r.cordon && r.cordon.vivant && r.cordon.etat !== 'replie') return r.cordon;
  const c = creerCordon('rue', r.p0, r.p1, r.n, { rue: r, s0: immediat ? r.prof - 7 : -20, sHold: r.prof - 7 });
  if (immediat) c.tenu = true;
  r.cordon = c; champT = 0;
  return c;
}
function replier(c, pousse){
  if (c.etat === 'replie') return;
  c.etat = 'replie'; c.t = 0; champT = 0;
  if (pousse){
    G.repousses++;
    flottant(c.p0.x/2 + c.p1.x/2 + c.n.x*c.s, c.p0.y/2 + c.p1.y/2 + c.n.y*c.s - 10, 'ILS RECULENT !', 'vert.10');
    if (c.rue){ c.rue.repos = G.phase === 1 ? 22 : 9; flash('LA RUE EST REPRISE', c.rue.nom, 2.2); }
    tick('recule', true);
  }
}
function majCordon(c, dt){
  const k = c.crs.length;
  // rapport de force : les gens au contact qui poussent vers le cordon, contre ce que le cordon encaisse
  let P = 0; const vus = new Set();
  for (const a of c.crs){
    if (!a.vivant) continue;
    voisins(a.x + c.n.x*6, a.y + c.n.y*6, 12, m => {
      if (m.crs || vus.has(m) || (m.st !== 'ok')) return;
      const av = (m.x - a.x)*c.n.x + (m.y - a.y)*c.n.y; if (av < -1 || av > 16) return;
      const pousse = -(m.dvx*c.n.x + m.dvy*c.n.y); if (pousse < 4) return;
      vus.add(m); P += (av < 8 ? 1 : .6) * (m.type === 'black_bloc' ? 1.5 : 1);
    });
  }
  c.P = P; c.R = c.crs.length * (c.kind === 'nasse' ? .75 : 1.1) * (1 + .12*(save.rep - 1));
  c.back = P;
  c.filme = estFilme(c);
  c.t += dt;
  const mass = c.etat === 'charge' ? 1000 : c.etat === 'replie' ? 1.5 : 5;
  for (const a of c.crs) a.m = mass;
  switch (c.etat){
    case 'arrive': if (!c.pousse) c.s = Math.min(c.sHold, c.s + 28*dt); if (c.s >= c.sHold - .5) { c.etat = 'tient'; c.t = 0; c.tenu = true; } break;
    case 'tient':
      if (c.avance) c.sHold = Math.min(c.sMax, c.sHold + c.avance*dt);
      if (!c.pousse && c.s < c.sHold) c.s = Math.min(c.sHold, c.s + 9*dt);
      break;
    case 'prep': if (c.t >= c.prepD){ c.etat = 'charge'; c.t = 0; c.sCharge = c.s + (c.kind === 'nasse' ? 34 : 26 + 3*save.rep); c.grabs = 0; c.nCharge = (c.nCharge || 0) + 1; for (const a of c.crs) a.prise = false; tick('charge'); } break;
    case 'charge': c.s += 72*dt; if (c.s >= c.sCharge || c.t > 1.2) { c.etat = 'recul'; c.t = 0; if (c.kind === 'nasse') c.sHold = Math.min(c.sMax, c.sHold + 10); } break;
    case 'recul': c.s -= 26*dt; if (c.s <= c.sHold) { c.s = Math.max(c.s, c.sHold - 2); c.etat = 'tient'; c.t = 0; } break;
    case 'replie': c.s -= 34*dt; if (c.s < -26){ c.vivant = false; for (const a of c.crs) a.vivant = false; if (c.rue && c.rue.cordon === c) c.rue.cordon = null; } break;
  }
  // la foule pousse : le cordon cède du terrain
  c.pousse = false;
  if (c.etat === 'arrive' || c.etat === 'tient' || c.etat === 'prep' || c.etat === 'recul'){
    if (c.P > c.R){
      c.pousse = true;
      c.s -= Math.min(11, (c.P - c.R) * 1.6) * dt;
      if (c.etat === 'tient' || c.etat === 'recul') c.sHold = Math.min(c.sHold, c.s + 2);
    } else if (c.etat === 'tient' && c.kind === 'rue' && c.sHold < c.rue.prof - 7 && c.P < c.R*.5){
      c.sHold = Math.min(c.rue.prof - 7, c.sHold + 3*dt); // il reprend le terrain quand ça se calme
    }
    if (c.kind === 'rue' && ((c.tenu && c.s < 3) || (c.etat === 'arrive' && c.t > 3 && c.s < -6 && c.pousse))) replier(c, true);
    if (c.kind === 'nasse') c.s = Math.max(c.s, 0);
  }
  // les CRS rejoignent leur place
  const vmax = c.etat === 'charge' ? 80 : c.etat === 'replie' ? 30 : 32;
  for (let i = 0; i < k; i++){
    const a = c.crs[i]; if (!a.vivant) continue;
    const s = slot(c, i);
    let vx = (s.x - a.x)*7, vy = (s.y - a.y)*7; const l = Math.hypot(vx, vy);
    if (l > vmax){ vx *= vmax/l; vy *= vmax/l; }
    a.vx = vx; a.vy = vy;
    a.jit = c.etat === 'prep' ? Math.sin(G.t*40 + i) : c.pousse ? (Math.floor(G.t*10 + i) % 2) - .5 : 0;
  }
}
function lancerCharge(){
  let best = null, bn = 3;
  for (const c of G.cordons){
    if (!c.vivant || c.etat !== 'tient' || c.t < 2.5) continue;
    const cx = (c.p0.x + c.p1.x)/2 + c.n.x*c.s, cy = (c.p0.y + c.p1.y)/2 + c.n.y*c.s;
    const ux = c.p1.x - c.p0.x, uy = c.p1.y - c.p0.y, ul = Math.hypot(ux, uy);
    let cnt = 0;
    for (const a of G.agents){
      if (a.crs || a.st !== 'ok' && a.st !== 'panic') continue;
      const dx = a.x - cx, dy = a.y - cy, av = dx*c.n.x + dy*c.n.y, lat = Math.abs((dx*ux + dy*uy)/ul);
      if (av > -2 && av < 30 && lat < ul/2 + 6) cnt++;
    }
    if (cnt > bn){ bn = cnt; best = c; }
  }
  if (!best) return false;
  best.etat = 'prep'; best.t = 0; best.prepD = 1.1 * (best.filme ? 1.8 : 1);
  return true;
}

/* ---------- outils ---------- */
const charges = { ban: 2, med: 2, film: 2 };
function manifProche(x, y, R){
  let best = null, bd = R*R;
  for (const a of G.agents){
    if (a.crs || a.st !== 'ok' || a.role) continue;
    const d = (a.x-x)**2 + (a.y-y)**2; if (d < bd){ bd = d; best = a; }
  }
  return best;
}
function cordonProche(x, y){
  let best = null, bd = Infinity;
  for (const c of G.cordons){ if (!c.vivant || c.etat === 'replie') continue;
    const cx = (c.p0.x + c.p1.x)/2 + c.n.x*c.s, cy = (c.p0.y + c.p1.y)/2 + c.n.y*c.s, d = (cx-x)**2 + (cy-y)**2;
    if (d < bd){ bd = d; best = c; } }
  return best;
}
function appliquerOutil(x, y){
  if (mode !== 'jeu') return;
  G.tap = { x, y, t: 0 };
  if (outil === 'meg'){
    let h = G.meg && G.meg.h && G.meg.h.vivant && G.meg.h.st === 'ok' ? G.meg.h : manifProche(x, y, 400);
    if (h && !h.role) h.role = 'meg';
    G.meg = { x, y, t: 7 + 2*L('sono'), h };
    if (Math.random() < .3) tick('meg');
    return;
  }
  if (!(charges[outil] > 0)) { flottant(x, y - 6, 'PLUS RIEN', 'rouge.10'); return; }
  if (outil === 'ban'){
    const a = manifProche(x, y, 60); if (!a){ flottant(x, y-6, 'PERSONNE ICI', 'gris.12'); return; }
    a.role = 'ban';
    const b = manifProche(a.x, a.y, 60); if (!b){ a.role = null; flottant(x, y-6, 'IL EN FAUT DEUX', 'gris.12'); return; }
    b.role = 'ban';
    const c = cordonProche(x, y);
    let ux = 1, uy = 0;
    if (c){ const l = Math.hypot(c.p1.x - c.p0.x, c.p1.y - c.p0.y); ux = (c.p1.x - c.p0.x)/l; uy = (c.p1.y - c.p0.y)/l; }
    G.bans.push({ a, b, x, y, ux, uy, hp: 2 + L('sturdy'), t: 0, dur: 32, up: false, vivant: true });
    charges.ban--; tick('banner');
  } else if (outil === 'med'){
    const a = manifProche(x, y, 60); if (!a){ flottant(x, y-6, 'PERSONNE ICI', 'gris.12'); return; }
    a.role = 'med'; if (hasType('medic')) a.ind = S.tirer(D, 'medic'); charges.med--; tick('medic');
  } else if (outil === 'film'){
    const a = manifProche(x, y, 60); if (!a){ flottant(x, y-6, 'PERSONNE ICI', 'gris.12'); return; }
    a.role = 'film'; a.fx = x; a.fy = y; a.bat = 40; a.preuves = 0;
    a.ind = JSON.parse(JSON.stringify({ type: a.ind.type, pieces: a.ind.pieces, couleurs: a.ind.couleurs }));
    if (D.pieces.some(p => p.id === 'bras_leves')) a.ind.pieces.bras = 'bras_leves';
    charges.film--;
  }
  majOutils();
}
function estFilme(c){
  for (const f of G.agents){
    if (f.role !== 'film' || f.st !== 'ok' || f.bat <= 0) continue;
    for (const a of c.crs){
      const dx = a.x - f.x, dy = a.y - f.y, d = Math.hypot(dx, dy);
      if (d < 78){ const ang = Math.atan2(dy, dx), da = Math.abs(((ang - f.aim + Math.PI*3) % (Math.PI*2)) - Math.PI); if (da < .75) return f; }
    }
  }
  return null;
}
function preuve(x, y){
  for (const f of G.agents){
    if (f.role !== 'film' || f.st !== 'ok' || f.bat <= 0) continue;
    const dx = x - f.x, dy = y - f.y, d = Math.hypot(dx, dy);
    if (d > 78) continue;
    const da = Math.abs(((Math.atan2(dy, dx) - f.aim + Math.PI*3) % (Math.PI*2)) - Math.PI);
    if (da < .75){ f.preuves++; flottant(f.x, f.y - 14, '+1 PREUVE', 'jaune.13'); if (Math.random() < .2) tick('film'); }
  }
}

/* ---------- événements ---------- */
function flottant(x, y, s, col){ if (G.floats.length < 30) G.floats.push({ x, y, s, col, t: 0 }); }
function flash(titre, sous, d){ G.flash = { titre, sous: sous || '', t: d || 2.5 }; }
function construireEvenements(){
  const r = save.rep, ev = [];
  const add = (t, fn) => ev.push({ t, fn });
  add(0, () => { fermerRue(RUE('mg'), true); fermerRue(RUE('ft'), true); });
  add(9, () => { fermerRue(RUE('lj')); tick('cordon'); });
  add(26, () => { fermerRue(RUE('tu')); tick('cordon'); });
  if (r >= 2) add(38, () => fermerRue(RUE('ar')));
  add(56, () => { fermerRue(RUE('rb')); tick('cordon'); });
  if (r >= 3) add(70, () => fermerRue(RUE('bt')));
  add(P1, sommations);
  add(P1 + 7, () => nasse('haut'));
  add(P1 + 24, arrete);
  add(P1 + 38, () => nasse('bas'));
  add(P2 - 10, () => { for (const x of RUES) if (rueOuverte(x)) fermerRue(x); flash('TOUT EST FERMÉ', 'il reste 10 secondes', 2); tick('nasse', true); });
  ev.sort((a, b) => a.t - b.t);
  G.events = ev;
}
function planifier(t, fn){ G.events.push({ t, fn }); G.events.sort((a, b) => a.t - b.t); }
function sommations(){
  G.phase = 2; G.metro = false;
  flash('SOMMATIONS', 'dispersion : sortez par le boulevard Voltaire', 3.2);
  tick('sommations', true); tick('metro');
  const vo = RUE('vo');
  if (vo.cordon && vo.cordon.etat !== 'replie') replier(vo.cordon, false);
  vo.repos = 99;
  const libres = RUES.filter(x => x !== vo && rueOuverte(x));
  // la police ferme tout ce qui reste ouvert, sauf ce que la foule vient de reprendre
  libres.forEach((x, i) => { if (x.repos > 0) return; planifier(G.t + .7 + i*2.2, () => { if (rueOuverte(x) && x.repos <= 0) fermerRue(x); }); });
  for (const a of G.agents) if (!a.crs){ a.homeT = 0; a.part = Math.random() < .2; }
  champT = 0;
}
function nasse(cote){
  const haut = cote === 'haut';
  const y0 = haut ? 3*T : 23*T;
  const c = creerCordon('nasse', { x: 2*T, y: y0 }, { x: 13*T, y: y0 }, { x: 0, y: haut ? 1 : -1 },
    { s0: -6, sHold: 4, avance: haut ? 2.4 : 2.0, sMax: haut ? 9*T : 8*T });
  G.nasses.push(c);
  flash('NASSE', haut ? 'un cordon descend depuis Magenta' : 'un cordon remonte depuis Voltaire', 2.4);
  tick('nasse', true);
}
function arrete(){
  const vo = RUE('vo'); vo.repos = 0;
  fermerRue(vo);
  const cand = RUES.filter(x => x.cordon && x.cordon.etat !== 'replie' && x.cote !== 'haut' && x !== vo);
  const r = cand.length ? pick(cand) : null;
  if (r){ replier(r.cordon, false); r.repos = 20; flash('LE PARCOURS EST MODIFIÉ', 'sortie : ' + r.nom.toLowerCase(), 3); }
  else flash('LE PARCOURS EST MODIFIÉ', 'plus de sortie prévue', 3);
  tick('prefet', true);
}

/* ---------- partie ---------- */
function nouvellePartie(demo){
  const rep = save.rep;
  for (const r of RUES){ r.cordon = null; r.repos = 0; }
  Object.assign(G, {
    agents: [], cordons: [], nasses: [], bans: [], gas: [], projs: [], floats: [], t: 0, demo: !!demo,
    phase: 1, metro: true, meg: null, tap: null, flash: null, idleT: 0, hudT: 0,
    spawned: 0, sortis: 0, gav: 0, blesses: 0, preuves: 0, perdues: 0, repousses: 0, tenue: 0,
    total: demo ? 90 : 130 + 20*L('crowd'), fin: false,
    chargeT: demo ? 6 : 16, chargeInt: Math.max(6, 12.5 - 1.5*(rep-1)),
    grenT: demo ? 1e9 : 40, grenInt: Math.max(5, 10 - 1.2*(rep-1)),
    grabP: (0.22 + 0.04*(rep-1)) * (1 - 0.15*L('legal')),
  });
  G.objectif = Math.ceil(G.total * 0.45);
  charges.ban = 2 + L('ban'); charges.med = 2 + L('med'); charges.film = 2 + L('film');
  if (demo) G.events = [{ t: 0, fn: () => { fermerRue(RUE('mg'), true); fermerRue(RUE('ft'), true); fermerRue(RUE('vo'), true); } }];
  else construireEvenements();
  // une bonne partie de la foule est déjà là
  const deja = Math.floor(G.total * (demo ? 1 : .35));
  const compo = S.composer(D, G.total, Math.random);
  G.compo = compo;
  for (let i = 0; i < deja; i++){ const m = compo[G.spawned++]; const a = nouveauManif(0, 0, m.type); a.x = a.hx; a.y = a.hy; }
  champ = null; champT = 0;
}
function arrivee(dt){
  if (G.spawned >= G.total || G.phase !== 1) return;
  G.spawnAcc = (G.spawnAcc || 0) + dt * (G.total * .65) / 55;
  while (G.spawnAcc >= 1 && G.spawned < G.total){
    G.spawnAcc -= 1;
    const ouvertes = RUES.filter(r => rueOuverte(r));
    let x, y;
    if (G.metro && (Math.random() < .55 || !ouvertes.length)){ const m = pick(METROS); x = (m.x0 + m.x1)/2 + rnd(-3, 3); y = m.y1 + 3; }
    else if (ouvertes.length){
      const r = pick(ouvertes), u = rnd(.2, .8);
      x = r.p0.x + (r.p1.x - r.p0.x)*u + r.n.x*4; y = r.p0.y + (r.p1.y - r.p0.y)*u + r.n.y*4;
    } else return;
    const m = G.compo[G.spawned++]; nouveauManif(x, y, m.type);
  }
}

/* ---------- grille spatiale ---------- */
const HC = 8, HOX = 32, HOY = 32, HW = Math.ceil((PW + 64) / HC), HH = Math.ceil((PH + 64) / HC);
const head = new Int32Array(HW*HH).fill(-1); let suiv = new Int32Array(1024).fill(-1);
function hashCell(x, y){ return clamp(Math.floor((y + HOY)/HC), 0, HH-1)*HW + clamp(Math.floor((x + HOX)/HC), 0, HW-1); }
function construireHash(){
  head.fill(-1);
  if (suiv.length < G.agents.length) suiv = new Int32Array(G.agents.length * 2);
  for (let i = 0; i < G.agents.length; i++){
    const a = G.agents[i]; if (!collide(a)) continue;
    const h = hashCell(a.x, a.y); suiv[i] = head[h]; head[h] = i;
  }
}
const collide = a => a.vivant && (a.crs || a.st === 'ok' || a.st === 'panic');
function voisins(x, y, R, fn){
  const cx0 = Math.floor((x - R + HOX)/HC), cx1 = Math.floor((x + R + HOX)/HC), cy0 = Math.floor((y - R + HOY)/HC), cy1 = Math.floor((y + R + HOY)/HC);
  for (let cy = Math.max(0, cy0); cy <= Math.min(HH-1, cy1); cy++) for (let cx = Math.max(0, cx0); cx <= Math.min(HW-1, cx1); cx++)
    for (let j = head[cy*HW+cx]; j >= 0; j = suiv[j]) fn(G.agents[j], j);
}

/* ---------- collisions ---------- */
function solideA(tx, ty){
  if (tx >= 0 && ty >= 0 && tx < MW && ty < MH) return SOLID[ty*MW+tx];
  const cx = clamp(tx, 0, MW-1), cy = clamp(ty, 0, MH-1);
  if (KIND[cy*MW+cx] !== 1) return 1;
  // hors carte dans le prolongement d'une rue : libre seulement dans l'axe de la rue
  if ((tx < 0 || tx >= MW) && (ty < 0 || ty >= MH)) return 1;
  return 0;
}
function murs(a){
  const r = a.r;
  const x0 = Math.floor((a.x - r)/T), x1 = Math.floor((a.x + r)/T), y0 = Math.floor((a.y - r)/T), y1 = Math.floor((a.y + r)/T);
  for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++){
    if (!solideA(tx, ty)) continue;
    const nx = clamp(a.x, tx*T, tx*T + T), ny = clamp(a.y, ty*T, ty*T + T);
    let dx = a.x - nx, dy = a.y - ny, d = Math.hypot(dx, dy);
    if (d >= r) continue;
    if (d < 1e-4){
      const l = a.x - tx*T, rr = tx*T + T - a.x, u = a.y - ty*T, b = ty*T + T - a.y, m = Math.min(l, rr, u, b);
      if (m === l) a.x = tx*T - r; else if (m === rr) a.x = tx*T + T + r; else if (m === u) a.y = ty*T - r; else a.y = ty*T + T + r;
    } else { a.x += dx/d*(r - d); a.y += dy/d*(r - d); a.comp += (r - d)*.5; }
  }
  for (const o of OBST_C){
    const dx = a.x - o.x, dy = a.y - o.y, d = Math.hypot(dx, dy), m = o.r + a.r;
    if (d < m && d > 1e-4){ a.x += dx/d*(m - d); a.y += dy/d*(m - d); }
  }
  for (const b of METROS){
    const nx = clamp(a.x, b.x0, b.x1), ny = clamp(a.y, b.y0, b.y1), dx = a.x - nx, dy = a.y - ny, d = Math.hypot(dx, dy);
    if (d < a.r){ if (d > 1e-4){ a.x += dx/d*(a.r - d); a.y += dy/d*(a.r - d); } else a.y = b.y1 + a.r; }
  }
}
function resoudre(){
  const A = G.agents;
  for (let i = 0; i < A.length; i++){
    const a = A[i]; if (!collide(a)) continue;
    voisins(a.x, a.y, 7, (b, j) => {
      if (j <= i) return;
      if (a.crs && b.crs && a.cordon === b.cordon) return;
      const dx = b.x - a.x, dy = b.y - a.y, m = a.r + b.r, d2 = dx*dx + dy*dy;
      if (d2 >= m*m) return;
      let d = Math.sqrt(d2), nx, ny;
      if (d < 1e-4){ const ang = Math.random()*6.283; nx = Math.cos(ang); ny = Math.sin(ang); d = 0; } else { nx = dx/d; ny = dy/d; }
      const o = m - d, wa = 1/a.m, wb = 1/b.m, ws = wa + wb;
      a.x -= nx*o*wa/ws; a.y -= ny*o*wa/ws; b.x += nx*o*wb/ws; b.y += ny*o*wb/ws;
      if (!a.crs) a.comp += o*wa/ws; if (!b.crs) b.comp += o*wb/ws;
      if (a.crs !== b.crs){ const c = a.crs ? a : b, m2 = a.crs ? b : a; if (c.cordon && c.cordon.etat === 'charge') contactCharge(c, m2); }
    });
  }
  // banderoles : un mur pour les CRS
  for (const bn of G.bans){
    if (!bn.vivant || !bn.up) continue;
    const ax = bn.a.x, ay = bn.a.y - 2, bx = bn.b.x, by = bn.b.y - 2;
    voisins((ax+bx)/2, (ay+by)/2, 16, c => {
      if (!c.crs) return;
      const vx = bx - ax, vy = by - ay, l2 = vx*vx + vy*vy || 1;
      const t = clamp(((c.x - ax)*vx + (c.y - ay)*vy)/l2, 0, 1), px = ax + vx*t, py = ay + vy*t;
      const dx = c.x - px, dy = c.y - py, d = Math.hypot(dx, dy), m = c.r + 1.5;
      if (d < m && d > 1e-4){ c.x += dx/d*(m - d); c.y += dy/d*(m - d); if (c.cordon && c.cordon.etat === 'charge') stopperCharge(c.cordon, bn); }
    });
  }
}
function contactCharge(c, m){
  const cord = c.cordon;
  if (m.st !== 'ok' && m.st !== 'panic') return;
  const cle = cord.id + ':' + cord.nCharge;
  if (m.heurt === cle) return;
  m.heurt = cle;
  paniquer(m, c.x, c.y, 0);
  if (m.role === 'ban' && G.bans.some(b => b.up && b.vivant && (b.a === m || b.b === m))) return;
  if (!c.prise && cord.grabs < 1 + save.rep && Math.random() < G.grabP * (cord.filme ? .5 : 1)){
    c.prise = true; cord.grabs++;
    interpeller(m, cord);
  } else if (Math.random() < .07){ tomber(m, 'charge'); }
}
function stopperCharge(c, bn){
  if (c.etat !== 'charge') return;
  c.etat = 'recul'; c.t = 0;
  bn.hp--;
  flottant(bn.x, bn.y - 14, bn.hp > 0 ? 'TENU !' : 'ARRACHÉE', bn.hp > 0 ? 'vert.11' : 'rouge.10');
  if (Math.random() < .5) tick('bloque');
  if (bn.hp <= 0) lacher(bn);
}
function lacher(bn){
  bn.vivant = false;
  for (const h of [bn.a, bn.b]) if (h.role === 'ban'){ h.role = null; if (h.st === 'ok') paniquer(h, bn.x - bn.uy*10, bn.y + bn.ux*10, 0); }
}

/* ---------- états des manifestants ---------- */
function paniquer(a, sx, sy, gen){
  if (a.crs || (a.st !== 'ok' && a.st !== 'panic')) return;
  if (a.role === 'ban' && G.bans.some(b => b.up && b.vivant && (b.a === a || b.b === a))) return;
  a.st = 'panic'; a.pan = rnd(1.2, 2.2); a.panX = sx; a.panY = sy; a.gen = gen;
}
function tomber(a, cause){
  if (a.st !== 'ok' && a.st !== 'panic') return;
  G.chutes = G.chutes || {}; G.chutes[cause || '?'] = (G.chutes[cause || '?'] || 0) + 1;
  if (a.role === 'meg' && G.meg && G.meg.h === a) G.meg.h = null;
  a.st = 'sol'; a.t = 0; a.leve = 0; a.vx = a.vy = 0;
  if (Math.random() < .3) tick('down');
}
function interpeller(a, cord){
  if (a.role === 'film' && a.preuves){ G.perdues += a.preuves; flottant(a.x, a.y - 14, 'TÉLÉPHONE SAISI', 'rouge.10'); a.preuves = 0; }
  if (a.role === 'meg' && G.meg && G.meg.h === a) G.meg.h = null;
  for (const bn of G.bans) if (bn.vivant && (bn.a === a || bn.b === a)) lacher(bn);
  a.st = 'emmene'; a.role = null; a.t = 0;
  const ux = cord.p1.x - cord.p0.x, uy = cord.p1.y - cord.p0.y;
  a.gx = cord.p0.x + ux*.5 - cord.n.x*16; a.gy = cord.p0.y + uy*.5 - cord.n.y*16;
  if (cord.kind === 'nasse'){ a.gx = clamp(a.x, 30, PW-30); a.gy = cord.n.y > 0 ? -12 : PH + 12; }
  a.escorte = cord.crs[0] ? cord.crs[0].ind : null;
  flottant(a.x, a.y - 12, 'GAV', 'rouge.11');
  preuve(a.x, a.y);
  if (Math.random() < .4) tick('grab');
}

/* ---------- mise à jour ---------- */
function pas(dt){
  G.t += dt;
  while (G.events.length && G.events[0].t <= G.t) G.events.shift().fn();
  arrivee(dt);
  for (const r of RUES) if (r.repos > 0) r.repos -= dt;
  // la police renvoie un cordon sur une rue reprise, une fois le calme revenu
  if (!G.demo && G.phase === 1) for (const r of RUES) if (!r.cordon && r.repos <= 0 && r.repris){ r.repris = false; fermerRue(r); }
  for (const r of RUES) if (r.cordon && r.cordon.etat === 'replie' && r.repos > 0) r.repris = true;
  champT -= dt; if (champT <= 0){ calculerChamp(); champT = .5; }
  if (G.agents.length > 60 && G.agents.some(a => !a.vivant)) G.agents = G.agents.filter(a => a.vivant);
  construireHash();
  for (const c of G.cordons) if (c.vivant) majCordon(c, dt);
  G.cordons = G.cordons.filter(c => c.vivant);
  // charges
  G.chargeT -= dt;
  if (G.chargeT <= 0){ G.chargeT = lancerCharge() ? G.chargeInt * rnd(.8, 1.2) : 2; }
  // grenades
  G.grenT -= dt;
  if (G.grenT <= 0){ G.grenT = G.grenInt * rnd(.8, 1.2); lancerGrenade(); }
  majProjs(dt); majGaz(dt);
  majBans(dt);
  majManifs(dt);
  // intégration
  for (const a of G.agents){
    if (!a.vivant) continue;
    a.comp = 0;
    if (a.crs || a.st === 'ok' || a.st === 'panic'){ a.x += a.vx*dt; a.y += a.vy*dt; }
  }
  construireHash();
  resoudre(); resoudre();
  for (const a of G.agents) if (collide(a) && !(a.crs && (a.x < 0 || a.y < 0 || a.x > PW || a.y > PH))) murs(a);
  apres(dt);
  if (G.meg){ G.meg.t -= dt; if (G.meg.t <= 0){ if (G.meg.h && G.meg.h.role === 'meg') G.meg.h.role = null; G.meg = null; } }
  if (G.tap){ G.tap.t += dt; if (G.tap.t > .5) G.tap = null; }
  for (const f of G.floats) f.t += dt; G.floats = G.floats.filter(f => f.t < 1.3);
  if (G.flash){ G.flash.t -= dt; if (G.flash.t <= 0) G.flash = null; }
  if (G.phase === 1 && !G.demo) G.tenue += dt * G.agents.filter(a => !a.crs && (a.st === 'ok' || a.st === 'panic')).length / 60;
  G.idleT += dt; if (!tickBusy && G.idleT > 6){ G.idleT = 0; tick('idle'); }
  if (!G.demo) finie();
}
function majManifs(dt){
  const megR = 105 + 12*L('sono');
  for (const a of G.agents){
    if (a.crs || !a.vivant) continue;
    a.ph += dt * (a.st === 'panic' ? 9 : 5) * (Math.hypot(a.vx, a.vy) > 3 ? 1 : 0);
    if (a.st === 'emmene'){
      const dx = a.gx - a.x, dy = a.gy - a.y, d = Math.hypot(dx, dy);
      if (d < 3 || a.x < -10 || a.y < -10 || a.x > PW + 10 || a.y > PH + 10){ a.vivant = false; a.st = 'gav'; G.gav++; continue; }
      a.x += dx/d*24*dt; a.y += dy/d*24*dt; a.face = dx > 0 ? 1 : -1; a.ph += dt*6;
      continue;
    }
    if (a.st === 'sol'){
      a.t += dt;
      if (a.t > 9){ a.vivant = false; a.st = 'blesse'; G.blesses++; flottant(a.x, a.y - 8, 'ÉVACUÉ', 'rouge.10'); }
      continue;
    }
    let tx = 0, ty = 0, v = MANIF_V * (a.type === 'black_bloc' ? 1.1 : 1);
    if (a.st === 'panic'){
      a.pan -= dt; if (a.pan <= 0){ a.st = 'ok'; }
      let dx = a.x - a.panX, dy = a.y - a.panY, l = Math.hypot(dx, dy) || 1;
      tx = dx/l + rnd(-.4, .4); ty = dy/l + rnd(-.4, .4); v = PANIC_V;
      // contagion
      if (a.gen < 2) voisins(a.x, a.y, 7, b => {
        if (b.crs || b.st !== 'ok' || b.role === 'med' || Math.random() > 1.4*dt) return;
        let calme = false; voisins(b.x, b.y, 18, m => { if (m.role === 'med') calme = true; });
        if (calme && Math.random() < .7) return;
        paniquer(b, a.panX, a.panY, a.gen + 1);
      });
    } else if (a.role === 'ban'){
      const bn = G.bans.find(b => b.vivant && (b.a === a || b.b === a));
      if (!bn){ a.role = null; continue; }
      const sgn = bn.a === a ? -1 : 1, gx = bn.x + bn.ux*7*sgn, gy = bn.y + bn.uy*7*sgn;
      const dx = gx - a.x, dy = gy - a.y, d = Math.hypot(dx, dy);
      if (bn.up){ a.vx = dx*5; a.vy = dy*5; a.m = 40; a.face = bn.uy > .5 ? -sgn : (cordonProche(a.x, a.y) ? (cordonProche(a.x, a.y).p0.x/2 + cordonProche(a.x, a.y).p1.x/2 > a.x ? 1 : -1) : sgn); continue; }
      if (d > 1){ tx = dx/d; ty = dy/d; v = 30; } else { tx = ty = 0; }
    } else if (a.role === 'med'){
      let cible = null, bd = 90*90;
      for (const b of G.agents){ if (b.st !== 'sol' || !b.vivant) continue; const d = (b.x-a.x)**2 + (b.y-a.y)**2; if (d < bd){ bd = d; cible = b; } }
      if (cible){
        const dx = cible.x - a.x, dy = cible.y - a.y, d = Math.hypot(dx, dy);
        if (d < 6){ cible.leve += dt; tx = ty = 0; if (cible.leve > 1){ cible.st = 'ok'; cible.t = 0; flottant(cible.x, cible.y - 12, 'RELEVÉ', 'vert.11'); } }
        else { tx = dx/d; ty = dy/d; v = 26; }
      } else { const g = but(a, megR); tx = g.x; ty = g.y; v = g.v; }
    } else if (a.role === 'film'){
      a.bat -= dt;
      if (a.bat <= 0){ a.role = null; G.preuves += a.preuves; if (a.preuves) flottant(a.x, a.y - 14, a.preuves + ' PREUVES', 'jaune.13'); a.preuves = 0; continue; }
      const dx = a.fx - a.x, dy = a.fy - a.y, d = Math.hypot(dx, dy);
      if (d > 3){ tx = dx/d; ty = dy/d; v = 22; }
      const c = cordonProche(a.x, a.y);
      if (c){ const cx = (c.p0.x + c.p1.x)/2 + c.n.x*c.s, cy = (c.p0.y + c.p1.y)/2 + c.n.y*c.s; a.aim = Math.atan2(cy - a.y, cx - a.x); }
      if (G.phase === 2 && G.t > P2 - 12){ const g = but(a, megR); tx = g.x; ty = g.y; v = g.v; }
    } else {
      const g = but(a, megR); tx = g.x; ty = g.y; v = g.v;
    }
    // les gens s'écartent des CRS qui ne chargent pas, sauf les têtus
    if (a.st === 'ok' && !a.tetu && a.role !== 'ban'){
      voisins(a.x, a.y, 11, c => { if (!c.crs || !c.vivant) return; const dx = a.x - c.x, dy = a.y - c.y, d = Math.hypot(dx, dy) || 1; tx += dx/d*.9*(1 - d/11); ty += dy/d*.9*(1 - d/11); });
    }
    const l = Math.hypot(tx, ty);
    const dvx = l > .01 ? tx/l*v*Math.min(1, l) : 0, dvy = l > .01 ? ty/l*v*Math.min(1, l) : 0;
    const k = Math.min(1, dt*8);
    a.dvx = dvx; a.dvy = dvy;
    a.vx += (dvx - a.vx)*k; a.vy += (dvy - a.vy)*k;
    if (Math.abs(a.vx) > 3) a.face = a.vx > 0 ? 1 : -1;
  }
}
// Où va un manifestant sans rôle : mégaphone, sinon sortie (phase 2), sinon sa place dans le rassemblement.
function but(a, megR){
  if (G.meg){
    const dx = G.meg.x - a.x, dy = G.meg.y - a.y, d = Math.hypot(dx, dy);
    if (d < megR || a === G.meg.h){
      if (G.phase === 2 && d < 16 && a !== G.meg.h) a.part = true;
      const v = d < 10 ? 8 : 21;
      return { x: dx/(d||1), y: dy/(d||1), v };
    }
  }
  if (G.phase === 2 && a.part){
    const dir = dirChamp(a.x, a.y);
    if (dir) return { x: dir.x, y: dir.y, v: 20 };
  }
  a.homeT -= 1/60;
  if (a.homeT <= 0){ choisirHome(a); a.homeT = rnd(6, 14); }
  // les têtus vont au contact du cordon le plus proche
  if (a.tetu && G.phase === 1){
    let best = null, bd = (a.type === 'black_bloc' ? 70 : 40) ** 2;
    voisins(a.x, a.y, 70, c => { if (!c.crs || !c.vivant || c.cordon.etat === 'replie') return; const d = (c.x-a.x)**2 + (c.y-a.y)**2; if (d < bd){ bd = d; best = c; } });
    if (best){ const dx = best.x - a.x, dy = best.y - a.y, d = Math.hypot(dx, dy) || 1; return { x: dx/d, y: dy/d, v: 16 }; }
  }
  const dx = a.hx - a.x, dy = a.hy - a.y, d = Math.hypot(dx, dy);
  if (d < 6) return { x: 0, y: 0, v: 0 };
  return { x: dx/d, y: dy/d, v: d < 20 ? 8 : 15 };
}
function apres(dt){
  for (const a of G.agents){
    if (a.crs || !a.vivant) continue;
    if (G.phase === 2 && a.st === 'ok' && !a.part && !a.role && Math.random() < .08*dt){
      voisins(a.x, a.y, 8, b => { if (!b.crs && b.part && Math.hypot(b.vx, b.vy) > 6) a.part = true; });
    }
    if (a.st === 'ok' || a.st === 'panic'){
      a.pr += (a.comp*60 - a.pr) * Math.min(1, dt*3);
      if (a.st === 'panic' && a.pr > 75 && Math.random() < (a.pr - 75)*.0015*dt) tomber(a, 'bousculade');
      // sortie
      if (a.x < -2 || a.y < -2 || a.x > PW + 2 || a.y > PH + 2){
        const r = rueDe(a.x, a.y);
        if (G.phase === 2 && r && rueOuverte(r)){
          a.vivant = false; a.st = 'sorti'; G.sortis++;
          if (a.role === 'film'){ G.preuves += a.preuves; a.preuves = 0; }
          if (Math.random() < .04) tick('exit');
        } else { a.x = clamp(a.x, 1, PW-1); a.y = clamp(a.y, 1, PH-1); }
      }
    }
  }
  // CRS en charge : bousculade devant eux
  for (const c of G.cordons){
    if (c.etat !== 'charge') continue;
    for (const k of c.crs) voisins(k.x + c.n.x*4, k.y + c.n.y*4, 9, m => {
      if (m.crs || m.st !== 'ok') return;
      if (Math.random() < 6*dt) paniquer(m, k.x - c.n.x*6, k.y - c.n.y*6, 0);
    });
    if (Math.random() < 2*dt) preuve((c.p0.x + c.p1.x)/2 + c.n.x*c.s, (c.p0.y + c.p1.y)/2 + c.n.y*c.s);
  }
}
function rueDe(x, y){
  for (const r of RUES){
    if (r.cote === 'haut' && y < 0 && x >= r.p0.x && x <= r.p1.x) return r;
    if (r.cote === 'bas' && y > PH && x >= r.p0.x && x <= r.p1.x) return r;
    if (r.cote === 'gauche' && x < 0 && y >= r.p0.y && y <= r.p1.y) return r;
    if (r.cote === 'droite' && x > PW && y >= r.p0.y && y <= r.p1.y) return r;
  }
  return null;
}
function majBans(dt){
  for (const bn of G.bans){
    if (!bn.vivant) continue;
    if (!bn.a.vivant || !bn.b.vivant || bn.a.st !== 'ok' && bn.a.st !== 'panic' || bn.b.st !== 'ok' && bn.b.st !== 'panic'){ lacher(bn); continue; }
    if (!bn.up){
      const da = Math.hypot(bn.a.x - (bn.x - bn.ux*7), bn.a.y - (bn.y - bn.uy*7)), db = Math.hypot(bn.b.x - (bn.x + bn.ux*7), bn.b.y - (bn.y + bn.uy*7));
      bn.t += dt;
      if ((da < 3 && db < 3) || bn.t > 6) bn.up = true;
      continue;
    }
    bn.dur -= dt;
    if (bn.dur <= 0){ bn.vivant = false; for (const h of [bn.a, bn.b]){ h.role = null; h.m = 1; } }
  }
  G.bans = G.bans.filter(b => b.vivant);
  for (const a of G.agents) if (!a.crs && a.role !== 'ban' && a.m > 2) a.m = a.type === 'black_bloc' ? 1.4 : 1;
}
function lancerGrenade(){
  const vivants = G.agents.filter(a => !a.crs && a.st === 'ok');
  const cords = G.cordons.filter(c => c.vivant && c.etat !== 'replie');
  if (vivants.length < 8 || !cords.length) return;
  let best = null, bn = 0;
  for (let k = 0; k < 18; k++){
    const a = pick(vivants); let n = 0;
    voisins(a.x, a.y, 14, b => { if (!b.crs) n++; });
    if (n > bn){ bn = n; best = a; }
  }
  if (!best) return;
  let src = null, sd = Infinity;
  for (const c of cords) for (const k of c.crs){ const d = (k.x - best.x)**2 + (k.y - best.y)**2; if (d < sd && d > 25*25){ sd = d; src = k; } }
  if (!src || sd > 120*120) return;
  G.projs.push({ x0: src.x, y0: src.y - 6, x1: best.x + rnd(-6, 6), y1: best.y + rnd(-6, 6), t: 0, d: .9 });
}
function majProjs(dt){
  for (const p of G.projs){
    p.t += dt;
    if (p.t >= p.d){ p.fait = true; G.gas.push({ x: p.x1, y: p.y1, r: 3, t: 0, vie: 8 }); champT = 0; if (Math.random() < .35) tick('gas'); }
  }
  G.projs = G.projs.filter(p => !p.fait);
}
function majGaz(dt){
  for (const g of G.gas){
    g.t += dt; g.r = Math.min(21, 3 + g.t*16); g.x += Math.sin(g.t*.7)*1.5*dt; g.y -= 1.2*dt;
    voisins(g.x, g.y, g.r, a => {
      if (a.crs || a.st !== 'ok') return;
      if (Math.hypot(a.x - g.x, a.y - g.y) > g.r) return;
      if (Math.random() < 3*dt*(1 - .2*L('goggles'))) paniquer(a, g.x, g.y, 0);
    });
    voisins(g.x, g.y, g.r, a => { if (!a.crs && a.st === 'panic' && Math.random() < .03*dt) tomber(a, 'gaz'); });
  }
  G.gas = G.gas.filter(g => g.t < g.vie);
}
function finie(){
  if (G.fin) return;
  let reste = 0; for (const a of G.agents) if (!a.crs && a.vivant && (a.st === 'ok' || a.st === 'panic' || a.st === 'sol' || a.st === 'emmene')) reste++;
  if (G.t >= P2 || (G.phase === 2 && reste === 0)){
    G.fin = true;
    // ceux qui restent sur la place à la fin sont nassés : contrôle d'identité et GAV pour une partie
    let nasses = 0; for (const a of G.agents) if (!a.crs && a.vivant && (a.st === 'ok' || a.st === 'panic')) nasses++;
    for (const f of G.agents) if (f.role === 'film' && f.vivant){ G.preuves += f.preuves; f.preuves = 0; }
    G.nasses_ = nasses;
    setTimeout(() => finPartie(), 900);
  }
}

/* ---------- rendu ---------- */
const cv = $('cv'), ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;
const fond = document.createElement('canvas'); fond.width = PW; fond.height = PH;
function rng(seed){ return S.hasard(seed); }
function peindreFond(){
  const g = fond.getContext('2d'), R = rng(1710);
  const px = (x, y, c) => { g.fillStyle = C(c); g.fillRect(x, y, 1, 1); };
  const rect = (x, y, w, h, c) => { g.fillStyle = C(c); g.fillRect(x, y, w, h); };
  // sol
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++){
    const k = KIND[ty*MW+tx], x = tx*T, y = ty*T;
    if (k === 1){ rect(x, y, T, T, 'bitume.4'); for (let i = 0; i < 9; i++) px(x + (R()*T|0), y + (R()*T|0), R() < .5 ? 'bitume.3' : 'bitume.5'); }
    if (k === 2){
      rect(x, y, T, T, 'bitume.10');
      // dalles de 12 × 6 décalées
      rect(x, y, T, 1, 'bitume.9'); rect(x, y + 6, T, 1, 'bitume.9');
      rect(x + ((ty % 2) ? 0 : 6), y, 1, 6, 'bitume.9'); rect(x + ((ty % 2) ? 6 : 0), y + 6, 1, 6, 'bitume.9');
      for (let i = 0; i < 3; i++) px(x + (R()*T|0), y + (R()*T|0), R() < .5 ? 'bitume.11' : 'bitume.8');
    }
  }
  // trottoirs et bordures le long du bâti
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++){
    if (SOLID[ty*MW+tx]) continue;
    const x = tx*T, y = ty*T, k = KIND[ty*MW+tx];
    const s = (dx, dy) => { const nx = tx + dx, ny = ty + dy; return nx >= 0 && ny >= 0 && nx < MW && ny < MH && SOLID[ny*MW+nx]; };
    const tw = k === 1 ? 4 : 3, tc = k === 1 ? 'bitume.6' : 'bitume.8', bc = k === 1 ? 'bitume.8' : 'bitume.7';
    if (s(-1, 0)){ rect(x, y, tw, T, tc); rect(x + tw, y, 1, T, bc); }
    if (s(1, 0)){ rect(x + T - tw, y, tw, T, tc); rect(x + T - tw - 1, y, 1, T, bc); }
    if (s(0, -1)){ rect(x, y, T, tw, tc); rect(x, y + tw, T, 1, bc); }
    if (s(0, 1)){ rect(x, y + T - tw, T, tw, tc); rect(x, y + T - tw - 1, T, 1, bc); }
  }
  // passages piétons à l'entrée de chaque rue
  for (const r of RUES){
    const prof = r.prof - 5;
    if (r.cote === 'haut' || r.cote === 'bas'){
      const y = r.cote === 'haut' ? prof - 3 : PH - prof;
      for (let x = r.p0.x + 2; x < r.p1.x - 2; x += 3) rect(x, y, 2, 4, 'pierre.13');
    } else {
      const x = r.cote === 'gauche' ? prof - 3 : PW - prof;
      for (let y = r.p0.y + 2; y < r.p1.y - 2; y += 3) rect(x, y, 4, 2, 'pierre.13');
    }
  }
  // toits en zinc
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++){
    if (!SOLID[ty*MW+tx]) continue;
    const x = tx*T, y = ty*T;
    rect(x, y, T, T, 'acier.6');
    for (let yy = 2; yy < T; yy += 4) rect(x, y + yy, T, 1, 'acier.5');
    if (R() < .45){ const cx = x + 2 + (R()*7|0), cy = y + 1 + (R()*6|0); rect(cx, cy, 4, 3, 'brun.5'); rect(cx, cy, 4, 1, 'brun.7'); px(cx + 1, cy - 1, 'orange.6'); px(cx + 2, cy - 1, 'orange.5'); }
    if (R() < .35){ const lx = x + 1 + (R()*8|0), ly = y + 4 + (R()*5|0); rect(lx, ly, 3, 3, 'acier.8'); px(lx + 1, ly + 1, 'acier.2'); }
  }
  // façades haussmanniennes : le bord sud de chaque bloc (faux trois-quarts)
  for (let ty = 0; ty < MH; ty++) for (let tx = 0; tx < MW; tx++){
    if (!SOLID[ty*MW+tx]) continue;
    if (ty + 1 >= MH || SOLID[(ty+1)*MW+tx]) continue;
    const x = tx*T, y = ty*T + 2;
    rect(x, y, T, 10, 'pierre.11');
    rect(x, y, T, 1, 'pierre.8');
    rect(x, y + 4, T, 1, 'gris.3');                    // balcon filant
    for (const wx of [1, 5, 9]){ rect(x + wx, y + 1, 2, 3, 'acier.2'); rect(x + wx, y + 5, 2, 2, 'acier.2'); }
    const ent = (tx*7 + ty) % 4;
    if (ent === 0){ rect(x + 1, y + 7, 10, 3, 'rouge.5'); rect(x + 1, y + 7, 10, 1, 'rouge.7'); }           // store de café
    else if (ent === 1){ rect(x + 4, y + 7, 4, 3, 'brun.3'); }                                                 // porte cochère
    else if (ent === 2){ rect(x + 1, y + 7, 10, 3, 'vert.3'); rect(x + 1, y + 7, 10, 1, 'vert.5'); }
    else { rect(x + 1, y + 7, 10, 3, 'acier.3'); }
    rect(x, y + 9, T, 1, 'pierre.7');
  }
  // noms de rues peints dans la rue
  for (const r of RUES){
    const w = texteL(r.court);
    if (r.cote === 'haut') texte(g, r.court, Math.round(r.mx), 2, C('bitume.11'), { centre: true, ombre: C('bitume.2') });
    else if (r.cote === 'bas') texte(g, r.court, Math.round(r.mx), PH - 7, C('bitume.11'), { centre: true, ombre: C('bitume.2') });
    else {
      const tmp = document.createElement('canvas'); tmp.width = w + 1; tmp.height = 6;
      texte(tmp.getContext('2d'), r.court, 0, 0, C('bitume.11'), { ombre: C('bitume.2') });
      g.save(); g.translate(r.cote === 'gauche' ? 2 : PW - 2, Math.round(r.my));
      g.rotate(r.cote === 'gauche' ? -Math.PI/2 : Math.PI/2); g.drawImage(tmp, -Math.floor(w/2), 0); g.restore();
    }
  }
  // ombres des arbres
  for (const a of ARBRES){ g.fillStyle = 'rgba(0,0,0,.18)'; g.beginPath(); g.ellipse(a.x + 1, a.y, 6, 3, 0, 0, 7); g.fill(); }
  // socle de la statue (le sol)
  const sx = STATUE.x, sy = STATUE.y;
  for (const [rr, c] of [[15, 'pierre.8'], [13, 'pierre.10'], [11, 'pierre.9']]){ g.fillStyle = C(c); g.beginPath(); g.ellipse(sx, sy, rr, rr*.62, 0, 0, 7); g.fill(); }
  // bouches de métro : rambardes vertes
  for (const m of METROS){
    rect(m.x0, m.y0, m.x1 - m.x0, m.y1 - m.y0, 'bitume.3');
    for (let yy = m.y0 + 1; yy < m.y1; yy += 2) rect(m.x0 + 1, yy, m.x1 - m.x0 - 2, 1, 'bitume.2');
    rect(m.x0, m.y0, m.x1 - m.x0, 1, 'vert.3'); rect(m.x0, m.y0, 1, m.y1 - m.y0, 'vert.3'); rect(m.x1 - 1, m.y0, 1, m.y1 - m.y0, 'vert.3');
  }
}
// sprites du décor (triés avec les persos)
function dessinerArbre(g, a){
  const x = Math.round(a.x), y = Math.round(a.y);
  g.fillStyle = C('brun.3'); g.fillRect(x - 1, y - 6, 2, 6);
  const blob = (cx, cy, r, c) => { g.fillStyle = C(c); for (let dy = -r; dy <= r; dy++){ const w = Math.round(Math.sqrt(r*r - dy*dy)); g.fillRect(cx - w, cy + dy, w*2 + 1, 1); } };
  blob(x, y - 11, 6, 'vert.2'); blob(x - 1, y - 12, 5, 'vert.4'); blob(x - 2, y - 13, 3, 'vert.5');
  g.fillStyle = C('vert.6'); g.fillRect(x - 3, y - 15, 2, 1); g.fillRect(x + 1, y - 13, 1, 1);
}
function dessinerStatue(g){
  const x = STATUE.x, y = STATUE.y;
  g.fillStyle = C('pierre.11'); g.fillRect(x - 5, y - 26, 10, 26);
  g.fillStyle = C('pierre.9'); g.fillRect(x + 3, y - 26, 2, 26); g.fillRect(x - 5, y - 2, 10, 2);
  g.fillStyle = C('pierre.13'); g.fillRect(x - 6, y - 27, 12, 2);
  g.fillStyle = C('sarcelle.4'); g.fillRect(x - 2, y - 36, 4, 9); g.fillRect(x - 3, y - 31, 6, 4);
  g.fillStyle = C('sarcelle.6'); g.fillRect(x - 1, y - 39, 2, 3); g.fillRect(x + 2, y - 44, 1, 9); g.fillRect(x + 1, y - 45, 3, 2);
  g.fillStyle = C('sarcelle.8'); g.fillRect(x - 1, y - 35, 1, 6);
}
function dessinerMetro(g, m){
  const x = m.x0 - 2, y = m.y1;
  g.fillStyle = C('vert.2'); g.fillRect(x, y - 14, 1, 14);
  g.fillStyle = C(G.metro === false ? 'gris.6' : 'jaune.9'); g.fillRect(x - 3, y - 19, 7, 6);
  g.fillStyle = C('gris.1'); g.fillRect(x - 2, y - 18, 1, 4); g.fillRect(x + 2, y - 18, 1, 4); g.fillRect(x - 1, y - 17, 1, 1); g.fillRect(x + 1, y - 17, 1, 1); g.fillRect(x, y - 16, 1, 1);
  if (G.metro === false){ g.fillStyle = C('rouge.8'); g.fillRect(m.x0 + 2, m.y0 + 2, m.x1 - m.x0 - 4, 2); }
}
function dessinerFourgon(g, r){
  const c = r.cordon; if (!c || !c.vivant) return;
  const horiz = r.cote === 'gauche' || r.cote === 'droite';
  const mx = Math.round(r.mx - r.n.x*(horiz ? 2 : 0)), my = Math.round(r.my);
  const w = horiz ? 20 : 10, h = horiz ? 10 : 20;
  let x = mx - w/2, y = my - h/2;
  if (r.cote === 'haut') y = -9; if (r.cote === 'bas') y = PH - h + 9;
  if (r.cote === 'gauche') x = -10; if (r.cote === 'droite') x = PW - w + 10;
  if (c.etat === 'replie') { if (r.cote === 'haut') y -= c.t*14; if (r.cote === 'bas') y += c.t*14; if (r.cote === 'gauche') x -= c.t*14; if (r.cote === 'droite') x += c.t*14; }
  g.fillStyle = C('marine.2'); g.fillRect(x, y, w, h);
  g.fillStyle = C('marine.4'); g.fillRect(x + 1, y + 1, w - 2, h - 2);
  g.fillStyle = C('gris.13'); if (horiz) g.fillRect(x, y + 4, w, 1); else g.fillRect(x + 4, y, 1, h);
  g.fillStyle = C('acier.9'); if (horiz) g.fillRect(r.cote === 'gauche' ? x + w - 4 : x + 1, y + 1, 3, h - 2); else g.fillRect(x + 1, r.cote === 'haut' ? y + h - 4 : y + 1, w - 2, 3);
  const on = Math.floor(G.t*6) % 2;
  g.fillStyle = C(on ? 'bleu.12' : 'bleu.5'); g.fillRect(x + (horiz ? 8 : 3), y + (horiz ? 3 : 8), 2, 2);
  g.fillStyle = C(on ? 'bleu.5' : 'bleu.12'); g.fillRect(x + (horiz ? 10 : 5), y + (horiz ? 3 : 8), 2, 2);
}
const tampon = document.createElement('canvas'); tampon.width = 11; tampon.height = 11;
function dessinerPerso(a){
  const n = a.ph | 0, f = (n % NFR + NFR) % NFR;
  const bouge = Math.hypot(a.vx, a.vy) > 3;
  let x = a.x, y = a.y;
  if (a.crs){ x += a.jit || 0; }
  if (a.st === 'sol'){
    const im = S.rendre(D, a.ind, 'marche', 0);
    ctx.save(); ctx.translate(Math.round(x), Math.round(y)); ctx.rotate(a.face > 0 ? Math.PI/2 : -Math.PI/2);
    ctx.drawImage(im, -D.cadre.pied[0], -D.cadre.h + 2); ctx.restore();
    if (Math.floor(G.t*3) % 2){ ctx.fillStyle = C('rouge.9'); ctx.fillRect(Math.round(x), Math.round(y) - 7, 1, 3); ctx.fillRect(Math.round(x), Math.round(y) - 3, 1, 1); }
    return;
  }
  if (a.st === 'emmene'){
    S.dessiner(ctx, D, a.ind, 'marche', f, x, y - 2, { miroir: a.face > 0 });
    if (a.escorte) S.dessiner(ctx, D, a.escorte, 'marche', f, x - a.face*5, y + 1, { miroir: a.face > 0 });
    return;
  }
  const ff = (a.crs ? (a.cordon && (a.cordon.etat === 'charge' || a.cordon.etat === 'arrive' || a.cordon.etat === 'replie' || a.cordon.etat === 'recul')) : bouge) ? f : 0;
  let miroir = a.face > 0;
  if (a.crs && a.cordon){
    const c = a.cordon;
    if (c.n.x) miroir = c.n.x > 0; else miroir = a.idx % 2 === 0;
  }
  S.dessiner(ctx, D, a.ind, 'marche', ff, x, y + (a.st === 'panic' ? (Math.floor(G.t*14 + a.id) % 2) : 0), { miroir });
  const X = Math.round(x), Y = Math.round(y);
  if (a.st === 'panic' && Math.floor(G.t*5 + a.id) % 3 === 0){ ctx.fillStyle = C('gris.15'); ctx.fillRect(X + 2, Y - 13, 1, 2); ctx.fillRect(X + 2, Y - 10, 1, 1); }
  if (a.role === 'meg'){
    const d = miroir ? 1 : -1;
    ctx.fillStyle = C('gris.14'); ctx.fillRect(X + d*3 - (d < 0 ? 1 : 0), Y - 8, 2, 2); ctx.fillRect(X + d*5 - (d < 0 ? 1 : 0), Y - 9, 1, 4);
    if (G.meg && G.meg.h === a && Math.floor(G.t*4) % 2){ ctx.fillStyle = C('jaune.12'); ctx.fillRect(X + d*7, Y - 10, 1, 1); ctx.fillRect(X + d*8, Y - 8, 1, 2); ctx.fillRect(X + d*7, Y - 5, 1, 1); }
  }
  if (a.role === 'film'){
    ctx.fillStyle = C('jaune.15'); ctx.fillRect(X, Y - 13, 1, 1);
    if (Math.floor(G.t*2) % 2){ ctx.fillStyle = C('rouge.10'); ctx.fillRect(X + 1, Y - 13, 1, 1); }
  }
  if (a.crs && a.cordon && a.cordon.etat === 'prep' && Math.floor(G.t*8) % 2){ ctx.fillStyle = C('rouge.10'); ctx.fillRect(X, Y - 14, 1, 2); ctx.fillRect(X, Y - 11, 1, 1); }
}
function dessinerBanderole(bn){
  const ax = Math.round(bn.a.x), ay = Math.round(bn.a.y), bx = Math.round(bn.b.x), by = Math.round(bn.b.y);
  if (!bn.up){ return; }
  const x0 = Math.min(ax, bx), x1 = Math.max(ax, bx), top = Math.min(ay, by) - 10;
  const flott = Math.round(Math.sin(G.t*3)*0.6);
  ctx.fillStyle = C('brun.4'); ctx.fillRect(ax, ay - 11, 1, 9); ctx.fillRect(bx, by - 11, 1, 9);
  if (x1 - x0 >= 4){
    ctx.fillStyle = C('carton.12'); ctx.fillRect(x0 + 1, top + flott, x1 - x0 - 1, 5);
    ctx.fillStyle = C('carton.9'); ctx.fillRect(x0 + 1, top + 4 + flott, x1 - x0 - 1, 1);
    ctx.fillStyle = C('rouge.7');
    for (let x = x0 + 2; x < x1 - 1; x += 2) ctx.fillRect(x, top + 1 + ((x >> 1) % 2) + flott, 1, 2);
  } else {
    ctx.fillStyle = C('carton.12'); ctx.fillRect(x0 - 1, Math.min(ay, by) - 11, 3, Math.abs(ay - by) + 4);
  }
  for (let i = 0; i < bn.hp; i++){ ctx.fillStyle = C('vert.10'); ctx.fillRect(x0 + 1 + i*2, top - 3, 1, 1); }
}
function dessinerGaz(g0){
  const r = g0.r, a = 1 - Math.max(0, (g0.t - g0.vie + 2) / 2);
  const ph = Math.floor(G.t*6);
  ctx.globalAlpha = .7 * a;
  for (let y = -r; y <= r; y++){
    const w = Math.floor(Math.sqrt(r*r - y*y));
    for (let x = -w; x <= w; x++){
      const k = (x + y*3 + ph) & 3;
      if (k === 0 || (k === 2 && x*x + y*y < r*r*.4)){ ctx.fillStyle = C((x + y) & 4 ? 'jaune.14' : 'gris.14'); ctx.fillRect(Math.round(g0.x) + x, Math.round(g0.y) + y, 1, 1); }
    }
  }
  ctx.globalAlpha = 1;
}
function rendu(){
  ctx.drawImage(fond, 0, 0);
  // au sol : sorties ouvertes, chevrons de charge, mégaphone, tap
  if (mode === 'jeu' && G.phase === 2){
    for (const r of RUES){
      if (!rueOuverte(r)) continue;
      const on = Math.floor(G.t*3) % 2;
      const ox = -r.n.x, oy = -r.n.y;
      for (let k = 0; k < 3; k++){
        const d = r.prof - 8 - k*6 - (on ? 1 : 0);
        const cx = r.mx + r.n.x*d, cy = r.my + r.n.y*d;
        ctx.fillStyle = C('vert.10');
        for (let i = -2; i <= 2; i++){ const px = cx + (oy ? i : 0) + ox*(-Math.abs(i)), py = cy + (ox ? i : 0) + oy*(-Math.abs(i)); ctx.fillRect(Math.round(px), Math.round(py), 1, 1); }
      }
    }
  }
  for (const c of G.cordons){
    if (c.etat !== 'prep' || Math.floor(G.t*8) % 2) continue;
    const ux = c.p1.x - c.p0.x, uy = c.p1.y - c.p0.y;
    ctx.fillStyle = C('rouge.8');
    for (let u = .15; u < .9; u += .35) for (let k = 1; k <= 3; k++){
      const cx = c.p0.x + ux*u + c.n.x*(c.s + 6 + k*7), cy = c.p0.y + uy*u + c.n.y*(c.s + 6 + k*7);
      for (let i = -2; i <= 2; i++){ const px = cx + (c.n.y ? i : 0) - c.n.x*Math.abs(i), py = cy + (c.n.x ? i : 0) - c.n.y*Math.abs(i); ctx.fillRect(Math.round(px), Math.round(py), 1, 1); }
    }
  }
  if (G.meg){
    const r = 4 + (Math.floor(G.t*6) % 3);
    ctx.fillStyle = C('jaune.12');
    for (let k = 0; k < 12; k++){ const an = k/12*6.283 + G.t; ctx.fillRect(Math.round(G.meg.x + Math.cos(an)*r), Math.round(G.meg.y + Math.sin(an)*r*.7), 1, 1); }
  }
  for (const f of G.agents){
    if (f.role !== 'film' || f.st !== 'ok' || f.bat <= 0) continue;
    ctx.fillStyle = C('jaune.13'); ctx.globalAlpha = .28;
    const ox = Math.round(f.x), oy = Math.round(f.y) - 8, ph = Math.floor(G.t*4) % 4;
    for (let y = -78; y <= 78; y += 2) for (let x = -78 + ((y >> 1) & 1); x <= 78; x += 4){
      const d2 = x*x + y*y; if (d2 > 78*78 || d2 < 64) continue;
      const da = Math.abs(((Math.atan2(y, x) - f.aim + Math.PI*3) % (Math.PI*2)) - Math.PI);
      if (da < .75 && ((Math.sqrt(d2) | 0) >> 2) % 4 !== ph) ctx.fillRect(ox + x, oy + y, 1, 1);
    }
    ctx.globalAlpha = 1;
  }
  if (G.tap){ const r = 3 + G.tap.t*16; ctx.fillStyle = C('gris.15'); for (let k = 0; k < 10; k++){ const an = k/10*6.283; ctx.fillRect(Math.round(G.tap.x + Math.cos(an)*r), Math.round(G.tap.y + Math.sin(an)*r), 1, 1); } }
  // tout ce qui a des pieds, trié par profondeur
  const items = [];
  for (const a of G.agents) if (a.vivant) items.push([a.y, 0, a]);
  for (const t of ARBRES) items.push([t.y, 1, t]);
  items.push([STATUE.y, 2, null]);
  for (const m of METROS) items.push([m.y1, 3, m]);
  for (const r of RUES) if (r.cordon) items.push([r.cote === 'bas' ? PH + 20 : r.cote === 'haut' ? -20 : r.my + 5, 4, r]);
  for (const b of G.bans) if (b.up) items.push([Math.max(b.a.y, b.b.y) + .1, 5, b]);
  items.sort((p, q) => p[0] - q[0]);
  for (const [, k, o] of items){
    if (k === 0) dessinerPerso(o);
    else if (k === 1) dessinerArbre(ctx, o);
    else if (k === 2) dessinerStatue(ctx);
    else if (k === 3) dessinerMetro(ctx, o);
    else if (k === 4) dessinerFourgon(ctx, o);
    else dessinerBanderole(o);
  }
  for (const g of G.gas) dessinerGaz(g);
  for (const p of G.projs){
    const u = p.t / p.d, x = p.x0 + (p.x1 - p.x0)*u, y = p.y0 + (p.y1 - p.y0)*u - Math.sin(u*Math.PI)*22;
    ctx.fillStyle = C('gris.15'); ctx.fillRect(Math.round(x), Math.round(y), 2, 2);
    ctx.fillStyle = C('gris.10'); ctx.fillRect(Math.round(x - (p.x1 - p.x0)/p.d*.03), Math.round(y + 2), 1, 1);
  }
  for (const f of G.floats){
    const y = Math.round(f.y - f.t*12);
    if (f.t > 1 && Math.floor(f.t*10) % 2) continue;
    texte(ctx, f.s, Math.round(clamp(f.x, texteL(f.s)/2 + 1, PW - texteL(f.s)/2 - 1)), y, C(f.col), { centre: true, ombre: C('gris.0') });
  }
  if (G.flash && mode === 'jeu'){
    const y = 132, k = 2;
    ctx.fillStyle = 'rgba(10,10,20,.72)'; ctx.fillRect(0, y - 6, PW, G.flash.sous ? 28 : 22);
    ctx.fillStyle = C('rouge.8'); ctx.fillRect(0, y - 6, PW, 1); ctx.fillRect(0, y + (G.flash.sous ? 21 : 15), PW, 1);
    const titre = norm(G.flash.titre), kk = texteL(titre)*2 > PW - 8 ? 1 : k;
    texte(ctx, titre, PW/2, y + (kk === 1 ? 3 : 0), C('jaune.13'), { centre: true, k: kk, ombre: C('rouge.3') });
    if (G.flash.sous) texte(ctx, G.flash.sous.length > 44 ? G.flash.sous.slice(0, 43) + '.' : G.flash.sous, PW/2, y + 13, C('gris.14'), { centre: true });
  }
}

/* ---------- interface ---------- */
const stage = $('stage');
function taille(){
  const r = stage.getBoundingClientRect(), dpr = window.devicePixelRatio || 1;
  const w = r.width - 6, h = r.height - 6;
  if (w <= 0 || h <= 0) return;
  // On remplit toute la place disponible. On ne garde un agrandissement entier (pixels tous égaux)
  // que s'il fait perdre moins de 6 % de la taille.
  let k = Math.min(w / PW, h / PH);
  const ent = Math.floor(k * dpr) / dpr;
  if (ent > 0 && ent >= k * .94) k = ent;
  cv.style.width = Math.floor(PW * k) + 'px'; cv.style.height = Math.floor(PH * k) + 'px';
}
if (window.ResizeObserver) new ResizeObserver(taille).observe(stage);
window.addEventListener('resize', taille);
const outils = Array.from(document.querySelectorAll('.tool'));
function choisirOutil(t){ outil = t; outils.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === t))); }
outils.forEach(b => b.addEventListener('click', () => choisirOutil(b.dataset.tool)));
function majOutils(){
  $('nBan').textContent = charges.ban; $('nMed').textContent = charges.med; $('nFilm').textContent = charges.film;
  for (const b of outils) b.classList.toggle('vide', b.dataset.tool !== 'meg' && !(charges[b.dataset.tool] > 0));
}
cv.addEventListener('pointerdown', e => {
  e.preventDefault();
  const r = cv.getBoundingClientRect();
  const x = (e.clientX - r.left) / r.width * PW, y = (e.clientY - r.top) / r.height * PH;
  appliquerOutil(x, y);
});
document.addEventListener('keydown', e => {
  if (e.key === '1') choisirOutil('meg'); if (e.key === '2') choisirOutil('ban'); if (e.key === '3') choisirOutil('med'); if (e.key === '4') choisirOutil('film');
  if (e.key === ' ' && mode === 'jeu'){ e.preventDefault(); basculerPause(); }
});
$('bPause').addEventListener('click', () => { if (mode === 'jeu') basculerPause(); });
function basculerPause(){ paused = !paused; if (paused) ecran('pause'); else cacher(); }
function majHud(){
  $('hActe').textContent = 'Acte ' + roman(save.acte);
  $('hRep').textContent = 'Répression ' + save.rep;
  const ph = $('hPhase');
  if (G.phase === 1){ ph.textContent = 'Rassemblement'; ph.classList.remove('alerte'); $('hClock').textContent = mmss(P1 - G.t); }
  else { ph.textContent = G.t > P2 - 10 ? 'Tout ferme' : 'Dispersion · sortez'; ph.classList.add('alerte'); $('hClock').textContent = mmss(P2 - G.t); }
  let place = 0; for (const a of G.agents) if (!a.crs && a.vivant && (a.st === 'ok' || a.st === 'panic')) place++;
  $('hPlace').textContent = place; $('hOut').textContent = G.sortis; $('hGav').textContent = G.gav;
  $('hGoal').hidden = G.phase !== 2;
  if (G.phase === 2){
    $('hBar').style.width = Math.min(100, G.sortis / G.total * 100) + '%';
    $('hMark').style.left = (G.objectif / G.total * 100) + '%';
    $('hGoalTxt').textContent = G.sortis + ' / ' + G.objectif + ' à faire sortir';
  }
}

/* ---------- écrans ---------- */
const screen = $('screen');
function cacher(){ screen.hidden = true; screen.innerHTML = ''; }
function logo(t){ return [...t].map((c, i) => `<span style="--i:${i}">${c === ' ' ? '&nbsp;' : c}</span>`).join(''); }
function ecran(kind, data){
  screen.hidden = false;
  if (kind === 'titre'){
    screen.innerHTML = `<div class="sheet">
      <div class="placard"><p class="kicker">Paris, 17 octobre · place de la République</p>
        <h1 class="logo">${logo('Bismillah')}</h1><p class="sub">C'est les ténèbres</p></div>
      <div class="panel"><ul class="regles">
        <li><span class="p">1</span><span><b>Tiens la place</b> jusqu'aux sommations. Les CRS ferment les rues, chargent, reculent.</span></li>
        <li><span class="p">2</span><span><b>Fais sortir le monde</b> par les rues encore ouvertes avant la nasse.</span></li>
        <li><span class="p">↟</span><span><b>La foule pousse.</b> Masse-la contre un cordon avec le <b>mégaphone</b> : il recule, et la rue se rouvre.</span></li>
        <li><span class="p">+</span><span><b>Banderole</b> : arrête une charge. <b>Medic</b> : relève les gens au sol. <b>Filmeur</b> : la police hésite.</span></li>
      </ul></div>
      <div class="actions"><button class="btn red" id="go">Descendre dans la rue</button>${save.colere || save.runs ? '<button class="btn ghost" id="shop">Caisse de grève</button>' : ''}</div>
    </div>`;
    $('go').onclick = commencer;
    if ($('shop')) $('shop').onclick = () => ecran('caisse');
  }
  if (kind === 'pause'){
    screen.innerHTML = `<div class="sheet"><div class="panel"><h2 class="titre">Pause</h2><p class="note">La préfecture en profite pour rédiger un communiqué.</p></div>
      <div class="actions"><button class="btn" id="rep">Reprendre</button><button class="btn ghost" id="ab">Abandonner</button></div></div>`;
    $('rep').onclick = basculerPause;
    $('ab').onclick = () => { paused = false; G.t = P2; G.fin = false; G.phase = 2; finie(); cacher(); };
  }
  if (kind === 'bilan'){
    const d = data;
    screen.innerHTML = `<div class="sheet">
      <div class="panel"><h2 class="titre ${d.ok ? 'ok' : 'ko'}">${d.ok ? 'Ils sont passés' : 'Nassés'}</h2>
        <p class="note">${d.ok ? 'Assez de monde est sorti avant la fermeture. La préfecture parle d’une dispersion réussie.' : 'Trop de monde est resté coincé sur la place. La préfecture parle d’une dispersion réussie.'}</p></div>
      <div class="stats">
        <div class="stat"><span>Sortis</span><b>${G.sortis} / ${G.objectif}</b></div>
        <div class="stat"><span>Nassés</span><b>${G.nasses_ || 0}</b></div>
        <div class="stat"><span>Interpellés</span><b>${G.gav}</b></div>
        <div class="stat"><span>Évacués blessés</span><b>${G.blesses}</b></div>
        <div class="stat"><span>Cordons repoussés</span><b>${G.repousses}</b></div>
        <div class="stat"><span>Preuves</span><b>${G.preuves}${G.perdues ? ` <small style="font-size:14px">(${G.perdues} saisies)</small>` : ''}</b></div>
        <div class="stat"><span>Chiffres orga</span><b>${fmt(d.orga)}</b></div>
        <div class="stat"><span>Chiffres préfecture</span><b>${fmt(d.pref)}</b></div>
      </div>
      <div class="panel"><p class="colere">+${d.gain} de colère</p><p class="note">${d.ok ? 'Acte suivant : la répression monte d’un cran.' : 'On recommence l’acte. La colère gagnée reste.'}</p></div>
      <div class="actions"><button class="btn gold" id="shop">Caisse de grève</button><button class="btn red" id="go">${d.ok ? 'Acte suivant' : 'Redescendre'}</button></div>
    </div>`;
    $('go').onclick = commencer; $('shop').onclick = () => ecran('caisse');
  }
  if (kind === 'caisse'){
    screen.innerHTML = `<div class="sheet"><div class="panel"><h2 class="titre">Caisse de grève</h2><p class="colere">${fmt(save.colere)} de colère</p></div>
      <div class="upgs">${UPG.map(u => { const lv = L(u.id), max = lv >= u.max, c = cout(u);
        return `<div class="upg"><div class="n">${u.nom}<small>niv. ${lv}${max ? ' · max' : ''}</small></div><div class="d">${u.d}</div>
          <button class="btn gold" data-u="${u.id}" ${max || save.colere < c ? 'disabled' : ''}>${max ? '—' : c}</button></div>`; }).join('')}</div>
      <div class="actions"><button class="btn red" id="go">Descendre dans la rue</button></div></div>`;
    screen.querySelectorAll('[data-u]').forEach(b => b.onclick = () => {
      const u = UPG.find(x => x.id === b.dataset.u), c = cout(u);
      if (save.colere < c || L(u.id) >= u.max) return;
      save.colere -= c; save.lv[u.id] = L(u.id) + 1; persist(); ecran('caisse');
    });
    $('go').onclick = commencer;
  }
}
function commencer(){
  cacher();
  nouvellePartie(false);
  mode = 'jeu'; paused = false;
  tickQ = []; tick('start', true);
  majOutils(); majHud(); choisirOutil('meg');
}
function finPartie(){
  if (mode !== 'jeu') return;
  mode = 'bilan';
  const ok = G.sortis >= G.objectif;
  const gain = Math.round(G.sortis*.5 + G.preuves*2 + G.repousses*4 + G.tenue*.15);
  save.colere += gain; save.runs++;
  if (ok){ save.acte++; save.rep++; }
  persist();
  const vus = G.sortis + (G.nasses_ || 0) + G.gav + G.blesses;
  ecran('bilan', { ok, gain, orga: vus * 1000 + 37000, pref: Math.max(800, vus * 37) });
  tick(ok ? 'exit' : 'nasse', true);
}

/* ---------- boucle ---------- */
let last = performance.now(), acc = 0;
const DT = 1/60;
function frame(now){
  acc += Math.min(.1, (now - last)/1000); last = now;
  const tourne = (mode === 'jeu' && !paused) || (mode !== 'jeu' && G.demo);
  while (acc >= DT){ if (tourne) pas(DT); acc -= DT; }
  if (mode === 'jeu'){ G.hudT -= 1/60; if (G.hudT <= 0){ G.hudT = .15; majHud(); } }
  rendu();
  requestAnimationFrame(frame);
}
function demarrer(){
  peindreFond();
  taille();
  nouvellePartie(true);
  majHud(); majOutils();
  ecran('titre');
  requestAnimationFrame(frame);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(taille);
}
window.__place = { G, pas, appliquerOutil, choisirOutil, commencer, get mode(){ return mode; }, RUES, save: () => save };
demarrer();
})();
