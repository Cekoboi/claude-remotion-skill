// "Gerak 2.0" — a 23s behind-the-build promo for an invented AI motion tool,
// built from remotion-motion-graphics/references/build-reveal.md. Manggis the
// mangosteen builds the title inside the editor, the title becomes a particle
// launch card, then the same intro is generated from a prompt and the app
// shows the live curve and keyframes driving it. Every shot and sound event is
// placed by timing.json, which scripts/gen-gerak.mjs also reads.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { gerakTheme as G, GT } from "./theme";
import { Glow } from "./kit";
import { Bloom, Shot } from "../kedai/kit";
import { Grain, Vignette } from "../components/Layers";
import { AppShot, EndShot, MarkShot, ParticlesShot, PillShot, PromptShot, SetShot } from "./scenes/Scenes";

export const GERAK_TOTAL_F = GT.total;

type ShotName = keyof typeof GT.shots;
// scene, then how many frames it blurs in and out over
const SHOTS: [ShotName, React.ReactNode, number, number][] = [
  ["set", <SetShot />, 2, 4],
  ["particles", <ParticlesShot />, 4, 6],
  ["prompt", <PromptShot />, 6, 2],
  ["pill", <PillShot />, 4, 2],
  ["app", <AppShot />, 2, 6],
  ["mark", <MarkShot />, 6, 6],
  ["end", <EndShot />, 6, 10],
];

export const GerakBuild: React.FC = () => (
  <AbsoluteFill style={{ background: G.colors.bg }}>
    <Glow />
    <Bloom>
      <CameraMotionBlur samples={5} shutterAngle={180}>
        {SHOTS.map(([name, scene, inF, outF]) => {
          const s = GT.shots[name];
          return (
            <Sequence key={name} name={name} from={s.from} durationInFrames={s.dur}>
              <Shot dur={s.dur} inF={inF} outF={outF}>
                {scene}
              </Shot>
            </Sequence>
          );
        })}
      </CameraMotionBlur>
    </Bloom>
    <Grain />
    <Vignette />
    <Audio src={staticFile("sfx/gerak-track.wav")} />
  </AbsoluteFill>
);
