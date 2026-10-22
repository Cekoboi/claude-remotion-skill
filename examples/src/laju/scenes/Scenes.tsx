// The eight shots of the "laju" delivery promo. Frame numbers inside each are
// local to its Sequence; all of them come from timing.json.
import React from "react";
import { AbsoluteFill, interpolate, spring, useCurrentFrame, useVideoConfig } from "remotion";
import { lajuTheme as T, LT } from "../theme";
import { Box3D, CardOrbit, HoldButton, IsoCity, LetterArrow, RouteMark, Sweep, Tracker, TypeLine } from "../kit";
import { Phone } from "../../kedai/kit";

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const C = T.colors;
const center = { alignItems: "center", justifyContent: "center" } as const;

const PRODUCTS = [
  { name: "Kuih Bangkit", price: "RM28.90", tint: 0 },
  { name: "Tart Nanas", price: "RM32.00", tint: 1 },
  { name: "Semperit", price: "RM24.50", tint: 2 },
  { name: "Biskut Mazola", price: "RM22.00", tint: 0 },
  { name: "Kek Lapis", price: "RM45.00", tint: 1 },
  { name: "Dodol Durian", price: "RM18.00", tint: 2 },
];

// A jar of cookies, drawn in theme colors.
const Jar: React.FC<{ size: number; tint?: number }> = ({ size, tint = 0 }) => (
  <svg width={size} height={size} viewBox="0 0 100 100">
    <rect x={30} y={10} width={40} height={14} rx={4} fill={C.hero} />
    <rect x={22} y={22} width={56} height={70} rx={16} fill="rgba(255,255,255,0.18)" stroke="rgba(255,255,255,0.5)" strokeWidth={2} />
    {[
      [38, 46],
      [60, 44],
      [48, 62],
      [36, 76],
      [62, 74],
    ].map(([x, y], i) => (
      <circle key={i} cx={x} cy={y} r={9} fill={C.jar[(i + tint) % 3]} />
    ))}
  </svg>
);

// S01 / S08: the comet draws the route mark, the wordmark unmasks behind its head
export const Logo: React.FC<{ start: number; dur: number; disclaimer?: boolean }> = ({ start, dur, disclaimer }) => {
  const frame = useCurrentFrame();
  const p = interpolate(frame, [start, start + dur], [0, 1], { ...clamp, easing: T.ease.inOut });
  return (
    <AbsoluteFill style={center}>
      <div style={{ marginTop: -80 }}>
        <RouteMark width={460} start={start} dur={dur} />
      </div>
      <div
        style={{
          marginTop: 18,
          fontFamily: T.fonts.display,
          fontSize: 132,
          fontWeight: 700,
          letterSpacing: "-0.03em",
          color: C.text,
          lineHeight: 1,
          clipPath: `inset(-10% ${(1 - p) * 100}% -10% 0)`,
        }}
      >
        laju
      </div>
      {disclaimer && (
        <div style={{ position: "absolute", bottom: 64, fontFamily: T.fonts.body, fontSize: 17, color: C.dim, opacity: interpolate(frame, [LT.outro.disclaimer, LT.outro.disclaimer + 12], [0, 0.85], clamp) }}>
          Contoh rekaan · jenama &ldquo;laju&rdquo; tidak wujud
        </div>
      )}
    </AbsoluteFill>
  );
};

