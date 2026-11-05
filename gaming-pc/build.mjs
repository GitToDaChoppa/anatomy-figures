import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { k, G, makeWorld } from "./world.mjs";
import { ASSEMBLIES, STEPS, PSU_WATTS, byId, drawOf, readoutOf } from "./pc.mjs";
import { sortLeaves, orderGraph } from "./sorter.mjs";
import { buildCase, CASE } from "./parts-case.mjs";
import { buildBoard } from "./parts-board.mjs";
import { buildRest } from "./parts-rest.mjs";

const SKILL = "C:/Users/brand/.claude/skills/anatomy";
const { kitScript } = await import(pathToFileURL(`${SKILL}/scripts/inline-kit.mjs`).href);
const HERE = dirname(fileURLToPath(import.meta.url));
const only = ["--dark", "--light", "--blueprint"].find((f) => process.argv.includes(f))?.slice(2);

const WIDTH = 900;
let HEIGHT = 900;
const AZIMUTH = Number(process.env.AZ ?? 48);
const ELEVATION = Number(process.env.EL ?? 32);

function construct(P) {
  const W = makeWorld(P);
  buildCase(W);
  buildBoard(W);
  buildRest(W);
  return W;
}

// pass 1: any projection will do, we only want the boxes. pass 2: fit the camera to the assembled and exploded parts.
const P0 = k.fitProjection(k.boxCorners({ x: 0, y: 0, w: CASE.W, d: CASE.D }, 0, 700), WIDTH, HEIGHT, { azimuth: AZIMUTH, elevation: ELEVATION });
const draft = construct(P0);
const asmIndex = Object.fromEntries(["case", ...ASSEMBLIES.map((a) => a.id)].map((id, i) => [id, i]));
const moveOf = (id) => (id === "case" ? [0, 0, 0] : byId[id].move);
const slideOf = (id) => (id === "case" ? [0, 0, 0] : byId[id].slide);
const extremes = [];
for (const it of draft.items) {
  const m = moveOf(it.asm);
  const sl = slideOf(it.asm);
  const d = [m[0] + sl[0] + it.sub[0], m[1] + sl[1] + it.sub[1], m[2] + sl[2] + it.sub[2]];
  for (const base of [[0, 0, 0], d]) {
    for (const x of [it.min[0], it.max[0]]) for (const y of [it.min[1], it.max[1]]) for (const z of [it.min[2], it.max[2]]) extremes.push([x + base[0], y + base[1], z + base[2]]);
  }
}
const PAD = Number(process.env.PAD ?? 34);
{
  const unit = k.fitProjection(extremes, 1000, 1000, { pad: 0, azimuth: AZIMUTH, elevation: ELEVATION });
  const pts = extremes.map((p) => k.iso(p, unit));
  const w = Math.max(...pts.map((p) => p[0])) - Math.min(...pts.map((p) => p[0]));
  const h = Math.max(...pts.map((p) => p[1])) - Math.min(...pts.map((p) => p[1]));
  HEIGHT = Math.round(Math.min(1100, Math.max(640, ((WIDTH - 2 * PAD) * h) / w + 2 * PAD)));
}
const P = k.fitProjection(extremes, WIDTH, HEIGHT, { pad: PAD, azimuth: AZIMUTH, elevation: ELEVATION, headroom: 0 });
const W = construct(P);
const { items } = W;

