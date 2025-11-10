# MongoDB to SQLite Migration - Requirements & Implementation Guide

## 📋 Overview

This document provides a comprehensive guide for migrating the LearnMe Node.js backend from MongoDB to SQLite database. The migration will replace Mongoose ODM with a SQLite-compatible ORM/library while maintaining all existing functionality and API contracts.

---

## 🎯 Objectives

1. **Replace MongoDB with SQLite** - Migrate all database operations from MongoDB to SQLite
2. **Maintain API Compatibility** - Ensure all existing APIs continue to work without changes
3. **Preserve Data Structure** - Keep the same data models and relationships
4. **Zero Downtime Migration** - Plan for smooth transition with data migration support
5. **Performance Optimization** - Leverage SQLite's strengths for single-server deployments

---

## 📊 Current MongoDB Implementation

### Current Technology Stack
- **Database**: MongoDB
- **ODM**: Mongoose
- **Connection**: `mongoose.connect()` via `src/config/db.js`
- **Models**: 
  - `User.model.js`
  - `Quiz.model.js`
  - `ContentInput.model.js`

### Current Database Models

#### 1. User Model
```javascript
{
  _id: String (custom: "user-{timestamp}-{random}"),
  email: String (unique, lowercase, required),
  passwordHash: String (required),
  themePreference: String (enum: ['light', 'dark', 'blue', 'green']),
  lastLoginAt: Date,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

#### 2. Quiz Model
```javascript
{
  _id: String (custom: "quiz-{timestamp}-{random}"),
  userId: String (required, ref: 'User'),
  contentInputId: String (ref: 'ContentInput'),
  name: String,
  configuration: {
    difficulty: String (enum: ['Easy', 'Normal', 'Hard', 'Master']),
    numberOfQuestions: Number (1-50),
    timeDuration: Number (60-7200)
  },
  questions: [{
    id: String,
    text: String,
    options: [String] (exactly 4),
    correctAnswer: String,
    difficulty: String,
    explanation: String,
    codeSnippet: String,
    imageReference: String
  }],
  answers: Map<String, String> (questionId -> answer),
  status: String (enum: ['pending', 'in-progress', 'completed', 'expired']),
  score: Number (0-100),
  correctCount: Number,
  incorrectCount: Number,
  startTime: Date,
  endTime: Date,
  pauseReason: String (enum: ['tab-change', 'manual']),
  pausedAt: Date,
  pauseCount: Number (default: 0),
  analysis: {
    performanceReview: String,
    weakAreas: [String],
    suggestions: [String],
    strengths: [String],
    improvementAreas: [String],
    detailedAnalysis: String,
    topicsToReview: [String],
    analyzedAt: Date
  },
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

#### 3. ContentInput Model
```javascript
{
  _id: String (custom: "content-{timestamp}-{random}"),
  userId: String (required, ref: 'User'),
  type: String (enum: ['url', 'file', 'manual']),
  source: String (required),
  content: String,
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## 🗄️ SQLite Database Schema Design

### Database File Location
- **Development**: `nodejs-backend/data/learnme.db`
- **Production**: Configurable via `DATABASE_PATH` environment variable

### Table Structures

#### 1. Users Table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  theme_preference TEXT CHECK(theme_preference IN ('light', 'dark', 'blue', 'green')),
  last_login_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at);
```

#### 2. Quizzes Table
```sql
CREATE TABLE quizzes (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  content_input_id TEXT,
  name TEXT,
  configuration_difficulty TEXT NOT NULL CHECK(configuration_difficulty IN ('Easy', 'Normal', 'Hard', 'Master')),
  configuration_number_of_questions INTEGER NOT NULL CHECK(configuration_number_of_questions >= 1 AND configuration_number_of_questions <= 50),
  configuration_time_duration INTEGER NOT NULL CHECK(configuration_time_duration >= 60 AND configuration_time_duration <= 7200),
  status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in-progress', 'completed', 'expired')),
  score INTEGER CHECK(score >= 0 AND score <= 100),
  correct_count INTEGER,
  incorrect_count INTEGER,
  start_time DATETIME,
  end_time DATETIME,
  pause_reason TEXT CHECK(pause_reason IN ('tab-change', 'manual')),
  paused_at DATETIME,
  pause_count INTEGER NOT NULL DEFAULT 0,
  analysis_performance_review TEXT,
  analysis_weak_areas TEXT, -- JSON array stored as TEXT
  analysis_suggestions TEXT, -- JSON array stored as TEXT
  analysis_strengths TEXT, -- JSON array stored as TEXT
  analysis_improvement_areas TEXT, -- JSON array stored as TEXT
  analysis_detailed_analysis TEXT,
  analysis_topics_to_review TEXT, -- JSON array stored as TEXT
  analysis_analyzed_at DATETIME,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (content_input_id) REFERENCES content_inputs(id) ON DELETE SET NULL
);

CREATE INDEX idx_quizzes_user_id ON quizzes(user_id);
CREATE INDEX idx_quizzes_status ON quizzes(status);
CREATE INDEX idx_quizzes_created_at ON quizzes(created_at);
CREATE INDEX idx_quizzes_content_input_id ON quizzes(content_input_id);
```

#### 3. Quiz Questions Table
```sql
CREATE TABLE quiz_questions (
  id TEXT PRIMARY KEY,
  quiz_id TEXT NOT NULL,
  question_id TEXT NOT NULL, -- The question.id from the original schema
  text TEXT NOT NULL,
  options TEXT NOT NULL, -- JSON array stored as TEXT
  correct_answer TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK(difficulty IN ('Easy', 'Normal', 'Hard', 'Master')),
  explanation TEXT,
  code_snippet TEXT,
  image_reference TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  UNIQUE(quiz_id, question_id)
);

CREATE INDEX idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
```

#### 4. Quiz Answers Table
```sql
CREATE TABLE quiz_answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  quiz_id TEXT NOT NULL,
  question_id TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
  UNIQUE(quiz_id, question_id)
);

CREATE INDEX idx_quiz_answers_quiz_id ON quiz_answers(quiz_id);
CREATE INDEX idx_quiz_answers_question_id ON quiz_answers(question_id);
```

#### 5. Content Inputs Table
```sql
CREATE TABLE content_inputs (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  type TEXT NOT NULL CHECK(type IN ('url', 'file', 'manual')),
  source TEXT NOT NULL,
  content TEXT,
  created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

CREATE INDEX idx_content_inputs_user_id ON content_inputs(user_id);
CREATE INDEX idx_content_inputs_type ON content_inputs(type);
CREATE INDEX idx_content_inputs_created_at ON content_inputs(created_at);
```

---

## 🔧 Technology Stack Changes

### Current Stack
- **Database**: MongoDB
- **ODM**: Mongoose
- **Package**: `mongoose@^8.19.3`

### New Stack
- **Database**: SQLite
- **ORM/Query Builder**: `better-sqlite3` (recommended) or `sqlite3` with `knex.js`
- **Packages to Install**:
  ```json
  {
    "better-sqlite3": "^11.0.0",
    "knex": "^3.0.0" // Optional: for query builder
  }
  ```
- **Packages to Remove**:
  ```json
  {
    "mongoose": "^8.19.3"
  }
  ```

### Recommended Approach: `better-sqlite3`
- **Pros**: 
  - Synchronous API (simpler code)
  - Better performance
  - No callbacks or promises needed
  - Built-in transaction support
- **Cons**: 
  - Synchronous (blocks event loop, but acceptable for SQLite)
  - Not suitable for high-concurrency scenarios (but SQLite isn't either)

---

## 📝 Implementation Steps

### Phase 1: Setup & Configuration

#### Step 1.1: Install Dependencies
```bash
cd nodejs-backend
npm install better-sqlite3
npm uninstall mongoose
```

#### Step 1.2: Create Database Directory
```bash
mkdir -p nodejs-backend/data
# Add data/ to .gitignore
echo "data/" >> .gitignore
```

#### Step 1.3: Update Environment Variables
```env
# Remove MongoDB URI
# MONGODB_URI=mongodb://localhost:27017/learnme

# Add SQLite database path
DATABASE_PATH=./data/learnme.db
# Or for production:
# DATABASE_PATH=/var/lib/learnme/learnme.db
```

#### Step 1.4: Create Database Connection Module
**File**: `nodejs-backend/src/config/db.js`

```javascript
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
```

### Phase 2: Database Schema Creation

#### Step 2.1: Create Migration Script
**File**: `nodejs-backend/src/config/schema.js`

```javascript
const { getDB } = require('./db');

/**
 * Initialize database schema
 */
const initializeSchema = () => {
  const db = getDB();

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Create Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      theme_preference TEXT CHECK(theme_preference IN ('light', 'dark', 'blue', 'green')),
      last_login_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
  `);

  // Create Content Inputs table
  db.exec(`
    CREATE TABLE IF NOT EXISTS content_inputs (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('url', 'file', 'manual')),
      source TEXT NOT NULL,
      content TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    );

    CREATE INDEX IF NOT EXISTS idx_content_inputs_user_id ON content_inputs(user_id);
    CREATE INDEX IF NOT EXISTS idx_content_inputs_type ON content_inputs(type);
    CREATE INDEX IF NOT EXISTS idx_content_inputs_created_at ON content_inputs(created_at);
  `);

  // Create Quizzes table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quizzes (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      content_input_id TEXT,
      name TEXT,
      configuration_difficulty TEXT NOT NULL CHECK(configuration_difficulty IN ('Easy', 'Normal', 'Hard', 'Master')),
      configuration_number_of_questions INTEGER NOT NULL CHECK(configuration_number_of_questions >= 1 AND configuration_number_of_questions <= 50),
      configuration_time_duration INTEGER NOT NULL CHECK(configuration_time_duration >= 60 AND configuration_time_duration <= 7200),
      status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'in-progress', 'completed', 'expired')),
      score INTEGER CHECK(score >= 0 AND score <= 100),
      correct_count INTEGER,
      incorrect_count INTEGER,
      start_time DATETIME,
      end_time DATETIME,
      pause_reason TEXT CHECK(pause_reason IN ('tab-change', 'manual')),
      paused_at DATETIME,
      pause_count INTEGER NOT NULL DEFAULT 0,
      analysis_performance_review TEXT,
      analysis_weak_areas TEXT,
      analysis_suggestions TEXT,
      analysis_strengths TEXT,
      analysis_improvement_areas TEXT,
      analysis_detailed_analysis TEXT,
      analysis_topics_to_review TEXT,
      analysis_analyzed_at DATETIME,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (content_input_id) REFERENCES content_inputs(id) ON DELETE SET NULL
    );

    CREATE INDEX IF NOT EXISTS idx_quizzes_user_id ON quizzes(user_id);
    CREATE INDEX IF NOT EXISTS idx_quizzes_status ON quizzes(status);
    CREATE INDEX IF NOT EXISTS idx_quizzes_created_at ON quizzes(created_at);
    CREATE INDEX IF NOT EXISTS idx_quizzes_content_input_id ON quizzes(content_input_id);
  `);

  // Create Quiz Questions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_questions (
      id TEXT PRIMARY KEY,
      quiz_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      text TEXT NOT NULL,
      options TEXT NOT NULL,
      correct_answer TEXT NOT NULL,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('Easy', 'Normal', 'Hard', 'Master')),
      explanation TEXT,
      code_snippet TEXT,
      image_reference TEXT,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
      UNIQUE(quiz_id, question_id)
    );

    CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz_id ON quiz_questions(quiz_id);
  `);

  // Create Quiz Answers table
  db.exec(`
    CREATE TABLE IF NOT EXISTS quiz_answers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      quiz_id TEXT NOT NULL,
      question_id TEXT NOT NULL,
      answer TEXT NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (quiz_id) REFERENCES quizzes(id) ON DELETE CASCADE,
      UNIQUE(quiz_id, question_id)
    );

    CREATE INDEX IF NOT EXISTS idx_quiz_answers_quiz_id ON quiz_answers(quiz_id);
    CREATE INDEX IF NOT EXISTS idx_quiz_answers_question_id ON quiz_answers(question_id);
  `);

  console.log('✅ Database schema initialized');
};

