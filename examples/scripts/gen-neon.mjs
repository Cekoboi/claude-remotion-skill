// Synthesizes the MalaysiaNeon soundtrack: an original stereo synthwave piece
// at 100 BPM in D minor, with a serunai-and-gendang section for the wayang
// kulit scene. Every neon tube's ignition replays the visual flicker pattern
// as buzz-clicks, and every scene ends on a power-cut zap. All timing comes
// from src/neon/timing.json, the same file the video reads.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = JSON.parse(readFileSync(join(ROOT, "src", "neon", "timing.json"), "utf8"));
const OUT = join(ROOT, "public", "sfx");
mkdirSync(OUT, { recursive: true });

const SR = 44100;
const FPS = T.fps;
const BEAT = 60 / T.bpm;
const ORDER = ["kinabalu", "wayang", "nasi", "malaysia"];
const START = {};
let acc = 0;
for (const k of ORDER) {
  START[k] = acc;
  acc += T.scenes[k];
}
const TOTAL = acc;
const DUR = TOTAL * BEAT;
const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const b = (beat) => beat * BEAT;
// frame-accurate: same rounding as beatFrame() in neonKit
const frameOf = (beat) => Math.round(beat * ((FPS * 60) / T.bpm));
const tf = (frame) => frame / FPS;

let seed = 21;
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

// ---------- synths ----------
// band-limited-ish saw: first 8 harmonics
const saw = (ph) => {
  let s = 0;
  for (let h = 1; h <= 8; h++) s += Math.sin(ph * h) / h;
  return s * 0.55;
};
const pad = (t, notes, dur, vel = 0.05) => {
  for (const [i, m] of notes.entries()) {
    for (const det of [0.997, 1.003]) {
      let ph = i;
      add(t, dur, (ts, p) => {
        ph += (2 * Math.PI * midi(m) * det) / SR;
        const env = Math.min(1, ts / 0.4) * Math.min(1, (1 - p) * 6);
        return saw(ph) * env * vel;
      }, det < 1 ? -0.5 : 0.5);
    }
  }
};
const pluck = (t, m, vel = 0.12, pan = 0) => {
  let ph = 0;
  add(t, 0.22, (ts, p) => {
    ph += (2 * Math.PI * midi(m)) / SR;
    return (Math.sign(Math.sin(ph)) * 0.5 + Math.sin(ph)) * Math.exp(-p * 7) * vel;
  }, pan);
};
const bass = (t, m, len = BEAT / 2, vel = 0.32) => {
  let ph = 0;
  let lp = 0;
  add(t, len, (ts, p) => {
    ph += (2 * Math.PI * midi(m)) / SR;
    lp += 0.12 * (saw(ph) - lp);
    return lp * Math.min(1, ts * 300) * Math.exp(-p * 2.2) * vel * 2;
  });
};
const kick = (t, vel = 0.9) =>
  add(t, 0.3, (ts, p) => Math.sin(2 * Math.PI * (140 - 100 * Math.min(1, ts * 12)) * ts) * Math.exp(-p * 6) * vel);
const snare = (t, vel = 0.4) => {
  // gated-reverb snare: noise body, held, then chopped
  add(t, 0.28, (ts, p) => (rnd() * 2 * 0.7 + Math.sin(2 * Math.PI * 190 * ts) * 0.4 * Math.exp(-ts * 30)) * (p < 0.8 ? 1 - p * 0.4 : (1 - p) * 3) * vel);
};
const hat = (t, vel = 0.07, pan = 0.3) => add(t, 0.04, (ts, p) => rnd() * 2 * Math.exp(-p * 8) * vel, pan);
const gong = (t, vel = 0.55) =>
  add(t, 4.5, (ts) => {
    const env = Math.min(1, ts * 200) * Math.exp(-ts * 0.8);
    return (Math.sin(2 * Math.PI * 82 * ts) + 0.6 * Math.sin(2 * Math.PI * 82.4 * ts) + 0.3 * Math.sin(2 * Math.PI * 166 * ts) * Math.exp(-ts * 2)) * env * vel;
  });
const gendang = (t, high, vel = 0.5, pan = 0) =>
  add(t, high ? 0.12 : 0.3, (ts, p) => {
    const f = high ? 330 : 95 - 30 * Math.min(1, ts * 10);
    return (Math.sin(2 * Math.PI * f * ts) * 0.8 + rnd() * (high ? 0.5 : 0.15) * Math.exp(-ts * 50)) * Math.exp(-p * (high ? 10 : 6)) * vel;
  }, pan);
