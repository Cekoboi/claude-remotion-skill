# Product Promo — App/SaaS Launch Patterns

The "Apple-keynote" product ad: a dark stage, one moving pool of brand-colored
light, a device and recreated product UI flown through by a 3D camera, a single
line of kinetic type, and a logo bookend. No footage, no stock — every pixel is
React. Read this before building any app, SaaS, e-commerce or product launch video.

## Contents
1. Reference teardown (what this style is made of)
2. Shot list first
3. Spotlight orb (the one light source)
4. Logo lockup reveal (icon glides, wordmark unmasks)
5. CSS device mockup + screen states
6. Screen takeover (app-icon zoom-through)
7. Recreated UI: data-driven rows with rack focus
8. 3D camera over a dashboard
9. Velocity blur (motion blur without a library)
10. Kinetic line with streak entrance + hero word
11. Shape morph: text → pill → notification
12. Credit card outro
13. Sound for this style
14. Brand and trademark rules
15. Finishing: bloom, real motion blur, voice-over

---

## 1. Reference teardown
A 22.8s spec ad for an e-commerce platform, 16:9, 30fps. Zero hard cuts: every
scene hands off through blur, a camera move, or one shape morphing into the next.

| Time | Shot | What moves |
|---|---|---|
| 0.0–1.5s | Logo intro | Bag icon in a thin ring → glides left as the wordmark unmasks → lockup drifts up |
| 1.5–3.5s | Device | Phone tilts in under a green orb; screen: off → lock (9:41) → home grid |
| 3.5–4.0s | Takeover | App icon zooms toward camera, becomes the full-frame app UI |
| 4.0–8.5s | Products | Skeleton list fills with real rows; focus racks row to row, camera follows, others blur |
| 8.5–11.5s | Live View | Dashboard cards cascade in under a tilted 3D camera; map dot pulses; counters tick |
| 11.5–14.8s | Tagline | "Sell what you **make**" / "and hear your **first** sale", streak entrances, hero word in brand color + underline |
| 14.8–16.3s | Payoff | Text collapses to a glowing pill → pill morphs into an order notification (ding) |
| 16.3–19.8s | Logo outro | Same lockup reveal as the intro (bookend) + small "spec ad" disclaimer |
| 19.8–22.8s | Credit | White light streak → "made by" + name under a soft white glow |

The style in five rules:
- **One light source.** A single blurred brand-colored orb sits behind whatever
  matters and travels between scenes. Everything else is near-black (#0B0D0C).
- **One hero color**, used for the light, the logo and one word per line.
- **Depth of field is the edit.** The focused thing is sharp, everything else is
  blurred and dimmed. Rack focus replaces cuts.
- **Shared-element continuity.** The outgoing shape becomes the incoming shape
  (icon → screen, line → pill → card). Hard cuts are the exception.
- **Bookend.** Open and close on the same logo animation.

## 2. Shot list first
Write the shots before any component, as data both the composition and the
audio script read (same idea as `timing.json` in the repo examples):
```json
{
  "fps": 30,
  "shots": [
    {"id": "S01", "name": "Logo intro", "from": 0, "dur": 45,
     "note": "icon alone -> glides left while mask reveals wordmark -> drifts up"},
    {"id": "S02", "name": "Device", "from": 45, "dur": 60, "note": "phone tilt-in, lock -> home"}
  ]
}
```
```tsx
import shots from "./shots.json";
{shots.shots.map((s) => (
  <Sequence key={s.id} name={`${s.id} ${s.name}`} from={s.from} durationInFrames={s.dur}>
    {SCENES[s.id]}
  </Sequence>
))}
```
Shots overlap by 6–10 frames wherever a blur or morph hands off, so the outgoing
scene is still on screen while the incoming one resolves.

## 3. Spotlight orb
The light is a layer of its own, rendered once at the composition root above the
background and below content, with its position keyframed across the whole video.
```tsx
type Key = [frame: number, x: number, y: number, size: number, alpha: number];

export const Spotlight: React.FC<{keys: Key[]; color: string}> = ({keys, color}) => {
  const frame = useCurrentFrame();
  const at = (i: 1 | 2 | 3 | 4) =>
    interpolate(frame, keys.map((k) => k[0]), keys.map((k) => k[i]), {
      easing: theme.ease.inOut,
      extrapolateLeft: "clamp",
      extrapolateRight: "clamp",
    });
  const [x, y, size, alpha] = [at(1), at(2), at(3), at(4)];
  return (
    <AbsoluteFill style={{pointerEvents: "none"}}>
      <div
        style={{
          position: "absolute",
          left: x - size / 2,
          top: y - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${color} 0%, transparent 65%)`,
          filter: "blur(60px)",
          opacity: alpha,
        }}
      />
    </AbsoluteFill>
  );
};