module.exports = { initializeSchema };
```

#### Step 2.2: Update index.js to Initialize Schema
**File**: `nodejs-backend/index.js`

```javascript
const { connectDB } = require('./src/config/db');
const { initializeSchema } = require('./src/config/schema');

// ... existing code ...

connectDB()
  .then(() => {
    // Initialize schema
    initializeSchema();
    
    app.listen(PORT, () => {
      // ... existing code ...
    });
  })
  .catch((error) => {
    // ... existing code ...
  });
```

### Phase 3: Model Migration

#### Step 3.1: Create User Model
**File**: `nodejs-backend/src/models/User.model.js`

```javascript
const { getDB } = require('../config/db');

/**
 * Generate custom ID
 */
const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * User Model
 */
class User {
  /**
   * Create a new user
   */
  static async create(userData) {
    const db = getDB();
    const id = generateId('user');
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO users (id, email, password_hash, theme_preference, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      userData.email.toLowerCase(),
      userData.passwordHash,
      userData.themePreference || null,
      now,
      now
    );

    return User.findById(id);
  }

  /**
   * Find user by ID
   */
  static async findById(id) {
    const db = getDB();
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    const row = stmt.get(id);
    return row ? User._mapRowToUser(row) : null;
  }

  /**
   * Find user by email
   */
  static async findOne(query) {
    const db = getDB();
    if (query.email) {
      const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
      const row = stmt.get(query.email.toLowerCase());
      return row ? User._mapRowToUser(row) : null;
    }
    return null;
  }

