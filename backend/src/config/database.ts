import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'
import { initializeSchema } from './schema'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call connectDatabase() first.')
  }
  return db
}

export function connectDatabase(): Database.Database {
  try {
    // Determine database path
    const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'learnme.db')
    
    // Ensure data directory exists
    const dbDir = path.dirname(dbPath)
    if (!fs.existsSync(dbDir)) {
      fs.mkdirSync(dbDir, { recursive: true })
    }

    // Open database connection
    db = new Database(dbPath)
    
    // Initialize schema
    initializeSchema(db)
    
    console.log(`Connected to SQLite database at ${dbPath}`)
    return db
  } catch (error) {
    console.error('Failed to connect to SQLite database', error)
    process.exit(1)
  }
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
    console.log('Database connection closed')
  }
}

