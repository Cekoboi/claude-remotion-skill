// Building blocks for the "laju" delivery promo, adapted from
// remotion-motion-graphics/references/customer-journey.md.
import React, { useMemo } from "react";
import { AbsoluteFill, interpolate, random, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { getLength, getPointAtLength } from "@remotion/paths";
import { measureText } from "@remotion/layout-utils";
import { lajuTheme as T, LT, ROUTE_MARK, PIN } from "./theme";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const C = T.colors;

// The one teal light, keyed across the whole video.
export const Glow: React.FC = () => {
  const frame = useCurrentFrame();
  const at = (i: number) => interpolate(frame, LT.glow.map((k) => k[0]), LT.glow.map((k) => k[i]), { ...clamp, easing: T.ease.inOut });
  const size = at(3);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <div
        style={{
          position: "absolute",
          left: at(1) - size / 2 + Math.sin(frame / 40) * 10,
          top: at(2) - size / 2,
          width: size,
          height: size,
          borderRadius: "50%",
          background: `radial-gradient(circle, ${C.heroGlow} 0%, rgba(20,184,166,0.18) 40%, transparent 66%)`,
          filter: "blur(60px)",
          opacity: at(4),
        }}
      />
    </AbsoluteFill>
  );
};

// Sparks thrown off a comet head moving along `d` (all in the path's own units).
export const Sparks: React.FC<{ d: string; start: number; dur: number; count?: number; life?: number; speed?: number }> = ({
  d,
  start,
  dur,
  count = 36,
  life = 14,
  speed = 1,
}) => {
  const frame = useCurrentFrame();
  const len = useMemo(() => getLength(d), [d]);
  const progressAt = (f: number) => interpolate(f, [start, start + dur], [0, 1], { ...clamp, easing: T.ease.inOut });
  return (
    <g>
      {Array.from({ length: count }).map((_, i) => {
        const born = start + random(`b${i}`) * dur;
        const age = frame - born;
        if (age < 0 || age > life) return null;
        const p = getPointAtLength(d, len * progressAt(born)) ?? { x: 0, y: 0 };
        const a = random(`a${i}`) * Math.PI * 2;
        const v = (0.8 + random(`v${i}`) * 2.6) * speed;
        const vx = Math.cos(a) * v;
        const vy = Math.sin(a) * v;
        const x = p.x + vx * age;
        const y = p.y + vy * age + 0.09 * speed * age * age;
        const k = 1 - age / life;
        return (
          <line
            key={i}
            x1={x}
            y1={y}
            x2={x - vx * 1.6}
            y2={y - (vy + 0.18 * speed * age) * 1.6}
            stroke={C.heroHot}
            strokeWidth={1.2 * k + 0.3}
            strokeLinecap="round"
            opacity={k}
          />
        );
      })}
    </g>
  );
};

// The route mark, drawn by a comet: glow, hot core, head, sparks, then the pin pops.
export const RouteMark: React.FC<{ width: number; start: number; dur: number; sparks?: boolean }> = ({ width, start, dur, sparks = true }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const len = useMemo(() => getLength(ROUTE_MARK), []);
  const p = interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: T.ease.inOut });
  const head = getPointAtLength(ROUTE_MARK, len * p) ?? PIN;
  const pin = spring({ frame: frame - start - dur, fps, config: T.spring.bouncy });
  const dash = { strokeDasharray: `${len * p} ${len + 1}` };
  return (
    <svg width={width} height={(width * 120) / 200} viewBox="0 0 200 120" style={{ overflow: "visible" }}>
      <path d={ROUTE_MARK} fill="none" stroke={C.hero} strokeWidth={16} strokeLinecap="round" opacity={0.3} style={{ ...dash, filter: "blur(5px)" }} />
      <path d={ROUTE_MARK} fill="none" stroke={C.hero} strokeWidth={9} strokeLinecap="round" style={dash} />
      <path d={ROUTE_MARK} fill="none" stroke={C.heroHot} strokeWidth={3} strokeLinecap="round" style={dash} />
      {p > 0 && p < 1 && <circle cx={head.x} cy={head.y} r={6} fill="#ECFFFB" style={{ filter: `drop-shadow(0 0 6px ${C.heroHot})` }} />}
      {sparks && <Sparks d={ROUTE_MARK} start={start} dur={dur} />}
      <g transform={`translate(${PIN.x} ${PIN.y}) scale(${pin})`}>
        <circle r={13} fill={C.hero} />
        <circle r={5} fill={C.bg} />
      </g>
    </svg>
  );
};

