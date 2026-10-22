# AI Demo — "Type a Prompt, Watch It Build"

The promo format for AI assistants and developer tools: the viewer watches a
prompt being typed, code pouring out, and the result appearing — then a
second prompt changes it. The story is speed and control, so the camera never
cuts: it lives on one big canvas and whips between the prompt box and the
result. Pairs with `product-promo.md` (stage, finishing pass) and
`light-path.md` (paths, odometer).

## Contents
1. Reference teardown
2. Silk gradient background
3. Tracking reveal (letters converge into a wordmark)
4. Pill splits into a chip row
5. Cursor that clicks
6. Typing with a hot tail, then dolly out
7. 3D code stream
8. One canvas, one camera (whips between prompt and result)
9. Change it while it's off camera
10. Text that flies in along a path and settles
11. Stretch exit
12. Brand and trademark rules

---

## 1. Reference teardown
A 12s AI-assistant promo (16:9, 30fps). No hard cuts after the first second.

| Time | Shot | What moves |
|---|---|---|
| 0.0–0.5s | Mark | Flowing amber silk ribbons on black; the spark mark spins in with motion blur |
| 0.3–0.9s | Wordmark | Serif wordmark letters fly in from wide tracking, blurred, and converge |
| 0.9–1.5s | Chips | Wordmark smears into a white glowing pill; the pill splits into five neon-outlined chips (Create, Write, Code, Life Stuff, Learn) |
| 1.5–2.3s | Click | Hand cursor glides to "Code" and presses; the chip brightens |
| 2.5–4.0s | Prompt | Extreme close-up: "I want a website for my motion design work." types in, newest letters orange, older ones white; camera dollies out to reveal the whole prompt box with model picker, mic and send button |
| 4.2–5.2s | Code | Send → camera tilts down into a stream of syntax-colored code rushing upward in perspective, heavily motion-blurred |
| 5.2–6.3s | Result | A glassy orange website card swings in on rotateY with a glowing edge |
| 6.3–8.0s | Second prompt | Camera whips down from the site to a new prompt below it: "I want a blue background." |
| 8.0–9.8s | Change | Send → camera whips back up; the site is now blue |
| 10–11.7s | Sign-off | Black; the mark glows; "Built with Claude." flies in along a curve, letters following the path, then straightens into a line; exits by stretching vertically |

What makes it work:
- **The UI is the set.** Prompt box, chips and result are rebuilt as
  components, big and close to camera, with type sized for a phone screen.
- **Speed is shown, not claimed.** Typing, code and result are each under a
  second; motion blur on every fast move sells it.
- **The change happens off camera.** The recolor is never seen happening; the
  camera leaves an orange site and returns to a blue one.

## 2. Silk gradient background
Three wide ribbons (closed bezier shapes) filled with one gradient, blurred
heavily, their control points drifting on slow sines. A thin, less-blurred
stroke on one edge gives the silk its sheen.
```tsx
export const Silk: React.FC<{colors: [string, string, string]}> = ({colors}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const ribbon = (i: number) => {
    const t = frame / 70 + i * 1.7;
    const a = Math.sin(t) * 140;
    const b = Math.cos(t * 0.8) * 180;
    const x0 = W * (0.12 + i * 0.2);
    return `M ${x0 - 320} ${H + 120} C ${x0 + a} ${H * 0.72}, ${x0 - 220 + b} ${H * 0.34}, ${x0 + 520} -120
            L ${x0 + 700} -120 C ${x0 + 60 + b} ${H * 0.34}, ${x0 + 200 + a} ${H * 0.72}, ${x0 - 60} ${H + 120} Z`;
  };
  return (
    <AbsoluteFill style={{background: "#000"}}>
      <svg width={W} height={H}>
        <defs>
          <linearGradient id="silk" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor={colors[0]} />
            <stop offset="0.55" stopColor={colors[1]} />
            <stop offset="1" stopColor={colors[2]} />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((i) => (
          <path key={i} d={ribbon(i)} fill="url(#silk)" opacity={0.7 - i * 0.18} style={{filter: "blur(46px)"}} />
        ))}
        <path d={ribbon(1)} fill="none" stroke={colors[2]} strokeWidth={6} opacity={0.5} style={{filter: "blur(10px)"}} />
      </svg>
    </AbsoluteFill>
  );
};
// <Silk colors={["#3A0E00", "#E8641B", "#FFC46B"]} />
```
For a true fluid look, a fragment shader in `@remotion/three` driven by
`useCurrentFrame()` does the same at higher quality.

