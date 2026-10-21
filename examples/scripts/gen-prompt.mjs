// Synthesizes the PromptToVideo soundtrack: an original pad bed at 104 BPM in
// F major with a soft kick once the code starts, a key tick every few typed
// characters, clicks, a send "pop", a riser into the code stream, whooshes on
// the card swing and every camera whip, and chimes when the generated intro's
// wordmark lands. Every hit is derived from src/prompt/timing.json, the same
// file the video reads.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = JSON.parse(readFileSync(join(ROOT, "src", "prompt", "timing.json"), "utf8"));
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
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);

// ---------- music bed ----------
// quiet under the typing so the key ticks read, full under code and result,
// fades out under the sign-off
const musicGain = (t) => {
  const f = t * FPS;
  const inn = Math.min(1, Math.max(0, f / 20));
  const typing = f > S.prompt.from && f < S.code.from ? 0.55 : 1;
  const out = Math.min(1, Math.max(0, (T.total - 6 - f) / 50));
  return inn * typing * out;
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
// Fmaj9 – Dm9 – Bbmaj7 – C6, one chord per bar
const CHORDS = [
  [53, 60, 64, 67, 69],
  [50, 57, 60, 64, 65],
  [46, 53, 57, 62, 65],
  [48, 55, 60, 64, 69],
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
for (let t = Math.ceil(tf(S.code.from) / BEAT) * BEAT; t < tf(S.sign.from); t += BEAT) kick(t, 0.36);
for (let t = Math.ceil(tf(S.world.from) / (BEAT / 2)) * (BEAT / 2), k = 0; t < tf(S.sign.from); t += BEAT / 2, k++) {
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
// typing: a tick every 3 characters, at the frame that character appears
const typing = (from, start, cps, text) => {
  for (let i = 0; i < text.length; i += 3) {
    const f = from + start + Math.ceil(((i + 1) * FPS) / cps);
    tick(f, 0.07, 1700 + (i % 7) * 90, ((i % 5) - 2) * 0.12);
  }
};

const I = T.intro;
// mark lands, wordmark converges, chips split, cursor clicks
chime(tf(I.mark + 6), 77, 0.08);
whoosh(I.word + 8, 0.5, 0.14);
riser(I.collapse + 10, 0.3, 0.14);
for (let i = 0; i < 5; i++) tick(I.split + 2 + Math.abs(i - 2) * 2, 0.08, 2600 + i * 150, (i - 2) * 0.25);
tick(I.click, 0.16, 3000);
// first prompt: typing, send
const Q = T.prompt;
typing(S.prompt.from, Q.type, Q.cps, Q.text);
pop(S.prompt.from + Q.send, 0.3);
// code stream, then the player swinging in and its intro playing
riser(S.code.from + 12, 0.45, 0.22);
whoosh(S.code.from + 16, 0.6, 0.3);
const W = T.world;
whoosh(S.world.from + 4, 0.5, 0.28, 0.4);
chime(tf(S.world.from + W.play + T.mini.word + 8), 84, 0.18);
// whip down, second prompt, send, whip back, night intro
whoosh(S.world.from + 86, 0.45, 0.3);
typing(S.world.from, W.type, W.cps, W.text);
pop(S.world.from + W.send, 0.3);
whoosh(S.world.from + 130, 0.45, 0.3);
chime(tf(S.world.from + W.playNight + T.mini.word + 8), 89, 0.2);
chime(tf(S.world.from + W.playNight + T.mini.word + 8) + 0.1, 96, 0.16);
// sign-off
chime(tf(S.sign.from + 2), 81, 0.12);
whoosh(S.sign.from + T.sign.travel - 6, 0.6, 0.18, -0.3);
whoosh(S.sign.from + T.sign.exit + 6, 0.35, 0.16);

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
writeFileSync(join(OUT, "prompt-track.wav"), buf);
console.log(`prompt-track.wav written: ${DUR.toFixed(2)}s stereo, pre-gain peak ${peak.toFixed(2)}`);