// serunai: nasal double reed — square-ish wave, formant-y emphasis, vibrato
const serunai = (t, m, dur, vel = 0.12) => {
  let ph = 0;
  let bp1 = 0;
  let bp2 = 0;
  add(t, dur, (ts, p) => {
    const vib = Math.sin(2 * Math.PI * 6 * ts) * 0.008 * Math.min(1, ts * 4);
    ph += (2 * Math.PI * midi(m) * (1 + vib)) / SR;
    const x = Math.tanh(Math.sin(ph) * 3) + 0.3 * Math.sin(3 * ph);
    bp1 += 0.25 * (x - bp1);
    bp2 += 0.25 * (bp1 - bp2);
    const env = Math.min(1, ts * 25) * Math.min(1, (1 - p) * 8);
    return (x - bp2) * env * vel;
  }, 0.15);
};

// ---------- neon sounds ----------
// buzz-click for every lit frame of the ignite pattern
const ignite = (frame, vel = 0.12, pan = 0) => {
  T.flicker.ignite.forEach((on, i) => {
    if (!on) return;
    const t = tf(frame + i);
    let ph = 0;
    add(t, 1 / FPS, (ts, p) => {
      ph += (2 * Math.PI * 120) / SR;
      return (Math.sign(Math.sin(ph)) * 0.4 + rnd() * 0.6) * (1 - p * 0.5) * vel;
    }, pan);
    add(t, 0.006, () => rnd() * 2 * vel * 1.6, pan);
  });
};
const hum = (from, to, vel = 0.018) => {
  let ph = 0;
  add(from, to - from, (ts, p) => {
    ph += (2 * Math.PI * 120) / SR;
    return (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.3 * Math.sign(Math.sin(3 * ph))) * Math.min(1, ts * 4) * Math.min(1, (1 - p) * 30) * vel;
  });
};
const powerCut = (sceneEndFrame) => {
  const dieStart = sceneEndFrame - T.flicker.die.length;
  T.flicker.die.forEach((on, i) => {
    if (!on) add(tf(dieStart + i), 0.008, () => rnd() * 2 * 0.25);
  });
  let ph = 0;
  add(tf(sceneEndFrame - 4), 0.35, (ts, p) => {
    ph += (2 * Math.PI * (900 - 820 * p)) / SR;
    return (Math.sin(ph) * 0.35 + rnd() * 0.5 * (1 - p)) * Math.exp(-p * 4) * 0.5;
  });
};

// ---------- arrangement ----------
const Dm = [50, 53, 57];
const Bb = [46, 50, 53];
const Cc = [48, 52, 55];
const Gm = [43, 50, 55];
const A = [45, 49, 52];

// scene events: ignitions, hums, power cuts
for (const k of ORDER) {
  const s0 = frameOf(START[k]);
  const s1 = frameOf(START[k] + T.scenes[k]);
  const keys = Object.entries(T.ignite[k]).filter(([name]) => name !== "letterGap");
  keys.forEach(([name, beat], i) => {
    if (name === "letters") return;
    ignite(s0 + frameOf(beat), 0.1, ((i % 3) - 1) * 0.4);
  });
  hum(tf(s0 + frameOf(keys[0][1])), tf(s1 - 2));
  powerCut(s1);
}

// 1. Kinabalu — synthwave opens up
{
  const s = START.kinabalu;
  const prog = [[0, Dm, 4], [4, Bb, 2], [6, Cc, 2], [8, Dm, 2]];
  for (const [at, ch, len] of prog) pad(b(s + at), ch.map((m) => m + 12), b(len), 0.035);
  const arp = [0, 7, 12, 15, 12, 7, 3, 7];
  for (let i = 4; i < 40; i++) {
    const beat = s + i / 4;
    const root = beat < s + 4 ? 62 : beat < s + 6 ? 58 : beat < s + 8 ? 60 : 62;
    pluck(b(beat), root + arp[i % arp.length], 0.08, i % 2 ? 0.35 : -0.35);
  }
  for (let beat = s + 2; beat < s + 10; beat++) {
    if ((beat - s) % 2 === 1) snare(b(beat));
    hat(b(beat + 0.5));
  }
  for (let e = 4; e < 20; e++) {
    const beat = s + e / 2;
    bass(b(beat), beat < s + 4 ? 38 : beat < s + 6 ? 34 : beat < s + 8 ? 36 : 38);
  }
}

