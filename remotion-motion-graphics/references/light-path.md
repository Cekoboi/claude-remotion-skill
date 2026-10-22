# Light Path — One Glowing Line Through the Whole Video

A single glowing line is the narrative thread: it bursts out of the logo,
traces the device, climbs the leaderboard beside the user's row, becomes an
audio waveform, splits into branches that light up feature nodes, then merges
back into the underline under the closing tagline. Every scene is "the line
arriving somewhere". Use it for app/SaaS promos whose story is a journey
(progress, learning, growth, a funnel). Pairs with `product-promo.md`, which
covers the stage, light, device, and morph basics.

## Contents
1. Reference teardown
2. Setup (`@remotion/paths`)
3. The light trail (segment + glow + comet head)
4. Line → waveform
5. Branch split + node ignition
6. Segmented underline (the callback)
7. Speed-line burst (logo entrance)
8. Hop with echo trail (mascot moves)
9. Word tiles that fly into place
10. Odometer counter
11. Leaderboard climb (FLIP reorder)
12. Brand and trademark rules

---

## 1. Reference teardown
A 22.5s spec ad for a language-learning app, 16:9, 30fps, same stage as
`product-promo.md` (near-black, brand-green glow, no hard cuts). The line is
present in almost every shot.

| Time | Shot | What the line does / what moves |
|---|---|---|
| 0.0–1.0s | Mascot burst | Mascot pops in at the center of radiating speed lines; wordmark slides in from the left with motion blur |
| 1.0–2.0s | Logo hold | Mascot + wordmark lockup, glow pulses |
| 2.0–2.8s | Exit | Wordmark blurs out; mascot hops away along a curve leaving echo copies; its wake becomes the line |
| 2.8–5.3s | Lesson | Line wraps the phone's edge. Word-bank tiles fly into the answer row, leaving placeholders; progress bar fills; green "Excellent!" footer slides up |
| 5.3–7.3s | Streak | Line underlines the card. Flame + odometer counter rolls 1 → 365 with blurred digits; seven week dots fill one by one |
| 7.3–9.8s | League | Line runs up the left edge beside the user's row as it climbs 7 → 3 → 1, XP ticking, other rows sliding down |
| 9.8–11.8s | Video call | Line runs across the call card and becomes the voice waveform; chat bubbles pop in |
| 11.8–15.0s | Skill tree | Line splits into four branches from the bottom; each node ignites in its own color (green, blue, pink, cream) with a colored smear; small flags orbit the first node |
| 15.0–17.0s | Tagline | Branches sweep together into the underline of "One path." → "Every skill.", whose underline is four colored segments joined by dots (the four nodes) |
| 17.0–19.5s | Logo outro | Mascot pops back in, wordmark below — bookend |
| 19.5–22.5s | Credit | Lockup collapses to a spark → white streak → "made by" credit + "Spec ad · not affiliated" |

The rules this style adds on top of `product-promo.md`:
- **One line, never two.** It always has exactly one head. When it splits, it
  splits from a visible point; when it merges, the branches visibly converge.
- **The line leads, the UI follows.** The head arrives a few frames before the
  element it points at animates. Put the hit SFX on the head's arrival.
- **Color is earned.** The line is the brand color. A node only gets its own
  color when the line reaches it, and the closing underline collects those colors.

## 2. Setup
```bash
npx remotion add @remotion/paths   # same version as remotion
```
All geometry lives in one SVG layer the size of the frame (`viewBox` = frame
size), drawn above the scenes, so the line can cross scene boundaries.
Write path strings by hand (`M x y C ...`) in frame coordinates. Measure once:
```tsx
import {getLength, getPointAtLength, getTangentAtLength} from "@remotion/paths";
const len = useMemo(() => getLength(d), [d]); // parsing every frame is slow
```

