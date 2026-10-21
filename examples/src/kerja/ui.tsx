// ui.tsx — shared look: background with parallax iso grid and floating shapes,
// foreground particles, notification cards, icons, kinetic type, captions.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { rng } from "../kl/skyline";
import { IsoBox } from "./iso";
import { bf, EASE, FONTS, K, SPRING, T } from "./theme";

const W = 1080;
const H = 1920;

// ---------- background ----------
const SHAPES = (() => {
  const r = rng(2024);
  return Array.from({ length: 12 }, (_, i) => ({
    x: r() * W,
    y: r() * H,
    s: 10 + r() * 22,
    c: [K.navy500, K.navy400, K.cyan, K.orange][i % 4],
    o: 0.18 + r() * 0.25,
    ph: r() * 6,
  }));
})();

export const Background: React.FC<{ camX?: number; camY?: number; tint?: string }> = ({ camX = 0, camY = 0, tint = K.cyan }) => {
  const frame = useCurrentFrame();
  const px = -camX * 0.25;
  const py = -camY * 0.25;
  const grid = 120;
  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse 85% 60% at 50% 42%, ${K.navy700}, ${K.navy800} 55%, ${K.navy900})` }} />
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 30%, ${tint}22, transparent 55%)` }} />
      <svg width={W} height={H} style={{ position: "absolute" }}>
        <g opacity={0.09} stroke={K.mist} strokeWidth={1.2}>
          {Array.from({ length: 40 }).map((_, i) => {
            const o = ((i - 10) * grid + ((px + py * 1.732) % grid)) as number;
            return <line key={`a${i}`} x1={o} y1={0} x2={o + H * 1.732} y2={H} />;
          })}
          {Array.from({ length: 40 }).map((_, i) => {
            const o = ((i - 10) * grid + ((px - py * 1.732) % grid)) as number;
            return <line key={`b${i}`} x1={o + H * 1.732} y1={0} x2={o} y2={H} />;
          })}
        </g>
        {SHAPES.map((s, i) => {
          const bob = Math.sin(frame * 0.035 + s.ph) * 14;
          return (
            <g key={i} transform={`translate(${s.x + px * 1.6} ${s.y + py * 1.6 + bob})`} opacity={s.o}>
              <IsoBox x={0} y={0} w={1} d={1} h={1} u={s.s} color={s.c} edge={false} />
            </g>
          );
        })}
      </svg>
    </AbsoluteFill>
  );
};

const PARTICLES = (() => {
  const r = rng(77);
  return Array.from({ length: 34 }, () => ({ x: r() * W, y: r() * H, s: 2 + r() * 4, v: 0.4 + r() * 0.9, ph: r() * 6, c: r() > 0.7 ? K.orange : K.cyanSoft }));
})();

export const Particles: React.FC<{ camX?: number; camY?: number }> = ({ camX = 0, camY = 0 }) => {
  const frame = useCurrentFrame();
  return (
    <svg width={W} height={H} style={{ position: "absolute", pointerEvents: "none" }}>
      {PARTICLES.map((p, i) => {
        const y = (((p.y - frame * p.v - camY * 0.4) % H) + H) % H;
        const x = p.x + Math.sin(frame * 0.02 + p.ph) * 12 - camX * 0.4;
        return <rect key={i} x={x} y={y} width={p.s} height={p.s} transform={`rotate(45 ${x} ${y})`} fill={p.c} opacity={0.35 * (0.5 + 0.5 * Math.sin(frame * 0.05 + p.ph))} />;
      })}
    </svg>
  );
};

