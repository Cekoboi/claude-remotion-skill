import React from "react";
import { AbsoluteFill, Audio, interpolate, Sequence, staticFile, useCurrentFrame } from "remotion";
import { Grain, Vignette } from "../components/Layers";
import { Banding } from "./scenes/Banding";
import { Ending } from "./scenes/Ending";
import { Gaji } from "./scenes/Gaji";
import { Hook } from "./scenes/Hook";
import { Sendiri } from "./scenes/Sendiri";
import { bf, EASE, SceneId, T, TOTAL_FRAMES } from "./theme";
import { Captions, Particles } from "./ui";

export const KERJA_TOTAL_F = TOTAL_FRAMES;

const W = 1080;
const WHIP = 8; // frames each side of the cut; the cut itself sits on the bar line

const SCENES: Record<SceneId, React.FC> = { hook: Hook, gaji: Gaji, sendiri: Sendiri, banding: Banding, ending: Ending };

// whip-pan: both scenes ride one horizontal strip through the cut
const whip = (frame: number, cut: number) =>
  interpolate(frame, [cut - WHIP, cut + WHIP], [0, 1], { easing: EASE.inOut, extrapolateLeft: "clamp", extrapolateRight: "clamp" });

// music ducks under every VO phrase, with short ramps
const musicVolume = (f: number) => {
  let duck = 0;
  for (const p of T.phrases) {
    const a = bf(p.beat);
    const b = bf(p.endBeat);
    duck = Math.max(duck, interpolate(f, [a - 6, a, b + 2, b + 10], [0, 1, 1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }));
  }
  return 0.8 - duck * 0.5;
};

export const KerjaVideo: React.FC = () => {
  const frame = useCurrentFrame();
  return (
    <AbsoluteFill style={{ background: "#060F2E" }}>
      <Audio src={staticFile("kerja/music.wav")} volume={musicVolume} />
      <Audio src={staticFile("kerja/sfx.wav")} volume={0.7} />
      {T.phrases.map((p) => (
        <Sequence key={p.id} from={bf(p.beat)} durationInFrames={bf(p.endBeat - p.beat) + 15} layout="none">
          <Audio src={staticFile(`kerja/vo/${p.id}.wav`)} volume={1} />
        </Sequence>
      ))}

      {T.scenes.map((s, i) => {
        const from = bf(s.from);
        const to = bf(s.from + s.beats);
        const isFirst = i === 0;
        const isLast = i === T.scenes.length - 1;
        if (frame < from - (isFirst ? 0 : WHIP) || frame >= to + (isLast ? 0 : WHIP)) return null;
        // scene i enters from side dir(i) and leaves toward the side opposite
        // the next scene's entry, so both ride one strip; directions alternate
        const dir = (k: number) => (k % 2 ? 1 : -1);
        const inP = isFirst ? 1 : whip(frame, from);
        const outP = isLast ? 0 : whip(frame, to);
        const x = (1 - inP) * W * dir(i) - outP * W * dir(i + 1);
        const speed = Math.max(Math.sin(Math.PI * inP) * (isFirst ? 0 : 1), Math.sin(Math.PI * outP) * (isLast ? 0 : 1));
        const Scene = SCENES[s.id];
        return (
          <AbsoluteFill key={s.id} style={{ transform: `translateX(${x}px)`, filter: speed > 0.05 ? `url(#whip-blur)` : undefined }}>
            <Scene />
          </AbsoluteFill>
        );
      })}
      <svg width={0} height={0} style={{ position: "absolute" }}>
        <filter id="whip-blur" x="-10%" y="0" width="120%" height="100%">
          <feGaussianBlur stdDeviation={`${(() => {
            let s = 0;
            for (const sc of T.scenes.slice(1)) s = Math.max(s, Math.sin(Math.PI * whip(frame, bf(sc.from))));
            return (s * 36).toFixed(2);
          })()} 0`} />
        </filter>
      </svg>

      <Captions scenes={["gaji", "sendiri"]} />
      <Particles />
      <Grain />
      <Vignette />
    </AbsoluteFill>
  );
};