// ---- leaf data for the page ------------------------------------------------------------------------------
const V = G.viewOf(P);
const groups = new Map();
// convex hull of a handful of screen points (Andrew's monotone chain), counter-clockwise on screen
function hullOf(points) {
  const pts = points.slice().sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  const cross = (o, a, b) => (a[0] - o[0]) * (b[1] - o[1]) - (a[1] - o[1]) * (b[0] - o[0]);
  const lo = [];
  for (const p of pts) { while (lo.length >= 2 && cross(lo[lo.length - 2], lo[lo.length - 1], p) <= 0) lo.pop(); lo.push(p); }
  const up = [];
  for (const p of pts.slice().reverse()) { while (up.length >= 2 && cross(up[up.length - 2], up[up.length - 1], p) <= 0) up.pop(); up.push(p); }
  return lo.slice(0, -1).concat(up.slice(0, -1));
}
const leaves = items.map((it) => {
  const gk = it.asm + "|" + it.sub.join(",");
  if (!groups.has(gk)) groups.set(gk, groups.size);
  const xs = [];
  for (const x of [it.min[0], it.max[0]]) for (const y of [it.min[1], it.max[1]]) for (const z of [it.min[2], it.max[2]]) xs.push(k.iso([x, y, z], P));
  const sb = [Math.min(...xs.map((p) => p[0])) - 2, Math.min(...xs.map((p) => p[1])) - 2, Math.max(...xs.map((p) => p[0])) + 2, Math.max(...xs.map((p) => p[1])) + 2].map((n) => +n.toFixed(1));
  return { lo: it.min, hi: it.max, sb, h: hullOf(xs).flat().map((n) => +n.toFixed(1)), g: groups.get(gk), a: asmIndex[it.asm], sub: it.sub };
});
// assembled order doubles as the fixed order inside every group
const zero = leaves.map(() => [0, 0, 0, 0, 0]);
const pre = sortLeaves(leaves, zero, V, null);
const rank = new Array(leaves.length);
pre.forEach((idx, r) => { rank[idx] = r; });
const first = sortLeaves(leaves, zero, V, rank);

const asmList = ["case", ...ASSEMBLIES.map((a) => a.id)].map((id) => ({ id, ...byId[id], move: moveOf(id), slide: slideOf(id) }));
const U = [[1, 0, 0], [0, 1, 0], [0, 0, 1]].map((v) => { const a = k.iso(v, P); const o = k.iso([0, 0, 0], P); return [a[0] - o[0], a[1] - o[1]]; });

writeFileSync(join(HERE, "leaves.json"), JSON.stringify({ leaves: leaves.map((l, i) => ({ ...l, name: items[i].name, asm: items[i].asm })), asm: asmList.map((a) => ({ id: a.id, step: a.step, move: a.move, slide: a.slide })), U, P }));

// ---- a pin on every part: where it comes from (the top of its biggest piece, or the plug end of a cable) -------
const PIN_SHIFT = { psu: [-48, -20], ssd: [44, 0] };
const PIN_ON = { cabsata: "sata plug", cab24: "24-pin plug", cabcpu: "eps plug", cabgpu: "12v-2x6 plug" };
const pins = ASSEMBLIES.map((a) => {
  const mine = items.filter((it) => it.asm === a.id);
  const pick = PIN_ON[a.id] ? mine.find((it) => it.name === PIN_ON[a.id]) : mine.reduce((best, it) => ((it.max[0] - it.min[0]) * (it.max[1] - it.min[1]) > best.ar ? { it, ar: (it.max[0] - it.min[0]) * (it.max[1] - it.min[1]) } : best), { ar: -1 }).it;
  const sh = PIN_SHIFT[a.id] || [0, 0];
  const world = [(pick.min[0] + pick.max[0]) / 2 + sh[0], (pick.min[1] + pick.max[1]) / 2 + sh[1], pick.max[2]];
  const [x, y] = k.iso(world, P);
  return { id: a.id, step: a.step, x: +x.toFixed(1), y: +y.toFixed(1) };
});
const pinSvg = pins.map((p) => `<g class="pc-pin" data-a="${p.id}" hidden transform="translate(${p.x} ${p.y})"><path class="pc-guide" data-guide="${p.id}" d=""/><circle class="pc-home" cx="${p.x}" cy="${p.y}" r="1.7" hidden/><g class="pc-pin-tag"><path d="M0 0V-9"/><circle cx="0" cy="-16" r="7.2"/><text y="-13.2">${p.step}</text><circle class="pc-dot" r="1.5"/></g></g>`).join("");

const leavesSvg = first.map((i) => `<g class="it" data-a="${items[i].asm}" data-i="${i}">${items[i].svg}</g>`).join("");
const tray = { x: 0, y: 0, w: CASE.W, d: CASE.D, r: 6 };
const label = "A gaming PC lying on its side with the glass panel off, coming apart into its parts in the order they are built: power supply, case fans, I/O shield, motherboard, processor, memory, M.2 SSD, cooler, SATA SSD, graphics card, cables and the glass panel.";
const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label,
  body: [`<path class="iso-halo" d="${k.haloOf(tray, -4, 4, P)}"/>`, `<g id="leaves">${leavesSvg}</g>`, `<g id="pins">${pinSvg}</g>`],
});

