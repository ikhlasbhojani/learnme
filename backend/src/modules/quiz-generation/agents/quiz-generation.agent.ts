import { BaseAgent, type AgentContext, type AgentResult } from './base.agent'

export type DifficultyLevel = 'easy' | 'medium' | 'hard'

export interface QuizGenerationParams {
  content: string
  difficulty: DifficultyLevel
  numberOfQuestions: number
}

export interface GeneratedQuestion {
  id: string
  text: string
  options: string[]
  correctAnswer: string
  difficulty: 'Easy' | 'Normal' | 'Hard' | 'Master'
  explanation?: string
}

export class QuizGenerationAgent extends BaseAgent {
  constructor() {
    super(
      'QuizGenerator',
      `You are a quiz generation agent. Your job is to create high-quality quiz questions based on provided content.
      Generate questions that test understanding, application, and knowledge of the content.
      Questions should be clear, unambiguous, and educationally valuable.
      Each question must have exactly 4 options with one correct answer.
      Provide explanations for the correct answers when possible.`
    )
  }

  async run(context: AgentContext): Promise<AgentResult> {
    const { content, difficulty, numberOfQuestions } = context.input as QuizGenerationParams

    if (!content) {
      throw new Error('Content is required for quiz generation')
    }

    if (!difficulty || !['easy', 'medium', 'hard'].includes(difficulty)) {
      throw new Error('Difficulty must be easy, medium, or hard')
    }

    const maxQuestions = Math.min(numberOfQuestions || 100, 100)
    const questions = await this.generateQuestions(content, difficulty, maxQuestions)

    return {
      output: {
        questions,
        count: questions.length,
        difficulty,
        generatedAt: new Date().toISOString(),
      },
      metadata: {
        requestedQuestions: numberOfQuestions,
        generatedQuestions: questions.length,
      },
    }
  }

