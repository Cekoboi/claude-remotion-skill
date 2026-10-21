// Synthesizes the KLNight soundtrack: an original stereo 100 BPM piece with
// gamelan-style bell tones, plus every SFX baked in on the beat grid.
// Reads src/kl/timing.json — the same file the video reads — so typing ticks,
// scene hits and each firework (whistle -> boom -> crackle, panned by its x
// position) land exactly on their frames.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const T = JSON.parse(readFileSync(join(ROOT, "src", "kl", "timing.json"), "utf8"));
const OUT = join(ROOT, "public", "sfx");
mkdirSync(OUT, { recursive: true });

const SR = 44100;
const BEAT = 60 / T.bpm;
const { hook, build, night, outro } = T.scenes;
const TOTAL_BEATS = hook + build + night + outro;
const DUR = TOTAL_BEATS * BEAT;
const N = Math.ceil(DUR * SR);
const L = new Float32Array(N);
const R = new Float32Array(N);
const b = (beat) => beat * BEAT; // beat -> seconds
const NIGHT = hook + build;
const OUTRO = NIGHT + night;

// deterministic noise
let seed = 7;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647 - 0.5;
};

// add(start s, dur s, fn(tSec, progress) -> sample, pan -1..1)
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
// gamelan-ish bell: inharmonic partials, fast attack, long ring
const bell = (t, f, vel = 0.22, len = 1.6, pan = 0) =>
  add(
    t,
    len,
    (ts, p) => {
      const env = Math.min(1, ts * 400) * Math.exp(-p * 5);
      return (
        (Math.sin(2 * Math.PI * f * ts) +
          0.45 * Math.sin(2 * Math.PI * f * 2.76 * ts) * Math.exp(-ts * 6) +
          0.2 * Math.sin(2 * Math.PI * f * 5.4 * ts) * Math.exp(-ts * 12)) *
        env *
        vel
      );
    },
    pan,
  );
const kick = (t, vel = 0.9) =>
  add(t, 0.32, (ts, p) => {
    const f = 150 - 105 * Math.min(1, ts * 10);
    return Math.sin(2 * Math.PI * f * ts) * Math.exp(-p * 6) * vel;
  });
const hat = (t, vel = 0.08, pan = 0.25) =>
  add(t, 0.05, (ts, p) => rnd() * 2 * Math.exp(-p * 9) * vel, pan);
const clap = (t) => {
  let lp = 0;
  add(t, 0.22, (ts, p) => {
    const n = rnd() * 2;
    lp += 0.5 * (n - lp);
    const bursts = ts < 0.03 ? Math.exp(-((ts * 1000) % 10) / 3) : 1;
    return (n - lp) * Math.exp(-p * 7) * 0.32 * bursts;
  });
};
const sub = (t, f, dur) =>
  add(t, dur, (ts, p) => {
    const env = Math.min(1, ts * 60) * Math.min(1, (1 - p) * 12);
    return (Math.sin(2 * Math.PI * f * ts) + 0.25 * Math.sin(2 * Math.PI * f * 2 * ts)) * env * 0.26;
  });
const tick = (t) =>
  add(t, 0.035, (ts, p) => Math.sin(2 * Math.PI * 2400 * ts) * Math.exp(-p * 12) * 0.16 + rnd() * 0.05 * (1 - p), 0.1);
const whoosh = (t, dur = 0.45, vel = 0.5) => {
  let lp = 0;
  add(t, dur, (ts, p) => {
    const cutoff = 0.03 + 0.3 * Math.sin(Math.PI * p);
    lp += cutoff * (rnd() * 2 - lp);
    return lp * Math.sin(Math.PI * Math.pow(p, 0.6)) ** 2 * vel;
  });
};
const impact = (t, vel = 1) => {
  add(t, 0.9, (ts, p) => Math.sin(2 * Math.PI * (55 - 20 * p) * ts) * Math.exp(-p * 4) * 0.9 * vel);
  let lp = 0;
  add(t, 0.6, (ts, p) => {
    lp += 0.08 * (rnd() * 2 - lp);
    return lp * Math.exp(-p * 6) * 0.9 * vel;
  });
};
const riser = (t, dur) => {
  let lp = 0;
  add(t, dur, (ts, p) => {
    lp += (0.02 + 0.5 * p * p) * (rnd() * 2 - lp);
    return (lp * 0.5 + Math.sin(2 * Math.PI * (200 + 900 * p * p) * ts) * 0.05) * p * p * 0.7;
  });
};

