// The amp as arithmetic. Everything the figure shows (cone travel, plate glow,
// pointer angle, readout) is read from here.
//
// Signal chain, all in volts:
//   guitar -> V1 -> gain pot -> V2 -> tone stack -> master pot -> V3/V4 push-pull -> output transformer -> speaker
// Each tube stage is gain `g` that saturates smoothly at `sat` volts: sat * tanh(g * x / sat).

export const IN_PEAK = 0.3; // a guitar's pickup, volts peak
export const V1 = { g: 20, sat: 40 };
export const V2 = { g: 45, sat: 80 };
export const TONE = 0.1; // the passive tone stack gives up 20 dB
export const POWER = { g: 10, sat: 45 };
export const SAMPLES = 256;

export const taper = (knob) => (knob / 10) ** 2; // an audio-taper pot
const tube = (x, { g, sat }) => sat * Math.tanh((g * x) / sat);

// One instant of the whole chain, phase in cycles.
export function chain(phase, gain, master) {
  const input = IN_PEAK * Math.sin(phase * Math.PI * 2);
  const v1 = tube(input, V1);
  const v2 = tube(v1 * taper(gain), V2);
  const v3 = tube(v2 * TONE * taper(master), POWER);
  return {
    input,
    v1,
    v2,
    v3,
    // how hard each tube is working, 0..1, for plate current and glow
    load: [Math.abs(v1) / V1.sat, Math.abs(v2) / V2.sat, Math.abs(v3) / POWER.sat],
    cone: v3 / POWER.sat, // -1..1 of the cone's travel
  };
}

// A whole cycle, for the readout.
export function measure(gain, master) {
  const out = [];
  for (let i = 0; i < SAMPLES; i++) out.push(chain(i / SAMPLES, gain, master).v3);
  const harmonic = (n) => {
    let re = 0;
    let im = 0;
    for (let i = 0; i < SAMPLES; i++) {
      const a = (2 * Math.PI * n * i) / SAMPLES;
      re += out[i] * Math.cos(a);
      im += out[i] * Math.sin(a);
    }
    return Math.hypot(re, im) / (SAMPLES / 2);
  };
  const first = harmonic(1);
  let rest = 0;
  for (let n = 2; n <= 12; n++) rest += harmonic(n) ** 2;
  const peak = Math.max(...out.map(Math.abs));
  return { peak, thd: first > 1e-9 ? Math.sqrt(rest) / first : 0 };
}

// How hard each of the three stages works over a whole cycle, 0..1 (rms of its load).
// The figure heats each tube's glow from this: the gain pot sits after V1, so V1 stays
// dim while V2 and the power tubes warm as Gain rises.
export function heat(gain, master) {
  const n = 64;
  const sum = [0, 0, 0];
  for (let i = 0; i < n; i++) {
    const l = chain(i / n, gain, master).load;
    for (let s = 0; s < 3; s++) sum[s] += l[s] * l[s];
  }
  return sum.map((v) => Math.sqrt(v / n));
}

export const readoutOf =(gain, master) => {
  const m = measure(gain, master);
  return `gain ${gain.toFixed(1)} · out ${m.peak.toFixed(0)} V · distortion ${(m.thd * 100).toFixed(0)}%`;
};
