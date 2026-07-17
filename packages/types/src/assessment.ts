import { z } from 'zod'

import { QuestionType } from './enums'

export interface QuestionOption {
  id: string
  text: string
  isCorrect: boolean
}

export interface Question {
  id: string
  quizId: string
  type: QuestionType
  text: string
  explanation?: string | null
  points: number
  order: number
  options?: QuestionOption[] | null
  correctAnswer?: string | null
}

export interface Quiz {
  id: string
  title: string
  lessonId?: string | null
  organizationId: string
  passingScore: number
  timeLimitMins?: number | null
  maxAttempts: number
  shuffleQuestions: boolean
  showAnswers: boolean
  isPublished: boolean
  questions?: Question[]
}

export interface Answer {
  questionId: string
  selectedOptionIds: string[]
  text?: string
}

export interface QuizAttempt {
  id: string
  quizId: string
  userId: string
  answers: Answer[]
  score: number
  maxScore: number
  passed: boolean
  submittedAt?: Date | null
}

export interface GradeBreakdown {
  questionId: string
  awarded: number
  possible: number
  correct: boolean
}

export interface QuizResult {
  attemptId: string
  score: number
  maxScore: number
  passed: boolean
  breakdown: GradeBreakdown[]
}

export const createQuizSchema = z.object({
  title: z.string().min(1),
  passingScore: z.number().int().min(0).max(100).default(70),
  timeLimitMins: z.number().int().positive().optional(),
  maxAttempts: z.number().int().positive().default(3),
  shuffleQuestions: z.boolean().default(false),
})
export type CreateQuizDto = z.infer<typeof createQuizSchema>

export const submitQuizSchema = z.object({
  answers: z.array(
    z.object({
      questionId: z.string(),
      selectedOptionIds: z.array(z.string()).default([]),
      text: z.string().optional(),
    }),
  ),
})
export type SubmitQuizDto = z.infer<typeof submitQuizSchema>
