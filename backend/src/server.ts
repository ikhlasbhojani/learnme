import { createApp } from './app'
import { connectDatabase } from './config/database'
import { appEnv } from './config/env'

async function bootstrap() {
  await connectDatabase()

  const app = createApp()

  app.listen(appEnv.port, () => {
    console.log(`Backend listening on http://localhost:${appEnv.port}`)
  })
}

bootstrap().catch((error) => {
  console.error('Fatal error during bootstrap', error)
  process.exit(1)
})

