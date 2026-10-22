// Building blocks for "Prompt to Video", adapted from
// remotion-motion-graphics/references/ai-demo.md.
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, interpolateColors, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { getLength, getPointAtLength, getTangentAtLength } from "@remotion/paths";
import { measureText } from "@remotion/layout-utils";
import { promptTheme as P, PT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

// Three blurred ribbons drifting on slow sines; one sharper edge for the sheen.
// Opacity follows timing.silk so it can sit behind every scene.
export const Silk: React.FC = () => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const c = P.colors.silk;
  const alpha = interpolate(frame, PT.silk.map((k) => k[0]), PT.silk.map((k) => k[1]), { ...clamp, easing: P.ease.inOut });
  const ribbon = (i: number) => {
    const t = frame / 70 + i * 1.7;
    const a = Math.sin(t) * 140;
    const b = Math.cos(t * 0.8) * 180;
    const x0 = W * (0.12 + i * 0.2);
    return `M ${x0 - 320} ${H + 120} C ${x0 + a} ${H * 0.72}, ${x0 - 220 + b} ${H * 0.34}, ${x0 + 520} -120 L ${x0 + 700} -120 C ${x0 + 60 + b} ${H * 0.34}, ${x0 + 200 + a} ${H * 0.72}, ${x0 - 60} ${H + 120} Z`;
  };
  return (
    <AbsoluteFill style={{ opacity: alpha }}>
      <svg width={W} height={H}>
        <defs>
          <linearGradient id="silk" x1="0" y1="1" x2="1" y2="0">
            <stop offset="0" stopColor={c[0]} />
            <stop offset="0.55" stopColor={c[1]} />
            <stop offset="1" stopColor={c[2]} />
          </linearGradient>
        </defs>
        {[0, 1, 2].map((i) => (
          <path key={i} d={ribbon(i)} fill="url(#silk)" opacity={0.7 - i * 0.18} style={{ filter: "blur(46px)" }} />
        ))}
        <path d={ribbon(1)} fill="none" stroke={c[2]} strokeWidth={6} opacity={0.45} style={{ filter: "blur(10px)" }} />
      </svg>
    </AbsoluteFill>
  );
};