## 3. The light trail
Show only the slice of the path between `tail` and `head` (both 0–1). A dash
pattern does it with no path cutting: one dash as long as the slice, a gap
longer than the path, shifted forward by the tail.
```tsx
import React, {useMemo} from "react";
import {getLength, getPointAtLength} from "@remotion/paths";

export const LightTrail: React.FC<{d: string; head: number; tail: number; color: string; width?: number}> =
({d, head, tail, color, width = 4}) => {
  const len = useMemo(() => getLength(d), [d]);
  const a = Math.max(0, Math.min(tail, head)) * len;
  const b = Math.max(0, Math.min(1, head)) * len;
  const dash = {strokeDasharray: `${Math.max(b - a, 0.001)} ${len + 1}`, strokeDashoffset: -a};
  const tip = getPointAtLength(d, b);
  const visible = b - a > 0.5;
  return (
    <g style={{opacity: visible ? 1 : 0}}>
      {/* wide soft glow, mid glow, hot core */}
      <path d={d} fill="none" stroke={color} strokeWidth={width * 5} strokeLinecap="round"
        opacity={0.25} style={{...dash, filter: "blur(10px)"}} />
      <path d={d} fill="none" stroke={color} strokeWidth={width * 1.8} strokeLinecap="round"
        opacity={0.7} style={{...dash, filter: "blur(2px)"}} />
      <path d={d} fill="none" stroke="#F4FFE8" strokeWidth={width * 0.6} strokeLinecap="round" style={dash} />
      {tip && head < 1 && (
        <circle cx={tip.x} cy={tip.y} r={width * 2.2} fill="#F4FFE8"
          style={{filter: `drop-shadow(0 0 ${width * 3}px ${color})`}} />
      )}
    </g>
  );
};
```
Drive it with two springs or eased interpolations: the head leads, the tail
follows 6–15 frames later (a comet), or the tail stays at 0 (a line being drawn
that stays). The comet head disappears once `head` hits 1.
```tsx
const head = interpolate(frame, [0, 24], [0, 1], {easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp"});
const tail = interpolate(frame, [10, 34], [0, 1], {easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp"});
<svg width={width} height={height} style={{position: "absolute", overflow: "visible"}}>
  <LightTrail d="M 200 900 C 300 600, 500 500, 820 520" head={head} tail={tail} color={theme.colors.primary} />
</svg>
```
To make the line hug a UI element (the phone's edge, a card's left side), write
the path along that element's border in frame coordinates, offset 12–20px
outward, so the glow never sits on top of text.

## 4. Line → waveform
A waveform is a path rebuilt every frame from a function. Ramp its amplitude
from 0 so the straight line visibly "starts talking". Deterministic noise only
(`random()` from remotion, or sums of sines), never `Math.random()`.
```tsx
const wavePath = (x0: number, x1: number, y: number, amp: number, frame: number) => {
  const pts: string[] = [];
  for (let x = x0; x <= x1; x += 6) {
    const u = (x - x0) / (x1 - x0);
    const env = Math.sin(Math.PI * u);                     // quiet at both ends
    const v = Math.sin(x * 0.045 + frame * 0.5) * 0.6 + Math.sin(x * 0.11 - frame * 0.8) * 0.4;
    pts.push(`${x === x0 ? "M" : "L"} ${x} ${y + v * amp * env}`);
  }
  return pts.join(" ");
};
// amp: 0 while the line arrives, then up to ~26px while "speech" plays
const amp = interpolate(frame, [20, 32], [0, 26], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
<LightTrail d={wavePath(220, 1700, 860, amp, frame)} head={1} tail={0} color={theme.colors.primary} />
```
For speech, drive `amp` from the real voice-over with `useAudioData` +
`visualizeAudio` from `@remotion/media-utils` instead of the sines.

