const { getDB } = require('./db');

/**
* Initialize database schema
*/
const initializeSchema = async () => {
  const db = getDB();

  // Enable foreign keys
  await db.pragma('foreign_keys = ON');

  // Detect legacy users table with email/password columns
  const userTableInfo = await db.all(`PRAGMA table_info(users);`);
  const hasLegacyUserTable =
    Array.isArray(userTableInfo) &&
    userTableInfo.length > 0 &&
    userTableInfo.some((column) => column.name === 'email');

  if (hasLegacyUserTable) {
    await db.exec('DROP TABLE IF EXISTS users;');
  }

  // Create Users table (without email/password)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      theme_preference TEXT CHECK(theme_preference IN ('light', 'dark', 'blue', 'green')),
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_created_at ON users(created_at);
  `);

  // Migrate: Add AI config columns if they don't exist
  const currentColumns = await db.all(`PRAGMA table_info(users);`);
  const columnNames = currentColumns.map((col) => col.name);

  if (!columnNames.includes('ai_provider')) {
    await db.exec(`ALTER TABLE users ADD COLUMN ai_provider TEXT CHECK(ai_provider IN ('gemini', 'openai'));`);
    console.log('✅ Added ai_provider column to users table');
  }

  if (!columnNames.includes('ai_api_key')) {
    await db.exec(`ALTER TABLE users ADD COLUMN ai_api_key TEXT;`);
    console.log('✅ Added ai_api_key column to users table');
  }

  if (!columnNames.includes('ai_model')) {
    await db.exec(`ALTER TABLE users ADD COLUMN ai_model TEXT;`);
    console.log('✅ Added ai_model column to users table');
  }

  if (!columnNames.includes('ai_base_url')) {
    await db.exec(`ALTER TABLE users ADD COLUMN ai_base_url TEXT;`);
    console.log('✅ Added ai_base_url column to users table');
  }

  // Seed local user for anonymous usage
  await db.run(
    `
      INSERT OR IGNORE INTO users (id)
      VALUES (?)
    `,
    ['local-user']
  );

  // Create Content Inputs table
  await db.exec(`
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
  await db.exec(`
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
  await db.exec(`
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

