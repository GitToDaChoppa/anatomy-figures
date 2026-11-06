// The PC as data. Everything the figure says (step numbers, specs, wattage, the order parts leave in)
// is read from here, so the picture, the legend and the readout can't disagree.
//
// Draw numbers are "typical gaming load" estimates for the parts named, not measurements of one product.

export const PSU_WATTS = 850;

// Assemblies, in the order a person builds them. `step` is the build-guide step (several parts can share one).
// `move` is the explode vector in world mm (x = front→rear, y = top→bottom of the tower, z = out of the board).
// `tip` is the one-line "how it goes in" for the guide.
export const ASSEMBLIES = [
  { id: "psu", step: 1, name: "Power supply", short: "PSU", watts: 0, spec: "850 W · 80+ Gold · ATX 3.1 · fully modular", tip: "Goes in first: fan down over the floor vent, label up. It slides in from the rear and takes four screws.", slide: [150, 0, 0], move: [0, 0, 0] },
  { id: "fan0", step: 2, name: "Front fan 1", short: "FAN", watts: 2, spec: "120 mm · 1,500 rpm · 70 CFM", tip: "Front fans pull cool air in. Arrow on the frame points the way the air goes.", slide: [0, 10, 0], move: [0, 0, 0] },
  { id: "fan1", step: 2, name: "Front fan 2", short: "FAN", watts: 2, spec: "120 mm · 1,500 rpm · 70 CFM", tip: "Four screws through the front panel into the frame. Mount all three before the board goes in.", slide: [0, 100, 0], move: [0, 0, 0] },
  { id: "fan2", step: 2, name: "Front fan 3", short: "FAN", watts: 2, spec: "120 mm · 1,500 rpm · 70 CFM", tip: "Each fan has a 3- or 4-pin lead. Plug it into a case-fan header, or a hub that goes to one.", slide: [0, 190, 0], move: [0, 0, 0] },
  { id: "fan3", step: 2, name: "Top fan 1", short: "FAN", watts: 2, spec: "120 mm · 1,500 rpm · 70 CFM", tip: "Top fans push the warm air out. Air flows front → across the board → up and out.", slide: [40, 0, 0], move: [0, 0, 0] },
  { id: "fan4", step: 2, name: "Top fan 2", short: "FAN", watts: 2, spec: "120 mm · 1,500 rpm · 70 CFM", tip: "Both top fans blow the same way, out. Check the arrow before you screw them in.", slide: [150, 0, 0], move: [0, 0, 0] },
  { id: "io", step: 3, name: "I/O shield", short: "I/O", watts: 0, spec: "Rear port cut-out · steel · snaps in from inside", tip: "Snap it into the rear opening before the board goes in. It cannot be fitted afterwards.", slide: [100, 0, 0], move: [0, 0, 0] },
  { id: "board", step: 4, name: "Motherboard", short: "BOARD", watts: 40, spec: "ATX 305 × 244 mm · LGA socket · 4 × DDR5 · PCIe 5.0 x16", tip: "Ports into the shield first, then lower it onto the nine standoffs and add nine screws.", slide: [0, 0, 0], move: [0, 0, 40] },
  { id: "cpu", step: 5, name: "Processor", short: "CPU", watts: 150, spec: "24 cores · 125 W base, 253 W boost · 37.5 × 45 mm", tip: "Match the corner triangle to the socket. It drops in with no force; the lever locks it.", slide: [0, 0, 0], move: [0, 0, 152] },
  { id: "ram0", step: 6, name: "Memory stick A", short: "RAM A", watts: 6, spec: "16 GB DDR5-6000 · CL30 · 1.35 V", tip: "Two sticks go in slots 2 and 4 from the CPU for dual channel. Press until both clips click.", slide: [45, -40, 0], move: [0, 0, 187] },
  { id: "ram1", step: 6, name: "Memory stick B", short: "RAM B", watts: 6, spec: "16 GB DDR5-6000 · CL30 · 1.35 V", tip: "Same kit, same speed. Match the notch to the key in the slot.", slide: [45, -40, 0], move: [0, 0, 253] },
  { id: "m2", step: 7, name: "NVMe SSD", short: "M.2", watts: 8, spec: "1 TB · PCIe 4.0 x4 · M.2 2280 · 7,000 MB/s", tip: "Slide in at 30°, press flat, one screw at the 80 mm notch. Heatsink pad on top.", slide: [108, -98, 0], move: [0, 0, 91] },
  { id: "cooler", step: 8, name: "CPU cooler", short: "COOLER", watts: 6, spec: "Single-tower air · 6 heat pipes · 2 × 120 mm", tip: "A pea of paste on the CPU, then four screws a turn at a time in a cross pattern. Plug the fan into CPU_FAN.", slide: [26, -23, 0], move: [0, 0, 404] },
  { id: "ssd", step: 9, name: "SATA SSD", short: "SSD", watts: 3, spec: "2 TB · SATA III 2.5 in · 560 MB/s", tip: "Screws to the drive plate. Two connectors: data to the board, power to the PSU.", slide: [-29, 26, 0], move: [0, 0, 61] },
  { id: "gpu", step: 10, name: "Graphics card", short: "GPU", watts: 300, spec: "16 GB GDDR7 · 2.5-slot · PCIe 5.0 x16 · 12V-2×6", tip: "Remove three slot covers, press into the top x16 slot until the latch clicks, then screw the bracket to the case.", slide: [-86, 77, 0], move: [0, 0, 273] },
  { id: "cabsata", step: 11, name: "SATA power cable", short: "SATA", watts: 0, spec: "3.3 V · 5 V · 12 V · 15-pin", tip: "L-shaped key: it only goes in one way. Plug the other end into the PSU first.", slide: [-147, 132, 0], move: [0, 0, 212] },
  { id: "cab24", step: 11, name: "24-pin ATX cable", short: "24-PIN", watts: 0, spec: "3.3 V · 5 V · 12 V to the board", tip: "Latch clicks. Firm, even pressure along the whole plug. The PSU end goes in first.", slide: [-77, 69, 0], move: [0, 0, 334] },
  { id: "cabcpu", step: 11, name: "8-pin CPU cable", short: "EPS", watts: 0, spec: "12 V · 4+4 pin · up to 336 W to the processor", tip: "Top edge of the board. Not the PCIe cable: the keys differ on purpose.", slide: [64, -57, 0], move: [0, 0, 425] },
  { id: "cabgpu", step: 11, name: "GPU power cable", short: "12V-2×6", watts: 0, spec: "12V-2×6 · 600 W max · to the graphics card", tip: "Push until fully seated and flush, then bend the cable away from the plug.", slide: [-13, 11, 0], move: [0, 0, 495] },
  { id: "glass", step: 12, name: "Glass side panel", short: "GLASS", watts: 0, spec: "4 mm tempered glass · 4 thumbscrews", tip: "Last. Rest it on the bottom lip, swing it in, four thumbscrews. Hand-tight only.", slide: [0, 0, 0], move: [0, 0, 566] },
];

export const CASE_INFO = { id: "case", step: 0, name: "Case", short: "CASE", spec: "ATX mid-tower · 3 front + 2 top fan mounts", tip: "Lay it on its side. The motherboard tray becomes your workbench." };

export const byId = Object.fromEntries([CASE_INFO, ...ASSEMBLIES].map((a) => [a.id, a]));
export const STEPS = [...new Set(ASSEMBLIES.map((a) => a.step))].sort((a, b) => a - b);

// What the parts you've built so far draw under a gaming load, watts.
export function drawOf(installed) {
  return ASSEMBLIES.filter((a) => installed.has(a.id)).reduce((sum, a) => sum + a.watts, 0);
}

export const readoutOf = ({ installed, total, selected }) => {
  if (selected) {
    const a = byId[selected];
    return `${a.step ? String(a.step).padStart(2, "0") + " · " : ""}${a.name} · ${a.spec}`;
  }
  const w = drawOf(installed);
  const n = installed.size;
  return n === total ? `built · ${total} parts · ~${w} W of ${PSU_WATTS} W (${Math.round((w / PSU_WATTS) * 100)}%)` : `${n} of ${total} parts in · ~${w} W of ${PSU_WATTS} W`;
};
