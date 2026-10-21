// skyline.ts — pure geometry for the KL skyline. No React, no timing:
// everything here is deterministic (seeded) so every render is identical.

export const W = 1080;
export const GROUND = 1240;

// seeded PRNG (mulberry32) — never Math.random() in a render
export const rng = (seed: number) => {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
};

// ---------- Petronas Twin Towers ----------
// [halfWidth, topY] tiers, bottom to top; then ring + spire
const TIERS: [number, number][] = [
  [66, 820],
  [59, 740],
  [52, 672],
  [44, 615],
  [35, 568],
  [25, 530],
  [17, 498],
];
const SPIRE_TOP = 330;
const SPIRE_HALF = 3;

export const towerHalfWidthAt = (y: number) => {
  let bottom = GROUND;
  for (const [hw, top] of TIERS) {
    if (y <= bottom && y >= top) return hw;
    bottom = top;
  }
  return 0;
};

export const petronasPath = (cx: number) => {
  const left: string[] = [`M ${cx - TIERS[0][0]} ${GROUND}`];
  for (let i = 0; i < TIERS.length; i++) {
    const [hw, top] = TIERS[i];
    left.push(`L ${cx - hw} ${top}`);
    const next = TIERS[i + 1];
    left.push(`L ${cx - (next ? next[0] : SPIRE_HALF)} ${top}`);
  }
  left.push(`L ${cx} ${SPIRE_TOP}`);
  const right: string[] = [];
  for (let i = TIERS.length - 1; i >= 0; i--) {
    const [hw, top] = TIERS[i];
    const next = TIERS[i + 1];
    right.push(`L ${cx + (next ? next[0] : SPIRE_HALF)} ${top}`);
    right.push(`L ${cx + hw} ${top}`);
  }
  right.push(`L ${cx + TIERS[0][0]} ${GROUND}`);
  return [...left, ...right, "Z"].join(" ");
};

export const PETRONAS = { left: 430, right: 650 };

// floors: horizontal light bands, bottom to top
export const petronasFloors = (cx: number) => {
  const floors: { x1: number; x2: number; y: number; i: number }[] = [];
  let i = 0;
  for (let y = GROUND - 10; y > TIERS[TIERS.length - 1][1] + 4; y -= 13) {
    const hw = towerHalfWidthAt(y) - 7;
    if (hw > 4) floors.push({ x1: cx - hw, x2: cx + hw, y, i: i++ });
  }
  return floors;
};

// vertical ribs give the towers their fluted steel skin
export const petronasRibs = (cx: number) => {
  const ribs: { x: number; y1: number; y2: number }[] = [];
  for (const off of [-48, -30, -12, 12, 30, 48]) {
    let top = GROUND;
    for (const [hw, t] of TIERS) {
      if (hw - 5 > Math.abs(off)) top = t;
    }
    ribs.push({ x: cx + off, y1: GROUND, y2: top + 6 });
  }
  return ribs;
};

export const SKYBRIDGE = {
  x1: PETRONAS.left + 66,
  x2: PETRONAS.right - 66,
  y: 888,
  h: 16,
  legsY: 985,
};

// ---------- Menara KL ----------
export const KLT = { cx: 168, podY: 600 };
export const kltPath = () => {
  const { cx } = KLT;
  return [
    `M ${cx - 16} ${GROUND}`,
    `L ${cx - 10} 668`,
    // pod: bowl underside flaring out, glass band, cap
    `C ${cx - 18} 650 ${cx - 50} 636 ${cx - 54} 616`,
    `L ${cx - 54} 596`,
    `C ${cx - 50} 580 ${cx - 34} 570 ${cx - 20} 566`,
    `L ${cx - 20} 552`,
    `L ${cx - 5} 548`,
    `L ${cx - 4} 470`,
    `L ${cx - 1.5} 466`,
    `L ${cx} 372`,
    `L ${cx + 1.5} 466`,
    `L ${cx + 4} 470`,
    `L ${cx + 5} 548`,
    `L ${cx + 20} 552`,
    `L ${cx + 20} 566`,
    `C ${cx + 34} 570 ${cx + 50} 580 ${cx + 54} 596`,
    `L ${cx + 54} 616`,
    `C ${cx + 50} 636 ${cx + 18} 650 ${cx + 10} 668`,
    `L ${cx + 16} ${GROUND}`,
    "Z",
  ].join(" ");
};

