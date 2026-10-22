// Building blocks for the "Gerak 2.0" behind-the-build promo, adapted from
// remotion-motion-graphics/references/build-reveal.md.
import React, { useLayoutEffect, useMemo, useRef } from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { gerakTheme as G, GT } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const C = G.colors;

// The one lime light, keyed across the whole video.
export const Glow: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (i: number) => interpolate(frame, GT.glow.map((k) => k[0]), GT.glow.map((k) => k[i]), { ...clamp, easing: G.ease.inOut });
  const size = at(3);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: at(1) - size / 2,
          top: at(2) - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(139,92,246,0.45) 0%, rgba(163,230,53,0.12) 42%, transparent 66%)",
          filter: "blur(60px)",
          opacity: at(4),
        }}
      />
    </AbsoluteFill>
  );
};

// ---------- the editor as a 3D set ----------
export type Cam = readonly number[]; // [frame, x, y, zoom, tilt, turn]
export const camAt = (frame: number, cams: readonly Cam[], k: number) =>
  interpolate(
    frame,
    cams.map((c) => c[0]),
    cams.map((c) => c[k]),
    { ...clamp, easing: G.ease.inOut },
  );

export const EditorSet: React.FC<{ cams: readonly Cam[]; children: React.ReactNode }> = ({ cams, children }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const at = (k: number) => camAt(frame, cams, k);
  return (
    <AbsoluteFill style={{ perspective: 1500, overflow: "hidden" }}>
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          transformOrigin: "0 0",
          transform: `translate(${W / 2}px, ${H / 2}px) rotateX(${at(4)}deg) rotateZ(${at(5)}deg) scale(${at(3)}) translate(${-at(1)}px, ${-at(2)}px)`,
          transformStyle: "preserve-3d",
        }}
      >
        {children}
      </div>
    </AbsoluteFill>
  );
};

// Stands up off the tilted plane: undoes the camera's tilt and turn.
export const Billboard: React.FC<{ cams: readonly Cam[]; x: number; y: number; children: React.ReactNode }> = ({ cams, x, y, children }) => {
  const frame = useCurrentFrame();
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y,
        transformOrigin: "50% 100%",
        transform: `translate(-50%, -100%) rotateZ(${-camAt(frame, cams, 5)}deg) rotateX(${-camAt(frame, cams, 4)}deg)`,
      }}
    >
      {children}
    </div>
  );
};

// ---------- Manggis, the mangosteen mascot ----------
export type Station = { x: number; y: number; at: number; stay: number };

export const mascotAt = (frame: number, stations: readonly Station[], hop: number, height = 150) => {
  let i = stations.length - 1;
  while (i > 0 && frame < stations[i].at) i--;
  const s = stations[i];
  const next = stations[i + 1];
  const leave = s.at + s.stay;
  if (!next || frame < leave) return { x: s.x, y: s.y, air: 0, landed: frame - s.at, dir: 0, station: i };
  const t = Math.min(1, (frame - leave) / hop);
  return {
    x: interpolate(t, [0, 1], [s.x, next.x]),
    y: interpolate(t, [0, 1], [s.y, next.y]) - Math.sin(Math.PI * t) * height,
    air: Math.sin(Math.PI * t),
    landed: -1,
    dir: Math.sign(next.x - s.x),
    station: -1,
  };
};