const EXTRA_CSS = `
.pc-void{fill:var(--anatomy-shade-0);stroke:none}
.pc-stage{outline:none;position:relative}
.pc-stage .iso-svg{overflow:hidden}
.pc-glass{fill:var(--anatomy-hi);opacity:.035;stroke:none;pointer-events:none}
.pc-sheen{fill:var(--anatomy-hi);opacity:.07;stroke:none;pointer-events:none}
.pc-stage[data-focus] .it:not([data-on]){--anatomy-hi:var(--anatomy-mid);--anatomy-mid:var(--anatomy-lo)}
.it[data-on]{--anatomy-hi:var(--anatomy-lit);--anatomy-mid:var(--anatomy-hi)}
.it[data-on] .iso-top,.it[data-on] .tb-shine{fill:var(--anatomy-lit-top)}
.it[data-on] .iso-shade,.it[data-on] .tb-body{fill:var(--anatomy-lit-shade)}
.it[data-on] [data-seamless]>.iso-shade{stroke:var(--anatomy-lit-shade)}
.it[data-on] [data-seamless]>.iso-top{stroke:var(--anatomy-lit-top)}
.it{cursor:pointer}
.pc-pin{pointer-events:none}
.pc-pin[hidden],.pc-pin [hidden]{display:none}
.pc-pin-tag{cursor:pointer;pointer-events:all}
.pc-pin-tag path{fill:none;stroke:var(--anatomy-mid);stroke-width:.6}
.pc-pin-tag circle{fill:var(--anatomy-paper);stroke:var(--anatomy-mid);stroke-width:.7}
.pc-pin-tag .pc-dot{fill:var(--anatomy-mid);stroke:none}
.pc-pin-tag text{font:600 7.4px/1 var(--anatomy-mono);fill:var(--anatomy-text);text-anchor:middle}
.pc-pin[data-on] .pc-pin-tag circle:not(.pc-dot){fill:var(--anatomy-lit);stroke:var(--anatomy-lit)}
.pc-pin[data-on] .pc-pin-tag text{fill:var(--anatomy-paper)}
.pc-pin[data-on] .pc-pin-tag path{stroke:var(--anatomy-lit)}
.pc-guide{fill:none;stroke:var(--anatomy-mid);stroke-width:.6;stroke-dasharray:1.2 3.4;opacity:.7}
.pc-pin[data-on] .pc-guide{stroke:var(--anatomy-lit);opacity:1}
.pc-home{fill:var(--anatomy-mid);stroke:none}
.pc-stage[data-focus] .pc-pin:not([data-on]){opacity:.45}
.iso[data-theme="blueprint"]{
  --anatomy-page:#06203f;--anatomy-card:#0b3363;--anatomy-text:#a9cdf0;--anatomy-strong:#ffffff;--anatomy-muted:#6f9fd0;
  --anatomy-paper:#0b3363;--anatomy-face:#0f3d78;--anatomy-top:#164a8c;
  --anatomy-shade-0:#082a55;--anatomy-shade-1:#0a3060;--anatomy-shade-2:#0d386b;--anatomy-shade-3:#10407a;
  --anatomy-lit-top:#2a6bb5;--anatomy-lit-shade:#1b5496;
  --anatomy-hi:#eaf5ff;--anatomy-mid:#8fc1f2;--anatomy-lo:#4f87c4;--anatomy-faint:#2a5c99;--anatomy-lit:#ffffff;
  --anatomy-halo:#031428;--anatomy-halo-opacity:.55;--anatomy-dot:#eaf5ff;
}
.iso[data-theme="blueprint"] .iso-plate{background-image:linear-gradient(#ffffff0d 1px,transparent 1px),linear-gradient(90deg,#ffffff0d 1px,transparent 1px),linear-gradient(#ffffff06 1px,transparent 1px),linear-gradient(90deg,#ffffff06 1px,transparent 1px);background-size:80px 80px,80px 80px,16px 16px,16px 16px;background-position:-1px -1px}
.pc-ui{display:flex;flex-wrap:wrap;justify-content:center;align-items:center;gap:6px;margin:0 0 14px}
.pc-ui button,.pc-list button{font:10.5px/1 var(--anatomy-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--anatomy-muted);background:transparent;border:1px solid var(--anatomy-faint);padding:7px 11px;cursor:pointer;border-radius:0}
.pc-ui button:hover,.pc-list button:hover{color:var(--anatomy-text);border-color:var(--anatomy-lo)}
.pc-ui button[aria-pressed="true"],.pc-list button[aria-pressed="true"]{color:var(--anatomy-strong);border-color:var(--anatomy-mid)}
.pc-ui button:focus-visible,.pc-list button:focus-visible{outline:1px solid var(--anatomy-hi);outline-offset:2px}
.pc-ui .gap{width:14px}
.pc-ui output{font:10.5px/1 var(--anatomy-mono);letter-spacing:.1em;color:var(--anatomy-text);min-width:88px;text-align:center}
.pc-info{margin:14px 0 0;min-height:76px;padding:12px 14px;border:1px solid var(--anatomy-faint);display:grid;grid-template-columns:auto 1fr auto;gap:2px 14px;align-items:baseline}
.pc-info .n{font:600 22px/1 var(--anatomy-mono);color:var(--anatomy-muted)}
.pc-info .t{font:600 14px/1.3 ui-sans-serif,system-ui,sans-serif;color:var(--anatomy-strong)}
.pc-info .w{font:11px/1 var(--anatomy-mono);letter-spacing:.06em;color:var(--anatomy-text);text-align:right}
.pc-info .s{grid-column:2/4;font:11.5px/1.5 var(--anatomy-mono);color:var(--anatomy-muted)}
.pc-info .h{grid-column:2/4;font:13px/1.55 ui-sans-serif,system-ui,sans-serif;color:var(--anatomy-text)}
.pc-list{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:6px;margin:14px 0 0;padding:0;list-style:none}
.pc-list button{width:100%;text-align:left;display:flex;gap:9px;align-items:baseline;text-transform:none;letter-spacing:.02em;font-size:11.5px}
.pc-list b{font-weight:500;color:var(--anatomy-muted);min-width:18px}
@media print{.pc-ui,.pc-list,.pc-info{display:none}}
@media (max-width:560px){.pc-stage{overflow:hidden}.pc-stage .iso-svg{width:130%;margin-left:-15%;max-width:none}.pc-info{grid-template-columns:auto 1fr}.pc-info .w{display:none}.pc-info .s,.pc-info .h{grid-column:1/3}}
`;

