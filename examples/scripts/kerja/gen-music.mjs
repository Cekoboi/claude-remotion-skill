// Synthesizes the soundtrack for "Kerja Makan Gaji vs Kerja Sendiri":
//   public/kerja/music.wav — original upbeat 120 BPM track (Bb–F–Gm–Eb),
//                            arranged to the scene plan in src/kerja/timing.json
//   public/kerja/sfx.wav   — every SFX from timing.events, plus a whoosh into
//                            each scene change
// Kept separate so the video can duck the music under the voice-over while the
// SFX stay crisp, and so analyze-beats.mjs sees the music alone.
import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const T = JSON.parse(readFileSync(join(ROOT, "src", "kerja", "timing.json"), "utf8"));
const OUT = join(ROOT, "public", "kerja");
mkdirSync(OUT, { recursive: true });

const SR = 44100;
const BEAT = 60 / T.bpm;
const DUR = T.totalBeats * BEAT;
const N = Math.ceil(DUR * SR);
const b = (beat) => beat * BEAT;
const scene = Object.fromEntries(T.scenes.map((s) => [s.id, s]));

const makeBus = () => ({ L: new Float32Array(N), R: new Float32Array(N) });
const music = makeBus();
const sfx = makeBus();

let seed = 7;
const rnd = () => {
  seed = (seed * 16807) % 2147483647;
  return seed / 2147483647 - 0.5;
};
const add = (bus, start, dur, fn, pan = 0) => {
  const s0 = Math.floor(start * SR);
  const n = Math.floor(dur * SR);
  const gl = Math.cos(((pan + 1) * Math.PI) / 4);
  const gr = Math.sin(((pan + 1) * Math.PI) / 4);
  for (let i = 0; i < n && s0 + i < N; i++) {
    if (s0 + i < 0) continue;
    const v = fn(i / SR, i / n, (s0 + i) / SR);
    bus.L[s0 + i] += v * gl;
    bus.R[s0 + i] += v * gr;
  }
};
const midi = (m) => 440 * Math.pow(2, (m - 69) / 12);
const saw = (ph) => {
  let s = 0;
  for (let h = 1; h <= 6; h++) s += Math.sin(ph * h) / h;
  return s * 0.6;
};

// ---------- arrangement map ----------
// kick pattern per beat: "full" four-on-the-floor, "half" on 1 and 3, none
const kickMode = (beat) => {
  if (beat < 8) return "none";
  if (beat < scene.banding.from) return "full";
  if (beat < scene.ending.from) return "half";
  if (beat < T.totalBeats - 4) return "full";
  return "none";
};
// sidechain pump: duck pads/bass right after each kick
const pump = (tAbs) => {
  const beat = tAbs / BEAT;
  const mode = kickMode(Math.floor(beat));
  if (mode === "none") return 1;
  const ph = beat % (mode === "half" ? 2 : 1);
  return 1 - 0.55 * Math.exp(-ph * BEAT * 9);
};

// Bb – F – Gm – Eb, one chord per bar
const PROG = [
  [58, 62, 65, 70],
  [57, 60, 65, 69],
  [55, 58, 62, 67],
  [55, 58, 63, 67],
];
const ROOTS = [46, 41, 43, 39];

// ---------- instruments ----------
const chordBar = (bar, vel) => {
  const notes = PROG[bar % 4];
  for (const m of notes) {
    for (const det of [0.994, 1, 1.006]) {
      let ph = (rnd() + 0.5) * 6; // seeded, so every run is identical
      let lp = 0;
      add(music, b(bar * 4), b(4), (ts, p, tAbs) => {
        ph += (2 * Math.PI * midi(m) * det) / SR;
        lp += 0.18 * (saw(ph) - lp);
        const env = Math.min(1, ts / 0.05) * Math.min(1, (1 - p) * 20);
        return lp * env * pump(tAbs) * vel;
      }, det < 1 ? -0.45 : det > 1 ? 0.45 : 0);
    }
  }
};
const bassNote = (t, m, len, vel = 0.34) => {
  let ph = 0;
  let lp = 0;
  add(music, t, len, (ts, p, tAbs) => {
    ph += (2 * Math.PI * midi(m)) / SR;
    lp += 0.1 * (saw(ph) + Math.sin(ph) - lp);
    return lp * Math.min(1, ts * 400) * Math.min(1, (1 - p) * 15) * pump(tAbs) * vel;
  });
};
const kick = (t, vel = 0.95) =>
  add(music, t, 0.32, (ts, p) => Math.sin(2 * Math.PI * (150 - 105 * Math.min(1, ts * 14)) * ts) * Math.exp(-p * 5.5) * vel);