  /**
   * Update user
   */
  async save() {
    const db = getDB();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE users 
      SET email = ?, password_hash = ?, theme_preference = ?, last_login_at = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      this.email,
      this.passwordHash,
      this.themePreference,
      this.lastLoginAt,
      now,
      this.id
    );

    return User.findById(this.id);
  }

  /**
   * Convert to JSON (exclude passwordHash)
   */
  toJSON() {
    const obj = {
      id: this.id,
      email: this.email,
      themePreference: this.themePreference,
      lastLoginAt: this.lastLoginAt,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
    return obj;
  }

  /**
   * Map database row to User object
   */
  static _mapRowToUser(row) {
    const user = new User();
    user.id = row.id;
    user.email = row.email;
    user.passwordHash = row.password_hash;
    user.themePreference = row.theme_preference;
    user.lastLoginAt = row.last_login_at;
    user.createdAt = row.created_at;
    user.updatedAt = row.updated_at;
    return user;
  }
}

module.exports = User;
```

#### Step 3.2: Create ContentInput Model
**File**: `nodejs-backend/src/models/ContentInput.model.js`

```javascript
const { getDB } = require('../config/db');

/**
 * Generate custom ID
 */
const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * ContentInput Model
 */
class ContentInput {
  /**
   * Create a new content input
   */
  static async create(contentData) {
    const db = getDB();
    const id = generateId('content');
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      INSERT INTO content_inputs (id, user_id, type, source, content, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      contentData.userId,
      contentData.type,
      contentData.source,
      contentData.content || null,
      now,
      now
    );

    return ContentInput.findById(id);
  }

