import type { SimulatorSnapshot } from "../data/scripts";
import { FlooentlyLogo } from "./FlooentlyLogo";

type FlooentlyToolbarProps = {
  simulator: SimulatorSnapshot;
};

export const FlooentlyToolbar = ({ simulator }: FlooentlyToolbarProps) => {
  const activeNugget =
    simulator.flooentlyNuggets[simulator.flooentlyNuggetIndex] ??
    simulator.flooentlyNuggets[0];

  return (
    <div className="flooently-panel">
      <div className="flooently-toolbar">
        <div className="flooently-toolbar-brand">
          <FlooentlyLogo className="toolbar-logo" />
        </div>
        <div className="mode-toggle">
          <div
            className={`mode-button ${
              simulator.flooentlyMode === "improve" ? "active" : ""
            }`}
          >
            Improve
          </div>
          <div
            className={`mode-button ${
              simulator.flooentlyMode === "translate" ? "active" : ""
            }`}
          >
            Translate
          </div>
        </div>
        <div className="tone-pill">Tone</div>
        <div className="language-pill">
          <span>To</span>
          <strong>{simulator.flooentlyLanguageCode}</strong>
        </div>
        <div
          className={`run-button ${
            simulator.flooentlyIsLoading ? "disabled" : ""
          }`}
        >
          Run
        </div>
      </div>
      {simulator.flooentlyShowResults ? (
        <div className="flooently-result">
          {simulator.flooentlyIsLoading ? (
            <div className="loading-state">
              <div className="spinner" />
              <div>
                {simulator.flooentlyMode === "improve"
                  ? "Improving..."
                  : "Translating..."}
              </div>
            </div>
          ) : activeNugget ? (
            <div className="result-card">
              <div className="result-label">{activeNugget.category}</div>
              <div className="result-title">{activeNugget.title}</div>
              <div className="result-text">{activeNugget.body}</div>
              {simulator.flooentlyNuggets.length > 1 ? (
                <div className="result-dots">
                  {simulator.flooentlyNuggets.map((nugget, index) => (
                    <span
                      className={
                        index === simulator.flooentlyNuggetIndex ? "active" : ""
                      }
                      key={`${nugget.category}-${index}`}
                    />
                  ))}
                </div>
              ) : null}
            </div>
          ) : (
            <div className="result-card">
              <div className="result-label">Result</div>
              <div className="result-text">{simulator.flooentlyResult}</div>
            </div>
          )}
          <div className="dismiss-button">Done</div>
        </div>
      ) : null}
    </div>
  );
};
