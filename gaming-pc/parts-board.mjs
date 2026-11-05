// Motherboard, processor, cooler, memory and the M.2 SSD: everything that lives on the tray's big green plate.
import { BOARD, STANDOFFS, SLOT } from "./parts-case.mjs";

export const CPU_C = [358, 132];
export const RAM_X = [296, 288, 280, 272]; // slot centres, nearest the CPU first
export const RAM_Y = [66, 200];
export const GPU_SLOT = { x: 359, y: 240.3, w: 89, d: 7, h: 11.5 };

export function buildBoard(W) {
  const { k, G, P, S, L, dots, faceX, faceY, faceZ, at } = W;
  const Z = BOARD.zt; // 11.6
  const bx1 = BOARD.x + BOARD.w;
  const by1 = BOARD.y + BOARD.d;

  // finned heatsink: grooves across the top
  const fins = (x, y, w, d, z, h, along, step = 4) => {
    let out = "";
    if (along === "y") for (let u = x + step; u < x + w - 1; u += step) out += L(k.lineOnTop([u, y + 1.5], [u, y + d - 1.5], z, P), { tone: "faint" });
    else for (let v = y + step; v < y + d - 1; v += step) out += L(k.lineOnTop([x + 1.5, v], [x + w - 1.5, v], z, P), { tone: "faint" });
    return out;
  };
  const screwDots = (pts, z) => dots(pts.map(([x, y]) => [x, y, z]), { size: 0.6 });

  // =================================================================================================================
  // MOTHERBOARD
  // =================================================================================================================
  W.use("board");
  W.box({
    x: BOARD.x, y: BOARD.y, w: BOARD.w, d: BOARD.d, z: BOARD.zb, h: 1.6, r: 3, steps: 4, bevel: 0.3, tone: "mid", name: "pcb",
    deco: (plan, zt) => {
      let out = L(k.planOutline(k.insetPlan(plan, 2.4), zt, P, 4), { tone: "faint" });
      // nine screw holes line up with the nine standoffs
      out += L(STANDOFFS.map(([x, y]) => k.ring(x, y, 3.6, zt, P, 14)).join(""), { tone: "lo" }) + dots(STANDOFFS.map(([x, y]) => [x, y, zt]), { size: 0.8 });
      // memory channels: two buses from the socket to the DIMM slots
      for (let i = 0; i < 6; i++) {
        const y = 76 + i * 22;
        out += L(k.onTop([[333, 118 + i * 6], [320, 118 + i * 6], [312, y], [300, y]], zt, P), { tone: "faint", free: true });
      }
      // PCIe lanes toward the x16 slot, VRM power plane lines
      for (let i = 0; i < 5; i++) out += L(k.onTop([[358, 164 + i * 3.4], [358, 174 + i * 3.4], [372 + i * 3, 188 + i * 3.4], [372 + i * 3, 240]], zt, P), { tone: "faint", free: true });
      for (let i = 0; i < 4; i++) out += L(k.onTop([[383, 114 + i * 5], [398, 114 + i * 5], [398, 88]], zt, P), { tone: "faint", free: true });
      for (let i = 0; i < 8; i++) out += L(k.onTop([[300, 226 + i * 3], [330, 226 + i * 3], [338, 218 + i * 3], [362, 218 + i * 3]], zt, P), { tone: "faint", free: true });
      for (let i = 0; i < 6; i++) out += L(k.onTop([[236, 190 + i * 3.4], [262, 190 + i * 3.4], [270, 214 + i * 3.4], [356, 214 + i * 3.4]], zt, P), { tone: "faint", free: true });
      const vias = [];
      for (let x = 240; x < 440; x += 14) for (let y = 250; y < 350; y += 14) if (!((x > 255 && x < 310 && y > 305) || (x > 340 && y > 290 && y < 340))) vias.push([x + ((y / 14) % 2) * 5, y, zt]);
      out += dots(vias, { size: 0.35, tone: "lo" });
      out += W.textZ(BOARD.x + 8, by1 - 12, zt, "ATX 305 × 244", 5, "lo");
      out += W.textZ(bx1 - 94, by1 - 12, zt, "PCIE 5.0 X16 · DDR5", 5, "lo");
      return out;
    },
  });

  // CPU socket
  W.box({
    x: 333, y: 104, w: 50, d: 56, z: Z, h: 4.8, r: 1.6, steps: 3, bevel: 0.3, tone: "lo", sub: [0, 0, 29], name: "socket",
    deco: (plan, zt) => {
      const pin = { x: 338, y: 109, w: 40, d: 46, r: 1 };
      const pd = k.planOutline(pin, zt, P, 3);
      let out = `<path class="pc-void" d="${pd}"/>` + L(pd, { tone: "lo" });
      const pins = [];
      for (let i = 0; i < 13; i++) for (let j = 0; j < 15; j++) pins.push([340.6 + i * 3, 111.6 + j * 3, zt]);
      out += dots(pins, { size: 0.32, tone: "mid" });
      out += L(k.planOutline(k.insetPlan(plan, 1.6), zt, P, 3), { tone: "faint" });
      // the retention lever and its hook
      out += L(k.onTop([[383, 150], [394, 150], [394, 112], [383, 112]], zt, P), { tone: "mid" });
      out += dots([[383, 150, zt], [383, 112, zt]], { size: 0.7 });
      // alignment triangle printed on the corner
      out += L(k.onTop([[335, 106], [341, 106], [335, 112]], zt, P, true), { tone: "hi" });
      return out;
    },
  });

  // VRM heatsinks (the processor's power stage), fins across
  W.box({ x: 360, y: 64, w: 88, d: 20, z: Z, h: 24, r: 1.5, steps: 3, bevel: 0.6, tone: "hi", sub: [0, 0, 79], name: "vrm top", deco: (p, zt) => fins(360, 64, 88, 20, zt, 24, "y", 4) + screwDots([[364, 68], [444, 80]], zt) });
  W.box({ x: 414, y: 88, w: 34, d: 118, z: Z, h: 24, r: 1.5, steps: 3, bevel: 0.6, tone: "hi", sub: [0, 0, 79], name: "vrm rear", deco: (p, zt) => fins(414, 88, 34, 118, zt, 24, "x", 4) + screwDots([[418, 92], [444, 202]], zt) });
  // chipset heatsink
  W.box({ x: 262, y: 312, w: 44, d: 40, z: Z, h: 11, r: 2, steps: 3, bevel: 0.5, tone: "hi", sub: [0, 0, 54], name: "chipset", deco: (p, zt) => fins(262, 312, 44, 40, zt, 11, "x", 4) + L(k.planOutline(k.insetPlan(p, 2), zt, P, 3), { tone: "faint" }) + screwDots([[266, 316], [302, 348]], zt) });

  // DIMM slots
  RAM_X.forEach((cx, n) => {
    W.box({
      x: cx - 3.5, y: RAM_Y[0], w: 7, d: RAM_Y[1] - RAM_Y[0], z: Z, h: 8, r: 0.8, steps: 2, bevel: 0.2, tone: "lo", sub: [0, 0, 18 + n], name: "dimm slot " + (n + 1),
      deco: (p, zt) => {
        const groove = k.planOutline({ x: cx - 1.6, y: RAM_Y[0] + 3, w: 3.2, d: RAM_Y[1] - RAM_Y[0] - 6, r: 1.4 }, zt, P, 3);
        return `<path class="pc-void" d="${groove}"/>` + L(groove, { tone: "faint" }) + L(k.lineOnTop([cx - 1.6, 142], [cx + 1.6, 142], zt, P), { tone: "mid" });
      },
    });
  });

  // PCIe slots
  const pcie = (x, y, w, d, name, sub) =>
    W.box({
      x, y, w, d, z: Z, h: 11.5, r: 0.8, steps: 2, bevel: 0.2, tone: "lo", sub, name,
      deco: (p, zt) => {
        const g = k.planOutline({ x: x + 2, y: y + 2.2, w: w - 4, d: d - 4.4, r: 0.5 }, zt, P, 2);
        return `<path class="pc-void" d="${g}"/>` + L(g, { tone: "faint" }) + L(k.lineOnTop([x + w * 0.62, y + 1], [x + w * 0.62, y + d - 1], zt, P), { tone: "mid" });
      },
    });
  pcie(GPU_SLOT.x, GPU_SLOT.y, GPU_SLOT.w, GPU_SLOT.d, "pcie x16", [0, 0, 12]);
  pcie(418, 296, 30, 7, "pcie x1", [0, 0, 12]);
  pcie(359, 324, 89, 7, "pcie x16 b", [0, 0, 12]);

  // M.2 socket and the screw post at the other end of an 80 mm stick
  W.box({ x: 438, y: 214, w: 9, d: 20, z: Z, h: 2.8, r: 0.8, steps: 2, tone: "lo", sub: [0, 0, 18], name: "m2 socket", deco: (p, zt) => L(k.lineOnTop([440, 216], [440, 232], zt, P), { tone: "mid" }) });
  W.cyl({ cx: 361, cy: 223, r: 3, z: Z, h: 2.6, steps: 10, tone: "hi", sub: [0, 0, 18], name: "m2 post", deco: (zt) => L(k.ring(361, 223, 1.2, zt, P, 8), { tone: "lo" }) });

  // 24-pin power socket on the front edge, 8-pin CPU power on the top edge
  W.box({
    x: 216, y: 120, w: 19, d: 61, z: Z, h: 17, r: 1, steps: 2, bevel: 0.3, tone: "mid", sub: [0, 0, 40], name: "atx24",
    deco: (p, zt) => {
      const pins = [];
      for (let i = 0; i < 12; i++) for (const dx of [5.5, 13]) pins.push([216 + dx, 123.5 + i * 4.7, zt]);
      return dots(pins, { size: 0.9, tone: "lo" }) + L(k.planOutline(k.insetPlan(p, 1.6), zt, P, 2), { tone: "faint" }) + L(k.lineOnTop([235, 134], [235, 167], zt, P), { tone: "mid" });
    },
  });
  W.box({
    x: 331, y: 62, w: 21, d: 10, z: Z, h: 14, r: 1, steps: 2, bevel: 0.3, tone: "mid", sub: [0, 0, 40], name: "eps8",
    deco: (p, zt) => dots([0, 1, 2, 3].flatMap((i) => [[334.5 + i * 4.6, 65.5, zt], [334.5 + i * 4.6, 70, zt]]), { size: 0.9, tone: "lo" }) + L(k.planOutline(k.insetPlan(p, 1.5), zt, P, 2), { tone: "faint" }),
  });

  // headers, battery, SATA ports
  W.box({ x: 312, y: 76, w: 13, d: 5.5, z: Z, h: 8, r: 0.6, steps: 2, tone: "lo", sub: [0, 0, 25], name: "cpu fan header", deco: (p, zt) => dots([[315, 78.7, zt], [318.5, 78.7, zt], [322, 78.7, zt]], { size: 0.6 }) });
  W.box({ x: 300, y: 352, w: 26, d: 6, z: Z, h: 8, r: 0.6, steps: 2, tone: "lo", sub: [0, 0, 25], name: "front panel header", deco: (p, zt) => dots([0, 1, 2, 3, 4].map((i) => [303 + i * 4.6, 355, zt]), { size: 0.6 }) });
  W.box({ x: 340, y: 350, w: 22, d: 8, z: Z, h: 10, r: 0.6, steps: 2, tone: "lo", sub: [0, 0, 29], name: "usb header", deco: (p, zt) => dots([0, 1, 2, 3, 4, 5, 6, 7].map((i) => [343 + (i % 4) * 4.6, 352.2 + Math.floor(i / 4) * 3.6, zt]), { size: 0.5 }) });
  W.box({ x: 236, y: 352, w: 18, d: 6, z: Z, h: 8, r: 0.6, steps: 2, tone: "lo", sub: [0, 0, 25], name: "audio header", deco: (p, zt) => dots([0, 1, 2, 3].map((i) => [240 + i * 4, 355, zt]), { size: 0.5 }) });
  for (let i = 0; i < 4; i++) {
    W.box({
      x: 218, y: 318 + i * 9.4, w: 18, d: 8, z: Z, h: 7, r: 0.8, steps: 2, bevel: 0.2, tone: "lo", sub: [0, 0, 32 + i * 2], name: "sata " + (i + 1),
      deco: (p, zt) => L(k.onTop([[221, 320.5 + i * 9.4], [231, 320.5 + i * 9.4], [231, 323.8 + i * 9.4], [233, 323.8 + i * 9.4]], zt, P), { tone: "faint" }) + dots([[224, 322 + i * 9.4, zt]], { size: 0.5 }),
    });
  }
  W.cyl({ cx: 335, cy: 300, r: 10, z: Z, h: 3.4, steps: 24, bevel: 0.4, tone: "hi", sub: [0, 0, 47], name: "battery", deco: (zt) => L(k.ring(335, 300, 6.5, zt, P, 20), { tone: "faint" }) + W.textZ(333, 301.4, zt, "+", 4.4, "mid") });
  // filter capacitors beside the socket
  for (let i = 0; i < 5; i++) W.cyl({ cx: 318, cy: 106 + i * 12, r: 3.2, z: Z, h: 9, steps: 14, tone: "mid", sub: [0, 0, 36 + (i % 2) * 5], name: "capacitor", deco: (zt) => L(k.ring(318, 106 + i * 12, 1.8, zt, P, 10), { tone: "faint" }) });

  // rear I/O: the connectors that poke through the shield
  const ports = [
    { y: 72, w: 15, h: 6.5, n: "hdmi" }, { y: 92, w: 11, h: 3.4, n: "usb-c" }, { y: 106, w: 16, h: 14, n: "ethernet" },
    { y: 126, w: 14, h: 15.6, n: "usb-a 1" }, { y: 144, w: 14, h: 15.6, n: "usb-a 2" }, { y: 162, w: 14, h: 15.6, n: "usb-a 3" },
    { y: 180, w: 14, h: 15.6, n: "usb-a 4" }, { y: 198, w: 26, h: 12.4, n: "audio" },
  ];
  for (const [n, p] of ports.entries()) {
    W.box({
      x: 446, y: p.y, w: 22, d: p.w, z: Z, h: p.h, r: 0.8, steps: 2, bevel: 0.2, tone: "mid", sub: [0, 0, 48 + n * 3], name: p.n,
      deco: () => {
        const X = 468;
        let out = L(faceX(X, [p.y + 1.6, p.y + p.w - 1.6], [Z + 1.6, Z + p.h - 1.6], 0.8), { tone: "faint" });
        if (p.n === "ethernet") out += L(k.segment([X, p.y + 4, Z + 2], [X, p.y + 4, Z + 5], P), { tone: "lo" }) + dots([0, 1, 2, 3, 4, 5, 6, 7].map((i) => [X, p.y + 3 + i * 1.3, Z + 3]), { size: 0.35 });
        else if (p.n.startsWith("usb-a")) out += L(k.segment([X, p.y + 3, Z + p.h / 2], [X, p.y + p.w - 3, Z + p.h / 2], P), { tone: "lo" });
        else if (p.n === "audio") out += dots([0, 1, 2].map((i) => [X, p.y + 5 + i * 8, Z + 6.2]), { size: 2, tone: "lo" });
        return out;
      },
    });
  }

  // =================================================================================================================
  // CPU: a green substrate, a bare die and the metal lid over it
  // =================================================================================================================
  W.use("cpu");
  const cx0 = CPU_C[0] - 18.75;
  const cy0 = CPU_C[1] - 22.5;
  const zc = Z + 4.8; // top of the socket
  W.box({
    x: cx0, y: cy0, w: 37.5, d: 45, z: zc, h: 1.2, r: 1, steps: 3, tone: "mid", name: "substrate", sub: [0, 0, 0],
    deco: (p, zt) => {
      let out = L(k.planOutline(k.insetPlan(p, 1.2), zt, P, 3), { tone: "faint" });
      out += L(k.onTop([[cx0 + 1.4, cy0 + 1.4], [cx0 + 6, cy0 + 1.4], [cx0 + 1.4, cy0 + 6]], zt, P, true), { tone: "hi" });
      out += dots([0, 1, 2, 3, 4, 5].flatMap((i) => [[cx0 + 4 + i * 5.8, cy0 + 2.4, zt], [cx0 + 4 + i * 5.8, cy0 + 42.6, zt]]), { size: 0.5, tone: "mid" });
      return out;
    },
  });
  W.box({ x: CPU_C[0] - 8, y: CPU_C[1] - 11, w: 16, d: 22, z: zc + 1.2, h: 1.0, r: 0.6, steps: 2, tone: "hi", name: "die", sub: [0, 0, 8], deco: (p, zt) => L(k.planOutline(k.insetPlan(p, 2), zt, P, 2), { tone: "faint" }) });
  W.box({
    x: cx0 + 3.2, y: cy0 + 3, w: 31.1, d: 39, z: zc + 2.2, h: 2.4, r: 2, steps: 3, bevel: 0.5, tone: "hi", name: "heat spreader", sub: [0, 0, 24],
    deco: (p, zt) => W.textZ(cx0 + 8, CPU_C[1] - 5, zt, "24C · 32T", 3.6, "mid") + W.textZ(cx0 + 8, CPU_C[1] + 3, zt, "LGA", 3.6, "lo") + L(k.planOutline(k.insetPlan(p, 2), zt, P, 3), { tone: "faint" }),
  });
  for (let i = 0; i < 4; i++) {
    const side = i % 2;
    W.box({ x: cx0 + 1.2 + side * 33.2, y: cy0 + 8 + Math.floor(i / 2) * 20, w: 2.8, d: 5, z: zc + 1.2, h: 0.9, r: 0.2, steps: 1, bevel: 0, tone: "lo", name: "smd", sub: [side ? 6 : -6, 0, 3] });
  }
  W.disc({ at: [CPU_C[0], CPU_C[1], zc + 4.6], axis: "z", s0: 0, s1: 0.9, r: 5, steps: 20, tone: "lo", name: "paste", sub: [0, 0, 24], deco: (F) => L(G.circleOf(F, 0.9, 2.4, P, 14), { tone: "faint" }) });

  // =================================================================================================================
  // CPU COOLER: base plate, six heat pipes, a stack of fins, two fans
  // =================================================================================================================
  W.use("cooler");
  const zb = zc + 4.6 + 0.9; // sits on the paste
  const pipeX = [343, 358, 373];
  const pipeY = [117, 147];
  W.box({
    x: 333, y: 104, w: 50, d: 56, z: zb, h: 4, r: 2, steps: 3, bevel: 0.5, tone: "mid", name: "base plate", sub: [0, 0, 0],
    deco: (p, zt) => L(k.planOutline(k.insetPlan(p, 2), zt, P, 3), { tone: "faint" }),
  });
  W.box({
    x: 322, y: 124, w: 72, d: 16, z: zb + 4, h: 3, r: 1.5, steps: 3, bevel: 0.4, tone: "lo", name: "bracket", sub: [0, 0, 12],
    deco: (p, zt) => L(k.ring(326, 132, 2.2, zt, P, 10) + k.ring(390, 132, 2.2, zt, P, 10), { tone: "mid" }) + dots([[326, 132, zt], [390, 132, zt]], { size: 0.7 }),
  });
  for (const px of pipeX) for (const py of pipeY) {
    W.cyl({ cx: px, cy: py, r: 3.1, z: zb + 4, h: 156 - (zb + 4) + 4, steps: 12, bevel: 0.2, tone: "mid", name: "heat pipe", sub: [0, 0, 26] });
  }
  const FIN = { x: 334, y: 80, w: 48, d: 104, z0: 38, z1: 156 };
  W.box({
    x: FIN.x, y: FIN.y, w: FIN.w, d: FIN.d, z: FIN.z0, h: FIN.z1 - FIN.z0, r: 1.2, steps: 3, bevel: 0.5, tone: "hi", name: "fin stack", sub: [0, 0, 70],
    deco: (p, zt) => {
      let out = "";
      for (let z = FIN.z0 + 3; z < FIN.z1 - 1; z += 2.6) out += L(k.segment([FIN.x, FIN.y + FIN.d, z], [FIN.x + FIN.w, FIN.y + FIN.d, z], P), { tone: "faint" });
      for (let z = FIN.z0 + 3; z < FIN.z1 - 1; z += 2.6) out += L(k.segment([FIN.x + FIN.w, FIN.y, z], [FIN.x + FIN.w, FIN.y + FIN.d, z], P), { tone: "faint" });
      return out;
    },
  });
  W.box({
    x: FIN.x, y: FIN.y, w: FIN.w, d: FIN.d, z: FIN.z1, h: 2.4, r: 1.2, steps: 3, bevel: 0.4, tone: "mid", name: "top plate", sub: [0, 0, 70],
    deco: (p, zt) => dots(pipeX.flatMap((px) => pipeY.map((py) => [px, py, zt])), { size: 1.3, tone: "hi" }) + L(k.planOutline(k.insetPlan(p, 2), zt, P, 3), { tone: "faint" }),
  });
  W.fan({ axis: "x", c: [309, 132, 104], name: "cooler fan front", sub: [-44, 0, 0] });
  W.fan({ axis: "x", c: [383, 132, 104], name: "cooler fan rear", sub: [44, 0, 0] });

  // =================================================================================================================
  // MEMORY: two sticks, each a bare board, memory chips and two metal spreaders under a light bar
  // =================================================================================================================
  [["ram0", RAM_X[1]], ["ram1", RAM_X[3]]].forEach(([id, c]) => {
    W.use(id);
    const z0 = Z + 8; // seats on the slot
    const y0 = RAM_Y[0] + 1;
    const len = RAM_Y[1] - RAM_Y[0] - 2;
    W.box({
      x: c - 0.7, y: y0, w: 1.4, d: len, z: z0, h: 31, r: 0.3, steps: 1, bevel: 0, tone: "mid", name: "dimm pcb", sub: [0, 0, 0],
      deco: () => {
        let out = L(faceX(c + 0.7, [y0 + 2, y0 + len - 2], [z0 + 6, z0 + 29], 1), { tone: "faint" });
        // gold fingers along the bottom edge with the key notch
        for (let y = y0 + 2; y < y0 + len - 1; y += 2.2) if (Math.abs(y - (y0 + 63)) > 1.6) out += L(k.segment([c + 0.7, y, z0], [c + 0.7, y, z0 + 3.2], P), { tone: "hi" });
        return out;
      },
    });
    for (let n = 0; n < 4; n++) {
      W.box({ x: c + 0.7, y: y0 + 6 + n * 31, w: 1, d: 22, z: z0 + 8, h: 17, r: 0.4, steps: 1, bevel: 0, tone: "lo", name: "dram chip", sub: [4, 0, 0], deco: () => L(faceX(c + 1.7, [y0 + 8 + n * 31, y0 + 26 + n * 31], [z0 + 10, z0 + 23], 0.6), { tone: "faint" }) });
    }
    W.box({
      x: c + 1.7, y: y0, w: 1.7, d: len, z: z0 + 4, h: 27, r: 0.3, steps: 1, bevel: 0.2, tone: "hi", name: "spreader right", sub: [16, 0, 0],
      deco: () => {
        let out = L(faceX(c + 3.4, [y0 + 3, y0 + len - 3], [z0 + 7, z0 + 29], 1.5), { tone: "faint" });
        for (let i = 0; i < 5; i++) out += L(k.segment([c + 3.4, y0 + 8 + i * 4, z0 + 7], [c + 3.4, y0 + 8 + i * 4, z0 + 29], P), { tone: "faint" });
        return out + W.textX(c + 3.4, y0 + len - 12, z0 + 12, "DDR5", 5, "mid", "start");
      },
    });
    W.box({ x: c - 3.4, y: y0, w: 2.7, d: len, z: z0 + 4, h: 27, r: 0.3, steps: 1, bevel: 0.2, tone: "mid", name: "spreader left", sub: [-16, 0, 0] });
    W.box({
      x: c - 3.4, y: y0, w: 6.8, d: len, z: z0 + 31, h: 5.2, r: 1.2, steps: 2, bevel: 0.3, tone: "hi", lit: false, name: "light bar", sub: [0, 0, 18],
      deco: (p, zt) => L(k.planOutline({ x: c - 1.8, y: y0 + 4, w: 3.6, d: len - 8, r: 1.2 }, zt, P, 3), { tone: "lit" }),
    });
  });

  // =================================================================================================================
  // M.2 SSD: a small board with flash chips, a controller, a thermal pad and a shield
  // =================================================================================================================
  W.use("m2");
  const mz = Z + 2.8 + 0.001; // rests on the socket and the post
  W.box({
    x: 362, y: 212, w: 80, d: 22, z: mz, h: 1.0, r: 1.2, steps: 3, tone: "mid", name: "m2 pcb", sub: [0, 0, 0],
    deco: (p, zt) => L(k.planOutline(k.insetPlan(p, 1.2), zt, P, 3), { tone: "faint" }) + L(k.ring(366, 223, 2.2, zt, P, 10), { tone: "lo" }) + dots([[366, 223, zt]], { size: 0.6 }),
  });
  const chip = (x, w, d, name, sub, y = 215) => W.box({ x, y, w, d, z: mz + 1, h: 1.0, r: 0.5, steps: 2, tone: "hi", name, sub, deco: (p, zt) => L(k.planOutline(k.insetPlan(p, 1.2), zt, P, 2), { tone: "faint" }) });
  chip(372, 14, 14, "nand a", [0, 0, 5]);
  chip(390, 14, 14, "nand b", [0, 0, 8]);
  chip(408, 10, 10, "controller", [0, 0, 11], 217);
  chip(422, 8, 7, "dram cache", [0, 0, 14], 219);
  W.box({ x: 366, y: 213.6, w: 70, d: 18.8, z: mz + 2, h: 0.8, r: 1, steps: 2, tone: "lo", name: "thermal pad", sub: [0, 0, 24] });
  W.box({
    x: 364, y: 213, w: 74, d: 20, z: mz + 2.8, h: 3.4, r: 1.6, steps: 3, bevel: 0.5, tone: "hi", name: "shield", sub: [0, 0, 42],
    deco: (p, zt) => {
      let out = L(k.planOutline(k.insetPlan(p, 1.6), zt, P, 3), { tone: "faint" });
      for (let x = 372; x < 436; x += 4) out += L(k.lineOnTop([x, 215], [x, 231], zt, P), { tone: "faint" });
      return out + dots([[367, 223, zt]], { size: 0.8 });
    },
  });
}
