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
  const { url, selectedTopics, difficulty, numberOfQuestions, timeDuration } = input

  // Validate - either url or selectedTopics must be provided
  if (!url && (!selectedTopics || selectedTopics.length === 0)) {
    throw new AppError('Either URL or selected topics must be provided', 400)
  }

  // If selectedTopics is provided, use those URLs
  let urlsToUse: string[] = []
  let sourceDescription = ''

  if (selectedTopics && selectedTopics.length > 0) {
    urlsToUse = selectedTopics.map((topic) => topic.url)
    sourceDescription = selectedTopics.map((topic) => topic.title).join(', ')
  } else if (url) {
    urlsToUse = [url]
    sourceDescription = url
    // Validate URL format
    try {
      new URL(url)
    } catch {
      throw new AppError('Invalid URL format', 400)
    }
  }

  // Validate number of questions
  const questionCount = Math.min(Math.max(1, numberOfQuestions || 10), 100)

  // Create or find content input
  const existing = await ContentInput.find({ userId })
  const sourceKey = selectedTopics
    ? selectedTopics.map((t) => t.url).join('|')
    : url
  let contentInput = existing.find(
    (item) => item.type === 'url' && item.source === sourceKey
  )

  if (!contentInput) {
    contentInput = await ContentInput.create({
      userId,
      type: 'url',
      source: sourceKey,
    })
  }

  // Initialize orchestrator agent
  const orchestrator = new OrchestratorAgent()

  // Prepare orchestrator input
  const orchestratorInput: OrchestratorInput = {
    url: urlsToUse.length === 1 ? urlsToUse[0] : undefined,
    urls: urlsToUse.length > 1 ? urlsToUse : undefined,
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
    userId,
    contentInputId: contentInput.id,
    name: result.output.quizName || selectedTopics?.map((t) => t.title).join(' - ') || null,
    configuration: {
      difficulty: mappedDifficulty,
      numberOfQuestions: questions.length,
      timeDuration: timeDuration || 3600, // Default 1 hour
    },
    questions: questions.map((q) => ({
      ...q,
      difficulty: mappedDifficulty,
    })),
    answers: {},
    status: 'pending',
  })

  // Update content input with extracted content if available
  if (result.metadata?.extractionMetadata) {
    // Update the content input timestamp
    await ContentInput.update(contentInput.id, contentInput.userId, {
      source: contentInput.source,
      content: contentInput.content,
    })
  }

  return {
    quizId: quiz.id,
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
    userId,
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
    userId,
    contentInputId: contentInput.id,
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
    answers: {},
    status: 'pending',
  })

  return {
    quizId: quiz.id,
    questions,
    metadata: result.output.metadata,
  }
}