## 5. Branch split + node ignition
All branches share one start point, so it reads as one line splitting. Each
branch's head is staggered; its node ignites the frame the head arrives.
```tsx
type Branch = {d: string; node: {x: number; y: number}; color: string; label: string};

export const BranchTree: React.FC<{branches: Branch[]; start: number; stagger: number; draw: number}> =
({branches, start, stagger, draw}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <>
      {branches.map((b, i) => {
        const t0 = start + i * stagger;
        const head = interpolate(frame, [t0, t0 + draw], [0, 1], {
          easing: theme.ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const lit = spring({frame: frame - t0 - draw, fps, config: theme.spring.bouncy});
        return (
          <g key={b.label}>
            <LightTrail d={b.d} head={head} tail={0} color={theme.colors.primary} width={3} />
            {/* the colored smear: a blurred ellipse trailing behind the node */}
            <ellipse cx={b.node.x - 60 * lit} cy={b.node.y} rx={90 * lit} ry={26 * lit}
              fill={b.color} opacity={0.35 * lit} style={{filter: "blur(18px)"}} />
            <circle cx={b.node.x} cy={b.node.y} r={34 * (0.85 + 0.15 * lit)}
              fill={lit > 0.05 ? b.color : "#2A2F33"} stroke="#3A4045" strokeWidth={lit > 0.05 ? 0 : 2}
              style={{filter: lit > 0.05 ? `drop-shadow(0 0 ${18 * lit}px ${b.color})` : "none"}} />
            <text x={b.node.x} y={b.node.y + 64} textAnchor="middle" fill="#F4F4F5"
              opacity={lit} fontSize={24} fontWeight={600}>{b.label}</text>
          </g>
        );
      })}
    </>
  );
};
```
Node icons are drawn shapes or text glyphs in white on the node color, never emoji
(see SKILL.md failure modes). Small satellites around a node (flags, avatars)
orbit with `angle = base + frame * 0.6deg` and enter on a stagger after it ignites.

## 6. Segmented underline (the callback)
The closing tagline's underline is the line again, now carrying the colors it
collected. Segments draw left → right in sequence, joined by dots.
```tsx
export const SegmentedUnderline: React.FC<{x: number; y: number; width: number; colors: string[]; start: number; each: number}> =
({x, y, width, colors, start, each}) => {
  const frame = useCurrentFrame();
  const seg = width / colors.length;
  return (
    <svg style={{position: "absolute", left: 0, top: 0, overflow: "visible"}} width={1} height={1}>
      {colors.map((c, i) => {
        const p = interpolate(frame, [start + i * each, start + (i + 1) * each], [0, 1], {
          easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp",
        });
        const x0 = x + i * seg;
        return (
          <g key={i}>
            <line x1={x0} y1={y} x2={x0 + seg * p} y2={y} stroke={c} strokeWidth={5} strokeLinecap="round"
              style={{filter: `drop-shadow(0 0 8px ${c})`}} />
            <circle cx={x0} cy={y} r={p > 0 ? 6 : 0} fill={c} />
            {i === colors.length - 1 && p >= 1 && <circle cx={x0 + seg} cy={y} r={6} fill={c} />}
          </g>
        );
      })}
    </svg>
  );
};
```
On the first tagline ("One path.") pass a single brand color; on the second
("Every skill.") pass the node colors. Same position, so the eye reads it as
the same line changing.

## 7. Speed-line burst
Comic speed lines sell an impact (mascot or logo popping in). Each line moves
outward and shortens; angles and lengths come from seeded `random()`.
```tsx
import {random} from "remotion";

export const SpeedBurst: React.FC<{cx: number; cy: number; count?: number; dur?: number; color: string}> =
({cx, cy, count = 18, dur = 14, color}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [0, dur], [0, 1], {easing: theme.ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <svg style={{position: "absolute", inset: 0, overflow: "visible"}} width="100%" height="100%">
      {Array.from({length: count}).map((_, i) => {
        const a = random(`a${i}`) * Math.PI * 2;
        const r0 = 40 + t * (180 + random(`r${i}`) * 260);
        const len = (1 - t) * (60 + random(`l${i}`) * 120);
        return (
          <line key={i} x1={cx + Math.cos(a) * r0} y1={cy + Math.sin(a) * r0}
            x2={cx + Math.cos(a) * (r0 + len)} y2={cy + Math.sin(a) * (r0 + len)}
            stroke={color} strokeWidth={3} strokeLinecap="round" opacity={1 - t}
            style={{filter: `drop-shadow(0 0 6px ${color})`}} />
        );
      })}
    </svg>
  );
};
```
Pair with the hero element's entrance: scale 0 → 1.15 → 1 (bouncy spring) on
the same frame the burst starts, plus a short pop SFX.

