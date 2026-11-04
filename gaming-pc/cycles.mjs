// Which parts can't be put in a consistent painter's order in the exploded pose? (cycles in the box ordering)
import { readFileSync } from "node:fs";
import { sortLeaves, orderGraph } from "./sorter.mjs";
import { G } from "./world.mjs";
const { leaves, asm, U, P } = JSON.parse(readFileSync(new URL("./leaves.json", import.meta.url)));
const V = G.viewOf(P);
const state = process.argv[2] ?? "apart"; // apart | built | step:N
const share = (a) => (state === "apart" ? 1 : state === "built" ? 0 : a.step > Number(state.split(":")[1]) ? 1 : 0);
const off = leaves.map((l) => { const a = asm[l.a]; const x = share(a); const t = Math.min(1, Math.max(0, (x - 0.3) / 0.55)); const f = t * t * (3 - 2 * t); const d = [0, 1, 2].map((q) => a.move[q] * x + a.slide[q] * f); return [d[0], d[1], d[2], U[0][0] * d[0] + U[1][0] * d[1] + U[2][0] * d[2], U[0][1] * d[0] + U[1][1] * d[1] + U[2][1] * d[2]]; });
// reuse the sorter's own rank logic: assembled order inside each group
const zero = leaves.map(() => [0, 0, 0, 0, 0]);
const pre = sortLeaves(leaves, zero, V, null);
const rank = new Array(leaves.length); pre.forEach((idx, r) => { rank[idx] = r; });
const n = leaves.length;
const lo = leaves.map((l, i) => l.lo.map((v, q) => v + off[i][q])), hi = leaves.map((l, i) => l.hi.map((v, q) => v + off[i][q]));
const { after: adj } = orderGraph(leaves, off, V, rank);
// Tarjan
let idx = 0; const st = [], on = new Array(n).fill(false), ix = new Array(n).fill(-1), low = new Array(n).fill(0), comps = [];
function dfs(v) { ix[v] = low[v] = idx++; st.push(v); on[v] = true; for (const w of adj[v]) { if (ix[w] < 0) { dfs(w); low[v] = Math.min(low[v], low[w]); } else if (on[w]) low[v] = Math.min(low[v], ix[w]); } if (low[v] === ix[v]) { const c = []; let w; do { w = st.pop(); on[w] = false; c.push(w); } while (w !== v); if (c.length > 1) comps.push(c); } }
for (let v = 0; v < n; v++) if (ix[v] < 0) dfs(v);
console.log(state, "cycles:", comps.length);
const nm = (i) => `${asm[leaves[i].a].id}/${leaves[i].name || "#"}`;
for (const c of comps.slice(0, 12)) console.log("  ", c.length, "parts:", c.slice(0, 8).map(nm).join("  |  "));

// shortest cycle in the biggest component, with the reason for each edge
const big = comps.sort((p, q) => q.length - p.length)[0];
if (big) {
  const inC = new Set(big);
  let best = null;
  for (const s of big) {
    const prev = new Map([[s, -1]]); const q = [s]; let found = null;
    for (let h = 0; h < q.length && !found; h++) { const v = q[h]; for (const w of adj[v]) { if (!inC.has(w)) continue; if (w === s) { found = v; break; } if (!prev.has(w)) { prev.set(w, v); q.push(w); } } }
    if (found !== null) { const path = []; for (let v = found; v !== -1; v = prev.get(v)) path.push(v); path.reverse(); if (!best || path.length < best.length) best = path; }
  }
  console.log("shortest cycle:", best ? best.length : "none");
  if (best) for (let t = 0; t < best.length; t++) {
    const i = best[t], j = best[(t + 1) % best.length];
    const why = leaves[i].g === leaves[j].g ? "same group (static rank)" : "boxes";
    console.log(`   ${nm(i)}  [${lo[i].map(Math.round)}..${hi[i].map(Math.round)}]  drawn before  ${nm(j)}  [${lo[j].map(Math.round)}..${hi[j].map(Math.round)}]  (${why})`);
  }
}