export const Manggis: React.FC<{ size: number; air: number; landed: number; dir: number }> = ({ size, air, landed, dir }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const M = C.manggis;
  const land = landed >= 0 ? spring({ frame: landed, fps, config: { damping: 7, stiffness: 220, mass: 0.6 } }) : 1;
  const sy = landed >= 0 ? interpolate(land, [0, 1], [0.7, 1]) : 1 + air * 0.18;
  const blink = frame % 70 < 3 ? 0.12 : 1;
  return (
    <svg width={size} height={size} viewBox="0 0 100 100" style={{ overflow: "visible", scale: `${1 / sy} ${sy}`, transformOrigin: "50% 100%", rotate: `${dir * air * 12}deg` }}>
      <ellipse cx={50} cy={99} rx={30 * (1 - air * 0.5)} ry={4} fill="rgba(0,0,0,0.4)" />
      <ellipse cx={50} cy={60} rx={40} ry={36} fill={M.body} />
      <ellipse cx={36} cy={46} rx={12} ry={7} fill={M.shine} opacity={0.55} />
      {/* the green crown: four rounded sepals */}
      {[-36, -12, 12, 36].map((a) => (
        <ellipse key={a} cx={50} cy={22} rx={7} ry={13} fill={M.crown} transform={`rotate(${a} 50 32)`} />
      ))}
      <rect x={47} y={6} width={6} height={12} rx={3} fill="#4A7F2C" />
      {[38, 62].map((x) => (
        <ellipse key={x} cx={x + dir * 3} cy={60} rx={5} ry={6.5 * blink} fill={M.face} />
      ))}
      <path d={`M 44 72 Q 50 ${76 + air * 3} 56 72`} stroke={M.face} strokeWidth={2.5} fill="none" strokeLinecap="round" />
      <ellipse cx={34} cy={95} rx={9} ry={5} fill={M.body} />
      <ellipse cx={66} cy={95} rx={9} ry={5} fill={M.body} />
    </svg>
  );
};

// ---------- shards when Manggis breaks out of the canvas ----------
export const Shards: React.FC<{ x: number; y: number; start: number; count?: number }> = ({ x, y, start, count = 24 }) => {
  const frame = useCurrentFrame();
  const age = frame - start;
  if (age < 0 || age > 30) return null;
  return (
    <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
      {Array.from({ length: count }).map((_, i) => {
        const a = random(`sa${i}`) * Math.PI * 2;
        const v = 6 + random(`sv${i}`) * 14;
        const px = x + Math.cos(a) * v * age;
        const py = y + Math.sin(a) * v * age * 0.6 + 0.6 * age * age;
        const s = 12 + random(`ss${i}`) * 28;
        return (
          <polygon
            key={i}
            points={`0,${-s} ${s * 0.8},${s * 0.6} ${-s * 0.6},${s * 0.4}`}
            transform={`translate(${px} ${py}) rotate(${(random(`sr${i}`) - 0.5) * 40 * age})`}
            fill="rgba(237,234,240,0.92)"
            opacity={1 - age / 30}
          />
        );
      })}
    </svg>
  );
};

// ---------- particle typography ----------
const useTextPoints = (text: string, font: string, size: number, step: number) =>
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
    const pts: { x: number; y: number }[] = [];
    for (let y = 0; y < h; y += step) {
      for (let x = 0; x < w; x += step) {
        if (data[(y * w + x) * 4 + 3] > 128) pts.push({ x, y });
      }
    }
    return { pts, w, h };
  }, [text, font, size, step]);

export const ParticleText: React.FC<{ text: string; size: number; step?: number; dot?: number; assemble: number; disperse: number; width: number; height: number }> = ({
  text,
  size,
  step = 6,
  dot = 2.4,
  assemble,
  disperse,
  width,
  height,
}) => {
  const ref = useRef<HTMLCanvasElement>(null);
  const frame = useCurrentFrame();
  const { pts, w, h } = useTextPoints(text, G.fonts.display, size, step);
  useLayoutEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, width, height);
    const ox = (width - w) / 2;
    const oy = (height - h) / 2;
    pts.forEach((p, i) => {
      const delay = random(`d${i}`) * 0.45;
      const t = Math.min(1, Math.max(0, (assemble - delay) / 0.55));
      const e = 1 - Math.pow(1 - t, 3);
      const a = random(`a${i}`) * Math.PI * 2;
      const r = 250 + random(`r${i}`) * 500;
      const k = disperse * (0.4 + random(`k${i}`));
      const x = ox + p.x + Math.cos(a) * r * (1 - e) + Math.cos(a) * 320 * k;
      const y = oy + p.y + Math.sin(a) * r * (1 - e) + Math.sin(a) * 160 * k - 220 * k;
      const alpha = e * (1 - Math.min(1, disperse * 1.3)) * (0.55 + 0.45 * Math.sin(frame / 5 + i));
      if (alpha <= 0.01) return;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = i % 5 === 0 ? C.heroHot : C.hero;
      ctx.fillRect(x, y, dot, dot);
    });
    ctx.globalAlpha = 1;
  }, [frame, pts, w, h, width, height, assemble, disperse, dot]);
  return <canvas ref={ref} width={width} height={height} style={{ position: "absolute", left: 0, top: 0 }} />;
};

