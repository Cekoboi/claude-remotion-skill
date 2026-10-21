// Blind beat analysis of public/kerja/music.wav -> src/kerja/beats.json.
// It is not told the BPM: tempo comes from autocorrelating an onset envelope,
// phase from the grid alignment with the highest onset score, per-beat
// strength from onset energy around each beat, and downbeats from harmonic
// change (a Goertzel chroma per beat; chords change on bar lines).
// The video drives its beat pulses from this file: strong beats get bigger
// moves, weak beats smaller ones. Finally it checks the detected grid against
// the planned one in timing.json and fails if they disagree by > 1 frame.
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..", "..");
const plan = JSON.parse(readFileSync(join(ROOT, "src", "kerja", "timing.json"), "utf8"));
const wav = readFileSync(join(ROOT, "public", "kerja", "music.wav"));

// ---- decode 16-bit PCM wav ----
const channels = wav.readUInt16LE(22);
const SR = wav.readUInt32LE(24);
let off = 12;
while (wav.toString("ascii", off, off + 4) !== "data") off += 8 + wav.readUInt32LE(off + 4);
const dataLen = wav.readUInt32LE(off + 4);
const start = off + 8;
const n = dataLen / (2 * channels);
const x = new Float32Array(n);
for (let i = 0; i < n; i++) {
  let s = 0;
  for (let c = 0; c < channels; c++) s += wav.readInt16LE(start + (i * channels + c) * 2) / 32768;
  x[i] = s / channels;
}
const duration = n / SR;

// ---- onset envelope: band energies (low + full), half-wave rectified log-difference ----
const HOP = Math.round(SR / 100); // 10 ms
const frames = Math.floor(n / HOP);
const low = new Float32Array(frames);
const full = new Float32Array(frames);
let lp = 0;
for (let f = 0; f < frames; f++) {
  let el = 0;
  let ef = 0;
  for (let i = f * HOP; i < (f + 1) * HOP; i++) {
    lp += 0.02 * (x[i] - lp); // ~140 Hz one-pole low-pass: kick + bass
    el += lp * lp;
    ef += x[i] * x[i];
  }
  low[f] = Math.log(1e-9 + el);
  full[f] = Math.log(1e-9 + ef);
}
const env = new Float32Array(frames);
for (let f = 1; f < frames; f++) env[f] = Math.max(0, low[f] - low[f - 1]) * 1.0 + Math.max(0, full[f] - full[f - 1]) * 0.5;

// ---- tempo by autocorrelation, 70–180 BPM, mild log-normal prior around 115 ----
let best = { score: -1, lag: 0 };
const acf = (lag) => {
  let s = 0;
  for (let f = 0; f + lag < frames; f++) s += env[f] * env[f + lag];
  return s / (frames - lag);
};
const minLag = Math.floor((60 / 180) * 100);
const maxLag = Math.ceil((60 / 70) * 100);
const scores = [];
for (let lag = minLag; lag <= maxLag; lag++) {
  const bpm = 6000 / lag;
  const prior = Math.exp(-0.5 * Math.pow(Math.log2(bpm / 115) / 0.9, 2));
  const s = acf(lag) * prior;
  scores[lag] = s;
  if (s > best.score) best = { score: s, lag };
}
// parabolic refinement of the peak lag
const [a, bb, c] = [scores[best.lag - 1], scores[best.lag], scores[best.lag + 1]];
const lagRef = best.lag + (a !== undefined && c !== undefined ? (0.5 * (a - c)) / (a - 2 * bb + c) : 0);
const period = lagRef; // in 10 ms frames
const bpm = 6000 / period;

// ---- phase: offset whose beat comb collects the most onset energy ----
let bestPhase = { score: -1, phase: 0 };
for (let ph = 0; ph < period; ph += 0.25) {
  let s = 0;
  for (let k = 0; ph + k * period < frames; k++) {
    const f = Math.round(ph + k * period);
    s += Math.max(env[f - 1] || 0, env[f], env[f + 1] || 0);
  }
  if (s > bestPhase.score) bestPhase = { score: s, phase: ph };
}