const clap = (t, vel = 0.32) => {
  let hp = 0;
  let prev = 0;
  add(music, t, 0.22, (ts, p) => {
    const n = rnd() * 2;
    hp = 0.6 * (hp + n - prev);
    prev = n;
    const burst = ts < 0.025 ? 0.6 + 0.4 * Math.sin(ts * 900) : 1;
    return hp * Math.exp(-p * 7) * burst * vel;
  }, 0.05);
};
const hat = (t, vel = 0.07, pan = 0.3, open = false) => {
  let hp = 0;
  let prev = 0;
  add(music, t, open ? 0.16 : 0.04, (ts, p) => {
    const n = rnd() * 2;
    hp = 0.85 * (hp + n - prev);
    prev = n;
    return hp * Math.exp(-p * (open ? 4 : 9)) * vel;
  }, pan);
};
const pluck = (t, m, vel = 0.1, pan = 0) => {
  let ph = 0;
  add(music, t, 0.25, (ts, p) => {
    ph += (2 * Math.PI * midi(m)) / SR;
    return (Math.sin(ph) + 0.4 * Math.sin(2 * ph) + 0.2 * Math.sign(Math.sin(ph))) * Math.exp(-p * 8) * vel;
  }, pan);
};
const riser = (bus, t, len, vel = 0.35) => {
  let lp = 0;
  add(bus, t, len, (ts, p) => {
    lp += (0.02 + 0.45 * p * p) * (rnd() * 2 - lp);
    return lp * p * p * vel;
  });
};

// ---------- music ----------
const BARS = T.totalBeats / 4;
for (let bar = 0; bar < BARS; bar++) {
  const beat0 = bar * 4;
  const inEnding = beat0 >= scene.ending.from;
  const lastBars = beat0 >= T.totalBeats - 4;
  chordBar(bar, lastBars ? 0.03 : beat0 < 8 ? 0.028 : 0.042);
  // bass: 8ths from bar 2, off in the very last bar
  if (beat0 >= 8 && !lastBars) {
    for (let e = 0; e < 8; e++) bassNote(b(beat0 + e / 2), ROOTS[bar % 4] + (e % 2 ? 12 : 0), BEAT / 2 - 0.02);
  }
  for (let k = 0; k < 4; k++) {
    const beat = beat0 + k;
    const mode = kickMode(beat);
    if (mode === "full" || (mode === "half" && k % 2 === 0)) kick(b(beat));
    if (k % 2 === 1 && (beat >= 4 || mode !== "none") && !lastBars) clap(b(beat), beat < 8 ? 0.2 : 0.32);
    if (beat >= 8 && !lastBars) {
      hat(b(beat + 0.5), 0.09, 0.3, true);
      hat(b(beat + 0.25), 0.035, -0.3);
      hat(b(beat + 0.75), 0.035, -0.3);
    }
  }
  // arp: brighter energy for "kerja sendiri" and the ending drop
  const arpOn = (beat0 >= scene.sendiri.from && beat0 < scene.banding.from) || (inEnding && !lastBars);
  if (arpOn) {
    const notes = PROG[bar % 4];
    const pattern = [0, 1, 2, 3, 2, 1, 3, 2];
    for (let s = 0; s < 16; s++) pluck(b(beat0 + s / 4), notes[pattern[s % 8]] + 12, 0.07, s % 2 ? 0.35 : -0.35);
  }
}
// final chord ring-out
for (const m of [58, 62, 65, 70, 74]) {
  let ph = 0;
  add(music, b(T.totalBeats - 4), b(4), (ts, p) => {
    ph += (2 * Math.PI * midi(m)) / SR;
    return Math.sin(ph) * Math.exp(-ts * 0.9) * 0.06;
  });
}
// risers into the drop (hook -> gaji) and into the ending
riser(music, b(scene.gaji.from - 4), b(4), 0.3);
riser(music, b(scene.ending.from - 4), b(4), 0.3);

