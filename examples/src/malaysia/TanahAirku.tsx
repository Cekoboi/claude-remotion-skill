import React from "react";
import { AbsoluteFill, Audio, interpolate, spring, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { Grain, Vignette } from "../components/Layers";
import { BLOOM_CENTER, BungaRaya } from "./scenes/BungaRaya";
import { Jalur } from "./scenes/Jalur";
import { Pantai } from "./scenes/Pantai";
import { Sawah } from "./scenes/Sawah";
import { MOTIF, Wau } from "./Wau";
import { beatFrame, MY_TOTAL_BEATS, myTheme, SceneKey, sceneFrames } from "./theme5";

const T = myTheme;
const W = 1080;
const H = 1920;

export const MY_TOTAL_F = beatFrame(MY_TOTAL_BEATS, T.timing.fps);

const clamp = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;
const lerp = (a: number, b: number, p: number) => a + (b - a) * p;

// Transition windows, all derived from scene boundaries
const transitions = (fps: number) => {
  const S = sceneFrames(fps);
  const whip = { from: S.pantai.from - Math.round(0.3 * fps), to: S.pantai.from + Math.round(0.3 * fps) };
  const zoom = { from: S.bunga.from - Math.round(0.85 * fps), to: S.bunga.from + 2 };
  const iris = { from: S.jalur.from, to: S.jalur.from + Math.round(0.5 * fps) };
  return { S, whip, zoom, iris };
};

// The batik's center flower is 46px; the wau's motif flower is 15px at scale 1.
const ZOOM_END = 8;
const BATIK_START_ZOOM = (MOTIF.flowerR * ZOOM_END) / 46;

// ---------- the wau's flight across every scene ----------
const useKitePose = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { S, whip, zoom } = transitions(fps);
  const bobX = Math.sin(frame / 23) * 18;
  const bobY = Math.sin(frame / 17) * 14;
  const roll = Math.sin(frame / 19) * 6;

  if (frame < zoom.to + 4) {
    const rise = spring({ frame: frame - 4, fps, config: T.spring.soft });
    const drift = interpolate(frame, [S.pantai.from - 20, S.pantai.from + 80], [0, 1], { easing: T.ease.inOut, ...clamp });
    const whipP = interpolate(frame, [whip.from, whip.to], [0, 1], clamp);
    let x = lerp(lerp(620, 560, rise), 540, drift) + bobX * rise;
    let y = lerp(lerp(2200, 760, rise), 700, drift) + bobY * rise;
    let rot = roll + (1 - rise) * -22 + Math.sin(Math.PI * whipP) * -16;
    let scale = 1;
    // zoom into the central motif: motif glides to the bloom center while scaling
    const z = interpolate(frame, [zoom.from, zoom.to], [0, 1], { easing: T.ease.in, ...clamp });
    if (z > 0) {
      scale = Math.pow(ZOOM_END, z);
      const arrive = Math.min(1, z * 1.6);
      const mx = lerp(x, BLOOM_CENTER.x, arrive);
      const my = lerp(y + MOTIF.y, BLOOM_CENTER.y, arrive);
      x = mx;
      y = my - MOTIF.y * scale;
      rot *= 1 - z;
    }
    const opacity = interpolate(frame, [zoom.to - 2, zoom.to + 3], [1, 0], clamp);
    return { x, y, scale, rot, opacity, string: 1 - z };
  }

  const enter = spring({ frame: frame - S.jalur.from - beatFrame(4, fps), fps, config: T.spring.soft });
  return {
    x: lerp(1320, 860, enter) + bobX * 0.5,
    y: lerp(40, 230, enter) + bobY * 0.5,
    scale: 0.5,
    rot: roll + (1 - enter) * 30,
    opacity: enter > 0.001 ? 1 : 0,
    string: 1,
  };
};

const KiteLayer: React.FC = () => {
  const frame = useCurrentFrame();
  const k = useKitePose();
  if (k.opacity <= 0) return null;
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
      <Wau
        x={k.x}
        y={k.y}
        scale={k.scale}
        rot={k.rot}
        frame={frame}
        opacity={k.opacity}
        stringTo={k.string > 0.05 ? { x: k.x - 340 * (k.scale < 0.9 ? -0.8 : 1), y: H + 120 } : undefined}
      />
    </svg>
  );
};

