// Synthesizes the TanahAirku soundtrack: an original stereo zapin-style piece
// at 90 BPM. Gambus plucks (Karplus-Strong) in the Hijaz mode on D, marwas
// hand drums in a zapin pattern, a breathy seruling, per-scene ambience
// (wind + birds over the paddy, surf at the coast), the wau's humming bow,
// and a closing gong. Reads src/malaysia/timing.json — the same beat grid the
// video uses — so scene cuts and hits land on their frames.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = JSON.parse(readFileSync(join(ROOT, "src", "malaysia", "timing.json"), "utf8"));
const OUT = join(ROOT, "public", "sfx");
mkdirSync(OUT, { recursive: true });

const SR = 44100;
const BEAT = 60 / T.bpm;
const { sawah, pantai, bunga, jalur } = T.scenes;
const PANTAI = sawah;
const BUNGA = sawah + pantai;
const JALUR = sawah + pantai + bunga;
const TOTAL = JALUR + jalur;
const DUR = TOTAL * BEAT;
const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const b = (beat) => beat * BEAT;

let seed = 11;
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

// ---------- instruments ----------
// gambus: Karplus-Strong plucked string, bright attack, short sustain
const gambus = (t, f, vel = 0.3, pan = -0.2, len = 1.4) => {
  const period = Math.max(2, Math.round(SR / f));
  const buf = new Float32Array(period);
  for (let i = 0; i < period; i++) buf[i] = rnd() * 2;
  let idx = 0;
  add(
    t,
    len,
    (ts, p) => {
      const cur = buf[idx];
      const next = buf[(idx + 1) % period];
      buf[idx] = 0.5 * (cur + next) * 0.996;
      idx = (idx + 1) % period;
      return cur * vel * Math.min(1, (1 - p) * 8);
    },
    pan,
  );
};
// marwas: "dum" (low, pitched) and "tak" (slap)
const dum = (t, vel = 0.7) =>
  add(t, 0.35, (ts, p) => {
    const f = 120 - 40 * Math.min(1, ts * 12);
    return (Math.sin(2 * Math.PI * f * ts) * 0.9 + rnd() * 0.2 * Math.exp(-ts * 60)) * Math.exp(-p * 6) * vel;
  });
const tak = (t, vel = 0.35, pan = 0.25) => {
  let hp = 0;
  let prev = 0;
  add(
    t,
    0.12,
    (ts, p) => {
      const n = rnd() * 2;
      hp = 0.7 * (hp + n - prev);
      prev = n;
      return (hp * 0.6 + Math.sin(2 * Math.PI * 420 * ts) * 0.4) * Math.exp(-p * 9) * vel;
    },
    pan,
  );
};
// seruling: sine + soft 2nd/3rd harmonics, delayed vibrato, breath noise
const seruling = (t, f, dur, vel = 0.16, pan = 0.15) => {
  let ph = 0;
  let lp = 0;
  add(
    t,
    dur,
    (ts, p) => {
      const vib = ts > 0.25 ? Math.sin(2 * Math.PI * 5.2 * ts) * 0.006 * Math.min(1, (ts - 0.25) * 3) : 0;
      ph += (2 * Math.PI * f * (1 + vib)) / SR;
      lp += 0.1 * (rnd() * 2 - lp);
      const env = Math.min(1, ts * 12) * Math.min(1, (1 - p) * 5);
      return (Math.sin(ph) + 0.18 * Math.sin(2 * ph) + 0.08 * Math.sin(3 * ph) + lp * 0.35) * env * vel;
    },
    pan,
  );
};
const whoosh = (t, dur = 0.45, vel = 0.5, pan = 0) => {
  let lp = 0;
  add(
    t,
    dur,
    (ts, p) => {
      const cutoff = 0.03 + 0.35 * Math.sin(Math.PI * p);
      lp += cutoff * (rnd() * 2 - lp);
      return lp * Math.sin(Math.PI * Math.pow(p, 0.6)) ** 2 * vel;
    },
    pan,
  );
};
const gong = (t, f = 98, vel = 0.6) =>
  add(t, 5, (ts, p) => {
    const env = Math.min(1, ts * 200) * Math.exp(-ts * 0.9);
    const bend = 1 - 0.01 * Math.min(1, ts);
    return (
      (Math.sin(2 * Math.PI * f * bend * ts) +
        0.6 * Math.sin(2 * Math.PI * f * 1.003 * ts) +
        0.35 * Math.sin(2 * Math.PI * f * 2.02 * ts) * Math.exp(-ts * 1.5) +
        0.2 * Math.sin(2 * Math.PI * f * 2.92 * ts) * Math.exp(-ts * 3)) *
      env *
      vel
    );
  });
