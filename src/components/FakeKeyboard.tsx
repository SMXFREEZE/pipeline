type FakeKeyboardProps = {
  highlightedKey?: string;
  suggestions: [string, string, string];
  hideAutocomplete?: boolean;
};

const rows = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L"],
  ["Z", "X", "C", "V", "B", "N", "M"],
];

export const FakeKeyboard = ({
  highlightedKey,
  suggestions,
  hideAutocomplete,
}: FakeKeyboardProps) => {
  return (
    <div className="fake-keyboard">
      {hideAutocomplete ? null : (
        <div className="autocomplete-row">
          {suggestions.map((suggestion, index) => (
            <div className="autocomplete-word" key={`${suggestion}-${index}`}>
              {suggestion ? (index === 1 ? `"${suggestion}"` : suggestion) : ""}
            </div>
          ))}
        </div>
      )}
      <div className="keyboard-rows">
        {rows.map((row, rowIndex) => (
          <div
            className={`keyboard-row keyboard-row-${rowIndex + 1}`}
            key={`row-${rowIndex}`}
          >
            {rowIndex === 2 ? (
              <Key
                label="shift"
                special
                highlighted={highlightedKey === "shift"}
              />
            ) : null}
            {row.map((letter) => (
              <Key
                key={letter}
                label={letter}
                highlighted={highlightedKey === letter}
              />
            ))}
            {rowIndex === 2 ? (
              <Key
                label="del"
                special
                highlighted={highlightedKey === "backspace"}
              />
            ) : null}
          </div>
        ))}
        <div className="keyboard-row keyboard-row-bottom">
          <Key label="123" special />
          <Key label="lang" special />
          <Key label="space" wide highlighted={highlightedKey === "space"} />
          <Key label="return" special wide />
        </div>
      </div>
      <div className="home-indicator" />
    </div>
  );
};

type KeyProps = {
  label: string;
  highlighted?: boolean;
  special?: boolean;
  wide?: boolean;
};

const Key = ({ label, highlighted, special, wide }: KeyProps) => {
  return (
    <div
      className={[
        "keyboard-key",
        highlighted ? "highlighted" : "",
        special ? "special" : "",
        wide ? "wide" : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {label}
    </div>
  );
};
