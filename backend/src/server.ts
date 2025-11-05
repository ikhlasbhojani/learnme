import { createApp } from './app'
import { connectDatabase, closeDatabase } from './config/database'
import { appEnv } from './config/env'

function bootstrap() {
  connectDatabase()

  const app = createApp()

  app.listen(appEnv.port, () => {
    console.log(`Backend listening on http://localhost:${appEnv.port}`)
  })

  // Graceful shutdown
  process.on('SIGINT', () => {
    console.log('\nShutting down gracefully...')
    closeDatabase()
    process.exit(0)
  })

  process.on('SIGTERM', () => {
    console.log('\nShutting down gracefully...')
    closeDatabase()
    process.exit(0)
  })
}

bootstrap()