// ---------- titles ----------
const Title: React.FC<{ scene: SceneKey; enter: number; exit: number; top: boolean; hero?: boolean; big?: boolean }> = ({
  scene,
  enter,
  exit,
  top,
  hero,
  big,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { title, place } = T.timing.titles[scene];
  const out = interpolate(frame, [exit - Math.round(fps / 3), exit], [0, 1], { easing: T.ease.in, ...clamp });
  const placeP = spring({ frame: frame - enter - 8, fps, config: T.spring.smooth });
  const rule = spring({ frame: frame - enter - 4, fps, config: T.spring.smooth });
  return (
    <AbsoluteFill
      style={{
        alignItems: "center",
        justifyContent: top ? "flex-start" : "flex-end",
        paddingTop: top ? 300 : 0,
        paddingBottom: top ? 0 : big ? 190 : 330,
        opacity: 1 - out,
        transform: `translateY(${-out * 40}px)`,
      }}
    >
      <div
        style={{
          fontFamily: T.fonts.serif,
          fontStyle: big ? "normal" : "italic",
          fontWeight: big ? 700 : 500,
          fontSize: big ? 176 : 118,
          letterSpacing: "-0.03em",
          lineHeight: 1.0,
          color: T.colors.text,
          textShadow: "0 6px 40px rgba(20,10,30,0.45)",
          display: "flex",
        }}
      >
        {title.split("").map((ch, i) => {
          const p = spring({ frame: frame - enter - i * 1.4, fps, config: T.spring.snappy });
          return (
            <span
              key={i}
              style={{
                display: "inline-block",
                whiteSpace: "pre",
                opacity: p,
                transform: `translateY(${interpolate(p, [0, 1], [56, 0])}px) rotate(${interpolate(p, [0, 1], [6, 0])}deg)`,
                filter: `blur(${(1 - p) * 8}px)`,
              }}
            >
              {ch}
            </span>
          );
        })}
      </div>
      <div style={{ width: 140 * rule, height: 2, background: T.colors.textDim, opacity: 0.7, marginTop: 26, marginBottom: 22 }} />
      <div
        style={{
          fontFamily: T.fonts.sans,
          fontWeight: 600,
          fontSize: big ? 36 : 30,
          letterSpacing: `${interpolate(placeP, [0, 1], [0.15, 0.42])}em`,
          color: hero ? T.colors.hero : T.colors.textDim,
          opacity: placeP,
          transform: `translateY(${interpolate(placeP, [0, 1], [20, 0])}px)`,
          textShadow: hero ? `0 0 40px ${T.colors.hero}55` : "0 4px 24px rgba(20,10,30,0.5)",
          paddingLeft: "0.42em", // balance trailing letter-spacing
        }}
      >
        {place}
      </div>
    </AbsoluteFill>
  );
};

// a few hibiscus petals carried over into the last scene
const DRIFT = [
  { x: 980, d: 6, s: 0.9 },
  { x: 720, d: 20, s: 0.6 },
  { x: 1060, d: 34, s: 0.75 },
  { x: 860, d: 58, s: 0.5 },
  { x: 640, d: 80, s: 0.65 },
];
const DriftingPetals: React.FC<{ f: number }> = ({ f }) => (
  <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
    {DRIFT.map((p, i) => {
      const tt = f - p.d;
      if (tt < 0) return null;
      const x = p.x - tt * 2.6 + Math.sin(tt * 0.06 + i) * 50;
      const y = -80 + tt * 3.6;
      return (
        <g key={i} transform={`translate(${x} ${y}) rotate(${tt * 3 + i * 40}) scale(${p.s * 1.3} ${p.s * 1.3 * (0.45 + 0.55 * Math.abs(Math.sin(tt * 0.08 + i)))})`}>
          <path d="M 0 0 C -14 -8 -24 -28 -15 -44 C -8 -54 8 -54 15 -44 C 24 -28 14 -8 0 0 Z" fill={T.bunga.petal} />
          <path d="M 0 0 C -5 -4 -7 -10 -5 -16 C -2 -18 2 -18 5 -16 C 7 -10 5 -4 0 0 Z" fill={T.bunga.petalDark} />
        </g>
      );
    })}
  </svg>
);

const Grade: React.FC = () => (
  <AbsoluteFill style={{ pointerEvents: "none" }}>
    <AbsoluteFill style={{ background: "linear-gradient(180deg, #FFB070, #7A4AA0)", mixBlendMode: "soft-light", opacity: 0.12 }} />
    <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.12), transparent 22%, transparent 72%, rgba(0,0,0,0.28))" }} />
  </AbsoluteFill>
);