// ---------- the working pill ----------
export const WorkingPill: React.FC<{ label: string }> = ({ label }) => {
  const frame = useCurrentFrame();
  const colors = C.pill;
  const dots = Math.floor(frame / 8) % 4;
  return (
    <div
      style={{
        position: "relative",
        isolation: "isolate",
        padding: "18px 40px 18px 72px",
        borderRadius: 44,
        fontFamily: G.fonts.body,
        fontSize: 32,
        fontWeight: 600,
        color: "#16101A",
        background: `linear-gradient(100deg, ${colors.join(", ")})`,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -50,
          borderRadius: 90,
          zIndex: -1,
          filter: "blur(44px)",
          opacity: 0.9,
          background: `conic-gradient(from ${frame * 6}deg, ${[...colors, colors[0]].join(", ")})`,
        }}
      />
      <svg width={30} height={30} viewBox="0 0 28 28" style={{ position: "absolute", left: 26, top: "50%", marginTop: -15, rotate: `${frame * 14}deg` }}>
        <circle cx={14} cy={14} r={11} fill="none" stroke="#16101A" strokeWidth={3} strokeLinecap="round" strokeDasharray="48 100" />
      </svg>
      {label}
      <span style={{ opacity: dots > 0 ? 1 : 0 }}>.</span>
      <span style={{ opacity: dots > 1 ? 1 : 0 }}>.</span>
      <span style={{ opacity: dots > 2 ? 1 : 0 }}>.</span>
    </div>
  );
};

// ---------- the live graph editor ----------
export const EaseGraph: React.FC<{ ease: (t: number) => number; t: number; w: number; h: number }> = ({ ease, t, w, h }) => {
  const lo = -0.2;
  const hi = 1.25;
  const y = (v: number) => h - ((v - lo) / (hi - lo)) * h;
  const d = Array.from({ length: 61 }, (_, i) => `${i ? "L" : "M"} ${(i / 60) * w} ${y(ease(i / 60))}`).join(" ");
  return (
    <svg width={w} height={h}>
      <line x1={0} y1={y(1)} x2={w} y2={y(1)} stroke="rgba(255,255,255,0.12)" strokeDasharray="4 6" />
      <path d={d} fill="none" stroke={C.hero} strokeWidth={3.5} />
      <circle cx={t * w} cy={y(ease(t))} r={7} fill="white" style={{ filter: `drop-shadow(0 0 8px ${C.hero})` }} />
    </svg>
  );
};

