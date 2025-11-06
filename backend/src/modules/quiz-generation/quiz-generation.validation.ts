import { z } from 'zod'

export const generateQuizFromUrlSchema = z
  .object({
    url: z.string().url('Invalid URL format').optional(),
    selectedTopics: z
      .array(
        z.object({
          id: z.string(),
          title: z.string(),
          url: z.string().url(),
          description: z.string().optional(),
          section: z.string().optional(),
        })
      )
      .optional(),
    difficulty: z.enum(['easy', 'medium', 'hard'], {
      errorMap: () => ({ message: 'Difficulty must be easy, medium, or hard' }),
    }),
    numberOfQuestions: z
      .number()
      .int()
      .min(1, 'Number of questions must be at least 1')
      .max(100, 'Number of questions cannot exceed 100')
      .default(10),
    timeDuration: z
      .number()
      .int()
      .min(60, 'Time duration must be at least 60 seconds')
      .max(7200, 'Time duration cannot exceed 7200 seconds')
      .optional()
      .default(3600),
  })
  .refine((data) => data.url || (data.selectedTopics && data.selectedTopics.length > 0), {
    message: 'Either URL or selected topics must be provided',
    path: ['url'],
  })

export const generateQuizFromContentSchema = z.object({
  document: z.string().min(10, 'Document content must be at least 10 characters'),
  difficulty: z.enum(['easy', 'medium', 'hard'], {
    errorMap: () => ({ message: 'Difficulty must be easy, medium, or hard' }),
  }),
  numberOfQuestions: z
    .number()
    .int()
    .min(1, 'Number of questions must be at least 1')
    .max(100, 'Number of questions cannot exceed 100')
    .default(10),
  timeDuration: z
    .number()
    .int()
    .min(60, 'Time duration must be at least 60 seconds')
    .max(7200, 'Time duration cannot exceed 7200 seconds')
    .optional()
    .default(3600),
})

export type GenerateQuizFromUrlInput = z.infer<typeof generateQuizFromUrlSchema>
export type GenerateQuizFromContentInput = z.infer<typeof generateQuizFromContentSchema>

