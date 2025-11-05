import { Schema, model, type Document, type Model, Types } from 'mongoose'

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
  user: Types.ObjectId
  contentInput?: Types.ObjectId | null
  name?: string | null
  configuration: IQuizConfiguration
  questions: IQuizQuestion[]
  answers: Map<string, string> | Record<string, string>
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
}

export interface IQuizDocument extends IQuiz, Document {
  createdAt: Date
  updatedAt: Date
}

export type QuizModel = Model<IQuizDocument>

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
      min: 1,
      max: 100,
    },
    timeDuration: {
      type: Number,
      required: true,
      min: 60,
    },
  },
  { _id: false }
)

const quizQuestionSchema = new Schema<IQuizQuestion>(
  {
    id: {
      type: String,
      required: true,
    },
    text: {
      type: String,
      required: true,
    },
    options: {
      type: [String],
      required: true,
    },
    correctAnswer: {
      type: String,
      required: true,
    },
    difficulty: {
      type: String,
      enum: ['Easy', 'Normal', 'Hard', 'Master'],
      required: true,
    },
    explanation: {
      type: String,
      default: null,
    },
  },
  { _id: false }
)

const quizSchema = new Schema<IQuizDocument>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    contentInput: {
      type: Schema.Types.ObjectId,
      ref: 'ContentInput',
      default: null,
    },
    name: {
      type: String,
      default: null,
      maxlength: 100,
    },
    configuration: {
      type: quizConfigurationSchema,
      required: true,
    },
    questions: {
      type: [quizQuestionSchema],
      required: true,
      default: [],
    },
    answers: {
      type: Map,
      of: String,
      default: new Map(),
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
      enum: ['tab-change', 'manual', null],
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
      type: {
        performanceReview: String,
        weakAreas: [String],
        suggestions: [String],
        detailedAnalysis: String,
        strengths: [String],
        improvementAreas: [String],
        analyzedAt: Date,
      },
      default: null,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
)

quizSchema.set('toJSON', {
  virtuals: true,
  transform: (_doc, ret) => {
    try {
      ret.id = ret._id?.toString() ?? ret._id ?? null
      
      // Handle user field - could be ObjectId, string, or populated
      if (ret.user) {
        if (typeof ret.user === 'object' && ret.user.toString) {
          ret.userId = ret.user.toString()
        } else if (typeof ret.user === 'string') {
          ret.userId = ret.user
        } else {
          ret.userId = String(ret.user)
        }
      } else {
        ret.userId = null
      }
      
      // Handle contentInput field
      if (ret.contentInput) {
        if (typeof ret.contentInput === 'object' && ret.contentInput.toString) {
          ret.contentInputId = ret.contentInput.toString()
        } else if (typeof ret.contentInput === 'string') {
          ret.contentInputId = ret.contentInput
        } else {
          ret.contentInputId = String(ret.contentInput)
        }
      } else {
        ret.contentInputId = null
      }

      // Handle answers Map conversion
      if (ret.answers instanceof Map) {
        ret.answers = Object.fromEntries(ret.answers)
      } else if (ret.answers && typeof ret.answers === 'object' && !Array.isArray(ret.answers)) {
        // Already an object, keep it as is
        ret.answers = ret.answers
      } else {
        // Fallback to empty object
        ret.answers = {}
      }

      // Clean up internal fields
      delete ret._id
      delete ret.user
      delete ret.contentInput
      
      return ret
    } catch (error) {
      console.error('Error in quiz toJSON transform:', error)
      // Return minimal safe structure
      return {
        id: ret._id?.toString() ?? null,
        userId: ret.user?.toString() ?? null,
        contentInputId: ret.contentInput?.toString() ?? null,
        answers: {},
        ...ret,
      }
    }
  },
})

export const Quiz: QuizModel = model<IQuizDocument>('Quiz', quizSchema)

export default Quiz