export const TanahAirku: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const { S, whip, zoom, iris } = transitions(fps);
  const beat = (n: number) => beatFrame(n, fps);

  // whip-pan: both worlds ride one vertical strip; the wau stays put
  const whipP = interpolate(frame, [whip.from, whip.to], [0, 1], { easing: T.ease.inOut, ...clamp });
  const whipBlur = Math.sin(Math.PI * whipP) * 28;
  const zoomFade = interpolate(frame, [zoom.to - 6, zoom.to + 1], [0, 1], { easing: T.ease.inOut, ...clamp });
  const batikZoom = interpolate(frame - S.bunga.from, [0, Math.round(1.8 * fps)], [BATIK_START_ZOOM, 1], { easing: T.ease.out, ...clamp });
  const irisR = interpolate(frame, [iris.from, iris.to], [0, 1300], { easing: T.ease.out, ...clamp });
  const toBlack = interpolate(frame, [S.total - Math.round(0.4 * fps), S.total - 1], [0, 1], { easing: T.ease.in, ...clamp });

  return (
    <AbsoluteFill style={{ background: T.colors.ink }}>
      <Audio src={staticFile("sfx/my-track.wav")} />

      {/* layers 1–2: painted worlds */}
      {frame < whip.to && (
        <AbsoluteFill style={{ transform: `translateY(${whipP * H}px)`, filter: whipBlur > 0.5 ? `blur(${whipBlur}px)` : undefined }}>
          <Sawah f={frame - S.sawah.from} dur={S.sawah.dur} fps={fps} />
        </AbsoluteFill>
      )}
      {frame >= whip.from && frame < zoom.to + 2 && (
        <AbsoluteFill style={{ transform: `translateY(${(whipP - 1) * H}px)`, filter: whipBlur > 0.5 ? `blur(${whipBlur}px)` : undefined }}>
          <Pantai f={frame - S.pantai.from} dur={S.pantai.dur} fps={fps} />
        </AbsoluteFill>
      )}
      {frame >= zoom.to - 6 && frame < S.jalur.from && (
        <AbsoluteFill style={{ opacity: zoomFade }}>
          <BungaRaya f={frame - S.bunga.from} dur={S.bunga.dur} fps={fps} zoomIn={batikZoom} />
        </AbsoluteFill>
      )}
      {frame >= S.jalur.from && (
        <AbsoluteFill>
          <Jalur f={frame - S.jalur.from} dur={S.jalur.dur} fps={fps} />
          <DriftingPetals f={frame - S.jalur.from - beat(1)} />
        </AbsoluteFill>
      )}

      <KiteLayer />

      {/* bunga raya -> jalur: the bloom's crimson heart opens like an iris */}
      {frame >= S.jalur.from && frame < iris.to && (
        <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ position: "absolute" }}>
          <path d={`M 0 0 H ${W} V ${H} H 0 Z M ${540 - irisR} 900 a ${irisR} ${irisR} 0 1 0 ${irisR * 2} 0 a ${irisR} ${irisR} 0 1 0 ${-irisR * 2} 0 Z`} fill={T.bunga.petalDark} fillRule="evenodd" />
        </svg>
      )}

      {/* layer 3: type */}
      {frame < whip.from && <Title scene="sawah" enter={S.sawah.from + beat(1)} exit={whip.from} top />}
      {frame >= S.pantai.from && frame < zoom.from && <Title scene="pantai" enter={S.pantai.from + beat(1)} exit={zoom.from} top />}
      {frame >= S.bunga.from && frame < S.jalur.from && (
        <Title scene="bunga" enter={S.bunga.from + beat(3)} exit={S.jalur.from - Math.round(0.6 * fps)} top={false} />
      )}
      {frame >= S.jalur.from && <Title scene="jalur" enter={S.jalur.from + beat(2)} exit={S.total + fps} top={false} hero big />}

      {/* layers 4–5 */}
      <Grade />
      <Grain />
      <Vignette />
      <AbsoluteFill style={{ background: "#000", opacity: toBlack }} />
    </AbsoluteFill>
  );
};