const Screen: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const P = LT.phone;
  const sug = spring({ frame: frame - P.suggest, fps, config: T.spring.snappy });
  const grid = spring({ frame: frame - P.grid, fps, config: T.spring.snappy });
  return (
    <AbsoluteFill style={{ background: C.bg, fontFamily: T.fonts.body, color: C.text, padding: "18px 14px", boxSizing: "border-box" }}>
      <div style={{ fontSize: 13, fontWeight: 600, marginLeft: 8 }}>9:41</div>
      <div
        style={{
          marginTop: 16,
          height: 42,
          borderRadius: 14,
          background: C.panelHi,
          boxShadow: frame >= P.type ? `0 0 0 2px ${C.hero}` : "none",
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "0 12px",
          fontSize: 16,
        }}
      >
        <svg width={16} height={16} viewBox="0 0 16 16">
          <circle cx={7} cy={7} r={5} stroke={C.dim} strokeWidth={2} fill="none" />
          <path d="M11 11 L14 14" stroke={C.dim} strokeWidth={2} strokeLinecap="round" />
        </svg>
        <TypeLine text={P.query} start={P.type} cps={P.cps} style={{}} />
      </div>
      <div style={{ marginTop: 12, opacity: sug * (1 - grid) }}>
        {["kuih raya viral", "kuih raya murah", "kuih bangkit"].map((s) => (
          <div key={s} style={{ padding: "10px 6px", fontSize: 15, color: C.dim, borderBottom: `1px solid ${C.line}` }}>
            {s}
          </div>
        ))}
      </div>
      <div style={{ position: "absolute", left: 14, right: 14, top: 96, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10, opacity: grid }}>
        {PRODUCTS.map((p, i) => (
          <div key={p.name} style={{ borderRadius: 14, background: C.panelHi, padding: 8, scale: interpolate(spring({ frame: frame - P.grid - i * 2, fps, config: T.spring.snappy }), [0, 1], [0.8, 1]) }}>
            <div style={{ display: "grid", placeItems: "center", height: 92, borderRadius: 10, background: "rgba(20,184,166,0.12)" }}>
              <Jar size={70} tint={p.tint} />
            </div>
            <div style={{ fontSize: 12, marginTop: 6 }}>{p.name}</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: C.heroHot }}>{p.price}</div>
          </div>
        ))}
      </div>
    </AbsoluteFill>
  );
};

const OrbitCard: React.FC<{ p: (typeof PRODUCTS)[number] }> = ({ p }) => (
  <div style={{ width: 170, padding: 12, borderRadius: 18, background: C.panelHi, boxShadow: `0 0 0 1px ${C.line}, 0 18px 40px rgba(0,0,0,0.5)`, fontFamily: T.fonts.body, color: C.text }}>
    <div style={{ display: "grid", placeItems: "center", height: 110, borderRadius: 12, background: "rgba(20,184,166,0.14)" }}>
      <Jar size={86} tint={p.tint} />
    </div>
    <div style={{ fontSize: 15, marginTop: 8 }}>{p.name}</div>
    <div style={{ fontSize: 13, color: C.star }}>★★★★★</div>
    <div style={{ fontSize: 16, fontWeight: 700, color: C.heroHot }}>{p.price}</div>
  </div>
);

