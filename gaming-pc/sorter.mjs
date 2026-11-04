// Painter's order for boxes that move.
//
// Every drawn part ("leaf") has an axis-aligned box in world mm. Two boxes that don't overlap in 3D always have a
// separating plane, and the camera looks from +x, +y, +z, so the box on the larger side of that plane is nearer.
// Only boxes whose projections really overlap on screen need an order, so the test is the two projected hulls,
// not their bounding rectangles. Leaves that move rigidly together (same group) keep the order they have when
// assembled (`rank`); anything else is decided by where the boxes are this frame, so parts can pass in front of
// and behind each other as they fly apart. With `rank` null every pair is decided by its boxes (that is how the
// assembled order is made in the first place).
//
// Pure arithmetic on arrays, no imports: the page inlines this function's source.

export function orderGraph(L, off, V, rank) {
  // L[i] = { lo:[x,y,z], hi:[x,y,z], sb:[x0,y0,x1,y1], h:[x,y,x,y,...] hull, g }  off[i] = [dx,dy,dz,sx,sy]  V = toward-viewer unit vector
  const n = L.length;
  const EPS = 0.05;
  const lo = new Array(n);
  const hi = new Array(n);
  const sb = new Array(n);
  const key = new Float64Array(n);
  for (let i = 0; i < n; i++) {
    const o = off[i];
    const a = L[i].lo;
    const b = L[i].hi;
    lo[i] = [a[0] + o[0], a[1] + o[1], a[2] + o[2]];
    hi[i] = [b[0] + o[0], b[1] + o[1], b[2] + o[2]];
    const s = L[i].sb;
    sb[i] = [s[0] + o[3], s[1] + o[4], s[2] + o[3], s[3] + o[4]];
    key[i] = ((lo[i][0] + hi[i][0]) * V[0] + (lo[i][1] + hi[i][1]) * V[1] + (lo[i][2] + hi[i][2]) * V[2]) / 2;
  }
  // do two projected convex hulls overlap by more than a hair? (separating axis test on the hull edges)
  const hullsMeet = (i, j) => {
    const p = L[i].h, q = L[j].h;
    const ax = off[i][3], ay = off[i][4], bx = off[j][3], by = off[j][4];
    for (let pass = 0; pass < 2; pass++) {
      const h = pass ? q : p, ox = pass ? bx : ax, oy = pass ? by : ay;
      for (let e = 0; e < h.length; e += 2) {
        const x0 = h[e] + ox, y0 = h[e + 1] + oy;
        const x1 = h[(e + 2) % h.length] + ox, y1 = h[(e + 3) % h.length] + oy;
        let nx = y1 - y0, ny = x0 - x1;
        const len = Math.hypot(nx, ny) || 1;
        nx /= len; ny /= len;
        let amin = Infinity, amax = -Infinity, bmin = Infinity, bmax = -Infinity;
        for (let k = 0; k < p.length; k += 2) { const d = (p[k] + ax) * nx + (p[k + 1] + ay) * ny; if (d < amin) amin = d; if (d > amax) amax = d; }
        for (let k = 0; k < q.length; k += 2) { const d = (q[k] + bx) * nx + (q[k + 1] + by) * ny; if (d < bmin) bmin = d; if (d > bmax) bmax = d; }
        if (amax <= bmin + 0.6 || bmax <= amin + 0.6) return false;
      }
    }
    return true;
  };
  const after = Array.from({ length: n }, () => []); // after[i] = leaves that must be drawn later than i
  const need = new Int32Array(n); // how many leaves must come before i
  for (let i = 0; i < n; i++) {
    const bi = sb[i];
    for (let j = i + 1; j < n; j++) {
      const bj = sb[j];
      if (bi[2] < bj[0] || bj[2] < bi[0] || bi[3] < bj[1] || bj[3] < bi[1]) continue;
      if (!hullsMeet(i, j)) continue;
      let iFront;
      if (rank && L[i].g === L[j].g) iFront = rank[i] > rank[j];
      else {
        const a = lo[i];
        const b = hi[i];
        const c = lo[j];
        const d = hi[j];
        const ijf = a[0] >= d[0] - EPS || a[1] >= d[1] - EPS || a[2] >= d[2] - EPS;
        const jif = c[0] >= b[0] - EPS || c[1] >= b[1] - EPS || c[2] >= b[2] - EPS;
        if (ijf && !jif) iFront = true;
        else if (jif && !ijf) iFront = false;
        else {
          // overlapping boxes: something that sits inside another one's footprint is drawn first (a pipe inside a fin stack)
          const within = (a1, b1, a2, b2) => a1[0] >= a2[0] - 0.5 && a1[1] >= a2[1] - 0.5 && b1[0] <= b2[0] + 0.5 && b1[1] <= b2[1] + 0.5;
          const iInJ = within(a, b, c, d);
          const jInI = within(c, d, a, b);
          iFront = jInI && !iInJ ? true : iInJ && !jInI ? false : key[i] > key[j];
        }
      }
      if (iFront) { after[j].push(i); need[i]++; } else { after[i].push(j); need[j]++; }
    }
  }
  return { after, need, key };
}

export function sortLeaves(L, off, V, rank) {
  const n = L.length;
  const { after, need, key } = orderGraph(L, off, V, rank);
  const out = [];
  const done = new Uint8Array(n);
  for (let step = 0; step < n; step++) {
    let pick = -1;
    for (let i = 0; i < n; i++) if (!done[i] && need[i] === 0 && (pick < 0 || key[i] < key[pick])) pick = i;
    if (pick < 0) for (let i = 0; i < n; i++) if (!done[i] && (pick < 0 || key[i] < key[pick])) pick = i; // a cycle: break it by depth
    done[pick] = 1;
    out.push(pick);
    for (const j of after[pick]) need[j]--;
  }
  return out;
}
