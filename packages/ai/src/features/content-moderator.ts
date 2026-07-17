import { DEFAULT_MODEL, firstTextBlock, getAnthropic } from '../client';
import { extractJsonObject } from '../json';

export interface ModerationResult {
  safe: boolean;
  reason?: string;
}

export async function moderateContent(text: string): Promise<ModerationResult> {
  const response = await getAnthropic().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: [
          'You are a content moderator for an online learning platform.',
          'Decide whether the following user-submitted text is safe to publish.',
          'Flag hate speech, harassment, sexual content, violence, or spam.',
          'Respond with ONLY a JSON object shaped like { "safe": boolean, "reason": string }.',
          'When the content is safe, use an empty string for "reason".',
          '',
          '<content>',
          text,
          '</content>',
        ].join('\n'),
      },
    ],
  });

  const record = extractJsonObject(firstTextBlock(response));
  const safe = record.safe === true;

  const result: ModerationResult = { safe };
  if (!safe && typeof record.reason === 'string' && record.reason.length > 0) {
    result.reason = record.reason;
  }
  return result;
}