  /**
   * Find content input by ID
   */
  static async findById(id) {
    const db = getDB();
    const stmt = db.prepare('SELECT * FROM content_inputs WHERE id = ?');
    const row = stmt.get(id);
    return row ? ContentInput._mapRowToContentInput(row) : null;
  }

  /**
   * Find all content inputs by user ID
   */
  static async find(query) {
    const db = getDB();
    if (query.userId) {
      const stmt = db.prepare('SELECT * FROM content_inputs WHERE user_id = ? ORDER BY created_at DESC');
      const rows = stmt.all(query.userId);
      return rows.map(row => ContentInput._mapRowToContentInput(row));
    }
    return [];
  }

  /**
   * Update content input
   */
  async save() {
    const db = getDB();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE content_inputs 
      SET type = ?, source = ?, content = ?, updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      this.type,
      this.source,
      this.content,
      now,
      this.id
    );

    return ContentInput.findById(this.id);
  }

  /**
   * Delete content input
   */
  async delete() {
    const db = getDB();
    const stmt = db.prepare('DELETE FROM content_inputs WHERE id = ?');
    stmt.run(this.id);
    return true;
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    return {
      id: this.id,
      userId: this.userId,
      type: this.type,
      source: this.source,
      content: this.content,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Map database row to ContentInput object
   */
  static _mapRowToContentInput(row) {
    const contentInput = new ContentInput();
    contentInput.id = row.id;
    contentInput.userId = row.user_id;
    contentInput.type = row.type;
    contentInput.source = row.source;
    contentInput.content = row.content;
    contentInput.createdAt = row.created_at;
    contentInput.updatedAt = row.updated_at;
    return contentInput;
  }
}

module.exports = ContentInput;
```

#### Step 3.3: Create Quiz Model
**File**: `nodejs-backend/src/models/Quiz.model.js`

```javascript
const { getDB } = require('../config/db');

/**
 * Generate custom ID
 */
const generateId = (prefix) => {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
};

/**
 * Quiz Model
 */
class Quiz {
  /**
   * Create a new quiz
   */
  static async create(quizData) {
    const db = getDB();
    const id = generateId('quiz');
    const now = new Date().toISOString();

    // Start transaction
    const transaction = db.transaction(() => {
      // Insert quiz
      const quizStmt = db.prepare(`
        INSERT INTO quizzes (
          id, user_id, content_input_id, name,
          configuration_difficulty, configuration_number_of_questions, configuration_time_duration,
          status, created_at, updated_at
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      quizStmt.run(
        id,
        quizData.userId,
        quizData.contentInputId || null,
        quizData.name || null,
        quizData.configuration.difficulty,
        quizData.configuration.numberOfQuestions,
        quizData.configuration.timeDuration,
        quizData.status || 'pending',
        now,
        now
      );

      // Insert questions
      if (quizData.questions && quizData.questions.length > 0) {
        const questionStmt = db.prepare(`
          INSERT INTO quiz_questions (
            id, quiz_id, question_id, text, options, correct_answer, difficulty,
            explanation, code_snippet, image_reference, created_at
          )
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        for (const question of quizData.questions) {
          questionStmt.run(
            `${id}-q-${question.id}`,
            id,
            question.id,
            question.text,
            JSON.stringify(question.options),
            question.correctAnswer,
            question.difficulty,
            question.explanation || null,
            question.codeSnippet || null,
            question.imageReference || null,
            now
          );
        }
      }
    });

    transaction();

    return Quiz.findById(id);
  }

  /**
   * Find quiz by ID
   */
  static async findById(id) {
    const db = getDB();
    
    // Get quiz
    const quizStmt = db.prepare('SELECT * FROM quizzes WHERE id = ?');
    const quizRow = quizStmt.get(id);
    
    if (!quizRow) {
      return null;
    }

    // Get questions
    const questionsStmt = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ?');
    const questionRows = questionsStmt.all(id);

    // Get answers
    const answersStmt = db.prepare('SELECT question_id, answer FROM quiz_answers WHERE quiz_id = ?');
    const answerRows = answersStmt.all(id);

    return Quiz._mapRowToQuiz(quizRow, questionRows, answerRows);
  }

  /**
   * Find quizzes by user ID
   */
  static async find(query) {
    const db = getDB();
    
    if (query.userId) {
      const stmt = db.prepare('SELECT * FROM quizzes WHERE user_id = ? ORDER BY created_at DESC');
      const quizRows = stmt.all(query.userId);
      
      const quizzes = [];
      for (const quizRow of quizRows) {
        const questionsStmt = db.prepare('SELECT * FROM quiz_questions WHERE quiz_id = ?');
        const questionRows = questionsStmt.all(quizRow.id);
        
        const answersStmt = db.prepare('SELECT question_id, answer FROM quiz_answers WHERE quiz_id = ?');
        const answerRows = answersStmt.all(quizRow.id);
        
        quizzes.push(Quiz._mapRowToQuiz(quizRow, questionRows, answerRows));
      }
      
      return quizzes;
    }
    
    return [];
  }

  /**
   * Update quiz
   */
  async save() {
    const db = getDB();
    const now = new Date().toISOString();

    const stmt = db.prepare(`
      UPDATE quizzes 
      SET 
        name = ?, 
        status = ?, 
        score = ?, 
        correct_count = ?, 
        incorrect_count = ?,
        start_time = ?, 
        end_time = ?,
        pause_reason = ?,
        paused_at = ?,
        pause_count = ?,
        analysis_performance_review = ?,
        analysis_weak_areas = ?,
        analysis_suggestions = ?,
        analysis_strengths = ?,
        analysis_improvement_areas = ?,
        analysis_detailed_analysis = ?,
        analysis_topics_to_review = ?,
        analysis_analyzed_at = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      this.name,
      this.status,
      this.score,
      this.correctCount,
      this.incorrectCount,
      this.startTime,
      this.endTime,
      this.pauseReason,
      this.pausedAt,
      this.pauseCount,
      this.analysis?.performanceReview || null,
      this.analysis?.weakAreas ? JSON.stringify(this.analysis.weakAreas) : null,
      this.analysis?.suggestions ? JSON.stringify(this.analysis.suggestions) : null,
      this.analysis?.strengths ? JSON.stringify(this.analysis.strengths) : null,
      this.analysis?.improvementAreas ? JSON.stringify(this.analysis.improvementAreas) : null,
      this.analysis?.detailedAnalysis || null,
      this.analysis?.topicsToReview ? JSON.stringify(this.analysis.topicsToReview) : null,
      this.analysis?.analyzedAt || null,
      now,
      this.id
    );

    // Update answers if provided
    if (this.answers && Object.keys(this.answers).length > 0) {
      const answerStmt = db.prepare(`
        INSERT OR REPLACE INTO quiz_answers (quiz_id, question_id, answer, updated_at)
        VALUES (?, ?, ?, ?)
      `);

      for (const [questionId, answer] of Object.entries(this.answers)) {
        answerStmt.run(this.id, questionId, answer, now);
      }
    }

    return Quiz.findById(this.id);
  }

  /**
   * Convert to JSON
   */
  toJSON() {
    const answers = this.answers instanceof Map 
      ? Object.fromEntries(this.answers) 
      : this.answers || {};

    return {
      id: this.id,
      userId: this.userId,
      contentInputId: this.contentInputId,
      name: this.name,
      configuration: this.configuration,
      questions: this.questions,
      answers: answers,
      status: this.status,
      score: this.score,
      correctCount: this.correctCount,
      incorrectCount: this.incorrectCount,
      startTime: this.startTime,
      endTime: this.endTime,
      pauseReason: this.pauseReason,
      pausedAt: this.pausedAt,
      pauseCount: this.pauseCount,
      analysis: this.analysis,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt
    };
  }

  /**
   * Map database rows to Quiz object
   */
  static _mapRowToQuiz(quizRow, questionRows, answerRows) {
    const quiz = new Quiz();
    
    // Basic fields
    quiz.id = quizRow.id;
    quiz.userId = quizRow.user_id;
    quiz.contentInputId = quizRow.content_input_id;
    quiz.name = quizRow.name;
    quiz.status = quizRow.status;
    quiz.score = quizRow.score;
    quiz.correctCount = quizRow.correct_count;
    quiz.incorrectCount = quizRow.incorrect_count;
    quiz.startTime = quizRow.start_time;
    quiz.endTime = quizRow.end_time;
    quiz.pauseReason = quizRow.pause_reason;
    quiz.pausedAt = quizRow.paused_at;
    quiz.pauseCount = quizRow.pause_count;
    quiz.createdAt = quizRow.created_at;
    quiz.updatedAt = quizRow.updated_at;

    // Configuration
    quiz.configuration = {
      difficulty: quizRow.configuration_difficulty,
      numberOfQuestions: quizRow.configuration_number_of_questions,
      timeDuration: quizRow.configuration_time_duration
    };

    // Questions
    quiz.questions = questionRows.map(row => ({
      id: row.question_id,
      text: row.text,
      options: JSON.parse(row.options),
      correctAnswer: row.correct_answer,
      difficulty: row.difficulty,
      explanation: row.explanation,
      codeSnippet: row.code_snippet,
      imageReference: row.image_reference
    }));

    // Answers
    quiz.answers = {};
    answerRows.forEach(row => {
      quiz.answers[row.question_id] = row.answer;
    });

    // Analysis
    if (quizRow.analysis_performance_review || quizRow.analysis_weak_areas) {
      quiz.analysis = {
        performanceReview: quizRow.analysis_performance_review,
        weakAreas: quizRow.analysis_weak_areas ? JSON.parse(quizRow.analysis_weak_areas) : [],
        suggestions: quizRow.analysis_suggestions ? JSON.parse(quizRow.analysis_suggestions) : [],
        strengths: quizRow.analysis_strengths ? JSON.parse(quizRow.analysis_strengths) : [],
        improvementAreas: quizRow.analysis_improvement_areas ? JSON.parse(quizRow.analysis_improvement_areas) : [],
        detailedAnalysis: quizRow.analysis_detailed_analysis,
        topicsToReview: quizRow.analysis_topics_to_review ? JSON.parse(quizRow.analysis_topics_to_review) : [],
        analyzedAt: quizRow.analysis_analyzed_at
      };
    }

    return quiz;
  }
}

module.exports = Quiz;
```

### Phase 4: Controller Updates

#### Step 4.1: Update Error Handling
MongoDB-specific error codes need to be replaced:

**Before (MongoDB)**:
```javascript
if (error.code === 11000) { // Duplicate key error
  // Handle duplicate email
}
```

**After (SQLite)**:
```javascript
if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
  // Handle duplicate email
}
```

#### Step 4.2: Update Query Methods
All Mongoose queries need to be replaced with SQLite queries:

**Before (Mongoose)**:
```javascript
const user = await User.findOne({ email: email.toLowerCase() });
const quizzes = await Quiz.find({ userId: req.authUser.userId }).sort({ createdAt: -1 });
```

**After (SQLite)**:
```javascript
const user = await User.findOne({ email: email.toLowerCase() });
const quizzes = await Quiz.find({ userId: req.authUser.userId }); // Already sorted in model
```

### Phase 5: Data Migration (Optional)

If you have existing MongoDB data, create a migration script:

**File**: `nodejs-backend/scripts/migrate-mongodb-to-sqlite.js`

```javascript
const mongoose = require('mongoose');
const { connectDB, getDB } = require('../src/config/db');
const { initializeSchema } = require('../src/config/schema');

// Connect to MongoDB
const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/learnme';
mongoose.connect(mongoURI);

// Import MongoDB models
const UserMongo = mongoose.model('User', require('../src/models/User.model').schema);
const QuizMongo = mongoose.model('Quiz', require('../src/models/Quiz.model').schema);
const ContentInputMongo = mongoose.model('ContentInput', require('../src/models/ContentInput.model').schema);

// Connect to SQLite
connectDB();
initializeSchema();
const db = getDB();

async function migrate() {
  console.log('🚀 Starting migration from MongoDB to SQLite...\n');

  // Migrate Users
  console.log('📦 Migrating users...');
  const users = await UserMongo.find();
  const userStmt = db.prepare(`
    INSERT INTO users (id, email, password_hash, theme_preference, last_login_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const user of users) {
    userStmt.run(
      user._id,
      user.email,
      user.passwordHash,
      user.themePreference,
      user.lastLoginAt,
      user.createdAt,
      user.updatedAt
    );
  }
  console.log(`✅ Migrated ${users.length} users`);

  // Migrate Content Inputs
  console.log('📦 Migrating content inputs...');
  const contentInputs = await ContentInputMongo.find();
  const contentStmt = db.prepare(`
    INSERT INTO content_inputs (id, user_id, type, source, content, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const content of contentInputs) {
    contentStmt.run(
      content._id,
      content.userId,
      content.type,
      content.source,
      content.content,
      content.createdAt,
      content.updatedAt
    );
  }
  console.log(`✅ Migrated ${contentInputs.length} content inputs`);

  // Migrate Quizzes
  console.log('📦 Migrating quizzes...');
  const quizzes = await QuizMongo.find();
  
  const quizStmt = db.prepare(`
    INSERT INTO quizzes (
      id, user_id, content_input_id, name,
      configuration_difficulty, configuration_number_of_questions, configuration_time_duration,
      status, score, correct_count, incorrect_count,
      start_time, end_time, pause_reason, paused_at, pause_count,
      analysis_performance_review, analysis_weak_areas, analysis_suggestions,
      analysis_strengths, analysis_improvement_areas, analysis_detailed_analysis,
      analysis_topics_to_review, analysis_analyzed_at,
      created_at, updated_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const questionStmt = db.prepare(`
    INSERT INTO quiz_questions (
      id, quiz_id, question_id, text, options, correct_answer, difficulty,
      explanation, code_snippet, image_reference, created_at
    )
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const answerStmt = db.prepare(`
    INSERT INTO quiz_answers (quiz_id, question_id, answer, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  for (const quiz of quizzes) {
    // Insert quiz
    const answers = quiz.answers instanceof Map 
      ? Object.fromEntries(quiz.answers) 
      : quiz.answers || {};

    quizStmt.run(
      quiz._id,
      quiz.userId,
      quiz.contentInputId,
      quiz.name,
      quiz.configuration.difficulty,
      quiz.configuration.numberOfQuestions,
      quiz.configuration.timeDuration,
      quiz.status,
      quiz.score,
      quiz.correctCount,
      quiz.incorrectCount,
      quiz.startTime,
      quiz.endTime,
      quiz.pauseReason,
      quiz.pausedAt,
      quiz.pauseCount || 0,
      quiz.analysis?.performanceReview,
      quiz.analysis?.weakAreas ? JSON.stringify(quiz.analysis.weakAreas) : null,
      quiz.analysis?.suggestions ? JSON.stringify(quiz.analysis.suggestions) : null,
      quiz.analysis?.strengths ? JSON.stringify(quiz.analysis.strengths) : null,
      quiz.analysis?.improvementAreas ? JSON.stringify(quiz.analysis.improvementAreas) : null,
      quiz.analysis?.detailedAnalysis,
      quiz.analysis?.topicsToReview ? JSON.stringify(quiz.analysis.topicsToReview) : null,
      quiz.analysis?.analyzedAt,
      quiz.createdAt,
      quiz.updatedAt
    );

    // Insert questions
    for (const question of quiz.questions || []) {
      questionStmt.run(
        `${quiz._id}-q-${question.id}`,
        quiz._id,
        question.id,
        question.text,
        JSON.stringify(question.options),
        question.correctAnswer,
        question.difficulty,
        question.explanation,
        question.codeSnippet,
        question.imageReference,
        quiz.createdAt
      );
    }

    // Insert answers
    for (const [questionId, answer] of Object.entries(answers)) {
      answerStmt.run(
        quiz._id,
        questionId,
        answer,
        quiz.updatedAt,
        quiz.updatedAt
      );
    }
  }
  console.log(`✅ Migrated ${quizzes.length} quizzes`);

  console.log('\n✅ Migration completed successfully!');
  process.exit(0);
}

migrate().catch(error => {
  console.error('❌ Migration failed:', error);
  process.exit(1);
});
```

---

## 🧪 Testing Requirements

### Unit Tests
1. **Model Tests**: Test all CRUD operations for each model
2. **Query Tests**: Test find, findOne, create, update, delete
3. **Relationship Tests**: Test foreign key constraints
4. **Validation Tests**: Test enum constraints and check constraints

### Integration Tests
1. **API Tests**: Test all endpoints work with SQLite
2. **Transaction Tests**: Test transaction rollback on errors
3. **Concurrency Tests**: Test concurrent read/write operations

### Test Files to Create
- `nodejs-backend/src/models/__tests__/User.model.test.js`
- `nodejs-backend/src/models/__tests__/Quiz.model.test.js`
- `nodejs-backend/src/models/__tests__/ContentInput.model.test.js`
- `nodejs-backend/src/config/__tests__/db.test.js`

---

## 🔄 Rollback Plan

### If Migration Fails
1. **Keep MongoDB Connection**: Don't remove MongoDB code until SQLite is fully tested
2. **Feature Flag**: Use environment variable to switch between databases
3. **Data Backup**: Always backup MongoDB data before migration
4. **Gradual Rollout**: Test SQLite in development/staging first

### Rollback Steps
1. Revert code changes
2. Restore MongoDB connection
3. Restore from backup if needed
4. Update environment variables

---

## 📋 Checklist

### Pre-Migration
- [ ] Backup MongoDB database
- [ ] Review all MongoDB queries in codebase
- [ ] Document all model relationships
- [ ] Create test database for SQLite

### Migration
- [ ] Install `better-sqlite3`
- [ ] Remove `mongoose` dependency
- [ ] Create database connection module
- [ ] Create schema initialization
- [ ] Migrate User model
- [ ] Migrate ContentInput model
- [ ] Migrate Quiz model
- [ ] Update all controllers
- [ ] Update error handling
- [ ] Test all API endpoints

### Post-Migration
- [ ] Run full test suite
- [ ] Performance testing
- [ ] Data migration (if needed)
- [ ] Update documentation
- [ ] Update environment variables
- [ ] Deploy to staging
- [ ] Monitor for issues
- [ ] Deploy to production

---

## 🚀 Deployment Considerations

### Environment Variables
```env
# Remove
# MONGODB_URI=mongodb://localhost:27017/learnme

# Add
DATABASE_PATH=./data/learnme.db
```

### File Permissions
- Ensure database directory is writable
- Set proper permissions for production:
  ```bash
  chmod 755 data/
  chmod 644 data/learnme.db
  ```

### Backup Strategy
- SQLite database is a single file - easy to backup
- Regular backups: `cp learnme.db learnme.db.backup`
- Consider automated backup scripts

### Performance Considerations
- SQLite is suitable for single-server deployments
- For high concurrency, consider connection pooling
- Enable WAL mode (already included in connection code)
- Regular VACUUM for database optimization

---

## 📚 Additional Resources

- [better-sqlite3 Documentation](https://github.com/WiseLibs/better-sqlite3)
- [SQLite Documentation](https://www.sqlite.org/docs.html)
- [SQLite Best Practices](https://www.sqlite.org/faq.html)

---

## ⚠️ Important Notes

1. **No Concurrent Writes**: SQLite handles concurrent reads well, but write operations lock the database. For high-concurrency write scenarios, consider PostgreSQL instead.

2. **File Size Limits**: SQLite databases can grow large. Monitor file size and implement cleanup strategies.

3. **Transaction Safety**: Always use transactions for multi-step operations.

4. **JSON Storage**: Arrays and objects are stored as JSON strings. Always parse/stringify when reading/writing.

5. **Date Handling**: SQLite stores dates as ISO strings. Convert to/from Date objects as needed.

---

**Document Version**: 1.0  
**Last Updated**: 2024  
**Status**: Ready for Implementation

