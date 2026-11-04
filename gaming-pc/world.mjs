// Drawing helpers on top of the anatomy kit. A "leaf" is one drawn part with a world box; the page sorts leaves.
import { pathToFileURL } from "node:url";

const SKILL = "C:/Users/brand/.claude/skills/anatomy";
export const k = await import(pathToFileURL(`${SKILL}/kit/iso-kit.mjs`).href);
export const G = await import(pathToFileURL(`${SKILL}/kit/lathe.mjs`).href);
export const T = await import(pathToFileURL(`${SKILL}/kit/tube.mjs`).href);

const AX = { x: [1, 0, 0], y: [0, 1, 0], z: [0, 0, 1] };

export function makeWorld(P) {
  const items = [];
  let cur = "case";
  const at = (p) => k.iso(p, P);
  const S = (paths, style) => k.solidSvg(paths, style);
  const L = (d, style) => k.lineSvg(d, style);
  const dots = (pts, style) => (pts.length ? k.dotsSvg(pts.map((p) => (p.length === 3 ? at(p) : p)), style) : "");
  const poly = (pts3, closed = false) => k.pathOf(pts3.map(at), closed);

  // rounded rectangle in a plane, as 3D points; map(u, v) -> [x, y, z]
  const roundRect = (u0, u1, v0, v1, r, map, steps = 4) => {
    const out = [];
    r = Math.max(0, Math.min(r, (u1 - u0) / 2, (v1 - v0) / 2));
    const corner = (cu, cv, a0) => {
      if (!r) { out.push(map(cu, cv)); return; }
      for (let i = 0; i <= steps; i++) {
        const a = a0 + (i / steps) * (Math.PI / 2);
        out.push(map(cu + Math.cos(a) * r, cv + Math.sin(a) * r));
      }
    };
    corner(u1 - r, v1 - r, 0);
    corner(u0 + r, v1 - r, Math.PI / 2);
    corner(u0 + r, v0 + r, Math.PI);
    corner(u1 - r, v0 + r, Math.PI * 1.5);
    return out;
  };
  // outlines on the +x face (u = y, v = z), +y face (u = x, v = z) and a horizontal face (u = x, v = y)
  const faceX = (x, [y0, y1], [z0, z1], r = 2) => poly(roundRect(y0, y1, z0, z1, r, (u, v) => [x, u, v]), true);
  const faceY = (y, [x0, x1], [z0, z1], r = 2) => poly(roundRect(x0, x1, z0, z1, r, (u, v) => [u, y, v]), true);
  const faceZ = (z, [x0, x1], [y0, y1], r = 2) => poly(roundRect(x0, x1, y0, y1, r, (u, v) => [u, v, z]), true);

  const W = { k, G, T, P, items, at, S, L, dots, poly, roundRect, faceX, faceY, faceZ, AX };

  W.use = (id) => { cur = id; };
  W.current = () => cur;
  W.put = (svg, min, max, o = {}) => {
    items.push({ asm: cur, svg, min, max, sub: o.sub || [0, 0, 0], name: o.name || "", part: o.part || "" });
    return items[items.length - 1];
  };

  // a rounded box standing on the floor (z up)
  W.box = (o) => {
    const { x, y, w, d, z, h, r = 1, steps = 3, bevel = 0.4, tone = "mid", lit, crease, inner, deco } = o;
    const plan = { x, y, w, d, r };
    let svg = S(k.slabOf(plan, z, h, P, steps, bevel), { tone, lit, crease, inner: typeof inner === "function" ? inner(plan, z, h) : inner });
    if (deco) svg += typeof deco === "function" ? deco(plan, z + h, z) : deco;
    return W.put(svg, [x, y, z], [x + w, y + d, z + h], o);
  };
  // a round post standing on the floor
  W.cyl = (o) => {
    const { cx, cy, r, z, h, steps = 24, bevel = 0.4, tone = "mid", lit, crease, deco } = o;
    let svg = S(k.cylinder(cx, cy, r, z, h, P, steps, bevel), { tone, lit, crease });
    if (deco) svg += typeof deco === "function" ? deco(z + h) : deco;
    return W.put(svg, [cx - r, cy - r, z], [cx + r, cy + r, z + h], o);
  };
  // a turned disc on any axis; `at` is the point on the axis, s0..s1 along it
  W.disc = (o) => {
    const { at: c, axis = "z", s0, s1, r, tone = "mid", lit, steps, bevel = 0, deco } = o;
    const F = G.frameAlong(c, AX[axis]);
    const dopt = {}; if (steps) dopt.steps = steps; 
    let svg = S(G.disc(s0, s1, r, F, P, dopt), { tone, lit, crease: o.crease });
    if (deco) svg += typeof deco === "function" ? deco(F) : deco;
    const lo = [c[0] - r, c[1] - r, c[2] - r];
    const hi = [c[0] + r, c[1] + r, c[2] + r];
    const i = { x: 0, y: 1, z: 2 }[axis];
    lo[i] = c[i] + Math.min(s0, s1);
    hi[i] = c[i] + Math.max(s0, s1);
    return W.put(svg, lo, hi, o);
  };
  // a pipe or cable: one leaf per piece
  W.tube = (pts, r, o = {}) => {
    const { tone = "hi", maxLength = 16, gaps, caps, breaks } = o;
    const pieces = T.tubePieces(pts, r, P, { maxLength, gaps, caps, breaks, stripes: true });
    return pieces.map((pc, index) => {
      const lo = [Infinity, Infinity, Infinity];
      const hi = [-Infinity, -Infinity, -Infinity];
      pc.points.forEach((p, n) => {
        const rr = Array.isArray(pc.radii) ? pc.radii[n] ?? r : r;
        for (let a = 0; a < 3; a++) { lo[a] = Math.min(lo[a], p[a] - rr); hi[a] = Math.max(hi[a], p[a] + rr); }
      });
      return W.put(T.tubeSvg(pc, { tone }), lo, hi, { ...o, name: (o.name || "") + "#" + index });
    });
  };
  // text on the +y face (u = x) or the +x face (u = -y)
  W.textY = (x, y, z, text, size, tone = "lo", anchor = "start") => k.faceTextSvg(k.sideMatrix([x, y], z, P, "left"), text, { size, tone, anchor });
  W.textX = (x, y, z, text, size, tone = "lo", anchor = "start") => k.faceTextSvg(k.sideMatrix([x, y], z, P, "right"), text, { size, tone, anchor });
  W.textZ = (x, y, z, text, size, tone = "lo", anchor = "start", along = "x") => k.faceTextSvg(k.topMatrix([x, y], z, P, along), text, { size, tone, anchor });
  // a round fan opening seen face-on: dark recess, rim, recessed hub, blades, struts. F points out of the face.
  W.rotor = (F, R, { blades = 9, hub = R * 0.26, sweep = 0.55, struts = 3, depth = 8 } = {}) => {
    const rim = G.circleOf(F, 0, R, P);
    let out = `<path class="pc-void" d="${rim}"/>`;
    // the blades run from the hub to an inner ring at the same depth, so every end lands on something
    out += L(G.circleOf(F, -depth, R - 3, P), { tone: "faint" });
    out += L(G.spokesOf(F, -depth, hub, R - 3, blades, P, { sweep }), { tone: "lo" });
    if (struts) {
      out += L(G.circleOf(F, -2.5, R - 0.8, P), { tone: "faint" });
      out += L(G.spokesOf(F, -2.5, hub, R - 0.8, struts, P, { phase: 0.4 }), { tone: "mid" });
    }
    out += S(G.disc(-depth - 4, -2.5, hub, F, P, { steps: 28 }), { tone: "hi" });
    out += L(G.circleOf(F, -2.5, hub * 0.55, P, 20), { tone: "faint" });
    return out + L(rim, { tone: "lo" });
  };
  // a 120 mm fan: a frame with a rotor. axis is the airflow axis; c is the centre of the mounting plane
  W.fan = ({ axis, c, size = 120, depth = 25, sub, tone = "mid", name = "fan" }) => {
    const h = size / 2;
    const lo = axis === "x" ? [c[0], c[1] - h, c[2] - h] : [c[0] - h, c[1], c[2] - h];
    const hi = axis === "x" ? [c[0] + depth, c[1] + h, c[2] + h] : [c[0] + h, c[1] + depth, c[2] + h];
    const plan = { x: lo[0], y: lo[1], w: hi[0] - lo[0], d: hi[1] - lo[1], r: 5 };
    const faceC = axis === "x" ? [hi[0], c[1], c[2]] : [c[0], hi[1], c[2]];
    const F = G.frameAlong(faceC, AX[axis]);
    let svg = S(k.slabOf(plan, lo[2], size, P, 4, 0.5), { tone });
    svg += W.rotor(F, h - 4);
    const hole = (a, b) => (axis === "x" ? [faceC[0], c[1] + a, c[2] + b] : [c[0] + a, faceC[1], c[2] + b]);
    const o = h - 7.5;
    svg += dots([hole(-o, -o), hole(o, -o), hole(-o, o), hole(o, o)], { size: 0.8 });
    svg += L(G.circleOf(F, 0, 3.4, P, 12), { tone: "faint" });
    return W.put(svg, lo, hi, { sub, name });
  };
  return W;
}
