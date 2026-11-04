import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const SKILL = "C:/Users/brand/.claude/skills/anatomy";
const k = await import(pathToFileURL(`${SKILL}/kit/iso-kit.mjs`).href);
const G = await import(pathToFileURL(`${SKILL}/kit/lathe.mjs`).href);
const { kitScript } = await import(pathToFileURL(`${SKILL}/scripts/inline-kit.mjs`).href);
const T = await import(pathToFileURL(`${SKILL}/kit/tube.mjs`).href);
const amp = await import("./amp.mjs");

const HERE = dirname(fileURLToPath(import.meta.url));
const theme = process.argv.includes("--blueprint") ? "blueprint" : process.argv.includes("--light") ? "light" : "dark";

// Colour is the subject for heat and signal, so these are the only hues in the figure.
// Everything else stays in the grey/blue ramps of the active theme.
const EXTRA_CSS = `
.iso{--anatomy-amber:#ffa53d;--anatomy-ember:#ff5a1f;--anatomy-hot:#fff1c2;--anatomy-glow-blend:screen}
.iso[data-theme="light"]{--anatomy-amber:#f08a1c;--anatomy-ember:#e5484d;--anatomy-hot:#ffb347;--anatomy-glow-blend:normal}
.iso[data-theme="blueprint"]{
  --anatomy-page:#06203f;--anatomy-card:#0b3363;--anatomy-text:#a9cdf0;--anatomy-strong:#ffffff;--anatomy-muted:#6f9fd0;
  --anatomy-paper:#0b3363;--anatomy-face:#0f3d78;--anatomy-top:#164a8c;
  --anatomy-shade-0:#082a55;--anatomy-shade-1:#0a3060;--anatomy-shade-2:#0d386b;--anatomy-shade-3:#10407a;
  --anatomy-lit-top:#2a6bb5;--anatomy-lit-shade:#1b5496;
  --anatomy-hi:#eaf5ff;--anatomy-mid:#8fc1f2;--anatomy-lo:#4f87c4;--anatomy-faint:#2a5c99;--anatomy-lit:#ffffff;
  --anatomy-halo:#031428;--anatomy-halo-opacity:.55;--anatomy-dot:#eaf5ff;
  --anatomy-amber:#ffd45e;--anatomy-ember:#ff8a5c;--anatomy-hot:#ffffff;--anatomy-glow-blend:screen;
  --anatomy-red:#ff8a8a;--anatomy-green:#7be0b0;--anatomy-blue:#9ec5ff;
}
.iso[data-theme="blueprint"] .iso-plate{background-image:linear-gradient(#ffffff0d 1px,transparent 1px),linear-gradient(90deg,#ffffff0d 1px,transparent 1px),linear-gradient(#ffffff06 1px,transparent 1px),linear-gradient(90deg,#ffffff06 1px,transparent 1px);background-size:80px 80px,80px 80px,16px 16px,16px 16px;background-position:-1px -1px}
.iso[data-theme="blueprint"] .iso-plate-corner{text-shadow:none}
.iso-line[data-tone="amber"]{stroke:var(--anatomy-amber)}
.iso-wire[data-tone="amber"] .iso-wire-end{stroke:var(--anatomy-amber)}
.iso-dots[data-tone="amber"] circle{fill:var(--anatomy-amber);opacity:1}
.iso-bloom{fill:var(--anatomy-amber);stroke:none;filter:blur(5px);mix-blend-mode:var(--anatomy-glow-blend);pointer-events:none}
.iso-pool{fill:var(--anatomy-ember);stroke:none;filter:blur(7px);mix-blend-mode:var(--anatomy-glow-blend);pointer-events:none}
.iso-core{fill:var(--anatomy-hot);stroke:none;filter:blur(1.2px);pointer-events:none}
[data-part="power"]{cursor:pointer;outline:none}
.iso-hit{fill:transparent;stroke:none}
[data-part="power"]:focus-visible .iso-hit{stroke:var(--anatomy-hi);stroke-width:1}
.iso-stage[data-off] .iso-line[data-flow]{animation-play-state:paused;opacity:.3}
.iso-stage[data-off] .iso-line[data-tone="amber"],.iso-stage[data-off] .iso-wire[data-tone="amber"] .iso-wire-end{stroke:var(--anatomy-mid)}
.iso-lamp{transition:opacity .25s}.iso-lamp-halo{transition:opacity .25s}
.iso-stage[data-off] .iso-lamp,.iso-stage[data-off] .iso-lamp-halo{opacity:0}
.iso-lamp{fill:var(--anatomy-red);stroke:none;pointer-events:none}
.iso-lamp-halo{fill:var(--anatomy-red);stroke:none;filter:blur(5px);opacity:calc(.55 * var(--apart-fade, 1));pointer-events:none;mix-blend-mode:var(--anatomy-glow-blend)}
.amp-labels{pointer-events:none}
.amp-labels text{font:7.5px/1 var(--anatomy-mono);letter-spacing:.07em;text-transform:uppercase;fill:var(--anatomy-text);stroke:var(--anatomy-paper);stroke-width:2.6px;paint-order:stroke;stroke-linejoin:round}
.amp-labels path{fill:none;stroke:var(--anatomy-mid);stroke-width:.6}
.amp-labels circle{fill:var(--anatomy-hi);stroke:var(--anatomy-paper);stroke-width:.6}
.amp-ui{display:flex;flex-wrap:wrap;justify-content:center;gap:6px;margin:0 0 -18px;position:relative;z-index:1}
.amp-ui button{font:10.5px/1 var(--anatomy-mono);letter-spacing:.1em;text-transform:uppercase;color:var(--anatomy-muted);background:transparent;border:1px solid var(--anatomy-faint);padding:7px 11px;cursor:pointer;border-radius:0}
.amp-ui button:hover{color:var(--anatomy-text);border-color:var(--anatomy-lo)}
.amp-ui button[aria-pressed="true"]{color:var(--anatomy-strong);border-color:var(--anatomy-mid)}
.amp-ui button:focus-visible{outline:1px solid var(--anatomy-hi);outline-offset:2px}
.amp-ui .gap{width:14px}
@media print{.amp-ui{display:none}}
@media (max-width:560px){.iso-stage{overflow:hidden}.iso-stage .iso-svg{width:114%;margin-left:-7%;max-width:none}}
`;

const WIDTH = 760;
const HEIGHT = 470;

// ---- world -----------------------------------------------------------------
const BENCH = { x: -215, y: -75, w: 490, d: 150, r: 8 };
const BENCH_H = 12;
const FOOT_H = 5;

const CHASSIS = { x: -195, y: -52, w: 235, d: 100, r: 5 };
const DECK = 16; // chassis top
const CAB = { x: 88, y: -48, w: 180, d: 92, r: 4 };
const CAB_H = 88;
const FACE_Y = CAB.y + CAB.d; // 44, the baffle

const SPK = [178, 44]; // speaker centre on the baffle: x, z
const SPK_Z = 44;

const AZIMUTH = 58;
const P = k.fitProjection(
  [...k.boxCorners(BENCH, -BENCH_H - FOOT_H, 0), [CAB.x, CAB.y, CAB_H + 6], [CAB.x + CAB.w, CAB.y + CAB.d, CAB_H + 6], [-150, 8, 82 + 62]],
  WIDTH,
  HEIGHT,
  { pad: 26, azimuth: AZIMUTH },
);

const at = (point) => k.iso(point, P);
const S = (paths, style) => k.solidSvg(paths, style);
const L = (d, style) => k.lineSvg(d, style);
const D = (points, style) => k.dotsSvg(points, style);
const depth = (x, y) => k.depthOf([x, y, 0], P);
const byDepth = (items, key = (i) => i) => [...items].sort((a, b) => depth(...key(a)) - depth(...key(b)));
const V = k.towardViewer(P);
const poly = (points) => "M" + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join("L");