// S02: phone rises, the search types, results orbit the phone, then a push into one
export const PhoneShot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  const P = LT.phone;
  const rise = spring({ frame: frame - P.rise, fps, config: T.spring.smooth });
  const open = spring({ frame: frame - P.open, fps, config: T.spring.smooth }) * interpolate(frame, [P.close, P.close + 14], [1, 0], { ...clamp, easing: T.ease.inOut });
  // the push accelerates into the tile, like a camera diving in
  const push = interpolate(frame, [P.push, P.push + 16], [0, 1], { ...clamp, easing: T.ease.in });
  // push into the first product tile (screen 280 x 600, tile at its top-left)
  const ox = width / 2 - 140 + 76;
  const oy = height / 2 - 300 + 150;
  return (
    <AbsoluteFill
      style={{
        transformOrigin: `${ox}px ${oy}px`,
        scale: interpolate(push, [0, 1], [1, 6]),
        filter: push > 0.35 ? `blur(${interpolate(push, [0.35, 1], [0, 14])}px)` : "none",
        opacity: interpolate(push, [0.6, 0.95], [1, 0], clamp),
      }}
    >
      <AbsoluteFill style={{ ...center, perspective: 1400, transformStyle: "preserve-3d" }}>
        <div style={{ translate: `0 ${interpolate(rise, [0, 1], [700, 0])}px` }}>
          <Phone rotX={interpolate(rise, [0, 1], [24, 4]) * (1 - push)} rotY={(interpolate(rise, [0, 1], [-22, -3]) + Math.sin(frame / 20) * 1.5) * (1 - push)}>
            <Screen />
          </Phone>
        </div>
        <CardOrbit cards={PRODUCTS.map((p) => <OrbitCard key={p.name} p={p} />)} open={open} spin={frame * 0.05} radius={460} />
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// S03: product page; the buy button fills, becomes the toast; the route whips out
export const ProductShot: React.FC = () => {
  const frame = useCurrentFrame();
  const Q = LT.product;
  const land = interpolate(frame, [0, 12], [1.12, 1], { ...clamp, easing: T.ease.out });
  const whip = interpolate(frame, [Q.whip, Q.whip + 10], [0, 1], { ...clamp, easing: T.ease.inOut });
  const streak = `M -200 820 C 500 640, 1300 980, 2200 420`;
  return (
    <AbsoluteFill style={{ ...center, scale: land }}>
      <div
        style={{
          width: 1320,
          height: 620,
          borderRadius: 34,
          background: C.panel,
          boxShadow: `0 0 0 1px ${C.line}, 0 0 90px rgba(20,184,166,0.18), 0 40px 120px rgba(0,0,0,0.6)`,
          display: "flex",
          overflow: "hidden",
          fontFamily: T.fonts.body,
          color: C.text,
          translate: `${interpolate(whip, [0, 1], [0, -260])}px 0`,
          opacity: 1 - whip,
        }}
      >
        <div style={{ width: 560, display: "grid", placeItems: "center", background: "radial-gradient(circle at 50% 45%, rgba(20,184,166,0.28), rgba(20,184,166,0.04) 70%)" }}>
          <Jar size={360} />
        </div>
        <div style={{ flex: 1, padding: "64px 60px", display: "flex", flexDirection: "column", gap: 14 }}>
          <div style={{ fontSize: 18, color: C.dim }}>Kedai Mak Su · Kuala Terengganu</div>
          <div style={{ fontSize: 50, fontWeight: 700, letterSpacing: "-0.02em" }}>Kuih Bangkit Premium</div>
          <div style={{ fontSize: 20, color: C.star }}>
            ★★★★★ <span style={{ color: C.dim }}>4.9 (2,180)</span>
          </div>
          <div style={{ fontSize: 58, fontWeight: 800, marginTop: 6 }}>RM28.90</div>
          <div style={{ fontSize: 20, color: C.heroHot }}>Penghantaran PERCUMA · Sampai hari ini</div>
          <div style={{ marginTop: 26 }}>
            <HoldButton label="Beli Sekarang" done="Pesanan diterima, terima kasih." start={Q.hold} hold={Q.holdDur} />
          </div>
        </div>
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <path
          d={streak}
          fill="none"
          stroke={C.heroHot}
          strokeWidth={8}
          strokeLinecap="round"
          pathLength={1}
          strokeDasharray={`0.3 1.3`}
          strokeDashoffset={interpolate(whip, [0, 1], [0.3, -1])}
          style={{ filter: `drop-shadow(0 0 14px ${C.hero})` }}
          opacity={whip > 0 && whip < 1 ? 1 : 0}
        />
      </svg>
    </AbsoluteFill>
  );
};

// S04: the city, the route, the tracker
export const CityShot: React.FC = () => {
  const frame = useCurrentFrame();
  const Q = LT.city;
  const progress = interpolate(frame, [Q.start, Q.start + Q.dur], [0, 1], { ...clamp, easing: T.ease.inOut });
  return (
    <AbsoluteFill>
      <IsoCity route={Q.route} start={Q.start} dur={Q.dur} />
      <div style={{ position: "absolute", left: 80, top: 70 }}>
        <Tracker progress={progress} />
      </div>
    </AbsoluteFill>
  );
};

// S05: the pin flashes into a box at the door; a ring draws the mark on it
export const DoorShot: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const D = LT.door;
  const box = spring({ frame: frame - D.box, fps, config: T.spring.bouncy });
  const ring = interpolate(frame, [D.ring, D.ring + 30], [0, 1], { ...clamp, easing: T.ease.inOut });
  const mark = interpolate(frame, [D.mark, D.mark + 22], [0, 1], { ...clamp, easing: T.ease.inOut });
  const flash = interpolate(frame, [0, 3, 12], [0, 1, 0], clamp);
  const note = spring({ frame: frame - D.notify, fps, config: T.spring.snappy });
  return (
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #1C2629 0%, #121A1C 62%, #2B1D12 62%, #3A2716 100%)" }}>
      {/* door frame and floor planks */}
      <div style={{ position: "absolute", left: 1180, top: 90, width: 420, height: 580, border: "14px solid #0E1416", borderBottom: "none", background: "linear-gradient(180deg, #172022, #101719)" }} />
      <div style={{ position: "absolute", left: 0, right: 0, top: "62%", bottom: 0, background: "repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 236px, rgba(0,0,0,0.35) 236px 240px)" }} />
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 55%, rgba(255,190,120,0.12), transparent 45%)" }} />
      {/* contact shadow, box, orbiting ring */}
      <div style={{ position: "absolute", left: 960 - 230, top: 790, width: 460, height: 70, borderRadius: "50%", background: "rgba(0,0,0,0.55)", filter: "blur(18px)", opacity: box }} />
      <div style={{ position: "absolute", left: 960 - 150, top: 470, scale: box }}>
        <Box3D size={300} rotY={-32 + frame * 0.22} draw={mark} />
      </div>
      <svg width={1920} height={1080} style={{ position: "absolute", left: 0, top: 0 }}>
        <ellipse
          cx={960}
          cy={720}
          rx={290}
          ry={74}
          fill="none"
          stroke={C.heroHot}
          strokeWidth={5}
          pathLength={1}
          strokeDasharray={`${ring * 0.7} 1`}
          strokeDashoffset={-frame * 0.02}
          opacity={interpolate(ring, [0, 0.1, 0.85, 1], [0, 1, 1, 0])}
          style={{ filter: `drop-shadow(0 0 12px ${C.hero})` }}
        />
      </svg>
      <AbsoluteFill style={{ background: `radial-gradient(circle at 50% 60%, rgba(94,234,212,${0.9 * flash}), transparent 40%)` }} />
      {/* Delivered notification */}
      <div
        style={{
          position: "absolute",
          left: 960 - 330,
          top: interpolate(note, [0, 1], [-140, 48]),
          width: 660,
          padding: "18px 22px",
          borderRadius: 26,
          background: "rgba(30,38,40,0.92)",
          boxShadow: `0 0 0 1px ${C.line}, 0 20px 60px rgba(0,0,0,0.5)`,
          display: "flex",
          gap: 16,
          alignItems: "center",
          fontFamily: T.fonts.body,
          color: C.text,
        }}
      >
        <div style={{ width: 54, height: 54, borderRadius: 14, background: C.hero, display: "grid", placeItems: "center", flexShrink: 0 }}>
          <svg width={40} height={24} viewBox="0 0 200 120">
            <path d="M 16 96 C 56 96, 64 44, 104 44 S 150 76, 176 32" fill="none" stroke={C.bg} strokeWidth={16} strokeLinecap="round" />
          </svg>
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 20, fontWeight: 700 }}>
            <span>Telah dihantar</span>
            <span style={{ fontSize: 15, fontWeight: 500, color: C.dim }}>sekarang</span>
          </div>
          <div style={{ fontSize: 17, color: "#D5DEDC", marginTop: 3 }}>Bungkusan anda diletak di depan pintu.</div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