// ---------- SFX ----------
const SFX = {
  impact: (t) => {
    add(sfx, t, 0.9, (ts, p) => Math.sin(2 * Math.PI * (60 - 25 * p) * ts) * Math.exp(-p * 4) * 0.8);
    let lp = 0;
    add(sfx, t, 0.5, (ts, p) => {
      lp += 0.15 * (rnd() * 2 - lp);
      return lp * Math.exp(-p * 6) * 0.6;
    });
  },
  pop: (t) => {
    let ph = 0;
    add(sfx, t, 0.12, (ts, p) => {
      ph += (2 * Math.PI * (500 + 900 * p)) / SR;
      return Math.sin(ph) * Math.sin(Math.PI * Math.min(1, p * 1.4)) * 0.45;
    });
  },
  swoosh: (t) => {
    let lp = 0;
    add(sfx, t - 0.15, 0.45, (ts, p) => {
      lp += (0.04 + 0.35 * Math.sin(Math.PI * p)) * (rnd() * 2 - lp);
      return lp * Math.sin(Math.PI * p) ** 2 * 0.55;
    });
  },
  tick: (t) => add(sfx, t, 0.04, (ts, p) => Math.sin(2 * Math.PI * 2100 * ts) * Math.exp(-p * 10) * 0.28, 0.2),
  ding: (t) => {
    for (const [f, a] of [[1318, 0.3], [2637, 0.12], [3951, 0.05]]) {
      add(sfx, t, 1.0, (ts) => Math.sin(2 * Math.PI * f * ts) * Math.exp(-ts * 4) * a);
    }
  },
  cash: (t) => {
    for (const [dt, f] of [[0, 2093], [0.08, 2637]]) {
      add(sfx, t + dt, 0.5, (ts) => (Math.sin(2 * Math.PI * f * ts) + 0.5 * Math.sin(2 * Math.PI * f * 2.4 * ts)) * Math.exp(-ts * 7) * 0.22, 0.15);
    }
    add(sfx, t, 0.18, (ts, p) => rnd() * 2 * Math.exp(-p * 5) * 0.12);
  },
  thud: (t) => {
    add(sfx, t, 0.28, (ts, p) => Math.sin(2 * Math.PI * (110 - 50 * p) * ts) * Math.exp(-p * 6) * 0.6);
    add(sfx, t, 0.05, (ts, p) => rnd() * 2 * (1 - p) * 0.25);
  },
  drop: (t) => {
    let ph = 0;
    add(sfx, t, 0.45, (ts, p) => {
      ph += (2 * Math.PI * (700 - 520 * p)) / SR;
      return Math.sin(ph) * Math.sin(Math.PI * p) * 0.3;
    });
  },
  typing: (t) => {
    for (let i = 0; i < 18; i++) {
      const at = t + i * 0.13 + rnd() * 0.04;
      add(sfx, at, 0.025, (ts, p) => rnd() * 2 * (1 - p) * 0.18, rnd());
    }
  },
  tape: (t) => {
    let lp = 0;
    add(sfx, t, 0.55, (ts, p) => {
      lp += 0.5 * (rnd() * 2 - lp);
      return lp * (0.6 + 0.4 * Math.sin(ts * 260)) * Math.sin(Math.PI * p) * 0.3;
    });
  },
  riser: (t) => riser(sfx, t, b(2), 0.35),
};
for (const ev of T.events) SFX[ev.kind](b(ev.beat));
// clock ticks every half beat while the hands spin
const ev = Object.fromEntries(T.events.map((e) => [e.id, e.beat]));
for (let beat = ev.clockStart; beat < ev.clockEnd; beat += 0.5) SFX.tick(b(beat));
// whoosh into every whip-pan (each scene change after the first)
for (const s of T.scenes.slice(1)) SFX.swoosh(b(s.from) - 0.1);

// ---------- write ----------
const writeWav = (bus, file, ceiling) => {
  let peak = 0;
  for (let i = 0; i < N; i++) {
    bus.L[i] = Math.tanh(bus.L[i]);
    bus.R[i] = Math.tanh(bus.R[i]);
    peak = Math.max(peak, Math.abs(bus.L[i]), Math.abs(bus.R[i]));
  }
  const gain = ceiling / peak;
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
    buf.writeInt16LE(Math.round(bus.L[i] * gain * 32767), 44 + i * 4);
    buf.writeInt16LE(Math.round(bus.R[i] * gain * 32767), 46 + i * 4);
  }
  writeFileSync(join(OUT, file), buf);
  console.log(`${file}: ${DUR.toFixed(2)}s, pre-gain peak ${peak.toFixed(2)}`);
};
writeWav(music, "music.wav", 0.89);
writeWav(sfx, "sfx.wav", 0.8);
