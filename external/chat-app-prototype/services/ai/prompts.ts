import { BUBBLE_TYPES } from './bubbleTypes';

const createMentionedSongsContext = (songs: string[]): string =>
  songs.length > 0
    ? `\n\nIMPORTANT: You have already mentioned these songs in this conversation, DO NOT repeat them:\n- ${songs.join(
        '\n- '
      )}\n\nAlways suggest different songs/artists that haven't been mentioned.`
    : '';

export const createStructuredPrompt = (
  contactName: string = 'Friend',
  mentionedSongs: string[] = []
): string => {
  const mentionedSongsContext = createMentionedSongsContext(mentionedSongs);

  // Build response format section dynamically
  const responseFormats = Object.entries(BUBBLE_TYPES)
    .map(([_key, config]) => {
      return `${config.formatKey}
${config.responseFormat}`;
    })
    .join('\n\n');

  // Build trigger rules dynamically
  const triggerRules = Object.entries(BUBBLE_TYPES)
    .filter(([key]) => key !== 'TEXT') // Skip default
    .map(([_key, config]) => {
      const triggers = config.triggers.map(t => `   - "${t}"`).join('\n');
      const negatives =
        config.negativeContext.length > 0
          ? `\n\nNEVER use ${config.formatKey} when:\n${config.negativeContext
              .map(n => `   - Message contains "${n}"`)
              .join('\n')}`
          : '';

      return `USE ${config.formatKey} ONLY when the current message matches patterns like:
${triggers}${negatives}`;
    })
    .join('\n\n');

  // Build examples dynamically
  const exampleSections = Object.entries(BUBBLE_TYPES)
    .map(([key, config]) => {
      const header =
        key === 'TEXT'
          ? `Examples - USE ${config.formatKey} FOR THESE:`
          : `Use ${config.formatKey} for ${key.toLowerCase()} requests:`;

      const examples = config.examples
        .map(
          ex => `User: "${ex.trigger}"
${config.formatKey}
${ex.response}`
        )
        .join('\n\n');

      return `${header}
${examples}`;
    })
    .join('\n\n');

  return `You are ${contactName}, having a casual text conversation with a friend. 
Keep responses natural, conversational, and brief like real text messages.${mentionedSongsContext}

CRITICAL: You MUST use the exact format headers below for your responses.

CRITICAL RULES FOR CONTEXTUAL AWARENESS:

1. ONLY respond with special types when the CURRENT message specifically matches their triggers
2. When the conversation topic changes, immediately switch back to text responses  
3. Most conversations are normal text - special responses are the exception, not the rule

${triggerRules}

DEFAULT to ${BUBBLE_TYPES.TEXT.formatKey} for all other conversation

Response formats:
${responseFormats}

${exampleSections}

IMPORTANT CONTEXTUAL EXAMPLES - When to switch back to TEXT:

Scenario 1 - Topic change after special response:
User: "Send me a good song"
You: [music response]
User: "Thanks! How was your day?"
${BUBBLE_TYPES.TEXT.formatKey}
Pretty good! Just relaxing. How about you?

Scenario 2 - Special word mentioned but not requesting:
User: "I was listening to music while studying"
${BUBBLE_TYPES.TEXT.formatKey}
Nice! Did it help you focus?

Remember: You're just ${contactName} texting casually. Most messages are just normal conversation.

IMPORTANT: You MUST include the format headers and follow the exact format shown in examples above. Do not deviate from this structure.`;
};
