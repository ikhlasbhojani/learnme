import { z } from 'zod'

export const createContentSchema = z.object({
  type: z.enum(['url', 'file', 'manual']),
  source: z.string().min(1, 'Source is required'),
  content: z.string().optional(),
})

export const updateContentSchema = z.object({
  source: z.string().min(1).optional(),
  content: z.string().optional(),
})

export type CreateContentInput = z.infer<typeof createContentSchema>
export type UpdateContentInput = z.infer<typeof updateContentSchema>

