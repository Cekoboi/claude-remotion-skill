// Synthesizes the LajuJourney soundtrack: an original pad bed at 100 BPM in
// A major with a soft kick from the purchase to the doorstep, spark crackle
// while the comet draws the mark, key ticks, orbit whooshes, a rising tone
// while "Beli Sekarang" fills, a success chime, ticks along the delivery
// route, a box thump, the delivered ding, and tagline swishes. Every hit is
// derived from src/laju/timing.json, the same file the video reads.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = JSON.parse(readFileSync(join(ROOT, "src", "laju", "timing.json"), "utf8"));
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

let seed = 23;
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
// quiet under the logo so the sparks read, full from the purchase on, fades
// under the outro
const musicGain = (t) => {
  const f = t * FPS;
  const inn = Math.min(1, Math.max(0, (f - 10) / 40));
  const logo = f < S.phone.from ? 0.6 : 1;
  const out = Math.min(1, Math.max(0, (T.total - 6 - f) / 60));
  return inn * logo * out;
};
const pad = (t0, notes, dur, vel = 0.04) => {
  for (const [i, m] of notes.entries()) {
    for (const det of [0.996, 1.004]) {
      let ph = i * 1.1;
      add(t0, dur, (ts, p) => {
        ph += (2 * Math.PI * midi(m) * det) / SR;
        const env = Math.min(1, ts / 0.5) * Math.min(1, (1 - p) * 5);
        const v = Math.sin(ph) + 0.25 * Math.sin(2 * ph) + 0.1 * Math.sin(3 * ph);
        return v * env * vel * musicGain(t0 + ts);
      }, det < 1 ? -0.45 : 0.45);
    }
  }
};
// Amaj9 – F#m9 – Dmaj7 – E6, one chord per bar
const CHORDS = [
  [45, 52, 56, 59, 61],
  [42, 49, 52, 56, 57],
  [50, 57, 61, 64, 66],
  [52, 59, 61, 64, 68],
];
const BAR = 4 * BEAT;
for (let bar = 0; bar * BAR < DUR; bar++) pad(bar * BAR, CHORDS[bar % 4], BAR + 0.5);
const kick = (t, vel = 0.4) => {
  let ph = 0;
  add(t, 0.3, (ts, p) => {
    ph += (2 * Math.PI * (48 + 90 * Math.exp(-ts * 30))) / SR;
    return Math.sin(ph) * Math.exp(-p * 5) * vel * musicGain(t);
  });
};
const pluck = (t, m, vel = 0.06, pan = 0) => {
  let ph = 0;
  add(t, 0.35, (ts, p) => {
    ph += (2 * Math.PI * midi(m)) / SR;
    return (Math.sin(ph) + 0.3 * Math.sin(3 * ph)) * Math.exp(-p * 6) * vel * musicGain(t);
  }, pan);
};
for (let t = Math.ceil(tf(S.product.from) / BEAT) * BEAT; t < tf(S.line1.from); t += BEAT) kick(t, 0.36);
for (let t = Math.ceil(tf(S.city.from) / (BEAT / 2)) * (BEAT / 2), k = 0; t < tf(S.outro.from); t += BEAT / 2, k++) {
  const chord = CHORDS[Math.floor(t / BAR) % 4];
  pluck(t, chord[(k * 2) % chord.length] + 12, 0.05, k % 2 ? 0.3 : -0.3);
}