// 2. Wayang kulit — gong, gendang, serunai over a synth drone
{
  const s = START.wayang;
  gong(b(s) + 0.05);
  pad(b(s), [38, 45, 50], b(10), 0.03);
  for (let beat = s + 1; beat < s + 10; beat += 2) {
    gendang(b(beat), false, 0.55);
    gendang(b(beat + 0.5), true, 0.3, 0.3);
    gendang(b(beat + 0.75), true, 0.22, -0.3);
    gendang(b(beat + 1), false, 0.4);
    gendang(b(beat + 1.5), true, 0.3, 0.3);
  }
  // Hijaz on D: D Eb F# G A Bb C
  const H = [62, 63, 66, 67, 69, 70, 72, 74];
  const line = [[4, 1.5, 1], [5, 2.5, 0.5], [4, 3, 0.5], [3, 3.5, 0.5], [2, 4, 1], [1, 5, 0.5], [2, 5.5, 0.5], [0, 6, 1.5], [4, 7.5, 0.5], [6, 8, 0.5], [7, 8.5, 1]];
  for (const [deg, at, len] of line) serunai(b(s + at), H[deg], b(len) * 0.95);
}

// 3. Nasi lemak — the mamak groove
{
  const s = START.nasi;
  const prog = [[0, Dm], [2, Gm], [4, Bb], [6, A], [8, Dm]];
  for (const [at, ch] of prog) pad(b(s + at), ch.map((m) => m + 12), b(2), 0.03);
  for (let beat = s; beat < s + 10; beat++) {
    if ((beat - s) % 2 === 1) snare(b(beat), 0.38);
    for (let q = 0; q < 4; q++) hat(b(beat + q / 4), q === 2 ? 0.08 : 0.04);
  }
  for (let e = 0; e < 20; e++) {
    const beat = s + e / 2;
    const root = beat < s + 2 ? 38 : beat < s + 4 ? 43 : beat < s + 6 ? 34 : beat < s + 8 ? 45 : 38;
    bass(b(beat), root + (e % 2 ? 12 : 0), BEAT / 2, 0.3);
  }
}

// 4. MALAYSIA — riser, a rising blip per letter, then the full drop
{
  const s = START.malaysia;
  let lp = 0;
  add(b(s), b(1.5), (ts, p) => {
    lp += (0.02 + 0.4 * p * p) * (rnd() * 2 - lp);
    return lp * p * p * 0.6;
  });
  const lettersBeat = T.ignite.malaysia.letters;
  const scale = [62, 65, 67, 69, 72, 74, 77, 81];
  for (let i = 0; i < 8; i++) pluck(b(s + lettersBeat + i * T.ignite.malaysia.letterGap), scale[i], 0.14, (i - 3.5) / 5);
  kick(b(s + 3), 1);
  gong(b(s + 3), 0.35);
  const prog = [[3, Dm], [5, Bb], [7, Cc], [9, Dm]];
  for (const [at, ch] of prog) pad(b(s + at), ch.map((m) => m + 12), b(at === 9 ? 3 : 2), 0.04);
  for (let beat = s + 3; beat < s + 11.5; beat++) {
    if ((beat - s) % 2 === 0) snare(b(beat));
    hat(b(beat + 0.5), 0.08);
  }
  for (let e = 6; e < 23; e++) {
    const beat = s + e / 2;
    bass(b(beat), beat < s + 5 ? 38 : beat < s + 7 ? 34 : beat < s + 9 ? 36 : 38);
  }
  const lead = [[3, 74, 1], [4, 72, 0.5], [4.5, 69, 0.5], [5, 70, 1.5], [6.5, 69, 0.5], [7, 67, 1], [8, 69, 1], [9, 74, 2.4]];
  for (const [at, m, len] of lead) {
    let ph = 0;
    add(b(s + at), b(len), (ts, p) => {
      const vib = Math.sin(2 * Math.PI * 5.5 * ts) * 0.006 * Math.min(1, ts * 2);
      ph += (2 * Math.PI * midi(m) * (1 + vib)) / SR;
      return saw(ph) * Math.min(1, ts * 30) * Math.min(1, (1 - p) * 6) * 0.1;
    }, 0.1);
  }
}

// kicks: one list drives both these hits and the video's camera punches
for (const [from, to, vel] of T.camera.kicks) {
  for (let beat = from; beat < to; beat++) kick(b(beat), vel);
}

// ---------- master ----------
let peak = 0;
for (let i = 0; i < N; i++) {
  L[i] = Math.tanh(L[i] * 1.15);
  R[i] = Math.tanh(R[i] * 1.15);
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
writeFileSync(join(OUT, "neon-track.wav"), buf);
console.log(`neon-track.wav written: ${DUR.toFixed(2)}s stereo, pre-gain peak ${peak.toFixed(2)}`);
