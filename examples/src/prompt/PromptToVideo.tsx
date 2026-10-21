// "Prompt to Video" — a 15s demo of this skill in the ai-demo style: a prompt is
// typed, Remotion code streams past, the generated logo intro plays in a
// player, a second prompt turns it to night. Built from
// remotion-motion-graphics/references/ai-demo.md; every shot and sound event is
// placed by timing.json, which scripts/gen-prompt.mjs also reads.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { promptTheme as P, PT } from "./theme";
import { Silk } from "./kit";
import { Bloom, Shot } from "../kedai/kit";
import { Grain, Vignette } from "../components/Layers";
import { Code, Intro, Prompt, Sign, WorldShot } from "./scenes/Scenes";

export const PROMPT_TOTAL_F = PT.total;

type ShotName = keyof typeof PT.shots;
// scene, then how many frames it blurs in and out over
const SHOTS: [ShotName, React.ReactNode, number, number][] = [
  ["intro", <Intro />, 2, 8],
  ["prompt", <Prompt />, 6, 8],
  ["code", <Code />, 6, 8],
  ["world", <WorldShot />, 6, 8],
  ["sign", <Sign />, 2, 2],
];

export const PromptToVideo: React.FC = () => (
  <AbsoluteFill style={{ background: P.colors.bg }}>
    <Silk />
    <Bloom>
      <CameraMotionBlur samples={5} shutterAngle={180}>
        {SHOTS.map(([name, scene, inF, outF]) => {
          const s = PT.shots[name];
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
    <Audio src={staticFile("sfx/prompt-track.wav")} />
  </AbsoluteFill>
);