## 3. Tracking reveal
Letters start spread wide and blurred around the word's center and slide
together; the wordmark "lands" rather than appears.
```tsx
export const TrackingReveal: React.FC<{text: string; start?: number; spread?: number; style: React.CSSProperties}> =
({text, start = 0, spread = 30, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const n = text.length;
  return (
    <div style={{display: "flex", ...style}}>
      {text.split("").map((ch, i) => {
        const s = spring({frame: frame - start - i * 2, fps, config: theme.spring.smooth});
        return (
          <span key={i} style={{display: "inline-block", whiteSpace: "pre", opacity: s,
            filter: s < 0.98 ? `blur(${(1 - s) * 10}px)` : "none",
            translate: `${(1 - s) * (i - (n - 1) / 2) * spread}px 0`}}>{ch}</span>
        );
      })}
    </div>
  );
};
```

## 4. Pill splits into a chip row
One glowing pill becomes N chips: every chip starts stacked at the pill's
position and size, then springs to its own slot, center chips first. Measure
chip widths with `measureText` from `@remotion/layout-utils` so the final row
is exact.
```tsx
import {measureText} from "@remotion/layout-utils";

const neon = (k: number) => ({
  border: `2px solid rgba(255,255,255,${0.6 + 0.4 * k})`,
  boxShadow: `0 0 ${6 + 6 * k}px rgba(255,255,255,0.9), 0 0 ${18 + 14 * k}px rgba(255,170,190,0.7), inset 0 0 10px rgba(255,255,255,0.35)`,
});

export const ChipSplit: React.FC<{labels: string[]; start: number; font: string; size: number; active?: (i: number) => number}> =
({labels, start, font, size, active = () => 0}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const pad = 22, gap = 10, h = size * 2.2;
  const widths = labels.map((l) => measureText({text: l, fontFamily: font, fontSize: size, fontWeight: 500}).width + pad * 2);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (labels.length - 1);
  const pillW = 160;
  const mid = (labels.length - 1) / 2;
  return (
    <div style={{position: "relative", width: 0, height: h}}>
      {labels.map((l, i) => {
        const s = spring({frame: frame - start - Math.abs(i - mid) * 2, fps, config: theme.spring.snappy});
        const x = -total / 2 + widths.slice(0, i).reduce((a, b) => a + b, 0) + gap * i;
        const k = active(i);
        return (
          <div key={l} style={{position: "absolute", top: -h / 2, height: h, borderRadius: h / 2,
            left: interpolate(s, [0, 1], [-pillW / 2, x]), width: interpolate(s, [0, 1], [pillW, widths[i]]),
            display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden",
            fontFamily: font, fontSize: size, fontWeight: 500, color: "white",
            background: `rgba(255,255,255,${interpolate(s, [0, 0.4], [0.9, 0.04], {extrapolateRight: "clamp"}) + 0.12 * k})`,
            scale: 1 - 0.05 * k, ...neon(k)}}>
            <span style={{opacity: interpolate(s, [0.5, 1], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}}>{l}</span>
          </div>
        );
      })}
    </div>
  );
};
```
Before the split, morph the wordmark into the pill the same way
`product-promo.md` §11 morphs a line into a pill (squash + brighten).

## 5. Cursor that clicks
A drawn pointer glides on an eased path and presses: it shrinks for 4 frames
while the target brightens and dips. Return a `press` value the target reads.
```tsx
export const useClick = (at: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [at, at + 3, at + 9], [0, 1, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
};

export const Cursor: React.FC<{from: [number, number]; to: [number, number]; start: number; dur: number; clickAt: number}> =
({from, to, start, dur, clickAt}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [start, start + dur], [0, 1], {easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const press = useClick(clickAt);
  const x = interpolate(t, [0, 1], [from[0], to[0]]);
  const y = interpolate(t, [0, 1], [from[1], to[1]]) - Math.sin(Math.PI * t) * 40; // slight arc
  return (
    <svg width={36} height={40} viewBox="0 0 36 40" style={{position: "absolute", left: x, top: y,
      scale: 1 - 0.15 * press, transformOrigin: "4px 4px", filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))"}}>
      <path d="M4 4 L4 32 L12 25 L17 37 L23 34 L18 23 L29 23 Z" fill="white" stroke="#111" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
};
// the chip under it: active={(i) => (i === 2 ? press : 0)}
```

