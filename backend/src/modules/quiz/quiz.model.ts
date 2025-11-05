import { getDatabase } from '../../config/database'
import { generateId } from '../../config/schema'

export type QuizStatus = 'pending' | 'in-progress' | 'completed' | 'expired'
export type QuizPauseReason = 'tab-change' | 'manual'
export type QuizDifficulty = 'Easy' | 'Normal' | 'Hard' | 'Master'

export interface IQuizConfiguration {
  difficulty: QuizDifficulty
  numberOfQuestions: number
  timeDuration: number
}

export interface IQuizQuestion {
  id: string
  text: string
  options: string[]
  correctAnswer: string
  difficulty: QuizDifficulty
  explanation?: string | null
}

export interface IQuizAnalysis {
  performanceReview?: string
  weakAreas?: string[]
  suggestions?: string[]
  detailedAnalysis?: string
  strengths?: string[]
  improvementAreas?: string[]
  analyzedAt?: Date | null
}

export interface IQuiz {
  id: string
  userId: string
  contentInputId?: string | null
  name?: string | null
  configuration: IQuizConfiguration
  questions: IQuizQuestion[]
  answers: Record<string, string>
  startTime?: Date | null
  endTime?: Date | null
  status: QuizStatus
  score?: number | null
  correctCount?: number | null
  incorrectCount?: number | null
  pauseReason?: QuizPauseReason | null
  pausedAt?: Date | null
  pauseCount?: number
  analysis?: IQuizAnalysis | null
  createdAt: Date
  updatedAt: Date
}

export interface IQuizDocument extends IQuiz {
  toJSON(): IQuiz & { id: string; userId: string; contentInputId?: string | null }
}

/**
 * Convert database row to Quiz object
 */
function rowToQuiz(row: any): IQuizDocument {
  return {
    id: row.id,
    userId: row.userId,
    contentInputId: row.contentInputId || null,
    name: row.name || null,
    configuration: JSON.parse(row.configuration),
    questions: JSON.parse(row.questions),
    answers: JSON.parse(row.answers || '{}'),
    startTime: row.startTime ? new Date(row.startTime) : null,
    endTime: row.endTime ? new Date(row.endTime) : null,
    status: row.status as QuizStatus,
    score: row.score !== null ? row.score : null,
    correctCount: row.correctCount !== null ? row.correctCount : null,
    incorrectCount: row.incorrectCount !== null ? row.incorrectCount : null,
    pauseReason: row.pauseReason || null,
    pausedAt: row.pausedAt ? new Date(row.pausedAt) : null,
    pauseCount: row.pauseCount || 0,
    analysis: row.analysis ? JSON.parse(row.analysis) : null,
    createdAt: new Date(row.createdAt),
    updatedAt: new Date(row.updatedAt),
    toJSON() {
      return {
        id: this.id,
        userId: this.userId,
        contentInputId: this.contentInputId,
        name: this.name,
        configuration: this.configuration,
        questions: this.questions,
        answers: this.answers,
        startTime: this.startTime,
        endTime: this.endTime,
        status: this.status,
        score: this.score,
        correctCount: this.correctCount,
        incorrectCount: this.incorrectCount,
        pauseReason: this.pauseReason,
        pausedAt: this.pausedAt,
        pauseCount: this.pauseCount,
        analysis: this.analysis,
        createdAt: this.createdAt,
        updatedAt: this.updatedAt,
      }
    },
  }
}