const live = `
const P = ${JSON.stringify(P)};
const V = ${JSON.stringify(V)};
const U = ${JSON.stringify(U)};
const LEAVES = ${JSON.stringify(leaves)};
const RANK = ${JSON.stringify(rank)};
const ASM = ${JSON.stringify(asmList)};
const ASSEMBLIES = ${JSON.stringify(ASSEMBLIES)};
const PINS = ${JSON.stringify(pins)};
const STEPS = ${JSON.stringify(STEPS)};
const PSU_WATTS = ${PSU_WATTS};
const byId = Object.fromEntries(ASM.map((a) => [a.id, a]));
${drawOf.toString()}
const readoutOf = ${readoutOf.toString()};
${orderGraph.toString()}
${sortLeaves.toString()}
const stage = document.querySelector(".pc-stage");
const svg = stage.querySelector("svg");
const layer = svg.querySelector("#leaves");
const readout = document.querySelector("[data-readout]");
const info = document.querySelector("[data-info]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const nodes = new Array(LEAVES.length);
for (const g of layer.children) nodes[+g.dataset.i] = g;
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
const TOP = STEPS[STEPS.length - 1];

// ---- springs: one per assembly (apart) and one for opening an assembly up (sub-parts) ----
const A = ASM.map((a, i) => ({ ...a, i, x: 0, v: 0, target: 0, pending: null, sx: 0, sv: 0, st: 0, leaves: [] }));
LEAVES.forEach((l, i) => A[l.a].leaves.push(i));
const Aby = Object.fromEntries(A.map((a) => [a.id, a]));
const pinEl = {}, guideEl = {}, homeEl = {};
for (const p of PINS) {
  const g = svg.querySelector('.pc-pin[data-a="' + p.id + '"]');
  pinEl[p.id] = g; guideEl[p.id] = g.querySelector(".pc-guide"); homeEl[p.id] = g.querySelector(".pc-home");
  Aby[p.id].pin = p;
}
const TOTAL = ASSEMBLIES.length;
let built = TOP, selected = null, opened = null, clock = 0, frame = 0, last = 0, visible = false, text = "", player = 0;
const STAGGER = 0.045;

function setBuilt(n) {
  built = clamp(n, 0, TOP);
  for (const a of A) if (a.pending && a.pending.value !== (a.step <= built ? 0 : 1)) a.pending = null;
  const changing = A.filter((a) => a.step && (a.step <= built ? 0 : 1) !== a.target);
  const opening = changing.filter((a) => a.step > built).sort((p, q) => q.step - p.step || q.i - p.i);
  const closing = changing.filter((a) => a.step <= built).sort((p, q) => p.step - q.step || p.i - q.i);
  // an assembly that is open folds shut first, then goes home
  const wait = opened && Aby[opened].step <= built ? 0.42 : 0;
  if (wait) opened = null;
  for (const list of [opening, closing]) list.forEach((a, n) => { a.pending = { value: a.step <= built ? 0 : 1, at: clock + wait + n * STAGGER }; });
  if (still.matches) A.forEach((a) => { if (a.pending) { a.x = a.target = a.pending.value; a.v = 0; a.pending = null; } });
  syncUi();
  run();
}
function setOpen(id) {
  opened = id;
  // a part that is still built comes out first (with everything built after it), then opens up
  if (id && Aby[id].step <= built) setBuilt(Aby[id].step - 1);
  if (still.matches) A.forEach((a) => { a.sx = a.sv = 0; });
  syncUi();
  run();
}
function select(id) {
  if (id === selected) return;
  if (selected) { for (const i of Aby[selected].leaves) nodes[i].removeAttribute("data-on"); if (pinEl[selected]) pinEl[selected].removeAttribute("data-on"); }
  selected = id;
  if (selected) { for (const i of Aby[selected].leaves) nodes[i].setAttribute("data-on", ""); if (pinEl[selected]) pinEl[selected].setAttribute("data-on", ""); }
  stage.toggleAttribute("data-focus", !!selected);
  document.querySelectorAll(".pc-list button").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.asm === selected)));
  say();
}
const esc = (s) => String(s).replace(/[&<>]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c]));
function say() {
  const installed = new Set(ASSEMBLIES.filter((a) => a.step <= built).map((a) => a.id));
  const next = readoutOf({ installed, total: TOTAL, selected });
  if (next !== text) { text = next; readout.textContent = next; stage.setAttribute("aria-valuetext", next); }
  if (!info) return;
  const a = selected ? byId[selected] : null;
  const html = a
    ? '<span class="n">' + (a.step ? String(a.step).padStart(2, "0") : "—") + '</span><span class="t">' + esc(a.name) + '</span><span class="w">' + (a.watts ? "~" + a.watts + " W under load" : a.step ? "no draw" : "") + '</span><span class="s">' + esc(a.spec) + '</span><span class="h">' + esc(a.tip) + "</span>"
    : '<span class="n">—</span><span class="t">Hover a part</span><span class="w"></span><span class="s">' + (built === 0 ? "bare case · every part lifted out" : built === TOP ? "built · every part in place" : "step " + built + " of " + TOP) + '</span><span class="h">Each part comes out the way it goes in. Click one to open it up, ◀ ▶ to walk the build.</span>';
  if (info.dataset.k !== html) { info.dataset.k = html; info.innerHTML = html; }
}
function syncUi() {
  const out = document.querySelector("[data-step]");
  if (out) out.textContent = built === TOP ? "built" : built === 0 ? "bare case" : "step " + built + " / " + TOP;
  const ex = document.querySelector("[data-explode]");
  if (ex) ex.textContent = built === 0 ? "Assemble" : "Explode";
  say();
}
function stopPlay() {
  clearTimeout(player); player = 0;
  const b = document.querySelector("[data-play]");
  if (b) { b.setAttribute("aria-pressed", "false"); b.textContent = "Build it"; }
}
function play() {
  if (player) { stopPlay(); return; }
  const b = document.querySelector("[data-play]");
  b.setAttribute("aria-pressed", "true"); b.textContent = "Stop";
  setBuilt(0);
  let n = 0;
  const next = () => { n++; setBuilt(n); player = n >= TOP ? setTimeout(stopPlay, 1200) : setTimeout(next, 1350); };
  player = setTimeout(next, 1500);
}

const view = { now: null, target: null };
const applyView = () => svg.setAttribute("viewBox", view.now.map((v) => v.toFixed(1)).join(" "));
// parts rise first and slide sideways once they are clear of what they sat on
const slideShare = (x) => { const t = clamp((x - 0.3) / 0.55, 0, 1); return t * t * (3 - 2 * t); };
let order = null;
function place() {
  const off = new Array(LEAVES.length);
  for (let i = 0; i < LEAVES.length; i++) {
    const l = LEAVES[i], a = A[l.a];
    const x = a.x, s = a.sx, f = slideShare(x);
    const dx = a.move[0] * x + a.slide[0] * f + l.sub[0] * s, dy = a.move[1] * x + a.slide[1] * f + l.sub[1] * s, dz = a.move[2] * x + a.slide[2] * f + l.sub[2] * s;
    off[i] = [dx, dy, dz, U[0][0] * dx + U[1][0] * dy + U[2][0] * dz, U[0][1] * dx + U[1][1] * dy + U[2][1] * dz];
    const n = nodes[i];
    if (Math.abs(off[i][3]) + Math.abs(off[i][4]) < 0.005) n.removeAttribute("transform");
    else n.setAttribute("transform", "translate(" + off[i][3].toFixed(2) + " " + off[i][4].toFixed(2) + ")");
  }
  // the camera follows the parts: the view is the box round everything as it is this frame
  let bx0 = 1e9, by0 = 1e9, bx1 = -1e9, by1 = -1e9;
  for (let i = 0; i < LEAVES.length; i++) {
    const s = LEAVES[i].sb, o = off[i];
    bx0 = Math.min(bx0, s[0] + o[3]); by0 = Math.min(by0, s[1] + o[4]); bx1 = Math.max(bx1, s[2] + o[3]); by1 = Math.max(by1, s[3] + o[4]);
  }
  {
    const m = 34, asp = ${WIDTH} / ${HEIGHT};
    const tw = Math.max(bx1 - bx0 + 2 * m, (by1 - by0 + 2 * m) * asp), th = tw / asp;
    view.target = [(bx0 + bx1) / 2 - tw / 2, (by0 + by1) / 2 - th / 2, tw, th];
    if (opened && Aby[opened].sx > 0.01) {
      let fx0 = 1e9, fy0 = 1e9, fx1 = -1e9, fy1 = -1e9;
      for (const i of Aby[opened].leaves) { const s = LEAVES[i].sb, o = off[i]; fx0 = Math.min(fx0, s[0] + o[3]); fy0 = Math.min(fy0, s[1] + o[4]); fx1 = Math.max(fx1, s[2] + o[3]); fy1 = Math.max(fy1, s[3] + o[4]); }
      const fm = 60, fw = Math.max(fx1 - fx0 + 2 * fm, (fy1 - fy0 + 2 * fm) * asp, 300), fh = fw / asp;
      const t = Math.min(1, Aby[opened].sx), foc = [(fx0 + fx1) / 2 - fw / 2, (fy0 + fy1) / 2 - fh / 2, fw, fh];
      view.target = view.target.map((v, q) => v + (foc[q] - v) * t);
    }
    if (!view.now) { view.now = view.target.slice(); applyView(); }
  }
  const next = sortLeaves(LEAVES, off, V, RANK);
  if (!order || next.some((v, n) => v !== order[n])) {
    order = next;
    const frag = document.createDocumentFragment();
    for (const i of order) frag.appendChild(nodes[i]);
    layer.appendChild(frag);
  }
  // pins ride on their part; a dotted guide runs from where it lives to where it is
  for (const p of PINS) {
    const a = Aby[p.id], f = slideShare(a.x), g = pinEl[p.id];
    const lx = (U[2][0] * a.move[2] + U[0][0] * a.move[0] + U[1][0] * a.move[1]) * a.x, ly = (U[2][1] * a.move[2] + U[0][1] * a.move[0] + U[1][1] * a.move[1]) * a.x;
    const sx = (U[0][0] * a.slide[0] + U[1][0] * a.slide[1] + U[2][0] * a.slide[2]) * f, sy = (U[0][1] * a.slide[0] + U[1][1] * a.slide[1] + U[2][1] * a.slide[2]) * f;
    const away = Math.abs(lx + sx) + Math.abs(ly + sy) > 3;
    g.toggleAttribute("hidden", !away);
    if (!away) continue;
    const tag = g.querySelector(".pc-pin-tag");
    tag.setAttribute("transform", "translate(" + (lx + sx).toFixed(1) + " " + (ly + sy).toFixed(1) + ")");
    homeEl[p.id].removeAttribute("hidden");
    // the pin group sits at the part's home, so the tag is moved and the guide is drawn in home coordinates
    guideEl[p.id].setAttribute("d", "M0 0L" + lx.toFixed(1) + " " + ly.toFixed(1) + "L" + (lx + sx).toFixed(1) + " " + (ly + sy).toFixed(1));
  }
}
function step(dt) {
  clock += dt;
  const h = dt / 4;
  let moving = false;
  for (const a of A) {
    if (a.pending && clock >= a.pending.at) { a.target = a.pending.value; a.pending = null; }
    a.st = a.id === opened && a.target === 1 && !a.pending && a.x > 0.98 ? 1 : 0;
    for (let n = 0; n < 4; n++) {
      a.v += (64 * (a.target - a.x) - 15.5 * a.v) * h; a.x += a.v * h;
      a.sv += (80 * (a.st - a.sx) - 15 * a.sv) * h; a.sx += a.sv * h;
    }
    if (Math.abs(a.x - a.target) < 0.0004 && Math.abs(a.v) < 0.002) { a.x = a.target; a.v = 0; }
    if (Math.abs(a.sx - a.st) < 0.0004 && Math.abs(a.sv) < 0.002) { a.sx = a.st; a.sv = 0; }
    if (a.pending || a.x !== a.target || a.sx !== a.st) moving = true;
  }
  return moving;
}
function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  let moving = still.matches ? false : step(dt);
  place();
  const k = still.matches ? 1 : 1 - Math.exp(-dt / 0.38);
  let gap = 0;
  for (let q = 0; q < 4; q++) { view.now[q] += (view.target[q] - view.now[q]) * k; gap = Math.max(gap, Math.abs(view.target[q] - view.now[q])); }
  applyView();
  if (gap > 0.2) moving = true; else { view.now = view.target.slice(); applyView(); }
  frame = visible && moving ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame) { last = 0; frame = requestAnimationFrame(tick); } };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

// ---- input ----
const asmOf = (e) => { const g = e.target.closest && e.target.closest(".it,.pc-pin"); return g ? g.dataset.a : null; };
stage.addEventListener("pointerover", (e) => { const id = asmOf(e); if (id) select(id); });
stage.addEventListener("pointerleave", () => select(null));
stage.addEventListener("click", (e) => { const id = asmOf(e); stopPlay(); if (id && id !== "case") setOpen(opened === id ? null : id); else setOpen(null); });
document.querySelector("[data-explode]").addEventListener("click", () => { stopPlay(); setBuilt(built === 0 ? TOP : 0); });
document.querySelector("[data-prev]").addEventListener("click", () => { stopPlay(); setBuilt(built - 1); });
document.querySelector("[data-next]").addEventListener("click", () => { stopPlay(); setBuilt(built + 1); });
document.querySelector("[data-play]").addEventListener("click", play);
document.querySelectorAll(".pc-list button").forEach((b) => {
  b.addEventListener("mouseenter", () => select(b.dataset.asm));
  b.addEventListener("focus", () => select(b.dataset.asm));
  b.addEventListener("mouseleave", () => select(null));
  b.addEventListener("blur", () => select(null));
  b.addEventListener("click", () => { stopPlay(); setOpen(opened === b.dataset.asm ? null : b.dataset.asm); });
});
document.querySelectorAll("[data-theme-set]").forEach((b) => b.addEventListener("click", () => {
  document.body.setAttribute("data-theme", b.dataset.themeSet);
  document.querySelectorAll("[data-theme-set]").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
}));
stage.addEventListener("keydown", (e) => {
  if (e.key === " ") { e.preventDefault(); stopPlay(); setBuilt(built === 0 ? TOP : 0); }
  if (e.key === "ArrowRight" || e.key === "ArrowUp") { e.preventDefault(); stopPlay(); setBuilt(built + 1); }
  if (e.key === "ArrowLeft" || e.key === "ArrowDown") { e.preventDefault(); stopPlay(); setBuilt(built - 1); }
  if (e.key === "Escape") { setOpen(null); select(null); }
});
window.__pc = { A, setBuilt, setOpen, select, place, play, get order() { return order; } };
{
  const q = new URLSearchParams(location.search);
  // the page opens exploded; ?assembled opens it built
  if (!q.has("assembled")) { A.forEach((a) => { if (a.step) { a.x = a.target = 1; } }); built = 0; }
  if (q.has("open")) { opened = q.get("open"); A.forEach((a) => { a.st = a.id === opened ? 1 : 0; a.sx = a.st; }); }
  if (q.has("sel")) select(q.get("sel"));
  if (q.has("step")) { const n = +q.get("step"); built = n; A.forEach((a) => { if (a.step) { a.x = a.target = a.step <= n ? 0 : 1; } }); }
}
place();
syncUi();
`;

