const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const dbPath = process.env.DATABASE_PATH || path.join(__dirname, '../../data/learnme.db');
const dbDir = path.dirname(dbPath);

// Ensure directory exists
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

// Create database connection
let db = null;

/**
 * Connect to SQLite database
 * @returns {Database} SQLite database instance
 */
const connectDB = () => {
  try {
    if (db) {
      return db;
    }

    db = new Database(dbPath, {
      verbose: process.env.NODE_ENV === 'development' ? console.log : null
    });

    // Enable foreign keys
    db.pragma('foreign_keys = ON');

    // Enable WAL mode for better concurrency
    db.pragma('journal_mode = WAL');

    console.log(`✅ SQLite Connected: ${dbPath}`);
    console.log(`📚 Database: ${path.basename(dbPath)}`);

    // Handle process termination
    process.on('SIGINT', () => {
      if (db) {
        db.close();
        console.log('📦 SQLite connection closed through app termination');
      }
      process.exit(0);
    });

    return db;
  } catch (error) {
    console.error('❌ SQLite connection failed:', error.message);
    throw error;
  }
};

/**
 * Get database instance
 * @returns {Database} SQLite database instance
 */
const getDB = () => {
  if (!db) {
    return connectDB();
  }
  return db;
};

/**
 * Close database connection
 */
const closeDB = () => {
  if (db) {
    db.close();
    db = null;
    console.log('📦 SQLite connection closed');
  }
};

module.exports = {
  connectDB,
  getDB,
  closeDB
};