// ---------- icons (centered at 0,0, size ~1 unit = s px) ----------
export const Icon: React.FC<{ name: string; s: number; color: string }> = ({ name, s, color }) => {
  const st = { stroke: color, strokeWidth: s * 0.1, fill: "none", strokeLinecap: "round" as const, strokeLinejoin: "round" as const };
  switch (name) {
    case "bank":
      return (
        <g {...st}>
          <path d={`M ${-0.45 * s} ${-0.12 * s} L 0 ${-0.42 * s} L ${0.45 * s} ${-0.12 * s} Z`} />
          {[-0.3, -0.1, 0.1, 0.3].map((x) => (
            <line key={x} x1={x * s} y1={-0.05 * s} x2={x * s} y2={0.28 * s} />
          ))}
          <line x1={-0.45 * s} y1={0.38 * s} x2={0.45 * s} y2={0.38 * s} />
        </g>
      );
    case "cart":
      return (
        <g {...st}>
          <path d={`M ${-0.45 * s} ${-0.35 * s} L ${-0.3 * s} ${-0.35 * s} L ${-0.15 * s} ${0.18 * s} L ${0.35 * s} ${0.18 * s} L ${0.45 * s} ${-0.2 * s} L ${-0.24 * s} ${-0.2 * s}`} />
          <circle cx={-0.1 * s} cy={0.36 * s} r={0.06 * s} fill={color} />
          <circle cx={0.3 * s} cy={0.36 * s} r={0.06 * s} fill={color} />
        </g>
      );
    case "coin":
      return (
        <g {...st}>
          <circle r={0.42 * s} />
          <text x={0} y={0.14 * s} textAnchor="middle" fontFamily={FONTS.display} fontWeight={800} fontSize={0.34 * s} fill={color} stroke="none">
            RM
          </text>
        </g>
      );
    case "home":
      return (
        <g {...st}>
          <path d={`M ${-0.42 * s} ${-0.02 * s} L 0 ${-0.4 * s} L ${0.42 * s} ${-0.02 * s}`} />
          <path d={`M ${-0.3 * s} ${-0.1 * s} L ${-0.3 * s} ${0.38 * s} L ${0.3 * s} ${0.38 * s} L ${0.3 * s} ${-0.1 * s}`} />
        </g>
      );
    case "car":
      return (
        <g {...st}>
          <path d={`M ${-0.45 * s} ${0.15 * s} L ${-0.45 * s} ${-0.02 * s} L ${-0.28 * s} ${-0.28 * s} L ${0.22 * s} ${-0.28 * s} L ${0.42 * s} ${-0.02 * s} L ${0.45 * s} ${0.15 * s} Z`} />
          <circle cx={-0.24 * s} cy={0.22 * s} r={0.09 * s} fill={color} />
          <circle cx={0.24 * s} cy={0.22 * s} r={0.09 * s} fill={color} />
        </g>
      );
    case "bolt":
      return <path d={`M ${0.06 * s} ${-0.45 * s} L ${-0.28 * s} ${0.06 * s} L ${0 * s} ${0.06 * s} L ${-0.08 * s} ${0.45 * s} L ${0.28 * s} ${-0.08 * s} L ${0 * s} ${-0.08 * s} Z`} fill={color} />;
    case "box":
      return (
        <g {...st}>
          <path d={`M 0 ${-0.42 * s} L ${0.4 * s} ${-0.2 * s} L ${0.4 * s} ${0.24 * s} L 0 ${0.46 * s} L ${-0.4 * s} ${0.24 * s} L ${-0.4 * s} ${-0.2 * s} Z`} />
          <path d={`M ${-0.4 * s} ${-0.2 * s} L 0 0 L ${0.4 * s} ${-0.2 * s} M 0 0 L 0 ${0.46 * s}`} />
        </g>
      );
    case "check":
      return <path d={`M ${-0.3 * s} 0 L ${-0.08 * s} ${0.22 * s} L ${0.32 * s} ${-0.22 * s}`} {...st} strokeWidth={s * 0.14} />;
    case "cross":
      return <path d={`M ${-0.24 * s} ${-0.24 * s} L ${0.24 * s} ${0.24 * s} M ${0.24 * s} ${-0.24 * s} L ${-0.24 * s} ${0.24 * s}`} {...st} strokeWidth={s * 0.14} />;
    case "chat":
      return (
        <g {...st}>
          <path d={`M ${-0.42 * s} ${-0.3 * s} L ${0.42 * s} ${-0.3 * s} L ${0.42 * s} ${0.2 * s} L ${-0.05 * s} ${0.2 * s} L ${-0.25 * s} ${0.4 * s} L ${-0.25 * s} ${0.2 * s} L ${-0.42 * s} ${0.2 * s} Z`} />
          {[-0.2, 0, 0.2].map((x) => (
            <circle key={x} cx={x * s} cy={-0.05 * s} r={0.04 * s} fill={color} />
          ))}
        </g>
      );
    case "trend":
      return <path d={`M ${-0.42 * s} ${0.3 * s} L ${-0.12 * s} 0 L ${0.08 * s} ${0.16 * s} L ${0.42 * s} ${-0.28 * s} M ${0.18 * s} ${-0.28 * s} L ${0.42 * s} ${-0.28 * s} L ${0.42 * s} ${-0.04 * s}`} {...st} />;
    default:
      return null;
  }
};