// ---------- generic city blocks ----------
export type Building = {
  x: number;
  w: number;
  h: number;
  layer: "far" | "near";
  roof: "flat" | "step" | "mast";
  windows: { x: number; y: number; t: number }[]; // t: 0..1 light-up order
};

const makeLayer = (
  seed: number,
  layer: "far" | "near",
  count: number,
  hMin: number,
  hMax: number,
  avoid: [number, number][],
): Building[] => {
  const r = rng(seed);
  const out: Building[] = [];
  let x = -30;
  while (out.length < count && x < W + 20) {
    const w = 52 + r() * 70;
    const gap = layer === "far" ? r() * 6 : 6 + r() * 26;
    const mid = x + w / 2;
    const blocked = avoid.some(([a, b]) => mid > a && mid < b);
    const h = blocked ? hMin * 0.55 : hMin + r() * (hMax - hMin);
    const roofRoll = r();
    const windows: Building["windows"] = [];
    const cols = Math.floor((w - 12) / 14);
    const rows = Math.floor((h - 26) / 19);
    const colOff = (w - cols * 14) / 2 + 4;
    for (let c = 0; c < cols; c++) {
      for (let rr = 0; rr < rows; rr++) {
        if (r() < (layer === "far" ? 0.42 : 0.5)) {
          windows.push({
            x: x + colOff + c * 14,
            y: GROUND - 18 - rr * 19 - 9,
            t: r(),
          });
        }
      }
    }
    out.push({
      x,
      w,
      h,
      layer,
      roof: roofRoll < 0.6 ? "flat" : roofRoll < 0.85 ? "step" : "mast",
      windows,
    });
    x += w + gap;
  }
  return out;
};

export const FAR = makeLayer(7, "far", 22, 170, 430, [
  [360, 720],
]);
export const NEAR = makeLayer(42, "near", 16, 70, 210, [
  [400, 680],
  [140, 196],
]);

export const buildingPath = (b: Building) => {
  const top = GROUND - b.h;
  if (b.roof === "step") {
    const inset = b.w * 0.22;
    return `M ${b.x} ${GROUND} L ${b.x} ${top + 22} L ${b.x + inset} ${top + 22} L ${b.x + inset} ${top} L ${b.x + b.w - inset} ${top} L ${b.x + b.w - inset} ${top + 22} L ${b.x + b.w} ${top + 22} L ${b.x + b.w} ${GROUND} Z`;
  }
  if (b.roof === "mast") {
    const mx = b.x + b.w / 2;
    return `M ${b.x} ${GROUND} L ${b.x} ${top} L ${mx - 2} ${top} L ${mx} ${top - 46} L ${mx + 2} ${top} L ${b.x + b.w} ${top} L ${b.x + b.w} ${GROUND} Z`;
  }
  return `M ${b.x} ${GROUND} L ${b.x} ${top} L ${b.x + b.w} ${top} L ${b.x + b.w} ${GROUND} Z`;
};

export const TOTAL_WINDOWS =
  FAR.reduce((n, b) => n + b.windows.length, 0) +
  NEAR.reduce((n, b) => n + b.windows.length, 0);

// stars: fixed field in the upper sky
export const STARS = (() => {
  const r = rng(99);
  return Array.from({ length: 140 }, () => ({
    x: r() * W,
    y: 40 + Math.pow(r(), 1.4) * 900,
    s: 0.8 + r() * 1.9,
    phase: r() * Math.PI * 2,
    t: r(),
  }));
})();
