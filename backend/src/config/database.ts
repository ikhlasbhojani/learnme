import mongoose from 'mongoose'
import { appEnv } from './env'

let isConnected = false

export async function connectDatabase(): Promise<void> {
  if (isConnected) {
    return
  }

  try {
    const mongoUri = process.env.MONGODB_URI || 'mongodb://localhost:27017/learnme'
    
    await mongoose.connect(mongoUri, {
      // These options are recommended for Mongoose 6+
    })

    isConnected = true
    console.log(`Connected to MongoDB at ${mongoUri}`)
  } catch (error) {
    console.error('Failed to connect to MongoDB:', error)
    process.exit(1)
  }
}

export async function closeDatabase(): Promise<void> {
  if (isConnected) {
    await mongoose.connection.close()
    isConnected = false
    console.log('Database connection closed')
  }
}

export function getDatabase(): typeof mongoose {
  if (!isConnected) {
    throw new Error('Database not initialized. Call connectDatabase() first.')
  }
  return mongoose
}
