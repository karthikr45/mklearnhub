export { getAnthropic, DEFAULT_MODEL, firstTextBlock } from './client';

export { generateQuizFromContent } from './features/quiz-generator';
export type {
  GeneratedQuestion,
  GeneratedQuestionOption,
} from './features/quiz-generator';

export { summarizeArticle, generateExcerpt } from './features/summarizer';

export {
  answerCourseQuestion,
  suggestRelatedCourses,
} from './features/course-assistant';

export { moderateContent } from './features/content-moderator';
export type { ModerationResult } from './features/content-moderator';