const chirp = (t, pan) =>
  add(
    t,
    0.09,
    (ts, p) => Math.sin(2 * Math.PI * (3200 + 1600 * Math.sin(Math.PI * p)) * ts) * Math.sin(Math.PI * p) * 0.05,
    pan,
  );

// Hijaz on D: D Eb F# G A Bb C D
const D4 = 293.66;
const HIJAZ = [0, 1, 4, 5, 7, 8, 10, 12, 13, 16].map((s) => D4 * Math.pow(2, s / 12));
const n = (deg, oct = 0) => HIJAZ[deg] * Math.pow(2, oct);

// ---------- ambience ----------
// wind over the paddy (scene 1), surf at the coast (scene 2)
{
  let lp = 0;
  add(0, b(PANTAI) + 0.6, (ts, p) => {
    lp += 0.012 * (rnd() * 2 - lp);
    const swell = 0.6 + 0.4 * Math.sin(ts * 0.9);
    return lp * swell * 0.9 * Math.min(1, ts * 2) * Math.min(1, (1 - p) * 6);
  });
  for (let i = 0; i < 14; i++) {
    const at = 0.5 + i * 0.37 + (rnd() + 0.5) * 0.15;
    chirp(at, rnd() * 1.4);
    if (i % 3 === 0) chirp(at + 0.11, rnd() * 1.4);
  }
}
{
  let lp = 0;
  add(b(PANTAI) - 0.3, b(pantai) + 0.6, (ts, p) => {
    lp += 0.05 * (rnd() * 2 - lp);
    const wave = Math.pow(0.5 + 0.5 * Math.sin(ts * 2.1 - 1), 3);
    return lp * (0.2 + 0.8 * wave) * 0.55 * Math.min(1, ts * 3) * Math.min(1, (1 - p) * 6);
  }, -0.1);
}

// the wau's busur hum while it flies (scenes 1–2, and its return in scene 4)
const hum = (start, dur, vel) => {
  let ph = 0;
  add(start, dur, (ts, p) => {
    ph += (2 * Math.PI * (146 + Math.sin(ts * 1.3) * 3)) / SR;
    const am = 0.6 + 0.4 * Math.sin(2 * Math.PI * 7 * ts);
    const env = Math.min(1, ts * 1.5) * Math.min(1, (1 - p) * 4);
    return (Math.sin(ph) + 0.5 * Math.sin(2 * ph) + 0.25 * Math.sin(3 * ph)) * am * env * vel;
  }, 0.2);
};
hum(0.3, b(BUNGA) - 0.3, 0.035);
hum(b(JALUR + 4), b(jalur - 4), 0.03);

// ---------- music ----------
// scene 1: gambus alone, rubato-ish phrase; marwas enter on beat 4
const PHRASE_A = [[0, 0], [2, 0.5], [3, 1], [4, 1.5], [3, 2.5], [2, 3], [1, 3.5], [0, 4]];
for (const [deg, at] of PHRASE_A) gambus(b(at) + 0.2, n(deg), 0.28);
const PHRASE_A2 = [[4, 4.5], [5, 5], [4, 5.5], [3, 6], [2, 6.5], [1, 7], [2, 7.25], [0, 7.5]];
for (const [deg, at] of PHRASE_A2) gambus(b(at), n(deg), 0.3);

// zapin groove: per beat-pair "dum . tak tak | dum tak . tak" in 8ths
const zapinBar = (beat, vel = 1) => {
  dum(b(beat), 0.7 * vel);
  tak(b(beat + 1), 0.3 * vel);
  tak(b(beat + 1.5), 0.24 * vel, -0.25);
  dum(b(beat + 2), 0.6 * vel);
  tak(b(beat + 2.5), 0.3 * vel);
  tak(b(beat + 3.5), 0.26 * vel, -0.25);
};
for (let beat = 4; beat < PANTAI; beat += 4) zapinBar(beat, 0.6);

