import { z } from 'zod'

export const quizConfigurationSchema = z.object({
  difficulty: z.enum(['Easy', 'Normal', 'Hard', 'Master']),
  numberOfQuestions: z.number().int().min(1).max(50),
  timeDuration: z.number().int().min(60).max(7200),
})

export const createQuizSchema = z.object({
  configuration: quizConfigurationSchema,
  contentInputId: z.string().optional(),
})

export const answerQuestionSchema = z.object({
  questionId: z.string().min(1),
  answer: z.string().min(1),
})

export const pauseQuizSchema = z.object({
  reason: z.enum(['tab-change', 'manual']).optional().default('tab-change'),
})

export type CreateQuizInput = z.infer<typeof createQuizSchema>
export type AnswerQuestionInput = z.infer<typeof answerQuestionSchema>
export type PauseQuizInput = z.infer<typeof pauseQuizSchema>

