/* Rastérise une carte de data/cartes.js sur la grille de simulation.
   Sortie :
     grid  : 0 = praticable, 1 = bloqué (bâti, statue, barrière)
     kind  : 0 bâti, 1 rue, 2 boulevard, 3 place, 4 statue, 5 barrière
     rueOf : index de la rue qui possède la case (-1 sinon)
     exits, plaza, statue, barrages, labels */
(function(){
  const HW = { 1: 0.5, 2: 1.0, 3: 1.2 };
  const K = { BATI: 0, RUE: 1, BD: 2, PLACE: 3, STATUE: 4, BARRIERE: 5 };

  function segDist(px, py, ax, ay, bx, by){
    const dx = bx-ax, dy = by-ay, l2 = dx*dx + dy*dy;
    let t = l2 ? ((px-ax)*dx + (py-ay)*dy) / l2 : 0;
    t = t < 0 ? 0 : t > 1 ? 1 : t;
    const qx = ax + t*dx - px, qy = ay + t*dy - py;
    return { d: Math.hypot(qx, qy), t, len: Math.sqrt(l2) };
  }

  function rasterCarte(def){
    const W = def.w, H = def.h, N = W*H;
    const grid = new Uint8Array(N).fill(1);
    const kind = new Uint8Array(N).fill(K.BATI);
    const rueOf = new Int16Array(N).fill(-1);
    const idx = (x, y) => y*W + x;
    const inb = (x, y) => x >= 0 && y >= 0 && x < W && y < H;

    // rues
    def.rues.forEach((r, ri) => {
      const hw = HW[r.w] || 1;
      for (let s = 0; s < r.pts.length-1; s++){
        const [ax, ay] = r.pts[s], [bx, by] = r.pts[s+1];
        const x0 = Math.floor(Math.min(ax, bx) - hw - 1), x1 = Math.ceil(Math.max(ax, bx) + hw + 1);
        const y0 = Math.floor(Math.min(ay, by) - hw - 1), y1 = Math.ceil(Math.max(ay, by) + hw + 1);
        for (let y = y0; y <= y1; y++) for (let x = x0; x <= x1; x++){
          if (!inb(x, y)) continue;
          if (segDist(x, y, ax, ay, bx, by).d > hw + 1e-6) continue;
          const i = idx(x, y);
          grid[i] = 0;
          const k = r.type === 'bd' ? K.BD : K.RUE;
          if (kind[i] !== K.BD) { kind[i] = k; rueOf[i] = ri; }
        }
      }
    });

    // place
    const P = def.place, plaza = [], statue = [];
    for (let y = P.y0; y <= P.y1; y++) for (let x = P.x0; x <= P.x1; x++){
      const i = idx(x, y); grid[i] = 0; kind[i] = K.PLACE; rueOf[i] = -1; plaza.push(i);
    }
    if (P.statue){
      const S = P.statue;
      for (let y = S.y; y < S.y+S.h; y++) for (let x = S.x; x < S.x+S.w; x++){
        const i = idx(x, y); grid[i] = 1; kind[i] = K.STATUE; statue.push(i);
      }
    }

    // bouts de rue : sorties et barrages
    const exits = [], barrages = [];
    def.rues.forEach((r, ri) => {
      if (!r.sortie && !r.barre) return;
      const n = r.pts.length;
      const [ax, ay] = r.pts[n-2], [bx, by] = r.pts[n-1];
      const L = Math.hypot(bx-ax, by-ay);
      const dir = { x: Math.round((bx-ax)/L), y: Math.round((by-ay)/L) };
      const hw = HW[r.w] || 1;
      const tiles = [];
      for (let y = 0; y < H; y++) for (let x = 0; x < W; x++){
        const i = idx(x, y);
        if (rueOf[i] !== ri || grid[i] !== 0) continue;
        const s = segDist(x, y, ax, ay, bx, by);
        if (s.d > hw + 1e-6) continue;
        const fromEnd = (1 - s.t) * s.len;
        if (r.sortie){
          const bord = (dir.x > 0 && x === W-1) || (dir.x < 0 && x === 0) || (dir.y > 0 && y === H-1) || (dir.y < 0 && y === 0);
          if (bord) tiles.push(i);
        } else if (fromEnd < 0.9) tiles.push(i);
      }
      if (!tiles.length) return;
      if (r.sortie){
        exits.push({ nom: r.nom, dest: r.sortie.dest, principale: !!r.sortie.principale, ouverte: !!r.sortie.ouverte, tiles, dir });
      } else {
        for (const i of tiles){ grid[i] = 1; kind[i] = K.BARRIERE; }
        barrages.push({ nom: r.nom, tiles, dir });
      }
    });

    // étiquettes : au milieu du plus long segment, texte toujours lisible
    const labels = def.rues.map(r => {
      let best = 0, bl = -1;
      for (let s = 0; s < r.pts.length-1; s++){
        const l = Math.hypot(r.pts[s+1][0]-r.pts[s][0], r.pts[s+1][1]-r.pts[s][1]);
        if (l > bl){ bl = l; best = s; }
      }
      const [ax, ay] = r.pts[best], [bx, by] = r.pts[best+1];
      let ang = Math.atan2(by-ay, bx-ax);
      if (ang > Math.PI/2 + 1e-3) ang -= Math.PI;
      if (ang < -Math.PI/2 - 1e-3) ang += Math.PI;
      if (Math.abs(Math.abs(ang) - Math.PI/2) < 1e-3) ang = -Math.PI/2;
      return { nom: r.nom, type: r.type, x: (ax+bx)/2, y: (ay+by)/2, ang, len: bl };
    });

    return { nom: def.nom, W, H, grid, kind, rueOf, exits, plaza, statue, barrages, labels, K };
  }

  window.rasterCarte = rasterCarte;
})();