## 6. Typing with a hot tail, then dolly out
Characters appear at a fixed rate; the newest few are the hero color and
cool to white as they age. Start on an extreme close-up of the first words,
then pull the camera back to reveal the whole box.
```tsx
export const TypeOn: React.FC<{text: string; start: number; cps: number; hot: string; style: React.CSSProperties}> =
({text, start, cps, hot, style}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const n = Math.min(text.length, Math.floor((Math.max(0, frame - start) * cps) / fps));
  const caret = n < text.length || Math.floor(frame / 15) % 2 === 0;
  return (
    <div style={{whiteSpace: "pre-wrap", ...style}}>
      {text.slice(0, n).split("").map((ch, i) => (
        <span key={i} style={{color: interpolateColors(n - i, [1, 8], [hot, "#FFFFFF"])}}>{ch}</span>
      ))}
      <span style={{opacity: caret ? 1 : 0, color: hot}}>|</span>
    </div>
  );
};

// dolly out: scale around where the text starts, so the first words stay put
const zoom = interpolate(frame, [30, 50], [2.6, 1], {easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp"});
<AbsoluteFill style={{scale: zoom, transformOrigin: "22% 38%"}}><PromptBox /></AbsoluteFill>
```
Type speed: 25–35 characters per second reads as fast but legible. Put a soft
key-tick SFX on every 2–3 characters, not every one.

## 7. 3D code stream
Code rushes upward on a plane tilted away from camera. A tiny tokenizer colors
keywords, strings, tags and numbers; real-looking code from the actual result
(the component that "builds" the site) is more convincing than lorem ipsum.
```tsx
const TOKEN = /(<\/?[\w.]+|\/?>|"[^"]*"|'[^']*'|\b(?:import|from|const|return|export|default)\b|\b\d+(?:\.\d+)?\b)/g;
const tokenColor = (t: string) =>
  t.startsWith("<") || t.endsWith(">") ? "#FF6B6B"
  : t.startsWith('"') || t.startsWith("'") ? "#7CE38B"
  : /^\d/.test(t) ? "#79B8FF" : "#C792EA";

export const CodeLine: React.FC<{line: string}> = ({line}) => (
  <div style={{whiteSpace: "pre", fontFamily: theme.fonts.mono, fontSize: 22, lineHeight: "32px", color: "#E6E6E6"}}>
    {line.split(TOKEN).map((part, i) => (i % 2 ? <span key={i} style={{color: tokenColor(part)}}>{part}</span> : part))}
  </div>
);

export const CodeStream: React.FC<{lines: string[]; dur: number}> = ({lines, dur}) => {
  const frame = useCurrentFrame();
  const scroll = interpolate(frame, [0, dur], [500, -lines.length * 32], {easing: theme.ease.in, extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  return (
    <AbsoluteFill style={{perspective: 900, alignItems: "center", justifyContent: "center"}}>
      <div style={{transform: `rotateX(32deg) translateY(${scroll}px)`, transformOrigin: "50% 0%"}}>
        {lines.map((l, i) => <CodeLine key={i} line={l} />)}
      </div>
    </AbsoluteFill>
  );
};
```
Wrap it in `<CameraMotionBlur>` (see `product-promo.md` §15); without blur it
reads as a slideshow of code, with blur it reads as speed.

## 8. One canvas, one camera
Lay every UI piece out once in world coordinates (result card above, prompt
box below, a second prompt below that) and move a single camera between them.
Each move is a whip: fast, eased, motion-blurred.
```tsx
type Cam = [frame: number, x: number, y: number, zoom: number];

export const World: React.FC<{cams: Cam[]; children: React.ReactNode}> = ({cams, children}) => {
  const frame = useCurrentFrame();
  const {width: W, height: H} = useVideoConfig();
  const at = (k: 1 | 2 | 3) => interpolate(frame, cams.map((c) => c[0]), cams.map((c) => c[k]), {
    easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  return (
    <AbsoluteFill style={{overflow: "hidden"}}>
      <div style={{position: "absolute", left: 0, top: 0,
        transform: `translate(${W / 2}px, ${H / 2}px) scale(${at(3)}) translate(${-at(1)}px, ${-at(2)}px)`}}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
// <World cams={[[0, 960, 1500, 1], [60, 960, 1500, 1], [72, 960, 500, 0.9], [130, 960, 500, 0.9], [142, 960, 1500, 1]]}>
//   <div style={{position: "absolute", left: 560, top: 250}}><SiteCard /></div>
//   <div style={{position: "absolute", left: 460, top: 1380}}><PromptBox /></div>
// </World>
```
Hold 8–15 frames between whips; a whip is 8–14 frames. Children are placed
with plain absolute `left/top` in world pixels.