// scene-1 -> 2 whip
whoosh(b(PANTAI) - 0.35, 0.5, 0.7);
dum(b(PANTAI), 1);

// scene 2: full zapin, gambus melody over a drone
for (let beat = PANTAI; beat < BUNGA; beat += 4) zapinBar(beat, 1);
const PHRASE_B = [
  [4, 0], [5, 0.5], [7, 1], [5, 1.5], [4, 2], [2, 2.5], [4, 3], [3, 3.5],
  [2, 4], [1, 4.5], [2, 5], [4, 5.5], [3, 6], [2, 6.5], [1, 7], [0, 7.5],
];
for (const [deg, at] of PHRASE_B) gambus(b(PANTAI + at), n(deg), 0.32, -0.25);
for (let beat = PANTAI; beat < BUNGA; beat += 2) gambus(b(beat), n(0, -1), 0.18, 0.3, 1.8);

// scene-2 -> 3: rising whoosh into the motif zoom
whoosh(b(BUNGA) - 0.85, 0.95, 0.6, 0);

// scene 3: drums drop out; seruling over sparse plucks, bloom shimmer
seruling(b(BUNGA) + 0.1, n(4), b(1.6), 0.15);
seruling(b(BUNGA + 2), n(5), b(0.9), 0.14);
seruling(b(BUNGA + 3), n(4), b(0.9), 0.14);
seruling(b(BUNGA + 4), n(2), b(1.9), 0.15);
seruling(b(BUNGA + 6), n(3), b(0.9), 0.14);
seruling(b(BUNGA + 7), n(1), b(1.8), 0.15);
for (let beat = BUNGA; beat < JALUR; beat += 1) gambus(b(beat) + (beat % 2 ? 0.33 : 0), n(beat % 2 ? 4 : 0, -1), 0.14, 0.35, 1.6);
for (let i = 0; i < 18; i++) {
  const at = b(BUNGA) + 2.6 + i * 0.05;
  add(at, 0.4, (ts, p) => Math.sin(2 * Math.PI * (2400 + i * 90) * ts) * Math.exp(-p * 6) * 0.03, (i % 2 ? 0.5 : -0.5));
}
// petal burst into the flag
whoosh(b(JALUR) - 0.5, 0.55, 0.7);

// scene 4: everything together, seruling carries the melody, gong on the title
dum(b(JALUR), 1.1);
gong(b(JALUR + 2), 98, 0.42);
for (let beat = JALUR; beat < TOTAL - 1; beat += 4) zapinBar(beat, beat < TOTAL - 4 ? 1 : 0.6);
const PHRASE_D = [
  [4, 0, 1], [5, 1, 0.5], [7, 1.5, 0.5], [8, 2, 1.5], [7, 3.5, 0.5],
  [5, 4, 1], [4, 5, 1], [2, 6, 0.5], [3, 6.5, 0.5], [4, 7, 2], [0, 9, 1.8],
];
for (const [deg, at, len] of PHRASE_D) seruling(b(JALUR + at), n(deg), b(len), 0.17);
for (let beat = JALUR; beat < TOTAL - 1; beat += 1) gambus(b(beat), n(beat % 4 === 0 ? 0 : beat % 4 === 2 ? 4 : 2, -1), 0.17, -0.3, 1.2);
gambus(b(TOTAL - 1.5), n(0, -1), 0.3, 0, 1.5);
gambus(b(TOTAL - 1.5) + 0.03, n(4, -1), 0.24, 0.3, 1.5);
dum(b(TOTAL - 1.5), 0.8);

// ---------- master ----------
let peak = 0;
for (let i = 0; i < N; i++) {
  const fade = Math.min(1, (N - i) / (SR * 0.35));
  L[i] = Math.tanh(L[i] * 1.2) * fade;
  R[i] = Math.tanh(R[i] * 1.2) * fade;
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
writeFileSync(join(OUT, "my-track.wav"), buf);
console.log(`my-track.wav written: ${DUR.toFixed(2)}s stereo, pre-gain peak ${peak.toFixed(2)}`);
