// "kedai" — a 23.5s app-launch promo for an invented Malaysian shop app, built
// from remotion-motion-graphics/references/product-promo.md. Every shot and
// sound event is placed by timing.json, which scripts/gen-kedai.mjs also reads.
// Finishing: real camera motion blur and a bloom pass over the content, and a
// gTTS Bahasa Melayu voice-over (scripts/kedai/gen-vo.py) the music ducks under.
import React from "react";
import { AbsoluteFill, Audio, Sequence, staticFile } from "remotion";
import { CameraMotionBlur } from "@remotion/motion-blur";
import { kedaiTheme as K, T, ShotName } from "./theme";
import { Bloom, Shot, Spotlight } from "./kit";
import VO from "./vo-durations.json";
import { Grain, Vignette } from "../components/Layers";
import { Device } from "./scenes/Device";
import { Products } from "./scenes/Products";
import { LiveView } from "./scenes/LiveView";
import { Credit, Line1, Line2, Logo, Payoff } from "./scenes/Words";

export const KEDAI_TOTAL_F = T.total;

// scene, then how many frames it blurs in and out over
const SHOTS: [ShotName, React.ReactNode, number, number][] = [
  ["logo", <Logo />, 4, 8],
  ["device", <Device />, 8, 4],
  ["products", <Products />, 4, 8],
  ["live", <LiveView />, 8, 8],
  ["line1", <Line1 />, 2, 8],
  ["line2", <Line2 />, 2, 6],
  ["payoff", <Payoff />, 4, 8],
  ["outro", <Logo disclaimer />, 6, 10],
];
const CREDIT = T.shots.credit;

export const KedaiLaunch: React.FC = () => (
  <AbsoluteFill style={{ background: `radial-gradient(120% 90% at 50% 60%, ${K.colors.bgLift}, ${K.colors.bg} 70%)` }}>
    <Spotlight keys={T.spotlight} />
    <Bloom>
      <CameraMotionBlur samples={6} shutterAngle={180}>
        {SHOTS.map(([name, scene, inF, outF]) => {
          const s = T.shots[name];
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
    {/* the credit carries its own white glow; bloom would band it into rings */}
    <Sequence name="credit" from={CREDIT.from} durationInFrames={CREDIT.dur}>
      <Shot dur={CREDIT.dur} inF={1} outF={1}>
        <Credit />
      </Shot>
    </Sequence>
    <Grain />
    <Vignette />
    <Audio src={staticFile("sfx/kedai-track.wav")} />
    {T.vo.map((v) => (
      <Sequence key={v.id} name={`VO ${v.id}`} from={v.at} durationInFrames={Math.ceil(VO[v.id as keyof typeof VO] * T.fps) + 2}>
        <Audio src={staticFile(`kedai/vo/${v.id}.wav`)} />
      </Sequence>
    ))}
  </AbsoluteFill>
);