const listItems = ASSEMBLIES.map((a) => `<li><button type="button" data-asm="${a.id}" aria-pressed="false"><b>${String(a.step).padStart(2, "0")}</b>${a.name}</button></li>`).join("");
const body = (theme) => {
  const plate = k.plateHtml({
    fig: "Fig 1",
    title: "Gaming PC, built part by part",
    hint: "Hover a part · click to open it up",
    readout: "bare case · 0 of 20 parts in",
    keys: [
      { mark: "lit", label: "The part you are on" },
      { mark: "raised", label: "Numbered in build order" },
      { mark: "dotted", label: "The way it comes out" },
    ],
    caption: "A mid-tower lying on its side with the glass off, so the motherboard tray is the workbench. Near walls are cut down to see in. Each part leaves the way it goes in, last-in first-out; click one to open it up. Wattages are typical gaming-load estimates for the parts shown.",
    body: `<div class="iso-stage pc-stage" tabindex="0" role="group" aria-label="Gaming PC, exploded. Arrow keys walk the build, space explodes or assembles it." aria-valuetext="">${svg}</div>`,
  });
  const ui = `<div class="pc-ui" role="toolbar" aria-label="Controls">${["light", "dark", "blueprint"].map((t) => `<button type="button" data-theme-set="${t}" aria-pressed="${t === theme}">${t}</button>`).join("")}<span class="gap"></span><button type="button" data-explode>Assemble</button><button type="button" data-play aria-pressed="false">Build it</button><span class="gap"></span><button type="button" data-prev aria-label="Take the last part out">◀</button><output data-step aria-live="polite">bare case</output><button type="button" data-next aria-label="Fit the next part">▶</button></div>`;
  return ui + plate + `<div class="pc-info" data-info aria-live="polite"></div><ol class="pc-list">${listItems}</ol>`;
};
const files = { light: "gaming-pc.html", dark: "gaming-pc-dark.html", blueprint: "gaming-pc-blueprint.html" };
for (const theme of only ? [only] : ["light", "dark", "blueprint"]) {
  const html = k.pageHtml({ title: "Gaming PC, exploded", theme, body: body(theme), width: WIDTH, script: kitScript() + live }).replace("</style>", EXTRA_CSS + "</style>");
  writeFileSync(join(HERE, files[theme]), html);
  console.log("wrote", files[theme], items.length, "leaves,", Math.round(html.length / 1024), "KB");
}