// The demo's own mark: a play triangle in a rounded frame, drawn in theme colors.
export const PlayMark: React.FC<{ size: number; glow?: number }> = ({ size, glow = 1 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100" style={{ filter: `drop-shadow(0 0 ${14 * glow}px ${P.colors.heroGlow})` }}>
    <defs>
      <linearGradient id="markFill" x1="0" y1="0" x2="1" y2="1">
        <stop offset="0" stopColor={P.colors.heroHot} />
        <stop offset="1" stopColor={P.colors.hero} />
      </linearGradient>
    </defs>
    <rect x={8} y={8} width={84} height={84} rx={24} fill="none" stroke="url(#markFill)" strokeWidth={7} />
    <path d="M40 31 L71 50 L40 69 Z" fill="url(#markFill)" strokeLinejoin="round" stroke="url(#markFill)" strokeWidth={4} />
  </svg>
);

// Letters start spread wide and blurred, then slide together.
export const TrackingReveal: React.FC<{ text: string; start?: number; spread?: number; style: React.CSSProperties }> = ({
  text,
  start = 0,
  spread = 30,
  style,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = text.length;
  return (
    <div style={{ display: "flex", ...style }}>
      {text.split("").map((ch, i) => {
        const s = spring({ frame: frame - start - i * 1.2, fps, config: P.spring.smooth });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              whiteSpace: "pre",
              opacity: s,
              filter: s < 0.98 ? `blur(${(1 - s) * 10}px)` : "none",
              translate: `${(1 - s) * (i - (n - 1) / 2) * spread}px 0`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </div>
  );
};

// Final x (left edge) and width of each chip in a row centered on 0.
export const chipLayout = (labels: readonly string[], size: number, pad = 24, gap = 12) => {
  const widths = labels.map((l) => measureText({ text: l, fontFamily: P.fonts.body, fontSize: size, fontWeight: 500 }).width + pad * 2);
  const total = widths.reduce((a, b) => a + b, 0) + gap * (labels.length - 1);
  const lefts = widths.map((_, i) => -total / 2 + widths.slice(0, i).reduce((a, b) => a + b, 0) + gap * i);
  return { widths, lefts };
};

const neon = (k: number) => ({
  border: `2px solid rgba(255,255,255,${0.65 + 0.35 * k})`,
  boxShadow: `0 0 ${6 + 8 * k}px rgba(255,255,255,0.85), 0 0 ${18 + 18 * k}px rgba(196,181,253,0.75), inset 0 0 10px rgba(255,255,255,0.3)`,
});

// One glowing pill becomes a row of chips, center chips first.
export const ChipSplit: React.FC<{ labels: readonly string[]; start: number; size: number; active?: (i: number) => number }> = ({
  labels,
  start,
  size,
  active = () => 0,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const h = size * 2.3;
  const { widths, lefts } = chipLayout(labels, size);
  const pillW = 220;
  const mid = (labels.length - 1) / 2;
  return (
    <div style={{ position: "relative", width: 0, height: 0 }}>
      {labels.map((l, i) => {
        const s = spring({ frame: frame - start - Math.abs(i - mid) * 2, fps, config: P.spring.snappy });
        const k = active(i);
        return (
          <div
            key={l}
            style={{
              position: "absolute",
              top: -h / 2,
              height: h,
              borderRadius: h / 2,
              left: interpolate(s, [0, 1], [-pillW / 2, lefts[i]]),
              width: interpolate(s, [0, 1], [pillW, widths[i]]),
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              overflow: "hidden",
              boxSizing: "border-box",
              fontFamily: P.fonts.body,
              fontSize: size,
              fontWeight: 500,
              color: "white",
              background: `rgba(255,255,255,${interpolate(s, [0, 0.45], [0.9, 0.05], clamp) + 0.14 * k})`,
              scale: 1 - 0.06 * k,
              ...neon(k),
            }}
          >
            <span style={{ opacity: interpolate(s, [0.5, 1], [0, 1], clamp) }}>{l}</span>
          </div>
        );
      })}
    </div>
  );
};

// 0 -> 1 -> 0 over a short press, for whatever the cursor clicks.
export const useClick = (at: number) => {
  const frame = useCurrentFrame();
  return interpolate(frame, [at, at + 3, at + 9], [0, 1, 0], clamp);
};

export const Cursor: React.FC<{ from: [number, number]; to: [number, number]; start: number; dur: number; clickAt: number }> = ({
  from,
  to,
  start,
  dur,
  clickAt,
}) => {
  const frame = useCurrentFrame();
  const t = interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: P.ease.inOut });
  const press = useClick(clickAt);
  const x = interpolate(t, [0, 1], [from[0], to[0]]);
  const y = interpolate(t, [0, 1], [from[1], to[1]]) - Math.sin(Math.PI * t) * 40;
  return (
    <svg
      width={40}
      height={44}
      viewBox="0 0 36 40"
      style={{
        position: "absolute",
        left: x,
        top: y,
        opacity: interpolate(frame, [start - 4, start + 2], [0, 1], clamp),
        scale: 1 - 0.15 * press,
        transformOrigin: "4px 4px",
        filter: "drop-shadow(0 4px 8px rgba(0,0,0,0.5))",
      }}
    >
      <path d="M4 4 L4 32 L12 25 L17 37 L23 34 L18 23 L29 23 Z" fill="white" stroke="#111" strokeWidth={2} strokeLinejoin="round" />
    </svg>
  );
};

// Characters at a fixed rate; the newest few are the hero color and cool to white.
export const TypeOn: React.FC<{ text: string; start: number; cps: number; style: React.CSSProperties }> = ({ text, start, cps, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.min(text.length, Math.floor((Math.max(0, frame - start) * cps) / fps));
  const caret = n < text.length || Math.floor(frame / 15) % 2 === 0;
  return (
    <div style={{ whiteSpace: "pre-wrap", ...style }}>
      {text
        .slice(0, n)
        .split("")
        .map((ch, i) => (
          <span key={i} style={{ color: interpolateColors(n - i, [1, 8], [P.colors.heroHot, P.colors.text]) }}>
            {ch}
          </span>
        ))}
      <span style={{ opacity: caret ? 1 : 0, color: P.colors.heroHot }}>|</span>
    </div>
  );
};

// The prompt box: text area, then a footer with attach, skill tag, mic and send.
export const PromptBox: React.FC<{ text: string; start: number; cps: number; sendAt: number; size?: number }> = ({
  text,
  start,
  cps,
  sendAt,
  size = 40,
}) => {
  const press = useClick(sendAt);
  return (
    <div
      style={{
        width: 1100,
        height: 240,
        borderRadius: 34,
        background: P.colors.panel,
        boxShadow: `0 0 0 1px ${P.colors.line}, 0 0 80px rgba(139,92,246,0.25), 0 40px 100px rgba(0,0,0,0.6)`,
        padding: "34px 40px",
        boxSizing: "border-box",
        position: "relative",
        fontFamily: P.fonts.body,
      }}
    >
      <TypeOn text={text} start={start} cps={cps} style={{ fontSize: size, color: P.colors.text, lineHeight: 1.25 }} />
      <div style={{ position: "absolute", left: 40, right: 32, bottom: 26, display: "flex", alignItems: "center", gap: 18 }}>
        <div style={{ fontSize: 40, color: P.colors.text, fontWeight: 300, lineHeight: 1 }}>+</div>
        <div style={{ flex: 1 }} />
        <div style={{ fontFamily: P.fonts.mono, fontSize: 18, color: P.colors.dim, padding: "6px 14px", borderRadius: 10, background: P.colors.panelHi }}>
          skill: remotion-motion-graphics
        </div>
        <svg width={22} height={30} viewBox="0 0 22 30">
          <rect x={6} y={2} width={10} height={17} rx={5} fill={P.colors.text} />
          <path d="M2 13 a9 9 0 0 0 18 0 M11 22 V28" stroke={P.colors.text} strokeWidth={2.4} fill="none" strokeLinecap="round" />
        </svg>
        <div
          style={{
            width: 48,
            height: 48,
            borderRadius: 14,
            background: P.colors.hero,
            display: "grid",
            placeItems: "center",
            scale: 1 - 0.12 * press,
            boxShadow: `0 0 ${10 + 30 * press}px ${P.colors.heroGlow}`,
          }}
        >
          <svg width={22} height={22} viewBox="0 0 22 22">
            <path d="M11 18 V4 M5 10 L11 4 L17 10" stroke="white" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
      </div>
    </div>
  );
};

// Tiny tokenizer: tags, strings, numbers, keywords.
const TOKEN = /(<\/?[\w.]+|\/?>|"[^"]*"|'[^']*'|\b(?:import|from|const|return|export)\b|\b\d+(?:\.\d+)?\b)/g;
const tokenColor = (t: string) =>
  t.startsWith("<") || t.endsWith(">")
    ? P.colors.code.tag
    : t.startsWith('"') || t.startsWith("'")
      ? P.colors.code.str
      : /^\d/.test(t)
        ? P.colors.code.num
        : P.colors.code.kw;

export const CodeStream: React.FC<{ lines: readonly string[]; dur: number }> = ({ lines, dur }) => {
  const frame = useCurrentFrame();
  const scroll = interpolate(frame, [0, dur], [520, -lines.length * 34 - 200], { ...clamp, easing: P.ease.in });
  return (
    <AbsoluteFill style={{ perspective: 900, alignItems: "center", justifyContent: "center" }}>
      <div style={{ transform: `rotateX(32deg) translateY(${scroll}px)`, transformOrigin: "50% 0%" }}>
        {lines.map((l, i) => (
          <div key={i} style={{ whiteSpace: "pre", fontFamily: P.fonts.mono, fontSize: 24, lineHeight: "34px", color: P.colors.code.plain }}>
            {l.split(TOKEN).map((part, j) =>
              j % 2 ? (
                <span key={j} style={{ color: tokenColor(part) }}>
                  {part}
                </span>
              ) : (
                part
              ),
            )}
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

// One world canvas; the camera is a single translate + scale between keys.
export const World: React.FC<{ cams: readonly (readonly number[])[]; children: React.ReactNode }> = ({ cams, children }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const at = (k: number) =>
    interpolate(
      frame,
      cams.map((c) => c[0]),
      cams.map((c) => c[k]),
      { ...clamp, easing: P.ease.inOut },
    );
  return (
    <AbsoluteFill style={{ overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transform: `translate(${W / 2}px, ${H / 2}px) scale(${at(3)}) translate(${-at(1)}px, ${-at(2)}px)`,
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// Letters ride a curve (the last letter leads), then settle onto a straight line.
export const PathText: React.FC<{ text: string; d: string; x: number; y: number; size: number; travel: number; settleAt: number }> = ({
  text,
  d,
  x,
  y,
  size,
  travel,
  settleAt,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const font = P.fonts.display;
  const len = useMemo(() => getLength(d), [d]);
  const chars = text.split("");
  const adv = chars.map((ch) => measureText({ text: ch, fontFamily: font, fontSize: size, fontWeight: 600 }).width);
  const center = adv.map((w, i) => adv.slice(0, i).reduce((a, b) => a + b, 0) + w / 2);
  const last = center[center.length - 1];
  // the curve must be longer than the word: the first letter sits `last` px behind the head
  const head = interpolate(frame, [0, travel], [0, len], { ...clamp, easing: P.ease.out });
  const settle = spring({ frame: frame - settleAt, fps, config: P.spring.smooth });
  return (
    <>
      {chars.map((ch, i) => {
        const back = last - center[i];
        const s = Math.max(0, Math.min(len, head - back));
        const p = getPointAtLength(d, s) ?? { x: 0, y: 0 };
        const tan = getTangentAtLength(d, s) ?? { x: 1, y: 0 };
        return (
          <span
            key={i}
            style={{
              position: "absolute",
              width: adv[i],
              textAlign: "center",
              whiteSpace: "pre",
              fontFamily: font,
              fontSize: size,
              fontWeight: 600,
              color: P.colors.text,
              lineHeight: 1,
              opacity: head > back ? 1 : 0,
              transformOrigin: "50% 100%",
              left: interpolate(settle, [0, 1], [p.x, x + center[i]]) - adv[i] / 2,
              top: interpolate(settle, [0, 1], [p.y, y]) - size,
              rotate: `${interpolate(settle, [0, 1], [(Math.atan2(tan.y, tan.x) * 180) / Math.PI, 0])}deg`,
            }}
          >
            {ch}
          </span>
        );
      })}
    </>
  );
};
