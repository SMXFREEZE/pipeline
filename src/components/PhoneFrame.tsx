import { useCurrentFrame } from "remotion";
import {
  isLastThreadBubbleInGroup,
  type SimulatorSnapshot,
  type VideoScript,
} from "../data/scripts";
import { FlooentlyLogo } from "./FlooentlyLogo";
import { FlooentlyToolbar } from "./FlooentlyToolbar";
import { MessageBubble } from "./MessageBubble";
import { StatusBar } from "./StatusBar";
import { TypingBubble } from "./TypingBubble";

type PhoneFrameProps = {
  script: VideoScript;
  simulator: SimulatorSnapshot;
  durationInFrames: number;
};

export const PhoneFrame = ({
  script,
  simulator,
  durationInFrames,
}: PhoneFrameProps) => {
  const frame = useCurrentFrame();

  return (
    <div
      className={[
        "simulator-screen",
        simulator.composeActive ? "compose-active" : "",
        simulator.flooentlyActive ? "flooently-active" : "",
        simulator.flooentlyShowResults ? "result-active" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      <div className="simulator-thread">
        <div className="thread-content">
          {simulator.items.map((item, index) => {
            if (item.type === "timeHeader") {
              return (
                <div className="time-header" key={item.id}>
                  {item.text}
                </div>
              );
            }

            if (item.type === "linkPreview") {
              return (
                <div className={`link-preview-row ${item.sender}`} key={item.id}>
                  <div className="link-preview-card">
                    <div className="link-preview-thumb" />
                    <div className="link-preview-title">{item.title}</div>
                    <div className="link-preview-subtitle">{item.subtitle}</div>
                  </div>
                </div>
              );
            }

            return (
              <MessageBubble
                bubble={item}
                durationInFrames={durationInFrames}
                frame={frame}
                hasTail={isLastThreadBubbleInGroup(simulator.items, index)}
                key={item.id}
              />
            );
          })}
          {simulator.themTyping ? <TypingBubble /> : null}
          {simulator.meTyping ? <TypingBubble side="right" /> : null}
        </div>
      </div>
      <div className="top-overlay">
        <StatusBar />
        <div className="source-nav">
          <div className="nav-side-pill">
            <span className="chevron-mark" />
            <span className="unread-badge">1</span>
          </div>
          <div className="source-contact">
            <div className="contact-avatar flooently-contact-avatar">
              <FlooentlyLogo className="contact-logo" />
            </div>
            <div className="contact-name-row">
              <span className="contact-name">{script.contactName}</span>
              <span className="contact-chevron" />
            </div>
          </div>
          <div className="video-button" aria-hidden="true">
            <VideoIcon />
          </div>
        </div>
      </div>
      <div className="bottom-overlay">
        <div className="composer-area">
          <div className="plus-button" />
          <div className="message-input-pill">
            <span className={simulator.composeText ? "" : "placeholder"}>
              {simulator.composeText || "iMessage"}
            </span>
            {simulator.composeText ? (
              <div className="send-mark" />
            ) : (
              <div className="mic-mark" aria-hidden="true">
                <MicIcon />
              </div>
            )}
          </div>
        </div>
        {simulator.flooentlyActive ? (
          <FlooentlyToolbar simulator={simulator} />
        ) : null}
        <div className="home-indicator" />
      </div>
    </div>
  );
};

const MicIcon = () => (
  <svg
    className="mic-icon"
    fill="none"
    viewBox="0 0 256 256"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect height="126" rx="38" width="76" x="90" y="24" />
    <path d="M198 124a70 70 0 0 1-140 0" />
    <path d="M128 194v38" />
    <path d="M100 232h56" />
  </svg>
);

const VideoIcon = () => (
  <svg
    className="video-icon"
    fill="none"
    viewBox="0 0 256 256"
    xmlns="http://www.w3.org/2000/svg"
  >
    <rect height="100" rx="24" width="126" x="28" y="78" />
    <path d="M154 110l52-34c9-6 20 1 20 12v80c0 11-11 18-20 12l-52-34" />
  </svg>
);
