import { config as loadEnv } from 'dotenv'
import { z } from 'zod'

loadEnv()

const envSchema = z
  .object({
    NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
    PORT: z.coerce
      .number({ invalid_type_error: 'PORT must be a number' })
      .int()
      .min(1, 'PORT must be positive')
      .default(5000),
    DATABASE_PATH: z.string().optional(),
    JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters').default('your-secret-key-change-in-production'),
    CORS_ORIGIN: z.string().optional(),
    GEMINI_API_KEY: z.string().optional().default(''),
  })
  .passthrough()

const parsed = envSchema.safeParse(process.env)

if (!parsed.success) {
  console.error('Invalid environment configuration:', parsed.error.flatten().fieldErrors)
  process.exit(1)
}

const env = parsed.data

export const appEnv = {
  nodeEnv: env.NODE_ENV,
  port: env.PORT,
  databasePath: env.DATABASE_PATH,
  jwtSecret: env.JWT_SECRET,
  corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:5173',
  get geminiApiKey() {
    // Read dynamically from process.env to allow runtime updates
    return process.env.GEMINI_API_KEY || ''
  },
  isProduction: env.NODE_ENV === 'production',
}

