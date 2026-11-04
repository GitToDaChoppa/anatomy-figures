// Fans, the SATA SSD, the graphics card, the cables and the glass.
import { BOARD, FAN_FRONT, FAN_TOP, FAN_Z, PSU } from "./parts-case.mjs";
import { GPU_SLOT } from "./parts-board.mjs";

export const GPU = { x0: 172, x1: 466, ySlot: 243.2, zSlot: BOARD.zt + 11.5 };
export const SSD = { x: 62, y: 412, w: 100, d: 70, z: 6 };

export function buildRest(W) {
  const { k, G, T, P, S, L, dots, faceX, faceY, faceZ, at } = W;
  const Z = BOARD.zt;

  // ---- four posts the SSD screws to (they belong to the case) ------------------------------------------------
  W.use("case");
  for (const [x, y] of [[SSD.x + 6, SSD.y + 6], [SSD.x + 6, SSD.y + SSD.d - 6], [SSD.x + SSD.w - 6, SSD.y + 6], [SSD.x + SSD.w - 6, SSD.y + SSD.d - 6]]) {
    W.cyl({ cx: x, cy: y, r: 3.4, z: 0, h: SSD.z, steps: 6, bevel: 0.3, tone: "hi", name: "drive post", deco: (zt) => L(k.ring(x, y, 1.4, zt, P, 10), { tone: "lo" }) });
  }

  // =================================================================================================================
  // FANS: three pull air in at the front, two push it out of the top
  // =================================================================================================================
  FAN_FRONT.forEach((yc, i) => { W.use("fan" + i); W.fan({ axis: "x", c: [0, yc, FAN_Z], name: "front fan " + (i + 1) }); });
  FAN_TOP.forEach((xc, i) => { W.use("fan" + (3 + i)); W.fan({ axis: "y", c: [xc, 0, FAN_Z], name: "top fan " + (i + 1) }); });

  // =================================================================================================================
  // SATA SSD: casing, board, chips, cover, four screws
  // =================================================================================================================
  W.use("ssd");
  const sx = SSD.x, sy = SSD.y, sz = SSD.z;
  W.box({ x: sx, y: sy, w: SSD.w, d: SSD.d, z: sz, h: 4, r: 2.5, steps: 4, bevel: 0.4, tone: "mid", name: "ssd casing", sub: [0, 0, 0], deco: (p, zt) => L(k.planOutline(k.insetPlan(p, 2), zt, P, 3), { tone: "faint" }) });
  W.box({
    x: sx + 4, y: sy + 4, w: SSD.w - 8, d: SSD.d - 8, z: sz + 4, h: 1.2, r: 1.2, steps: 3, tone: "mid", name: "ssd pcb", sub: [0, 0, 14],
    deco: (p, zt) => L(k.onTop([[sx + 10, sy + 10], [sx + 30, sy + 10], [sx + 38, sy + 18]], zt, P), { tone: "faint" }) + dots([[sx + 10, sy + 10, zt], [sx + 38, sy + 18, zt]], { size: 0.5 }),
  });
  for (const [cx, cy, w, d] of [[sx + 14, sy + 14, 22, 18], [sx + 14, sy + 38, 22, 18], [sx + 42, sy + 14, 20, 16], [sx + 66, sy + 24, 14, 14]]) {
    W.box({ x: cx, y: cy, w, d, z: sz + 5.2, h: 1.2, r: 0.8, steps: 2, tone: "hi", name: "ssd chip", sub: [0, 0, 28], deco: (p, zt) => L(k.planOutline(k.insetPlan(p, 1.6), zt, P, 2), { tone: "faint" }) });
  }
  W.box({
    x: sx + 1, y: sy + 1, w: SSD.w - 2, d: SSD.d - 2, z: sz + 6.4, h: 1.6, r: 2.2, steps: 4, bevel: 0.5, tone: "hi", name: "ssd cover", sub: [0, 0, 44],
    deco: (p, zt) => {
      const label = { x: sx + 14, y: sy + 14, w: 56, d: 34, r: 2 };
      return S(k.slabOf(label, zt, 0.4, P, 3), { tone: "lo", crease: "none" }) + W.textZ(label.x + 5, label.y + 12, zt + 0.4, "2 TB SATA", 6, "mid") + W.textZ(label.x + 5, label.y + 20, zt + 0.4, "6 Gb/s · 560 MB/s", 3.8, "lo") + L(k.lineOnTop([label.x + 5, label.y + 26], [label.x + 38, label.y + 26], zt + 0.4, P), { tone: "lo", free: true });
    },
  });
  for (const [x, y] of [[sx + 6, sy + 6], [sx + 6, sy + SSD.d - 6], [sx + SSD.w - 6, sy + 6], [sx + SSD.w - 6, sy + SSD.d - 6]]) {
    W.cyl({ cx: x, cy: y, r: 1.9, z: sz + 8, h: 1.2, steps: 10, tone: "hi", name: "ssd screw", sub: [0, 0, 62], deco: (zt) => L(k.segment([x - 1.2, y, zt], [x + 1.2, y, zt], P), { tone: "lo" }) });
  }
  W.box({
    x: sx + SSD.w, y: sy + 24, w: 14, d: 34, z: sz + 1, h: 5, r: 0.8, steps: 2, bevel: 0.2, tone: "lo", name: "sata connector", sub: [20, 0, 6],
    deco: (p, zt) => L(k.onTop([[sx + SSD.w + 2, sy + 28], [sx + SSD.w + 12, sy + 28], [sx + SSD.w + 12, sy + 34]], zt, P), { tone: "faint" }) + dots([...Array(7)].map((_, i) => [sx + SSD.w + 12, sy + 33 + i * 3, zt]), { size: 0.5 }),
  });

  // =================================================================================================================
  // GRAPHICS CARD: backplate, board, chips, heat sink + pipes, shroud, three fans, power plug, bracket
  // =================================================================================================================
  W.use("gpu");
  const gz0 = GPU.zSlot;
  const gz1 = gz0 + 112;
  const gy = GPU.ySlot;
  W.box({
    x: GPU.x0 + 4, y: gy - 3.6, w: GPU.x1 - GPU.x0 - 4, d: 3.6, z: gz0, h: 112, r: 1, steps: 2, bevel: 0.3, tone: "mid", name: "backplate", sub: [0, -34, 0],
    deco: () => {
      let out = L(faceZ(gz1, [GPU.x0 + 10, GPU.x1 - 6], [gy - 3.2, gy - 0.4], 0.5), { tone: "faint" });
      out += L(faceX(GPU.x1, [gy - 3.2, gy - 0.4], [gz0 + 4, gz1 - 4], 0.5), { tone: "faint" });
      return out;
    },
  });
  W.box({
    x: GPU.x0 + 4, y: gy, w: GPU.x1 - GPU.x0 - 4, d: 1.6, z: gz0, h: 112, r: 1, steps: 2, bevel: 0.2, tone: "mid", name: "gpu pcb", sub: [0, 0, 0],
    deco: () => {
      const Y = gy + 1.6;
      let out = "";
      for (let x = 362; x < 446; x += 2.2) out += L(k.segment([x, Y, gz0], [x, Y, gz0 + 3.4], P), { tone: "hi" });
      for (let i = 0; i < 6; i++) out += L(W.poly([[200 + i * 4, Y, 40], [200 + i * 4, Y, 60], [214 + i * 4, Y, 74]]), { tone: "faint" });
      out += L(faceY(Y, [GPU.x0 + 10, GPU.x1 - 10], [gz0 + 4, gz1 - 4], 2), { tone: "faint" });
      return out;
    },
  });
  // processor die and eight memory chips round it, six power stages at the rear end
  W.box({ x: 305, y: gy + 1.6, w: 32, d: 1.8, z: 62, h: 32, r: 1, steps: 2, bevel: 0.2, tone: "hi", name: "gpu die", sub: [0, 14, 0], deco: () => L(faceY(gy + 3.4, [309, 333], [66, 90], 1), { tone: "faint" }) + W.textY(311, gy + 3.4, 80, "GPU", 5, "mid") });
  [[270, 98], [300, 98], [330, 98], [270, 30], [300, 30], [330, 30], [262, 64], [342, 64]].forEach(([x, z]) => {
    W.box({ x, y: gy + 1.6, w: 14, d: 1.4, z, h: 14, r: 0.6, steps: 2, tone: "lo", name: "vram", sub: [0, 8, 0], deco: () => L(faceY(gy + 3, [x + 1.6, x + 12.4], [z + 1.6, z + 12.4], 0.6), { tone: "faint" }) });
  });
  for (let i = 0; i < 6; i++) W.box({ x: 410 + i * 8, y: gy + 1.6, w: 6, d: 1.4, z: 50, h: 12, r: 0.4, steps: 1, tone: "lo", name: "power stage", sub: [0, 8, 0] });
  // heat sink: a block of vertical fins on a copper base, pipes laid across it
  W.box({
    x: 190, y: gy + 3.4, w: 250, d: 14, z: gz0 + 8, h: 98, r: 1, steps: 2, bevel: 0.3, tone: "hi", name: "gpu heatsink", sub: [0, 24, 0],
    deco: () => {
      let out = "";
      for (let x = 194; x < 438; x += 3) out += L(k.segment([x, gy + 17.4, gz0 + 8], [x, gy + 17.4, gz0 + 106], P), { tone: "faint" });
      for (let x = 194; x < 438; x += 3) out += L(k.lineOnTop([x, gy + 3.4], [x, gy + 17.4], gz0 + 106, P), { tone: "faint" });
      return out;
    },
  });
  [gz0 + 24, gz0 + 44, gz0 + 64, gz0 + 84].forEach((z, i) => {
    W.disc({ at: [196, gy + 17.4 + 3, z], axis: "x", s0: 0, s1: 236, r: 3, steps: 12, tone: "mid", name: "heat pipe", sub: [0, 44, 0] });
  });
  // shroud with three round openings
  const fcx = [218, 312, 406];
  const fzc = gz0 + 56;
  const gys = gy + 17.4 + 6;
  W.box({
    x: GPU.x0, y: gys, w: 280, d: 16, z: gz0, h: 112, r: 6, steps: 5, bevel: 0.7, tone: "hi", name: "shroud", sub: [0, 66, 0],
    deco: (p, zt) => {
      const Y = gys + 16;
      let out = L(faceY(Y, [GPU.x0 + 4, GPU.x0 + 276], [gz0 + 4, gz1 - 4], 6), { tone: "faint" });
      for (const cx of fcx) {
        const F = G.frameAlong([cx, Y, fzc], [0, 1, 0]);
        out += `<path class="pc-void" d="${G.circleOf(F, 0, 47, P)}"/>` + L(G.circleOf(F, 0, 47, P), { tone: "lo" });
      }
      out += L(k.lineOnTop([GPU.x0 + 6, gys + 8], [GPU.x0 + 274, gys + 8], zt, P), { tone: "faint" });
      out += dots(k.corners({ x: GPU.x0, y: gys, w: 280, d: 16 }, 6).map(([x]) => [x, Y, gz0 + 6]).concat(k.corners({ x: GPU.x0, y: gys, w: 280, d: 16 }, 6).map(([x]) => [x, Y, gz1 - 6])), { size: 0.6 });
      return out;
    },
  });
  fcx.forEach((cx, i) => {
    W.disc({
      at: [cx, gys + 16, fzc], axis: "y", s0: 0, s1: 5, r: 44, steps: 48, tone: "mid", bevel: 0.2, name: "gpu fan " + (i + 1), sub: [0, 96 + i * 4, 0],
      deco: () => { const F2 = G.frameAlong([cx, gys + 21, fzc], [0, 1, 0]); return W.rotor(F2, 40, { blades: 11, hub: 11, sweep: 0.5, struts: 0, depth: 3 }) + L(G.circleOf(F2, 0, 44, P), { tone: "lo" }); },
    });
  });
  // the 12V-2x6 power socket on the top edge and the slot bracket at the rear
  W.box({
    x: 396, y: gy + 8, w: 28, d: 13, z: gz1, h: 12, r: 1, steps: 2, bevel: 0.3, tone: "mid", sub: [0, 0, 22], name: "12v-2x6 socket",
    deco: (p, zt) => {
      const pins = [];
      for (let i = 0; i < 6; i++) { pins.push([400.2 + i * 3.7, gy + 12.4, zt]); pins.push([400.2 + i * 3.7, gy + 16.6, zt]); }
      return dots(pins, { size: 0.9, tone: "lo" }) + L(k.planOutline(k.insetPlan(p, 1.6), zt, P, 2), { tone: "faint" }) + L(k.lineOnTop([398, gy + 21], [422, gy + 21], zt, P), { tone: "mid" });
    },
  });
  W.box({
    x: GPU.x1, y: 231.5, w: 3.4, d: 41, z: 8, h: gz1 + 6 - 8, r: 0.8, steps: 2, bevel: 0.3, tone: "mid", name: "slot bracket", sub: [34, 0, 0],
    deco: () => {
      const X = GPU.x1 + 3.4;
      let out = L(faceX(X, [233, 270.5], [14, gz1 + 3], 1.4), { tone: "faint" });
      for (const [z, n] of [[gz1 - 20, "DP"], [gz1 - 40, "DP"], [gz1 - 60, "DP"], [gz1 - 80, "HDMI"]]) {
        const d = faceX(X, [239, 265], [z - 6, z + 4], 1.5);
        out += `<path class="pc-void" d="${d}"/>` + L(d, { tone: "lo" }) + L(k.segment([X, 243, z - 1], [X, 261, z - 1], P), { tone: "faint" });
      }
      const slots = [];
      for (let j = 0; j < 4; j++) slots.push([X, 252, 22 + j * 6.5]);
      out += dots(slots, { size: 1.1, tone: "lo" }) + dots([[X, 236, gz1 + 0.5], [X, 268, gz1 + 0.5]], { size: 0.8 });
      return out;
    },
  });

  // =================================================================================================================
  // CABLES: each one is a bundle with a plug at both ends. Routes run along the front of the tray, clear of the card.
  // =================================================================================================================
  const route = (pts, r = 4) => G.fillet(pts, 14, 6, { P, tube: r });
  const plug = (o) => W.box({ r: 1.2, steps: 3, bevel: 0.3, tone: "mid", ...o });

  W.use("cab24");
  plug({
    x: 215.5, y: 119.5, w: 20, d: 62, z: Z + 17, h: 23, name: "24-pin plug", sub: [0, 0, 0],
    deco: (p, zt) => {
      const holes = [];
      for (let i = 0; i < 12; i++) for (const dx of [5.5, 14.5]) holes.push([215.5 + dx, 122.8 + i * 4.8, zt]);
      return dots(holes, { size: 0.8, tone: "lo" }) + L(k.planOutline(k.insetPlan(p, 1.8), zt, P, 2), { tone: "faint" });
    },
  });
  plug({ x: PSU.x - 12, y: 404, w: 12, d: 24, z: 29, h: 22, name: "psu end", sub: [0, 0, 0], deco: () => L(faceY(428, [PSU.x - 10, PSU.x - 2], [32, 48], 1), { tone: "faint" }) });
  W.tube(route([[215.5, 150, Z + 29], [190, 150, Z + 29], [150, 150, 40], [150, 416, 40], [PSU.x - 12, 416, 40]], 4.5), 4.5, { tone: "hi", name: "24-pin cable" });
  // the cable is one rigid bundle: both ends keep their plugs

  W.use("cabcpu");
  plug({ x: 330.5, y: 60.5, w: 22, d: 12, z: Z + 14, h: 16, name: "eps plug", sub: [0, 0, 0], deco: (p, zt) => dots([0, 1, 2, 3].flatMap((i) => [[334 + i * 4.8, 64, zt], [334 + i * 4.8, 69, zt]]), { size: 0.8, tone: "lo" }) });
  plug({ x: PSU.x - 12, y: 430, w: 12, d: 20, z: 45, h: 22, name: "psu end 2", sub: [0, 0, 0] });
  W.tube(route([[341.5, 66.5, Z + 30], [341.5, 66.5, 70], [128, 66.5, 70], [128, 440, 56], [PSU.x - 12, 440, 56]], 2.4), 2.4, { tone: "hi", name: "eps cable" });

  W.use("cabgpu");
  plug({ x: 394, y: gy + 6.5, w: 32, d: 17, z: gz1 + 12, h: 16, name: "12v-2x6 plug", sub: [0, 0, 0], deco: (p, zt) => L(k.planOutline(k.insetPlan(p, 1.8), zt, P, 2), { tone: "faint" }) + dots([...Array(6)].flatMap((_, i) => [[398.5 + i * 4.2, gy + 12, zt], [398.5 + i * 4.2, gy + 18, zt]]), { size: 0.8, tone: "lo" }) });
  plug({ x: PSU.x - 12, y: 452, w: 12, d: 20, z: 92, h: 18, name: "psu end 3", sub: [0, 0, 0] });
  W.tube(route([[410, gy + 15, gz1 + 28], [410, gy + 15, 162], [282, gy + 15, 162], [282, 462, 162], [282, 462, 101], [PSU.x - 12, 462, 101]], 3.2), 3.2, { tone: "hi", name: "gpu cable" });

  W.use("cabsata");
  plug({ x: sx + SSD.w + 14, y: sy + 21, w: 24, d: 30, z: sz + 1, h: 10, name: "sata plug", sub: [0, 0, 0], deco: (p, zt) => L(k.planOutline(k.insetPlan(p, 1.8), zt, P, 2), { tone: "faint" }) });
  plug({ x: PSU.x - 12, y: 454, w: 12, d: 16, z: 60, h: 14, name: "psu end 4", sub: [0, 0, 0] });
  W.tube(route([[sx + SSD.w + 38, 448, 12], [262, 448, 12], [262, 462, 12], [262, 462, 67], [PSU.x - 12, 462, 67]], 1.8), 1.8, { tone: "hi", name: "sata cable" });

  // =================================================================================================================
  // GLASS: a tempered panel that drops on last, four thumbscrews
  // =================================================================================================================
  W.use("glass");
  const gl = { x: -6, y: -6, w: 482, d: 502, r: 8 };
  const gzb = 240;
  const gzt = 244;
  const topD = k.planOutline(gl, gzt, P, 6);
  const stripe = (a, b) => `<path class="pc-sheen" d="${W.poly([[a, -4, gzt], [b, -4, gzt], [-4, b, gzt], [-4, a, gzt]], true)}"/>`;
  let glass = `<path class="pc-glass" d="${topD}"/>` + stripe(70, 128) + stripe(160, 190) + stripe(300, 340);
  glass += L(topD, { tone: "hi" }) + L(k.planOutline(gl, gzb, P, 6), { tone: "mid" });
  for (const [x, y] of [[gl.x, gl.y], [gl.x + gl.w, gl.y], [gl.x, gl.y + gl.d], [gl.x + gl.w, gl.y + gl.d]]) glass += L(k.segment([x, y, gzb], [x, y, gzt], P), { tone: "mid", free: true });
  glass += L(k.planOutline(k.insetPlan(gl, 8), gzt, P, 6), { tone: "faint" });
  W.put(glass, [gl.x, gl.y, gzb], [gl.x + gl.w, gl.y + gl.d, gzt], { name: "glass panel", sub: [0, 0, 0] });
  for (const [x, y] of [[14, 14], [456, 14], [14, 476], [456, 476]]) {
    W.cyl({ cx: x, cy: y, r: 6, z: gzt, h: 7, steps: 20, bevel: 0.5, tone: "hi", name: "thumbscrew", sub: [0, 0, 40], deco: (zt) => L(k.knurl(x, y, 6, gzt, zt, 14, P, 0), { tone: "lo" }) + L(k.ring(x, y, 3.2, zt, P, 14), { tone: "faint" }) });
  }
}