// S06: tagline with a light sweep and the route drawn under it
export const Line1: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const L = LT.line1;
  const inn = spring({ frame, fps, config: T.spring.smooth });
  const under = interpolate(frame, [L.under, L.under + 18], [0, 1], { ...clamp, easing: T.ease.inOut });
  return (
    <AbsoluteFill style={center}>
      <div style={{ opacity: inn, translate: `0 ${interpolate(inn, [0, 1], [24, 0])}px` }}>
        <Sweep text="Semua yang anda suka." start={L.sweep} dur={34} style={{ fontFamily: T.fonts.display, fontSize: 84, fontWeight: 700, letterSpacing: "-0.02em" }} />
      </div>
      <svg width={900} height={60} viewBox="0 0 900 60" style={{ marginTop: 18, overflow: "visible" }}>
        <path d="M 40 40 C 260 60, 420 6, 620 30 S 820 30, 860 14" fill="none" stroke={C.hero} strokeWidth={8} strokeLinecap="round" pathLength={1} strokeDasharray={1} strokeDashoffset={1 - under} style={{ filter: `drop-shadow(0 0 8px ${C.hero})` }} />
        <circle cx={860} cy={14} r={12 * Math.max(0, (under - 0.9) * 10)} fill={C.hero} />
      </svg>
    </AbsoluteFill>
  );
};

// S07: the mark's meaning — an arrow from the P of Perlis to the S of Sabah
export const Line2: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const inn = spring({ frame, fps, config: T.spring.smooth });
  const draw = interpolate(frame, [LT.line2.arrow, LT.line2.arrow + 20], [0, 1], { ...clamp, easing: T.ease.inOut });
  return (
    <AbsoluteFill style={center}>
      <div style={{ opacity: inn, translate: `0 ${interpolate(inn, [0, 1], [24, 0])}px` }}>
        <LetterArrow text="Dari Perlis ke Sabah." from={5} to={15} size={92} draw={draw} />
      </div>
    </AbsoluteFill>
  );
};
