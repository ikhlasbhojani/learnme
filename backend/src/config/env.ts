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
    MONGODB_URI: z.string().default('mongodb://localhost:27017/learnme'),
    JWT_SECRET: z.string().min(10, 'JWT_SECRET must be at least 10 characters').default('your-secret-key-change-in-production'),
    CORS_ORIGIN: z.string().optional(),
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
  mongodbUri: env.MONGODB_URI,
  jwtSecret: env.JWT_SECRET,
  corsOrigin: env.CORS_ORIGIN ?? 'http://localhost:5173',
  isProduction: env.NODE_ENV === 'production',
}