// Behind the logo, under the phone, then off to the left for the outro:
<Spotlight
  color={theme.colors.glow}
  keys={[
    [0, 960, 760, 900, 0.9],
    [45, 960, 600, 1100, 1],
    [480, 960, 560, 800, 0.8],
    [500, 640, 600, 1000, 0.9],
  ]}
/>
```
Add a tiny sin drift (±10px) so it never sits dead still (rule 7). Stack grain
and vignette above it — a smooth gradient bands without grain.

## 4. Logo lockup reveal
Icon starts centered and alone. The wordmark's container grows from zero width,
so the centered flex row pushes the icon left: the "glide" comes for free. The
wordmark is revealed by `overflow: hidden`, not faded.
```tsx
export const LogoLockup: React.FC<{icon: React.ReactNode; wordmark: React.ReactNode; wordmarkWidth: number}> =
({icon, wordmark, wordmarkWidth}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const ring = spring({frame, fps, config: theme.spring.smooth});
  const open = spring({frame: frame - Math.round(0.45 * fps), fps, config: theme.spring.smooth});
  const drift = interpolate(frame, [Math.round(1 * fps), Math.round(1.6 * fps)], [0, -36], {
    easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
  const C = 2 * Math.PI * 70;
  return (
    <div style={{display: "flex", alignItems: "center", justifyContent: "center",
      translate: `0 ${drift}px`}}>
      <div style={{position: "relative", width: 96, height: 96, display: "grid", placeItems: "center",
        scale: interpolate(ring, [0, 1], [0.8, 1])}}>
        <svg width={160} height={160} style={{position: "absolute", left: -32, top: -32,
          opacity: interpolate(open, [0, 0.6], [0.5, 0], {extrapolateRight: "clamp"})}}>
          <circle cx={80} cy={80} r={70} fill="none" stroke="white" strokeOpacity={0.35}
            strokeWidth={1.5} strokeDasharray={C} strokeDashoffset={C * (1 - ring)} />
        </svg>
        {icon}
      </div>
      <div style={{width: open * (wordmarkWidth + 20), overflow: "hidden"}}>
        <div style={{paddingLeft: 20, width: wordmarkWidth + 20,
          translate: `${interpolate(open, [0, 1], [-30, 0])}px 0`}}>
          {wordmark}
        </div>
      </div>
    </div>
  );
};
```
Reuse the exact component for the outro — the bookend is the point.

## 5. CSS device mockup + screen states
No 3D model needed for a phone that only tilts. A rounded rect with a bezel,
perspective rotation, and a moving glare sells it. For a full orbit around a
device, use `@remotion/three` instead (see the official `remotion-markup` 3D rules).
```tsx
export const Phone: React.FC<{rotX: number; rotY: number; children: React.ReactNode}> =
({rotX, rotY, children}) => (
  <div style={{perspective: 1400}}>
    <div style={{
      width: 300, height: 620, borderRadius: 52, padding: 10, background: "#0B0B0C",
      boxShadow: "0 0 0 2px #2A2A2E, 0 40px 120px rgba(0,0,0,0.6)",
      transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)`, transformStyle: "preserve-3d",
    }}>
      <div style={{position: "relative", width: "100%", height: "100%", borderRadius: 42,
        overflow: "hidden", background: "#000"}}>
        {children}
        <div style={{position: "absolute", inset: 0, pointerEvents: "none",
          background: `linear-gradient(${115 + rotY * 2}deg, rgba(255,255,255,0.14) 0%, transparent 38%)`}} />
      </div>
    </div>
  </div>
);
```
Drive `rotX/rotY` with a spring from e.g. (18°, −24°) to (4°, 0°) so it settles
toward camera. Screen states (off → lock → home) are `<Sequence>`s inside
`children`, each crossfading over 6–8 frames with a small scale (1.04 → 1).
Never use emoji for app icons: rounded squares in theme colors with simple CSS/SVG glyphs.

## 6. Screen takeover (app-icon zoom-through)
The camera pushes into the phone until the screen is bigger than the frame, then
the full-frame UI takes over at the same layout (a match cut hidden by motion).
```tsx
const p = interpolate(frame, [0, 14], [0, 1], {
  easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
// Scale around the tapped icon's position so it is what rushes at the camera.
<div style={{scale: interpolate(p, [0, 1], [1, 6]), transformOrigin: `${iconX}px ${iconY}px`,
  filter: `blur(${interpolate(p, [0.5, 1], [0, 10], {extrapolateLeft: "clamp"})}px)`,
  opacity: interpolate(p, [0.7, 1], [1, 0], {extrapolateLeft: "clamp"})}}>
  <PhoneScene />
</div>
<div style={{opacity: interpolate(p, [0.6, 1], [0, 1], {extrapolateLeft: "clamp"}),
  scale: interpolate(p, [0.6, 1], [1.15, 1], {extrapolateLeft: "clamp"})}}>
  <AppUI />
</div>
```
Open the app UI on a **skeleton** state (grey bars), then fill rows with real
content on a stagger — it reads as "loading" and gives the next beat a hit.

## 7. Recreated UI: data-driven rows with rack focus
Build product UI from data, not screenshots: sharp at any zoom, restylable,
and every value can animate. A continuous `focus` value glides between rows; each
row's sharpness, scale and lift derive from its distance to `focus`.
```tsx
type Row = {title: string; meta: string; status: string; thumb: React.ReactNode};
const ROW_H = 88;

// stops: frame at which focus arrives on row i. Hold, then move over `move` frames.
const focusAt = (frame: number, stops: number[], move = 10) => {
  const input: number[] = [];
  const output: number[] = [];
  stops.forEach((f, i) => {
    if (i > 0) { input.push(f - move); output.push(i - 1); }
    input.push(f); output.push(i);
  });
  return input.length < 2 ? 0 : interpolate(frame, input, output, {
    easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp",
  });
};

export const FocusList: React.FC<{rows: Row[]; stops: number[]}> = ({rows, stops}) => {
  const frame = useCurrentFrame();
  const focus = focusAt(frame, stops);
  return (
    <div style={{translate: `0 ${-focus * ROW_H}px`}}>
      {rows.map((r, i) => {
        const d = Math.min(Math.abs(i - focus), 2);
        const near = Math.max(0, 1 - d);
        return (
          <div key={r.title} style={{
            height: ROW_H - 12, marginBottom: 12, borderRadius: 14, padding: "0 20px",
            display: "flex", alignItems: "center", gap: 16,
            background: `rgba(255,255,255,${0.04 + 0.06 * near})`,
            boxShadow: near > 0.5 ? `0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,${0.15 * near})` : "none",
            scale: 1 + 0.08 * near,
            filter: `blur(${d * 2.5}px)`,
            opacity: 1 - d * 0.3,
            position: "relative", zIndex: near > 0.5 ? 2 : 1,
          }}>
            {r.thumb}
            <div style={{flex: 1}}>
              <div style={{fontWeight: 600}}>{r.title}</div>
              <div style={{opacity: 0.6, fontSize: 14}}>{r.meta}</div>
            </div>
            <div style={{color: theme.colors.primary, fontSize: 13}}>{r.status}</div>
          </div>
        );
      })}
    </div>
  );
};
```
Put the list inside the 3D camera wrapper from section 8 (a few degrees of
`rotateX`) so the focused row visibly lifts toward the lens.

## 8. 3D camera over a dashboard
One wrapper is the camera. Content is laid out flat; the wrapper's perspective
rotation and push make it feel shot, not screenshotted.
```tsx
export const Camera3D: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const t = interpolate(frame, [0, durationInFrames], [0, 1], {easing: theme.ease.inOut});
  return (
    <AbsoluteFill style={{perspective: 1800, alignItems: "center", justifyContent: "center"}}>
      <div style={{
        transform: `translateZ(${interpolate(t, [0, 1], [-200, 60])}px)
                    rotateX(${interpolate(t, [0, 1], [22, 8])}deg)
                    rotateY(${interpolate(t, [0, 1], [-10, 6])}deg)`,
        transformStyle: "preserve-3d",
      }}>
        {children}
      </div>
    </AbsoluteFill>
  );
};
```
Inside: cards enter with the premium entrance on a 4–5 frame stagger, numbers
use the counter pattern (0 → 1 visitor, $0.00 stays — the story is "first"), and
live markers pulse deterministically:
```tsx
const period = 30;
const ph = (frame % period) / period;
<div style={{position: "absolute", left: x, top: y, width: 10, height: 10, borderRadius: "50%",
  background: theme.colors.primary, boxShadow: `0 0 0 ${ph * 18}px rgba(149,191,71,${0.5 * (1 - ph)})`}} />
```

## 9. Velocity blur
Blur proportional to how far a thing moved this frame. Deterministic, cheap,
and works anywhere (the camera, a sliding list, a whip). Evaluate the same
motion function at `frame` and `frame - 1`:
```tsx
const velocityBlur = (motion: (f: number) => number, frame: number, k = 0.35, max = 16) =>
  Math.min(Math.abs(motion(frame) - motion(frame - 1)) * k, max);

const y = (f: number) => interpolate(f, [0, 12], [0, -600], {
  easing: theme.ease.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp",
});
<div style={{translate: `0 ${y(frame)}px`, filter: `blur(${velocityBlur(y, frame)}px)`}} />
```
CSS `blur()` is round. For a directional streak (fast horizontal moves, text
entrances), use an SVG filter with a one-axis deviation:
```tsx
const StreakFilter: React.FC<{id: string; x: number}> = ({id, x}) => (
  <svg width={0} height={0} style={{position: "absolute"}}>
    <filter id={id} x="-50%" y="-50%" width="200%" height="200%">
      <feGaussianBlur stdDeviation={`${x} 0`} />
    </filter>
  </svg>
);
// style={{filter: x > 0.2 ? `url(#${id})` : "none"}}
```
For true sub-frame motion blur, see `@remotion/motion-blur` (`<CameraMotionBlur>`,
`<Trail>`, or `<HtmlInCanvasMotionBlur>` on Remotion ≥ 4.0.529). It renders the
subtree many times per frame: wrap only the moving layer, never the whole video.

## 10. Kinetic line with streak entrance + hero word
Each word slams in from the right with a horizontal streak that resolves to
sharp; the hero word is the brand color and gets an underline that draws after
it lands. Keep the line short (≤ 5 words) and centered.
```tsx
export const StreakLine: React.FC<{words: string[]; hero: number; id: string}> = ({words, hero, id}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  return (
    <div style={{display: "flex", gap: 14, fontSize: 64, fontWeight: 600, color: theme.colors.text}}>
      {words.map((w, i) => {
        const s = spring({frame: frame - i * 4, fps, config: theme.spring.snappy});
        const streak = interpolate(s, [0, 1], [18, 0]);
        const isHero = i === hero;
        const line = spring({frame: frame - words.length * 4 - 6, fps, config: theme.spring.smooth});
        return (
          <span key={i} style={{position: "relative", display: "inline-block",
            opacity: interpolate(s, [0, 0.3], [0, 1], {extrapolateRight: "clamp"}),
            translate: `${interpolate(s, [0, 1], [70, 0])}px 0`,
            scale: `${interpolate(s, [0, 1], [1.25, 1])} 1`,
            color: isHero ? theme.colors.primary : undefined,
            filter: streak > 0.2 ? `url(#${id}-${i})` : "none"}}>
            <StreakFilter id={`${id}-${i}`} x={streak} />
            {w}
            {isHero && (
              <span style={{position: "absolute", left: 0, right: 0, bottom: -6, height: 3,
                background: theme.colors.primary, transformOrigin: "left",
                scale: `${line} 1`}} />
            )}
          </span>
        );
      })}
    </div>
  );
};
```
Second line builds on the first ("and hear" → "and hear your first" → "and hear
your first sale") — words append in place, the line re-centers on a spring.

## 11. Shape morph: text → pill → notification
The payoff is one element changing shape, so the eye never has to find the new
thing. Phase 1 squashes the line into a bright bar (`scaleY` → 0.08 + blur);
phase 2 is a pill that springs open into a card, contents staggering in last.
```tsx
export const PillToNotification: React.FC<{children: React.ReactNode}> = ({children}) => {
  const frame = useCurrentFrame();
  const {fps} = useVideoConfig();
  const open = spring({frame: frame - 10, fps, config: theme.spring.snappy});
  const glow = interpolate(open, [0, 1], [1, 0.25]);
  return (
    <div style={{
      width: interpolate(open, [0, 1], [180, 620]),
      height: interpolate(open, [0, 1], [26, 92]),
      borderRadius: interpolate(open, [0, 1], [13, 26]),
      background: `rgba(20,22,20,${interpolate(open, [0, 1], [0, 0.92])})`,
      border: `1.5px solid rgba(190,255,120,${0.3 + 0.5 * glow})`,
      boxShadow: `0 0 ${40 * glow}px rgba(150,255,80,${0.8 * glow}), inset 0 0 ${24 * glow}px rgba(220,255,160,${glow})`,
      overflow: "hidden", display: "flex", alignItems: "center", padding: "0 18px",
    }}>
      <div style={{opacity: interpolate(open, [0.65, 1], [0, 1], {extrapolateLeft: "clamp", extrapolateRight: "clamp"}),
        translate: `0 ${interpolate(open, [0.65, 1], [8, 0], {extrapolateLeft: "clamp", extrapolateRight: "clamp"})}px`}}>
        {children}
      </div>
    </div>
  );
};
```
Land the notification sound 2 frames before `open` reaches 1. The same trick
works for button → modal, search bar → results, toast → card.

## 12. Credit card outro
After the logo, kill the brand color: a white horizontal light streak (a 2px bar
that widens from 0 to ~240px with a white glow) resolves into a tiny "made by"
label above the creator's name, under a soft white radial glow. Hold 2+ seconds.
This is the only white light in the video, which makes it read as a signature.

## 13. Sound for this style
- Quiet first second (room tone only) so the logo hit lands; music bed enters
  with the device at ~−18 dB.
- Soft whooshes on every camera push and the takeover (−6 dB under the bed's peaks).
- Tiny UI ticks on each rack focus and card landing.
- **The notification ding is the climax** — loudest single event, and the music
  dips for 300ms around it.
Synthesize the kit as WAVs (see the repo's `examples/scripts/gen-sfx.mjs`) or use
a licensed library. Keep every hit in the shot list JSON (section 2).

## 14. Brand and trademark rules
- Use a real company's logo, name or UI only for that company, with permission,
  or for a portfolio spec piece clearly labeled on screen ("Spec ad — not
  affiliated with X"), like the reference does.
- Recreated UI uses invented data (products, prices, order numbers). Never
  present a recreated UI or a fake order/receipt as a real one.
- For your own product, recreate the real UI from its design tokens — same
  radii, colors and type — so the video matches what users will see.

## 15. Finishing: bloom, real motion blur, voice-over
A full recording of the reference's making shows where its polish comes from:
the shots (S01–S10, one clip each, with shot notes as timeline markers) were
assembled and finished in DaVinci Resolve Studio, with an AI voice-over on its
own track. The animation is code; the *look* is a finishing pass. Without that
pass, the same shots read flat and "web". Do the finishing in Remotion:

**Bloom.** A copy of the content that keeps only the bright parts (contrast
crushes the darks), blurred and screened over the original. Two passes: wide
for the bloom, tight for halation around text and edges.
```tsx
const GLOW_PASSES = [{radius: 30, strength: 0.85}, {radius: 7, strength: 0.4}];
export const Bloom: React.FC<{children: React.ReactNode}> = ({children}) => (
  <AbsoluteFill>
    <AbsoluteFill>{children}</AbsoluteFill>
    {GLOW_PASSES.map((g) => (
      <AbsoluteFill key={g.radius} style={{mixBlendMode: "screen", opacity: g.strength,
        filter: `brightness(1.1) contrast(1.9) saturate(1.4) blur(${g.radius}px)`}}>
        {children}
      </AbsoluteFill>
    ))}
  </AbsoluteFill>
);
```
On Chrome 149+ with HTML-in-canvas, `glow()` from `@remotion/effects` on an
`<HtmlInCanvas>` wrapper does this on the GPU; the CSS version works in any
Chromium, including headless render machines.

**Real motion blur.** `<CameraMotionBlur>` renders the subtree at sub-frame
times and averages them, like a film shutter. Keep the light orb, grain and
vignette outside it (grain would average away):
```tsx
<Spotlight keys={timing.spotlight} />
<Bloom>
  <CameraMotionBlur samples={6} shutterAngle={180}>{shots}</CameraMotionBlur>
</Bloom>
<Grain /><Vignette />
```
Cost multiplies: 6 samples × 3 bloom layers = 18 renders per frame. Any SVG
filter ids inside (e.g. the streak filter) must be unique per copy — derive
them from `useId()`, or every copy uses the first copy's filter.

**Voice-over.** One clip per phrase, each placed by the shot list with a slot
it must fit (`at`, `until`), the music ducked about 8 dB under every phrase.
Any TTS works (ElevenLabs, gTTS, a recorded read); the script that generates
the clips should fail when a phrase overruns its slot.

**Or finish in an editor.** Render each shot as its own clip named by the shot
list (`S03 - Products - CONTENT (16x9).mp4`) and assemble, grade and glow it in
DaVinci Resolve or Premiere. Resolve's Python scripting API can build that
timeline and its markers from the same shot list JSON.