// ---- beats + strength ----
const beatsRaw = [];
for (let k = 0; bestPhase.phase + k * period < frames; k++) {
  const f = bestPhase.phase + k * period;
  let peak = 0;
  for (let d = -3; d <= 3; d++) peak = Math.max(peak, env[Math.round(f) + d] || 0);
  beatsRaw.push({ t: (f * HOP) / SR, peak });
}
const sorted = beatsRaw.map((bt) => bt.peak).sort((p, q) => p - q);
const p95 = sorted[Math.floor(sorted.length * 0.95)] || 1;

// ---- downbeats: harmonic novelty from a Goertzel chroma per beat ----
const goertzel = (from, len, freq) => {
  const w = (2 * Math.PI * freq) / SR;
  const coeff = 2 * Math.cos(w);
  let s1 = 0;
  let s2 = 0;
  for (let i = from; i < from + len && i < n; i++) {
    const s0 = x[i] + coeff * s1 - s2;
    s2 = s1;
    s1 = s0;
  }
  return s1 * s1 + s2 * s2 - coeff * s1 * s2;
};
const chroma = (t0, t1) => {
  const from = Math.floor(t0 * SR);
  const len = Math.floor((t1 - t0) * SR);
  const v = new Array(12).fill(0);
  for (let pc = 0; pc < 12; pc++) {
    for (const oct of [3, 4, 5]) v[pc] += Math.sqrt(goertzel(from, len, 440 * Math.pow(2, (pc - 9) / 12 + (oct - 4))));
  }
  const norm = Math.hypot(...v) || 1;
  return v.map((q) => q / norm);
};
const beatS = period / 100;
const chromas = beatsRaw.map((bt) => chroma(bt.t + 0.05, bt.t + beatS - 0.02));
const novelty = chromas.map((ch, i) => (i === 0 ? 0 : 1 - ch.reduce((s, q, j) => s + q * chromas[i - 1][j], 0)));
const phaseScore = [0, 1, 2, 3].map((m) => novelty.reduce((s, v, i) => s + (i % 4 === m ? v : 0), 0));
const downPhase = phaseScore.indexOf(Math.max(...phaseScore));

const fps = plan.fps;
const beats = beatsRaw.map((bt, i) => ({
  i,
  t: +bt.t.toFixed(4),
  frame: Math.round(bt.t * fps),
  strength: +Math.min(1, bt.peak / p95).toFixed(3),
  downbeat: i % 4 === downPhase,
}));

// ---- compare with the plan ----
const planned = Array.from({ length: plan.totalBeats }, (_, k) => (k * 60) / plan.bpm);
let maxDev = 0;
for (const bt of beats) {
  const k = Math.round((bt.t * plan.bpm) / 60);
  if (k < planned.length) maxDev = Math.max(maxDev, Math.abs(bt.t - planned[k]));
}
const firstDown = beats.find((bt) => bt.downbeat);
const report = {
  source: "scripts/kerja/analyze-beats.mjs (blind analysis of public/kerja/music.wav)",
  durationS: +duration.toFixed(3),
  bpm: +bpm.toFixed(3),
  beatPeriodS: +(60 / bpm).toFixed(4),
  firstBeatS: beats[0].t,
  firstDownbeatS: firstDown.t,
  maxDeviationFromPlanMs: +(maxDev * 1000).toFixed(1),
  beats,
};
writeFileSync(join(ROOT, "src", "kerja", "beats.json"), JSON.stringify(report) + "\n");
console.log(`detected ${bpm.toFixed(2)} BPM (plan ${plan.bpm}), ${beats.length} beats, first beat ${beats[0].t}s, first downbeat ${firstDown.t}s`);
console.log(`max deviation from planned grid: ${(maxDev * 1000).toFixed(1)} ms (${((maxDev * fps)).toFixed(2)} frames)`);
console.log(`downbeat phase scores: ${phaseScore.map((s) => s.toFixed(2)).join(" ")} -> phase ${downPhase}`);
console.log(`strength: weakest ${sorted[0].toFixed(2)}, median ${sorted[Math.floor(sorted.length / 2)].toFixed(2)}, p95 ${p95.toFixed(2)}`);
if (maxDev * fps > 1) {
  console.error("detected grid disagrees with the plan by more than one frame");
  process.exit(1);
}