// ---------- sfx ----------
const whoosh = (frame, dur = 0.45, vel = 0.26, pan = 0) => {
  let lp = 0;
  const t0 = tf(frame) - dur * 0.6;
  add(t0, dur, (ts, p) => {
    const cut = 0.02 + 0.25 * Math.sin(Math.PI * p);
    lp += cut * (rnd() - lp);
    return lp * 4 * Math.sin(Math.PI * p) ** 2 * vel;
  }, pan);
};
const tick = (frame, vel = 0.1, pitch = 2400, pan = 0) => {
  let ph = 0;
  add(tf(frame), 0.05, (ts, p) => {
    ph += (2 * Math.PI * pitch) / SR;
    return (Math.sin(ph) * 0.6 + rnd() * 0.4) * Math.exp(-p * 9) * vel;
  }, pan);
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
const pop = (frame, vel = 0.3) => {
  let ph = 0;
  add(tf(frame), 0.12, (ts, p) => {
    ph += (2 * Math.PI * (900 * Math.exp(-ts * 25) + 180)) / SR;
    return Math.sin(ph) * Math.exp(-p * 6) * vel;
  });
};
const riser = (endFrame, dur = 0.5, vel = 0.2) => {
  let lp = 0;
  add(tf(endFrame) - dur, dur, (ts, p) => {
    lp += (0.02 + 0.3 * p) * (rnd() - lp);
    return lp * 4 * p * p * vel;
  });
};
// sparks: a burst of tiny noise ticks while the comet draws
const crackle = (from, dur, count = 26) => {
  for (let i = 0; i < count; i++) {
    const f = from + Math.floor(((i + 0.5) / count) * dur);
    tick(f, 0.05 + 0.03 * Math.abs(rnd()), 3200 + Math.abs(rnd()) * 2400, rnd() * 0.8);
  }
};
// a sine that glides up while the buy button fills
const glide = (from, dur, f0, f1, vel = 0.12) => {
  let ph = 0;
  add(tf(from), dur / FPS, (ts, p) => {
    ph += (2 * Math.PI * (f0 + (f1 - f0) * p * p)) / SR;
    return Math.sin(ph) * Math.min(1, p * 6) * vel;
  });
};

// logo: crackle while drawing, pin pop, chime (and again for the outro)
for (const [shot, t] of [[S.logo, T.logo], [S.outro, T.outro]]) {
  crackle(shot.from + t.comet, t.draw);
  pop(shot.from + t.comet + t.draw, 0.28);
  chime(tf(shot.from + t.comet + t.draw + 2), 81, 0.1);
}
// phone: rise, typing, suggestions, grid, orbit out and back, push in
const P = T.phone;
whoosh(S.phone.from + 6, 0.5, 0.22);
for (let i = 0; i < P.query.length; i++) tick(S.phone.from + P.type + Math.ceil(((i + 1) * FPS) / P.cps), 0.09, 1800 + (i % 5) * 120);
tick(S.phone.from + P.suggest, 0.06, 2600);
for (let i = 0; i < 6; i++) tick(S.phone.from + P.grid + i * 2, 0.05, 2900 + i * 120);
whoosh(S.phone.from + P.open + 6, 0.55, 0.26, -0.4);
whoosh(S.phone.from + P.close + 8, 0.5, 0.22, 0.4);
riser(S.phone.from + P.push + 14, 0.45, 0.2);
// product: hold tone, success, whip out
const Q = T.product;
glide(S.product.from + Q.hold, Q.holdDur, 280, 880, 0.1);
chime(tf(S.product.from + Q.hold + Q.holdDur), 88, 0.22);
chime(tf(S.product.from + Q.hold + Q.holdDur) + 0.09, 92, 0.18);
whoosh(S.product.from + Q.whip + 6, 0.45, 0.3);
// city: a soft tick every 10 frames while the rider moves
const Cy = T.city;
for (let f = Cy.start; f < Cy.start + Cy.dur; f += 10) tick(S.city.from + f, 0.05, 2200, 0.2);
// door: flash, box lands, ring shimmer, mark chime, delivered ding
const Dr = T.door;
pop(S.door.from, 0.22);
let ph = 0;
add(tf(S.door.from + Dr.box + 6), 0.5, (ts, p) => {
  ph += (2 * Math.PI * (70 + 60 * Math.exp(-ts * 18))) / SR;
  return Math.sin(ph) * Math.exp(-p * 6) * 0.35;
});
riser(S.door.from + Dr.ring + 26, 0.8, 0.12);
chime(tf(S.door.from + Dr.mark + 22), 85, 0.14);
chime(tf(S.door.from + Dr.notify + 4), 90, 0.3);
chime(tf(S.door.from + Dr.notify + 4) + 0.11, 97, 0.26);
// taglines
whoosh(S.line1.from + 4, 0.45, 0.18);
whoosh(S.line1.from + T.line1.under + 12, 0.4, 0.12, 0.3);
whoosh(S.line2.from + 4, 0.45, 0.18);
whoosh(S.line2.from + T.line2.arrow + 14, 0.5, 0.16, 0.3);
chime(tf(S.line2.from + T.line2.arrow + 20), 88, 0.14);

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
writeFileSync(join(OUT, "laju-track.wav"), buf);
console.log(`laju-track.wav written: ${DUR.toFixed(2)}s stereo, pre-gain peak ${peak.toFixed(2)}`);
