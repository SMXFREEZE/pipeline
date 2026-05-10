import type { EditableVideoScript } from "./types";

export const EDITABLE_FLOOENTLY_SCRIPTS: EditableVideoScript[] = [
  {
    id: "french-natural-text",
    title: "Textbook French Fix",
    contactName: "Flooently",
    hook: "When your French is correct but sounds like homework",
    timeHeader: "Today 9:41 PM",
    keyboardDemo: {
      composeText: "make this sound like a real French text",
      suggestions: ["natural", "casual", "native tone"],
      mode: "improve",
      language: "FR",
      resultTitle: "Flooently rewrite",
      resultText: "Same meaning, less textbook.",
    },
    caption:
      "Format hypothesis: screen-record utility demo for students who can translate, but not sound natural yet.",
    messages: [
      {
        side: "right",
        text: "I know what I want to say in French, but this sounds like homework.",
      },
      {
        side: "right",
        text: "Je voudrais savoir si tu souhaites aller prendre un cafe avec moi apres le cours.",
        delayAfter: 18,
      },
      {
        side: "left",
        text: "Try a more natural text:",
        showTypingBefore: true,
      },
      {
        side: "left",
        text: "Ca te dit de prendre un cafe apres le cours ?",
      },
      {
        side: "left",
        text: "Simple, friendly, and still polite.",
      },
      {
        side: "right",
        text: "Ok that sounds like something a real person would send.",
        receipt: "Delivered",
      },
    ],
  },
  {
    id: "spanish-reply-panic",
    title: "Reply In Spanish Without Freezing",
    contactName: "Flooently",
    hook: "POV: they texted in Spanish and your brain opened a blank tab",
    timeHeader: "Today 10:08 AM",
    keyboardDemo: {
      composeText: "that sounds fun, what time should I come?",
      suggestions: ["Spanish", "friendly", "natural"],
      mode: "translate",
      language: "ES",
      resultTitle: "Flooently translation",
      resultText: "Natural Spanish without leaving Messages.",
    },
    caption:
      "Format hypothesis: POV social-texting panic with an instant payoff in the first seconds.",
    messages: [
      {
        side: "right",
        text: "He invited me to the group hangout in Spanish.",
      },
      {
        side: "right",
        text: "I understand it. Replying is the problem.",
        delayAfter: 14,
      },
      {
        side: "left",
        text: "Say it naturally:",
        showTypingBefore: true,
      },
      {
        side: "left",
        text: "Suena divertido, a que hora deberia llegar?",
      },
      {
        side: "left",
        text: "It keeps your tone casual instead of sounding copied from a translator.",
      },
      {
        side: "right",
        text: "That is exactly what I meant.",
        receipt: "Read",
      },
    ],
  },
  {
    id: "group-chat-slang",
    title: "Language App vs Real Group Chat",
    contactName: "Flooently",
    hook: "When textbook Spanish meets actual group-chat Spanish",
    timeHeader: "Today 2:17 PM",
    keyboardDemo: {
      composeText: "coach me on what this means",
      suggestions: ["explain", "tone", "reply"],
      mode: "improve",
      language: "ES",
      resultTitle: "Flooently coach",
      resultText: "Understand the vibe before you reply.",
    },
    caption:
      "Format hypothesis: meme-style language-learning pain point, but useful and product-led instead of brainrot.",
    messages: [
      {
        side: "right",
        text: "My Spanish app prepared me for ordering apples.",
      },
      {
        side: "right",
        text: 'Then the group chat says "dale, caigo en 10" and I freeze.',
        delayAfter: 16,
      },
      {
        side: "left",
        text: "Flooently explains the vibe:",
        showTypingBefore: true,
      },
      {
        side: "left",
        text: 'It means "sounds good, I will be there in 10."',
      },
      {
        side: "left",
        text: 'You can reply: "perfecto, nos vemos ahi."',
      },
      {
        side: "left",
        text: "Tiny coaching moment, no app switching.",
      },
      {
        side: "right",
        text: "Ok this is the part language apps never teach.",
        receipt: "Delivered",
      },
    ],
  },
];
