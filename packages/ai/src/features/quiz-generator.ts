import { DEFAULT_MODEL, firstTextBlock, getAnthropic } from '../client';
import { asString, extractJsonArray } from '../json';

export interface GeneratedQuestionOption {
  id: string;
  text: string;
  isCorrect: boolean;
}

export interface GeneratedQuestion {
  type: 'MCQ' | 'MSQ';
  text: string;
  options: GeneratedQuestionOption[];
  explanation?: string;
}

const SYSTEM_INSTRUCTIONS = [
  'You are a quiz author. Given source content, write clear assessment questions.',
  'Use "MCQ" for questions with exactly one correct option and "MSQ" for questions with two or more correct options.',
  'Respond with ONLY a JSON array. Each element must be an object shaped like:',
  '{ "type": "MCQ" | "MSQ", "text": string, "options": [{ "id": string, "text": string, "isCorrect": boolean }], "explanation": string }',
  'Every question must have at least three options. Do not include any prose outside the JSON array.',
].join('\n');

export async function generateQuizFromContent(
  content: string,
  count: number,
): Promise<GeneratedQuestion[]> {
  const response = await getAnthropic().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 4096,
    messages: [
      {
        role: 'user',
        content: `${SYSTEM_INSTRUCTIONS}\n\nGenerate ${count} question(s) from the following content:\n\n${content}`,
      },
    ],
  });

  return extractJsonArray(firstTextBlock(response)).map(toQuestion);
}

function toQuestion(value: unknown): GeneratedQuestion {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Invalid question entry in model response');
  }
  const record = value as Record<string, unknown>;
  const options = Array.isArray(record.options)
    ? record.options.map(toOption)
    : [];

  const question: GeneratedQuestion = {
    type: record.type === 'MSQ' ? 'MSQ' : 'MCQ',
    text: asString(record.text),
    options,
  };

  if (typeof record.explanation === 'string') {
    question.explanation = record.explanation;
  }

  return question;
}

function toOption(value: unknown): GeneratedQuestionOption {
  if (typeof value !== 'object' || value === null) {
    throw new Error('Invalid option entry in model response');
  }
  const record = value as Record<string, unknown>;
  return {
    id: asString(record.id),
    text: asString(record.text),
    isCorrect: record.isCorrect === true,
  };
}
