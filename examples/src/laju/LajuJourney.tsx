// "laju" — a 21s delivery promo for an invented Malaysian marketplace, built
// from remotion-motion-graphics/references/customer-journey.md. One shape (a
// route ending in a pin) runs through every act: drawn by a spark comet, as
// the hand-off, on the map, on the box, under both taglines. Every shot and
// sound event is placed by timing.json, which scripts/gen-laju.mjs also reads.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { lajuTheme as T, LT } from "./theme";
import { Glow } from "./kit";
import { Bloom, Shot } from "../kedai/kit";
import { Grain, Vignette } from "../components/Layers";
import { CityShot, DoorShot, Line1, Line2, Logo, PhoneShot, ProductShot } from "./scenes/Scenes";

export const LAJU_TOTAL_F = LT.total;

type ShotName = keyof typeof LT.shots;
// scene, then how many frames it blurs in and out over
const SHOTS: [ShotName, React.ReactNode, number, number][] = [
  ["logo", <Logo start={LT.logo.comet} dur={LT.logo.draw} />, 2, 8],
  ["phone", <PhoneShot />, 8, 4],
  ["product", <ProductShot />, 4, 6],
  ["city", <CityShot />, 6, 6],
  ["door", <DoorShot />, 4, 8],
  ["line1", <Line1 />, 4, 6],
  ["line2", <Line2 />, 4, 6],
  ["outro", <Logo start={LT.outro.comet} dur={LT.outro.draw} disclaimer />, 4, 10],
];

export const LajuJourney: React.FC = () => (
  <AbsoluteFill style={{ background: T.colors.bg }}>
    <Glow />
    <Bloom>
      <CameraMotionBlur samples={5} shutterAngle={180}>
        {SHOTS.map(([name, scene, inF, outF]) => {
          const s = LT.shots[name];
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
    <Audio src={staticFile("sfx/laju-track.wav")} />
  </AbsoluteFill>
);
