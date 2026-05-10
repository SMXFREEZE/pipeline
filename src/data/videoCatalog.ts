import {
  FLOOENTLY_SCRIPTS,
  getScriptDurationInFrames,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./scripts";

const COMPOSITION_IDS: Record<string, string> = {
  "french-natural-text": "FlooentlyFrenchNaturalText",
  "spanish-reply-panic": "FlooentlySpanishReplyPanic",
  "group-chat-slang": "FlooentlyGroupChatSlang",
};

const LEGACY_VIDEO_ID_ALIASES: Record<string, string> = {
  "student-rewrite": "french-natural-text",
  "recruiter-follow-up": "spanish-reply-panic",
  "workplace-clarification": "group-chat-slang",
};

export type SimulatorVideo = {
  id: string;
  title: string;
  compositionId: string;
  outputFileName: string;
  width: number;
  height: number;
  fps: number;
  durationInFrames: number;
  durationInSeconds: number;
};

export type PublicSimulatorVideo = {
  id: string;
  title: string;
  composition_id: string;
  output_file_name: string;
  width: number;
  height: number;
  fps: number;
  duration_in_frames: number;
  duration_seconds: number;
  download_url: string;
  render_url: string;
};

export const SIMULATOR_VIDEOS: SimulatorVideo[] = FLOOENTLY_SCRIPTS.map(
  (script) => {
    const durationInFrames = getScriptDurationInFrames(script);

    return {
      id: script.id,
      title: script.title,
      compositionId: COMPOSITION_IDS[script.id] ?? script.id,
      outputFileName: `flooently-${script.id}.mp4`,
      width: VIDEO_WIDTH,
      height: VIDEO_HEIGHT,
      fps: VIDEO_FPS,
      durationInFrames,
      durationInSeconds: Number((durationInFrames / VIDEO_FPS).toFixed(2)),
    };
  },
);

export function getSimulatorVideoById(id: string): SimulatorVideo | undefined {
  const resolvedId = LEGACY_VIDEO_ID_ALIASES[id] ?? id;

  return SIMULATOR_VIDEOS.find((video) => video.id === resolvedId);
}

export function toPublicSimulatorVideo(
  video: SimulatorVideo,
  baseUrl: string,
): PublicSimulatorVideo {
  return {
    id: video.id,
    title: video.title,
    composition_id: video.compositionId,
    output_file_name: video.outputFileName,
    width: video.width,
    height: video.height,
    fps: video.fps,
    duration_in_frames: video.durationInFrames,
    duration_seconds: video.durationInSeconds,
    download_url: `${baseUrl}/api/videos/${video.id}.mp4`,
    render_url: `${baseUrl}/api/videos/${video.id}/render`,
  };
}
