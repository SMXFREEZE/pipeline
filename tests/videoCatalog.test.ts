import { describe, expect, it } from "vitest";
import { FLOOENTLY_SCRIPTS } from "../src/data/scripts";
import {
  SIMULATOR_VIDEOS,
  getSimulatorVideoById,
  toPublicSimulatorVideo,
} from "../src/data/videoCatalog";

describe("Flooently hosted video catalog", () => {
  it("keeps one hosted MP4 entry per editable script", () => {
    expect(SIMULATOR_VIDEOS.map((video) => video.id)).toEqual(
      FLOOENTLY_SCRIPTS.map((script) => script.id),
    );

    for (const video of SIMULATOR_VIDEOS) {
      expect(video.width).toBe(1080);
      expect(video.height).toBe(1920);
      expect(video.fps).toBe(30);
      expect(video.durationInFrames).toBeGreaterThan(0);
      expect(video.outputFileName).toMatch(
        new RegExp(`^flooently-${video.id}\\.mp4$`),
      );
      expect(video.compositionId).toMatch(/^Flooently/);
    }
  });

  it("returns public endpoint URLs for demo tools and phones", () => {
    const video = getSimulatorVideoById("french-natural-text");

    expect(video).toBeDefined();
    expect(toPublicSimulatorVideo(video!, "https://demo.example")).toMatchObject({
      id: "french-natural-text",
      composition_id: "FlooentlyFrenchNaturalText",
      download_url: "https://demo.example/api/videos/french-natural-text.mp4",
      render_url: "https://demo.example/api/videos/french-natural-text/render",
    });
  });

  it("keeps old review links working after PDF-aligned renames", () => {
    expect(getSimulatorVideoById("student-rewrite")?.id).toBe(
      "french-natural-text",
    );
    expect(getSimulatorVideoById("recruiter-follow-up")?.id).toBe(
      "spanish-reply-panic",
    );
    expect(getSimulatorVideoById("workplace-clarification")?.id).toBe(
      "group-chat-slang",
    );
  });
});
