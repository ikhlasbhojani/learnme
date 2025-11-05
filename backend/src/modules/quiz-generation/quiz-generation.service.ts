import { Types } from 'mongoose'
import { OrchestratorAgent, type OrchestratorInput } from './agents/orchestrator.agent'
import { AppError } from '../../utils/appError'
import ContentInput from '../content/content.model'
import Quiz, { type IQuizDocument } from '../quiz/quiz.model'
import {
  type GenerateQuizFromContentInput,
  type GenerateQuizFromUrlInput,
} from './quiz-generation.validation'

export interface GeneratedQuizResult {
  quizId: string
  questions: Array<{
    id: string
    text: string
    options: string[]
    correctAnswer: string
    difficulty: 'Easy' | 'Normal' | 'Hard' | 'Master'
    explanation?: string | null
  }>
  metadata: {
    source: string
    difficulty: string
    requestedQuestions: number
    generatedQuestions: number
    extractedAt: string
    generatedAt: string
  }
}

export async function generateQuizFromUrl(
  userId: string,
  input: GenerateQuizFromUrlInput
): Promise<GeneratedQuizResult> {
  const { url, difficulty, numberOfQuestions, timeDuration } = input

  // Validate URL
  try {
    new URL(url)
  } catch {
    throw new AppError('Invalid URL format', 400)
  }

  // Validate number of questions
  const questionCount = Math.min(Math.max(1, numberOfQuestions || 10), 100)

  // Create or find content input
  let contentInput = await ContentInput.findOne({
    user: userId,
    type: 'url',
    source: url,
  })

  if (!contentInput) {
    contentInput = await ContentInput.create({
      user: new Types.ObjectId(userId),
      type: 'url',
      source: url,
    })
  }

  // Initialize orchestrator agent
  const orchestrator = new OrchestratorAgent()

  // Prepare orchestrator input
  const orchestratorInput: OrchestratorInput = {
    url,
    difficulty,
    numberOfQuestions: questionCount,
  }

  // Run orchestration
  const result = await orchestrator.run({
    input: orchestratorInput,
    metadata: {
      userId,
      sourceType: 'url',
    },
  })

  const questions = result.output.questions

  // Map difficulty to match quiz model
  const difficultyMapping: Record<string, 'Easy' | 'Normal' | 'Hard' | 'Master'> = {
    easy: 'Easy',
    medium: 'Normal',
    hard: 'Hard',
  }

  const mappedDifficulty = difficultyMapping[difficulty] || 'Normal'

  // Create quiz with generated questions
  const quiz = await Quiz.create({
    user: new Types.ObjectId(userId),
    contentInput: contentInput._id,
    name: result.output.quizName || null,
    configuration: {
      difficulty: mappedDifficulty,
      numberOfQuestions: questions.length,
      timeDuration: timeDuration || 3600, // Default 1 hour
    },
    questions: questions.map((q) => ({
      ...q,
      difficulty: mappedDifficulty,
    })),
    answers: new Map(),
    status: 'pending',
  })

  // Update content input with extracted content if available
  if (result.metadata?.extractionMetadata) {
    // You might want to store the extracted content in the content input
    // For now, we'll just update the timestamp
    contentInput.timestamp = new Date()
    await contentInput.save()
  }

  return {
    quizId: quiz._id.toString(),
    questions,
    metadata: result.output.metadata,
  }
}

export async function generateQuizFromDocument(
  userId: string,
  input: GenerateQuizFromContentInput
): Promise<GeneratedQuizResult> {
  const { document, difficulty, numberOfQuestions, timeDuration } = input

  if (!document || document.trim().length === 0) {
    throw new AppError('Document content cannot be empty', 400)
  }

  // Validate number of questions
  const questionCount = Math.min(Math.max(1, numberOfQuestions || 10), 100)

  // Create content input
  const contentInput = await ContentInput.create({
    user: new Types.ObjectId(userId),
    type: 'file',
    source: 'uploaded-document',
    content: document,
  })

  // Initialize orchestrator agent
  const orchestrator = new OrchestratorAgent()

  // Prepare orchestrator input
  const orchestratorInput: OrchestratorInput = {
    document,
    difficulty,
    numberOfQuestions: questionCount,
  }

  // Run orchestration
  const result = await orchestrator.run({
    input: orchestratorInput,
    metadata: {
      userId,
      sourceType: 'document',
    },
  })

  const questions = result.output.questions

  // Map difficulty to match quiz model
  const difficultyMapping: Record<string, 'Easy' | 'Normal' | 'Hard' | 'Master'> = {
    easy: 'Easy',
    medium: 'Normal',
    hard: 'Hard',
  }

  const mappedDifficulty = difficultyMapping[difficulty] || 'Normal'

  // Create quiz with generated questions
  const quiz = await Quiz.create({
    user: new Types.ObjectId(userId),
    contentInput: contentInput._id,
    name: result.output.quizName || null,
    configuration: {
      difficulty: mappedDifficulty,
      numberOfQuestions: questions.length,
      timeDuration: timeDuration || 3600, // Default 1 hour
    },
    questions: questions.map((q) => ({
      ...q,
      difficulty: mappedDifficulty,
    })),
    answers: new Map(),
    status: 'pending',
  })

  return {
    quizId: quiz._id.toString(),
    questions,
    metadata: result.output.metadata,
  }
}