  private async generateQuestions(
    content: string,
    difficulty: DifficultyLevel,
    count: number
  ): Promise<GeneratedQuestion[]> {
    const difficultyMapping: Record<DifficultyLevel, 'Easy' | 'Normal' | 'Hard' | 'Master'> = {
      easy: 'Easy',
      medium: 'Normal',
      hard: 'Hard',
    }

    const mappedDifficulty = difficultyMapping[difficulty]

    const prompt = this.buildQuizGenerationPrompt(content, difficulty, count)

    try {
      const generatedText = await this.aiProvider.generateText(prompt)

      // Parse the generated questions
      const questions = this.parseQuestions(generatedText, mappedDifficulty)

      // Ensure we have the requested number of questions
      if (questions.length < count) {
        // Generate additional questions if needed
        const additionalCount = count - questions.length
        const additionalQuestions = await this.generateAdditionalQuestions(
          content,
          difficulty,
          additionalCount,
          questions
        )
        questions.push(...additionalQuestions)
      }

      return questions.slice(0, count)
    } catch (error) {
      throw new Error(
        `Failed to generate questions: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private buildQuizGenerationPrompt(
    content: string,
    difficulty: DifficultyLevel,
    count: number
  ): string {
    const difficultyGuidelines = {
      easy: `Easy questions should test basic recall and understanding. They should be straightforward and test fundamental concepts from the content.`,
      medium: `Medium questions should test comprehension and application. They may require connecting concepts or applying knowledge in slightly novel contexts.`,
      hard: `Hard questions should test analysis, synthesis, and deeper understanding. They may require critical thinking, evaluation, or applying concepts to complex scenarios.`,
    }

    return `Generate exactly ${count} quiz questions based on the following content. The difficulty level is ${difficulty}.

${difficultyGuidelines[difficulty]}

Requirements:
1. Generate exactly ${count} questions
2. Each question must have exactly 4 multiple-choice options (A, B, C, D)
3. Clearly indicate the correct answer
4. Provide an explanation for each correct answer
5. Questions should be diverse and cover different aspects of the content
6. Questions should be clear and unambiguous
7. Avoid trick questions or overly ambiguous wording

Format your response as a JSON array with this exact structure:
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Explanation of why this answer is correct"
  },
  ...
]

Content:
${content.substring(0, 30000)}${content.length > 30000 ? '... (content truncated)' : ''}

Generate the questions now:`
  }

  private parseQuestions(
    generatedText: string,
    difficulty: 'Easy' | 'Normal' | 'Hard' | 'Master'
  ): GeneratedQuestion[] {
    try {
      // Try to extract JSON from the response
      const jsonMatch = generatedText.match(/\[[\s\S]*\]/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        if (Array.isArray(parsed)) {
          return parsed.map((q: any, index: number) => ({
            id: `q-${Date.now()}-${index}`,
            text: q.text || q.question || '',
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: q.correctAnswer || q.answer || '',
            difficulty,
            explanation: q.explanation || null,
          }))
        }
      }

      // Fallback: Try to parse as structured text
      return this.parseQuestionsFromText(generatedText, difficulty)
    } catch (error) {
      console.warn('Failed to parse JSON, trying text parsing:', error)
      return this.parseQuestionsFromText(generatedText, difficulty)
    }
  }

  private parseQuestionsFromText(
    text: string,
    difficulty: 'Easy' | 'Normal' | 'Hard' | 'Master'
  ): GeneratedQuestion[] {
    const questions: GeneratedQuestion[] = []
    const questionBlocks = text.split(/\n\s*(?=\d+\.|\*\*|\#)/)

    questionBlocks.forEach((block, index) => {
      const lines = block.trim().split('\n').filter((line) => line.trim())
      if (lines.length < 3) return

      const questionText = lines[0].replace(/^\d+\.\s*/, '').replace(/^\*\*\s*/, '').trim()
      const options: string[] = []
      let correctAnswer = ''
      let explanation = ''

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i].trim()
        if (line.match(/^[A-D][\.\)]\s*/)) {
          const option = line.replace(/^[A-D][\.\)]\s*/, '').trim()
          options.push(option)
          if (line.includes('*') || line.toLowerCase().includes('correct')) {
            correctAnswer = option.replace(/\*/g, '').trim()
          }
        } else if (line.toLowerCase().includes('answer:') || line.toLowerCase().includes('correct:')) {
          const answerMatch = line.match(/(?:answer|correct):\s*(.+)/i)
          if (answerMatch) {
            correctAnswer = answerMatch[1].trim()
          }
        } else if (line.toLowerCase().includes('explanation:')) {
          explanation = line.replace(/explanation:\s*/i, '').trim()
        }
      }

      if (questionText && options.length >= 2 && correctAnswer) {
        // Ensure we have 4 options
        while (options.length < 4) {
          options.push(`Option ${String.fromCharCode(68 + options.length)}`)
        }

        questions.push({
          id: `q-${Date.now()}-${index}`,
          text: questionText,
          options: options.slice(0, 4),
          correctAnswer: correctAnswer || options[0],
          difficulty,
          explanation: explanation || null,
        })
      }
    })

    return questions
  }

  private async generateAdditionalQuestions(
    content: string,
    difficulty: DifficultyLevel,
    count: number,
    existingQuestions: GeneratedQuestion[]
  ): Promise<GeneratedQuestion[]> {
    const existingTexts = existingQuestions.map((q) => q.text).join('\n')
    const prompt = `Generate ${count} additional quiz questions based on the same content. 
    Make sure these questions are different from the existing ones:
    ${existingTexts}
    
    Generate ${count} new, unique questions following the same format and difficulty level (${difficulty}).`

    try {
      const generatedText = await this.aiProvider.generateText(prompt)
      const mappedDifficulty: 'Easy' | 'Normal' | 'Hard' | 'Master' =
        difficulty === 'easy' ? 'Easy' : difficulty === 'medium' ? 'Normal' : 'Hard'
      return this.parseQuestions(generatedText, mappedDifficulty)
    } catch (error) {
      console.warn('Failed to generate additional questions:', error)
      return []
    }
  }
}