// ---------- notification card (SVG, lives in the camera's world) ----------
export const Card: React.FC<{
  x: number;
  y: number;
  w?: number;
  h?: number;
  at: number; // frame it lands
  from?: [number, number];
  icon: string;
  accent: string;
  title: string;
  value: string;
  valueColor?: string;
  out?: number; // frame it leaves (optional)
}> = ({ x, y, w = 520, h = 140, at, from = [160, 0], icon, accent, title, value, valueColor = K.navy800, out }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  if (frame < at - 2) return null;
  const p = spring({ frame: frame - at, fps, config: SPRING.pop });
  const o = out !== undefined ? interpolate(frame, [out - 6, out], [1, 0], { easing: EASE.in, extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 1;
  const dx = from[0] * (1 - p);
  const dy = from[1] * (1 - p);
  const sc = 0.82 + 0.18 * p;
  return (
    <g transform={`translate(${x + dx} ${y + dy}) scale(${sc})`} opacity={Math.min(1, p * 1.6) * o}>
      <rect x={-w / 2 + 10} y={-h / 2 + 22} width={w} height={h} rx={34} fill={K.shadow} filter="url(#iso-soft)" />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill={K.white} />
      <rect x={-w / 2} y={-h / 2} width={w} height={h} rx={34} fill="none" stroke={accent} strokeOpacity={0.35} strokeWidth={3} />
      <circle cx={-w / 2 + h / 2} cy={0} r={h * 0.32} fill={accent} />
      <g transform={`translate(${-w / 2 + h / 2} 0)`}>
        <Icon name={icon} s={h * 0.42} color={K.white} />
      </g>
      <text x={-w / 2 + h + 6} y={-12} fontFamily={FONTS.body} fontWeight={600} fontSize={30} fill={K.navy500}>
        {title}
      </text>
      <text x={-w / 2 + h + 6} y={40} fontFamily={FONTS.display} fontWeight={800} fontSize={44} fill={valueColor} letterSpacing="-0.02em">
        {value}
      </text>
    </g>
  );
};

// ---------- kinetic type (HTML, screen space) ----------
export const Words: React.FC<{
  text: string;
  at: number;
  out?: number;
  stagger?: number;
  size: number;
  color?: string;
  weight?: number;
  font?: string;
  highlight?: Record<string, string>;
  style?: React.CSSProperties;
}> = ({ text, at, out, stagger = 3, size, color = K.white, weight = 800, font = FONTS.display, highlight = {}, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = out !== undefined ? interpolate(frame, [out - 7, out], [0, 1], { easing: EASE.in, extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", columnGap: size * 0.28, rowGap: size * 0.05, ...style }}>
      {text.split(" ").map((w, i) => {
        const p = spring({ frame: frame - at - i * stagger, fps, config: SPRING.pop });
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              fontFamily: font,
              fontWeight: weight,
              fontSize: size,
              lineHeight: 1.08,
              letterSpacing: "-0.02em",
              color: highlight[w] ?? color,
              opacity: Math.min(1, p * 1.5) * (1 - exit),
              transform: `translateY(${(1 - p) * size * 0.6 - exit * 30}px) scale(${1.3 - 0.3 * p})`,
              filter: p < 0.9 ? `blur(${(1 - p) * 8}px)` : undefined,
              textShadow: `0 ${size * 0.08}px ${size * 0.35}px rgba(3,8,28,0.55)`,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

export const Chip: React.FC<{ text: string; color: string; at: number; out?: number; top?: number }> = ({ text, color, at, out, top = 220 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const p = spring({ frame: frame - at, fps, config: SPRING.smooth });
  const exit = out !== undefined ? interpolate(frame, [out - 7, out], [0, 1], { easing: EASE.in, extrapolateLeft: "clamp", extrapolateRight: "clamp" }) : 0;
  return (
    <div style={{ position: "absolute", top, width: W, display: "flex", justifyContent: "center", opacity: p * (1 - exit), transform: `translateY(${(1 - p) * -40}px)` }}>
      <div
        style={{
          padding: "18px 40px",
          borderRadius: 999,
          background: color,
          color: K.navy900,
          fontFamily: FONTS.display,
          fontWeight: 800,
          fontSize: 40,
          letterSpacing: "0.02em",
          boxShadow: `0 16px 50px ${color}55`,
        }}
      >
        {text}
      </div>
    </div>
  );
};

// ---------- captions: the current VO phrase, word-by-word highlight ----------
export const Captions: React.FC<{ scenes: string[] }> = ({ scenes }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const ph = T.phrases.find((p) => scenes.includes(p.scene) && frame >= bf(p.beat) - 2 && frame < bf(p.endBeat) + 8);
  if (!ph) return null;
  const words = ph.text.split(" ");
  const total = words.reduce((n, w) => n + w.length + 2, 0);
  const prog = ((frame - bf(ph.beat)) / fps / ph.dur) * total;
  const p = spring({ frame: frame - bf(ph.beat) + 2, fps, config: SPRING.smooth });
  let acc = 0;
  return (
    <div style={{ position: "absolute", bottom: 250, width: W, display: "flex", justifyContent: "center", opacity: p, transform: `translateY(${(1 - p) * 30}px)` }}>
      <div style={{ maxWidth: 900, padding: "22px 34px", borderRadius: 28, background: "rgba(6,15,46,0.78)", textAlign: "center", lineHeight: 1.3 }}>
        {words.map((w, i) => {
          const start = acc;
          acc += w.length + 2;
          const on = prog >= start;
          return (
            <span key={i} style={{ fontFamily: FONTS.body, fontWeight: 700, fontSize: 44, color: on ? K.white : "rgba(244,248,255,0.4)" }}>
              {w}{" "}
            </span>
          );
        })}
      </div>
    </div>
  );
};
