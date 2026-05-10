import { AbsoluteFill, interpolate, useCurrentFrame } from "remotion";
import { PhoneFrame } from "../components/PhoneFrame";
import {
  getSimulatorSnapshot,
  getScriptById,
  getScriptDurationInFrames,
} from "../data/scripts";

export type FlooentlyMessageVideoProps = {
  scriptId: string;
};

export const FlooentlyMessageVideo = ({
  scriptId,
}: FlooentlyMessageVideoProps) => {
  const frame = useCurrentFrame();
  const script = getScriptById(scriptId);
  const simulator = getSimulatorSnapshot(script, frame);
  const durationInFrames = getScriptDurationInFrames(script);

  return (
    <AbsoluteFill className="video-root exact-simulator-root">
      <PhoneFrame
        script={script}
        simulator={simulator}
        durationInFrames={durationInFrames}
      />
      <HookCaption hook={script.hook} frame={frame} />
    </AbsoluteFill>
  );
};

type HookCaptionProps = {
  hook: string;
  frame: number;
};

const HookCaption = ({ hook, frame }: HookCaptionProps) => {
  const opacity = interpolate(frame, [0, 8, 44, 54], [0, 1, 1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const translateY = interpolate(frame, [0, 10], [12, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      className="hook-caption"
      style={{ opacity, transform: `translate(-50%, ${translateY}px)` }}
    >
      {hook}
    </div>
  );
};