// Text typed at a fixed rate with a blinking caret.
export const TypeLine: React.FC<{ text: string; start: number; cps: number; style: React.CSSProperties }> = ({ text, start, cps, style }) => {
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

// Cards on a tilted ring around whatever sits at the center of a preserve-3d parent.
export const CardOrbit: React.FC<{ cards: React.ReactNode[]; open: number; spin: number; radius: number }> = ({ cards, open, spin, radius }) => (
  <div style={{ position: "absolute", left: "50%", top: "50%", transformStyle: "preserve-3d" }}>
    {cards.map((card, i) => {
      const a = spin + (i / cards.length) * Math.PI * 2;
      const x = Math.sin(a) * radius * open;
      const z = Math.cos(a) * radius * open;
      const y = (i % 2 ? -1 : 1) * 80 * open;
      const front = (Math.cos(a) + 1) / 2;
      return (
        <div
          key={i}
          style={{
            position: "absolute",
            transform: `translate(-50%, -50%) translate3d(${x}px, ${y}px, ${z}px) rotateY(${Math.sin(a) * 25}deg)`,
            opacity: Math.min(1, open * 3) * (0.45 + 0.55 * front),
            filter: front < 0.4 ? "blur(2px)" : "none",
          }}
        >
          {card}
        </div>
      );
    })}
  </div>
);

// Fills like a press-and-hold, then becomes the confirmation.
export const HoldButton: React.FC<{ label: string; done: string; start: number; hold: number; width?: number }> = ({
  label,
  done,
  start,
  hold,
  width = 560,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fill = interpolate(frame, [start, start + hold], [0, 1], { ...clamp, easing: T.ease.inOut });
  const ok = spring({ frame: frame - start - hold, fps, config: T.spring.snappy });
  return (
    <div
      style={{
        position: "relative",
        width,
        height: 72,
        borderRadius: 36,
        overflow: "hidden",
        background: "rgba(255,255,255,0.06)",
        boxShadow: `0 0 0 2px ${C.hero}, 0 0 ${30 * fill}px ${C.heroGlow}`,
        fontFamily: T.fonts.body,
        fontSize: 26,
        fontWeight: 600,
      }}
    >
      <div style={{ position: "absolute", inset: 0, width: `${fill * 100}%`, background: C.hero, boxShadow: `8px 0 22px ${C.heroHot}`, opacity: 1 - ok }} />
      <div style={{ position: "absolute", inset: 0, display: "grid", placeItems: "center", color: fill > 0.5 ? C.bg : C.text, opacity: 1 - ok }}>{label}</div>
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 14,
          color: C.text,
          opacity: ok,
          scale: interpolate(ok, [0, 1], [0.9, 1]),
        }}
      >
        <svg width={32} height={32} viewBox="0 0 28 28">
          <circle cx={14} cy={14} r={13} fill={C.hero} />
          <path d="M8 14.5 L12.5 19 L20.5 10" stroke="white" strokeWidth={3} fill="none" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={20} strokeDashoffset={20 * (1 - ok)} />
        </svg>
        {done}
      </div>
    </div>
  );
};

// Isometric SVG city, a route drawn street by street, a pin, a camera that lags the pin.
const iso = (x: number, y: number, z = 0) => ({ X: (x - y) * 0.866, Y: (x + y) * 0.5 - z });
const pts = (...p: { X: number; Y: number }[]) => p.map((q) => `${q.X},${q.Y}`).join(" ");

