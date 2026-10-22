// Synthesizes the GerakBuild soundtrack: an original pad bed at 96 BPM in
// D major, a soft kick under the app section, Manggis's hop "boings" and
// landing thumps, a glass shatter as he breaks out of the canvas, tool
// clicks, a drag swish, a glow shimmer, playhead ticks while he rides it, a
// particle swell and dust whoosh, key ticks, a working-pill hum, petal locks
// and a closing chime. Every hit is derived from src/gerak/timing.json, the
// same file the video reads.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = JSON.parse(readFileSync(join(ROOT, "src", "gerak", "timing.json"), "utf8"));
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

let seed = 31;
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
// light under the editor so Manggis's sounds read, dips under the working
// pill, fades under the end card
const musicGain = (t) => {
  const f = t * FPS;
  const inn = Math.min(1, Math.max(0, f / 30));
  const set = f < S.particles.from ? 0.6 : 1;
  const pill = f > S.pill.from && f < S.app.from ? 0.5 : 1;
  const out = Math.min(1, Math.max(0, (T.total - 6 - f) / 50));
  return inn * set * pill * out;
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
// Dmaj9 – Bm9 – Gmaj7 – A6
const CHORDS = [
  [50, 57, 61, 64, 66],
  [47, 54, 57, 62, 66],
  [43, 50, 54, 59, 62],
  [45, 52, 57, 61, 66],
];
const BAR = 4 * BEAT;
for (let bar = 0; bar * BAR < DUR; bar++) pad(bar * BAR, CHORDS[bar % 4], BAR + 0.5);
const kick = (t, vel = 0.36) => {
  let ph = 0;
  add(t, 0.3, (ts, p) => {
    ph += (2 * Math.PI * (48 + 90 * Math.exp(-ts * 30))) / SR;
    return Math.sin(ph) * Math.exp(-p * 5) * vel * musicGain(t);
  });
};
const pluck = (t, m, vel = 0.05, pan = 0) => {
  let ph = 0;
  add(t, 0.35, (ts, p) => {
    ph += (2 * Math.PI * midi(m)) / SR;
    return (Math.sin(ph) + 0.3 * Math.sin(3 * ph)) * Math.exp(-p * 6) * vel * musicGain(t);
  }, pan);
};
for (let t = Math.ceil(tf(S.particles.from) / BEAT) * BEAT; t < tf(S.end.from); t += BEAT) kick(t, 0.32);
for (let t = Math.ceil(tf(S.set.from + 40) / (BEAT / 2)) * (BEAT / 2), k = 0; t < tf(S.particles.from); t += BEAT / 2, k++) {
  const chord = CHORDS[Math.floor(t / BAR) % 4];
  pluck(t, chord[(k * 3) % chord.length] + 12, 0.045, k % 2 ? 0.3 : -0.3);
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

// Manggis: a rising "boing" on every hop, a soft thump on every landing
const boing = (frame) => {
  let ph = 0;
  add(tf(frame), 0.22, (ts, p) => {
    ph += (2 * Math.PI * (320 + 520 * p)) / SR;
    return Math.sin(ph) * Math.sin(Math.PI * p) * 0.16;
  });
};
const thump = (frame, vel = 0.3) => {
  let ph = 0;
  add(tf(frame), 0.25, (ts, p) => {
    ph += (2 * Math.PI * (90 + 80 * Math.exp(-ts * 25))) / SR;
    return Math.sin(ph) * Math.exp(-p * 7) * vel;
  });
};
const St = T.set;
St.stations.forEach((s, i) => {
  if (i > 0) {
    boing(St.stations[i - 1].at + St.stations[i - 1].stay);
    thump(s.at, 0.26);
  }
});
// breaking out of the canvas: noise burst plus glassy ticks
pop(St.shatter, 0.2);
crackle(St.shatter, 10, 18);
// pressing the text tool, the title popping in
tick(St.stations[1].at + 1, 0.16, 2400);
chime(tf(St.title + 2), 79, 0.09);
// picking up and dropping the glow effect
whoosh(St.stations[2].at + 16, 0.35, 0.14, 0.3);
glide(St.drop - 2, 14, 600, 1600, 0.06);
chime(tf(St.drop + 4), 86, 0.12);
// riding the playhead: a tick every 8 frames, particles swelling
for (let f = St.ride[0]; f < St.ride[1]; f += 8) tick(f, 0.05, 2000 + ((f / 8) % 4) * 150, 0.2);
riser(St.ride[1] + 30, 1.6, 0.14);
// particles: hold, then the dust blows away
whoosh(S.particles.from + T.particles.disperse[0] + 12, 0.9, 0.3, -0.2);
// prompt: typing, chip click, send
const Q = T.prompt;
for (let i = 0; i < Q.text.length; i += 3) tick(S.prompt.from + Q.type + Math.ceil(((i + 1) * FPS) / Q.cps), 0.08, 1800 + (i % 5) * 110, ((i % 5) - 2) * 0.12);
tick(S.prompt.from + Q.click, 0.15, 3000);
pop(S.prompt.from + Q.send, 0.28);
// working pill: a soft two-tone hum
for (const [m, v] of [[62, 0.05], [69, 0.035]]) {
  let ph = 0;
  add(tf(S.pill.from + 2), (S.pill.dur - 4) / FPS, (ts, p) => {
    ph += (2 * Math.PI * midi(m)) / SR;
    return Math.sin(ph) * Math.sin(Math.PI * p) * v * (0.7 + 0.3 * Math.sin(ts * 9));
  });
}
whoosh(S.app.from + 6, 0.5, 0.26);
// petals locking in, in the app and again full screen
for (const [from, start] of [[S.app.from, T.app.play], [S.mark.from, T.mark.start]]) {
  for (let i = 0; i < 6; i++) tick(from + start + i * 3 + 10, 0.09, 2600 + i * 180, (i - 2.5) * 0.15);
  chime(tf(from + start + 30), 88, 0.1);
}
// end card
chime(tf(S.end.from + T.end.word + 2), 81, 0.14);
chime(tf(S.end.from + T.end.word + 2) + 0.1, 88, 0.12);

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
writeFileSync(join(OUT, "gerak-track.wav"), buf);
console.log(`gerak-track.wav written: ${DUR.toFixed(2)}s stereo, pre-gain peak ${peak.toFixed(2)}`);
