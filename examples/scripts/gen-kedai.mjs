// Synthesizes the KedaiLaunch soundtrack: an original warm pad bed at 100 BPM
// in D major, soft kick and pluck under the UI scenes, whooshes on every camera
// push, ticks on every rack focus and card landing, and the order "ding" as the
// loudest event. Every hit is derived from src/kedai/timing.json, the same file
// the video reads.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = JSON.parse(readFileSync(join(ROOT, "src", "kedai", "timing.json"), "utf8"));
const OUT = join(ROOT, "public", "sfx");
mkdirSync(OUT, { recursive: true });

const SR = 44100;
const FPS = T.fps;
const BEAT = 60 / T.bpm;
const DUR = T.total / FPS;
const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const tf = (frame) => frame / FPS;
const S = T.shots;

let seed = 7;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647 - 0.5;
};
const add = (start, dur, fn, pan = 0) => {
  const s0 = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  const gl = Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n && s0 + i < N; i++) {
    if (s0 + i < 0) continue;
    const v = fn(i / SR, i / n);
    L[s0 + i] += v * gl;
    R[s0 + i] += v * gr;
  }
};
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---------- music bed ----------
// music volume envelope: silent first second, dips around the ding, fades at the credit
const ding = S.payoff.from + T.payoff.open + 6;
const musicGain = (t) => {
  const f = t * FPS;
  const inn = Math.min(1, Math.max(0, (f - 26) / 30));
  const dip = f > ding - 8 && f < ding + 12 ? 0.3 : 1;
  const out = Math.min(1, Math.max(0, (T.total - 20 - f) / 70));
  return inn * dip * out;
};
const pad = (t0, notes, dur, vel = 0.045) => {
  for (const [i, m] of notes.entries()) {
    for (const det of [0.996, 1.004]) {
      let ph = i * 1.3;
      add(t0, dur, (ts, p) => {
        ph += (2 * Math.PI * midi(m) * det) / SR;
        const env = Math.min(1, ts / 0.5) * Math.min(1, (1 - p) * 5);
        // soft triangle-ish: fundamental + weak 2nd/3rd harmonics
        const v = Math.sin(ph) + 0.25 * Math.sin(2 * ph) + 0.1 * Math.sin(3 * ph);
        return v * env * vel * musicGain(t0 + ts);
      }, det < 1 ? -0.45 : 0.45);
    }
  }
};
// D major: Dmaj9 – Bm9 – Gmaj7 – A6, one chord per bar
const CHORDS = [
  [50, 57, 61, 64, 66],
  [47, 54, 57, 62, 66],
  [43, 50, 54, 59, 62],
  [45, 52, 57, 61, 66],
];
const BAR = 4 * BEAT;
for (let bar = 0; bar * BAR < DUR; bar++) {
  pad(bar * BAR, CHORDS[bar % 4], BAR + 0.5);
}
const kick = (t, vel = 0.5) => {
  let ph = 0;
  add(t, 0.32, (ts, p) => {
    ph += (2 * Math.PI * (48 + 90 * Math.exp(-ts * 30))) / SR;
    return Math.sin(ph) * Math.exp(-p * 5) * vel * musicGain(t);
  });
};
const pluck = (t, m, vel = 0.07, pan = 0) => {
  let ph = 0;
  add(t, 0.35, (ts, p) => {
    ph += (2 * Math.PI * midi(m)) / SR;
    return (Math.sin(ph) + 0.3 * Math.sin(3 * ph)) * Math.exp(-p * 6) * vel * musicGain(t);
  }, pan);
};
// soft kick on every beat while the UI is on screen, then out for the tagline
for (let t = Math.ceil(tf(S.products.from) / BEAT) * BEAT; t < tf(S.line1.from); t += BEAT) kick(t, 0.42);
// pluck arpeggio under the dashboard and tagline
for (let t = Math.ceil(tf(S.live.from) / (BEAT / 2)) * (BEAT / 2), k = 0; t < tf(ding) - 0.3; t += BEAT / 2, k++) {
  const chord = CHORDS[Math.floor(t / BAR) % 4];
  pluck(t, chord[(k * 2) % chord.length] + 12, 0.06, k % 2 ? 0.3 : -0.3);
}
// back in after the ding
for (let t = Math.ceil(tf(ding + 12) / BEAT) * BEAT; t < tf(S.credit.from); t += BEAT) kick(t, 0.3);

