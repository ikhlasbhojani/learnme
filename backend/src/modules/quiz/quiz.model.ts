import mongoose, { Schema, Document, Model } from 'mongoose'

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
  codeSnippet?: string | null
  imageReference?: string | null
}

export interface IQuizAnalysis {
  performanceReview?: string
  weakAreas?: string[]
  suggestions?: string[]
  detailedAnalysis?: string
  strengths?: string[]
  improvementAreas?: string[]
  topicsToReview?: string[]
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

export interface IQuizDocument extends IQuiz, Document {
  toJSON(): IQuiz & { id: string; userId: string; contentInputId?: string | null }
}

const quizConfigurationSchema = new Schema<IQuizConfiguration>(
  {
    difficulty: {
      type: String,
      enum: ['Easy', 'Normal', 'Hard', 'Master'],
      required: true,
    },
    numberOfQuestions: {
      type: Number,
      required: true,
    },
    timeDuration: {
      type: Number,
      required: true,
    },
  },
  { _id: false }
)

const quizQuestionSchema = new Schema<IQuizQuestion>(
  {
    id: { type: String, required: true },
    text: { type: String, required: true },
    options: { type: [String], required: true },
    correctAnswer: { type: String, required: true },
    difficulty: {
      type: String,
      enum: ['Easy', 'Normal', 'Hard', 'Master'],
      required: true,
    },
    explanation: { type: String, default: null },
    codeSnippet: { type: String, default: null },
    imageReference: { type: String, default: null },
  },
  { _id: false }
)

const quizAnalysisSchema = new Schema<IQuizAnalysis>(
  {
    performanceReview: { type: String },
    weakAreas: { type: [String] },
    suggestions: { type: [String] },
    detailedAnalysis: { type: String },
    strengths: { type: [String] },
    improvementAreas: { type: [String] },
    analyzedAt: { type: Date, default: null },
  },
  { _id: false }
)

const quizSchema = new Schema<IQuizDocument>(
  {
    _id: {
      type: String,
      default: () => `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    },
    userId: {
      type: String,
      required: true,
    },
    contentInputId: {
      type: String,
      default: null,
    },
    name: {
      type: String,
      default: null,
    },
    configuration: {
      type: quizConfigurationSchema,
      required: true,
    },
    questions: {
      type: [quizQuestionSchema],
      required: true,
    },
    answers: {
      type: Schema.Types.Mixed,
      default: {},
    },
    startTime: {
      type: Date,
      default: null,
    },
    endTime: {
      type: Date,
      default: null,
    },
    status: {
      type: String,
      enum: ['pending', 'in-progress', 'completed', 'expired'],
      required: true,
      default: 'pending',
    },
    score: {
      type: Number,
      default: null,
    },
    correctCount: {
      type: Number,
      default: null,
    },
    incorrectCount: {
      type: Number,
      default: null,
    },
    pauseReason: {
      type: String,
      enum: ['tab-change', 'manual'],
      default: null,
    },
    pausedAt: {
      type: Date,
      default: null,
    },
    pauseCount: {
      type: Number,
      default: 0,
    },
    analysis: {
      type: quizAnalysisSchema,
      default: null,
    },
  },
  {
    timestamps: true,
    _id: false,
    id: true,
    toJSON: {
      transform: function (doc, ret) {
        delete ret.__v
        ret.id = ret._id
        delete ret._id
        return ret
      },
    },
  }
)

// Create indexes (compound index covers both userId and status queries)
quizSchema.index({ userId: 1, status: 1 })

const QuizModel = mongoose.model<IQuizDocument>('Quiz', quizSchema)

// Static methods for compatibility with existing code - wrap original Mongoose methods
const originalFindById = QuizModel.findById.bind(QuizModel)
const originalFind = QuizModel.find.bind(QuizModel)
const originalCreate = QuizModel.create.bind(QuizModel)

QuizModel.findById = async function (id: string): Promise<IQuizDocument | null> {
  // For custom string _id fields, we need to query by _id directly
  // Use mongoose directly instead of our custom override
  return await mongoose.model<IQuizDocument>('Quiz').findOne({ _id: id })
}

QuizModel.find = async function (query: { userId?: string; status?: QuizStatus }): Promise<IQuizDocument[]> {
  const mongoQuery: any = {}
  if (query.userId) mongoQuery.userId = query.userId
  if (query.status) mongoQuery.status = query.status
  
  return await originalFind(mongoQuery).sort({ createdAt: -1 })
}

QuizModel.create = async function (data: {
  userId: string
  contentInputId?: string | null
  name?: string | null
  configuration: IQuizConfiguration
  questions: IQuizQuestion[]
  answers?: Record<string, string>
  status?: QuizStatus
}): Promise<IQuizDocument> {
  return await originalCreate({
    _id: `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`,
    userId: data.userId,
    contentInputId: data.contentInputId || null,
    name: data.name || null,
    configuration: data.configuration,
    questions: data.questions,
    answers: data.answers || {},
    status: data.status || 'pending',
  })
}

QuizModel.update = async function (id: string, updates: Partial<{
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
  const updated = await QuizModel.findByIdAndUpdate(
    id,
    { $set: updates },
    { new: true, runValidators: true }
  )
  if (!updated) {
    throw new Error('Quiz not found')
  }
  return updated
}

// Export with static methods
export const Quiz = QuizModel as typeof QuizModel & {
  findById(id: string): Promise<IQuizDocument | null>
  find(query: { userId?: string; status?: QuizStatus }): Promise<IQuizDocument[]>
  create(data: {
    userId: string
    contentInputId?: string | null
    name?: string | null
    configuration: IQuizConfiguration
    questions: IQuizQuestion[]
    answers?: Record<string, string>
    status?: QuizStatus
  }): Promise<IQuizDocument>
  update(id: string, updates: Partial<{
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
  }>): Promise<IQuizDocument>
}

export default Quiz
