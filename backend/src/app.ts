import 'express-async-errors'
import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import path from 'path'
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

  // Serve frontend static files in production
  if (appEnv.isProduction || process.env.SERVE_FRONTEND === 'true') {
    const fs = require('fs')
    // Use FRONTEND_DIST_PATH if provided, otherwise try multiple paths
    const frontendDistPath = process.env.FRONTEND_DIST_PATH
    const possiblePaths = frontendDistPath
      ? [frontendDistPath]
      : [
          path.join(process.cwd(), '..', 'frontend', 'dist'), // Development
          path.join(process.cwd(), 'frontend', 'dist'), // Relative to backend
          path.join(__dirname, '..', '..', 'frontend', 'dist'), // From dist
          path.resolve(process.cwd(), 'frontend', 'dist'), // Absolute
        ]
    
    let frontendDist = null
    for (const distPath of possiblePaths) {
      if (fs.existsSync(distPath)) {
        frontendDist = distPath
        break
      }
    }
    
    if (frontendDist) {
      app.use(express.static(frontendDist))
      // Serve index.html for all non-API routes (SPA routing)
      // This must be after API routes but before error handlers
      app.get('*', (req, res, next) => {
        // Skip API routes
        if (req.path.startsWith('/api')) {
          return next()
        }
        res.sendFile(path.join(frontendDist, 'index.html'))
      })
    }
  }

  app.use(notFoundHandler)
  app.use(errorHandler)

  return app
}