// a rounded-rectangle outline in the plane of the +y face, [u0, u1] along x, [z0, z1] up
function faceRect(x0, x1, z0, z1, y, r = 3, steps = 5) {
  const pts = [];
  const corner = (cx, cz, a0) => {
    for (let i = 0; i <= steps; i++) {
      const a = a0 + (i / steps) * (Math.PI / 2);
      pts.push(at([cx + Math.cos(a) * r, y, cz + Math.sin(a) * r]));
    }
  };
  corner(x1 - r, z1 - r, 0);
  corner(x0 + r, z1 - r, Math.PI / 2);
  corner(x0 + r, z0 + r, Math.PI);
  corner(x1 - r, z0 + r, Math.PI * 1.5);
  return poly(pts) + "Z";
}

// ---- bench -----------------------------------------------------------------
function bench() {
  const out = [`<path class="iso-halo" d="${k.haloOf(BENCH, -BENCH_H - FOOT_H, BENCH_H, P)}"/>`];
  for (const [x, y] of byDepth(k.corners(BENCH, 24))) {
    out.push(S(k.cylinder(x, y, 7, -BENCH_H - FOOT_H, 1.6, P, 28), { tone: "lo" }));
    out.push(S(k.cylinder(x, y, 5.4, -BENCH_H - FOOT_H + 1.6, FOOT_H - 1.6, P, 28), { tone: "mid" }));
  }
  out.push(S(k.slabOf(BENCH, -BENCH_H, BENCH_H, P, 8, 1.6), { tone: "mid" }));
  out.push(L(k.planOutline(k.insetPlan(BENCH, 5), 0, P), { tone: "lo" }));
  const screws = k.corners(BENCH, 10);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 2.2, 0, P, 16)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, 0])), { size: 0.5 }));
  // ruler strip along the front edge
  const strip = { x: -146, y: BENCH.y + BENCH.d - 15, w: 356, d: 7, r: 1 };
  out.push(S(k.slabOf(strip, 0, 0.6, P, 3), { tone: "lo", crease: "none" }));
  const ticks = k.topTicks(strip.x + 4, strip.x + strip.w - 4, 4, 5, strip.y + 0.8, 0.6, [2, 3.6], P);
  out.push(L(ticks.minor, { tone: "lo" }), L(ticks.major, { tone: "mid" }));
  out.push(D([at([strip.x + 2, strip.y + 3.5, 0.6]), at([strip.x + strip.w - 2, strip.y + 3.5, 0.6])], { size: 0.45 }));
  // label plate
  const label = { x: -200, y: BENCH.y + BENCH.d - 16, w: 46, d: 9, r: 2 }; // in line with the ruler strip, clear of it
  out.push(S(k.slabOf(label, 0, 0.8, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.planOutline(k.insetPlan(label, 1.6), 0.8, P), { tone: "faint" }));
  out.push(k.faceTextSvg(k.topMatrix([label.x + 5, label.y + 5.6], 0.8, P, "x"), "TUBE AMP · AN-004", { size: 3.2, tone: "lo" }));
  out.push(D([at([label.x + 2.6, label.y + 2.6, 0.8]), at([label.x + label.w - 2.6, label.y + label.d - 2.6, 0.8])], { size: 0.4 }));
  return out.join("");
}

// ---- chassis ---------------------------------------------------------------
function chassis() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(CHASSIS, 0, DECK, P)}" style="filter:blur(5px)"/>`);
  for (const [x, y] of byDepth(k.corners(CHASSIS, 10))) out.push(S(k.cylinder(x, y, 3.6, 0, 1.4, P, 20), { tone: "lo" }));
  out.push(S(k.slabOf(CHASSIS, 1.4, DECK - 1.4, P, 5, 1), { tone: "mid", inner: L(k.sideSeam(CHASSIS, 6, P, 5), { tone: "faint" }) }));
  out.push(L(k.planOutline(k.insetPlan(CHASSIS, 4), DECK, P, 5), { tone: "faint" }));
  const screws = k.corners(CHASSIS, 8);
  out.push(L(screws.map(([x, y]) => k.ring(x, y, 1.8, DECK, P, 14)).join(""), { tone: "lo" }));
  out.push(D(screws.map(([x, y]) => at([x, y, DECK])), { size: 0.45 }));
  // rack ears on the left end, ventilation slots on the deck
  out.push(S(k.slabOf({ x: CHASSIS.x - 4, y: CHASSIS.y + 12, w: 4, d: CHASSIS.d - 24, r: 1 }, 2, DECK - 6, P, 3, 0.4), { tone: "mid" }));
  for (let i = 0; i < 6; i++) {
    out.push(L(k.planOutline({ x: -135 + i * 5, y: 22, w: 2.4, d: 12, r: 1.2 }, DECK, P, 3), { tone: "faint" }));
  }
  return out.join("");
}

// ---- transformers and caps (back row) -----------------------------------
function transformer(plan, h, tone = "mid") {
  const out = [];
  const core = { x: plan.x, y: plan.y, w: plan.w, d: plan.d, r: 1 };
  out.push(S(k.slabOf(core, DECK, 5, P, 2, 0.4), { tone: "lo" })); // base plate
  const topZ = DECK + h - 4;
  const inner = k.insetPlan(core, 2);
  let laminations = "";
  for (let z = DECK + 8; z < topZ; z += 2.5) laminations += L(k.sideSeam(inner, z, P, 2), { tone: "faint" });
  out.push(S(k.slabOf(inner, DECK + 5, h - 9, P, 2, 0.5), { tone, inner: laminations })); // laminated core
  out.push(S(k.slabOf(core, topZ, 4, P, 2, 0.4), { tone: "lo" })); // top clamp plate
  const bolts = [[plan.x + 3.5, plan.y + 3.5], [plan.x + plan.w - 3.5, plan.y + 3.5], [plan.x + 3.5, plan.y + plan.d - 3.5], [plan.x + plan.w - 3.5, plan.y + plan.d - 3.5]];
  out.push(D(bolts.map(([x, y]) => at([x, y, topZ + 4])), { size: 0.5 }));
  out.push(L(bolts.map(([x, y]) => k.ring(x, y, 1.8, topZ + 4, P, 12)).join(""), { tone: "lo" }));
  // rating plate on the face, with its rules and rivets
  const py = plan.y + plan.d - 2;
  const plate = { x: plan.x + plan.w / 2 - 9, y: py, w: 18, d: 0.7, r: 0 };
  out.push(S(k.slabOf(plate, DECK + 9, 8, P, 1), { tone: "lo", crease: "none" }));
  [[1, 12], [2.6, 9], [4.2, 11]].forEach(([dz, len]) => out.push(L(k.segment([plate.x + 3, py + 0.7, DECK + 9 + dz + 1.4], [plate.x + 3 + len, py + 0.7, DECK + 9 + dz + 1.4], P), { tone: "faint", free: true })));
  out.push(D([at([plate.x + 1.2, py + 0.7, DECK + 16]), at([plate.x + plate.w - 1.2, py + 0.7, DECK + 16])], { size: 0.4 }));
  // terminal strip with its lugs on the deck in front
  const strip = { x: plan.x + 4, y: plan.y + plan.d + 1.2, w: plan.w - 8, d: 4, r: 1 };
  out.push(S(k.slabOf(strip, DECK, 2.2, P, 2, 0.3), { tone: "lo" }));
  const lugs = [];
  for (let x = strip.x + 4; x < strip.x + strip.w - 2; x += 6) lugs.push(at([x, strip.y + 2, DECK + 2.2]));
  out.push(D(lugs, { size: 0.7, tone: "hi" }));
  out.push(L(k.lineOnTop([strip.x + 1.5, strip.y + 2], [strip.x + strip.w - 1.5, strip.y + 2], DECK + 2.2, P), { tone: "faint" }));
  return out.join("");
}

