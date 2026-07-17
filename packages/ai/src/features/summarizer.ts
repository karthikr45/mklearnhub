import { DEFAULT_MODEL, firstTextBlock, getAnthropic } from '../client';

const MAX_EXCERPT_LENGTH = 160;

export async function summarizeArticle(content: string): Promise<string> {
  const response = await getAnthropic().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          'Summarize the following article in a few clear, concise paragraphs.',
          'Capture the key points and takeaways. Respond with the summary only.',
          '',
          content,
        ].join('\n'),
      },
    ],
  });

  return firstTextBlock(response).trim();
}

export async function generateExcerpt(content: string): Promise<string> {
  const response = await getAnthropic().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: [
          `Write a single-sentence excerpt of at most ${MAX_EXCERPT_LENGTH} characters`,
          'that captures the essence of the following content. Respond with the excerpt only.',
          '',
          content,
        ].join('\n'),
      },
    ],
  });

  const excerpt = firstTextBlock(response).trim();
  if (excerpt.length <= MAX_EXCERPT_LENGTH) {
    return excerpt;
  }
  return `${excerpt.slice(0, MAX_EXCERPT_LENGTH - 1).trimEnd()}…`;
}
