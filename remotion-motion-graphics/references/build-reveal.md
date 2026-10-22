# Build Reveal — The Video That Shows Itself Being Made

A "behind the build" promo: a small mascot runs around inside a video editor,
pressing tools and dragging effects while the title takes shape in the
preview; then the same title is generated from a prompt, and the animation
tool shows the real curves and keyframes driving it. Use it for AI creative
tools, motion/design apps, and "made with X" showcases. Builds on
`ai-demo.md` (prompt, chips, typing, morphs), `product-promo.md` (stage,
finishing) and `light-path.md` (hop with echo).

## Contents
1. Reference teardown
2. The editor as a 3D set
3. Mascot puppet (squash, blink, hop between stations, press what it lands on)
4. Breaking out of the canvas (shards)
5. Particle typography (text built from thousands of dots)
6. Iridescent "working…" pill
7. A live graph editor (the UI shows the real data)
8. Halftone backdrop with a geometric mask
9. Logo assembly (strokes fly in and lock)
10. Notes on the reference's production

---

## 1. Reference teardown
A 27s promo for an AI model (16:9, 30fps, warm dark stage, one orange hero),
copy in Indonesian.

| Time | Shot | What moves |
|---|---|---|
| 0–1.5s | Editor | A recreated video-editor UI (toolbar, project panel, preview, timeline) seen at a tilt; a round orange mascot stands in the blank preview |
| 1.5–4s | Break out | The mascot jumps out of the preview, which shatters into shards, lands on the toolbar and stands on a tool; the tool lights up as if pressed |
| 4–5.5s | Effect | The camera swings to the effects panel; the mascot hops onto "Glow" and drags it; the preview gains the glow |
| 5.5–10s | Timeline | The mascot rides the playhead across tilted, colored timeline tracks while the preview builds the title; the camera flies along with motion blur |
| 10–12s | Into preview | Camera pushes over the preview as it turns dark; the mascot peeks from its corner |
| 12–14s | Particles | Full frame: a huge "5.5" made of thousands of dots behind the title; then the dots blow away like dust |
| 14–18.5s | Prompt | Serif greeting types in ("Halo, Ngorz / Mau bikin apa hari ini?"); a prompt box types the request; a chip is clicked; send |
| 19–20.5s | Working | The whole UI collapses into a glowing pill, "Menganimasikan…", with a spinner and an iridescent violet-orange glow |
| 20.5–23.5s | Tool | The pill opens into an animation app: preview, an easing graph (easeOutBack) with a moving dot, property bars, keyframe tracks ("Rays ×12", "Hub", "Rotasi", "Teks") and a playhead, all in sync with the preview |
| 24–25.5s | Assembly | Push into the preview: a halftone dot field with a dark hexagon window; the logo's rays fly in one by one and lock to the hub |
| 26–27s | End card | Logo + name + "Dari satu prompt, jadi motion." |

The ideas that carry it:
- **Show the making as the content.** The editor, the effect, the keyframes
  are the set; the finished title is the payoff.
- **A character gives the UI scale and intent.** Every tool the mascot touches
  does something visible in the preview.
- **The UI is honest.** The easing graph, the bars and the keyframes are the
  same numbers that animate the preview, so the tool feels real.