function can(x, y, r, h) {
  const out = [];
  out.push(S(k.cylinder(x, y, r + 1.4, DECK, 2, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(x, y, r, DECK + 2, h, P, 28, 0.5), { tone: "hi", crease: "lo" }));
  out.push(L(k.sideArc(x, y, r, DECK + 5, P, 20), { tone: "faint" }));
  out.push(L(k.ring(x, y, r - 1.6, DECK + 2 + h, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(x - 2.2, y, 1.1, DECK + 2 + h, 2.2, P, 12), { tone: "mid" }));
  out.push(S(k.cylinder(x + 2.2, y, 1.1, DECK + 2 + h, 2.2, P, 12), { tone: "mid" }));
  return out.join("");
}

// ---- tubes -----------------------------------------------------------------
const TUBES = [
  { id: "v1", x: -150, y: 8, r: 7, h: 30, stage: 0, kind: "preamp" },
  { id: "v2", x: -112, y: 8, r: 7, h: 30, stage: 1, kind: "preamp" },
  { id: "v3", x: -62, y: 8, r: 11, h: 42, stage: 2, kind: "power" },
  { id: "v4", x: -20, y: 8, r: 11, h: 42, stage: 2, kind: "power" },
];

// points on the glass silhouette, which are the two floor points square to the view
const side = [-Math.sin((AZIMUTH * Math.PI) / 180), Math.cos((AZIMUTH * Math.PI) / 180)];

function tubeStatic(t) {
  const { x, y, r, h } = t;
  const z0 = DECK;
  const zg = z0 + 9; // glass starts
  const zt = zg + h; // top of the straight glass
  const dome = r * 0.95;
  const out = [];
  const stage = [];
  // socket, base, pins
  out.push(S(k.cylinder(x, y, r + 3, z0, 2.4, P, 36), { tone: "lo" }));
  out.push(L(k.ring(x, y, r + 1.4, z0 + 2.4, P, 28), { tone: "faint" }));
  out.push(S(k.cylinder(x, y, r + 0.6, z0 + 2.4, 6.6, P, 32, 0.4), { tone: "mid" }));
  out.push(L(k.sideArc(x, y, r + 0.6, z0 + 5, P, 20), { tone: "faint" }));
  out.push(L(k.knurl(x, y, r + 0.6, z0 + 2.4, z0 + 9, 22, P, 0.4), { tone: "lo" }));
  // plate: the back half of the sleeve, so you look into the tube
  const rp = r * 0.62;
  const plateZ = zg + 2;
  const plateH = h * 0.7;
  const a0 = ((AZIMUTH + 90) * Math.PI) / 180;
  const ring = [];
  for (let i = 0; i <= 14; i++) {
    const a = a0 + (i / 14) * Math.PI;
    ring.push([x + Math.cos(a) * rp, y + Math.sin(a) * rp]);
  }
  for (let i = 14; i >= 0; i--) {
    const a = a0 + (i / 14) * Math.PI;
    ring.push([x + Math.cos(a) * (rp - 0.7), y + Math.sin(a) * (rp - 0.7)]);
  }
  out.push(S(k.extrude(ring, plateZ, plateH, P, { convex: false }), { tone: "mid", crease: "lo" }));
  // cathode with its heater glow, and the grid
  out.push(S(k.cylinder(x, y, 1.5, zg + 1, h * 0.8, P, 14), { tone: "hi", crease: "none" }));
  const rg = rp * 0.6;
  const grid = [];
  for (let i = 0; i < 6; i++) grid.push(k.ring(x, y, rg, plateZ + 3 + i * ((plateH - 6) / 5), P, 18));
  out.push(L(grid.join(""), { tone: "lo" }));
  for (const a of [Math.PI * 0.25, Math.PI * 1.25]) out.push(L(k.segment([x + Math.cos(a) * rg, y + Math.sin(a) * rg, plateZ + 3], [x + Math.cos(a) * rg, y + Math.sin(a) * rg, plateZ + plateH - 3], P), { tone: "mid" }));
  stage.push(rp, plateZ, plateH, rg);
  // glass: only its outline, a bulb of lines you can see through
  const glass = [];
  const L1 = [x + side[0] * r, y + side[1] * r];
  const L2 = [x - side[0] * r, y - side[1] * r];
  glass.push(k.segment([L1[0], L1[1], zg], [L1[0], L1[1], zt], P), k.segment([L2[0], L2[1], zg], [L2[0], L2[1], zt], P));
  const arc = [];
  for (let i = 0; i <= 24; i++) {
    const a = (i / 24) * Math.PI;
    arc.push(at([x + side[0] * r * Math.cos(a), y + side[1] * r * Math.cos(a), zt + dome * Math.sin(a)]));
  }
  glass.push(poly(arc));
  glass.push(k.ring(x, y, r, zt, P, 36), k.ring(x, y, r, zg, P, 36));
  out.push(L(glass.join(""), { tone: "mid" }));
  // shine on the glass
  const shine = [];
  for (let i = 0; i <= 10; i++) {
    const a = 0.25 + (i / 10) * 1.0;
    shine.push(at([x + side[0] * r * 0.8 * Math.cos(a + 1.9) , y + side[1] * r * 0.8 * Math.cos(a + 1.9), zt + dome * 0.8 * Math.sin(a + 1.9)]));
  }
  // getter flash on the dome
  out.push(D([at([x, y, zt + dome * 0.96])], { size: 0.6 }));
  return { svg: out.join(""), zg, zt, rp, plateZ, plateH, rg };
}

// ---- controls (front strip) ---------------------------------------------
const KNOBS = [
  { id: "gain", x: -150, y: 36, fixed: null },
  { id: "bass", x: -118, y: 36, fixed: 0.55 },
  { id: "mid", x: -86, y: 36, fixed: 0.5 },
  { id: "treble", x: -54, y: 36, fixed: 0.62 },
  { id: "master", x: -22, y: 36, fixed: null },
];
const KNOB_R = 6;
const KNOB_H = 8;
const knobTop = DECK + 2 + KNOB_H;
const SWEEP = (270 * Math.PI) / 180;
const knobAngle = (share) => -SWEEP / 2 + share * SWEEP;
const pointerAt = (kx, ky, share) => {
  const a = knobAngle(share);
  const s = Math.sin(a), c = -Math.cos(a);
  return k.lineOnTop([kx + s * 1, ky + c * 1], [kx + s * KNOB_R, ky + c * KNOB_R], knobTop, P);
};

function knob(n) {
  const out = [];
  // printed scale, a band between two rings with ticks
  out.push(S(k.slabOf({ x: n.x - 11, y: n.y - 11, w: 22, d: 22, r: 4 }, DECK, 0.6, P, 4), { tone: "lo", crease: "none" }));
  out.push(L(k.ring(n.x, n.y, 10, DECK + 0.6, P, 48), { tone: "lo" }));
  out.push(L(k.ring(n.x, n.y, 8.4, DECK + 0.6, P, 48), { tone: "lo" }));
  const t = k.radialTicks(n.x, n.y, 10, 10, 5, DECK + 0.6, [1.6, 1.6], P, -SWEEP / 2, SWEEP);
  out.push(L(t.minor, { tone: "lo" }), L(t.major, { tone: "mid" }));
  out.push(S(k.cylinder(n.x, n.y, KNOB_R + 1, DECK + 0.6, 1.4, P, 32), { tone: "lo" }));
  out.push(S(k.cylinder(n.x, n.y, KNOB_R, DECK + 2, KNOB_H, P, 36, 0.6), { tone: "hi", crease: "lo" }));
  out.push(L(k.knurl(n.x, n.y, KNOB_R, DECK + 2, DECK + 2 + KNOB_H - 2.6, 30, P), { tone: "lo" }));
  out.push(L(k.sideArc(n.x, n.y, KNOB_R, DECK + 2 + KNOB_H - 2.6, P, 24), { tone: "faint" }));
  out.push(L(k.ring(n.x, n.y, KNOB_R - 1.4, knobTop, P, 28), { tone: "faint" }));
  const share = n.fixed ?? (n.id === "gain" ? 0.5 : 0.6);
  out.push(`<path data-part="ptr-${n.id}" class="iso-line" data-tone="${n.fixed === null ? "amber" : "hi"}" style="stroke-width:1.1" d="${pointerAt(n.x, n.y, share)}"/>`);
  out.push(D([at([n.x, n.y, knobTop])], { size: 0.5, tone: "hi" }));
  return out.join("");
}

// ---- cabinet and speaker --------------------------------------------------
const F = G.frameAlong([SPK[0], FACE_Y, SPK_Z], [0, 1, 0]); // s runs out of the baffle
const R_FRAME = 37;
const R_HOLE = 31;

function cabinet() {
  const out = [];
  out.push(`<path class="iso-halo" d="${k.haloOf(CAB, 0, CAB_H, P)}" style="filter:blur(6px)"/>`);
  for (const [x, y] of byDepth(k.corners(CAB, 12))) out.push(S(k.cylinder(x, y, 4.4, 0, 2, P, 20), { tone: "lo" }));
  const seam = L(k.sideSeam(CAB, 85, P, 4), { tone: "faint" }) + L(k.sideSeam(CAB, 80, P, 4), { tone: "faint" }) + L(k.sideSeam(CAB, 8, P, 4), { tone: "faint" });
  out.push(S(k.slabOf(CAB, 2, CAB_H - 2, P, 4, 1.2), { tone: "mid", inner: seam }));
  out.push(L(k.planOutline(k.insetPlan(CAB, 4), CAB_H, P, 4), { tone: "faint" }));
  // corner protectors on the top edge
  for (const [x, y] of byDepth(k.corners(CAB, 0), (p) => p)) {
    const px = x === CAB.x ? x : x - 7, py = y === CAB.y ? y : y - 7;
    out.push(S(k.slabOf({ x: px, y: py, w: 7, d: 7, r: 1.4 }, CAB_H - 8, 8.6, P, 2, 0.4), { tone: "lo" }));
  }
  // handle on top
  const hx = CAB.x + CAB.w / 2;
  for (const dx of [-16, 16]) out.push(S(k.cylinder(hx + dx, -2, 2.4, CAB_H, 5, P, 14), { tone: "lo" }));
  out.push(S(k.slabOf({ x: hx - 18, y: -4, w: 36, d: 4, r: 1.6 }, CAB_H + 5, 3.4, P, 3, 0.4), { tone: "mid" }));
  // grille cloth: a recessed panel on the baffle, perforated
  const gx0 = CAB.x + 9, gx1 = CAB.x + CAB.w - 9, gz0 = 12, gz1 = CAB_H - 12;
  out.push(L(faceRect(gx0, gx1, gz0, gz1, FACE_Y, 4), { tone: "faint" }));
  out.push(L(faceRect(gx0 + 2.4, gx1 - 2.4, gz0 + 2.4, gz1 - 2.4, FACE_Y, 2.4), { tone: "lo" }));
  const dots = [];
  for (let x = gx0 + 7; x <= gx1 - 6; x += 5.2) {
    for (let z = gz0 + 6; z <= gz1 - 5; z += 5.2) {
      if (Math.hypot(x - SPK[0], z - SPK_Z) > R_FRAME + 4) dots.push(at([x, FACE_Y, z]));
    }
  }
  out.push(D(dots, { size: 0.32, tone: "lo" }));
  // badge plate with its rules, and a jack plate with a recessed socket
  const badge = { x: CAB.x + CAB.w - 30, y: FACE_Y, w: 22, d: 0.8, r: 0 };
  out.push(S(k.slabOf(badge, 3, 5, P, 1), { tone: "lo", crease: "none" }));
  [[3, 14], [1.8, 10]].forEach(([dz, len]) => out.push(L(k.segment([badge.x + 4, FACE_Y + 0.8, 3 + dz + 0.6], [badge.x + 4 + len, FACE_Y + 0.8, 3 + dz + 0.6], P), { tone: "faint", free: true })));
  out.push(D([at([badge.x + 1.5, FACE_Y + 0.8, 4.2]), at([badge.x + badge.w - 1.5, FACE_Y + 0.8, 4.2])], { size: 0.4 }));
  out.push(S(G.disc(0, 1.2, 6.4, JACK_F, P, { steps: 28 }), { tone: "lo" }));
  out.push(L(G.circleOf(JACK_F, 1.2, 4.6, P, 24), { tone: "faint" }));
  // vent slots on the top, closed outlines
  for (let i = 0; i < 6; i++) out.push(L(k.planOutline({ x: CAB.x + 14 + i * 6, y: CAB.y + 12, w: 2.6, d: 22, r: 1.3 }, CAB_H, P, 3), { tone: "faint" }));
  return out.join("");
}

const JACK_F = G.frameAlong([CAB.x + 16, FACE_Y, 14], [0, 1, 0]);
const OUT_F = G.frameAlong([CHASSIS.x + CHASSIS.w, 22, 8], [1, 0, 0]);
const PLUG_END = 8; // how far the plug stands out of the cabinet jack

function speakerCable() {
  const out = [];
  out.push(S(G.disc(0, 2.4, 4.6, OUT_F, P, { steps: 24 }), { tone: "lo" }));
  out.push(S(G.disc(2.4, 7, 2.9, OUT_F, P, { steps: 20 }), { tone: "hi", crease: "none" }));
  const start = G.pointOf(OUT_F, 7, 0, 0);
  const end = G.pointOf(JACK_F, PLUG_END, 0, 0);
  out.push(S(G.disc(1.2, PLUG_END, 2.9, JACK_F, P, { steps: 20 }), { tone: "hi", crease: "none" }));
  const route = G.fillet([start, [start[0] + 14, start[1], start[2] - 3], [CAB.x - 12, 40, 2.4], [CAB.x + 12, 60, 2.4], [CAB.x + 16, 60, 14], [end[0], end[1] + 0, end[2]]].map((p, i, a) => (i === 0 ? p : p)), 7, 8, { P, tube: 1.4 });
  for (const piece of T.tubePieces(route, 1.4, P, { maxLength: 400, caps: false })) out.push(T.tubeSvg(piece, { tone: "mid" }));
  return out.join("");
}

function speakerWell() {
  return S(G.disc(0, 0.6, R_HOLE, F, P, { steps: 40 }), { tone: "faint", crease: "none" }); // the well the cone sinks into
}

function speakerStatic() {
  const out = [];
  out.push(S(G.ringBand(0, 2.6, R_FRAME - 6, R_FRAME, F, P), { tone: "mid" })); // basket rim
  out.push(S(G.ringBand(2.6, 4.4, R_HOLE - 1, R_FRAME - 6, F, P), { tone: "lo" })); // surround roll
  const bolts = G.dotsOf(F, 2.6, R_FRAME - 3, 8, P, { all: true });
  out.push(D(bolts, { size: 0.55, tone: "hi" }));
  return out.join("");
}

function cone() {
  const out = [];
  // recessed cone: an open surface sinking from the surround (s 4.4) to the voice coil (s -7)
  const profile = [[-7, 9], [-5.6, 11, 1], [-2.5, 17, 1], [1, 24, 1], [4.4, 29]];
  out.push(S(G.bandOfProfile(profile, F, P), { tone: "hi", crease: "none" }));
  out.push(L([14, 20, 26].map((r) => G.circleOf(F, -7 + (r - 9) * 0.57, r, P, 40)).join(""), { tone: "faint" }));
  // dust cap: a shallow dome seated on the voice-coil end
  const dome = [[-7, 9]].concat([8.2, 6.4, 4, 0].map((r) => [-7 + 5 * (1 - (r / 9) ** 2), r, 1]));
  out.push(S(G.solidOf(dome, F, P), { tone: "hi", lit: true, crease: "none" }));
  out.push(L(G.circleOf(F, -7, 9, P, 32), { tone: "lo" }));
  return out.join("");
}

// ---- wiring --------------------------------------------------------------
const lane = (pts, extra = {}) => k.wireSvg(at(pts[0]), at(pts[pts.length - 1]), { via: pts.slice(1, -1).map(at), tone: "amber", flow: true, size: 1, ...extra });
const Z = DECK + 0.3;
function wiring() {
  const out = [];
  // input -> V1 -> pot -> V2 -> tone -> power tubes: laid on the deck beside the tubes
  out.push(lane([[-182, 36, Z], [-182, 24, Z], [-150, 24, Z], [-150, 17, Z]]));
  out.push(lane([[-143, 8, Z], [-130, 8, Z], [-130, 24, Z], [-86, 24, Z], [-86, 29, Z]]));
  out.push(lane([[-54, 29, Z], [-54, 24, Z], [-62, 22, Z], [-62, 19, Z]]));
  // tone stack taps, master to the second power tube, power tubes to the output transformer
  out.push(lane([[-118, 29, Z], [-118, 24, Z]]));
  out.push(lane([[-22, 29, Z], [-22, 24, Z], [-20, 22, Z], [-20, 19, Z]]));
  out.push(lane([[-62, -3, Z], [-62, -9, Z], [-30, -9, Z], [-30, -13, Z]]));
  out.push(lane([[-20, -3, Z], [-20, -9, Z], [-12, -9, Z], [-12, -13, Z]]));
  return out.join("");
}

// ---- assemble ------------------------------------------------------------
const tubeParts = TUBES.map((t) => ({ t, ...tubeStatic(t) }));

const items = [];
items.push({ at: [-165, -37], svg: `<g data-part="xfmr-power">${transformer({ x: -185, y: -50, w: 40, d: 28, r: 1 }, 34)}</g>` });
items.push({ at: [-125, -37], svg: `<g data-part="choke">${transformer({ x: -140, y: -48, w: 28, d: 24, r: 1 }, 24, "mid")}</g>` });
[[-95, -38, 6, 24], [-75, -38, 6, 24], [-55, -38, 6, 24]].forEach(([x, y, r, h]) => items.push({ at: [x, y], svg: `<g data-part="caps">${can(x, y, r, h)}</g>` }));
items.push({ at: [-17, -35], svg: `<g data-part="xfmr-output">${transformer({ x: -37, y: -48, w: 40, d: 30, r: 1 }, 36)}</g>` });
tubeParts.forEach((p) => items.push({ at: [p.t.x, p.t.y], svg: `<g data-part="tube-${p.t.id}">${p.svg}</g>` }));
KNOBS.forEach((n) => items.push({ at: [n.x, n.y - 6], svg: `<g data-part="knob-${n.id}">${knob(n)}</g>` }));

// input jack and power switch, lamp
const jack = (() => {
  const out = [];
  out.push(S(k.cylinder(-182, 36, 6.4, DECK, 1.2, P, 24), { tone: "lo" }));
  out.push(S(k.cylinder(-182, 36, 4.4, DECK + 1.2, 4, P, 24, 0.4), { tone: "mid" }));
  out.push(L(k.ring(-182, 36, 2.2, DECK + 5.2, P, 16), { tone: "lo" }));
  out.push(D([at([-182, 36, DECK + 5.2])], { size: 0.8, tone: "lo" }));
  return out.join("");
})();
items.push({ at: [-182, 36], svg: `<g data-part="jack">${jack}</g>` });
const power = (() => {
  const out = [];
  out.push(S(k.cylinder(12, 36, 5, DECK, 1.2, P, 22), { tone: "lo" }));
  // a toggle switch: hex nut on a round bushing, and a chrome bat lever with a rounded tip that tips either way
  out.push(S(k.cylinder(12, 36, 3.8, DECK + 1.2, 1.6, P, 6), { tone: "mid" }));
  out.push(S(k.cylinder(12, 36, 2.3, DECK + 2.8, 2.4, P, 18), { tone: "mid" }));
  const pivot = [12, 36, DECK + 5.2];
  const bat = (tip) => {
    const o = [];
    for (const piece of T.tubePieces([pivot, tip], 1.2, P, { maxLength: 400, caps: false })) o.push(T.tubeSvg(piece, { tone: "mid" }));
    o.push(S(G.sphereOf(tip, 1.55, P), { tone: "mid" }));
    return o.join("");
  };
  out.push(`<g data-part="lever" data-pos="on">${bat([12, 32.3, DECK + 9.4])}</g>`);
  out.push(`<g data-part="lever" data-pos="off" style="display:none">${bat([12, 39.7, DECK + 9.4])}</g>`);
  const [hx, hy] = at([12, 36, DECK + 3]);
  out.push(`<circle class="iso-hit" cx="${hx.toFixed(1)}" cy="${hy.toFixed(1)}" r="12"/>`);
  return `<g data-part="power" role="button" tabindex="0" aria-label="Power" aria-pressed="true">${out.join("")}</g>`;
})();
items.push({ at: [12, 36], svg: power });
const lamp = (() => {
  const out = [];
  out.push(S(k.cylinder(26, 36, 3.8, DECK, 1.2, P, 20), { tone: "lo" }));
  out.push(S(G.sphereOf([26, 36, DECK + 1.6], 2.8, P), { tone: "mid" }));
  // pilot lamp: red glass over the bulb, and its light on the deck
  const [lx, ly] = at([26, 36, DECK + 3.4]);
  const [px, py] = at([26, 36, DECK + 0.4]);
  out.push(`<ellipse class="iso-lamp-halo" cx="${px.toFixed(1)}" cy="${py.toFixed(1)}" rx="11" ry="6"/>`);
  out.push(`<circle class="iso-lamp" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="2.1"/>`);
  out.push(`<circle class="iso-hit" cx="${lx.toFixed(1)}" cy="${ly.toFixed(1)}" r="9"/>`);
  return `<g data-part="power">${out.join("")}</g>`;
})();
items.push({ at: [26, 36], svg: lamp });

const ordered = items.sort((a, b) => depth(...a.at) - depth(...b.at)).map((i) => i.svg);

// ---- coming apart ----------------------------------------------------------
// One spring per assembly (0 = assembled, 1 = apart). Each moves along its own way out: tubes lift out of their
// sockets, transformers and cans rise and lean back, knobs and switches lift forward, the cone and its basket pull out
// of the cabinet. Opening runs in this order, 50 ms apart; closing runs it backwards. Nothing sits above anything else,
// so no assembly passes through another, and the cable, which stays with the chassis and the cabinet, keeps its ends.
const PIECES = [
  { id: "cone", move: [0, 58, 0] },
  { id: "speaker", sel: '[data-part="speaker"]', move: [0, 26, 0] },
  { id: "xfmr-output", sel: '[data-part="xfmr-output"]', move: [35, -10, 54] },
  { id: "tube-v4", sel: '[data-part="tube-v4"]', move: [30, 8, 61] },
  { id: "tube-v3", sel: '[data-part="tube-v3"]', move: [10, 8, 49] },
  { id: "knob-master", sel: '[data-part="knob-master"]', move: [0, 12, 27] },
  { id: "caps", sel: '[data-part="caps"]', move: [10, -10, 45] },
  { id: "power", sel: '[data-part="power"]', move: [0, 10, 23] },
  { id: "knob-treble", sel: '[data-part="knob-treble"]', move: [0, 12, 36] },
  { id: "knob-mid", sel: '[data-part="knob-mid"]', move: [0, 12, 27] },
  { id: "tube-v2", sel: '[data-part="tube-v2"]', move: [-10, 8, 61] },
  { id: "knob-bass", sel: '[data-part="knob-bass"]', move: [0, 12, 36] },
  { id: "tube-v1", sel: '[data-part="tube-v1"]', move: [-30, 8, 49] },
  { id: "knob-gain", sel: '[data-part="knob-gain"]', move: [0, 12, 27] },
  { id: "choke", sel: '[data-part="choke"]', move: [-15, -10, 67] },
  { id: "xfmr-power", sel: '[data-part="xfmr-power"]', move: [-40, -10, 50] },
  { id: "jack", sel: '[data-part="jack"]', move: [0, 10, 23] },
];

// ---- labels --------------------------------------------------------------
// One per part. `at` is a world point on the part as assembled; the label sits where the part ends up when apart
// (`at` plus its move), with the text offset by (dx, dy) on screen. Parts that never move (chassis, cabinet, cable)
// carry no piece and appear once everything has come to rest.
const T0 = DECK + 4;
const LABELS = [
  { piece: "cone", text: "Speaker cone", at: [178, 44, 44], dx: 6, dy: 46, side: "middle" },
  { piece: "speaker", text: "Speaker basket", at: [178 + 24, 46, 44 + 28], dx: 26, dy: -26, side: "start" },
  { piece: "xfmr-output", text: "Output transformer", at: [-17, -33, DECK + 36], dx: 28, dy: -22, side: "start" },
  { piece: "tube-v4", text: "Power tube V4", at: [-20, 8, DECK + 3], dx: 6, dy: 42, side: "middle" },
  { piece: "tube-v3", text: "Power tube V3", at: [-62, 8, DECK + 3], dx: 24, dy: 24, side: "middle" },
  { piece: "knob-master", text: "Master knob", at: [-22, 36, knobTop], dx: 4, dy: 26, side: "middle" },
  { piece: "caps", text: "Filter capacitors", at: [-75, -38, DECK + 24], dx: 4, dy: -42, side: "middle" },
  { piece: "power", text: "Power switch and lamp", at: [19, 36, DECK + 5], dx: 12, dy: 24, side: "middle" },
  { piece: "knob-treble", text: "Treble knob", at: [-54, 36, knobTop], dx: -12, dy: 38, side: "middle" },
  { piece: "knob-mid", text: "Mid knob", at: [-86, 36, knobTop], dx: 0, dy: 26, side: "middle" },
  { piece: "tube-v2", text: "Preamp tube V2", at: [-112, 8, DECK + 3], dx: 0, dy: 28, side: "middle" },
  { piece: "knob-bass", text: "Bass knob", at: [-118, 36, knobTop], dx: 0, dy: 40, side: "middle" },
  { piece: "tube-v1", text: "Preamp tube V1", at: [-150, 8, T0 + 30], dx: -22, dy: -6, side: "end" },
  { piece: "knob-gain", text: "Gain knob", at: [-150, 36, knobTop], dx: 0, dy: 26, side: "middle" },
  { piece: "choke", text: "Choke", at: [-126, -36, DECK + 24], dx: 8, dy: -26, side: "start" },
  { piece: "xfmr-power", text: "Power transformer", at: [-165, -36, DECK + 34], dx: -14, dy: -22, side: "end" },
  { piece: "jack", text: "Input jack", at: [-182, 36, DECK + 5], dx: -4, dy: -2, side: "end" },
  { piece: null, text: "Chassis", at: [-120, 46, DECK], dx: -6, dy: 34, side: "middle" },
  { piece: null, text: "Speaker cable", at: [CAB.x - 10, 50, 2.4], dx: -10, dy: 34, side: "end" },
  { piece: null, text: "Cabinet", at: [CAB.x + CAB.w - 6, FACE_Y, 20], dx: 20, dy: 26, side: "start" },
].map((l) => {
  const pc = PIECES.find((p) => p.id === l.piece);
  const [ax, ay] = at(l.at.map((v, i) => v + (pc ? pc.move[i] : 0)));
  return { piece: l.piece, text: l.text, ax: +ax.toFixed(1), ay: +ay.toFixed(1), tx: +(ax + l.dx).toFixed(1), ty: +(ay + l.dy).toFixed(1), side: l.side };
});

const labelText = "A tube guitar amplifier on a bench, opened up. A guitar enters the input jack at the left, passes two small preamp tubes with the gain control between them, a three-band tone stack, then two large power tubes, the output transformer and finally the loudspeaker.";

const svg = k.figureSvg({
  width: WIDTH,
  height: HEIGHT,
  label: labelText,
  body: [
    bench(),
    chassis(),
    ordered.join(""),
    `<g data-part="wiring">${wiring()}</g>`,
    `<g data-part="cabinet">${cabinet()}</g>`,
    `<g data-part="well">${speakerWell()}</g>`,
    `<g data-part="speaker">${speakerStatic()}</g>`,
    `<g data-part="cable">${speakerCable()}</g>`,
    `<g data-part="cone" transform="${k.translateAlong(P, [0, 0, 0])}">${cone()}</g>`,
  ],
});

// px per world unit across the view and up it, to size the glow ellipses
const KX = Math.abs(at(side.concat(0))[0] - at([0, 0, 0])[0]);
const KZ = at([0, 0, 0])[1] - at([0, 0, 1])[1];
const ell = (c, rx, ry) => ({ cx: +c[0].toFixed(1), cy: +c[1].toFixed(1), rx: +rx.toFixed(1), ry: +ry.toFixed(1) });
const TUBE_DATA = tubeParts.map((p) => {
  const { x, y, r, h } = p.t;
  const mid = at([x, y, p.zg + 1 + h * 0.42]);
  return {
    id: p.t.id, x, y, stage: p.t.stage, rc: 1.5, rp: p.rp, plateZ: p.plateZ, plateH: p.plateH, top: p.zg + 1 + h * 0.8, zg: p.zg,
    bloom: ell(mid, r * 0.95 * KX, h * 0.46 * KZ),
    core: ell(mid, 1.7 * KX, h * 0.38 * KZ),
    pool: ell(at([x, y, DECK + 0.4]), (r + 5) * KX, (r + 5) * KX * 0.62),
  };
});

const live = `
const P = ${JSON.stringify(P)};
const PIECES = ${JSON.stringify(PIECES)};
const LABELS = ${JSON.stringify(LABELS)};
const TUBES = ${JSON.stringify(TUBE_DATA)};
const KNOB = { x: ${JSON.stringify(Object.fromEntries(KNOBS.filter((n) => n.fixed === null).map((n) => [n.id, [n.x, n.y]])))}, r: ${KNOB_R}, top: ${knobTop}, sweep: ${SWEEP} };
const AMP = {
  IN: ${amp.IN_PEAK}, V1: ${JSON.stringify(amp.V1)}, V2: ${JSON.stringify(amp.V2)}, TONE: ${amp.TONE}, POWER: ${JSON.stringify(amp.POWER)}, N: ${amp.SAMPLES},
};
const taper = ${amp.taper.toString()};
const stageOf = (x, s) => s.sat * Math.tanh((s.g * x) / s.sat);
${amp.chain.toString().replace(/\bIN_PEAK\b/g, "AMP.IN").replace(/\bV1\b/g, "AMP.V1").replace(/\bV2\b/g, "AMP.V2").replace(/\bTONE\b/g, "AMP.TONE").replace(/\bPOWER\b/g, "AMP.POWER").replace(/\btube\(/g, "stageOf(")}
${amp.measure.toString().replace(/\bSAMPLES\b/g, "AMP.N")}
${amp.heat.toString().replace(/^export /, "").replace("function heat", "function heatOf")}
const readoutOf = ${amp.readoutOf.toString()};
const stage = document.querySelector(".iso-stage");
const svg = stage.querySelector("svg");
const readout = document.querySelector("[data-readout]");
const still = matchMedia("(prefers-reduced-motion: reduce)");
const ptr = (id) => svg.querySelector('[data-part="ptr-' + id + '"]');
const cone = svg.querySelector('[data-part="cone"]');
const SVGNS = "http://www.w3.org/2000/svg";
const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));

// electrons: dots that cross from the cathode to the plate, built once per tube
const ELECTRONS = TUBES.map((t, ti) => {
  const group = document.createElementNS(SVGNS, "g");
  group.setAttribute("class", "iso-dots");
  group.setAttribute("data-tone", "lit");
  const dots = [];
  for (let i = 0; i < 12; i++) {
    const c = document.createElementNS(SVGNS, "circle");
    c.setAttribute("r", "0.5");
    group.appendChild(c);
    dots.push({ el: c, angle: (i / 12) * Math.PI * 2 + ti, offset: (i * 0.37 + ti * 0.11) % 1 });
  }
  svg.querySelector('[data-part="tube-' + t.id + '"]').appendChild(group);
  const glow = document.createElementNS(SVGNS, "path");
  glow.setAttribute("class", "iso-line");
  glow.setAttribute("data-tone", "lit");
  glow.setAttribute("data-free", "");
  glow.setAttribute("style", "stroke-width:1.1");
  glow.setAttribute("d", segment([t.x, t.y, t.zg + 1], [t.x, t.y, t.top], P));
  svg.querySelector('[data-part="tube-' + t.id + '"]').appendChild(glow);
  const mk = (cls, e, first) => {
    const el = document.createElementNS(SVGNS, "ellipse");
    el.setAttribute("class", cls);
    el.setAttribute("cx", e.cx); el.setAttribute("cy", e.cy); el.setAttribute("rx", e.rx); el.setAttribute("ry", e.ry);
    const g = svg.querySelector('[data-part="tube-' + t.id + '"]');
    if (first) g.insertBefore(el, g.firstChild); else g.appendChild(el);
    return el;
  };
  // the pool of light on the deck sits under the tube, the bloom and hot core inside the glass
  const pool = mk("iso-pool", t.pool, true);
  const bloom = mk("iso-bloom", t.bloom, false);
  const core = mk("iso-core", t.core, false);
  return { t, dots, glow, pool, bloom, core, heat: 0.3 };
});

let gain = 3, target = 3, master = 6, phase = 0, clock = 0;
let frame = 0, last = 0, visible = false, touring = true, idleTimer = 0, text = "";
const tourAt = (t) => 5 + 4 * Math.sin(t * 0.33 - 1.2);
const pointerPath = (id, share) => {
  const [x, y] = KNOB.x[id];
  const a = -KNOB.sweep / 2 + share * KNOB.sweep;
  const s = Math.sin(a), c = -Math.cos(a);
  return lineOnTop([x + s, y + c], [x + s * KNOB.r, y + c * KNOB.r], KNOB.top, P);
};

// power: the switch and lamp. pw eases 0..1 so the cone settles and the glass cools.
let on = true, pw = 1;

// ---- coming apart ----
const wiringEl = svg.querySelector('[data-part="wiring"]');
const apart = PIECES.map((p, i) => ({ ...p, els: p.id === "cone" ? [] : [...svg.querySelectorAll(p.sel)], x: 0, v: 0, target: 0, pending: null, i }));
const apartBy = Object.fromEntries(apart.map((p) => [p.id, p]));
let isApart = false, apartClock = 0, spread = 0;
const explodeBtn = document.querySelector("[data-explode]");
function setApart(next) {
  isApart = next;
  const order = next ? apart : [...apart].reverse();
  order.forEach((p, i) => { p.pending = { value: next ? 1 : 0, at: apartClock + i * 0.05 }; });
  if (still.matches) apart.forEach((p) => { p.x = p.target = p.pending.value; p.v = 0; p.pending = null; });
  if (explodeBtn) { explodeBtn.setAttribute("aria-pressed", String(next)); explodeBtn.textContent = next ? "Assemble" : "Explode"; }
  run();
  draw(0);
}
// labels: a leader and a name per part, built once; they fade in only after their part has stopped
const labelLayer = document.createElementNS(SVGNS, "g");
labelLayer.setAttribute("class", "amp-labels");
labelLayer.setAttribute("aria-hidden", "true");
const labels = LABELS.map((l) => {
  const g = document.createElementNS(SVGNS, "g");
  g.style.opacity = "0";
  const line = document.createElementNS(SVGNS, "path");
  const back = l.side === "start" ? 2 : l.side === "end" ? -2 : 0;
  line.setAttribute("d", "M" + l.ax + " " + l.ay + "L" + (l.tx + back * 0.5) + " " + (l.ty - 3));
  const dot = document.createElementNS(SVGNS, "circle");
  dot.setAttribute("cx", l.ax); dot.setAttribute("cy", l.ay); dot.setAttribute("r", "1");
  const txt = document.createElementNS(SVGNS, "text");
  txt.setAttribute("x", l.tx + back); txt.setAttribute("y", l.ty + 3);
  txt.setAttribute("text-anchor", l.side);
  txt.textContent = l.text;
  g.append(line, dot, txt);
  labelLayer.appendChild(g);
  return { ...l, g, o: 0, piece: l.piece ? apartBy[l.piece] : null };
});
svg.appendChild(labelLayer);
function fadeLabels(dt) {
  const settled = (p) => p.target === 1 && !p.pending && p.x === 1;
  const allSettled = isApart && apart.every(settled);
  for (const l of labels) {
    const want = l.piece ? settled(l.piece) : allSettled;
    // in over about a third of a second once the part stops, out quickly the moment it starts to go home
    l.o = !dt ? (want ? 1 : 0) : l.o + ((want ? 1 : 0) - l.o) * (1 - Math.exp(-dt / (want ? 0.14 : 0.05)));
    const v = l.o < 0.01 ? 0 : l.o > 0.99 ? 1 : l.o;
    l.g.style.opacity = v.toFixed(2);
  }
}
function stepApart(dt) {
  apartClock += dt;
  const h = dt / 4;
  for (const p of apart) {
    if (p.pending && apartClock >= p.pending.at) { p.target = p.pending.value; p.pending = null; }
    // just under critically damped, so each part settles with a hint of weight
    for (let n = 0; n < 4; n++) { p.v += (64 * (p.target - p.x) - 14.2 * p.v) * h; p.x += p.v * h; }
    if (Math.abs(p.x - p.target) < 0.0004 && Math.abs(p.v) < 0.002) { p.x = p.target; p.v = 0; }
  }
}
function placeApart() {
  let sum = 0;
  for (const p of apart) {
    sum += Math.min(1, Math.max(0, p.x));
    if (p.id === "cone") continue;
    const at = p.x === 0 ? null : translateAlong(P, p.move.map((m) => m * p.x));
    for (const el of p.els) { if (at) el.setAttribute("transform", at); else el.removeAttribute("transform"); }
  }
  spread = sum / apart.length;
  // loose wires and the lamp's light on the deck belong to the assembled amp
  wiringEl.style.opacity = clamp(1 - spread * 1.8, 0, 1).toFixed(2);
  stage.style.setProperty("--apart-fade", clamp(1 - spread * 2.2, 0, 1).toFixed(2));
}
const leverOn = svg.querySelector('[data-pos="on"]');
const leverOff = svg.querySelector('[data-pos="off"]');
const switches = svg.querySelectorAll('[data-part="power"]');
function setPower(next) {
  on = next;
  ELECTRONS.forEach((e, i) => { e.wait = next ? i * 0.1 : 0; });
  stage.toggleAttribute("data-off", !on);
  switches[0].setAttribute("aria-pressed", String(on));
  leverOn.style.display = on ? "" : "none";
  leverOff.style.display = on ? "none" : "";
  run();
  draw(0);
}
switches.forEach((el) => {
  el.addEventListener("click", (e) => { e.stopPropagation(); setPower(!on); });
  el.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); e.stopPropagation(); setPower(!on); } });
  el.addEventListener("pointermove", (e) => e.stopPropagation());
});

function draw(dt) {
  pw += ((on ? 1 : 0) - pw) * (dt ? 1 - Math.exp(-dt / 0.3) : 1);
  const now = chain(phase, gain, master);
  const co = apartBy.cone;
  cone.setAttribute("transform", translateAlong(P, [0, now.cone * 3.2 * pw + co.move[1] * co.x, 0]));
  placeApart();
  fadeLabels(dt);
  ptr("gain").setAttribute("d", pointerPath("gain", gain / 10));
  ptr("master").setAttribute("d", pointerPath("master", master / 10));
  const hot = heatOf(Math.round(gain * 20) / 20, master);
  for (const e of ELECTRONS) {
    const load = now.load[e.t.stage];
    // the glass warms and cools slowly, so the glow lags the signal by about half a second
    e.heat += ((on ? clamp(0.14 + 0.86 * Math.sqrt(hot[e.t.stage]), 0, 1) : 0) - e.heat) * (dt ? 1 - Math.exp(-dt / 0.5) : 1);
    const h = e.heat;
    // each tube starts a hair after the one before it
    e.wait = Math.max(0, (e.wait || 0) - dt);
    const gp = e.gp = (e.gp ?? 1) + (((on && !e.wait) ? 1 : 0) - (e.gp ?? 1)) * (dt ? 1 - Math.exp(-dt / (on ? 0.75 : 0.3)) : still.matches ? 1 : 0);
    e.glow.setAttribute("stroke-opacity", (gp *(0.3 + 0.7 * h)).toFixed(2));
    e.bloom.style.opacity = (gp * (0.08 + 0.62 * h * h)).toFixed(2);
    e.core.style.opacity = (gp * (0.15 + 0.75 * h)).toFixed(2);
    e.pool.style.opacity = (gp * (0.04 + 0.5 * h * h) * clamp(1 - apartBy["tube-" + e.t.id].x * 2, 0, 1)).toFixed(2);
    e.dots.forEach((d) => {
      d.offset = (d.offset + dt * pw * (0.35 + load * 1.6)) % 1;
      const r = e.t.rc + 1 + (e.t.rp - e.t.rc - 1.8) * d.offset;
      const z = e.t.plateZ + 2 + (e.t.plateH - 4) * ((Math.sin(d.angle * 3.1) + 1) / 2);
      const [sx, sy] = iso([e.t.x + Math.cos(d.angle) * r, e.t.y + Math.sin(d.angle) * r, z], P);
      d.el.setAttribute("cx", sx.toFixed(1));
      d.el.setAttribute("cy", sy.toFixed(1));
      d.el.setAttribute("fill-opacity", (Math.sin(d.offset * Math.PI) * (0.25 + 0.75 * Math.min(1, load * 1.4)) * pw).toFixed(2));
    });
  }
  const next = on ? readoutOf(Math.round(gain * 10) / 10, master) : "power off";
  if (next !== text) { text = next; readout.textContent = next; stage.setAttribute("aria-valuenow", String(Math.round(gain))); stage.setAttribute("aria-valuetext", next); }
}

function tick(now) {
  const dt = last ? Math.min((now - last) / 1000, 1 / 30) : 1 / 60;
  last = now;
  const calm = still.matches;
  if (touring && on) { clock += dt; target = tourAt(clock); }
  gain = calm ? target : gain + (target - gain) * (1 - Math.exp(-dt / 0.25));
  if (!calm && on) phase = (phase + dt * 0.45) % 1;
  if (!calm) stepApart(dt);
  draw(calm ? 0 : dt);
  frame = visible && !calm ? requestAnimationFrame(tick) : 0;
}
const run = () => { if (!frame && visible) { last = 0; frame = requestAnimationFrame(tick); } };
const steer = (next) => { touring = false; target = clamp(next, 0, 10); clearTimeout(idleTimer); idleTimer = setTimeout(() => { touring = !still.matches; clock = Math.asin(clamp((target - 5) / 4, -1, 1)) / 0.33 + 3.6; run(); }, 4000); run(); };
new IntersectionObserver((entries) => { visible = entries[entries.length - 1].isIntersecting; if (visible) run(); }, { rootMargin: "120px 0px" }).observe(stage);

// ---- themes ----
document.querySelectorAll("[data-theme-set]").forEach((b) => b.addEventListener("click", () => {
  document.body.setAttribute("data-theme", b.dataset.themeSet);
  document.querySelectorAll("[data-theme-set]").forEach((o) => o.setAttribute("aria-pressed", String(o === b)));
}));

if (explodeBtn) explodeBtn.addEventListener("click", () => setApart(!isApart));
if (still.matches) { touring = false; target = 5; }
stage.addEventListener("pointermove", (e) => { const box = svg.getBoundingClientRect(); steer(clamp(((e.clientX - box.left) / box.width - 0.12) / 0.76, 0, 1) * 10); });
stage.addEventListener("keydown", (e) => {
  const step = { ArrowRight: 0.5, ArrowUp: 0.5, ArrowLeft: -0.5, ArrowDown: -0.5 }[e.key];
  if (step !== undefined) { e.preventDefault(); steer(target + step); }
  if (e.key === " " && e.target === stage) { e.preventDefault(); setApart(!isApart); }
  if (e.key === "PageUp") { master = clamp(master + 1, 0, 10); draw(0); }
  if (e.key === "PageDown") { master = clamp(master - 1, 0, 10); draw(0); }
});
draw(0);
`;

const readout = amp.readoutOf(5, 6);
const body = k.plateHtml({
  fig: "Fig 1",
  title: "Tube guitar amp",
  hint: "Hover for Gain · click the switch for power",
  readout,
  keys: [
    { mark: "lit", label: "Speaker cone and dust cap: the end of the chain" },
    { mark: "raised", label: "Tubes: each stage gains and saturates" },
    { mark: "lit", label: "Amber glow: how hard each tube works" },
  ],
  caption: "A guitar's 0.3 V signal is gained and softly clipped by each tube in turn. Turn Gain up and V2 runs out of headroom first, then the power tubes; their glow follows how hard each stage works, and the speaker cone moves with the flattened wave. V1 stays dim because the gain pot sits after it. Time is slowed about 250×.",
  body: `<div class="iso-stage" tabindex="0" role="slider" aria-label="Tube amp: arrow keys turn Gain" aria-valuemin="0" aria-valuemax="10" aria-valuenow="5">${svg}</div>`,
});

const ui = `<div class="amp-ui" role="toolbar" aria-label="Page controls">${["dark", "light", "blueprint"].map((t) => `<button type="button" data-theme-set="${t}" aria-pressed="${t === theme}">${t}</button>`).join("")}<span class="gap"></span><button type="button" data-explode aria-pressed="false">Explode</button></div>`;
const file = { light: "tube-amp-light.html", blueprint: "tube-amp-blueprint.html", dark: "tube-amp.html" }[theme];
const html = k.pageHtml({ title: "Tube guitar amp", theme, body: ui + body, width: 760, script: kitScript() + live }).replace("</style>", EXTRA_CSS + "</style>");
writeFileSync(join(HERE, file), html);
console.log("wrote", file, svg.length, "bytes");
