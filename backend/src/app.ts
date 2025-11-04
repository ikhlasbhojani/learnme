import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import modulesRouter from './modules'
import { appEnv } from './config/env'
import { errorHandler, notFoundHandler } from './middlewares/error.middleware'

export function createApp() {
  const app = express()

  app.use(
    cors({
      origin: appEnv.corsOrigin,
      credentials: true,
    })
  )
  app.use(cookieParser())
  app.use(express.json())
  app.use(express.urlencoded({ extended: true }))

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' })
  })

  app.use('/api', modulesRouter)

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

