# Customer Journey — Logo to Doorstep in One Take

The e-commerce story told as one continuous journey: the logo is drawn, the
app opens, a search is typed, a product is bought, a delivery crosses a city,
the box arrives, and the tagline lands. Each step hands its light or shape to
the next. Builds on `product-promo.md` (stage, device, morphs, finishing),
`light-path.md` (trails, paths) and `ai-demo.md` (typing, one-canvas camera).

## Contents
1. Reference teardown
2. Spark comet (a logo stroke drawn by a comet that throws sparks)
3. Card orbit burst
4. Hold-to-buy button → confirmation toast
5. Isometric city tracker
6. CSS 3D box with a drawn logo
7. Text light sweep
8. Letter-to-letter arrow (the logo's meaning, as a callback)
9. The working setup behind this style

---

## 1. Reference teardown
A 22s spec ad for an online store, same creator and stage as the
`product-promo.md` reference (dark, one warm glow, no hard cuts), made in
DaVinci Resolve Studio on a laptop with the preview full-screen on a second
monitor; the timeline holds ~6 video tracks, voice/SFX tracks and ~7 music
and effect stems.

| Time | Shot | What moves |
|---|---|---|
| 0.0–0.7s | Logo stroke | A comet throwing sparks draws the logo's arrow; the wordmark appears behind it |
| 0.7–2.0s | Logo hold → exit | Lockup holds, then dissolves into glow as a phone rises from below |
| 2.0–3.7s | App + search | Phone tilts to camera; push into the search bar; a query types with suggestions |
| 4.0–4.7s | Results | Product cards burst out of the phone and orbit it in 3D, then fall back into the grid |
| 5.0–6.0s | Product | Push into one product: price, "Add to Cart", "Buy Now" |
| 6.0–7.0s | Buy | "Buy Now" fills like a hold-to-confirm, then becomes "Order placed, thank you." with a check |
| 7.0–7.6s | Hand-off | The arrow shape whips out as a comet |
| 7.6–10s | Delivery | Isometric dark city; an "Arriving today" tracker; a glowing route draws street by street while the camera follows the van's pin |
| 10–13s | Doorstep | The pin flashes into a 3D box on a doorstep; a glow ring orbits it and draws the logo's arrow on its side; "Delivered" notification |
| 13.7–15s | Tagline 1 | "Everything you love." with a light sweep across the text and the arrow drawn under it |
| 15.3–17s | Tagline 2 | "From A to Z." — the arrow runs from the A to the Z, which is what the logo means |
| 17–22s | Outro | Logo lockup bookend, then the creator credit |

The idea that makes it: **the logo's one shape (the arrow) appears in every
act** — drawn by the comet, as the hand-off, on the box, under both taglines.

## 2. Spark comet
The head of a light trail (see `light-path.md` §3) throws sparks: each spark is
born at the head at a seeded moment, flies off with a seeded velocity, falls
with gravity, and fades. Deterministic: same frame, same sparks.
```tsx
import {random} from "remotion";
import {getLength, getPointAtLength} from "@remotion/paths";

export const Sparks: React.FC<{d: string; start: number; dur: number; color: string; count?: number; life?: number}> =
({d, start, dur, color, count = 40, life = 16}) => {
  const frame = useCurrentFrame();
  const len = useMemo(() => getLength(d), [d]);
  const progressAt = (f: number) => interpolate(f, [start, start + dur], [0, 1], {easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <g>
      {Array.from({length: count}).map((_, i) => {
        const born = start + random(`b${i}`) * dur;
        const age = frame - born;
        if (age < 0 || age > life) return null;
        const p = getPointAtLength(d, len * progressAt(born)) ?? {x: 0, y: 0};
        const a = random(`a${i}`) * Math.PI * 2;
        const v = 3 + random(`v${i}`) * 9;
        const vx = Math.cos(a) * v;
        const vy = Math.sin(a) * v;
        const x = p.x + vx * age;
        const y = p.y + vy * age + 0.35 * age * age;
        const k = 1 - age / life;
        return (
          <line key={i} x1={x} y1={y} x2={x - vx * 1.6} y2={y - (vy + 0.7 * age) * 1.6}
            stroke={color} strokeWidth={2.5 * k + 0.5} strokeLinecap="round" opacity={k}
            style={{filter: `drop-shadow(0 0 4px ${color})`}} />
        );
      })}
    </g>
  );
};
// <svg ...><LightTrail d={ARROW} head={progress} tail={0} color={hero} /><Sparks d={ARROW} start={0} dur={20} color={hero} /></svg>
```
Reveal the wordmark from behind the stroke with a left-to-right `clipPath`
that follows the comet's head x.

## 3. Card orbit burst
Cards start stacked behind the phone, fly out onto a tilted ring, travel
around it, and fall back. Placed with `translate3d` inside one
`preserve-3d` wrapper, so the browser sorts them in front of and behind the
phone by depth.
```tsx
export const CardOrbit: React.FC<{cards: React.ReactNode[]; open: number; spin: number; radius: number}> =
({cards, open, spin, radius}) => (
  <div style={{position: "absolute", left: "50%", top: "50%", transformStyle: "preserve-3d"}}>
    {cards.map((card, i) => {
      const a = spin + (i / cards.length) * Math.PI * 2;
      const x = Math.sin(a) * radius * open;
      const z = Math.cos(a) * radius * open;
      const y = (i % 2 ? -1 : 1) * 70 * open;
      const front = (Math.cos(a) + 1) / 2; // 1 in front, 0 behind
      return (
        <div key={i} style={{position: "absolute", transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) rotateY(${Math.sin(a) * 25}deg)`, // turn a little, never show the back
          opacity: 0.45 + 0.55 * front, filter: front < 0.4 ? "blur(2px)" : "none"}}>
          {card}
        </div>
      );
    })}
  </div>
);
// parent: <div style={{perspective: 1400, transformStyle: "preserve-3d"}}> <Phone /> <CardOrbit open={...} spin={frame * 0.06} radius={420} /> </div>
// open: spring up over ~12 frames, hold ~15, then interpolate back to 0 as the grid reappears
```

## 4. Hold-to-buy button → confirmation toast
The button fills left to right with a hot edge, as if pressed and held; when
full it becomes the confirmation (check + message). Two states of one pill.
```tsx
export const HoldButton: React.FC<{label: string; done: string; start: number; hold: number; color: string}> =
({label, done, start, hold, color}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const fill = interpolate(frame, [start, start + hold], [0, 1], {easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const ok = spring({frame: frame - start - hold, fps, config: theme.spring.snappy});
  return (
    <div style={{position: "relative", width: 520, height: 64, borderRadius: 32, overflow: "hidden",
      background: "rgba(255,255,255,0.08)", boxShadow: `0 0 0 2px ${color}`, fontSize: 24, fontWeight: 600}}>
      <div style={{position: "absolute", inset: 0, width: `${fill * 100}%`, background: color,
        boxShadow: `6px 0 18px ${color}`, opacity: 1 - ok}} />
      <div style={{position: "absolute", inset: 0, display: "grid", placeItems: "center", color: "#111", opacity: 1 - ok}}>{label}</div>
      <div style={{position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", gap: 12,
        color: "white", opacity: ok, scale: interpolate(ok, [0, 1], [0.9, 1])}}>
        <svg width={28} height={28} viewBox="0 0 28 28">
          <circle cx={14} cy={14} r={13} fill="#22C55E" />
          <path d="M8 14.5 L12.5 19 L20.5 10" stroke="white" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round"
            strokeDasharray={20} strokeDashoffset={20 * (1 - ok)} />
        </svg>
        {done}
      </div>
    </div>
  );
};
```

## 5. Isometric city tracker
A city of extruded blocks in plain SVG with a hand-rolled isometric
projection, a route that draws street by street, a pin at its head, and a
camera that follows the pin with a few frames of lag.
```tsx
const iso = (x: number, y: number, z = 0) => ({X: (x - y) * 0.866, Y: (x + y) * 0.5 - z});
const pts = (...p: {X: number; Y: number}[]) => p.map((q) => `${q.X},${q.Y}`).join(" ");

export const IsoCity: React.FC<{route: [number, number][]; start: number; dur: number; color: string; cols?: number; rows?: number}> =
({route, start, dur, color, cols = 12, rows = 12}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const CELL = 120, GAP = 34, S = CELL - GAP;
  // route is in street-grid coordinates; streets sit in the gaps between blocks
  const routePts = route.map(([gx, gy]) => iso(gx * CELL - GAP / 2, gy * CELL - GAP / 2));
  const d = "M " + routePts.map((p) => `${p.X} ${p.Y}`).join(" L ");
  const len = useMemo(() => getLength(d), [d]);
  const prog = (f: number) => interpolate(f, [start, start + dur], [0, 1], {easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const pin = getPointAtLength(d, len * prog(frame)) ?? {x: 0, y: 0};
  const cam = getPointAtLength(d, len * prog(frame - 6)) ?? pin; // camera lags the pin
  // painter's order: farther blocks (smaller gx + gy) first
  const cells: [number, number][] = [];
  for (let gx = 0; gx < cols; gx++) for (let gy = 0; gy < rows; gy++) cells.push([gx, gy]);
  cells.sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
  const blocks = cells.map(([gx, gy]) => {
    const h = 20 + random(`h${gx}-${gy}`) * 90;
    const x = gx * CELL, y = gy * CELL;
    const [a, b, c, e] = [iso(x, y, h), iso(x + S, y, h), iso(x + S, y + S, h), iso(x, y + S, h)];
    const [b0, c0, e0] = [iso(x + S, y), iso(x + S, y + S), iso(x, y + S)];
    return (
      <g key={`${gx}-${gy}`}>
        <polygon points={pts(b, c, c0, b0)} fill="#1B2430" />
        <polygon points={pts(e, c, c0, e0)} fill="#141B24" />
        <polygon points={pts(a, b, c, e)} fill="#2A3644" stroke="#3B4A5C" strokeWidth={1} />
      </g>
    );
  });
  return (
    <svg width={W} height={H} style={{background: "#0B1017"}}>
      <g transform={`translate(${W / 2 - cam.x}, ${H / 2 - cam.y})`}>
        {blocks}
        <path d={d} fill="none" stroke={color} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round"
          strokeDasharray={`${len * prog(frame)} ${len}`} style={{filter: `drop-shadow(0 0 8px ${color})`}} />
        <circle cx={pin.x} cy={pin.y - 18} r={13} fill={color} style={{filter: `drop-shadow(0 0 14px ${color})`}} />
      </g>
    </svg>
  );
};
// <IsoCity route={[[1, 2], [4, 2], [4, 5], [7, 5], [7, 8], [10, 8]]} start={0} dur={60} color="#FF9900" />
```
The route is drawn on top of every block, which reads fine at this camera
angle; for a route that should pass behind tall blocks, draw the blocks in
two passes (behind the route, then in front). Overlay the tracker card
("Arriving today", 4 step dots filling with the route's progress) in screen
space, outside the moving `<g>`.

## 6. CSS 3D box with a drawn logo
Six faces in one `preserve-3d` cube, each a cardboard gradient shaded by its
angle to the light; the logo is an SVG stroke drawn on the front face. A
glow ring (an ellipse drawn with a dash) orbits it on arrival.
```tsx
export const Box3D: React.FC<{size: number; rotY: number; rotX?: number; draw: number; color: string}> =
({size: s, rotY, rotX = -18, draw, color}) => {
  const face = (transform: string, shade: number, children?: React.ReactNode) => (
    <div style={{position: "absolute", width: s, height: s, transform,
      background: `linear-gradient(160deg, hsl(33 85% ${58 * shade}%), hsl(28 80% ${44 * shade}%))`,
      boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)"}}>{children}</div>
  );
  return (
    <div style={{width: s, height: s, perspective: 1400}}>
      <div style={{position: "relative", width: s, height: s, transformStyle: "preserve-3d",
        transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`}}>
        {face(`translateZ(${s / 2}px)`, 1,
          <svg width={s} height={s} viewBox="0 0 100 100">
            <path d="M 22 58 Q 50 78 78 58 M 70 52 L 79 58 L 70 63" fill="none" stroke="#1A1A1A" strokeWidth={5}
              strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
          </svg>)}
        {face(`rotateY(90deg) translateZ(${s / 2}px)`, 0.78)}
        {face(`rotateY(180deg) translateZ(${s / 2}px)`, 0.7)}
        {face(`rotateY(-90deg) translateZ(${s / 2}px)`, 0.82)}
        {face(`rotateX(90deg) translateZ(${s / 2}px)`, 1.15,
          <div style={{position: "absolute", left: "44%", width: "12%", height: "100%", background: "rgba(120,80,40,0.35)"}} />)}
        {face(`rotateX(-90deg) translateZ(${s / 2}px)`, 0.5)}
      </div>
    </div>
  );
};
```
`pathLength={1}` makes the dash math independent of the stroke's real length.
Sell the doorstep with a warm key light (a radial gradient behind), a soft
contact shadow (a blurred dark ellipse under the box) and a wood-floor
gradient; a real photo or 3D-rendered plate behind the CSS box works too.

## 7. Text light sweep
A bright band slides across the letters. The text is painted by its
background, so the sweep is clipped to the glyphs.
```tsx
export const Sweep: React.FC<{text: string; start: number; dur: number; base: string; hot: string; style: React.CSSProperties}> =
({text, start, dur, base, hot, style}) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + dur], [-20, 120], {easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <span style={{...style, color: "transparent", WebkitBackgroundClip: "text", backgroundClip: "text",
      backgroundImage: `linear-gradient(100deg, ${base} 0%, ${base} ${p - 14}%, ${hot} ${p}%, ${base} ${p + 14}%, ${base} 100%)`}}>
      {text}
    </span>
  );
};
```

## 8. Letter-to-letter arrow
The closing callback: an arrow drawn from one letter to another in the
tagline, so the brand's mark explains itself. Letter positions come from
`measureText` of the text before each letter.
```tsx
export const LetterArrow: React.FC<{text: string; from: number; to: number; font: string; size: number; draw: number; color: string}> =
({text, from, to, font, size, draw, color}) => {
  const w = (s: string) => measureText({text: s, fontFamily: font, fontSize: size, fontWeight: 700}).width;
  const cx = (i: number) => w(text.slice(0, i)) + w(text[i]) / 2; // center of letter i
  const x0 = cx(from), x1 = cx(to), y = size * 1.05, sag = size * 0.35;
  const d = `M ${x0} ${y} Q ${(x0 + x1) / 2} ${y + sag} ${x1} ${y} M ${x1 - 14} ${y - 8} L ${x1} ${y} L ${x1 - 16} ${y + 8}`;
  return (
    <div style={{position: "relative", fontFamily: font, fontSize: size, fontWeight: 700, color: "white", whiteSpace: "pre"}}>
      {text}
      <svg style={{position: "absolute", left: 0, top: 0, overflow: "visible"}} width={1} height={1}>
        <path d={d} fill="none" stroke={color} strokeWidth={size * 0.08} strokeLinecap="round" strokeLinejoin="round"
          pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} style={{filter: `drop-shadow(0 0 6px ${color})`}} />
      </svg>
    </div>
  );
};
// <LetterArrow text="From A to Z." from={5} to={10} font="Inter" size={110} draw={progress} color="#FF9900" />
```

## 9. The working setup behind this style
What the reference creator's desk shows, and what that means for you:
- **One computer is enough.** A laptop drives everything; the second monitor
  only shows the preview full-screen while the timeline stays on the laptop.
  A second screen speeds up review; a second computer adds nothing.
- **Shots are code, finishing is an editor.** Each shot is rendered as its
  own clip from the shot list, then assembled, timed to music, graded and
  given glow and motion blur in DaVinci Resolve Studio. You can do the same,
  or keep everything in Remotion with the finishing pass in `product-promo.md`
  §15 — the code is the same either way.
- **Render time scales with cores.** Remotion renders in parallel browser
  tabs, so a machine with more CPU cores renders the same video faster; a GPU
  mainly helps the editor's effects and playback.
- **Real assets close the last gap:** a licensed logo/brand kit, a 3D phone
  model or mockup plate, licensed music, and a voice-over.