// ---------- fireworks: whistle -> boom -> crackle, panned by x ----------
const LAUNCH_S = 0.47; // must match Fireworks.tsx
for (const fw of T.fireworks) {
  const tb = b(fw.beat);
  const pan = ((fw.x - 540) / 540) * 0.75;
  let ph = 0;
  add(
    tb - LAUNCH_S,
    LAUNCH_S,
    (ts, p) => {
      ph += (2 * Math.PI * (700 + 1500 * p)) / SR;
      return (Math.sin(ph) * 0.06 + rnd() * 0.05) * Math.sin(Math.PI * p);
    },
    pan,
  );
  let lp = 0;
  add(
    tb,
    1.2,
    (ts, p) => {
      lp += 0.06 * (rnd() * 2 - lp);
      return (lp * 1.6 + Math.sin(2 * Math.PI * 48 * ts) * 0.5) * Math.exp(-p * 5) * fw.size;
    },
    pan,
  );
  const cr = fw.kind === "willow" ? 70 : 40;
  for (let i = 0; i < cr; i++) {
    const at = tb + 0.25 + (rnd() + 0.5) * (fw.kind === "willow" ? 1.9 : 1.1);
    const cp = pan + rnd() * 0.5;
    add(at, 0.012, (ts, p) => rnd() * 2 * (1 - p) * 0.22, Math.max(-1, Math.min(1, cp)));
  }
}

// ---------- arrangement ----------
// warm pad: D minor 9 cluster, detuned pairs, swells in and out
{
  const freqs = [73.42, 110, 146.83, 174.61, 220, 329.63];
  for (const [i, f] of freqs.entries()) {
    for (const d of [0.9985, 1.0015]) {
      let phase = i;
      add(
        0,
        DUR,
        (ts) => {
          phase += (2 * Math.PI * f * d) / SR;
          const attack = Math.min(1, ts / 2);
          const release = Math.min(1, (DUR - ts) / 1.5);
          const swell = ts > b(NIGHT) && ts < b(OUTRO) ? 1.15 : 1;
          return Math.sin(phase) * attack * release * swell * 0.022;
        },
        d < 1 ? -0.35 : 0.35,
      );
    }
  }
}

// typing ticks — one per typed character, same frames as the video
for (let i = 0; i < T.type.text.length; i++) {
  tick((T.type.startFrame + i * T.type.perChar) / T.fps);
}

// slendro-like scale on D
const S = [293.66, 329.63, 392, 440, 523.25, 587.33, 659.25];
const MOTIF = [0, 2, 3, 4, 3, 2, 4, 5, 0, 2, 3, 4, 5, 4, 3, 2];

// hook -> build hit
whoosh(b(hook) - 0.3, 0.4, 0.6);
impact(b(hook), 0.7);

// build: bells in 8ths, soft kick + hats, sub roots
for (let beat = hook; beat < NIGHT; beat++) {
  for (let e = 0; e < 2; e++) {
    const idx = ((beat - hook) * 2 + e) % MOTIF.length;
    const vel = 0.1 + 0.08 * ((beat - hook) / build);
    bell(b(beat) + e * BEAT * 0.5, S[MOTIF[idx]], vel, 1.2, e ? 0.3 : -0.3);
  }
  if (beat < NIGHT - 2) kick(b(beat), 0.55);
  hat(b(beat) + BEAT / 2);
  if ((beat - hook) % 4 === 0 && beat < NIGHT - 2) sub(b(beat), 73.42, BEAT * 3.8);
}
// pod-ring hit (BUILD.podRing = 6.0s into the build) and the drop-in riser
bell(b(hook) + 6.0, S[5] * 2, 0.22, 2, 0.6);
riser(b(NIGHT - 2), b(2));

// night: full groove, bells up an octave on the off-beats
impact(b(NIGHT), 1);
for (let beat = NIGHT; beat < OUTRO; beat++) {
  kick(b(beat), 0.85);
  hat(b(beat) + BEAT / 2, 0.1);
  hat(b(beat) + BEAT * 0.75, 0.05, -0.25);
  if ((beat - NIGHT) % 2 === 1) clap(b(beat));
  const root = (beat - NIGHT) % 8 < 4 ? 73.42 : 87.31; // D -> F
  sub(b(beat), root, BEAT * 0.48);
  sub(b(beat) + BEAT / 2, root, BEAT * 0.45);
  const idx = ((beat - NIGHT) * 2) % MOTIF.length;
  bell(b(beat) + BEAT / 2, S[MOTIF[idx]] * 2, 0.09, 0.9, 0.4);
}

// outro: no drums; descending bell phrase, "100% kod." impact on beat OUTRO+3
const OUT_PHRASE = [6, 5, 4, 3, 2, 3, 1, 0];
OUT_PHRASE.forEach((n, i) => bell(b(OUTRO + i), S[n], 0.16, 2.2, i % 2 ? 0.3 : -0.3));
whoosh(b(OUTRO + 3) - 0.3, 0.4, 0.5);
impact(b(OUTRO + 3), 0.8);
bell(b(OUTRO + 3), S[0] / 2, 0.25, 3.5);

// ---------- master: soft-clip, normalize, write 16-bit stereo ----------
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
writeFileSync(join(OUT, "kl-track.wav"), buf);
console.log(`kl-track.wav written: ${DUR.toFixed(2)}s stereo, pre-gain peak ${peak.toFixed(2)}`);
