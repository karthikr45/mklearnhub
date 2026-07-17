import { DEFAULT_MODEL, firstTextBlock, getAnthropic } from '../client';
import { asString, extractJsonArray } from '../json';

export async function answerCourseQuestion(
  question: string,
  context: string,
): Promise<string> {
  const response = await getAnthropic().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 1024,
    messages: [
      {
        role: 'user',
        content: [
          'You are a helpful course assistant. Answer the learner’s question using the',
          'provided course context. If the answer is not in the context, say so honestly.',
          '',
          '<context>',
          context,
          '</context>',
          '',
          `Question: ${question}`,
        ].join('\n'),
      },
    ],
  });

  return firstTextBlock(response).trim();
}

export async function suggestRelatedCourses(
  userHistory: string[],
  allCourses: string[],
): Promise<string[]> {
  const response = await getAnthropic().messages.create({
    model: DEFAULT_MODEL,
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: [
          'Given a learner’s course history and a catalog of available courses,',
          'recommend up to five courses from the catalog they are most likely to enjoy next.',
          'Only choose titles that appear in the catalog. Respond with ONLY a JSON array of course-title strings.',
          '',
          `History: ${JSON.stringify(userHistory)}`,
          `Catalog: ${JSON.stringify(allCourses)}`,
        ].join('\n'),
      },
    ],
  });

  const catalog = new Set(allCourses);
  return extractJsonArray(firstTextBlock(response))
    .map((entry) => asString(entry))
    .filter((title) => title.length > 0 && catalog.has(title));
}