## 2. The editor as a 3D set
Build the editor as plain React components laid out flat at a large size
(e.g. 2400×1400), then put the whole thing on one tilted plane and fly a
camera over it. Combine `ai-demo.md` §8 (one canvas, one camera) with a tilt:
```tsx
type Cam = [frame: number, x: number, y: number, zoom: number, tilt: number, turn: number];

export const camAt = (frame: number, cams: Cam[], k: number) =>
  interpolate(frame, cams.map((c) => c[0]), cams.map((c) => c[k]), {
    easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });

export const EditorSet: React.FC<{cams: Cam[]; children: React.ReactNode}> = ({cams, children}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const at = (k: number) => camAt(frame, cams, k);
  return (
    <AbsoluteFill style={{perspective: 1500, overflow: "hidden"}}>
      <div style={{position: "absolute", left: 0, top: 0, transformOrigin: "0 0",
        transform: `translate(${W / 2}px, ${H / 2}px) rotateX(${at(4)}deg) rotateZ(${at(5)}deg) scale(${at(3)}) translate(${-at(1)}px, ${-at(2)}px)`,
        transformStyle: "preserve-3d"}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
```
Anything that should stand up off the plane (the mascot, a floating badge)
is a **billboard**: a direct child of the set (not inside a flattened UI
panel) that undoes the camera's tilt and turn, so it faces the lens while
its feet stay on the UI.
```tsx
export const Billboard: React.FC<{cams: Cam[]; x: number; y: number; children: React.ReactNode}> = ({cams, x, y, children}) => {
  const frame = useCurrentFrame();
  return (
    <div style={{position: "absolute", left: x, top: y, transformOrigin: "50% 100%",
      transform: `translate(-50%, -100%) rotateZ(${-camAt(frame, cams, 5)}deg) rotateX(${-camAt(frame, cams, 4)}deg)`}}>
      {children}
    </div>
  );
};
```
Give the preview a **dark neutral canvas** (e.g. #3A3D44), not white or light
gray: under the bloom pass from `product-promo.md` §15 a light canvas becomes a
glowing lightbox, and raising the bloom's contrast does not fix it (CSS
contrast pivots at mid-gray, so mid tones always lift). A neutral ground also
keeps a colored mascot readable.

Design the UI as your own generic editor (toolbar of icon buttons, a panel
list, a preview, a timeline of colored bars); do not copy a real product's
trade dress. Make UI text large enough to survive the tilt (≥ 18px at set
scale). Wrap the set in `<CameraMotionBlur>` — fast camera moves over fine UI
text strobe without it.

