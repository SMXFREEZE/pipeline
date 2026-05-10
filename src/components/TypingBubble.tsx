import { interpolate, useCurrentFrame } from "remotion";

type TypingBubbleProps = {
  side?: "left" | "right";
};

export const TypingBubble = ({ side = "left" }: TypingBubbleProps) => {
  const frame = useCurrentFrame();

  return (
    <div className={`message-row ${side} typing-row`}>
      <div className={`typing-bubble ${side}`}>
        {[0, 1, 2].map((index) => {
          const phase = (frame - index * 5) % 28;
          const opacity = interpolate(phase, [0, 8, 18, 28], [0.35, 1, 0.45, 0.35], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });
          const translateY = interpolate(phase, [0, 8, 18, 28], [2, -4, 1, 2], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
          });

          return (
            <span
              // The index is stable because the typing indicator always has three dots.
              key={index}
              style={{
                opacity,
                transform: `translateY(${translateY}px)`,
              }}
            />
          );
        })}
        <i className="typing-tail-large" />
        <i className="typing-tail-small" />
      </div>
    </div>
  );
};
