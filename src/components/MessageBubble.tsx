import { Easing, interpolate, spring, useVideoConfig } from "remotion";
import type { ThreadBubble } from "../data/scripts";

type MessageBubbleProps = {
  bubble: ThreadBubble;
  durationInFrames: number;
  frame: number;
  hasTail: boolean;
};

export const MessageBubble = ({
  bubble,
  durationInFrames,
  frame,
  hasTail,
}: MessageBubbleProps) => {
  const { fps } = useVideoConfig();
  const localFrame = Math.max(0, frame - bubble.appearFrame);
  const enter = interpolate(localFrame, [0, 10], [0, 1], {
    easing: Easing.bezier(0.16, 1, 0.3, 1),
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const settle = spring({
    fps,
    frame: localFrame,
    config: {
      damping: 14,
      stiffness: 280,
      mass: 0.5,
    },
    durationInFrames: 20,
  });
  const side = bubble.sender === "me" ? "right" : "left";
  const receipt = bubble.showRead ? "Read" : bubble.showDelivered ? "Delivered" : "";
  const scale = interpolate(settle, [0, 1], [0.5, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div className={`message-row ${side}`}>
      <div className={`message-stack ${side}`}>
        <div
          className={`message-bubble ${side} ${hasTail ? "tail" : "no-tail"}`}
          style={{
            opacity: enter,
            transform: `scale(${scale})`,
            transformOrigin:
              side === "right" ? "bottom right" : "bottom left",
          }}
        >
          {bubble.text}
          {hasTail ? (
            <svg
              aria-hidden="true"
              className={`bubble-tail ${side}`}
              viewBox="0 0 17 17"
            >
              <path d="M11.5 10.5C12.0014 13.5086 14.8333 16.3333 16.5 17C10.1 17 6 14.8333 5 13.5L0 15L0.5 0H11V2V4V4.5C11 5.5 11 7.5 11.5 10.5Z" />
            </svg>
          ) : null}
        </div>
        {hasTail && receipt ? (
          <div
            className={`receipt ${side}`}
            style={{
              opacity: interpolate(
                frame,
                [durationInFrames - 36, durationInFrames - 18],
                [0.85, 1],
                { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
              ),
            }}
          >
            {receipt}
          </div>
        ) : null}
      </div>
    </div>
  );
};
