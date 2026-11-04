const part = (id) => `[data-part="${id}"]`;
const turnUp = Array.from({ length: 8 }, () => ["key", "ArrowRight"]);
const turnDown = Array.from({ length: 8 }, () => ["key", "ArrowLeft"]);

// Numbers come from amp.mjs: 0.3 V in, distortion 7% at Gain 5 and 29% at Gain 10 (master 6).
export default {
  page: "tube-amp-light.html",
  out: "tube-amp",
  layers: ".iso-stage > svg",
  strip: [".iso-pool", ".iso-bloom", ".iso-core", ".iso-lamp", ".iso-lamp-halo", ".iso-hit", ".amp-labels"],
  reduced: true,
  views: {
    rest: {},
    drive: { actions: [...turnUp, ["wait", 500]], reset: [...turnDown, ["wait", 500]] },
    apart: { actions: [["key", " "], ["wait", 800]], reset: [["key", " "], ["wait", 800]] },
  },

  name: "Tube guitar amp",
  title: "Tube guitar amp: how gain becomes crunch",
  number: "AN-004",
  tagline: "Three tubes, one curve",
  question: "Why does a tube amp distort when you turn it up?",
  lead: "A guitar pickup makes about 0.3 V. Each tube stage multiplies the signal, but a tube can only swing so far, so it rounds off the tops of loud waves instead of cutting them. Turn Gain up and the second preamp tube runs out of headroom first, then the power tubes. The speaker cone follows whatever shape comes out.",
  quote: "Louder in, rounder out",
  numbers: [
    ["0.3", "V", "from the pickup"],
    ["3", "tube stages", "gain and soft-clip"],
    ["7", "%", "distortion at Gain 5"],
    ["29", "%", "distortion at Gain 10"],
  ],
  spec: [
    ["Input", "0.3 V peak"],
    ["Preamp V1", "gain 20, clips at 40 V"],
    ["Preamp V2", "gain 45, clips at 80 V"],
    ["Tone stack", "loses 20 dB"],
    ["Power tubes", "gain 10, clip at 45 V"],
    ["Gain pot", "audio taper, (knob / 10) squared"],
  ],
  why: {
    title: "Why does it sound warm?",
    text: "A tube saturates smoothly, like a curve flattening out, not like a wall. The rounded tops add harmonics, mostly gentle ones, which is the crunch players ask for.",
  },

  parts: [
    { id: "jack", name: "Input jack", say: "Where the guitar plugs in.", select: part("jack") },
    { id: "pre", name: "Preamp tubes V1, V2", say: "Small tubes that raise the 0.3 V signal and start to clip.", select: `${part("tube-v1")}, ${part("tube-v2")}` },
    { id: "gain", name: "Gain knob", say: "A pot between V1 and V2 that sets how hard V2 is driven.", select: part("knob-gain") },
    { id: "tone", name: "Tone knobs", say: "Bass, mid and treble pots in the passive tone stack.", select: `${part("knob-bass")}, ${part("knob-mid")}, ${part("knob-treble")}` },
    { id: "master", name: "Master knob", say: "Sets how hard the power tubes are driven.", select: part("knob-master") },
    { id: "power", name: "Power tubes V3, V4", say: "Large tubes that give the signal enough current for a speaker.", select: `${part("tube-v3")}, ${part("tube-v4")}` },
    { id: "xfmr", name: "Output transformer", say: "Steps the high-voltage tube signal down to drive the speaker.", select: part("xfmr-output") },
    { id: "supply", name: "Power transformer", say: "Makes the high voltage the tubes run on.", select: part("xfmr-power") },
    { id: "caps", name: "Filter capacitors", say: "Smooth the supply so the amp does not hum.", select: part("caps") },
    { id: "choke", name: "Choke", say: "Helps filter the supply.", select: part("choke") },
    { id: "cable", name: "Speaker cable", say: "Carries the output to the cabinet.", select: part("cable") },
    { id: "speaker", name: "Speaker", say: "The cone moves with the clipped wave.", select: `${part("speaker")}, ${part("cone")}` },
  ],

  wideDrawing: true,
  main: { view: "rest" },
  inset: { label: "Exploded", view: "apart" },
  steps: [
    { view: "rest", title: "The pickup signal", text: "A guitar makes about 0.3 V and enters the input jack.", focus: ["jack"] },
    { view: "rest", title: "Preamp tubes gain it", text: "V1 multiplies the signal by 20 and V2 by 45, with the Gain pot between them.", focus: ["pre", "gain"] },
    { view: "drive", title: "V2 runs out of room", text: "At high Gain V2 reaches its 80 V limit and rounds off the wave tops.", focus: ["pre", "gain"] },
    { view: "drive", title: "Power tubes push it", text: "After the tone stack and Master, V3 and V4 add current and clip a little more.", focus: ["tone", "master", "power"] },
    { view: "drive", title: "The cone follows", text: "The output transformer drives the speaker, and the cone moves with the flattened wave.", focus: ["xfmr", "cable", "speaker"] },
  ],
  details: [
    { view: "drive", title: "The tubes", text: "Cathode, grid and plate inside glass; they glow brighter as they work harder.", around: ["pre", "power"], focus: ["pre", "power"] },
    { view: "drive", title: "The controls", text: "Gain, three tone knobs and Master along the front.", around: ["gain", "master"], focus: ["gain", "tone", "master"] },
    { view: "drive", title: "The speaker", text: "A paper cone in a basket, behind the grille cloth.", around: ["speaker"], focus: ["speaker"] },
  ],
};
