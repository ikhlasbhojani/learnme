// User Entity
export interface User {
  id: string
  email: string
  createdAt: Date
  updatedAt: Date
  lastLoginAt: Date | null
  themePreference: 'light' | 'dark' | 'blue' | 'green' | null
}

// ContentInput Entity
export interface ContentInput {
  id: string
  type: 'url' | 'file' | 'manual'
  source: string
  content: string | null
  timestamp: Date
  userId: string
}

// QuizConfiguration Entity
export interface QuizConfiguration {
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Master'
  numberOfQuestions: number
  timeDuration: number // in seconds
}

// Question Entity
export interface Question {
  id: string
  text: string
  options: string[]
  correctAnswer: string
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Master'
  explanation: string | null
  codeSnippet?: string | null
  imageReference?: string | null
}

// QuizInstance Entity
export interface QuizInstance {
  id: string
  userId: string
  contentInputId: string | null
  name: string | null
  configuration: QuizConfiguration
  questions: Question[]
  answers: Record<string, string>
  startTime: Date | null
  endTime: Date | null
  status: 'pending' | 'in-progress' | 'completed' | 'expired'
  score: number | null
  correctCount: number | null
  incorrectCount: number | null
  pauseReason: 'tab-change' | 'manual' | null
  pausedAt: Date | null
  pauseCount: number
  createdAt?: Date | null
  updatedAt?: Date | null
}

// AssessmentResult Entity
export interface AssessmentResult {
  quizInstanceId: string
  totalScore: number
  correctCount: number
  incorrectCount: number
  unansweredCount: number
  performanceReview: string
  weakAreas: string[]
  suggestions: string[]
  strengths?: string[]
  improvementAreas?: string[]
  detailedAnalysis?: string
  topicsToReview?: string[]
  generatedAt: Date
}

// Auth-related types
export interface AuthState {
  user: User | null
  isAuthenticated: boolean
}

export interface AuthResult {
  success: boolean
  user?: User
  error?: string
}

export interface ValidationResult {
  valid: boolean
  errors: string[]
}
