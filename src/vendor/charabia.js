/*!
 * Charabia : moteur de voix-charabia (voice blips) pour personnages de jeu.
 * Autonome, sans dépendance : Web Audio API uniquement.
 *
 *   Charabia.speak(texte, voix, options?)  -> { timeline, start } ou null
 *   Charabia.stop()
 *   Charabia.decode('MUMBLE1.…') -> voix     Charabia.encode(voix) -> code
 *
 * Une voix est un objet simple (voir Charabia.DEFAULT) ; les clés manquantes prennent la valeur par défaut.
 * options.audioContext : réutiliser l'AudioContext du jeu au lieu d'en créer un.
 */
(function (root) {
'use strict';
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
function hash(str){ let h = 2166136261 >>> 0; for (let i = 0; i < str.length; i++){ h ^= str.charCodeAt(i); h = Math.imul(h, 16777619); } return h >>> 0; }
function rngFrom(seed){ let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) >>> 0; let t = a; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
const gauss = r => (r() + r() + r() - 1.5) * 2;

/* ============ Données ============ */
const MOODS = {
  normal:   { n:'Normal',    d:'La voix telle que vous l’avez réglée.' },
  joyeux:   { n:'Joyeux',    d:'Plus aigu, la mélodie sautille.', semi:3, speed:1.1, var:1.5, bounce:1, inton:1.3 },
  triste:   { n:'Triste',    d:'Grave et lent, les fins de phrase retombent.', semi:-2.5, speed:.72, var:.6, fall:1, breath:18, vib:12, gain:.85, pauseMul:1.4 },
  effraye:  { n:'Effrayé',   d:'Aigu, pressé, ça tremble et ça bégaie.', semi:4, speed:1.28, var:1.3, trem:[9,.4], stutter:.22, hesit:.12, jitter:20 },
  furieux:  { n:'Furieux',   d:'Fort, sec, saturé, consonnes qui claquent.', semi:1, speed:1.15, var:.8, gain:1.35, crunch:40, artic:1.7, gate:.85, pauseMul:.7 },
  ivre:     { n:'Ivre',      d:'Le tempo tangue, les syllabes glissent, hic.', semi:-1, speed:.85, var:1.2, drift:1, slur:1, hic:.14, jitter:10 },
  atone:    { n:'Atone',     d:'Monocorde, traînant, zéro énergie.', semi:-3, speed:.8, var:.15, inton:.1, gain:.8, gate:1.15 },
  endormi:  { n:'Endormi',   d:'Ralentit, s’affaisse, finit par bâiller.', semi:-2, speed:.75, var:.4, slowdown:1, breath:25, yawn:1, gain:.8 },
  chuchote: { n:'Chuchoté',  d:'Uniquement du souffle, sans voix.', whisper:1, gain:.75, speed:.95 },
  robot:    { n:'Robot',     d:'Monotone, notes justes, modulation métallique.', flat:1, quant:'chroma', trem:[50,.7], src:'chip', gate:.7, vib:-100, jitter:-100 },
  surexcite:{ n:'Surexcité', d:'Très aigu, très vite, presque sans pause.', semi:5, speed:1.55, var:2, gain:1.15, pauseMul:.45, inton:1.4 },
  enrhume:  { n:'Enrhumé',   d:'Nez bouché et reniflements.', nasal:1, semi:-.5, sniff:.6, breath:10 }
};
const MOOD_KEYS = Object.keys(MOODS);
const SCALES = { penta:[0,2,4,7,9], majeur:[0,2,4,5,7,9,11], chroma:[0,1,2,3,4,5,6,7,8,9,10,11] };
const FORM = { a:[780,1250,2550], e:[440,1950,2650], i:[300,2250,3000], o:[480,920,2450], u:[330,800,2300], y:[310,1750,2250], oe:[520,1450,2450] };
const DIGITV = {'0':'e','1':'oe','2':'oe','3':'a','4':'a','5':'i','6':'i','7':'e','8':'i','9':'oe'};

const DEFAULT = { name:'Pip', seed:12, hue:150, age:30, gender:50, size:50, mood:'normal', moodAmt:70,
  speed:13, pitchVar:2.5, inton:50, pauses:50, caps:1, scale:'libre', grain:'syllabe', lang:'fr', live:0,
  src:'voix', pitch:180, formant:1.06, breath:10, artic:50, gate:80, vib:8, jitter:6, crunch:0, echo:0, vol:80 };

const NUM = { seed:[0,9999], hue:[0,359], age:[4,90], gender:[0,100], size:[0,100], moodAmt:[0,100], speed:[3,28], pitchVar:[0,8],
  inton:[0,100], pauses:[0,100], pitch:[50,700], formant:[0.6,1.7], breath:[0,100], artic:[0,100], gate:[25,130], vib:[0,100],
  jitter:[0,100], crunch:[0,100], echo:[0,100], vol:[0,100], caps:[0,1], live:[0,1] };
const ENUM = { mood:MOOD_KEYS, scale:['libre','penta','majeur','chroma'], grain:['lettre','syllabe','mot'], lang:['fr','en'], src:['voix','bip','doux','chip','souffle'] };
const KEYS = ['name','seed','hue','age','gender','size','mood','moodAmt','speed','pitchVar','inton','pauses','caps','scale','grain','lang','live','src','pitch','formant','breath','artic','gate','vib','jitter','crunch','echo','vol'];


/* ============ Macros personnage & validation ============ */
function applyMacros(p){
  const age = p.age, g = p.gender / 100, s = (p.size - 50) / 50;
  const teen = clamp((age - 11) / 6, 0, 1);
  const elder = clamp((age - 58) / 30, 0, 1);
  const adultHz = lerp(215, 112, g);
  let hz = lerp(265, adultHz, teen);
  hz *= lerp(1, g > .5 ? 1.06 : .9, elder);
  hz *= Math.pow(2, -s * .75);
  let f = lerp(1.32, lerp(1.17, .96, g), teen) * Math.pow(2, -s * .45);
  p.pitch = Math.round(clamp(hz, 50, 700));
  p.formant = Math.round(clamp(f, .6, 1.7) * 100) / 100;
  p.speed = Math.round(clamp(13 * (1 - .3 * elder) * (1 - .2 * s) * (age < 12 ? 1.08 : 1), 3, 28) * 2) / 2;
  p.jitter = Math.round(4 + 40 * elder);
  p.vib = Math.round(6 + 22 * elder);
  p.breath = Math.round(8 + 18 * elder + (s < -.6 ? 8 : 0));
}

function sanitize(obj){
  const out = Object.assign({}, DEFAULT);
  for (const k of KEYS){
    if (!(k in obj)) continue;
    const v = obj[k];
    if (k === 'name'){ out.name = String(v).slice(0, 24) || DEFAULT.name; continue; }
    if (ENUM[k]){ if (ENUM[k].includes(v)) out[k] = v; continue; }
    if (NUM[k]){ const n = Number(v); if (isFinite(n)) out[k] = clamp(n, NUM[k][0], NUM[k][1]); }
  }
  return out;
}

/* ============ Analyse du texte ============ */
const VOWELS = 'aeiouyàâäéèêëîïôöùûüœæ';
const isV = c => VOWELS.includes(c);
const CLUSTERS = ['ch','ph','th','sh','gn','tr','pr','br','cr','dr','gr','fr','vr','pl','bl','cl','gl','fl','qu','gu'];

function cClass(on){
  const o = on.replace(/[^a-zçñ]/g, '');
  if (!o) return { k:'', sib:false };
  if (/(ch|sh|ss|s|z|x|ç|j)$/.test(o)) return { k:'fric', sib:true };
  if (/(ph|th|f|v)$/.test(o)) return { k:'fric', sib:false };
  if (/(gn|m|n|ñ)$/.test(o)) return { k:'nasal', sib:false };
  if (/(qu|gu|q|c|k|p|t|b|d|g)$/.test(o)) return { k:'plos', sib:false };
  if (/[lrwy]$/.test(o)) return { k:'liq', sib:false };
  if (/h$/.test(o)) return cClass(o.slice(0, -1));
  return { k:'', sib:false };
}
function vClass(v, lang){
  if (/o[uùû]/.test(v)) return 'u';
  const c = v[0];
  if (lang === 'fr'){
    if (/oi|oy/.test(v)) return 'a';
    if (/au/.test(v)) return 'o';
    if (/[aeé]i|[éèêë]/.test(v)) return 'e';
    if (/eu|œ/.test(v)) return 'oe';
    if ('aàâä'.includes(c)) return 'a';
    if (c === 'e') return v.length > 1 ? vClass(v.slice(1), lang) : 'oe';
    if ('iîïy'.includes(c)) return 'i';
    if ('oôö'.includes(c)) return 'o';
    if ('uùûü'.includes(c)) return 'y';
    return 'oe';
  }
  if (/ee|ea|ie|ey|ei/.test(v)) return 'i';
  if (/oo|ew|ue/.test(v)) return 'u';
  if (/oa|oe|au|aw/.test(v)) return 'o';
  if (/ai|ay/.test(v)) return 'e';
  if ('aàâä'.includes(c)) return 'a';
  if ('eéèêë'.includes(c)) return 'e';
  if ('iîïy'.includes(c)) return 'i';
  if ('oôö'.includes(c)) return 'o';
  if ('uùûü'.includes(c)) return 'oe';
  return 'oe';
}

// Lettres répétées = son tenu. « aaaa » tient, mais « ee » / « oo » (see, book) restent normaux.
function holdOf(str, any){
  let best = 1, run = 1;
  for (let i = 1; i < str.length; i++){
    if (str[i] === str[i-1] && /[\p{L}]/u.test(str[i])){ run++; if (run > best || (run === best && run === 2)) best = run, bestCh = str[i]; } else run = 1;
  }
  if (best === 2 && !any && 'eo'.includes(bestCh)) return 1;
  return Math.min(best, 12);
}
let bestCh = '';
const collapse = w => w.replace(/(\p{L})\1+/gu, '$1');
function syllabify(lw, lang){
  const n = lw.length, vf = new Array(n).fill(false);
  for (let i = 0; i < n; i++){
    const c = lw[i]; let v = isV(c);
    if (v && c === 'u' && i > 0 && (lw[i-1] === 'q' || (lw[i-1] === 'g' && i + 1 < n && isV(lw[i+1])))) v = false;
    if (v && c === 'y' && i + 1 < n && isV(lw[i+1]) && (i === 0 || !isV(lw[i-1]))) v = false;
    vf[i] = v;
  }
  const groups = []; let i = 0;
  while (i < n){
    if (/\d/.test(lw[i])){ groups.push({ s:i, e:i+1, digit:true }); i++; continue; }
    if (vf[i]){ let j = i; while (j < n && vf[j]) j++; groups.push({ s:i, e:j }); i = j; }
    else i++;
  }
  if (groups.length > 1){
    const g = groups[groups.length - 1];
    const tail = lw.slice(g.s);
    if (!g.digit && lw.slice(g.s, g.e) === 'e' && /^es?$/.test(tail) && g.s > 0 && !vf[g.s - 1]) groups.pop();
  }
  if (!groups.length){ const c = cClass(lw.slice(0, 2)); return [{ s:0, e:n, vc:'oe', cc:c.k || (/[mn]/.test(lw) ? 'nasal' : ''), sib:c.sib, hold:holdOf(lw, true) }]; }
  const starts = groups.map((g, k) => {
    if (k === 0) return 0;
    const pe = groups[k-1].e, cs = g.s, cl = cs - pe;
    if (cl <= 1) return pe;
    return CLUSTERS.includes(lw.slice(cs - 2, cs)) ? cs - 2 : cs - 1;
  });
  return groups.map((g, k) => {
    const s = starts[k], e = k + 1 < groups.length ? starts[k+1] : n;
    const cc = cClass(lw.slice(s, g.s));
    const vs = lw.slice(g.s, g.e);
    let vc = g.digit ? DIGITV[lw[g.s]] : vClass(vs, lang);
    if (lang === 'fr' && vs === 'e' && e > g.e) vc = 'e';
    return { s, e, vc, cc:cc.k, sib:cc.sib, gs:g.s, ge:g.e, hold:holdOf(vs, false) };
  });
}

const TOKRE = /([\p{L}\p{M}\p{N}'’]+(?:-[\p{L}\p{M}\p{N}'’]+)*)|(\.{2,}|…|[.!?]+|[,;:]|[—–-])|(\n+)|([^\S\n]+)|([\s\S])/gu;

function analyze(text, lang, grain){
  const units = [], sents = [{ n:0, type:'.' }];
  let sent = 0;
  const closeSent = type => { sents[sent].type = type; if (sents[sent].n > 0){ sents.push({ n:0, type:'.' }); sent++; } };
  const pushV = u => { u.type = 'v'; u.sent = sent; u.pos = sents[sent].n++; units.push(u); };
  TOKRE.lastIndex = 0; let m;
  while ((m = TOKRE.exec(text))){
    const s = m.index, e = s + m[0].length;
    if (m[1]){
      const w = m[1], lw = w.toLowerCase();
      const letters = w.replace(/[^\p{L}]/gu, '');
      const caps = letters.length > 1 && letters === letters.toUpperCase() && letters !== letters.toLowerCase();
      const syl = syllabify(lw, lang);
      if (grain === 'mot'){
        pushV({ s, e, vowel:syl[0].vc, cons:syl[0].cc, sib:syl[0].sib, caps, word:collapse(lw), iw:0, wl:1, nsyl:syl.length, hold:Math.max(...syl.map(y => y.hold || 1)) });
      } else if (grain === 'syllabe'){
        syl.forEach((y, k) => pushV({ s:s + y.s, e:s + y.e, vowel:y.vc, cons:y.cc, sib:y.sib, caps, word:collapse(lw), iw:k, wl:syl.length, hold:y.hold || 1 }));
      } else {
        const idx = [];
        for (let i = 0; i < lw.length; i++){
          if (!/[\p{L}\p{N}]/u.test(lw[i])) continue;
          if (idx.length && lw[i] === lw[idx[idx.length - 1].i] && idx[idx.length - 1].i + idx[idx.length - 1].n === i){ idx[idx.length - 1].n++; continue; }
          idx.push({ i, n:1 });
        }
        const cw = collapse(lw);
        idx.forEach((r, k) => {
          const i = r.i;
          const y = syl.find(q => i >= q.s && i < q.e) || syl[syl.length - 1];
          const inV = y.gs !== undefined && i >= y.gs && i < y.ge;
          const cc = inV ? { k:'', sib:false } : cClass(lw[i]);
          pushV({ s:s + i, e:s + i + r.n, vowel:y.vc, cons:cc.k, sib:cc.sib, caps, word:cw, iw:k, wl:idx.length, letter:lw[i], hold:r.n });
        });
      }
    } else if (m[2]){
      const p = m[2]; let w, end = null;
      if (/[,;:]/.test(p)) w = p === ',' ? 2.2 : 3;
      else if (/[—–-]/.test(p)) w = 1.8;
      else {
        const ell = /…|\.\./.test(p);
        w = ell ? 6 : 4.5;
        end = p.includes('?') ? '?' : p.includes('!') ? '!' : ell ? '…' : '.';
        if (p.includes('?') && p.includes('!')) end = '?!';
      }
      units.push({ type:'gap', s, e, w, punct:true, sentEnd:!!end });
      if (end) closeSent(end);
    } else if (m[3]){
      units.push({ type:'gap', s, e, w:4, punct:true, sentEnd:true });
      if (sents[sent].n > 0) closeSent(sents[sent].type);
    } else if (m[4]){
      units.push({ type:'gap', s, e, w: grain === 'lettre' ? .9 : grain === 'mot' ? .5 : .35 });
    } else {
      units.push({ type:'gap', s, e, w:.15 });
    }
  }
  return { units, sents };
}

/* ============ Humeur ============ */
function moodMix(p){
  const m = MOODS[p.mood] || {}, a = p.moodAmt / 100;
  const L = v => v === undefined ? 1 : 1 + (v - 1) * a;
  return {
    semi:(m.semi || 0) * a, speed:L(m.speed), var:L(m.var), inton:L(m.inton), gain:L(m.gain), gate:L(m.gate), pauseMul:L(m.pauseMul), artic:L(m.artic),
    bounce:(m.bounce || 0) * a, fall:(m.fall || 0) * a, drift:(m.drift || 0) * a, slur:(m.slur || 0) * a, hic:(m.hic || 0) * a,
    stutter:(m.stutter || 0) * a, hesit:(m.hesit || 0) * a, slowdown:(m.slowdown || 0) * a, yawn:!!m.yawn && a > .3, sniff:(m.sniff || 0) * a,
    breathAdd:(m.breath || 0) * a, vibAdd:(m.vib || 0) * a, jitterAdd:(m.jitter || 0) * a, crunchAdd:(m.crunch || 0) * a,
    trem: m.trem ? [m.trem[0], m.trem[1] * a] : null, whisper:(m.whisper || 0) * a,
    flat:!!m.flat && a > .15, quant: m.quant && a > .15 ? m.quant : null, src: m.src && a > .3 ? m.src : null, nasal:(m.nasal || 0) * a
  };
}
function quantize(semi, scale){
  const sc = SCALES[scale]; if (!sc) return semi;
  const oct = Math.floor(semi / 12), r = semi - oct * 12;
  let best = 0, bd = 99;
  for (const d of sc.concat([12])){ const dd = Math.abs(d - r); if (dd < bd){ bd = dd; best = d; } }
  return oct * 12 + best;
}

/* ============ Partition (timeline) ============ */
function build(text, p){
  const M = moodMix(p);
  const { units, sents } = analyze(text, p.lang, p.grain);
  const rate = { lettre:1.8, syllabe:1, mot:.5 }[p.grain] || 1;
  const baseStep = 1 / (p.speed * rate * M.speed);
  const live = p.live ? (Math.random() * 1e9) | 0 : 0;
  const grng = rngFrom(hash(text) ^ p.seed ^ live);
  const scale = M.quant || (p.scale === 'libre' ? null : p.scale);
  const events = [];
  const N = units.filter(u => u.type === 'v').length;
  let t = .06, vi = 0, prevF = null, yawnDone = false;
  for (let ui = 0; ui < units.length; ui++){
    const u = units[ui];
    const prog = N > 1 ? vi / (N - 1) : 0;
    let step = baseStep;
    if (M.slowdown) step *= 1 + .9 * M.slowdown * prog;
    if (M.drift) step *= Math.max(.4, 1 + .35 * M.drift * Math.sin(t * 1.7 + 1) + (grng() - .5) * .35 * M.drift);
    if (u.type === 'gap'){
      const w = u.w * (u.punct ? (p.pauses / 50) * M.pauseMul : 1);
      events.push({ kind:'gap', t, step:Math.max(.001, step * w), s:u.s, e:u.e });
      t += step * w;
      if (u.sentEnd){
        prevF = null;
        if (M.sniff && grng() < M.sniff * .7) events.push({ kind:'sniff', t:t - step * w * .6, s:u.e, e:u.e, nr:true });
        if (M.yawn && !yawnDone && ui > units.length * .35){
          yawnDone = true;
          const f = p.pitch * Math.pow(2, (M.semi - 1) / 12);
          events.push({ kind:'blip', t, dur:baseStep * 4, step:baseStep * 4.6, f0:f, f1:f * Math.pow(2, -9 / 12), vowel:'a', cons:'', gain:.95, yawn:true, s:u.e, e:u.e, nr:true });
          t += baseStep * 4.6;
        }
      }
      continue;
    }
    if (u.iw === 0 && M.hesit && vi > 0 && grng() < M.hesit) t += step * (1.5 + grng() * 2);
    const rng = p.live ? grng : rngFrom(hash(u.word + '#' + u.iw + (u.letter || '')) ^ (p.seed * 2654435761));
    const sent = sents[u.sent] || { n:1, type:'.' };
    const pos = sent.n > 1 ? u.pos / (sent.n - 1) : 1;
    const inton = (p.inton / 50) * M.inton;
    const isQ = sent.type === '?' || sent.type === '?!', isX = sent.type === '!' || sent.type === '?!';
    let semi = M.semi + gauss(rng) * p.pitchVar * M.var;
    semi += -2.5 * inton * pos;
    if (isQ && u.pos >= sent.n - 2) semi += 5 * inton * (u.pos === sent.n - 1 ? 1 : .5);
    if (isX) semi += 1.5 * inton;
    if (sent.type === '…') semi -= inton * pos;
    if (M.fall && u.pos >= sent.n - 2) semi -= 4 * M.fall;
    if (M.bounce) semi += (vi % 2 ? 1.6 : -.4) * M.bounce;
    if (M.drift) semi += 2.5 * M.drift * Math.sin(t * .9);
    if (M.slowdown) semi -= 3 * M.slowdown * prog;
    let gain = 1;
    if (u.caps && p.caps){ semi += 2.5; gain *= 1.35; }
    if (isX) gain *= 1.15;
    gain *= M.gain;
    if (M.flat) semi = M.semi + (u.caps && p.caps ? 2 : 0) + (isQ && u.pos === sent.n - 1 ? 3 : 0) + (vi % 7 === 6 ? -2 : 0);
    if (scale) semi = quantize(semi, scale);
    const f = p.pitch * Math.pow(2, semi / 12);
    const gate = (p.gate / 100) * M.gate;
    const st0 = step * (p.grain === 'mot' ? (.55 + .3 * Math.sqrt(u.nsyl || 1)) : 1);
    const extra = st0 * .8 * ((u.hold || 1) - 1);
    const st = st0 + extra;
    if (M.stutter && u.iw === 0 && rng() < M.stutter){
      events.push({ kind:'blip', t, dur:st0 * .35, step:st0 * .55, f0:f, f1:f, vowel:u.vowel, cons:u.cons, sib:u.sib, gain:gain * .8, s:u.s, e:u.s, nr:true });
      t += st0 * .55;
    }
    const f0 = (M.slur > .2 && prevF) ? prevF : f;
    events.push({ kind:'blip', t, dur:st0 * gate * (1 + .35 * M.slur) + extra, step:st, f0, f1:f, vowel:u.vowel, cons:u.cons, sib:u.sib, gain, s:u.s, e:u.e, hold:u.hold || 1 });
    prevF = f; t += st; vi++;
    if (M.hic && u.iw === u.wl - 1 && grng() < M.hic){
      events.push({ kind:'blip', t:t + st * .3, dur:st * .45, step:st * .45, f0:f * 1.9, f1:f * 2.15, vowel:'i', cons:'plos', gain:gain * 1.2, s:u.e, e:u.e, nr:true });
      t += st * 1.6;
    }
  }
  if (M.yawn && !yawnDone && N > 6){
    const f = p.pitch * Math.pow(2, (M.semi - 1) / 12);
    events.push({ kind:'blip', t:t + baseStep, dur:baseStep * 4, step:baseStep * 4.6, f0:f, f1:f * Math.pow(2, -9 / 12), vowel:'a', cons:'', gain:.95, yawn:true, s:text.length, e:text.length, nr:true });
    t += baseStep * 5.6;
  }
  return { events, total:t + .35, M };
}

/* ============ Audio ============ */
let AC = null, master = null, analyser = null, noiseBuf = null, pulseWave = null;
function ensureAudio(ctx){
  if (!AC){
    const C = root.AudioContext || root.webkitAudioContext;
    if (!ctx && !C) return false;
    AC = ctx || new C();
    const comp = AC.createDynamicsCompressor();
    comp.threshold.value = -16; comp.knee.value = 10; comp.ratio.value = 4; comp.attack.value = .003; comp.release.value = .15;
    master = AC.createGain(); master.gain.value = .9;
    analyser = AC.createAnalyser(); analyser.fftSize = 1024;
    master.connect(comp); comp.connect(analyser); analyser.connect(AC.destination);
    const len = AC.sampleRate * 2; noiseBuf = AC.createBuffer(1, len, AC.sampleRate);
    const d = noiseBuf.getChannelData(0); for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const H = 48, re = new Float32Array(H), im = new Float32Array(H);
    for (let n = 1; n < H; n++) re[n] = 2 * Math.sin(n * Math.PI * .25) / (n * Math.PI);
    pulseWave = AC.createPeriodicWave(re, im);
  }
  if (AC.state === 'suspended') AC.resume();
  return true;
}
function crunchCurve(amount){
  const n = 2048, c = new Float32Array(n), drive = 1 + amount / 12;
  const steps = Math.pow(2, Math.max(2.5, 10 - amount / 12)) / 2;
  for (let i = 0; i < n; i++){ const x = i / (n - 1) * 2 - 1; let y = Math.tanh(x * drive) / Math.tanh(drive); c[i] = Math.round(y * steps) / steps; }
  return c;
}
function makeChain(p, M, start, total, sources){
  const input = AC.createGain();
  let node = input;
  if (M.nasal > 0){
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4200 - 2500 * M.nasal; lp.Q.value = .7;
    const pk = AC.createBiquadFilter(); pk.type = 'peaking'; pk.frequency.value = 280; pk.gain.value = 8 * M.nasal; pk.Q.value = 1.2;
    node.connect(lp); lp.connect(pk); node = pk;
  }
  const crunch = clamp(p.crunch + M.crunchAdd, 0, 100);
  if (crunch > 0){ const ws = AC.createWaveShaper(); ws.curve = crunchCurve(crunch); node.connect(ws); node = ws; }
  if (M.trem && M.trem[1] > 0){
    const tg = AC.createGain(); tg.gain.value = 1 - M.trem[1] / 2;
    const lfo = AC.createOscillator(); lfo.frequency.value = M.trem[0];
    const lg = AC.createGain(); lg.gain.value = M.trem[1] / 2;
    lfo.connect(lg); lg.connect(tg.gain); lfo.start(start); lfo.stop(start + total + 2); sources.push(lfo);
    node.connect(tg); node = tg;
  }
  const out = AC.createGain(); out.gain.value = (p.vol / 100) * .9;
  node.connect(out); out.connect(master);
  const echo = p.echo / 100;
  if (echo > 0){
    const d = AC.createDelay(1.5); d.delayTime.value = .09 + .25 * echo;
    const fb = AC.createGain(); fb.gain.value = .22 + .4 * echo;
    const lp = AC.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 2600;
    const wet = AC.createGain(); wet.gain.value = .1 + .5 * echo;
    out.connect(d); d.connect(lp); lp.connect(fb); fb.connect(d); lp.connect(wet); wet.connect(master);
  }
  return { input, out };
}
function noiseSrc(t, dur, sources){
  const n = AC.createBufferSource(); n.buffer = noiseBuf; n.loop = true;
  n.start(t, Math.random() * 1.2, dur + .05); sources.push(n); return n;
}
function scheduleBlip(ev, start, out, p, M, sources){
  const t0 = start + ev.t;
  const src = M.src || p.src;
  const F = FORM[ev.vowel] || FORM.oe;
  const fs = p.formant;
  const atk = ev.cons === 'plos' ? .004 : ev.cons === 'nasal' ? .025 : ev.cons === 'liq' ? .018 : .01;
  const dur = Math.max(atk + .035, ev.dur);
  const peak = .5 * ev.gain;
  const env = AC.createGain();
  env.gain.setValueAtTime(.0001, t0);
  env.gain.linearRampToValueAtTime(peak, t0 + atk);
  env.gain.setValueAtTime(peak, t0 + Math.max(atk + .005, dur - Math.min(dur * .45, .15)));
  env.gain.exponentialRampToValueAtTime(.0001, t0 + dur);
  env.connect(out);
  const endT = t0 + dur + .03;
  const breath = clamp(p.breath + M.breathAdd, 0, 100) / 100;
  const whisper = src === 'souffle' ? 1 : M.whisper;
  let breathAmt = Math.min(1, breath * .6 + whisper);
  if (ev.yawn) breathAmt = Math.max(breathAmt, .5);
  const voiced = 1 - whisper;
  const jit = clamp(p.jitter + M.jitterAdd, 0, 100) / 100;
  let vib = clamp(p.vib + M.vibAdd, 0, 100) / 100;
  if ((ev.hold || 1) > 2 && !M.flat) vib = Math.max(vib, .3);
  const nyq = AC.sampleRate * .45;

  if (voiced > .02){
    const osc = AC.createOscillator();
    if (src === 'chip') osc.setPeriodicWave(pulseWave);
    else osc.type = { voix:'sawtooth', bip:'square', doux:'triangle', souffle:'sawtooth' }[src] || 'sawtooth';
    const f0 = ev.f0 * (1 + (Math.random() - .5) * jit * .12);
    const f1 = ev.f1 * (1 + (Math.random() - .5) * jit * .12);
    const fr = osc.frequency;
    if (ev.cons === 'liq'){ fr.setValueAtTime(f0 * .94, t0); fr.linearRampToValueAtTime(f0, t0 + Math.min(.05, dur * .4)); }
    else fr.setValueAtTime(f0, t0);
    fr.linearRampToValueAtTime(f1, t0 + (ev.f0 !== ev.f1 && !ev.yawn ? dur * .45 : dur));
    if (vib > 0){
      const lfo = AC.createOscillator(); lfo.frequency.value = 5 + Math.random() * 1.5;
      const lg = AC.createGain(); lg.gain.value = f1 * .035 * vib;
      lfo.connect(lg); lg.connect(fr); lfo.start(t0); lfo.stop(endT); sources.push(lfo);
    }
    const vg = AC.createGain(); vg.gain.value = voiced * (1 - breath * .35);
    if (src === 'voix' || src === 'souffle'){
      const bw = [120, 150, 220], gn = [1, .55, .3];
      for (let k = 0; k < 3; k++){
        const bp = AC.createBiquadFilter(); bp.type = 'bandpass';
        const fq = Math.min(nyq, F[k] * fs); bp.frequency.value = fq; bp.Q.value = F[k] / bw[k];
        const g = AC.createGain(); g.gain.value = gn[k] * 3.2;
        osc.connect(bp); bp.connect(g); g.connect(vg);
      }
      const body = AC.createBiquadFilter(); body.type = 'lowpass'; body.frequency.value = 600 * fs;
      const bg = AC.createGain(); bg.gain.value = .18;
      osc.connect(body); body.connect(bg); bg.connect(vg);
    } else {
      const lp = AC.createBiquadFilter(); lp.type = 'lowpass';
      lp.frequency.value = clamp(F[1] * fs * 1.3, 900, Math.min(6000, nyq)); lp.Q.value = 1;
      const g = AC.createGain(); g.gain.value = { bip:.38, doux:.85, chip:.4 }[src] || .5;
      osc.connect(lp); lp.connect(g); g.connect(vg);
    }
    vg.connect(env);
    osc.start(t0); osc.stop(endT); sources.push(osc);
  }
  if (breathAmt > .01){
    const n = noiseSrc(t0, dur, sources);
    const bg = AC.createGain(); bg.gain.value = breathAmt * 1.7;
    const qs = [4, 6, 6], gs = [1, .8, .5];
    for (let k = 0; k < 3; k++){
      const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = Math.min(nyq, F[k] * fs); bp.Q.value = qs[k];
      const g = AC.createGain(); g.gain.value = gs[k];
      n.connect(bp); bp.connect(g); g.connect(bg);
    }
    bg.connect(env);
  }
  const artic = (p.artic / 100) * M.artic;
  if (artic > 0 && (ev.cons === 'plos' || ev.cons === 'fric')){
    const plos = ev.cons === 'plos';
    const bl = plos ? .02 : .05, tb = Math.max(start, t0 - (plos ? .006 : .035));
    const n = noiseSrc(tb, bl + .02, sources);
    const flt = AC.createBiquadFilter();
    if (plos){ flt.type = 'bandpass'; flt.frequency.value = Math.min(nyq, 2600); flt.Q.value = .9; }
    else if (ev.sib){ flt.type = 'highpass'; flt.frequency.value = Math.min(nyq, 4200); }
    else { flt.type = 'bandpass'; flt.frequency.value = 2200; flt.Q.value = .6; }
    const g = AC.createGain(); const pk = artic * (plos ? .4 : .26) * ev.gain;
    g.gain.setValueAtTime(.0001, tb); g.gain.linearRampToValueAtTime(pk, tb + .002);
    g.gain.exponentialRampToValueAtTime(.0001, tb + bl);
    n.connect(flt); flt.connect(g); g.connect(out);
  }
}
function scheduleSniff(ev, start, out, sources){
  const t0 = start + ev.t, d = .38;
  const n = noiseSrc(t0, d, sources);
  const hp = AC.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 900;
  const bp = AC.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2;
  bp.frequency.setValueAtTime(1400, t0); bp.frequency.linearRampToValueAtTime(3600, t0 + d);
  const g = AC.createGain(); g.gain.setValueAtTime(.0001, t0); g.gain.linearRampToValueAtTime(.35, t0 + d * .7); g.gain.exponentialRampToValueAtTime(.0001, t0 + d);
  n.connect(hp); hp.connect(bp); bp.connect(g); g.connect(out);
}

/* ============ Lecture ============ */
let current = null;
function stop(){
  if (!current || !AC) return;
  const now = AC.currentTime;
  try { current.chain.input.gain.cancelScheduledValues(now); current.chain.input.gain.setTargetAtTime(0, now, .01); } catch(e){}
  for (const s of current.sources){ try { s.stop(now + .05); } catch(e){} }
  current = null;
}
function speak(text, voice, opts = {}){
  if (!text || !String(text).trim()) return null;
  if (!ensureAudio(opts.audioContext)) return null;
  stop();
  const p = sanitize(voice || {});
  const tl = build(String(text), p);
  const start = AC.currentTime + .06;
  const sources = [];
  const chain = makeChain(p, tl.M, start, tl.total, sources);
  for (const ev of tl.events){
    if (ev.kind === 'blip') scheduleBlip(ev, start, chain.input, p, tl.M, sources);
    else if (ev.kind === 'sniff') scheduleSniff(ev, start, chain.input, sources);
  }
  current = { chain, sources };
  return { timeline:tl, start };
}

/* ============ Code de voix ============ */
const b64e = s => btoa(unescape(encodeURIComponent(s))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const b64d = s => decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/'))));
// « extra » : objet libre (ex. titre et apparence côté studio), ajouté en fin de tableau.
// Le moteur l'ignore pour jouer la voix ; readCode() le rend à qui en a besoin.
const isObj = v => v && typeof v === 'object' && !Array.isArray(v);
function encodeVoice(p, extra){
  const arr = KEYS.map(k => p[k]);
  if (isObj(extra) && Object.keys(extra).length) arr.push(extra);
  return 'MUMBLE1.' + b64e(JSON.stringify(arr));
}
function readCode(str){
  str = String(str).trim();
  if (str.startsWith('{')){ const o = JSON.parse(str); return { voice:sanitize(o.voice || o), extra:isObj(o.studio) ? o.studio : null }; }
  const arr = JSON.parse(b64d(str.replace(/^MUMBLE1\./i, '')));
  if (!Array.isArray(arr)) throw new Error('format');
  const o = {}; KEYS.forEach((k, i) => { if (i < arr.length) o[k] = arr[i]; });
  return { voice:sanitize(o), extra:isObj(arr[KEYS.length]) ? arr[KEYS.length] : null };
}
function decodeVoice(str){ return readCode(str).voice; }
function jsonVoice(p, extra){
  const o = { format:'charabia/1' }; KEYS.forEach(k => o[k] = p[k]);
  if (isObj(extra)) o.studio = extra;
  return JSON.stringify(o, null, 2);
}

root.Charabia = {
  VERSION:'0.5',
  MOODS, MOOD_KEYS, SCALES, DEFAULT, KEYS, NUM, ENUM,
  applyMacros, sanitize, analyze, build, moodMix,
  speak, stop,
  encode:encodeVoice, decode:decodeVoice, readCode, toJSON:jsonVoice,
  unlock:(ctx) => ensureAudio(ctx),
  now:() => AC ? AC.currentTime : 0,
  get analyser(){ return analyser; },
  get context(){ return AC; }
};
})(typeof window !== 'undefined' ? window : globalThis);