export const IsoCity: React.FC<{ route: readonly (readonly number[])[]; start: number; dur: number }> = ({ route, start, dur }) => {
  const frame = useCurrentFrame();
  const { width: W, height: H } = useVideoConfig();
  const CELL = 120;
  const GAP = 34;
  const S = CELL - GAP;
  const d = "M " + route.map(([gx, gy]) => iso(gx * CELL - GAP / 2, gy * CELL - GAP / 2)).map((p) => `${p.X} ${p.Y}`).join(" L ");
  const len = useMemo(() => getLength(d), [d]);
  const prog = (f: number) => interpolate(f, [start, start + dur], [0, 1], { ...clamp, easing: T.ease.inOut });
  const pin = getPointAtLength(d, len * prog(frame)) ?? { x: 0, y: 0 };
  const cam = getPointAtLength(d, len * prog(frame - 6)) ?? pin;
  const blocks = useMemo(() => {
    const cells: [number, number][] = [];
    for (let gx = 0; gx < 13; gx++) for (let gy = 0; gy < 13; gy++) cells.push([gx, gy]);
    cells.sort((p, q) => p[0] + p[1] - (q[0] + q[1]));
    return cells.map(([gx, gy]) => {
      const h = 20 + random(`h${gx}-${gy}`) * 90;
      const x = gx * CELL;
      const y = gy * CELL;
      const [a, b, c, e] = [iso(x, y, h), iso(x + S, y, h), iso(x + S, y + S, h), iso(x, y + S, h)];
      const [b0, c0, e0] = [iso(x + S, y), iso(x + S, y + S), iso(x, y + S)];
      return (
        <g key={`${gx}-${gy}`}>
          <polygon points={pts(b, c, c0, b0)} fill={C.city.left} />
          <polygon points={pts(e, c, c0, e0)} fill={C.city.right} />
          <polygon points={pts(a, b, c, e)} fill={C.city.top} stroke={C.city.edge} strokeWidth={1} />
        </g>
      );
    });
  }, [S]);
  return (
    <svg width={W} height={H} style={{ background: C.city.ground }}>
      <g transform={`translate(${W / 2 - cam.x}, ${H / 2 + 60 - cam.y})`}>
        {blocks}
        <path d={d} fill="none" stroke={C.hero} strokeWidth={14} strokeLinecap="round" strokeLinejoin="round" opacity={0.35} strokeDasharray={`${len * prog(frame)} ${len}`} style={{ filter: "blur(6px)" }} />
        <path d={d} fill="none" stroke={C.heroHot} strokeWidth={6} strokeLinecap="round" strokeLinejoin="round" strokeDasharray={`${len * prog(frame)} ${len}`} />
        <g transform={`translate(${pin.x} ${pin.y - 22})`} style={{ filter: `drop-shadow(0 0 14px ${C.hero})` }}>
          <path d="M 0 22 C -6 12, -16 6, -16 -4 A 16 16 0 1 1 16 -4 C 16 6, 6 12, 0 22 Z" fill={C.hero} />
          <circle r={6} cy={-4} fill={C.bg} />
        </g>
      </g>
    </svg>
  );
};

// Tracker card: four steps filling with the route's progress.
export const Tracker: React.FC<{ progress: number }> = ({ progress }) => {
  const steps = ["Dipesan", "Dihantar", "Dalam perjalanan", "Sampai"];
  return (
    <div style={{ width: 520, padding: "22px 26px", borderRadius: 22, background: "rgba(17,23,25,0.88)", boxShadow: `0 0 0 1px ${C.line}, 0 20px 60px rgba(0,0,0,0.5)`, fontFamily: T.fonts.body, color: C.text }}>
      <div style={{ fontSize: 28, fontWeight: 700 }}>Sampai hari ini</div>
      <div style={{ fontSize: 17, color: C.dim, marginTop: 4 }}>{progress < 1 ? "Dalam perjalanan ke rumah anda" : "Di depan pintu anda"}</div>
      <div style={{ position: "relative", height: 6, borderRadius: 3, background: "rgba(255,255,255,0.12)", margin: "20px 8px 10px" }}>
        <div style={{ width: `${Math.min(1, 0.34 + progress * 0.66) * 100}%`, height: "100%", borderRadius: 3, background: C.hero, boxShadow: `0 0 10px ${C.hero}` }} />
      </div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14, color: C.dim }}>
        {steps.map((s, i) => (
          <span key={s} style={{ color: 0.34 + progress * 0.66 >= i / 3 - 0.001 ? C.text : C.dim }}>
            {s}
          </span>
        ))}
      </div>
    </div>
  );
};

