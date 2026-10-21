import React from "react";
import { AbsoluteFill, Audio, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
import { cameraAt, sceneMove } from "./camera";
import { Grain, Vignette } from "../components/Layers";
import { beatFrame, neon, NEON_TOTAL_BEATS, neonTextStyle, SceneKey, sceneFrames, tube } from "./neonKit";
import { Kinabalu } from "./scenes/Kinabalu";
import { MalaysiaSign } from "./scenes/MalaysiaSign";
import { NasiLemak } from "./scenes/NasiLemak";
import { Wayang } from "./scenes/Wayang";

const C = neon.colors;
const W = 1080;
const H = 1920;

export const NEON_TOTAL_F = beatFrame(NEON_TOTAL_BEATS, neon.timing.fps);

// Script title in neon tubes, place name as a quieter lit caption
const NeonTitle: React.FC<{ scene: SceneKey; f: number; dur: number; fps: number; color: string; top: number }> = ({
  scene,
  f,
  dur,
  fps,
  color,
  top,
}) => {
  const { title, place } = neon.timing.titles[scene];
  const on = beatFrame((neon.timing.ignite[scene] as Record<string, number>).title, fps);
  const b = tube(f, on, dur, 50);
  const pb = tube(f, on + 8, dur, 51);
  return (
    <div style={{ position: "absolute", top, width: W, display: "flex", flexDirection: "column", alignItems: "center", gap: 30 }}>
      <div style={{ fontFamily: neon.fonts.script, fontSize: 112, lineHeight: 1.45, ...neonTextStyle(color, b, 112) }}>{title}</div>
      <div
        style={{
          fontFamily: neon.fonts.sans,
          fontWeight: 600,
          fontSize: 32,
          letterSpacing: "0.42em",
          paddingLeft: "0.42em",
          ...neonTextStyle(C.white, pb * 0.85, 32),
        }}
      >
        {place}
      </div>
    </div>
  );
};

// CRT-style power cut: the picture collapses to a bright line, then dark
const PowerCut: React.FC<{ f: number; dur: number }> = ({ f, dur }) => {
  const k = f - (dur - 4);
  if (k < 0 || k > 4) return null;
  const h = [60, 14, 4, 2, 0][k];
  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div style={{ width: k < 3 ? W : W * 0.3, height: h, background: "#fff", boxShadow: `0 0 40px ${C.cyan}, 0 0 90px ${C.magenta}`, opacity: k < 4 ? 0.9 : 0 }} />
    </AbsoluteFill>
  );
};

const Scanlines: React.FC = () => (
  <AbsoluteFill
    style={{
      pointerEvents: "none",
      backgroundImage: "repeating-linear-gradient(180deg, rgba(0,0,0,0.18) 0px, rgba(0,0,0,0.18) 1px, transparent 2px, transparent 4px)",
      opacity: 0.5,
    }}
  />
);

// Everything inside moves with the camera; overlays outside it stay locked to the screen.
// Big impacts also smear: RGB channels split apart and the frame blurs, scaled by shake energy.
const OVERSCAN = 1.06;
const Camera: React.FC<{ scene: SceneKey; f: number; dur: number; children: React.ReactNode }> = ({ scene, f, dur, children }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const cam = cameraAt(frame, fps);
  const move = sceneMove(scene, f, dur);
  const split = Math.min(14, cam.energy * 0.45);
  const blur = Math.min(3, cam.energy * 0.09);
  const filters = [split > 1 ? "url(#rgb-split)" : "", blur > 0.4 ? `blur(${blur.toFixed(2)}px)` : ""].filter(Boolean).join(" ");
  return (
    <AbsoluteFill
      style={{
        transform: `translate(${move.x + cam.x}px, ${move.y + cam.y}px) rotate(${move.rot + cam.rot}deg) scale(${OVERSCAN * move.scale * (1 + cam.zoom)})`,
        filter: filters || undefined,
      }}
    >
      {split > 1 && (
        <svg width={0} height={0} style={{ position: "absolute" }}>
          <filter id="rgb-split" x="-5%" y="-5%" width="110%" height="110%" colorInterpolationFilters="sRGB">
            <feColorMatrix in="SourceGraphic" type="matrix" values="1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0" result="r" />
            <feOffset in="r" dx={split} dy={split * 0.3} result="ro" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0" result="g" />
            <feColorMatrix in="SourceGraphic" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0" result="b" />
            <feOffset in="b" dx={-split} dy={-split * 0.3} result="bo" />
            <feBlend in="ro" in2="g" mode="screen" result="rg" />
            <feBlend in="rg" in2="bo" mode="screen" />
          </filter>
        </svg>
      )}
      {children}
    </AbsoluteFill>
  );
};

export const MalaysiaNeon: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const S = sceneFrames(fps);
  const local = (k: SceneKey) => frame - S[k].from;
  const active = (k: SceneKey) => frame >= S[k].from && frame < S[k].from + S[k].dur;

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio src={staticFile("sfx/neon-track.wav")} />

      {active("kinabalu") && (
        <>
          <Camera scene="kinabalu" f={local("kinabalu")} dur={S.kinabalu.dur}>
            <Kinabalu f={local("kinabalu")} dur={S.kinabalu.dur} fps={fps} />
            <NeonTitle scene="kinabalu" f={local("kinabalu")} dur={S.kinabalu.dur} fps={fps} color={C.magenta} top={250} />
          </Camera>
          <PowerCut f={local("kinabalu")} dur={S.kinabalu.dur} />
        </>
      )}
      {active("wayang") && (
        <>
          <Camera scene="wayang" f={local("wayang")} dur={S.wayang.dur}>
            <Wayang f={local("wayang")} dur={S.wayang.dur} fps={fps} />
            <NeonTitle scene="wayang" f={local("wayang")} dur={S.wayang.dur} fps={fps} color={C.amber} top={1450} />
          </Camera>
          <PowerCut f={local("wayang")} dur={S.wayang.dur} />
        </>
      )}
      {active("nasi") && (
        <>
          <Camera scene="nasi" f={local("nasi")} dur={S.nasi.dur}>
            <NasiLemak f={local("nasi")} dur={S.nasi.dur} fps={fps} />
            <NeonTitle scene="nasi" f={local("nasi")} dur={S.nasi.dur} fps={fps} color={C.pink} top={300} />
          </Camera>
          <PowerCut f={local("nasi")} dur={S.nasi.dur} />
        </>
      )}
      {active("malaysia") && (
        <>
          <Camera scene="malaysia" f={local("malaysia")} dur={S.malaysia.dur}>
            <MalaysiaSign f={local("malaysia")} dur={S.malaysia.dur} fps={fps} />
          </Camera>
          <PowerCut f={local("malaysia")} dur={S.malaysia.dur} />
        </>
      )}

      <Scanlines />
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};
