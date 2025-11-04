import mongoose from 'mongoose'
import { appEnv } from './env'

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', true)
    const connection = await mongoose.connect(appEnv.mongoUri)
    console.log(`Connected to MongoDB at ${connection.connection.host}`)
    return connection
  } catch (error) {
    console.error('Failed to connect to MongoDB', error)
    process.exit(1)
  }
}

