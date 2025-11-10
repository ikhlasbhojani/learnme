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
