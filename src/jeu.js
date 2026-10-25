(() => {
'use strict';

/* ================= utils ================= */
const T = 16;
const rnd = (a, b) => a + Math.random() * (b - a);
const ri = (a, b) => Math.floor(rnd(a, b + 1));
const pick = a => a[Math.floor(Math.random() * a.length)];
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const roman = n => { const m=[[10,'X'],[9,'IX'],[5,'V'],[4,'IV'],[1,'I']]; let s=''; for (const [v,r] of m) while (n>=v){s+=r;n-=v;} return s; };
const fmt = n => Math.round(n).toLocaleString('fr-FR');
function mulberry(a){ return () => { a|=0; a=a+0x6D2B79F5|0; let t=Math.imul(a^a>>>15,1|a); t=t+Math.imul(t^t>>>7,61|t)^t; return ((t^t>>>14)>>>0)/4294967296; }; }
function angDiff(a,b){ let d=a-b; while(d>Math.PI)d-=2*Math.PI; while(d<-Math.PI)d+=2*Math.PI; return d; }
const $ = id => document.getElementById(id);

/* ================= save / meta ================= */
const SAVE_KEY = 'bismillah-v1';
const UPG = [
  {id:'ban',     name:'Banderoles',             desc:'+1 banderole par acte',                     base:18, max:6},
  {id:'med',     name:'Street medics',          desc:'+1 medic par acte',                         base:18, max:6},
  {id:'film',    name:'Filmeurs',               desc:'+1 filmeur par acte',                       base:18, max:6},
  {id:'goggles', name:'Lunettes de piscine',    desc:'−15 % de dégâts du gaz',                    base:24, max:4},
  {id:'battery', name:'Batterie externe',       desc:'+15 s de batterie pour les filmeurs',       base:20, max:5},
  {id:'sturdy',  name:'Banderole renforcée',    desc:'+40 % de tenue face aux cordons',           base:22, max:5},
  {id:'crowd',   name:'Bouche-à-oreille',       desc:'+25 manifestants au départ',                base:30, max:6},
  {id:'legal',   name:'Numéro de la legal team',desc:'−12 % de risque d’interpellation',          base:28, max:4},
  {id:'psc1',    name:'Formation PSC1',         desc:'Medics : +20 % de rayon et de soin',        base:24, max:4},
];
let save = {colere:0, acte:1, rep:1, lv:{}, best:1, runs:0};
function loadSave(){ try { const s = JSON.parse(localStorage.getItem(SAVE_KEY)); if (s && typeof s === 'object') save = Object.assign(save, s, {lv:Object.assign({}, s.lv||{})}); } catch(e){} }
function persist(){ try { localStorage.setItem(SAVE_KEY, JSON.stringify(save)); } catch(e){} }
const L = id => save.lv[id] || 0;
const cost = u => Math.round(u.base * Math.pow(1.6, L(u.id)));

/* ================= ticker ================= */
const TICK = {
  start:["Quelques dizaines de manifestants place de la République selon nos informations","Le cortège s'élance, les commerçants du quartier se disent très inquiets","La préfecture appelle au calme et passe commande de grenades"],
  cordon:["Les forces de l'ordre protègent courageusement une rue","Un cordon de sécurité mis en place pour la sécurité du cordon","Selon nos experts, la rue était menacée"],
  grab:["Interpellation d'un individu au comportement suspect (il marchait)","Un lycéen interpellé en possession d'une banane, arme par destination","Interpellation préventive : il allait sans doute faire quelque chose"],
  gas:["Un nuage de lacrymogène aurait été agressé par des manifestants","Gaz : la préfecture évoque un brouillard naturel d'automne","Des manifestants se seraient jetés sur des grenades en plein vol"],
  down:["Un manifestant se serait blessé tout seul, selon une source policière","Blessé : il aurait percuté une matraque à vive allure"],
  film:["Des images non vérifiées circulent sur les réseaux sociaux","Vidéo virale : nos experts doutent qu'une vidéo puisse prouver quoi que ce soit"],
  prefet:["ARRÊTÉ PRÉFECTORAL : le parcours est modifié pour votre sécurité","La sortie prévue est une zone interdite depuis trente secondes"],
  nasse:["Encerclement en cours : un dispositif d'accompagnement des manifestants","Les manifestants sont invités à se disperser par la sortie qui n'existe pas"],
  exit:["La manifestation se disperse dans le calme (ils sont partis)","Des manifestants auraient réussi à rentrer chez eux, une enquête est ouverte"],
  medic:["Des individus en blouse blanche, probablement des casseurs","Street medics : la préfecture s'interroge sur ces soignants autoproclamés"],
  banner:["Une banderole hostile déployée face aux forces de l'ordre","La banderole mesurerait trois mètres, un record selon la préfecture"],
  meg:["Un individu muni d'un mégaphone sème la confusion","Un mégaphone non déclaré repéré dans le cortège"],
  idle:["Météo : brouillard de gaz sur République, éclaircies en fin de nasse","Le ministre salue le professionnalisme des forces en direct d'un plateau","Bourse : le cours de la grenade lacrymogène s'envole","Chiffres officiels : moins de manifestants que de policiers, comme d'habitude","Un éditorialiste découvre l'existence du pouvoir d'achat","Trafic perturbé : 25 stations fermées pour votre confort","Débat en plateau : faut-il interdire les jambes en manifestation ?"],
  win:["BILAN : aucun incident à signaler du côté des forces de l'ordre"],
  lose:["BILAN : la nasse s'est déroulée dans le calme et la bonne humeur"],
};
const tickEl = $('tick'), trackEl = $('track');
const reduceMotion = !!(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
let tickQ = [], tickBusy = false, tickTimer = 0;
function tick(kind, force){
  const arr = TICK[kind]; if (!arr) return;
  const s = pick(arr);
  if (force) { tickQ.unshift(s); if (tickBusy) { nextTick(); return; } }
  else { if (tickQ.length > 2) return; tickQ.push(s); }
  if (!tickBusy) nextTick();
}
function nextTick(){
  clearTimeout(tickTimer);
  const s = tickQ.shift();
  if (!s) { tickBusy = false; return; }
  tickBusy = true;
  tickEl.textContent = s;
  if (reduceMotion) { tickTimer = setTimeout(nextTick, 6000); return; }
  const tw = trackEl.clientWidth || 600;
  tickEl.style.setProperty('--tw', tw + 'px');
  tickEl.style.animation = 'none'; void tickEl.offsetWidth;
  const dur = Math.max(7, (tw + s.length * 8.5) / 95);
  tickEl.style.animation = `tick ${dur}s linear 1`;
}
tickEl.addEventListener('animationend', nextTick);

/* ================= world ================= */
let W=0, H=0, LA=0, LB=0, landscape=true;
let grid, exitOwner, cordonOwner, occ, gasCost, traffic, distSpawn;
let avenues=[], crosses=[], exits=[], plazaTiles=[], statueTiles=[], mapSeed=1, plazaCB=0, plazaCenter=0;
let cellHead, nextA;
const inb = (x,y) => x>=0 && y>=0 && x<W && y<H;
function toXY(a,b){ return landscape ? [a,b] : [b, LA-1-a]; }
function iAB(a,b){ const p = toXY(a,b); return p[1]*W + p[0]; }

let carte = null;
function genWorld(){
  carte = rasterCarte(CARTES.republique);
  landscape = true; W = LA = carte.W; H = LB = carte.H;
  grid = carte.grid.slice();
  exits = carte.exits.map((e, ei) => ({ei, nom:e.nom, dest:e.dest, main:e.principale, ouverte:e.ouverte, dir:e.dir, open:true, cordon:null, tiles:e.tiles.slice()}));
  plazaTiles = carte.plaza.slice();
  statueTiles = carte.statue.slice();
  const P = CARTES.republique.place;
  plazaCenter = iAB(P.x0 + 2, ((P.y0 + P.y1) / 2) | 0);
  const seen = flood(plazaCenter);
  for (let i=0; i<W*H; i++) if (grid[i]===0 && !seen[i]) grid[i] = 1;
  const N = W*H;
  exitOwner = new Int16Array(N).fill(-1);
  exits.forEach((e,ei) => e.tiles.forEach(t => exitOwner[t] = ei));
  cordonOwner = new Int16Array(N).fill(-1);
  occ = new Uint8Array(N);
  gasCost = new Float32Array(N);
  traffic = new Float32Array(N);
  cellHead = new Int32Array(N);
  distSpawn = dijkstra(plazaTiles, false);
  mapSeed = 17102026;
}
function flood(start){
  const seen = new Uint8Array(W*H); const st=[start]; seen[start]=1;
  while (st.length){ const i=st.pop(), x=i%W, y=(i/W)|0;
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){ const nx=x+dx, ny=y+dy; if (!inb(nx,ny)) continue; const n=ny*W+nx; if (!seen[n] && grid[n]===0){ seen[n]=1; st.push(n); } } }
  return seen;
}

/* ---- Dijkstra flow fields ---- */
const NB = [[1,0,1],[-1,0,1],[0,1,1],[0,-1,1],[1,1,1.414],[1,-1,1.414],[-1,1,1.414],[-1,-1,1.414]];
function dijkstra(targets, dynamic){
  const N = W*H, dist = new Float32Array(N).fill(Infinity);
  const hd = [], hi = [];
  const push = (d,i) => { hd.push(d); hi.push(i); let k=hd.length-1; while (k>0){ const p=(k-1)>>1; if (hd[p] <= hd[k]) break; [hd[p],hd[k]]=[hd[k],hd[p]]; [hi[p],hi[k]]=[hi[k],hi[p]]; k=p; } };
  const pop = () => { const d=hd[0], i=hi[0]; const ld=hd.pop(), li=hi.pop(); if (hd.length){ hd[0]=ld; hi[0]=li; let k=0; for(;;){ const l=2*k+1, r=l+1; let m=k; if (l<hd.length && hd[l]<hd[m]) m=l; if (r<hd.length && hd[r]<hd[m]) m=r; if (m===k) break; [hd[m],hd[k]]=[hd[k],hd[m]]; [hi[m],hi[k]]=[hi[k],hi[m]]; k=m; } } return [d,i]; };
  for (const t of targets){ dist[t]=0; push(0,t); }
  while (hd.length){
    const [d,i] = pop(); if (d > dist[i]) continue;
    const x=i%W, y=(i/W)|0;
    for (const [dx,dy,s] of NB){
      const nx=x+dx, ny=y+dy; if (!inb(nx,ny)) continue;
      const n = ny*W+nx; if (grid[n]!==0) continue;
      if (dx && dy && (grid[y*W+nx]!==0 || grid[ny*W+x]!==0)) continue;
      let c = 1;
      if (dynamic) c += gasCost[n] + (cordonOwner[n]>=0 ? 120 : occ[n] ? 30 : 0);
      const nd = d + s*c;
      if (nd < dist[n]){ dist[n]=nd; push(nd,n); }
    }
  }
  return dist;
}
function field(targets){
  const dist = dijkstra(targets, true), N=W*H;
  const dx = new Float32Array(N), dy = new Float32Array(N);
  for (let i=0; i<N; i++){
    if (grid[i]!==0 || !isFinite(dist[i])) continue;
    const x=i%W, y=(i/W)|0; let best=dist[i], bx=0, by=0;
    for (const [ox,oy] of NB){
      const nx=x+ox, ny=y+oy; if (!inb(nx,ny)) continue; const n=ny*W+nx;
      if (grid[n]!==0) continue; if (ox && oy && (grid[y*W+nx]!==0 || grid[ny*W+x]!==0)) continue;
      if (dist[n] < best){ best=dist[n]; bx=ox; by=oy; }
    }
    if (bx||by){ const l=Math.hypot(bx,by); dx[i]=bx/l; dy[i]=by/l; }
  }
  return {dist, dx, dy};
}

/* ================= game state ================= */
const G = {};
let mode = 'title', paused = false, tool = 'meg';
const BASE_SPEED = 20, FILM_R = 120, FILM_CONE = 0.6;
const CLOTHES = ['#e85d3a','#f2c14e','#5fb49c','#9b5de5','#f15bb5','#00bbf9','#ff8c42','#c9c9c9','#2ec4b6','#e76f51','#a3c4bc','#8ac926','#ef476f','#ffd166'];
const HAIR = ['#2b2118','#5a3825','#d9a441','#e8e1d1','#c1440e','#111111','#7a4b2a','#ff5fa2','#4dd0e1','#9aa0a6'];

function newRun(demo){
  const r = stage.getBoundingClientRect();
  const rep = save.rep;
  Object.assign(G, {
    t:0, demo:!!demo, agents:[], cordons:[], grens:[], clouds:[], projs:[], floats:[], fx:[],
    meg:null, megCd:0, spawned:0, exited:0, blesses:0, gav:0, preuves:0, lostPreuves:0,
    nasse:false, prefet:false, endT:1e9, fieldT:0, dirty:true, flash:null, heli:{ang:Math.random()*6}, idleT:0, hudT:0,
    cordonInterval: Math.max(2.4, 4.8 - 0.35*(rep-1)),
    grabRate: 0.35 + 0.05*(rep-1),
    grabCool: Math.max(0.6, 1.4 - 0.12*(rep-1)),
    grenReload: Math.max(3.2, 6.2 - 0.5*(rep-1)),
    gasDps: 8 * (1 + 0.1*(rep-1)),
    total: 140 + 25*L('crowd'),
    charges: {1: 2+L('ban'), 2: 2+L('med'), 3: 2+L('film')},
  });
  G.spawnRate = G.total / 55;
  G.objective = Math.ceil(G.total * 0.4);
  genWorld(r.width || 900, r.height || 560);
  nextA = new Int32Array(G.total + 16);
  // exits: main boulevard barred from the start, two side exits open
  exits.forEach(e => e.open = true);
  for (const e of exits) if (e.main) closeExit(e, true);
  for (const e of exits) if (!e.main && !e.ouverte) closeExit(e, false);
  computeFields();
  buildEvents();
  resize();
}

function buildEvents(){
  const r = save.rep, ev = [];
  [10, 32, 54, 74, 96].slice(0, Math.min(5, 2 + (r-1))).forEach(t => ev.push({t, fn:spawnFrontCordon}));
  [20, 46, 68, 92].slice(0, Math.min(4, 1 + Math.floor(r/2))).forEach(t => ev.push({t, fn:spawnGrenadier}));
  ev.push({t:84, fn:prefetEvent});
  ev.push({t:108, fn:() => { G.nasse = true; G.flash = {text:'NASSE EN COURS', sub:'les sorties vont fermer', t:3}; tick('nasse', true); spawnRearCordon(); }});
  if (r >= 3) ev.push({t:124, fn:spawnRearCordon});
  ev.push({t:122, fn:closeOneExit});
  ev.push({t:146, fn:closeAllExits});
  ev.sort((a,b) => a.t-b.t);
  G.events = ev;
}

/* ---- exits ---- */
function closeExit(e, withCordon){
  for (const a of G.agents) if (a.state===0 && e.tiles.includes(tileOf(a))) exitAgent(a);
  for (const t of e.tiles) grid[t] = 2;
  e.open = false;
  if (withCordon){
    const mid = e.tiles[Math.floor(e.tiles.length/2)], mx = mid%W, my = (mid/W)|0;
    const axis = e.dir.x ? 'v' : 'h';
    for (let k=2; k<=11; k++){
      const cx = mx - e.dir.x*k, cy = my - e.dir.y*k;
      const line = extendLine(cx, cy, axis);
      if (line && line.length === e.tiles.length && lineFree(line, -1)){
        e.cordon = createCordon(line, axis, {x:-e.dir.x, y:-e.dir.y}, {stationary:true, kind:'exit'});
        break;
      }
    }
  }
  G.dirty = true;
}
function openExit(e){
  for (const t of e.tiles) grid[t] = 0;
  if (e.cordon){ removeCordon(e.cordon); e.cordon = null; }
  e.open = true; G.dirty = true;
}
function prefetEvent(){
  G.prefet = true;
  const open = exits.filter(e => e.open);
  const used = pathExit();
  const target = open.find(e => e === used) || pick(open);
  if (target) closeExit(target, true);
  const closed = exits.filter(e => !e.open && !e.main && !e.cordon);
  if (closed.length) openExit(pick(closed));
  G.flash = {text:'LE PARCOURS EST MODIFIÉ', sub:'arrêté préfectoral', t:3};
  tick('prefet', true);
}
function closeOneExit(){
  const open = exits.filter(e => e.open);
  if (open.length > 1) closeExit(pick(open), true);
}
function closeAllExits(){
  exits.filter(e => e.open).forEach(e => closeExit(e, true));
  G.endT = G.t + 7;
  G.flash = {text:'TOUTES LES SORTIES SONT FERMÉES', sub:'', t:2.5};
}
function pathExit(){
  if (!G.fExit) return null;
  let i = plazaCenter;
  for (let s=0; s<500; s++){ if (exitOwner[i] >= 0) return exits[exitOwner[i]]; const x=i%W, y=(i/W)|0; const dx=G.fExit.dx[i], dy=G.fExit.dy[i]; if (!dx && !dy) break; i = (y+Math.round(dy))*W + x+Math.round(dx); }
  return null;
}
function tracePath(){
  const s = new Set(); if (!G.fExit) return s;
  let i = plazaCenter;
  for (let k=0; k<500; k++){ s.add(i); const x=i%W, y=(i/W)|0; const dx=G.fExit.dx[i], dy=G.fExit.dy[i]; if (!dx && !dy) break; i = (y+Math.round(dy))*W + x+Math.round(dx); }
  return s;
}

/* ---- cordons ---- */
function extendLine(cx, cy, axis){
  if (!inb(cx,cy) || grid[cy*W+cx] !== 0) return null;
  const sx = axis==='h' ? 1 : 0, sy = axis==='h' ? 0 : 1;
  const out = [cy*W+cx];
  for (const d of [-1,1]){
    let x=cx+sx*d, y=cy+sy*d;
    while (inb(x,y) && grid[y*W+x]===0){ out.push(y*W+x); if (out.length > 7) return null; x+=sx*d; y+=sy*d; }
  }
  return out;
}
function lineFree(line, selfId){ return line.every(t => (cordonOwner[t] < 0 || cordonOwner[t] === selfId) && !occ[t] && exitOwner[t] < 0); }
function streetAxisAt(x, y){
  const run = (sx,sy) => { let n=1; for (const d of [-1,1]){ let xx=x+sx*d, yy=y+sy*d; while (inb(xx,yy) && grid[yy*W+xx]===0 && n<20){ n++; xx+=sx*d; yy+=sy*d; } } return n; };
  const rh = run(1,0), rv = run(0,1);
  if (rh <= 5 && rv >= rh + 3) return 'h';
  if (rv <= 5 && rh >= rv + 3) return 'v';
  if (rh <= 4 && rv <= 4) return rh <= rv ? 'h' : 'v';
  return null;
}
function nearCordon(x, y, r){
  for (const c of G.cordons){ if (c.dead) continue; for (const t of c.tiles){ const tx=t%W, ty=(t/W)|0; if (Math.abs(tx-x)<=r && Math.abs(ty-y)<=r) return true; } }
  return false;
}
function createCordon(tiles, axis, dir, opts){
  const c = {id:G.cordons.length, tiles:[], axis, dx:dir.x, dy:dir.y, stationary:!!opts.stationary, stopped:false, steps:0,
    maxSteps:opts.maxSteps||10, timer:0, interval:opts.interval||G.cordonInterval, filmedT:0, bannerBlock:false, bannerAgent:null,
    age:0, dead:false, vanX:0, vanY:0, kind:opts.kind||'front', grabCd:0};
  G.cordons.push(c);
  setCordonTiles(c, tiles);
  displaceAgents(c, tiles);
  G.dirty = true;
  return c;
}
function setCordonTiles(c, tiles){
  for (const t of c.tiles) if (cordonOwner[t] === c.id) cordonOwner[t] = -1;
  c.tiles = tiles;
  for (const t of tiles) cordonOwner[t] = c.id;
  const cx = tiles[0]%W, cy = (tiles[0]/W)|0;
  c.cx = (cx+.5)*T; c.cy = (cy+.5)*T;
  let placed = false;
  for (const back of [2.6, 1.6]){
    const vx = cx + .5 - c.dx*back, vy = cy + .5 - c.dy*back;
    const tx = Math.floor(vx), ty = Math.floor(vy);
    if (inb(tx,ty) && grid[ty*W+tx]===0 && cordonOwner[ty*W+tx] < 0){ c.vanX = vx*T; c.vanY = vy*T; placed = true; break; }
  }
  if (!placed){ c.vanX = c.cx - c.dx*T; c.vanY = c.cy - c.dy*T; }
}
function removeCordon(c){
  for (const t of c.tiles) if (cordonOwner[t] === c.id) cordonOwner[t] = -1;
  c.dead = true; G.dirty = true;
}
function displaceAgents(c, tiles){
  const set = new Set(tiles);
  for (const a of G.agents){
    if (a.state !== 0 || !set.has(tileOf(a))) continue;
    if (a.role===1 && a.planted && a.dur>0){ a.x += c.dx*T; a.y += c.dy*T; continue; }
    if (Math.random() < 0.2) { grab(a, c); continue; }
    a.x += c.dx*T*0.9; a.y += c.dy*T*0.9;
    if (!passable(a.x, a.y)) grab(a, c);
  }
}
function advanceCordon(c){
  if (c.steps >= c.maxSteps){ c.stopped = true; return; }
  const cx = c.tiles[0]%W, cy = (c.tiles[0]/W)|0;
  const line = extendLine(cx + c.dx, cy + c.dy, c.axis);
  if (!line || line.length > 6 || !lineFree(line, c.id)){ c.stopped = true; return; }
  setCordonTiles(c, line);
  displaceAgents(c, line);
  c.steps++;
  policeAction(c.cx, c.cy);
  G.dirty = true;
}
function percentileD(p){
  const arr = [];
  for (const a of G.agents) if (a.state===0){ const d = distSpawn[tileOf(a)]; if (isFinite(d)) arr.push(d); }
  if (!arr.length) return null;
  arr.sort((x,y) => x-y);
  return arr[Math.floor((arr.length-1)*p)];
}
function weightedPick(cands){
  let sum = 0; for (const c of cands) sum += c.w;
  let r = Math.random()*sum;
  for (const c of cands){ r -= c.w; if (r <= 0) return c; }
  return cands[cands.length-1];
}
function spawnFrontCordon(){
  const front = percentileD(0.8) ?? 4;
  const path = tracePath();
  const cands = [];
  for (let i=0; i<W*H; i++){
    if (grid[i]!==0 || cordonOwner[i]>=0 || occ[i] || exitOwner[i]>=0) continue;
    const d = distSpawn[i]; if (!(d >= front+3 && d <= front+18)) continue;
    if (!G.fExit || !isFinite(G.fExit.dist[i])) continue;
    const x=i%W, y=(i/W)|0;
    const axis = streetAxisAt(x,y); if (!axis) continue;
    if (nearCordon(x,y,4)) continue;
    cands.push({i, axis, w: 1 + (path.has(i) ? 40 : 0) + traffic[i]*3});
  }
  for (let tries=0; tries<12 && cands.length; tries++){
    const c = weightedPick(cands);
    const x=c.i%W, y=(c.i/W)|0;
    const line = extendLine(x, y, c.axis);
    if (!line || line.length > 5 || !lineFree(line, -1)){ cands.splice(cands.indexOf(c),1); continue; }
    const dir = c.axis==='h' ? {x:0, y: dS(x,y-1) < dS(x,y+1) ? -1 : 1} : {x: dS(x-1,y) < dS(x+1,y) ? -1 : 1, y:0};
    createCordon(line, c.axis, dir, {maxSteps: 3 + save.rep, kind:'front'});
    tick('cordon');
    return true;
  }
  return false;
}
function spawnRearCordon(){
  const back = percentileD(0.08);
  if (back == null || back < 8) return false;
  const cands = [];
  for (let i=0; i<W*H; i++){
    if (grid[i]!==0 || cordonOwner[i]>=0 || occ[i] || exitOwner[i]>=0) continue;
    const d = distSpawn[i]; if (!(d >= back-10 && d <= back-2)) continue;
    const x=i%W, y=(i/W)|0; const axis = streetAxisAt(x,y); if (!axis) continue;
    if (nearCordon(x,y,3)) continue;
    cands.push({i, axis, w: 1 + traffic[i]*3});
  }
  for (let tries=0; tries<12 && cands.length; tries++){
    const c = weightedPick(cands);
    const x=c.i%W, y=(c.i/W)|0;
    const line = extendLine(x, y, c.axis);
    if (!line || line.length > 5 || !lineFree(line, -1)){ cands.splice(cands.indexOf(c),1); continue; }
    const dir = c.axis==='h' ? {x:0, y: dS(x,y-1) > dS(x,y+1) ? -1 : 1} : {x: dS(x-1,y) > dS(x+1,y) ? -1 : 1, y:0};
    createCordon(line, c.axis, dir, {maxSteps: 16, kind:'rear', interval: G.cordonInterval*0.8});
    return true;
  }
  return false;
}
const dS = (x,y) => inb(x,y) && grid[y*W+x]===0 ? distSpawn[y*W+x] : Infinity;

/* ---- grenadiers & gas ---- */
function spawnGrenadier(){
  const front = percentileD(0.6) ?? 6;
  const cands = [];
  for (let i=0; i<W*H; i++){
    if (grid[i]!==0 || cordonOwner[i]>=0 || occ[i] || exitOwner[i]>=0) continue;
    const d = distSpawn[i]; if (!(d > 9 && d >= front-2 && d <= front+12)) continue;
    const x=i%W, y=(i/W)|0;
    if (crowdNear(x, y, 3)) continue;
    cands.push(i);
  }
  if (!cands.length) return false;
  const i = pick(cands), x=i%W, y=(i/W)|0;
  occ[i] = 1;
  G.grens.push({ti:i, x:(x+.5)*T, y:(y+.5)*T, t:rnd(1,2.5), reload:G.grenReload*rnd(.85,1.15), filmedT:0, aim:0, flash:0});
  G.dirty = true;
  return true;
}
function crowdNear(x, y, r){
  for (let yy=y-r; yy<=y+r; yy++) for (let xx=x-r; xx<=x+r; xx++){ if (!inb(xx,yy)) continue; if (cellHead[yy*W+xx] >= 0) return true; }
  return false;
}
function findDense(g){
  const pool = [];
  for (const a of G.agents){ if (a.state!==0) continue; const dx=a.x-g.x, dy=a.y-g.y; if (dx*dx+dy*dy < 200*200) pool.push(a); }
  if (!pool.length) return null;
  let best=null, bn=-1;
  for (let k=0; k<Math.min(24, pool.length); k++){
    const a = pick(pool), tx=(a.x/T)|0, ty=(a.y/T)|0; let n=0;
    for (let yy=ty-1; yy<=ty+1; yy++) for (let xx=tx-1; xx<=tx+1; xx++){ if (!inb(xx,yy)) continue; for (let j=cellHead[yy*W+xx]; j>=0; j=nextA[j]) n++; }
    if (n > bn){ bn=n; best=a; }
  }
  return best;
}
function recomputeGas(){
  gasCost.fill(0);
  for (const c of G.clouds){
    const r = c.r + 6, x0=Math.floor((c.x-r)/T), x1=Math.floor((c.x+r)/T), y0=Math.floor((c.y-r)/T), y1=Math.floor((c.y+r)/T);
    for (let y=y0; y<=y1; y++) for (let x=x0; x<=x1; x++){ if (!inb(x,y)) continue; const dx=(x+.5)*T-c.x, dy=(y+.5)*T-c.y; if (dx*dx+dy*dy < r*r) gasCost[y*W+x] = 6; }
  }
}
function computeFields(){
  const targets = [];
  for (const e of exits) if (e.open) targets.push(...e.tiles);
  G.fExit = field(targets);
  if (G.meg){
    const mt = [G.meg.ti];
    const x=G.meg.ti%W, y=(G.meg.ti/W)|0;
    for (const [dx,dy] of NB){ const nx=x+dx, ny=y+dy; if (inb(nx,ny) && grid[ny*W+nx]===0) mt.push(ny*W+nx); }
    G.fMeg = field(mt);
  }
}

/* ---- agents ---- */
function tileOf(a){ const tx=clamp((a.x/T)|0,0,W-1), ty=clamp((a.y/T)|0,0,H-1); return ty*W+tx; }
function passable(x, y){
  const tx=Math.floor(x/T), ty=Math.floor(y/T);
  if (!inb(tx,ty)) return false;
  const i = ty*W+tx;
  return grid[i]===0 && cordonOwner[i] < 0 && !occ[i];
}
function spawnAgent(){
  const ti = pick(plazaTiles), x = ti%W, y = (ti/W)|0;
  G.agents.push({
    x:(x+rnd(.2,.8))*T, y:(y+rnd(.2,.8))*T, vx:0, vy:0, hp:100, state:0, role:0,
    spd:rnd(.85,1.15), body: Math.random()<.14 ? '#e6f000' : pick(CLOTHES), vest:false, hair:pick(HAIR),
    passed:false, downT:0, reviveT:0, stash:0, battery:0, aim:0, dur:0, planted:false, plantT:0, gx:0, gy:0, busy:false, lastF:0,
  });
  const a = G.agents[G.agents.length-1]; a.vest = a.body === '#e6f000';
  G.spawned++;
}
function exitAgent(a){
  a.state = 3; G.exited++;
  if (a.stash){ G.preuves += a.stash; a.stash = 0; }
  if (Math.random() < 0.05) tick('exit');
}
function grab(a, c){
  if (a.state !== 0) return;
  a.state = 2; a.gx = c.vanX; a.gy = c.vanY; c.grabs = (c.grabs||0) + 1; c.grabCd = G.grabCool;
  if (a.role === 1) a.role = 0;
  policeAction(a.x, a.y);
  if (Math.random() < 0.12) tick('grab');
}
function policeAction(x, y){
  for (const f of G.agents){
    if (f.state!==0 || f.role!==3 || f.battery<=0) continue;
    const dx=x-f.x, dy=y-f.y; const d2=dx*dx+dy*dy;
    if (d2 > FILM_R*FILM_R) continue;
    if (Math.abs(angDiff(Math.atan2(dy,dx), f.aim)) > FILM_CONE) continue;
    f.stash++;
    if (G.t - f.lastF > 0.6){ f.lastF = G.t; floatText(f.x, f.y-8, '+1 preuve', '#ffe27a'); }
    if (Math.random() < 0.03) tick('film');
  }
}
function floatText(x, y, s, col){ if (G.floats.length < 40) G.floats.push({x, y, s, col:col||'#fff', t:0}); }

/* ================= update ================= */
function buildHash(){
  cellHead.fill(-1);
  const ag = G.agents;
  for (let i=0; i<ag.length; i++){ const a=ag[i]; if (a.state!==0 && a.state!==1) continue; const ti=tileOf(a); nextA[i]=cellHead[ti]; cellHead[ti]=i; }
}
function update(dt){
  G.t += dt;
  while (G.events.length && G.events[0].t <= G.t) G.events.shift().fn();
  if (G.spawned < G.total){ G.spawnAcc = (G.spawnAcc||0) + dt*G.spawnRate; while (G.spawnAcc >= 1 && G.spawned < G.total){ spawnAgent(); G.spawnAcc -= 1; } }
  G.fieldT -= dt;
  if (G.fieldT <= 0 || G.dirty){ recomputeGas(); computeFields(); G.fieldT = 0.4; G.dirty = false; }
  buildHash();
  updateCordons(dt);
  updateGrens(dt);
  updateProjs(dt);
  updateClouds(dt);
  updateRoles(dt);
  updateAgents(dt);
  const decay = 1 - 0.04*dt; for (let i=0; i<traffic.length; i++) traffic[i] *= decay;
  if (G.meg){ G.meg.t -= dt; if (G.meg.t <= 0){ G.meg = null; G.dirty = true; } }
  G.megCd -= dt;
  for (const f of G.floats) f.t += dt; G.floats = G.floats.filter(f => f.t < 1.4);
  for (const f of G.fx) f.t += dt; G.fx = G.fx.filter(f => f.t < 0.5);
  if (G.flash){ G.flash.t -= dt; if (G.flash.t <= 0) G.flash = null; }
  G.heli.ang += dt*0.12;
  G.idleT += dt; if (!tickBusy && G.idleT > 5){ G.idleT = 0; tick('idle'); }
  if (!exits.some(e => e.open) && G.endT > G.t + 7) G.endT = G.t + 7;
  let active = 0; for (const a of G.agents) if (a.state===0 || a.state===1 || a.state===2) active++;
  if (!G.demo && (G.t >= G.endT || (G.spawned >= G.total && active === 0))) endRun();
}
function updateCordons(dt){
  const banners = G.agents.filter(a => a.state===0 && a.role===1 && a.planted && a.dur>0);
  for (const c of G.cordons){
    if (c.dead) continue;
    c.age += dt; c.filmedT = Math.max(0, c.filmedT - dt); c.grabCd -= dt;
    c.bannerBlock = false; c.bannerAgent = null;
    for (const b of banners){
      let md = 1e9; for (const t of c.tiles){ const dx=(t%W+.5)*T-b.x, dy=(((t/W)|0)+.5)*T-b.y; md = Math.min(md, dx*dx+dy*dy); }
      if (md < 30*30){
        c.bannerBlock = true; c.bannerAgent = b; b.dur -= dt;
        if (b.dur <= 0){ b.role = 0; b.planted = false; floatText(b.x, b.y-10, 'Banderole arrachée !', '#ff9a8a'); }
        break;
      }
    }
    if (c.stationary || c.stopped || c.bannerBlock) continue;
    c.timer += dt * (c.filmedT > 0 ? 0.5 : 1);
    if (c.timer >= c.interval){ c.timer = 0; advanceCordon(c); }
  }
}
function updateGrens(dt){
  for (const g of G.grens){
    g.filmedT = Math.max(0, g.filmedT - dt); g.flash = Math.max(0, g.flash - dt);
    g.t += dt * (g.filmedT > 0 ? 0.5 : 1);
    if (g.t < g.reload) continue;
    const tgt = findDense(g);
    if (!tgt){ g.t = g.reload*0.7; continue; }
    g.t = 0; g.flash = 0.25;
    const tx = tgt.x + rnd(-10,10), ty = tgt.y + rnd(-10,10);
    g.aim = Math.atan2(ty-g.y, tx-g.x);
    G.projs.push({sx:g.x, sy:g.y, tx, ty, t:0, dur:0.9});
    policeAction(g.x, g.y);
    if (Math.random() < 0.25) tick('gas');
  }
}
function updateProjs(dt){
  for (const p of G.projs){ p.t += dt; if (p.t >= p.dur){ p.done = true; G.clouds.push({x:p.tx, y:p.ty, r:6, maxR:30 + save.rep*2, age:0, life:7.5, seed:Math.random()*1000}); } }
  G.projs = G.projs.filter(p => !p.done);
}
function updateClouds(dt){
  for (const c of G.clouds){ c.age += dt; c.r = c.maxR * Math.min(1, 0.3 + 0.7*c.age/1.2); }
  G.clouds = G.clouds.filter(c => c.age < c.life);
}
function updateRoles(dt){
  const R = 36 * (1 + 0.2*L('psc1')), heal = 22 * (1 + 0.2*L('psc1'));
  const ag = G.agents;
  for (const m of ag){
    if (m.state!==0) continue;
    if (m.role === 2){
      m.busy = false;
      const tx=(m.x/T)|0, ty=(m.y/T)|0, rr=Math.ceil(R/T);
      for (let yy=ty-rr; yy<=ty+rr; yy++) for (let xx=tx-rr; xx<=tx+rr; xx++){
        if (!inb(xx,yy)) continue;
        for (let j=cellHead[yy*W+xx]; j>=0; j=nextA[j]){
          const o = ag[j]; const dx=o.x-m.x, dy=o.y-m.y; if (dx*dx+dy*dy > R*R) continue;
          if (o.state===0) o.hp = Math.min(100, o.hp + heal*dt);
          else if (o.state===1){ m.busy = true; o.reviveT += dt; if (o.reviveT >= 1.4){ o.state=0; o.hp=45; o.reviveT=0; floatText(o.x,o.y-8,'Relevé','#9ff0be'); if (Math.random()<.15) tick('medic'); } }
        }
      }
    } else if (m.role === 3){
      m.battery -= dt;
      if (m.battery <= 0){ m.role = 0; floatText(m.x, m.y-8, 'Batterie à plat', '#c9c9c9'); continue; }
      let best=null, bd=FILM_R*FILM_R;
      for (const c of G.cordons){ if (c.dead) continue; const dx=c.cx-m.x, dy=c.cy-m.y, d=dx*dx+dy*dy; if (d<bd){ bd=d; best=[c.cx,c.cy]; } }
      for (const g of G.grens){ const dx=g.x-m.x, dy=g.y-m.y, d=dx*dx+dy*dy; if (d<bd){ bd=d; best=[g.x,g.y]; } }
      const want = best ? Math.atan2(best[1]-m.y, best[0]-m.x) : (Math.hypot(m.vx,m.vy) > 2 ? Math.atan2(m.vy,m.vx) : m.aim);
      m.aim += angDiff(want, m.aim) * Math.min(1, dt*6);
      const inCone = (x,y) => { const dx=x-m.x, dy=y-m.y; return dx*dx+dy*dy < FILM_R*FILM_R && Math.abs(angDiff(Math.atan2(dy,dx), m.aim)) < FILM_CONE; };
      for (const c of G.cordons) if (!c.dead && inCone(c.cx, c.cy)) c.filmedT = 0.3;
      for (const g of G.grens) if (inCone(g.x, g.y)) g.filmedT = 0.3;
    }
  }
}
function updateAgents(dt){
  const ag = G.agents;
  const gasRes = 1 - 0.15*L('goggles');
  const legal = 1 - 0.12*L('legal');
  for (let i=0; i<ag.length; i++){
    const a = ag[i];
    if (a.state === 3) continue;
    if (a.state === 2){
      const dx=a.gx-a.x, dy=a.gy-a.y, d=Math.hypot(dx,dy);
      if (d < 5){ a.state = 3; G.gav++; if (a.stash){ G.lostPreuves += a.stash; floatText(a.x,a.y-8,'Téléphone saisi','#ff9a8a'); a.stash = 0; } }
      else { a.x += dx/d*48*dt; a.y += dy/d*48*dt; }
      continue;
    }
    if (a.state === 1){
      a.downT -= dt;
      if (a.downT <= 0){ a.state = 3; G.blesses++; if (a.stash){ G.preuves += a.stash; a.stash = 0; } if (Math.random()<.2) tick('down'); }
      continue;
    }
    const ti = tileOf(a), tx = ti%W, ty = (ti/W)|0;
    if (exitOwner[ti] >= 0 && exits[exitOwner[ti]].open){ exitAgent(a); continue; }
    // gas
    let inGas = false, gx = 0, gy = 0;
    for (const c of G.clouds){
      const dx=a.x-c.x, dy=a.y-c.y;
      if (dx*dx+dy*dy < c.r*c.r){ inGas = true; const dd = Math.sqrt(dx*dx+dy*dy)+.01; gx += dx/dd; gy += dy/dd; const fade = c.age > c.life-2 ? (c.life-c.age)/2 : 1; a.hp -= G.gasDps*gasRes*(a.role===2?0.7:1)*fade*dt; }
    }
    if (a.hp <= 0){ a.state = 1; a.downT = 9; a.reviveT = 0; a.role === 1 && (a.role = 0); policeAction(a.x, a.y); continue; }
    // grabbing at cordon lines
    const shielded = a.role===1 && a.planted && a.dur>0;
    if (!shielded){
      let grabbed = false;
      for (const [ox,oy] of [[1,0],[-1,0],[0,1],[0,-1]]){
        const nx=tx+ox, ny=ty+oy; if (!inb(nx,ny)) continue;
        const own = cordonOwner[ny*W+nx]; if (own < 0) continue;
        const c = G.cordons[own];
        if (c.grabCd > 0) continue;
        if ((nx+.5-a.x/T)*a.vx + (ny+.5-a.y/T)*a.vy < 0.5) continue;
        const ccx=(nx+.5)*T, ccy=(ny+.5)*T; if ((ccx-a.x)**2 + (ccy-a.y)**2 > 14*14) continue;
        if (c.bannerBlock && c.bannerAgent && (c.bannerAgent.x-a.x)**2 + (c.bannerAgent.y-a.y)**2 < 40*40) continue;
        const rate = G.grabRate * legal * (c.filmedT > 0 ? 0.5 : 1);
        if (Math.random() < rate*dt){ grab(a, c); grabbed = true; break; }
      }
      if (grabbed) continue;
    }
    // banner behaviour
    if (a.role === 1){
      if (!a.planted){
        a.plantT -= dt;
        const dx=a.gx-a.x, dy=a.gy-a.y, d=Math.hypot(dx,dy);
        if (d < 4 || a.plantT <= 0){ a.planted = true; a.vx = a.vy = 0; }
        else moveAgent(a, dx/d*26, dy/d*26, dt);
      }
      continue;
    }
    // steering
    const useMeg = G.meg && !a.passed && G.fMeg;
    const f = useMeg ? G.fMeg : G.fExit;
    let dx = f ? f.dx[ti] : 0, dy = f ? f.dy[ti] : 0;
    if (useMeg && (G.meg.x-a.x)**2 + (G.meg.y-a.y)**2 < (2.2*T)**2) a.passed = true;
    if (!dx && !dy){ dx = rnd(-.4,.4); dy = rnd(-.4,.4); }
    let sp = BASE_SPEED * a.spd;
    if (inGas){ sp *= 0.75; dx += gx*1.4 + rnd(-.5,.5); dy += gy*1.4 + rnd(-.5,.5); }
    if (a.role === 2) sp *= a.busy ? 0.15 : 0.85;
    let sx = 0, sy = 0;
    for (let yy=ty-1; yy<=ty+1; yy++) for (let xx=tx-1; xx<=tx+1; xx++){
      if (!inb(xx,yy)) continue;
      for (let j=cellHead[yy*W+xx]; j>=0; j=nextA[j]){
        if (j === i) continue; const o = ag[j]; if (o.state !== 0) continue;
        const ex=a.x-o.x, ey=a.y-o.y, d2=ex*ex+ey*ey;
        if (d2 < 36 && d2 > 0.0001){ const d=Math.sqrt(d2), k=(6-d)/6; sx += ex/d*k; sy += ey/d*k; }
      }
    }
    moveAgent(a, dx*sp + sx*34, dy*sp + sy*34, dt);
    traffic[ti] += dt;
  }
}
function moveAgent(a, wx, wy, dt){
  const k = Math.min(1, dt*8);
  a.vx += (wx - a.vx)*k; a.vy += (wy - a.vy)*k;
  const nx = a.x + a.vx*dt, ny = a.y + a.vy*dt;
  if (passable(nx + Math.sign(a.vx)*3, a.y)) a.x = nx; else a.vx *= -0.2;
  if (passable(a.x, ny + Math.sign(a.vy)*3)) a.y = ny; else a.vy *= -0.2;
  a.x = clamp(a.x, 1, W*T-1); a.y = clamp(a.y, 1, H*T-1);
}

/* ================= player tools ================= */
function applyTool(wx, wy){
  G.fx.push({x:wx, y:wy, t:0});
  if (tool === 'meg') return placeMeg(wx, wy);
  const role = +tool;
  if (G.charges[role] <= 0){ floatText(wx, wy, 'Plus personne pour ça', '#ff9a8a'); return; }
  const R = Math.max(22, 40/scale);
  let best = null, bd = R*R;
  for (const a of G.agents){
    if (a.state!==0 || a.role!==0) continue;
    const dx=a.x-wx, dy=a.y-wy, d=dx*dx+dy*dy; if (d < bd){ bd=d; best=a; }
  }
  if (!best){ floatText(wx, wy, 'Personne ici', '#c9c9c9'); return; }
  best.role = role; G.charges[role]--;
  if (role === 1){
    best.dur = 7 * (1 + 0.4*L('sturdy')); best.planted = false; best.plantT = 3;
    best.gx = best.x; best.gy = best.y;
    let bc=null, bd2=110*110, bt=null;
    for (const c of G.cordons){ if (c.dead) continue; for (const t of c.tiles){ const cx=(t%W+.5)*T, cy=(((t/W)|0)+.5)*T, d=(cx-best.x)**2+(cy-best.y)**2; if (d<bd2){ bd2=d; bc=c; bt=[cx,cy]; } } }
    if (bc){ const gx = bt[0] + bc.dx*13, gy = bt[1] + bc.dy*13; if (passable(gx,gy)){ best.gx = gx; best.gy = gy; } }
    else best.planted = true;
    floatText(best.x, best.y-10, 'Banderole !', '#ffffff');
    if (Math.random()<.3) tick('banner');
  } else if (role === 2){
    floatText(best.x, best.y-10, 'Street medic', '#9ff0be');
  } else if (role === 3){
    best.battery = 35 + 15*L('battery'); best.aim = Math.atan2(best.vy, best.vx);
    floatText(best.x, best.y-10, 'Ça filme', '#ffe27a');
  }
  G.fx.push({x:best.x, y:best.y, t:0, ring:true});
  updateTools();
}
function placeMeg(wx, wy){
  if (G.meg && (G.meg.x-wx)**2 + (G.meg.y-wy)**2 < 22*22){ G.meg = null; G.dirty = true; floatText(wx, wy, 'Mégaphone rangé', '#c9c9c9'); return; }
  if (G.megCd > 0) return;
  const tx = Math.floor(wx/T), ty = Math.floor(wy/T);
  let found = -1, fd = 1e9;
  for (let yy=ty-3; yy<=ty+3; yy++) for (let xx=tx-3; xx<=tx+3; xx++){
    if (!inb(xx,yy)) continue; const i = yy*W+xx;
    if (grid[i]!==0 || cordonOwner[i]>=0 || occ[i]) continue;
    const d = (xx-tx)**2 + (yy-ty)**2; if (d < fd){ fd=d; found=i; }
  }
  if (found < 0){ floatText(wx, wy, 'Pas par là', '#ff9a8a'); return; }
  const x = found%W, y = (found/W)|0;
  G.meg = {ti:found, x:(x+.5)*T, y:(y+.5)*T, t:20, max:20};
  G.megCd = 0.6;
  const dm = G.fExit ? G.fExit.dist[found] : 0;
  for (const a of G.agents){ if (a.state!==0) continue; const d = G.fExit ? G.fExit.dist[tileOf(a)] : 0; a.passed = isFinite(dm) && d < dm - 2; }
  G.dirty = true;
  if (Math.random()<.2) tick('meg');
}

/* ================= rendering ================= */
const cv = $('cv'), ctx = cv.getContext('2d'), stage = $('stage');
let dpr = 1, scale = 1, offX = 0, offY = 0, mapCanvas = null, stageW = 0, stageH = 0;
function resize(){
  const r = stage.getBoundingClientRect();
  stageW = r.width; stageH = r.height;
  dpr = Math.min(2, window.devicePixelRatio || 1);
  cv.width = Math.max(1, Math.round(r.width*dpr)); cv.height = Math.max(1, Math.round(r.height*dpr));
  if (W){ scale = Math.min(r.width/(W*T), r.height/(H*T)); offX = (r.width - W*T*scale)/2; offY = (r.height - H*T*scale)/2; renderMap(); }
}
const COL = {asph:'#3a3a42', bd:'#36363e', walk:'#4a4a53', curb:'#5a5a64', roof:['#5c6373','#626a7b','#575e6d','#687082'], zinc:'#7d8796', stone:'#cbbf9f', stoneDk:'#a99c7c', win:'#3a3f4c', chim:'#383c47', plaza:'#6f6a60', plazaLine:'#7a756a', tree:'#3f5a3a', tree2:'#4d6d46', vauban:'#b9bcc4', vaubanDk:'#7c808a', van:'#2d4a8a'};
function renderMap(){
  mapCanvas = document.createElement('canvas');
  mapCanvas.width = Math.max(1, Math.ceil(W*T*scale*dpr)); mapCanvas.height = Math.max(1, Math.ceil(H*T*scale*dpr));
  const m = mapCanvas.getContext('2d');
  m.setTransform(scale*dpr, 0, 0, scale*dpr, 0, 0);
  const rng = mulberry(mapSeed), K = carte.K, kind = carte.kind;
  const kAt = (x,y) => inb(x,y) ? kind[y*W+x] : K.BATI;
  const bati = (x,y) => kAt(x,y) === K.BATI;
  // sol
  for (let y=0; y<H; y++) for (let x=0; x<W; x++){
    const k = kind[y*W+x];
    if (k === K.BATI){
      const h = mulberry((Math.floor(x/3)*73856093) ^ (Math.floor(y/2)*19349663) ^ mapSeed)();
      m.fillStyle = COL.roof[Math.floor(h*4)];
    } else m.fillStyle = k === K.PLACE || k === K.STATUE ? COL.plaza : k === K.BD ? COL.bd : COL.asph;
    m.fillRect(x*T, y*T, T+.5, T+.5);
  }
  // toits en zinc, cheminées
  for (let y=0; y<H; y++) for (let x=0; x<W; x++){
    if (!bati(x,y)) continue;
    if (rng() < 0.18){ m.fillStyle = COL.chim; m.fillRect(x*T + 2 + rng()*10, y*T + 2 + rng()*8, 3, 3); }
    if (!bati(x,y-1)){ m.fillStyle = COL.zinc; m.fillRect(x*T, y*T, T, 2); }
  }
  // trottoirs
  for (let y=0; y<H; y++) for (let x=0; x<W; x++){
    const k = kind[y*W+x];
    if (k === K.BATI || k === K.STATUE || k === K.BARRIERE) continue;
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      if (!bati(x+dx,y+dy)) continue;
      const w = k === K.PLACE ? 2.5 : 4;
      m.fillStyle = COL.walk; strip(m, x, y, dx, dy, w);
      m.fillStyle = COL.curb;
      if (dx===1) m.fillRect(x*T+T-w-1, y*T, 1, T); else if (dx===-1) m.fillRect(x*T+w, y*T, 1, T);
      else if (dy===1) m.fillRect(x*T, y*T+T-w-1, T, 1); else m.fillRect(x*T, y*T+w, T, 1);
    }
  }
  // façades haussmanniennes : bord sud des îlots (faux trois-quarts)
  for (let y=0; y<H; y++) for (let x=0; x<W; x++){
    if (!bati(x,y) || bati(x,y+1) || !inb(x,y+1)) continue;
    const fy = y*T + 7;
    m.fillStyle = COL.stone; m.fillRect(x*T, fy, T, T-7);
    m.fillStyle = COL.stoneDk; m.fillRect(x*T, fy, T, 1); m.fillRect(x*T, fy+4, T, 1);
    m.fillStyle = COL.win;
    for (const wx of [2, 7, 12]){ m.fillRect(x*T+wx, fy+1.5, 2, 2); }
    if (((x*7) ^ y) % 5 === 0){ m.fillStyle = '#5b3a2a'; m.fillRect(x*T+6, fy+5, 4, 4); }
    else { m.fillStyle = COL.win; for (const wx of [2, 7, 12]) m.fillRect(x*T+wx, fy+5.5, 2, 2.5); }
  }
  // arbres d'alignement sur les boulevards
  for (let y=0; y<H; y++) for (let x=0; x<W; x++){
    if (kind[y*W+x] !== K.BD || (x+y) % 3) continue;
    for (const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){
      if (!bati(x+dx,y+dy) || dy === -1 && false) continue;
      m.fillStyle = (x*13+y)%2 ? COL.tree : COL.tree2;
      m.beginPath(); m.arc(x*T+8+dx*3.5, y*T+8+dy*3.5, 3.8, 0, 7); m.fill();
      break;
    }
  }
  // place : dallage, arbres en bordure, statue
  m.strokeStyle = COL.plazaLine; m.lineWidth = .5;
  for (const i of plazaTiles){ const x=i%W, y=(i/W)|0; m.strokeRect(x*T+.25, y*T+.25, T-.5, T-.5); }
  for (const i of plazaTiles){
    const x=i%W, y=(i/W)|0;
    const edge = [[1,0],[-1,0],[0,1],[0,-1]].some(([dx,dy]) => bati(x+dx,y+dy));
    if (edge && (x+y)%2===0){ m.fillStyle = (x+y)%4 ? COL.tree : COL.tree2; m.beginPath(); m.arc(x*T+8, y*T+8, 5.5, 0, 7); m.fill(); }
  }
  let sx=0, sy=0; for (const i of statueTiles){ sx += (i%W+.5)*T; sy += (((i/W)|0)+.5)*T; } sx/=statueTiles.length; sy/=statueTiles.length;
  m.fillStyle = '#9c9482'; m.beginPath(); m.arc(sx, sy, 15, 0, 7); m.fill();
  m.fillStyle = '#b5ad99'; m.beginPath(); m.arc(sx, sy, 10, 0, 7); m.fill();
  m.fillStyle = '#4f6b55'; m.fillRect(sx-4, sy-6, 8, 8);
  m.fillStyle = '#5f8066'; m.fillRect(sx-1.5, sy-20, 3, 15); m.fillRect(sx-4, sy-20, 8, 3);
  // bouches de métro
  const P = CARTES.republique.place;
  for (const [mx,my] of [[P.x0+1, P.y0], [P.x1-1, P.y1], [P.x1-1, P.y0+1]]){
    const cx = mx*T+8, cy = my*T+8;
    m.fillStyle = '#2e5a3a'; m.fillRect(cx-6, cy-3, 12, 7);
    m.fillStyle = '#f2c14e'; m.beginPath(); m.arc(cx, cy-7, 3.5, 0, 7); m.fill();
    m.fillStyle = '#222'; m.font = '700 5px "Barlow Condensed", sans-serif'; m.textAlign = 'center'; m.textBaseline = 'middle'; m.fillText('M', cx, cy-6.8);
  }
  // barrages fixes : barrières Vauban + fourgon
  for (const bg of carte.barrages){
    for (const i of bg.tiles){
      const x=i%W, y=(i/W)|0;
      m.fillStyle = COL.asph; m.fillRect(x*T, y*T, T, T);
      m.fillStyle = COL.vaubanDk;
      if (bg.dir.x){ m.fillRect(x*T+7, y*T, 2, T); m.fillStyle = COL.vauban; for (let k=1; k<T; k+=3) m.fillRect(x*T+6, y*T+k, 4, 1); }
      else { m.fillRect(x*T, y*T+7, T, 2); m.fillStyle = COL.vauban; for (let k=1; k<T; k+=3) m.fillRect(x*T+k, y*T+6, 1, 4); }
    }
    const t0 = bg.tiles[0], t1 = bg.tiles[bg.tiles.length-1];
    const cx = ((t0%W + t1%W)/2 + .5)*T + bg.dir.x*2, cy = ((((t0/W)|0) + ((t1/W)|0))/2 + .5)*T + bg.dir.y*2;
    m.save(); m.translate(cx, cy); if (bg.dir.y) m.rotate(Math.PI/2);
    m.fillStyle = COL.van; m.fillRect(-4, -7, 8, 14); m.fillStyle = '#9fb3d9'; m.fillRect(-3, -6, 6, 3); m.restore();
  }
  // noms de rues
  m.textAlign = 'center'; m.textBaseline = 'middle';
  for (const l of carte.labels){
    const size = l.type === 'bd' ? 6.5 : 5.5;
    m.font = `700 ${size}px "Barlow Condensed", sans-serif`;
    const txt = l.nom.toUpperCase();
    if (m.measureText(txt).width > l.len*T - 6) continue;
    m.save(); m.translate((l.x+.5)*T, (l.y+.5)*T); m.rotate(l.ang);
    m.fillStyle = 'rgba(0,0,0,.35)'; m.fillText(txt, .5, .5);
    m.fillStyle = 'rgba(255,255,255,.55)'; m.fillText(txt, 0, 0);
    m.restore();
  }
  m.font = '700 8px "Barlow Condensed", sans-serif'; m.fillStyle = 'rgba(255,255,255,.6)';
  m.fillText('PLACE DE LA RÉPUBLIQUE', ((P.x0+P.x1)/2+.5)*T + 20, (P.y0+.9)*T);
}
function strip(m, x, y, dx, dy, w){
  if (dx===1) m.fillRect(x*T+T-w, y*T, w, T); else if (dx===-1) m.fillRect(x*T, y*T, w, T);
  else if (dy===1) m.fillRect(x*T, y*T+T-w, T, w); else m.fillRect(x*T, y*T, T, w);
}

function render(){
  ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle = '#1b1c21'; ctx.fillRect(0, 0, cv.width, cv.height);
  if (!W || !mapCanvas) return;
  ctx.setTransform(dpr*scale, 0, 0, dpr*scale, dpr*offX, dpr*offY);
  ctx.drawImage(mapCanvas, 0, 0, W*T, H*T);
  const now = performance.now()/1000;
  drawExits(now);
  if (G.meg) drawMeg(now);
  drawCones();
  drawVans(now);
  drawAgents(now);
  drawCordons(now);
  drawGrens();
  drawBanners();
  drawProjs();
  drawClouds(now);
  drawHeli();
  drawFloats();
  drawFx();
  if (G.flash) drawFlash();
}
function drawExits(now){
  for (const e of exits){
    const pts = e.tiles.map(t => [t%W, (t/W)|0]);
    const x0 = Math.min(...pts.map(p=>p[0]))*T, y0 = Math.min(...pts.map(p=>p[1]))*T;
    const x1 = (Math.max(...pts.map(p=>p[0]))+1)*T, y1 = (Math.max(...pts.map(p=>p[1]))+1)*T;
    const dx = e.dir.x, dy = e.dir.y;
    if (e.open){
      const pulse = .55 + .45*Math.sin(now*4);
      ctx.fillStyle = `rgba(95,211,141,${.18+.12*pulse})`; ctx.fillRect(x0, y0, x1-x0, y1-y0);
      ctx.strokeStyle = '#5fd38d'; ctx.lineWidth = 2;
      for (const [px,py] of pts){
        const cx=(px+.5)*T, cy=(py+.5)*T;
        ctx.beginPath();
        ctx.moveTo(cx - dx*3 - dy*4, cy - dy*3 - dx*4); ctx.lineTo(cx + dx*2, cy + dy*2); ctx.lineTo(cx - dx*3 + dy*4, cy - dy*3 + dx*4);
        ctx.stroke();
      }
    } else {
      ctx.fillStyle = '#8c8c94'; ctx.fillRect(x0, y0, x1-x0, y1-y0);
      ctx.save(); ctx.beginPath(); ctx.rect(x0, y0, x1-x0, y1-y0); ctx.clip();
      ctx.strokeStyle = '#d93a2b'; ctx.lineWidth = 3;
      for (let s=-40; s<80; s+=8){ ctx.beginPath(); ctx.moveTo(x0+s, y0); ctx.lineTo(x0+s+30, y0+30); ctx.stroke(); }
      ctx.restore();
    }
    const label = (e.open ? 'SORTIE ' : '') + e.dest.toUpperCase();
    ctx.fillStyle = e.open ? '#5fd38d' : '#d9dbe0'; ctx.font = '700 7px "Barlow Condensed", sans-serif'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    const mx = (x0+x1)/2, my = (y0+y1)/2;
    ctx.save();
    if (dx){ ctx.translate(mx - dx*(T*0.5+6), my); ctx.rotate(-Math.PI/2); }
    else { ctx.translate(mx, my - dy*(T*0.5+6)); }
    ctx.fillText(label, 0, 0); ctx.restore();
  }
}
function drawMeg(now){
  const g = G.meg;
  for (let k=0; k<3; k++){
    const p = ((now*0.8 + k/3) % 1);
    ctx.strokeStyle = `rgba(255,140,26,${(1-p)*.6})`; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.arc(g.x, g.y, 8 + p*40, 0, 7); ctx.stroke();
  }
  ctx.fillStyle = '#ff8c1a'; ctx.beginPath(); ctx.arc(g.x, g.y, 8, 0, 7); ctx.fill();
  ctx.strokeStyle = '#21180f'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(g.x, g.y, 10.5, -Math.PI/2, -Math.PI/2 + 2*Math.PI*(g.t/g.max)); ctx.stroke();
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.moveTo(g.x-4, g.y-2); ctx.lineTo(g.x-1, g.y-2); ctx.lineTo(g.x+4, g.y-5); ctx.lineTo(g.x+4, g.y+5); ctx.lineTo(g.x-1, g.y+2); ctx.lineTo(g.x-4, g.y+2); ctx.closePath(); ctx.fill();
  ctx.font = '11px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
  ctx.lineWidth = 3; ctx.strokeStyle = '#21180f'; ctx.strokeText('TOUS PAR ICI !', g.x, g.y-13);
  ctx.fillStyle = '#ffb35c'; ctx.fillText('TOUS PAR ICI !', g.x, g.y-13);
}
function drawCones(){
  for (const a of G.agents){
    if (a.state!==0 || a.role!==3) continue;
    const g = ctx.createRadialGradient(a.x, a.y, 2, a.x, a.y, FILM_R);
    g.addColorStop(0, 'rgba(255,226,122,.28)'); g.addColorStop(1, 'rgba(255,226,122,0)');
    ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.arc(a.x, a.y, FILM_R, a.aim-FILM_CONE, a.aim+FILM_CONE); ctx.closePath(); ctx.fill();
  }
}
function drawVans(now){
  for (const c of G.cordons){
    if (c.dead) continue;
    const ang = Math.atan2(c.dy, c.dx) + Math.PI/2;
    ctx.save(); ctx.translate(c.vanX, c.vanY); ctx.rotate(ang);
    ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-8, -14, 18, 30);
    ctx.fillStyle = '#22315f'; ctx.fillRect(-9, -15, 18, 30);
    ctx.fillStyle = '#e9edf5'; ctx.fillRect(-9, -2, 18, 3);
    ctx.fillStyle = '#121b38'; ctx.fillRect(-7, -13, 14, 6);
    const on = Math.floor(now*6) % 2;
    ctx.fillStyle = on ? '#4aa3ff' : '#203a7a'; ctx.fillRect(-6, 9, 5, 3);
    ctx.fillStyle = on ? '#203a7a' : '#4aa3ff'; ctx.fillRect(1, 9, 5, 3);
    ctx.restore();
  }
}
function drawAgents(now){
  const ag = G.agents;
  for (const a of ag){
    if (a.state !== 1) continue;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(a.x, a.y+1, 5.5, 3, .4, 0, 7); ctx.fill();
    ctx.fillStyle = a.body; ctx.globalAlpha = .7; ctx.beginPath(); ctx.ellipse(a.x, a.y, 5, 2.6, .4, 0, 7); ctx.fill(); ctx.globalAlpha = 1;
    ctx.fillStyle = a.hair; ctx.beginPath(); ctx.arc(a.x+4, a.y+1.6, 1.9, 0, 7); ctx.fill();
    if (a.reviveT > 0){ ctx.strokeStyle = '#9ff0be'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(a.x, a.y, 7, -Math.PI/2, -Math.PI/2 + 2*Math.PI*a.reviveT/1.4); ctx.stroke(); }
    else if (Math.floor(now*3)%2){ ctx.fillStyle = '#ff5a4a'; ctx.fillRect(a.x-1, a.y-9, 2, 5); ctx.fillRect(a.x-2.5, a.y-7.5, 5, 2); }
  }
  for (const a of ag){
    if (a.state !== 0 && a.state !== 2) continue;
    const ang = Math.hypot(a.vx,a.vy) > 1 ? Math.atan2(a.vy, a.vx) : (a.role===3 ? a.aim : -Math.PI/2);
    const hx = a.x + Math.cos(ang)*1.3, hy = a.y + Math.sin(ang)*1.3;
    if (a.state === 2){ ctx.strokeStyle = '#4aa3ff'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.arc(a.x, a.y, 5.2, 0, 7); ctx.stroke(); }
    ctx.fillStyle = a.role===2 ? '#f4f4f4' : a.body;
    ctx.beginPath(); ctx.arc(a.x, a.y, 3.5, 0, 7); ctx.fill();
    if (a.vest){ ctx.strokeStyle = '#c9cfc0'; ctx.lineWidth = .8; ctx.beginPath(); ctx.moveTo(a.x-3, a.y); ctx.lineTo(a.x+3, a.y); ctx.stroke(); }
    if (a.role === 2){ ctx.fillStyle = '#d93a2b'; ctx.fillRect(a.x-.7, a.y-2.4, 1.4, 4.8); ctx.fillRect(a.x-2.4, a.y-.7, 4.8, 1.4); }
    ctx.fillStyle = a.hair; ctx.beginPath(); ctx.arc(hx, hy, 1.9, 0, 7); ctx.fill();
    if (a.role === 3){ ctx.fillStyle = '#ffe27a'; ctx.fillRect(a.x + Math.cos(a.aim)*4 - 1.2, a.y + Math.sin(a.aim)*4 - 1.2, 2.4, 2.4); }
    if (a.hp < 99 && a.state === 0){ ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(a.x-4, a.y-7, 8, 1.6); ctx.fillStyle = a.hp > 50 ? '#cde05a' : '#ff6a4a'; ctx.fillRect(a.x-4, a.y-7, 8*a.hp/100, 1.6); }
  }
}
function crs(x, y, ang, stress){
  ctx.save(); ctx.translate(x, y); ctx.rotate(ang);
  ctx.fillStyle = 'rgba(0,0,0,.35)'; ctx.fillRect(-6, -7, 13, 15);
  ctx.fillStyle = '#0c1428'; ctx.fillRect(-6.5, -7.5, 12, 15);
  ctx.fillStyle = '#1d2b4f'; ctx.fillRect(-5.5, -6.5, 10, 13);
  ctx.fillStyle = '#2b3d6b'; ctx.fillRect(-5.5, -7, 4, 3); ctx.fillRect(-5.5, 4, 4, 3);
  ctx.fillStyle = 'rgba(200,215,235,.55)'; ctx.fillRect(5, -7.5, 2.4, 15);
  ctx.fillStyle = '#0f1a33'; ctx.beginPath(); ctx.arc(0, 0, 4.2, 0, 7); ctx.fill();
  ctx.strokeStyle = '#86b6ff'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.arc(0, 0, 3.2, -.8, .8); ctx.stroke();
  ctx.restore();
  if (stress){ ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.arc(x+5, y-9, 1.3, 0, 7); ctx.fill(); ctx.fillRect(x+4.6, y-12, .8, 2.5); }
}
function drawCordons(now){
  for (const c of G.cordons){
    if (c.dead) continue;
    const ang = Math.atan2(c.dy, c.dx);
    for (const t of c.tiles) crs((t%W+.5)*T, (((t/W)|0)+.5)*T, ang, c.filmedT > 0 || (c.bannerBlock && Math.floor(now*4)%2));
  }
}
function drawGrens(){
  for (const g of G.grens){
    crs(g.x, g.y, g.aim, g.filmedT > 0);
    ctx.save(); ctx.translate(g.x, g.y); ctx.rotate(g.aim);
    ctx.fillStyle = '#3b3f48'; ctx.fillRect(2, -1.6, 12, 3.2);
    if (g.flash > 0){ ctx.fillStyle = '#ffd36b'; ctx.beginPath(); ctx.arc(15, 0, 3.5, 0, 7); ctx.fill(); }
    ctx.restore();
  }
}
function drawBanners(){
  for (const a of G.agents){
    if (a.state!==0 || a.role!==1) continue;
    let ang = 0;
    let bc = null, bd = 1e9;
    for (const c of G.cordons){ if (c.dead) continue; const d=(c.cx-a.x)**2+(c.cy-a.y)**2; if (d<bd){bd=d; bc=c;} }
    if (bc && bd < 120*120) ang = bc.axis==='h' ? 0 : Math.PI/2;
    else { const f=G.fExit; const ti=tileOf(a); ang = f ? Math.atan2(f.dy[ti], f.dx[ti]) + Math.PI/2 : 0; }
    const maxD = 7 * (1 + 0.4*L('sturdy'));
    ctx.save(); ctx.translate(a.x, a.y); ctx.rotate(ang);
    ctx.fillStyle = '#5b4632'; ctx.fillRect(-15, -1, 2, 6); ctx.fillRect(13, -1, 2, 6);
    ctx.fillStyle = a.planted ? '#f4efe2' : '#e5dfcf'; ctx.fillRect(-14, -4, 28, 8);
    ctx.fillStyle = '#d93a2b'; ctx.font = '7px "Permanent Marker", cursive'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('ON TIENT', 0, .5);
    ctx.restore();
    if (a.planted){ ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(a.x-10, a.y+8, 20, 2); ctx.fillStyle = '#f4efe2'; ctx.fillRect(a.x-10, a.y+8, 20*Math.max(0,a.dur)/maxD, 2); }
  }
}
function drawProjs(){
  for (const p of G.projs){
    const k = p.t/p.dur, x = p.sx + (p.tx-p.sx)*k, y = p.sy + (p.ty-p.sy)*k, h = Math.sin(Math.PI*k)*34;
    ctx.fillStyle = 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.ellipse(x, y, 2.6, 1.4, 0, 0, 7); ctx.fill();
    ctx.fillStyle = 'rgba(220,230,180,.35)'; for (let s=1; s<4; s++){ const kk=Math.max(0,k-s*.06); const xx=p.sx+(p.tx-p.sx)*kk, yy=p.sy+(p.ty-p.sy)*kk-Math.sin(Math.PI*kk)*34; ctx.beginPath(); ctx.arc(xx, yy, 1.6+s*.5, 0, 7); ctx.fill(); }
    ctx.fillStyle = '#9aa0a6'; ctx.fillRect(x-1.8, y-h-1.2, 3.6, 2.4);
  }
}
function drawClouds(now){
  for (const c of G.clouds){
    const fade = c.age > c.life-2 ? (c.life-c.age)/2 : 1;
    const r = mulberry(c.seed|0);
    ctx.fillStyle = `rgba(205,224,90,${.28*fade})`;
    for (let k=0; k<6; k++){
      const a = r()*6.28 + now*.3*(k%2?1:-1), d = r()*c.r*.55, rr = c.r*(.45 + r()*.3);
      ctx.beginPath(); ctx.arc(c.x + Math.cos(a)*d, c.y + Math.sin(a)*d, rr, 0, 7); ctx.fill();
    }
    if (c.age < c.life - 2.5 && c.r > 14){
      const s = c.r/30;
      ctx.fillStyle = `rgba(40,48,16,${.75*fade})`; ctx.strokeStyle = `rgba(40,48,16,${.75*fade})`; ctx.lineWidth = 1.4*s;
      ctx.beginPath(); ctx.arc(c.x-5*s, c.y-2*s, 1.6*s, 0, 7); ctx.arc(c.x+5*s, c.y-2*s, 1.6*s, 0, 7); ctx.fill();
      ctx.beginPath(); ctx.moveTo(c.x-8*s, c.y-7*s); ctx.lineTo(c.x-3*s, c.y-4.5*s); ctx.moveTo(c.x+8*s, c.y-7*s); ctx.lineTo(c.x+3*s, c.y-4.5*s); ctx.stroke();
      ctx.beginPath(); ctx.arc(c.x, c.y+7*s, 4*s, Math.PI*1.15, Math.PI*1.85); ctx.stroke();
    }
  }
}
function drawHeli(){
  const cx = W*T/2 + Math.cos(G.heli.ang)*W*T*.32, cy = H*T/2 + Math.sin(G.heli.ang*1.3)*H*T*.3;
  ctx.fillStyle = 'rgba(0,0,0,.16)';
  ctx.beginPath(); ctx.ellipse(cx, cy, 13, 6, G.heli.ang+1.2, 0, 7); ctx.fill();
  ctx.save(); ctx.translate(cx, cy); ctx.rotate(performance.now()/40);
  ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.moveTo(-22,0); ctx.lineTo(22,0); ctx.moveTo(0,-22); ctx.lineTo(0,22); ctx.stroke();
  ctx.restore();
}
function drawFloats(){
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '700 9px "Barlow Condensed", sans-serif';
  for (const f of G.floats){
    const a = 1 - f.t/1.4, y = f.y - f.t*16;
    ctx.globalAlpha = a; ctx.lineWidth = 2.5; ctx.strokeStyle = '#17181c'; ctx.strokeText(f.s, f.x, y); ctx.fillStyle = f.col; ctx.fillText(f.s, f.x, y);
  }
  ctx.globalAlpha = 1;
}
function drawFx(){
  for (const f of G.fx){ const k = f.t/0.5; ctx.strokeStyle = f.ring ? `rgba(205,224,90,${1-k})` : `rgba(255,255,255,${.6*(1-k)})`; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(f.x, f.y, (f.ring?6:10) + k*14, 0, 7); ctx.stroke(); }
}
function drawFlash(){
  const f = G.flash, a = Math.min(1, f.t/0.4, (3.2 - f.t)/0.25 + 0.2);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.globalAlpha = clamp(a, 0, 1);
  ctx.save(); ctx.translate(stageW/2, stageH*0.38); ctx.rotate(-0.04);
  const size = clamp(stageW/16, 20, 44);
  ctx.font = `${size}px "Permanent Marker", cursive`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  const w = Math.min(stageW - 24, ctx.measureText(f.text).width + 40), h = size*1.6 + (f.sub ? 18 : 0);
  ctx.fillStyle = '#c9a06a'; ctx.fillRect(-w/2, -h/2, w, h);
  ctx.fillStyle = '#21180f'; ctx.fillText(f.text, 0, f.sub ? -8 : 0, w - 20);
  if (f.sub){ ctx.font = '700 14px "Barlow Condensed", sans-serif'; ctx.fillText(f.sub.toUpperCase(), 0, size*.55); }
  ctx.restore(); ctx.globalAlpha = 1;
}