// Cardboard cube with the route mark drawn on its front face.
export const Box3D: React.FC<{ size: number; rotY: number; rotX?: number; draw: number }> = ({ size: s, rotY, rotX = -16, draw }) => {
  const face = (transform: string, shade: number, children?: React.ReactNode) => (
    <div
      style={{
        position: "absolute",
        width: s,
        height: s,
        transform,
        background: `linear-gradient(160deg, hsl(30 48% ${50 * shade}%), hsl(26 44% ${36 * shade}%))`,
        boxShadow: "inset 0 0 0 1px rgba(0,0,0,0.15)",
      }}
    >
      {children}
    </div>
  );
  return (
    <div style={{ width: s, height: s, perspective: 1400 }}>
      <div style={{ position: "relative", width: s, height: s, transformStyle: "preserve-3d", transform: `rotateX(${rotX}deg) rotateY(${rotY}deg)` }}>
        {face(
          `translateZ(${s / 2}px)`,
          1,
          <svg width={s} height={s} viewBox="-20 -40 240 240">
            <path d={ROUTE_MARK} fill="none" stroke="#14302C" strokeWidth={10} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} />
            <circle cx={PIN.x} cy={PIN.y} r={13 * Math.max(0, (draw - 0.9) * 10)} fill="#14302C" />
          </svg>,
        )}
        {face(`rotateY(90deg) translateZ(${s / 2}px)`, 0.78)}
        {face(`rotateY(180deg) translateZ(${s / 2}px)`, 0.7)}
        {face(`rotateY(-90deg) translateZ(${s / 2}px)`, 0.84)}
        {face(
          `rotateX(90deg) translateZ(${s / 2}px)`,
          1.12,
          <div style={{ position: "absolute", left: "44%", width: "12%", height: "100%", background: "rgba(20,184,166,0.55)" }} />,
        )}
        {face(`rotateX(-90deg) translateZ(${s / 2}px)`, 0.5)}
      </div>
    </div>
  );
};

// A bright band sliding across the glyphs.
export const Sweep: React.FC<{ text: string; start: number; dur: number; style: React.CSSProperties }> = ({ text, start, dur, style }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + dur], [-20, 120], { ...clamp, easing: T.ease.inOut });
  return (
    <span
      style={{
        ...style,
        color: "transparent",
        WebkitBackgroundClip: "text",
        backgroundClip: "text",
        backgroundImage: `linear-gradient(100deg, ${C.text} 0%, ${C.text} ${p - 14}%, ${C.heroHot} ${p}%, ${C.text} ${p + 14}%, ${C.text} 100%)`,
      }}
    >
      {text}
    </span>
  );
};

// An arrow drawn from one letter of a line to another.
export const LetterArrow: React.FC<{ text: string; from: number; to: number; size: number; draw: number }> = ({ text, from, to, size, draw }) => {
  const font = T.fonts.display;
  const w = (s: string) => measureText({ text: s, fontFamily: font, fontSize: size, fontWeight: 700 }).width;
  const cx = (i: number) => w(text.slice(0, i)) + w(text[i]) / 2;
  const x0 = cx(from);
  const x1 = cx(to);
  const y = size * 1.12;
  const sag = size * 0.4;
  const d = `M ${x0} ${y} Q ${(x0 + x1) / 2} ${y + sag} ${x1} ${y} M ${x1 - 16} ${y - 10} L ${x1} ${y} L ${x1 - 19} ${y + 7}`;
  return (
    <div style={{ position: "relative", fontFamily: font, fontSize: size, fontWeight: 700, color: C.text, whiteSpace: "pre", lineHeight: 1.1 }}>
      {text}
      <svg style={{ position: "absolute", left: 0, top: 0, overflow: "visible" }} width={1} height={1}>
        <path d={d} fill="none" stroke={C.hero} strokeWidth={size * 0.075} strokeLinecap="round" strokeLinejoin="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - draw} style={{ filter: `drop-shadow(0 0 8px ${C.hero})` }} />
      </svg>
    </div>
  );
};