## 9. Change it while it's off camera
State changes (recolor, new layout, new content) happen during the whip, when
the result is blurred or off screen, and the camera returns to the new state.
It looks instant, which is the claim.
```tsx
const blue = interpolate(frame, [whipStart + 4, whipStart + 6], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"});
const bg = `linear-gradient(135deg, ${interpolateColors(blue, [0, 1], ["#C2410C", "#1D2BD9"])}, ${interpolateColors(blue, [0, 1], ["#F59E0B", "#2563EB"])})`;
```
Glass card look: that gradient, a 1px top-left highlight border, an outer glow
in the same hue (`box-shadow: 0 0 60px <hue>`), and a slow rotateY drift.

## 10. Text that flies in along a path and settles
Each letter rides along a curve, rotated to the curve's tangent; then every
letter blends to its slot on a straight line. The *last* letter leads, so the
word reads left to right along a curve drawn in the reading direction. Letter
slots come from `measureText`, the curve from `@remotion/paths`.
```tsx
import {getLength, getPointAtLength, getTangentAtLength} from "@remotion/paths";
import {measureText} from "@remotion/layout-utils";

export const PathText: React.FC<{text: string; d: string; x: number; y: number; font: string; size: number; travel: number; settleAt: number}> =
({text, d, x, y, font, size, travel, settleAt}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const len = useMemo(() => getLength(d), [d]);
  const chars = text.split("");
  const adv = chars.map((ch) => measureText({text: ch, fontFamily: font, fontSize: size, fontWeight: 700}).width);
  // center of each letter on the final line
  const center = adv.map((w, i) => adv.slice(0, i).reduce((a, b) => a + b, 0) + w / 2);
  const last = center[center.length - 1];
  const head = interpolate(frame, [0, travel], [0, len], {easing: theme.ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp"});
  const settle = spring({frame: frame - settleAt, fps, config: theme.spring.smooth});
  return (
    <>
      {chars.map((ch, i) => {
        const back = last - center[i]; // distance behind the last letter, which leads
        const s = Math.max(0, Math.min(len, head - back));
        const p = getPointAtLength(d, s) ?? {x: 0, y: 0};
        const tan = getTangentAtLength(d, s) ?? {x: 1, y: 0};
        // letter's bottom-center sits on the path, then on the baseline at its slot
        return (
          <span key={i} style={{position: "absolute", width: adv[i], textAlign: "center", whiteSpace: "pre",
            fontFamily: font, fontSize: size, fontWeight: 700, color: "white", lineHeight: 1,
            opacity: head > back ? 1 : 0, transformOrigin: "50% 100%",
            left: interpolate(settle, [0, 1], [p.x, x + center[i]]) - adv[i] / 2,
            top: interpolate(settle, [0, 1], [p.y, y]) - size,
            rotate: `${interpolate(settle, [0, 1], [(Math.atan2(tan.y, tan.x) * 180) / Math.PI, 0])}deg`}}>{ch}</span>
        );
      })}
    </>
  );
};
// <PathText text="Built with Claude." d="M 200 1000 C 500 500, 900 900, 1400 420" x={700} y={520} font="Georgia" size={64} travel={24} settleAt={14} />
```
End the curve near where the line ends, so the lead letter is already close to
its slot and the rest of the word "pours" in behind it.

## 11. Stretch exit
The sign-off leaves by stretching vertically into a blurred smear, not by fading.
```tsx
const out = interpolate(frame, [exitAt, exitAt + 8], [0, 1], {easing: theme.ease.in, extrapolateLeft: "clamp", extrapolateRight: "clamp"});
<div style={{scale: `1 ${1 + out * 2.5}`, filter: out > 0 ? `blur(${out * 12}px)` : "none", opacity: 1 - out}}>{signOff}</div>
```

## 12. Brand and trademark rules
Same as `product-promo.md`: recreating a real product's interface (its prompt
box, model picker, logo) is for that company, with permission, or a clearly
labeled fan/spec piece. For your own product, rebuild your real UI from its
design tokens; for a portfolio piece, an invented assistant shows the same craft.