/* ================= HUD / tools ================= */
const toolBtns = Array.from(document.querySelectorAll('.tool'));
function setTool(t){ tool = t; toolBtns.forEach(b => b.setAttribute('aria-pressed', String(b.dataset.tool === t))); }
toolBtns.forEach(b => b.addEventListener('click', () => setTool(b.dataset.tool)));
function updateTools(){
  for (const r of [1,2,3]){ $('c-'+r).textContent = G.charges ? G.charges[r] : 0; toolBtns[r].classList.toggle('empty', !G.charges || G.charges[r] <= 0); }
}
function updateHud(){
  $('h-acte').textContent = 'Acte ' + roman(save.acte);
  $('h-rep').textContent = 'Répression niv. ' + save.rep;
  const alive = G.agents ? G.agents.filter(a => a.state===0 || a.state===1).length : 0;
  $('h-orga').textContent = fmt(Math.round((G.spawned||0)*173/100)*100);
  $('h-pref').textContent = fmt(Math.max(0, (alive + (G.exited||0)) * 11 - (G.gav||0)*3));
  const ph = $('h-phase');
  ph.className = 'phase' + (G.nasse ? ' nasse' : G.prefet ? ' prefet' : '');
  ph.textContent = G.nasse ? 'Nasse' : G.prefet ? 'Parcours modifié' : 'Cortège';
  $('h-out').textContent = G.exited || 0; $('h-obj').textContent = G.objective || 0;
  const tot = G.total || 1;
  $('h-bar').style.width = Math.min(100, 100*(G.exited||0)/tot) + '%';
  $('h-bar').style.background = (G.exited||0) >= (G.objective||1) ? 'var(--ok)' : 'var(--carton)';
  $('h-mark').style.left = (100*(G.objective||0)/tot) + '%';
}

