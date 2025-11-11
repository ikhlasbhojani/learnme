const sqlite3 = require('sqlite3');
const { promisify } = require('util');
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
let pdb = null; // promisified facade

/**
 * Connect to SQLite database
 * @returns {object} Promisified SQLite database facade
 */
const connectDB = () => {
  try {
    if (pdb) {
      return pdb;
    }

    sqlite3.verbose(process.env.NODE_ENV === 'development');
    db = new sqlite3.Database(dbPath);

    // Promisified API
    const runAsync = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.run(sql, params, function (err) {
          if (err) return reject(err);
          resolve({ changes: this.changes, lastID: this.lastID });
        });
      });

    const getAsync = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.get(sql, params, (err, row) => {
          if (err) return reject(err);
          resolve(row || null);
        });
      });

    const allAsync = (sql, params = []) =>
      new Promise((resolve, reject) => {
        db.all(sql, params, (err, rows) => {
          if (err) return reject(err);
          resolve(rows || []);
        });
      });

    const execAsync = promisify(db.exec).bind(db);

    pdb = {
      run: runAsync,
      get: getAsync,
      all: allAsync,
      exec: execAsync,
      pragma: async (pragmaSql) => execAsync(`PRAGMA ${pragmaSql};`),
      close: () =>
        new Promise((resolve, reject) => {
          db.close((err) => (err ? reject(err) : resolve()));
        }),
    };

    // Enable foreign keys and WAL
    pdb.pragma('foreign_keys = ON').catch(() => {});
    pdb.pragma('journal_mode = WAL').catch(() => {});

    console.log(`✅ SQLite Connected: ${dbPath}`);
    console.log(`📚 Database: ${path.basename(dbPath)}`);

    // Handle process termination
    process.on('SIGINT', async () => {
      if (pdb) {
        await pdb.close().catch(() => {});
        pdb = null;
        db = null;
        console.log('📦 SQLite connection closed through app termination');
      }
      process.exit(0);
    });

    return pdb;
  } catch (error) {
    console.error('❌ SQLite connection failed:', error.message);
    throw error;
  }
};

/**
 * Get database instance (promisified facade)
 * @returns {object} Promisified SQLite database instance
 */
const getDB = () => {
  if (!pdb) {
    return connectDB();
  }
  return pdb;
};

/**
 * Close database connection
 */
const closeDB = async () => {
  if (pdb) {
    await pdb.close().catch(() => {});
    pdb = null;
    db = null;
    console.log('📦 SQLite connection closed');
  }
};

module.exports = {
  connectDB,
  getDB,
  closeDB
};
