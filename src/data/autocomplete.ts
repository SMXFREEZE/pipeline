export function autocompleteForText(text: string): [string, string, string] {
  const words = text.split(/\s+/);
  const currentWord = words.at(-1) ?? "";
  const previousWord = words.at(-2)?.toLowerCase() ?? "";

  if (!text || text.endsWith(" ")) {
    return contextSuggestions(previousWord);
  }

  const lower = currentWord.toLowerCase();
  const matches = AUTOCOMPLETE_POOL.filter(
    (word) => word.startsWith(lower) && word !== lower,
  );
  const first = matches[0] ?? currentWord;
  const second = matches[1] ?? "";
  const third = matches[2] ?? "";

  return [currentWord, first, second || third];
}

function contextSuggestions(previousWord: string): [string, string, string] {
  switch (previousWord) {
    case "let":
      return ["me", "it", "us"];
    case "me":
      return ["know", "see", "be"];
    case "know":
      return ["if", "that", "what"];
    case "once":
      return ["you", "I", "we"];
    case "you":
      return ["get", "are", "can"];
    case "get":
      return ["some", "a", "the"];
    case "some":
      return ["details", "info", "time"];
    case "details":
      return ["finalized", "sorted", "ready"];
    default:
      return ["I", "The", "I'm"];
  }
}

const AUTOCOMPLETE_POOL = [
  "know",
  "knew",
  "once",
  "only",
  "ok",
  "okay",
  "one",
  "out",
  "over",
  "see",
  "so",
  "some",
  "sorry",
  "sure",
  "send",
  "get",
  "good",
  "going",
  "great",
  "you",
  "yeah",
  "yes",
  "your",
  "the",
  "that",
  "this",
  "time",
  "there",
  "think",
  "finalized",
  "final",
  "finally",
  "find",
  "fine",
  "first",
  "free",
  "friday",
  "have",
  "hey",
  "hi",
  "here",
  "hang",
  "him",
  "her",
  "details",
  "detailing",
  "definitely",
  "do",
  "and",
  "are",
  "also",
  "already",
  "about",
  "more",
  "me",
  "my",
  "maybe",
  "meet",
  "if",
  "it",
  "its",
  "in",
  "is",
  "let",
  "like",
  "later",
];
