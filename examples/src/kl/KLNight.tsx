import React from "react";
import {
  AbsoluteFill,
  Audio,
  continueRender,
  delayRender,
  interpolate,
  interpolateColors,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { Grain, Vignette } from "../components/Layers";
import { burstPunch, FireworkFlashes, Fireworks } from "./Fireworks";
import { GROUND, STARS, W } from "./skyline";
import { litWindowCount, ramp, Skyline } from "./Skyline";
import { beatFrame, KL_TOTAL_BEATS, klTheme, sceneFrames } from "./theme3";

const C = klTheme.colors;
const F = klTheme.fonts;
const H = 1920;

export const KL_TOTAL_F = beatFrame(KL_TOTAL_BEATS, klTheme.timing.fps);

// Self-hosted fonts (public/fonts) — no CDN fetch at render time
const FONT_FILES: [string, string][] = [
  [F.display, "fonts/Unbounded.woff2"],
  [F.body, "fonts/Inter.woff2"],
  [F.mono, "fonts/JetBrainsMono.woff2"],
];
// Called once at module scope from Root, like @remotion/google-fonts' loadFont()
export const loadKLFonts = () => {
  if (typeof document === "undefined") return;
  const handle = delayRender("KL fonts");
  Promise.all(
    FONT_FILES.map(([family, file]) => {
      const face = new FontFace(family, `url(${staticFile(file)}) format("woff2")`, {
        weight: "100 900",
      });
      document.fonts.add(face);
      return face.load();
    }),
  ).then(() => continueRender(handle));
};

// ---------- small motion helpers ----------
const useSpring = (delay: number, config = klTheme.spring.smooth) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return spring({ frame: frame - delay, fps, config });
};

// exit is ~1/2 the length of an entrance and uses the ease-in curve
const exitAt = (frame: number, end: number, fps: number) => {
  const len = Math.round(fps / 3);
  return interpolate(frame, [end - len, end], [0, 1], {
    easing: klTheme.ease.in,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
};

const Rise: React.FC<{
  delay: number;
  exit: number;
  children: React.ReactNode;
  style?: React.CSSProperties;
  config?: typeof klTheme.spring.smooth;
}> = ({ delay, exit, children, style, config }) => {
  const p = useSpring(delay, config);
  return (
    <div
      style={{
        opacity: p * (1 - exit),
        transform: `translateY(${interpolate(p, [0, 1], [36, 0]) - exit * 40}px) scale(${interpolate(p, [0, 1], [0.94, 1])})`,
        ...style,
      }}
    >
      {children}
    </div>
  );
};

const Words: React.FC<{
  text: string;
  delay: number;
  exit: number;
  hero?: string;
  per?: number;
  style?: React.CSSProperties;
}> = ({ text, delay, exit, hero, per = 4, style }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: 22, ...style }}>
      {text.split(" ").map((w, i) => {
        const p = spring({ frame: frame - delay - i * per, fps, config: klTheme.spring.snappy });
        const isHero = w === hero;
        return (
          <span
            key={i}
            style={{
              display: "inline-block",
              opacity: p * (1 - exit),
              transform: `translateY(${interpolate(p, [0, 1], [34, 0]) - exit * 36}px) rotate(${interpolate(p, [0, 1], [4, 0])}deg)`,
              color: isHero ? C.hero : undefined,
              textShadow: isHero ? `0 0 50px ${C.hero}66, 0 0 110px ${C.hero}33` : undefined,
            }}
          >
            {w}
          </span>
        );
      })}
    </div>
  );
};

