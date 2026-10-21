import React from "react";
import { AbsoluteFill, Audio, interpolate, staticFile, useCurrentFrame, useVideoConfig } from "remotion";
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

export const MalaysiaNeon: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const S = sceneFrames(fps);
  const local = (k: SceneKey) => frame - S[k].from;
  const active = (k: SceneKey) => frame >= S[k].from && frame < S[k].from + S[k].dur;
  // each scene glides in a touch as it powers up
  const drift = (k: SceneKey) =>
    interpolate(local(k), [0, S[k].dur], [1.03, 1], { easing: neon.ease.out, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ background: C.bg }}>
      <Audio src={staticFile("sfx/neon-track.wav")} />

      {active("kinabalu") && (
        <AbsoluteFill style={{ transform: `scale(${drift("kinabalu")})` }}>
          <Kinabalu f={local("kinabalu")} dur={S.kinabalu.dur} fps={fps} />
          <NeonTitle scene="kinabalu" f={local("kinabalu")} dur={S.kinabalu.dur} fps={fps} color={C.magenta} top={250} />
          <PowerCut f={local("kinabalu")} dur={S.kinabalu.dur} />
        </AbsoluteFill>
      )}
      {active("wayang") && (
        <AbsoluteFill style={{ transform: `scale(${drift("wayang")})` }}>
          <Wayang f={local("wayang")} dur={S.wayang.dur} fps={fps} />
          <NeonTitle scene="wayang" f={local("wayang")} dur={S.wayang.dur} fps={fps} color={C.amber} top={1450} />
          <PowerCut f={local("wayang")} dur={S.wayang.dur} />
        </AbsoluteFill>
      )}
      {active("nasi") && (
        <AbsoluteFill style={{ transform: `scale(${drift("nasi")})` }}>
          <NasiLemak f={local("nasi")} dur={S.nasi.dur} fps={fps} />
          <NeonTitle scene="nasi" f={local("nasi")} dur={S.nasi.dur} fps={fps} color={C.pink} top={300} />
          <PowerCut f={local("nasi")} dur={S.nasi.dur} />
        </AbsoluteFill>
      )}
      {active("malaysia") && (
        <AbsoluteFill style={{ transform: `scale(${drift("malaysia")})` }}>
          <MalaysiaSign f={local("malaysia")} dur={S.malaysia.dur} fps={fps} />
          <PowerCut f={local("malaysia")} dur={S.malaysia.dur} />
        </AbsoluteFill>
      )}

      <Scanlines />
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};
