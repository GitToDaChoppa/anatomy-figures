// node setmoves.mjs : writes each assembly's lift and slide into pc.mjs from the table below.
// Targets are given as screen offsets in the final viewBox px, measured from where the part sits when assembled:
//   For parts with an axis, side is millimetres along that world axis.
//   up   = how far the part rises on screen (px), turned into a lift in mm along z
//   side = how far it then slides across the screen (px, + is right), turned into a slide along the "screen right" axis
// Wall-mounted parts and the PSU slide along their own axes instead (see AXIS).
import { readFileSync, writeFileSync } from "node:fs";

// nominal px per mm, fixed so the table below doesn't drift when the camera refits (the figure scales to fit the card)
const U = [[0.866, 0.413], [-0.78, 0.459], [0, -0.989]];
const PX_Z = -U[2][1]; // px per mm of lift
const PX_R = U[0][0] + 0.9 * Math.abs(U[1][0]); // px per mm of x when y moves -0.9 per x (stays level on screen)
const AXIS = { x: [1, 0, 0], y: [0, 1, 0] };

// [up px, side px, axis?]
const T = JSON.parse(readFileSync(new URL("./layout.json", import.meta.url), "utf8"));

const lines = readFileSync(new URL("./pc.mjs", import.meta.url), "utf8").split("\n");
for (const [id, [up, side, axis]] of Object.entries(T)) {
  const n = lines.findIndex((l) => l.includes(`{ id: "${id}",`));
  if (n < 0) throw new Error("no assembly " + id);
  const lift = Math.round(up / PX_Z);
  let slide;
  if (axis) slide = AXIS[axis].map((v) => v * side);
  else { const a = side / PX_R; slide = [Math.round(a), Math.round(-0.9 * a), 0]; }
  const line = lines[n];
  const cut = line.indexOf("slide:");
  lines[n] = line.slice(0, cut) + `slide: [${slide.join(", ")}], move: [0, 0, ${lift}] },`;
}
writeFileSync(new URL("./pc.mjs", import.meta.url), lines.join("\n"));
console.log("moves written from layout.json");