cv.addEventListener('pointerdown', e => {
  if (mode !== 'play' || paused) return;
  const r = cv.getBoundingClientRect();
  const wx = (e.clientX - r.left - offX)/scale, wy = (e.clientY - r.top - offY)/scale;
  if (wx < 0 || wy < 0 || wx > W*T || wy > H*T) return;
  applyTool(wx, wy);
});
window.addEventListener('keydown', e => {
  if (mode !== 'play') return;
  const map = {'1':'meg','2':'1','3':'2','4':'3'};
  if (map[e.key]) { setTool(map[e.key]); e.preventDefault(); }
  if (e.key === ' ' || e.key === 'Escape'){ togglePause(); e.preventDefault(); }
});
$('b-pause').addEventListener('click', () => { if (mode === 'play') togglePause(); });
function togglePause(){ paused = !paused; if (paused) showScreen('pause'); else hideScreen(); }

/* ================= screens ================= */
const screen = $('screen');
function hideScreen(){ screen.hidden = true; screen.innerHTML = ''; }
function showScreen(kind, data){
  screen.hidden = false;
  let html = '';
  if (kind === 'title'){
    html = `<div class="sheet">
      <div class="placard"><p class="kicker">Paris, 17 octobre</p><h1>Bismillah</h1><p class="kicker" style="margin-top:6px">C’est les ténèbres</p>
      <p>Tu n'es pas un manifestant. Tu es la manif. Fais sortir le cortège avant que la préfecture referme toutes les rues.</p></div>
      <div class="howto">
        <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 12h13M12 6l6 6-6 6"/></svg><span>Le cortège marche tout seul vers les sorties vertes. Les CRS, les lacrymos et le préfet vont tout faire pour l'en empêcher.</span></div>
        <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"><path d="M3 10v4h3l7 4V6L6 10H3z"/></svg><span><b>Mégaphone</b> : touche la carte, le cortège converge vers ce point puis repart vers la sortie. Retouche-le pour le ranger.</span></div>
        <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="2" fill="currentColor"/></svg><span><b>Rôles</b> : choisis Banderole, Medic ou Filmeur, puis touche la foule. Le manifestant le plus proche prend le rôle.</span></div>
        <div><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 4v17M21 4v17M3 6h18v8H3z"/></svg><span>La banderole va bloquer le cordon le plus proche. Le medic soigne et relève. Le filmeur ralentit la police et ramène des preuves, sauf si on lui saisit son téléphone.</span></div>
      </div>
      <div class="actions"><button class="big" id="s-go">${save.runs ? 'Reprendre à l’acte ' + roman(save.acte) : 'Descendre dans la rue'}</button>
      ${save.runs ? '<button class="ghost" id="s-reset">Effacer la progression</button>' : ''}</div>
    </div>`;
  } else if (kind === 'pause'){
    html = `<div class="sheet"><div class="placard"><h2>Pause</h2><p>Le préfet attend.</p></div>
      <div class="actions"><button class="big" id="s-resume">Reprendre</button><button class="ghost" id="s-quit">Abandonner l’acte</button></div></div>`;
  } else if (kind === 'prep' || kind === 'bilan'){
    let top = '';
    if (kind === 'bilan'){
      const d = data;
      top = `<div class="placard"><p class="kicker">Acte ${roman(d.acte)} · bilan</p>
        <h2>${d.win ? 'Le cortège est passé.' : 'Nassés.'}</h2>
        <div class="stats">
          <div class="stat"><b>${d.exited}</b><span>Sortis / ${d.objective}</span></div>
          <div class="stat"><b>${d.blesses}</b><span>Blessés</span></div>
          <div class="stat"><b>${d.gav}</b><span>Gardes à vue</span></div>
          <div class="stat"><b>${d.preuves}</b><span>Preuves</span></div>
        </div>
        <p class="chiffres">Selon les organisateurs : <b>${fmt(d.orga)}</b> manifestants.<br>Selon la préfecture : <b>${fmt(d.pref)}</b>, dont ${fmt(Math.round(d.pref*.8))} casseurs.${d.lost ? `<br>${d.lost} preuve${d.lost>1?'s':''} perdue${d.lost>1?'s':''} avec les téléphones saisis.` : ''}</p>
        <p class="gain">+${d.gain} colère</p>
        <p>${d.win ? 'La répression monte d’un cran : niveau ' + save.rep + '.' : 'Le mouvement apprend. Même niveau de répression à l’acte suivant.'}</p></div>`;
    } else {
      top = `<div class="placard"><p class="kicker">Avant l’acte ${roman(save.acte)}</p><h2>Le mouvement s’organise</h2><p>Dépense la colère accumulée avant de redescendre dans la rue.</p></div>`;
    }
    const rows = UPG.map(u => {
      const lv = L(u.id), max = lv >= u.max, c = cost(u);
      return `<div class="upg"><div class="n">${u.name}<small>niv. ${lv}${max ? ' · max' : ''}</small></div><div class="d">${u.desc}</div>
        <button data-upg="${u.id}" ${max || c > save.colere ? 'disabled' : ''}>${max ? '—' : c}</button></div>`;
    }).join('');
    html = `<div class="sheet">${top}
      <div class="shop"><header><h3>Caisse de grève</h3><div class="colere">Colère <b>${fmt(save.colere)}</b></div></header>${rows}</div>
      <div class="actions"><button class="big" id="s-go">Acte ${roman(save.acte)}</button></div></div>`;
  }
  screen.innerHTML = html;
  const on = (id, fn) => { const el = $(id); if (el) el.addEventListener('click', fn); };
  on('s-go', () => { if (kind === 'title' && save.runs) showScreen('prep'); else startPlay(); });
  on('s-resume', togglePause);
  on('s-quit', () => { paused = false; endRun(); });
  on('s-reset', ev => {
    const b = ev.currentTarget;
    if (b.dataset.armed){ save = {colere:0, acte:1, rep:1, lv:{}, best:1, runs:0}; persist(); showScreen('title'); }
    else { b.dataset.armed = '1'; b.textContent = 'Sûr ? Clique encore pour tout effacer'; }
  });
  screen.querySelectorAll('[data-upg]').forEach(b => b.addEventListener('click', () => {
    const u = UPG.find(x => x.id === b.dataset.upg); const c = cost(u);
    if (save.colere < c || L(u.id) >= u.max) return;
    save.colere -= c; save.lv[u.id] = L(u.id) + 1; persist();
    const y = screen.scrollTop; showScreen(kind, data); screen.scrollTop = y;
  }));
  const first = screen.querySelector('.big'); if (first) first.focus({preventScroll:true});
}
function startPlay(){
  hideScreen();
  newRun(false);
  mode = 'play'; paused = false;
  tickQ = []; tick('start', true);
  updateTools(); updateHud();
}
function endRun(){
  if (mode !== 'play') return;
  for (const a of G.agents){
    if (a.state === 0 || a.state === 2){ G.gav++; if (a.stash){ G.lostPreuves += a.stash; a.stash = 0; } a.state = 3; }
    else if (a.state === 1){ G.blesses++; if (a.stash){ G.preuves += a.stash; a.stash = 0; } a.state = 3; }
  }
  G.gav += G.total - G.spawned; // jamais partis de République
  const win = G.exited >= G.objective;
  const gain = G.exited + 3*G.preuves + (win ? 20 + 8*save.rep : 0);
  const d = {acte:save.acte, win, exited:G.exited, objective:G.objective, blesses:G.blesses, gav:G.gav, preuves:G.preuves, lost:G.lostPreuves, gain,
    orga: Math.round(G.total*173/100)*100, pref: Math.max(40, G.exited*11)};
  save.colere += gain; save.runs++; save.acte++; if (win) save.rep++; save.best = Math.max(save.best, save.acte);
  persist();
  mode = 'bilan';
  tick(win ? 'win' : 'lose', true);
  showScreen('bilan', d);
}

/* ================= loop ================= */
let last = performance.now();
function frame(now){
  const dt = Math.min(0.05, (now - last)/1000); last = now;
  if (mode === 'play' && !paused){
    update(dt);
    G.hudT -= dt; if (G.hudT <= 0){ G.hudT = 0.15; updateHud(); }
  } else if (mode !== 'play' && G.agents && G.demo){
    update(dt);
  }
  render();
  requestAnimationFrame(frame);
}
function boot(){
  loadSave();
  resize();
  newRun(true);
  for (let i=0; i<60; i++) spawnAgent();
  updateHud(); updateTools();
  showScreen('title');
  requestAnimationFrame(frame);
}
let rzT = 0;
window.addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(resize, 80); });
if (document.fonts && document.fonts.ready) document.fonts.ready.then(() => { if (W) renderMap(); });
window.__nasse = {G, update, newRun, applyTool, setTool: t => { tool = t; }, endRun, save: () => save, get exits(){ return exits; }, get mode(){ return mode; }, set mode(v){ mode = v; }};
boot();
})();