## 8. Hop with echo trail
A character leaving the frame hops along an arc with squash and stretch, and a
few fading copies of its past positions draw the motion. The echoes are the
same component rendered at earlier frames — no extra art.
```tsx
const hopPos = (f: number) => {
  const t = interpolate(f, [0, 18], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp", easing: theme.ease.in});
  return {x: 960 + t * 900, y: 540 - Math.sin(Math.PI * Math.min(t * 2, 1)) * 220 - t * 300, t};
};
const Hopper: React.FC<{f: number; opacity: number; children: React.ReactNode}> = ({f, opacity, children}) => {
  const {x, y, t} = hopPos(f);
  const stretch = 1 + Math.min(t * 3, 0.35);
  return (
    <div style={{position: "absolute", left: x - 80, top: y - 80, width: 160, height: 160, opacity,
      scale: `${1 / stretch} ${stretch}`, rotate: `${t * 25}deg`}}>{children}</div>
  );
};
// newest last so it draws on top
{[5, 4, 3, 2, 1, 0].map((k) => (
  <Hopper key={k} f={frame - k * 2} opacity={k === 0 ? 1 : 0.35 * (1 - k / 6)}><Mascot /></Hopper>
))}
```
`<Trail>` from `@remotion/motion-blur` does the same automatically for any
subtree, at the cost of rendering it once per layer.

## 9. Word tiles that fly into place
A tile is one element that travels from its bank slot to its answer slot on an
arc; the bank keeps a grey placeholder so the layout never jumps.
```tsx
type Tile = {word: string; from: {x: number; y: number}; to: {x: number; y: number}; at: number};

export const FlyingTile: React.FC<{tile: Tile}> = ({tile}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const p = spring({frame: frame - tile.at, fps, config: theme.spring.snappy});
  const x = interpolate(p, [0, 1], [tile.from.x, tile.to.x]);
  const y = interpolate(p, [0, 1], [tile.from.y, tile.to.y]) - Math.sin(Math.PI * Math.min(p, 1)) * 40;
  const box = {position: "absolute" as const, height: 44, padding: "0 16px", borderRadius: 12,
    display: "flex", alignItems: "center", fontSize: 20, fontWeight: 600};
  return (
    <>
      <div style={{...box, left: tile.from.x, top: tile.from.y, background: "#2B3036", color: "transparent"}}>{tile.word}</div>
      <div style={{...box, left: x, top: y, background: "#1E2328", color: "#F4F4F5",
        boxShadow: `0 0 0 2px #3A4148, 0 ${6 + 10 * Math.sin(Math.PI * Math.min(p, 1))}px 16px rgba(0,0,0,0.5)`,
        scale: 1 + 0.08 * Math.sin(Math.PI * Math.min(p, 1))}}>{tile.word}</div>
    </>
  );
};
```
Compute the `to` positions once from the answer row's layout (sum of tile
widths + gaps); give tiles a fixed width per word or measure them with
`measureText` from `@remotion/layout-utils`. Stagger `at` by 5–7 frames with a
tick SFX per landing; finish with the success footer sliding up.

## 10. Odometer counter
Each digit is a column of 0–9 that rolls. A higher digit only moves while the
digit below it rolls over from 9 to 0, exactly like a mechanical counter.
Each column blurs by how far it rolled this frame (the velocity blur from
`product-promo.md`), which gives the smeared digits of a fast count.
```tsx
const digitPos = (v: number, place: number) => {
  const base = 10 ** place;
  const whole = Math.floor(v / base);
  const rem = v - whole * base;
  const roll = place === 0 ? rem : Math.max(0, rem - (base - 1));
  return (whole % 10) + roll; // 0..10, where 10 is the extra "0" cell
};

