// Does anything pass through anything while the PC comes apart or goes together?
// Replays the page's own springs (same constants, same stagger) and tests every pair of parts that belong to
// different assemblies, or to different sub-groups of one assembly, for boxes that sink into each other.
// A pair that already overlaps when assembled (a plug on its socket) may not get deeper than it started.
import { readFileSync } from "node:fs";
const { leaves, asm } = JSON.parse(readFileSync(new URL("./leaves.json", import.meta.url)));
const STEPS = [...new Set(asm.filter((a) => a.step).map((a) => a.step))].sort((a, b) => a - b);
const TOP = STEPS[STEPS.length - 1];
const STAGGER = 0.045, FPS = 120, TOL = Number(process.env.TOL ?? 0.8);
const A = asm.map((a, i) => ({ ...a, i, x: 0, v: 0, target: 0, pending: null, sx: 0, sv: 0, st: 0, leaves: [] }));
leaves.forEach((l, i) => A[l.a].leaves.push(i));
let clock = 0;
const reset = (shares = 0) => { clock = 0; openId = null; for (const a of A) { a.x = a.target = shares && a.step ? 1 : 0; a.v = 0; a.pending = null; a.sx = a.st = 0; a.sv = 0; } };
function setBuilt(n) {
  for (const a of A) if (a.pending && a.pending.value !== (a.step <= n ? 0 : 1)) a.pending = null;
  const changing = A.filter((a) => a.step && (a.step <= n ? 0 : 1) !== a.target);
  const opening = changing.filter((a) => a.step > n).sort((p, q) => q.step - p.step || q.i - p.i);
  const closing = changing.filter((a) => a.step <= n).sort((p, q) => p.step - q.step || p.i - q.i);
  for (const list of [opening, closing]) list.forEach((a, k) => { a.pending = { value: a.step <= n ? 0 : 1, at: clock + k * STAGGER }; });
}
let openId = null;
const setOpen = (id) => { openId = id; };
function step(dt) {
  clock += dt;
  const h = dt / 4;
  let moving = false;
  for (const a of A) {
    if (a.pending && clock >= a.pending.at) { a.target = a.pending.value; a.pending = null; }
    a.st = a.id === openId && a.target === 1 && !a.pending && a.x > 0.98 ? 1 : 0;
    for (let n = 0; n < 4; n++) { a.v += (64 * (a.target - a.x) - 15.5 * a.v) * h; a.x += a.v * h; a.sv += (80 * (a.st - a.sx) - 15 * a.sv) * h; a.sx += a.sv * h; }
    if (Math.abs(a.x - a.target) < 0.0004 && Math.abs(a.v) < 0.002) { a.x = a.target; a.v = 0; }
    if (Math.abs(a.sx - a.st) < 0.0004 && Math.abs(a.sv) < 0.002) { a.sx = a.st; a.sv = 0; }
    if (a.pending || a.x !== a.target || a.sx !== a.st) moving = true;
  }
  return moving;
}
const slideShare = (x) => { const t = Math.min(1, Math.max(0, (x - 0.3) / 0.55)); return t * t * (3 - 2 * t); };
const boxes = () => leaves.map((l, i) => { const a = A[l.a]; const f = slideShare(a.x); const d = [0, 1, 2].map((q) => a.move[q] * a.x + a.slide[q] * f + l.sub[q] * a.sx); return { lo: l.lo.map((v, q) => v + d[q]), hi: l.hi.map((v, q) => v + d[q]) }; });
const depth = (p, q) => Math.min(Math.min(p.hi[0], q.hi[0]) - Math.max(p.lo[0], q.lo[0]), Math.min(p.hi[1], q.hi[1]) - Math.max(p.lo[1], q.lo[1]), Math.min(p.hi[2], q.hi[2]) - Math.max(p.lo[2], q.lo[2]));
const pairs = [];
for (let i = 0; i < leaves.length; i++) for (let j = i + 1; j < leaves.length; j++) {
  const a = leaves[i], b = leaves[j];
  if (a.a === b.a && a.sub.join() === b.sub.join()) continue; // rigid together
  pairs.push([i, j]);
}
reset(0);
const home = boxes();
const base = new Map();
for (const [i, j] of pairs) base.set(i * 1000 + j, Math.max(0, depth(home[i], home[j])));
const found = new Map();
const scan = (label) => {
  const b = boxes();
  for (const [i, j] of pairs) {
    const d = depth(b[i], b[j]);
    const allowed = base.get(i * 1000 + j) + TOL;
    if (d > allowed) {
      const key = i * 1000 + j;
      const f = found.get(key);
      if (!f || d > f.d) found.set(key, { d, label, clock: clock.toFixed(2), a: leaves[i], b: leaves[j] });
    }
  }
};
function run(label, seconds, setup) {
  reset(label.startsApart ? 1 : 0);
}
function scenario(label, start, actions, seconds = 2.2) {
  reset(0);
  if (start === 1) A.forEach((a) => { if (a.step) a.x = a.target = 1; });
  else if (typeof start === "number" && start > 1) A.forEach((a) => { if (a.step > start - 2) a.x = a.target = 1; });
  let t = 0, nextAction = 0;
  const dt = 1 / FPS;
  while (t < seconds) {
    while (nextAction < actions.length && t >= actions[nextAction][0]) { actions[nextAction][1](); nextAction++; }
    step(dt); t += dt;
    scan(label);
  }
}
scenario("explode", 0, [[0, () => setBuilt(0)]]);
scenario("assemble", 1, [[0, () => setBuilt(TOP)]]);
for (const s of STEPS) {
  scenario("step-out " + s, 0, [[0, () => setBuilt(TOP)], [0.01, () => setBuilt(s - 1)]], 1.6);
}
// walk through the build one step at a time, a step every 0.9 s
{
  const acts = [[0, () => setBuilt(0)]];
  STEPS.forEach((s, n) => acts.push([1.6 + n * 0.9, () => setBuilt(s)]));
  scenario("build walk", 1, acts, 1.6 + STEPS.length * 0.9 + 1.2);
}
// reversals: start opening, turn round after r seconds, at every stagger boundary and a few times between
for (const open of [0, 1]) {
  for (let k = 0; k <= 22; k++) {
    for (const off of [-0.008, 0.008]) {
      const r = k * STAGGER + off + 0.05;
      if (r <= 0) continue;
      scenario(`reverse ${open ? "assembling" : "exploding"} at ${r.toFixed(3)}`, open ? 1 : 0, [[0, () => setBuilt(open ? TOP : 0)], [r, () => setBuilt(open ? 0 : TOP)]], r + 1.4);
    }
  }
}
// opening each assembly up: it has been taken out (everything after it too, everything before it still built), or everything is out
for (const a of asm) {
  if (!a.step) continue;
  for (const start of [a.step + 1.0001, 1]) scenario(`open ${a.id} (${start === 1 ? "all apart" : "taken out"})`, start === 1 ? 1 : a.step + 1, [[0, () => setOpen(a.id)], [1.3, () => setOpen(null)]], 2.8);
}
const list = [...found.values()].sort((p, q) => q.d - p.d);
const grouped = new Map();
for (const f of list) {
  const key = (f.a.asm ?? A[f.a.a].id) + ":" + f.a.name + " × " + A[f.b.a].id + ":" + f.b.name;
  if (!grouped.has(key)) grouped.set(key, f);
}
console.log(`pass-through check: ${found.size} pairs sink more than ${TOL} mm deeper than they do assembled; ${pairs.length} pairs tested`);
const byKind = {};
for (const f of found.values()) { const kd = f.label.split(" ").slice(0, 2).join(" "); byKind[kd] = (byKind[kd] || 0) + 1; }
console.log("by scenario:", JSON.stringify(byKind));
let n = 0;
for (const [key, f] of grouped) { if (n++ >= Number(process.env.SHOW ?? 40)) break; console.log(`  ${f.d.toFixed(1)} mm  ${A[f.a.a].id}/${f.a.name || "#"} × ${A[f.b.a].id}/${f.b.name || "#"}   (${f.label} at ${f.clock} s)`); }
process.exitCode = found.size ? 1 : 0;