// ---------- scene layers ----------
const HookBg: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: C.night }}>
      <div
        style={{
          position: "absolute",
          width: 1300,
          height: 1300,
          left: -400 + Math.sin(frame / 40) * 40,
          top: 200,
          borderRadius: "50%",
          filter: "blur(70px)",
          background: `radial-gradient(circle, ${C.nightHorizon}, transparent 65%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          width: 1000,
          height: 1000,
          right: -380,
          bottom: 120 + Math.cos(frame / 50) * 40,
          borderRadius: "50%",
          filter: "blur(80px)",
          background: `radial-gradient(circle, ${C.duskTop}, transparent 65%)`,
        }}
      />
    </AbsoluteFill>
  );
};

const Hook: React.FC<{ end: number }> = ({ end }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { text, startFrame, perChar } = klTheme.timing.type;
  const typed = Math.max(0, Math.min(text.length, Math.floor((frame - startFrame) / perChar) + 1));
  const typingDone = startFrame + text.length * perChar;
  const cursorOn = frame < typingDone || Math.floor(frame / 8) % 2 === 0;
  const exit = exitAt(frame, end, fps);
  const codeIn = useSpring(0, klTheme.spring.snappy);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 56 }}>
      <div
        style={{
          fontFamily: F.mono,
          fontSize: 62,
          fontWeight: 600,
          color: C.text,
          letterSpacing: "-0.02em",
          opacity: codeIn * (1 - exit),
          transform: `translateY(${interpolate(codeIn, [0, 1], [24, 0]) - exit * 50}px) scale(${interpolate(codeIn, [0, 1], [0.96, 1])})`,
          padding: "22px 34px",
          borderRadius: 20,
          background: `${C.steelDark}cc`,
          border: `2px solid ${C.steel}33`,
        }}
      >
        <span style={{ color: C.textDim }}>{text.slice(0, Math.min(typed, 1))}</span>
        <span>{text.slice(1, Math.min(typed, text.length - 3))}</span>
        <span style={{ color: C.textDim }}>{text.slice(text.length - 3, typed)}</span>
        <span style={{ display: "inline-block", width: 30, height: 62, marginLeft: 4, verticalAlign: "-10px", background: C.accent, opacity: cursorOn ? 1 : 0 }} />
      </div>
      <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 92, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.05, textAlign: "center" }}>
        <Words text="Satu bandar." delay={typingDone + 2} exit={exit} />
        <Words text="Sifar gambar." hero="Sifar" delay={typingDone + 10} exit={exit} style={{ marginTop: 18 }} />
      </div>
    </AbsoluteFill>
  );
};

const LowerThird: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <AbsoluteFill style={{ justifyContent: "flex-end", alignItems: "center", paddingBottom: 300 }}>{children}</AbsoluteFill>
);

const BuildCaption: React.FC<{ from: number; dur: number }> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = exitAt(frame, from + dur, fps);
  const tS = (frame - from) / fps;
  const lit = litWindowCount(tS);
  return (
    <LowerThird>
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 26 }}>
        <Rise delay={from + Math.round(0.3 * fps)} exit={exit}>
          <div style={{ fontFamily: F.mono, fontSize: 38, color: C.accent, letterSpacing: "0.01em" }}>
            {"// dilukis baris demi baris"}
          </div>
        </Rise>
        <Rise delay={from + Math.round(2.3 * fps)} exit={exit} config={klTheme.spring.bouncy}>
          <div
            style={{
              display: "flex",
              alignItems: "baseline",
              gap: 22,
              padding: "20px 40px",
              borderRadius: 999,
              background: `${C.night}b3`,
              border: `2px solid ${C.steel}33`,
            }}
          >
            <span
              style={{
                fontFamily: F.display,
                fontWeight: 800,
                fontSize: 76,
                color: C.hero,
                fontVariantNumeric: "tabular-nums",
                textShadow: `0 0 40px ${C.hero}55`,
                minWidth: 220,
                textAlign: "right",
              }}
            >
              {lit.toLocaleString("en-US")}
            </span>
            <span style={{ fontFamily: F.body, fontWeight: 500, fontSize: 36, color: C.textDim }}>tingkap menyala</span>
          </div>
        </Rise>
      </div>
    </LowerThird>
  );
};

const NightCaption: React.FC<{ from: number; dur: number }> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const exit = exitAt(frame, from + dur, fps);
  return (
    <LowerThird>
      <div style={{ fontFamily: F.display, fontWeight: 800, fontSize: 84, color: C.text, letterSpacing: "-0.03em", lineHeight: 1.08, textAlign: "center" }}>
        <Words text="Malam ini," delay={from + Math.round(0.35 * fps)} exit={exit} />
        <Words text="kod jadi sinema." hero="sinema." delay={from + Math.round(1.2 * fps)} exit={exit} style={{ marginTop: 14 }} />
      </div>
    </LowerThird>
  );
};

const ZERO_ROWS = ["gambar", "klip video", "sampel audio"];

const Outro: React.FC<{ from: number; dur: number }> = ({ from, dur }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const fpb = (fps * 60) / klTheme.timing.bpm;
  const swap = from + Math.round(3 * fpb); // beat 29: zeros out, "100% kod." in
  const credit = from + Math.round(5 * fpb);
  const rowsExit = exitAt(frame, swap + 2, fps);
  const finalExit = exitAt(frame, from + dur, fps);
  const big = useSpring(swap, klTheme.spring.bouncy);
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      {frame < swap + 4 && (
        <div style={{ display: "flex", flexDirection: "column", gap: 18, alignItems: "flex-start" }}>
          {ZERO_ROWS.map((label, i) => (
            <Rise key={label} delay={from + 2 + i * 5} exit={rowsExit} config={klTheme.spring.snappy}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 28 }}>
                <span style={{ fontFamily: F.display, fontWeight: 800, fontSize: 112, color: C.text, width: 90 }}>0</span>
                <span style={{ fontFamily: F.body, fontWeight: 500, fontSize: 52, color: C.textDim }}>{label}</span>
              </div>
            </Rise>
          ))}
        </div>
      )}
      {frame >= swap - 1 && (
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 40 }}>
          <div
            style={{
              fontFamily: F.display,
              fontWeight: 900,
              fontSize: 132,
              letterSpacing: "-0.04em",
              color: C.text,
              opacity: big * (1 - finalExit),
              transform: `scale(${interpolate(big, [0, 1], [0.7, 1]) - finalExit * 0.06}) translateY(${-finalExit * 30}px)`,
            }}
          >
            <span style={{ color: C.hero, textShadow: `0 0 60px ${C.hero}66, 0 0 130px ${C.hero}33` }}>100%</span> kod.
          </div>
          <Rise delay={credit} exit={finalExit}>
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <div style={{ fontFamily: F.body, fontWeight: 500, fontSize: 40, color: C.text }}>Ditulis oleh Claude, dirender oleh Remotion</div>
              <div style={{ fontFamily: F.mono, fontSize: 30, color: C.accent }}>remotion-motion-graphics skill</div>
            </div>
          </Rise>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ---------- the city: sky, fireworks, skyline, water reflection ----------
const City: React.FC<{ tS: number; frame: number }> = ({ tS, frame }) => {
  const { fps } = useVideoConfig();
  const night = ramp(tS, 0, 6.8, klTheme.ease.inOut);
  const skyTop = interpolateColors(night, [0, 1], [C.duskTop, C.night]);
  const skyLow = interpolateColors(night, [0, 1], [C.duskHorizon, C.nightHorizon]);
  const stars = ramp(tS, 3.5, 6.5);
  const moon = ramp(tS, 4.0, 6.0);
  // water ripple: turbulence frequency drifts slowly so reflections wobble
  const ripple = 0.045 + 0.006 * Math.sin(frame * 0.08);
  const scene = (
    <>
      <FireworkFlashes frame={frame} fps={fps} />
      <Fireworks frame={frame} fps={fps} />
      <Skyline tS={tS} frame={frame} />
    </>
  );
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <defs>
        <linearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={skyTop} />
          <stop offset="100%" stopColor={skyLow} />
        </linearGradient>
        <linearGradient id="towerSkin" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor={C.steelDark} />
          <stop offset="50%" stopColor="#2C3766" />
          <stop offset="100%" stopColor={C.steelDark} />
        </linearGradient>
        <linearGradient id="water" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={interpolateColors(night, [0, 1], ["#2A1F3F", C.nightHorizon])} />
          <stop offset="100%" stopColor={C.water} />
        </linearGradient>
        <linearGradient id="reflFade" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#fff" stopOpacity={0.55} />
          <stop offset="70%" stopColor="#fff" stopOpacity={0.08} />
          <stop offset="100%" stopColor="#fff" stopOpacity={0} />
        </linearGradient>
        <mask id="reflMask">
          <rect x={0} y={GROUND} width={W} height={H - GROUND} fill="url(#reflFade)" />
        </mask>
        <radialGradient id="moonGlow">
          <stop offset="0%" stopColor={C.towerLight} stopOpacity={0.22} />
          <stop offset="100%" stopColor={C.towerLight} stopOpacity={0} />
        </radialGradient>
        <filter id="fwGlow" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur stdDeviation="10" result="b" />
          <feMerge>
            <feMergeNode in="b" />
            <feMergeNode in="b" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
        </filter>
        <filter id="ripple" x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency={`0.004 ${ripple}`} numOctaves={2} seed={3} />
          <feDisplacementMap in="SourceGraphic" scale={26} xChannelSelector="R" yChannelSelector="G" />
          <feGaussianBlur stdDeviation="1.4" />
        </filter>
        <mask id="moonMask">
          <circle cx={860} cy={240} r={54} fill="#fff" />
          <circle cx={884} cy={226} r={50} fill="#000" />
        </mask>
      </defs>

      <rect x={0} y={0} width={W} height={GROUND} fill="url(#sky)" />
      {STARS.map((s, i) => (
        <circle
          key={i}
          cx={s.x}
          cy={s.y}
          r={s.s}
          fill={C.text}
          opacity={stars * ramp(tS, 3.5 + s.t * 2, 4 + s.t * 2) * (0.45 + 0.55 * (0.5 + 0.5 * Math.sin(frame * 0.11 + s.phase)))}
        />
      ))}
      <g opacity={moon} transform={`translate(0 ${(1 - moon) * 30})`}>
        <circle cx={860} cy={240} r={170} fill="url(#moonGlow)" opacity={0.85 + 0.15 * Math.sin(frame * 0.05)} />
        <rect x={780} y={160} width={160} height={160} fill={C.towerLight} mask="url(#moonMask)" />
      </g>

      {scene}

      {/* water + mirrored city */}
      <rect x={0} y={GROUND} width={W} height={H - GROUND} fill="url(#water)" />
      <g mask="url(#reflMask)">
        <g filter="url(#ripple)">
          <g transform={`translate(0 ${2 * GROUND}) scale(1 -1)`}>{scene}</g>
        </g>
      </g>
      <line x1={0} x2={W} y1={GROUND} y2={GROUND} stroke={C.steel} strokeOpacity={0.35} strokeWidth={2} />
    </svg>
  );
};

// Layer 4 — warm/cool split grade, above content, below grain
const KLGrade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ background: `linear-gradient(180deg, ${C.accent}, ${C.hero})`, mixBlendMode: "soft-light", opacity: 0.12 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.18), transparent 25%, transparent 70%, rgba(0,0,0,0.35))" }} />
  </AbsoluteFill>
);

export const KLNight: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const S = sceneFrames(fps);
  const tS = (frame - S.build.from) / fps;

  // camera: slow push-out through the build, gentle drift at night, punch on bursts
  const buildZoom = interpolate(tS, [0, S.build.dur / fps], [1.14, 1], {
    easing: klTheme.ease.inOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const nightDrift = interpolate(frame, [S.night.from, S.total], [1, 0.95], {
    easing: klTheme.ease.inOut,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const cam = buildZoom * nightDrift + burstPunch(frame, fps);
  const camY = Math.sin(frame / 45) * 6;

  // iris reveal from the hook into the city
  const iris = interpolate(frame, [S.build.from - 2, S.build.from + Math.round(0.55 * fps)], [0, 1], {
    easing: klTheme.ease.out,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const dim = interpolate(frame, [S.outro.from, S.outro.from + Math.round(0.4 * fps)], [0, 0.58], {
    easing: klTheme.ease.out,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const toBlack = interpolate(frame, [S.total - Math.round(0.3 * fps), S.total - 1], [0, 1], {
    easing: klTheme.ease.in,
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ background: C.night }}>
      <Audio src={staticFile("sfx/kl-track.wav")} />

      {/* layer 1: background mesh (hook) */}
      {frame < S.build.from + fps && <HookBg />}

      {/* layer 2: the city — the "asset" layer, drawn entirely in SVG */}
      {iris > 0 && (
        <AbsoluteFill
          style={{
            clipPath: iris < 1 ? `circle(${iris * 1250}px at 540px 900px)` : undefined,
            transform: `translateY(${camY}px) scale(${cam})`,
            transformOrigin: "540px 1000px",
          }}
        >
          <City tS={tS} frame={frame} />
        </AbsoluteFill>
      )}
      <AbsoluteFill style={{ background: C.night, opacity: dim }} />

      {/* layer 3: type */}
      {frame < S.build.from && <Hook end={S.build.from} />}
      {frame >= S.build.from && frame < S.night.from && <BuildCaption from={S.build.from} dur={S.build.dur} />}
      {frame >= S.night.from && frame < S.outro.from && <NightCaption from={S.night.from} dur={S.night.dur} />}
      {frame >= S.outro.from && <Outro from={S.outro.from} dur={S.outro.dur} />}

      {/* layers 4–5: grade, grain, vignette */}
      <KLGrade />
      <Grain />
      <Vignette />
      <AbsoluteFill style={{ background: "#000", opacity: toBlack }} />
    </AbsoluteFill>
  );
};
