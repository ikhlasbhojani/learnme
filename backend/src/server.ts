import { createApp } from './app'
import { connectDatabase, closeDatabase } from './config/database'
import { appEnv } from './config/env'

async function bootstrap() {
  await connectDatabase()

  const app = createApp()

  app.listen(appEnv.port, () => {
    console.log(`Backend listening on http://localhost:${appEnv.port}`)
  })

  // Graceful shutdown
  process.on('SIGINT', async () => {
    console.log('\nShutting down gracefully...')
    await closeDatabase()
    process.exit(0)
  })

  process.on('SIGTERM', async () => {
    console.log('\nShutting down gracefully...')
    await closeDatabase()
    process.exit(0)
  })
}

bootstrap()