// prev = the value one frame earlier; each column blurs by how far it rolled
export const Odometer: React.FC<{value: number; prev: number; digits: number; size: number; color: string}> =
({value, prev, digits, size, color}) => {
  const h = size * 1.1;
  // cells this column rolled since the last frame, on average
  const blurOf = (place: number) => Math.min((Math.abs(value - prev) / 10 ** place) * h * 0.12, 12);
  return (
    <div style={{display: "flex", height: h, overflow: "hidden", fontSize: size, fontWeight: 800,
      color, lineHeight: `${h}px`, fontVariantNumeric: "tabular-nums",
      maskImage: "linear-gradient(transparent, black 18%, black 82%, transparent)"}}>
      {Array.from({length: digits}).map((_, k) => {
        const place = digits - 1 - k;
        const shown = value >= 10 ** place || place === 0;
        return (
          <div key={k} style={{display: shown ? "block" : "none", translate: `0 ${-digitPos(value, place) * h}px`,
            filter: blurOf(place) > 0.3 ? `blur(${blurOf(place)}px)` : "none"}}>
            {[0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 0].map((n, i) => <div key={i}>{n}</div>)}
          </div>
        );
      })}
    </div>
  );
};

// ease the VALUE, not the digits: fast through the middle, settling on the target
const streak = (f: number) => interpolate(f, [10, 50], [1, 365], {easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp"});
<Odometer value={streak(frame)} prev={streak(frame - 1)} digits={3} size={180} color={theme.colors.primary} />
```
Below a counter, a row of seven "day" dots filling one per few frames (grey →
hero color with a pop) sells the streak without any more text.

## 11. Leaderboard climb
Rows are absolutely positioned by a continuous rank. The climbing row's rank
is eased between stops; every row it passes slides down by exactly one slot,
so the list never overlaps or jumps.
```tsx
type Player = {name: string; xp: number; color: string};
const ROW = 64;

export const Leaderboard: React.FC<{others: Player[]; you: Player; stops: [number, number][]; xpTo: number}> =
({others, you, stops, xpTo}) => {
  const frame = useCurrentFrame();
  // stops: [frame, rank] — e.g. [[0, 6], [20, 2], [44, 0]]
  const youRank = interpolate(frame, stops.map((s) => s[0]), stops.map((s) => s[1]), {
    easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const moving = Math.abs(youRank - interpolate(frame - 1, stops.map((s) => s[0]), stops.map((s) => s[1]), {
    easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }));
  const xp = Math.round(interpolate(frame, [stops[0][0], stops[stops.length - 1][0]], [you.xp, xpTo], {
    extrapolateLeft: "clamp", extrapolateRight: "clamp",
  }));
  const rankOf = (r: number) => r + Math.min(1, Math.max(0, r + 1 - youRank));
  const row = (p: Player, rank: number, isYou: boolean, xpShown: number) => (
    <div key={p.name} style={{position: "absolute", left: 0, right: 0, top: rank * ROW, height: ROW - 8,
      display: "flex", alignItems: "center", gap: 14, padding: "0 16px", borderRadius: 12,
      zIndex: isYou ? 2 : 1, background: isYou ? "rgba(255,255,255,0.08)" : "transparent",
      boxShadow: isYou ? `0 0 0 2px ${theme.colors.primary}` : "none",
      scale: isYou ? 1 + Math.min(moving * 0.4, 0.05) : 1}}>
      <span style={{width: 24, opacity: 0.6}}>{Math.round(rank) + 1}</span>
      <span style={{width: 32, height: 32, borderRadius: 16, background: p.color}} />
      <span style={{flex: 1, fontWeight: 600}}>{p.name}</span>
      <span style={{fontVariantNumeric: "tabular-nums"}}>{xpShown.toLocaleString("en-US")} XP</span>
    </div>
  );
  return (
    <div style={{position: "relative", height: (others.length + 1) * ROW}}>
      {others.map((p, r) => row(p, rankOf(r), false, p.xp))}
      {row(you, youRank, true, xp)}
    </div>
  );
};
```
Hold on each stop for 8–12 frames so the viewer reads the new rank, and put a
whoosh on each climb and a "ding" on reaching first. The light path can run up
the board's left edge, its head tracking `youRank * ROW`.

## 12. Brand and trademark rules
Same as `product-promo.md`: a real brand's mascot, logo, colors and UI only
with permission or as a clearly labeled spec piece, with invented user data
(names, XP, streaks). For a portfolio piece, an original mascot and brand built
in the same style shows the same skill without the legal risk.