export const Quiz = {
  async findById(id: string): Promise<IQuizDocument | null> {
    const db = getDatabase()
    const row = db.prepare('SELECT * FROM quizzes WHERE id = ?').get(id)
    return row ? rowToQuiz(row) : null
  },

  async find(query: { userId?: string; status?: QuizStatus }): Promise<IQuizDocument[]> {
    const db = getDatabase()
    let rows: any[]

    if (query.userId && query.status) {
      rows = db.prepare('SELECT * FROM quizzes WHERE userId = ? AND status = ? ORDER BY createdAt DESC').all(query.userId, query.status)
    } else if (query.userId) {
      rows = db.prepare('SELECT * FROM quizzes WHERE userId = ? ORDER BY createdAt DESC').all(query.userId)
    } else if (query.status) {
      rows = db.prepare('SELECT * FROM quizzes WHERE status = ? ORDER BY createdAt DESC').all(query.status)
    } else {
      rows = db.prepare('SELECT * FROM quizzes ORDER BY createdAt DESC').all()
    }

    return rows.map(rowToQuiz)
  },

  async create(data: {
    userId: string
    contentInputId?: string | null
    name?: string | null
    configuration: IQuizConfiguration
    questions: IQuizQuestion[]
    answers?: Record<string, string>
    status?: QuizStatus
  }): Promise<IQuizDocument> {
    const db = getDatabase()
    const id = generateId()
    const now = new Date().toISOString()

    db.prepare(`
      INSERT INTO quizzes (
        id, userId, contentInputId, name, configuration, questions, answers,
        status, createdAt, updatedAt
      )
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id,
      data.userId,
      data.contentInputId || null,
      data.name || null,
      JSON.stringify(data.configuration),
      JSON.stringify(data.questions),
      JSON.stringify(data.answers || {}),
      data.status || 'pending',
      now,
      now
    )

    const quiz = await Quiz.findById(id)
    if (!quiz) {
      throw new Error('Failed to create quiz')
    }

    return quiz
  },

  async update(id: string, updates: Partial<{
    name: string | null
    status: QuizStatus
    startTime: Date | null
    endTime: Date | null
    score: number | null
    correctCount: number | null
    incorrectCount: number | null
    pauseReason: QuizPauseReason | null
    pausedAt: Date | null
    pauseCount: number
    analysis: IQuizAnalysis | null
    answers: Record<string, string>
  }>): Promise<IQuizDocument> {
    const db = getDatabase()
    const now = new Date().toISOString()

    const setParts: string[] = []
    const values: any[] = []

    if (typeof updates.name !== 'undefined') {
      setParts.push('name = ?')
      values.push(updates.name || null)
    }

    if (typeof updates.status !== 'undefined') {
      setParts.push('status = ?')
      values.push(updates.status)
    }

    if (typeof updates.startTime !== 'undefined') {
      setParts.push('startTime = ?')
      values.push(updates.startTime ? updates.startTime.toISOString() : null)
    }

    if (typeof updates.endTime !== 'undefined') {
      setParts.push('endTime = ?')
      values.push(updates.endTime ? updates.endTime.toISOString() : null)
    }

    if (typeof updates.score !== 'undefined') {
      setParts.push('score = ?')
      values.push(updates.score !== null ? updates.score : null)
    }

    if (typeof updates.correctCount !== 'undefined') {
      setParts.push('correctCount = ?')
      values.push(updates.correctCount !== null ? updates.correctCount : null)
    }

    if (typeof updates.incorrectCount !== 'undefined') {
      setParts.push('incorrectCount = ?')
      values.push(updates.incorrectCount !== null ? updates.incorrectCount : null)
    }

    if (typeof updates.pauseReason !== 'undefined') {
      setParts.push('pauseReason = ?')
      values.push(updates.pauseReason || null)
    }

    if (typeof updates.pausedAt !== 'undefined') {
      setParts.push('pausedAt = ?')
      values.push(updates.pausedAt ? updates.pausedAt.toISOString() : null)
    }

    if (typeof updates.pauseCount !== 'undefined') {
      setParts.push('pauseCount = ?')
      values.push(updates.pauseCount)
    }

    if (typeof updates.analysis !== 'undefined') {
      setParts.push('analysis = ?')
      values.push(updates.analysis ? JSON.stringify(updates.analysis) : null)
    }

    if (typeof updates.answers !== 'undefined') {
      setParts.push('answers = ?')
      values.push(JSON.stringify(updates.answers))
    }

    if (setParts.length === 0) {
      const existing = await Quiz.findById(id)
      if (!existing) {
        throw new Error('Quiz not found')
      }
      return existing
    }

    setParts.push('updatedAt = ?')
    values.push(now)
    values.push(id)

    db.prepare(`
      UPDATE quizzes
      SET ${setParts.join(', ')}
      WHERE id = ?
    `).run(...values)

    const updated = await Quiz.findById(id)
    if (!updated) {
      throw new Error('Quiz not found after update')
    }

    return updated
  },
}

export default Quiz