export type Track = { label: string; keys: number[] };
export const KeyTracks: React.FC<{ tracks: Track[]; frame: number; total: number; w: number }> = ({ tracks, frame, total, w }) => (
  <div style={{ position: "relative", width: w, fontFamily: G.fonts.body }}>
    {tracks.map((tr) => (
      <div key={tr.label} style={{ display: "flex", alignItems: "center", height: 38, gap: 12 }}>
        <div style={{ width: 110, fontSize: 17, color: C.dim }}>{tr.label}</div>
        <div style={{ position: "relative", flex: 1, height: 16, borderRadius: 8, background: "rgba(255,255,255,0.06)" }}>
          <div
            style={{
              position: "absolute",
              top: 0,
              bottom: 0,
              borderRadius: 8,
              background: "rgba(163,230,53,0.3)",
              left: `${(tr.keys[0] / total) * 100}%`,
              width: `${((tr.keys[tr.keys.length - 1] - tr.keys[0]) / total) * 100}%`,
            }}
          />
          {tr.keys.map((k) => (
            <div
              key={k}
              style={{
                position: "absolute",
                top: 2,
                width: 12,
                height: 12,
                marginLeft: -6,
                rotate: "45deg",
                left: `${(k / total) * 100}%`,
                background: frame >= k ? C.hero : "#5B5263",
              }}
            />
          ))}
        </div>
      </div>
    ))}
    <div style={{ position: "absolute", top: -8, bottom: -8, width: 2, background: C.hero, left: 122 + ((w - 122) * Math.min(Math.max(frame, 0), total)) / total }} />
  </div>
);

// ---------- halftone window + the mark assembling ----------
export const Halftone: React.FC<{ open: number }> = ({ open }) => (
  <AbsoluteFill style={{ background: C.bg }}>
    <AbsoluteFill style={{ backgroundImage: `radial-gradient(circle, ${C.halftone} 2.2px, transparent 2.8px)`, backgroundSize: "15px 15px" }} />
    <AbsoluteFill
      style={{
        background: C.bg,
        scale: interpolate(open, [0, 1], [0.2, 1]),
        clipPath: "polygon(26% 0, 74% 0, 96% 50%, 74% 100%, 26% 100%, 4% 50%)",
      }}
    />
  </AbsoluteFill>
);

// The Gerak mark: six rounded petals around an open hub, assembled from scattered pieces.
export const AssembleMark: React.FC<{ start: number; scale?: number; colors?: readonly [string, string] }> = ({ start, scale = 1, colors = [C.heroHot, C.hero] }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = 6;
  const r = 26 * scale;
  const len = 70 * scale;
  const settle = spring({ frame: frame - start - n * 3, fps, config: G.spring.bouncy });
  return (
    <div style={{ position: "relative", width: 0, height: 0, rotate: `${interpolate(settle, [0, 1], [-40, 0])}deg` }}>
      {Array.from({ length: n }).map((_, i) => {
        const s = spring({ frame: frame - start - i * 3, fps, config: G.spring.smooth });
        const base = (i / n) * 360;
        const fromA = base + (random(`ra${i}`) - 0.5) * 220;
        const fromD = (260 + random(`rd${i}`) * 320) * scale;
        const dir = (fromA * Math.PI) / 180;
        return (
          <div
            key={i}
            style={{
              position: "absolute",
              left: -len * 0.21,
              top: -r - len,
              width: len * 0.42,
              height: len,
              borderRadius: len,
              background: colors[i % 2],
              opacity: s,
              transformOrigin: `50% ${len + r}px`,
              rotate: `${interpolate(s, [0, 1], [fromA, base])}deg`,
              translate: `${Math.sin(dir) * fromD * (1 - s)}px ${-Math.cos(dir) * fromD * (1 - s)}px`,
            }}
          />
        );
      })}
    </div>
  );
};

// Text typed at a fixed rate with a blinking caret.
export const TypeLine: React.FC<{ text: string; start: number; cps: number; style?: React.CSSProperties }> = ({ text, start, cps, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const n = Math.min(text.length, Math.floor((Math.max(0, frame - start) * cps) / fps));
  const caret = frame >= start && (n < text.length || Math.floor(frame / 15) % 2 === 0);
  return (
    <span style={{ whiteSpace: "pre", ...style }}>
      {text.slice(0, n)}
      <span style={{ opacity: caret ? 1 : 0, color: C.hero }}>|</span>
    </span>
  );
};