## 3. Mascot puppet
A simple SVG character animated like a puppet: squash and stretch from its
feet, a deterministic blink, a lean in the direction of travel. It moves
between **stations** (UI anchors in set coordinates) on arcs, and anything at
a station can read whether the mascot is standing on it.
```tsx
export type Station = {x: number; y: number; at: number; stay: number};

// where the mascot is, and how it moves, at any frame
export const mascotAt = (frame: number, stations: Station[], hop = 12, height = 140) => {
  let i = stations.length - 1;
  while (i > 0 && frame < stations[i].at) i--;
  const s = stations[i];
  const next = stations[i + 1];
  const leave = s.at + s.stay;
  if (!next || frame < leave) {
    const landed = frame - s.at;
    return {x: s.x, y: s.y, air: 0, landed, dir: 0, station: i};
  }
  const t = Math.min(1, (frame - leave) / hop);
  return {
    x: interpolate(t, [0, 1], [s.x, next.x]),
    y: interpolate(t, [0, 1], [s.y, next.y]) - Math.sin(Math.PI * t) * height,
    air: Math.sin(Math.PI * t), landed: -1, dir: Math.sign(next.x - s.x), station: -1,
  };
};

export const Mascot: React.FC<{size: number; air: number; landed: number; dir: number; color: string}> =
({size, air, landed, dir, color}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  // landing squash: a spring that overshoots back to 1
  const land = landed >= 0 ? spring({frame: landed, fps, config: {damping: 7, stiffness: 220, mass: 0.6}}) : 1;
  const sy = landed >= 0 ? interpolate(land, [0, 1], [0.7, 1]) : 1 + air * 0.18;
  const blink = frame % 70 < 3 ? 0.12 : 1;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{overflow: "visible",
      scale: `${1 / sy} ${sy}`, transformOrigin: "50% 100%", rotate: `${dir * air * 12}deg`}}>
      <ellipse cx={50} cy={98} rx={30 * (1 - air * 0.5)} ry={4} fill="rgba(0,0,0,0.35)" />
      <path d="M 50 16 C 56 4, 66 4, 68 8 C 62 10, 56 14, 52 18 Z" fill="#4CAF50" />
      <ellipse cx={50} cy={58} rx={40} ry={38} fill={color} />
      <ellipse cx={38} cy={44} rx={12} ry={8} fill="white" opacity={0.25} />
      {[38, 62].map((x) => (
        <ellipse key={x} cx={x + dir * 3} cy={56} rx={5} ry={6.5 * blink} fill="#2B1A12" />
      ))}
      <ellipse cx={34} cy={95} rx={9} ry={5} fill={color} />
      <ellipse cx={66} cy={95} rx={9} ry={5} fill={color} />
    </svg>
  );
};

// a tool button that lights up and dips while the mascot stands on it
const pressed = (frame: number, stations: Station[], index: number) => mascotAt(frame, stations).station === index;
```
Place the mascot in set coordinates inside a `Billboard` (§2), so it moves
with the camera but stands upright. To "drag" something, render the dragged item at the mascot's
position plus an offset while `station` is between pickup and drop. For the
playhead ride, make the playhead's x a function of time and put a station's
x on it every frame (or skip stations and set the mascot's x to the playhead).
An illustrated or 3D-rendered PNG of a character works the same way: the
puppet moves are transforms on the image.

## 4. Breaking out of the canvas
When the mascot leaves the preview, the preview's surface cracks into shards
that fly toward camera, spin and fall. Seeded triangles around an origin:
```tsx
export const Shards: React.FC<{x: number; y: number; start: number; count?: number; color?: string}> =
({x, y, start, count = 22, color = "rgba(235,240,245,0.9)"}) => {
  const frame = useCurrentFrame();
  const age = frame - start;
  if (age < 0 || age > 30) return null;
  return (
    <svg style={{position: "absolute", left: 0, top: 0, overflow: "visible"}} width={1} height={1}>
      {Array.from({length: count}).map((_, i) => {
        const a = random(`sa${i}`) * Math.PI * 2;
        const v = 6 + random(`sv${i}`) * 14;
        const px = x + Math.cos(a) * v * age;
        const py = y + Math.sin(a) * v * age * 0.6 + 0.6 * age * age;
        const s = 10 + random(`ss${i}`) * 26;
        return (
          <polygon key={i} points={`0,${-s} ${s * 0.8},${s * 0.6} ${-s * 0.6},${s * 0.4}`}
            transform={`translate(${px} ${py}) rotate(${(random(`sr${i}`) - 0.5) * 40 * age})`}
            fill={color} opacity={1 - age / 30} />
        );
      })}
    </svg>
  );
};
```

## 5. Particle typography
Rasterize the text once into an offscreen canvas, keep every Nth opaque
pixel as a particle's target, then draw all particles on one `<canvas>` per
frame. Assemble: each particle travels from a seeded scatter point with its
own delay. Disperse: each drifts outward and up with seeded speed while
fading. Canvas, not SVG: thousands of nodes times motion-blur samples is too
many DOM elements.
```tsx
import {useLayoutEffect, useMemo, useRef} from "react";

export const useTextPoints = (text: string, font: string, size: number, step: number) =>
  useMemo(() => {
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d")!;
    const f = `800 ${size}px ${font}`;
    ctx.font = f;
    const w = Math.ceil(ctx.measureText(text).width);
    const h = Math.ceil(size * 1.15);
    c.width = w;
    c.height = h;
    ctx.font = f;
    ctx.textBaseline = "top";
    ctx.fillStyle = "#fff";
    ctx.fillText(text, 0, 0);
    const data = ctx.getImageData(0, 0, w, h).data;
    const pts: {x: number; y: number}[] = [];
    for (let y = 0; y < h; y += step) for (let x = 0; x < w; x += step) {
      if (data[(y * w + x) * 4 + 3] > 128) pts.push({x, y});
    }
    return {pts, w, h};
  }, [text, font, size, step]);

export const ParticleText: React.FC<{text: string; font: string; size: number; step?: number; color: string;
  assemble: number; disperse: number; width: number; height: number}> =
({text, font, size, step = 5, color, assemble, disperse, width, height}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const {pts, w, h} = useTextPoints(text, font, size, step);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const ox = (width - w) / 2, oy = (height - h) / 2;
    ctx.fillStyle = color;
    pts.forEach((p, i) => {
      const delay = random(`d${i}`) * 0.45;
      const t = Math.min(1, Math.max(0, (assemble - delay) / 0.55));
      const e = 1 - Math.pow(1 - t, 3);
      const a = random(`a${i}`) * Math.PI * 2;
      const r = 250 + random(`r${i}`) * 500;
      let x = ox + p.x + Math.cos(a) * r * (1 - e);
      let y = oy + p.y + Math.sin(a) * r * (1 - e);
      // disperse: outward + up, each with its own speed
      const k = disperse * (0.4 + random(`k${i}`));
      x += Math.cos(a) * 320 * k;
      y += Math.sin(a) * 160 * k - 220 * k;
      const alpha = e * (1 - Math.min(1, disperse * 1.3)) * (0.55 + 0.45 * Math.sin(frame / 5 + i));
      if (alpha <= 0.01) return;
      ctx.globalAlpha = alpha;
      ctx.fillRect(x, y, 2, 2);
    });
    ctx.globalAlpha = 1;
  }, [frame, pts, w, h, width, height, color, assemble, disperse]);
  return <canvas ref={ref} width={width} height={height} style={{position: "absolute", left: 0, top: 0}} />;
};
```
The font must be loaded before the first frame (load it with `FontFace` +
`delayRender` at the root, as the repo examples do), or the points come from
the fallback font. Put a crisp title on top of the particle numerals; the
particles are texture, the title is the read.

## 6. Iridescent "working…" pill
The prompt UI collapses into a pill (see `ai-demo.md` §4 and `product-promo.md`
§11 for the morph). While it works, a rotating conic gradient lights it from
behind and a spinner arc turns. Then the pill opens into the result window.
```tsx
export const WorkingPill: React.FC<{label: string; colors: string[]}> = ({label, colors}) => {
  const frame = useCurrentFrame();
  const angle = frame * 6;
  return (
    // isolation makes the pill its own stacking context, so the glow at z -1 sits behind
    // the pill but in front of everything behind it
    <div style={{position: "relative", isolation: "isolate", padding: "16px 34px 16px 64px", borderRadius: 40, fontSize: 30, fontWeight: 600,
      color: "white", background: `linear-gradient(100deg, ${colors.join(", ")})`}}>
      <div style={{position: "absolute", inset: -40, borderRadius: 80, zIndex: -1, filter: "blur(40px)", opacity: 0.9,
        background: `conic-gradient(from ${angle}deg, ${[...colors, colors[0]].join(", ")})`}} />
      <svg width={28} height={28} viewBox="0 0 28 28" style={{position: "absolute", left: 22, top: "50%", marginTop: -14, rotate: `${frame * 14}deg`}}>
        <circle cx={14} cy={14} r={11} fill="none" stroke="white" strokeWidth={3} strokeLinecap="round" strokeDasharray="48 100" />
      </svg>
      {label}
      <span style={{opacity: Math.floor(frame / 8) % 4 > 0 ? 1 : 0}}>.</span>
      <span style={{opacity: Math.floor(frame / 8) % 4 > 1 ? 1 : 0}}>.</span>
      <span style={{opacity: Math.floor(frame / 8) % 4 > 2 ? 1 : 0}}>.</span>
    </div>
  );
};
// <WorkingPill label="Menganimasikan" colors={["#E8743B", "#B57BFF", "#F5A06B"]} />
```

## 7. A live graph editor
The tool panel plots the actual easing function used in the preview, puts a
dot at the current progress, fills property bars with the eased values, and
runs a playhead over keyframe tracks. One progress value drives everything,
so the panel and the preview can never disagree.
```tsx
export const EaseGraph: React.FC<{ease: (t: number) => number; t: number; w: number; h: number; color: string}> =
({ease, t, w, h, color}) => {
  const lo = -0.2, hi = 1.25; // room for overshoot (easeOutBack)
  const y = (v: number) => h - ((v - lo) / (hi - lo)) * h;
  const d = Array.from({length: 61}, (_, i) => {
    const u = i / 60;
    return `${i ? "L" : "M"} ${u * w} ${y(ease(u))}`;
  }).join(" ");
  return (
    <svg width={w} height={h}>
      <path d={d} fill="none" stroke={color} strokeWidth={3} />
      <circle cx={t * w} cy={y(ease(t))} r={6} fill="white" />
    </svg>
  );
};

type Track = {label: string; keys: number[]}; // key frames, in frames
export const KeyTracks: React.FC<{tracks: Track[]; frame: number; total: number; w: number; color: string}> =
({tracks, frame, total, w, color}) => (
  <div style={{position: "relative", width: w}}>
    {tracks.map((tr) => (
      <div key={tr.label} style={{display: "flex", alignItems: "center", height: 34, gap: 12}}>
        <div style={{width: 90, fontSize: 15, color: "#BBB"}}>{tr.label}</div>
        <div style={{position: "relative", flex: 1, height: 14, borderRadius: 7, background: "rgba(255,255,255,0.06)"}}>
          <div style={{position: "absolute", top: 0, bottom: 0, borderRadius: 7, background: `${color}66`,
            left: `${(tr.keys[0] / total) * 100}%`, width: `${((tr.keys[tr.keys.length - 1] - tr.keys[0]) / total) * 100}%`}} />
          {tr.keys.map((k) => (
            <div key={k} style={{position: "absolute", top: 1, width: 12, height: 12, marginLeft: -6, rotate: "45deg",
              left: `${(k / total) * 100}%`, background: frame >= k ? color : "#666"}} />
          ))}
        </div>
      </div>
    ))}
    <div style={{position: "absolute", top: -6, bottom: -6, width: 2, background: color,
      left: 102 + ((w - 102) * Math.min(frame, total)) / total}} />
  </div>
);
// const easeOutBack = Easing.out(Easing.back(1.7)); use the same function for the preview and the graph
```

## 8. Halftone backdrop with a geometric mask
A dot field from a repeating radial gradient, a dark hexagon window cut over
it with `clip-path`, and a warm glow inside. Animate the window's scale to
open it.
```tsx
export const Halftone: React.FC<{open: number; dot: string; bg: string}> = ({open, dot, bg}) => (
  <AbsoluteFill style={{background: bg}}>
    <AbsoluteFill style={{backgroundImage: `radial-gradient(circle, ${dot} 2px, transparent 2.6px)`, backgroundSize: "14px 14px"}} />
    <AbsoluteFill style={{background: bg, scale: interpolate(open, [0, 1], [0.2, 1]),
      clipPath: "polygon(26% 0, 74% 0, 96% 50%, 74% 100%, 26% 100%, 4% 50%)"}} />
  </AbsoluteFill>
);
```

## 9. Logo assembly
A mark made of N strokes (rays, petals, bars): each stroke starts at a seeded
distance and rotation and springs to its slot, on a stagger; then the whole
mark gives a small overshoot spin.
```tsx
export const AssembleMark: React.FC<{n: number; start: number; r: number; len: number; color: string}> =
({n, start, r, len, color}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const settle = spring({frame: frame - start - n * 2, fps, config: theme.spring.bouncy});
  return (
    <div style={{position: "relative", width: 0, height: 0, rotate: `${interpolate(settle, [0, 1], [-30, 0])}deg`}}>
      {Array.from({length: n}).map((_, i) => {
        const s = spring({frame: frame - start - i * 2, fps, config: theme.spring.smooth});
        const base = (i / n) * 360;
        const fromA = base + (random(`ra${i}`) - 0.5) * 220;
        const fromD = 260 + random(`rd${i}`) * 320;
        const dir = (fromA * Math.PI) / 180; // fly in along the stroke's own (seeded) direction
        const dx = Math.sin(dir) * fromD * (1 - s);
        const dy = -Math.cos(dir) * fromD * (1 - s);
        return (
          <div key={i} style={{position: "absolute", left: -len * 0.11, top: -r - len, width: len * 0.22, height: len,
            borderRadius: len, background: color, opacity: s, transformOrigin: `50% ${len + r}px`,
            rotate: `${interpolate(s, [0, 1], [fromA, base])}deg`,
            translate: `${dx}px ${dy}px`}} />
        );
      })}
    </div>
  );
};
```

## 10. Notes on the reference's production
- The editor in the reference resembles a mainstream desktop editor's layout;
  whether it is a recreation or a screen capture mapped onto a 3D plane, the
  reliable way to get the same freedom of camera is to rebuild the UI as
  components (§2): it stays sharp at any zoom and every part can animate.
- The mascot reads as a rendered 3D character (soft clay shading). An
  illustrated or 3D-rendered PNG, puppeted with the transforms in §3, gets
  closest; the SVG puppet is the code-only stand-in.
- Brand rules from `product-promo.md` apply: a real product's logo, name and
  UI only for that company, with permission, or as a labeled spec piece.
