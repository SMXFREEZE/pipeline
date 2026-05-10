import { Composition, Folder } from "remotion";
import { FlooentlyMessageVideo } from "./compositions/FlooentlyMessageVideo";
import {
  FLOOENTLY_SCRIPTS,
  getScriptDurationInFrames,
  VIDEO_FPS,
  VIDEO_HEIGHT,
  VIDEO_WIDTH,
} from "./data/scripts";
import { getSimulatorVideoById } from "./data/videoCatalog";
import "./styles/global.css";

export const RemotionRoot = () => {
  return (
    <Folder name="Flooently">
      {FLOOENTLY_SCRIPTS.map((script) => (
        <Composition
          key={script.id}
          id={getSimulatorVideoById(script.id)?.compositionId ?? script.id}
          component={FlooentlyMessageVideo}
          durationInFrames={getScriptDurationInFrames(script)}
          fps={VIDEO_FPS}
          width={VIDEO_WIDTH}
          height={VIDEO_HEIGHT}
          defaultProps={{
            scriptId: script.id,
          }}
        />
      ))}
    </Folder>
  );
};
