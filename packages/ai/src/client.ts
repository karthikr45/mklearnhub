import Anthropic from '@anthropic-ai/sdk';

export const DEFAULT_MODEL = 'claude-sonnet-4-6';

let client: Anthropic | null = null;

/**
 * Returns a lazily-constructed, singleton Anthropic client.
 *
 * The client is only built the first time a feature actually needs it, so
 * importing this module never touches the network or requires an API key.
 * Throws a clear error if the key is missing when a feature is invoked.
 */
export function getAnthropic(): Anthropic {
  if (client !== null) {
    return client;
  }
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    throw new Error('ANTHROPIC_API_KEY is not configured');
  }
  client = new Anthropic({ apiKey });
  return client;
}

/**
 * Extracts the text of the first `text` content block from a message.
 *
 * `message.content` is a discriminated union of content blocks; this narrows
 * to the `text` variant rather than assuming a shape.
 */
export function firstTextBlock(message: Anthropic.Message): string {
  for (const block of message.content) {
    if (block.type === 'text') {
      return block.text;
    }
  }
  throw new Error('Model response contained no text block');
}