// ---------- sfx ----------
// filtered-noise whoosh whose cutoff sweeps up then down
const whoosh = (frame, dur = 0.45, vel = 0.28, pan = 0) => {
  let lp = 0;
  const t0 = tf(frame) - dur * 0.6; // peaks just before the visual lands
  add(t0, dur, (ts, p) => {
    const cut = 0.02 + 0.25 * Math.sin(Math.PI * p);
    lp += cut * (rnd() - lp);
    return lp * 4 * Math.sin(Math.PI * p) ** 2 * vel;
  }, pan);
};
const tick = (frame, vel = 0.12, pitch = 2400) => {
  let ph = 0;
  add(tf(frame), 0.06, (ts, p) => {
    ph += (2 * Math.PI * pitch) / SR;
    return (Math.sin(ph) * 0.7 + rnd() * 0.3) * Math.exp(-p * 9) * vel;
  });
};
const chime = (t, m, vel) => {
  for (const [h, a] of [[1, 1], [2.76, 0.25], [5.4, 0.08]]) {
    let ph = 0;
    add(t, 1.6, (ts) => {
      ph += (2 * Math.PI * midi(m) * h) / SR;
      return Math.sin(ph) * Math.exp(-ts * (3 + h)) * a * vel;
    });
  }
};
const boom = (frame, vel = 0.5) => {
  let ph = 0;
  add(tf(frame), 1.2, (ts, p) => {
    ph += (2 * Math.PI * (40 + 30 * Math.exp(-ts * 8))) / SR;
    return Math.sin(ph) * Math.exp(-p * 3.5) * vel;
  });
};
const riser = (endFrame, dur = 0.35, vel = 0.2) => {
  let lp = 0;
  add(tf(endFrame) - dur, dur, (ts, p) => {
    lp += (0.02 + 0.3 * p) * (rnd() - lp);
    return lp * 4 * p * p * vel;
  });
};

// logo hits: ring draws, then the wordmark opens; same again for the outro
for (const s of [S.logo, S.outro]) {
  boom(s.from + 2, 0.16);
  chime(tf(s.from + 15), 81, 0.05);
}
// camera pushes and the takeover
whoosh(S.device.from + 2, 0.5, 0.22, -0.3);
whoosh(S.device.from + T.device.takeover + 10, 0.6, 0.34);
whoosh(S.live.from + 4, 0.5, 0.24, 0.3);
whoosh(S.outro.from + 4, 0.55, 0.2);
// lock -> home screen clicks
tick(S.device.from + T.device.lock, 0.08, 1800);
tick(S.device.from + T.device.home, 0.08, 1800);
// rows filling, then every rack focus
for (let i = 0; i < 6; i++) tick(S.products.from + T.products.fill + i * 4 + 4, 0.04, 3200);
for (const [f] of T.products.focus) tick(S.products.from + f, 0.13, 2100);
// dashboard cards landing and the two counters flipping
for (let i = 0; i < 6; i++) tick(S.live.from + 10 + i * T.live.cardStagger, 0.05, 2800);
tick(S.live.from + T.live.visitor, 0.16, 2600);
tick(S.live.from + T.live.cart, 0.16, 2600);
// streak words
for (const k of ["line1", "line2"]) {
  const l = T.lines[k];
  l.words.forEach((_, i) => whoosh(S[k].from + i * l.stagger + 3, 0.18, 0.08, (i / (l.words.length - 1)) * 0.6 - 0.3));
}
// the line collapsing into the pill, then THE ding — loudest event in the mix
riser(S.line2.from + T.lines.line2.collapse + 10, 0.4, 0.18);
chime(tf(ding), 88, 0.5);
chime(tf(ding) + 0.11, 95, 0.46);
// credit shimmer
chime(tf(S.credit.from + 4), 93, 0.06);
chime(tf(S.credit.from + 8), 100, 0.04);

// ---------- master ----------
let peak = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * 1.1);
  R[i] = Math.tanh(R[i] * 1.1);
  peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
}
const gain = 0.89 / peak;
const buf = Buffer.alloc(44 + N * 4);
buf.write("RIFF", 0);
buf.writeUInt32LE(36 + N * 4, 4);
buf.write("WAVE", 8);
buf.write("fmt ", 12);
buf.writeUInt32LE(16, 16);
buf.writeUInt16LE(1, 20);
buf.writeUInt16LE(2, 22);
buf.writeUInt32LE(SR, 24);
buf.writeUInt32LE(SR * 4, 28);
buf.writeUInt16LE(4, 32);
buf.writeUInt16LE(16, 34);
buf.write("data", 36);
buf.writeUInt32LE(N * 4, 40);
for (let i = 0; i < N; i++) {
  buf.writeInt16LE(Math.round(L[i] * gain * 32767), 44 + i * 4);
  buf.writeInt16LE(Math.round(R[i] * gain * 32767), 46 + i * 4);
}
writeFileSync(join(OUT, "kedai-track.wav"), buf);
console.log(`kedai-track.wav written: ${DUR.toFixed(2)}s stereo, pre-gain peak ${peak.toFixed(2)}`);
