import Database from 'better-sqlite3'
import path from 'path'
import { appEnv } from './env'

/**
 * Initialize database schema
 * Creates all necessary tables if they don't exist
 */
export function initializeSchema(db: Database.Database): void {
  // Enable foreign keys
  db.pragma('foreign_keys = ON')

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      passwordHash TEXT NOT NULL,
      themePreference TEXT CHECK(themePreference IN ('light', 'dark', 'blue', 'green')),
      lastLoginAt TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  // Create index on email for faster lookups
  db.exec(`CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)`)

  // ContentInputs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_inputs (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('url', 'file', 'manual')),
      source TEXT NOT NULL,
      content TEXT,
      timestamp TEXT DEFAULT (datetime('now')),
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE
    )
  `)

  // Create index on userId for faster queries
  db.exec(`CREATE INDEX IF NOT EXISTS idx_content_inputs_userId ON content_inputs(userId)`)

  // Quizzes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      userId TEXT NOT NULL,
      contentInputId TEXT,
      name TEXT,
      configuration TEXT NOT NULL,
      questions TEXT NOT NULL,
      answers TEXT NOT NULL DEFAULT '{}',
      startTime TEXT,
      endTime TEXT,
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in-progress', 'completed', 'expired')),
      score REAL,
      correctCount INTEGER,
      incorrectCount INTEGER,
      pauseReason TEXT CHECK(pauseReason IN ('tab-change', 'manual')),
      pausedAt TEXT,
      pauseCount INTEGER NOT NULL DEFAULT 0,
      analysis TEXT,
      createdAt TEXT NOT NULL DEFAULT (datetime('now')),
      updatedAt TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (userId) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (contentInputId) REFERENCES content_inputs(id) ON DELETE SET NULL
    )
  `)

  // Create index on userId for faster queries
  db.exec(`CREATE INDEX IF NOT EXISTS idx_quizzes_userId ON quizzes(userId)`)
  db.exec(`CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status)`)
}

/**
 * Generate a unique ID (similar to MongoDB ObjectId format but simpler)
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`
}

