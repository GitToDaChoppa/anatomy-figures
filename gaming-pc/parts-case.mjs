// The case, the power supply and the I/O shield.
// World: x runs front → rear (rear is nearest the camera), y runs top → bottom of the tower, z is out of the
// motherboard tray. The case lies on its side with the glass panel off: the tray is the floor.

export const CASE = { W: 470, D: 490, WALL: 240, RIM: 34 };
export const BOARD = { x: 214, y: 60, w: 244, d: 305, zb: 10, zt: 11.6 }; // zb standoff height, zt top of the PCB
export const STANDOFFS = [225, 338, 447].flatMap((x) => [69, 213, 355].map((y) => [x, y]));
export const SLOT = { y0: 232, pitch: 20.32 };
export const PSU = { x: 300, y: 400, w: 162, d: 78, h: 150 };
export const FAN_FRONT = [85, 210, 335]; // y centres
export const FAN_TOP = [130, 260]; // x centres
export const FAN_Z = 120;

export function buildCase(W) {
  const { k, G, P, S, L, dots, faceX, faceY, at } = W;
  W.use("case");

  // ---- floor: the motherboard tray --------------------------------------------------------------------------
  W.box({
    x: 0, y: 0, w: CASE.W, d: CASE.D, z: -4, h: 4, r: 6, steps: 6, bevel: 0.8, tone: "lo", name: "tray",
    deco: (plan, zt) => {
      let out = L(k.planOutline(k.insetPlan(plan, 6), zt, P, 6), { tone: "faint" });
      // cable pass-throughs with rubber grommets, and the big cut-out behind the CPU socket
      const slots = [{ x: 176, y: 84, w: 28, d: 66, r: 9 }, { x: 176, y: 172, w: 28, d: 66, r: 9 }, { x: 176, y: 260, w: 28, d: 66, r: 9 }, { x: 318, y: 92, w: 80, d: 80, r: 6 }];
      for (const s of slots) {
        const d = k.planOutline(s, zt, P, 6);
        out += `<path class="pc-void" d="${d}"/>` + L(d, { tone: "lo" }) + L(k.planOutline(k.insetPlan(s, 2.6), zt, P, 6), { tone: "faint" });
      }
      // mounting-hole grid under the board
      const holes = [];
      for (let x = 224; x <= 452; x += 22) for (let y = 70; y <= 360; y += 22) if (!STANDOFFS.some(([sx, sy]) => Math.hypot(sx - x, sy - y) < 9) && !(x > 316 && x < 400 && y > 90 && y < 175)) holes.push([x, y, zt]);
      out += dots(holes, { size: 0.35, tone: "lo" });
      const corners = k.corners(plan, 11).map(([x, y]) => [x, y, zt]);
      out += L(corners.map(([x, y, z]) => k.ring(x, y, 2.6, z, P, 14)).join(""), { tone: "lo" }) + dots(corners, { size: 0.55 });
      return out;
    },
  });

  // ---- standoffs: nine brass posts the board rests on -------------------------------------------------------
  for (const [x, y] of STANDOFFS) {
    W.cyl({
      cx: x, cy: y, r: 3.5, z: 0, h: BOARD.zb, steps: 6, bevel: 0.3, tone: "hi", name: "standoff",
      deco: (zt) => L(k.ring(x, y, 1.5, zt, P, 10), { tone: "lo" }),
    });
  }

  // ---- far walls: front (carries the intake fans) and top (the exhaust fans) -------------------------------
  const maskDots = (x0, x1, z0, z1, ya, yb, cols, rows) => {
    const pts = [];
    for (let i = 0; i < cols; i++) for (let j = 0; j < rows; j++) pts.push([x0, ya + ((yb - ya) * i) / (cols - 1), z0 + ((z1 - z0) * j) / (rows - 1)]);
    return pts;
  };
  W.box({
    x: -4, y: -4, w: 4, d: CASE.D + 8, z: -4, h: CASE.WALL + 4, r: 1, steps: 2, bevel: 0.5, tone: "mid", name: "front wall",
    deco: () => {
      let out = faceX(0, [8, CASE.D - 8], [6, CASE.WALL - 6], 4);
      out = L(out, { tone: "faint" });
      for (const yc of FAN_FRONT) {
        const F = G.frameAlong([0, yc, FAN_Z], [1, 0, 0]);
        out += `<path class="pc-void" d="${G.circleOf(F, 0, 57, P)}"/>` + L(G.circleOf(F, 0, 57, P), { tone: "lo" });
        out += L(G.circleOf(F, 0, 20, P, 24), { tone: "faint" }) + L(G.spokesOf(F, 0, 20, 57, 6, P, { phase: 0.2 }), { tone: "faint" });
        out += dots([[0, yc - 52.5, FAN_Z - 52.5], [0, yc + 52.5, FAN_Z - 52.5], [0, yc - 52.5, FAN_Z + 52.5], [0, yc + 52.5, FAN_Z + 52.5]], { size: 0.8 });
      }
      out += dots(maskDots(0, 0, 18, 70, 40, 440, 14, 3), { size: 0.4, tone: "lo" }) + dots(maskDots(0, 0, 175, 225, 40, 440, 14, 3), { size: 0.4, tone: "lo" });
      return out;
    },
  });
  W.box({
    x: -4, y: -4, w: CASE.W + 8, d: 4, z: -4, h: CASE.WALL + 4, r: 1, steps: 2, bevel: 0.5, tone: "mid", name: "top wall",
    deco: () => {
      let out = L(faceY(0, [8, CASE.W - 8], [6, CASE.WALL - 6], 4), { tone: "faint" });
      for (const xc of FAN_TOP) {
        const F = G.frameAlong([xc, 0, FAN_Z], [0, 1, 0]);
        out += `<path class="pc-void" d="${G.circleOf(F, 0, 57, P)}"/>` + L(G.circleOf(F, 0, 57, P), { tone: "lo" });
        out += L(G.circleOf(F, 0, 20, P, 24), { tone: "faint" }) + L(G.spokesOf(F, 0, 20, 57, 6, P, { phase: 0.2 }), { tone: "faint" });
        out += dots([[xc - 52.5, 0, FAN_Z - 52.5], [xc + 52.5, 0, FAN_Z - 52.5], [xc - 52.5, 0, FAN_Z + 52.5], [xc + 52.5, 0, FAN_Z + 52.5]], { size: 0.8 });
      }
      return out;
    },
  });

  // ---- the near walls are cut down to a low rim so the inside shows ------------------------------------------
  const rim = (o) => W.box({ z: -4, h: CASE.RIM + 4, r: 1, steps: 2, bevel: 0.5, tone: "mid", ...o });
  rim({ x: 466, y: -4, w: 4, d: 70, name: "rear rim" });
  rim({
    x: 466, y: 272.6, w: 4, d: 119.4, name: "slot covers",
    deco: () => {
      let out = "";
      for (let n = 2; n < 7; n++) {
        const y0 = SLOT.y0 + SLOT.pitch * n + 1.2;
        const y1 = y0 + SLOT.pitch - 2.4;
        if (y1 > 392) break;
        out += L(faceX(470, [y0, y1], [-1, CASE.RIM - 2], 1.5), { tone: "lo" });
        const vents = [];
        for (let j = 0; j < 4; j++) vents.push([470, (y0 + y1) / 2, 4 + j * 7]);
        out += dots(vents, { size: 0.55, tone: "mid" });
      }
      return out;
    },
  });
  rim({ x: -4, y: 490, w: 300, d: 4, name: "bottom rim" });

  // ---- the power supply ---------------------------------------------------------------------------------------
  W.use("psu");
  const fanC = [PSU.x + PSU.w / 2, PSU.y + PSU.d, PSU.h / 2];
  // The supply is built in layers so it can open: a base with the board, the parts that stand on it, and the cover.
  const SEAM = 54; // top of the base; everything inside stands on the board here
  const sx0 = PSU.x, sx1 = PSU.x + PSU.w, sy0 = PSU.y, sy1 = PSU.y + PSU.d;
  W.box({
    x: sx0, y: sy0, w: PSU.w, d: PSU.d, z: 0, h: SEAM, r: 4, steps: 4, bevel: 0.9, tone: "hi", name: "psu base",
    deco: (plan, zt) => {
      let out = L(k.planOutline(k.insetPlan(plan, 5), zt, P, 4), { tone: "faint" });
      // the main board, with its mounting holes
      const pcb = k.insetPlan(plan, 7);
      out += S(k.slabOf(pcb, zt - 1.4, 1.4, P, 3), { tone: "lo", crease: "none" });
      out += dots(k.corners(k.insetPlan(plan, 11), 3).map(([x, y]) => [x, y, zt]), { size: 0.9, tone: "hi" });
      // the rear face: outline and vents
      out += L(faceX(sx1, [sy0 + 5, sy1 - 5], [5, SEAM - 5], 3), { tone: "faint" });
      const vx = [];
      for (let j = 0; j < 6; j++) for (let i = 0; i < 6; i++) vx.push([sx1, sy0 + 12 + i * 4.2, 14 + j * 5.2]);
      return out + dots(vx, { size: 0.45, tone: "mid" });
    },
  });
  // what stands on the board: connector panel, heat sinks, transformer, choke and capacitors
  const finsX = (x, y, w, d, zt, n) => { let s = ""; for (let i = 1; i < n; i++) s += L(k.lineOnTop([x, y + (i * d) / n], [x + w, y + (i * d) / n], zt, P), { tone: "lo" }); return s; };
  for (let i = 0; i < 4; i++) {
    W.box({
      x: sx0 + 4, y: sy0 + 6 + i * 17, w: 10, d: 14, z: SEAM, h: 24, r: 1.2, steps: 3, bevel: 0.3, tone: "lo", sub: [0, 0, 12], name: "modular socket",
      deco: (p, zt) => dots([0, 1, 2, 3, 4, 5].map((n) => [sx0 + 6 + (n % 3) * 3, sy0 + 10 + i * 17 + Math.floor(n / 3) * 6, zt]), { size: 0.7, tone: "hi" }),
    });
  }
  W.box({ x: sx0 + 14, y: sy0 + 6, w: 3, d: 66, z: SEAM, h: 36, r: 1, steps: 2, bevel: 0.2, tone: "mid", sub: [0, 0, 12], name: "connector board" });
  W.box({ x: sx0 + 22, y: sy0 + 8, w: 20, d: 62, z: SEAM, h: 42, r: 1.5, steps: 3, bevel: 0.5, tone: "hi", sub: [0, 0, 22], name: "heat sink a", deco: (p, zt) => finsX(sx0 + 22, sy0 + 8, 20, 62, zt, 10) });
  W.box({ x: sx0 + 48, y: sy0 + 8, w: 16, d: 62, z: SEAM, h: 30, r: 1.5, steps: 3, bevel: 0.5, tone: "hi", sub: [0, 0, 22], name: "heat sink b", deco: (p, zt) => finsX(sx0 + 48, sy0 + 8, 16, 62, zt, 8) });
  W.box({
    x: sx0 + 72, y: sy0 + 46, w: 36, d: 26, z: SEAM, h: 32, r: 2, steps: 3, bevel: 0.5, tone: "mid", sub: [0, 0, 30], name: "transformer",
    deco: (p, zt) => finsX(sx0 + 72, sy0 + 46, 36, 26, zt, 6) + L(k.planOutline(k.insetPlan(p, 4), zt, P, 2), { tone: "faint" }),
  });
  W.cyl({
    cx: sx0 + 90, cy: sy0 + 28, r: 12, z: SEAM, h: 16, bevel: 0.5, tone: "lo", sub: [0, 0, 30], name: "choke",
    deco: (zt) => dots([0, 1, 2, 3, 4, 5].map((n) => [sx0 + 90 + Math.cos((n * Math.PI) / 3) * 7, sy0 + 28 + Math.sin((n * Math.PI) / 3) * 7, zt]), { size: 0.9, tone: "hi" }),
  });
  for (let i = 0; i < 4; i++) W.cyl({ cx: sx0 + 72 + i * 11, cy: sy0 + 8, r: 4.5, z: SEAM, h: 14, bevel: 0.3, tone: "mid", sub: [0, 0, 36], name: "capacitor", deco: (zt) => dots([[sx0 + 72 + i * 11, sy0 + 8, zt]], { size: 1, tone: "lo" }) });
  for (const cy of [sy0 + 24, sy0 + 61]) {
    W.cyl({
      cx: sx0 + 136, cy, r: cy < sy0 + 40 ? 17 : 14, z: SEAM, h: 46, bevel: 0.6, tone: "hi", sub: [0, 0, 44], name: "bulk capacitor",
      deco: (zt) => L(k.lineOnTop([sx0 + 136 - 7, cy], [sx0 + 136 + 7, cy], zt, P), { tone: "lo", free: true }) + L(k.lineOnTop([sx0 + 136, cy - 7], [sx0 + 136, cy + 7], zt, P), { tone: "lo", free: true }),
    });
  }
  W.box({
    x: sx0, y: sy0, w: PSU.w, d: PSU.d, z: SEAM + 1, h: PSU.h - SEAM - 1, r: 4, steps: 4, bevel: 0.9, tone: "hi", sub: [0, 0, 125], name: "psu cover",
    deco: (plan, zt) => {
      let out = L(k.planOutline(k.insetPlan(plan, 5), zt, P, 4), { tone: "faint" });
      // the rating label on the side panel
      const label = { x: PSU.x + 52, y: PSU.y + 14, w: 92, d: 50, r: 3 };
      out += S(k.slabOf(label, zt, 0.8, P, 3), { tone: "lo", crease: "none" });
      out += L(k.planOutline(k.insetPlan(label, 2), zt + 0.8, P, 3), { tone: "faint" });
      out += W.textZ(label.x + 6, label.y + 16, zt + 0.8, "850 W", 10, "mid");
      out += W.textZ(label.x + 6, label.y + 25, zt + 0.8, "80 PLUS GOLD", 4.2, "lo");
      out += W.textZ(label.x + 6, label.y + 31, zt + 0.8, "+12V 70.8 A · ATX 3.1", 4.2, "lo");
      for (const dy of [37, 41.5]) out += L(k.lineOnTop([label.x + 6, label.y + dy], [label.x + 6 + (dy === 37 ? 72 : 52), label.y + dy], zt + 0.8, P), { tone: "lo", free: true });
      // vent slots at the front end
      const vents = [];
      for (let i = 0; i < 6; i++) vents.push(k.planOutline({ x: PSU.x + 12 + i * 6.4, y: PSU.y + 12, w: 3, d: 54, r: 1.5 }, zt, P, 3));
      out += vents.map((d) => `<path class="pc-void" d="${d}"/>` + L(d, { tone: "lo" })).join("");
      out += dots(k.corners(plan, 8).map(([x, y]) => [x, y, zt]), { size: 0.6 });
      // the rear face above the seam
      return out + L(faceX(sx1, [sy0 + 5, sy1 - 5], [SEAM + 5, PSU.h - 5], 3), { tone: "faint" });
    },
  });
  // the AC inlet and rocker switch plug into the rear face
  W.box({
    x: PSU.x + PSU.w, y: PSU.y + 8, w: 3, d: 34, z: 98, h: 26, r: 2, steps: 3, bevel: 0.3, tone: "mid", sub: [34, 0, 125], name: "ac inlet",
    deco: () => {
      const X = PSU.x + PSU.w + 3;
      return L(faceX(X, [PSU.y + 12, PSU.y + 38], [102, 120], 2), { tone: "lo" }) + dots([[X, PSU.y + 18, 111], [X, PSU.y + 25, 111], [X, PSU.y + 32, 111]], { size: 1.1, tone: "hi" });
    },
  });
  W.box({
    x: PSU.x + PSU.w, y: PSU.y + 50, w: 3, d: 20, z: 98, h: 26, r: 2, steps: 3, bevel: 0.3, tone: "mid", sub: [34, 0, 125], name: "switch",
    deco: () => L(faceX(PSU.x + PSU.w + 3, [PSU.y + 54, PSU.y + 66], [104, 118], 2), { tone: "lo" }) + L(k.segment([PSU.x + PSU.w + 3, PSU.y + 60, 108], [PSU.x + PSU.w + 3, PSU.y + 60, 114], P), { tone: "hi", free: true }),
  });
  // the 135 mm fan under the basement grille
  W.disc({
    at: fanC, axis: "y", s0: 0, s1: 8, r: 67, steps: 56, tone: "mid", bevel: 0.4, sub: [0, 44, 0], name: "psu fan",
    deco: (F) => {
      let out = "";
      for (const r of [14, 26, 38, 50, 62]) out += L(G.circleOf(F, 8, r, P), { tone: "lo" });
      out += L(G.spokesOf(F, 8, 14, 66, 8, P, { phase: 0.25 }), { tone: "lo" });
      out += S(G.disc(8, 11, 14, F, P, {}), { tone: "hi" });
      out += L(G.circleOf(F, 8, 66, P), { tone: "lo" });
      const o = 60;
      return out + dots([[fanC[0] - o, fanC[1] + 8, fanC[2] - o], [fanC[0] + o, fanC[1] + 8, fanC[2] - o], [fanC[0] - o, fanC[1] + 8, fanC[2] + o], [fanC[0] + o, fanC[1] + 8, fanC[2] + o]], { size: 0.8 });
    },
  });

  // ---- I/O shield: a thin plate with a window for every port ----------------------------------------------------
  W.use("io");
  const ioWin = (y0, y1, z0, z1) => faceX(470, [y0, y1], [z0, z1], 1.2);
  W.box({
    x: 469, y: 68, w: 1, d: 162, z: 3, h: 52, r: 1.5, steps: 3, bevel: 0.2, tone: "hi", name: "io shield",
    deco: () => {
      let out = L(faceX(470, [70, 228], [5, 51], 2), { tone: "faint" });
      for (const [y0, y1, z0, z1] of [[72, 87, 14, 22], [92, 103, 14, 18], [106, 122, 14, 28], [126, 140, 14, 30], [144, 158, 14, 30], [162, 176, 14, 30], [180, 194, 14, 30], [198, 224, 14, 24]]) {
        const d = ioWin(y0, y1, z0, z1);
        out += `<path class="pc-void" d="${d}"/>` + L(d, { tone: "lo" });
        const w = y1 - y0, h = z1 - z0;
        if (w > 20) out += dots([0, 1, 2].map((i) => [470, y0 + w * (0.22 + i * 0.28), z0 + h / 2]), { size: 1.4, tone: "mid" });
        else if (h >= 14) out += L(k.segment([470, y0, z0 + h / 2], [470, y1, z0 + h / 2], P), { tone: "mid" }) + (h > 15 && w > 13 ? dots([0, 1, 2, 3, 4, 5].map((i) => [470, y0 + 3 + i * ((w - 6) / 5), z0 + 3.2]), { size: 0.4, tone: "mid" }) : "");
        else out += L(k.segment([470, y0, z0 + h / 2], [470, y1, z0 + h / 2], P), { tone: "mid" });
      }
      for (let y = 74; y < 228; y += 7) out += L(k.segment([470, y, 6], [470, y, 11], P), { tone: "faint" });
      out += dots([[470, 76, 44], [470, 222, 44], [470, 76, 8], [470, 222, 8]], { size: 0.6 });
      return out;
    },
  });
}
