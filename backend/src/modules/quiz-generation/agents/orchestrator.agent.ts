import { BaseAgent, type AgentContext, type AgentResult } from './base.agent'
import { ContentExtractionAgent } from './content-extraction.agent'
import { QuizGenerationAgent, type DifficultyLevel } from './quiz-generation.agent'

export interface OrchestratorInput {
  url?: string
  document?: string
  difficulty: DifficultyLevel
  numberOfQuestions: number
}

export class OrchestratorAgent extends BaseAgent {
  private contentExtractionAgent: ContentExtractionAgent
  private quizGenerationAgent: QuizGenerationAgent

  constructor() {
    super(
      'Orchestrator',
      `You are an orchestrator agent that manages the quiz generation process.
      Your job is to coordinate between content extraction and quiz generation agents.
      When given a URL or document, you should:
      1. First extract the content using the content extraction agent
      2. Then generate quiz questions based on the extracted content and user specifications
      Always ensure the workflow is executed in the correct order.`
    )

    this.contentExtractionAgent = new ContentExtractionAgent()
    this.quizGenerationAgent = new QuizGenerationAgent()
  }

  private async generateQuizName(content: string, source: string): Promise<string> {
    try {
      const prompt = `Based on the following content, generate a concise and descriptive quiz title (maximum 60 characters).
The title should:
1. Summarize the main topic or subject matter
2. Be clear and informative
3. Not include words like "Quiz" or "Test" - just the topic name

Content source: ${source}
Content preview: ${content.substring(0, 500)}...

Generate only the title, nothing else.`

      const result = await this.model.generateContent(prompt)
      const response = result.response
      const name = response.text().trim()

      // Clean up the name - remove quotes, extra whitespace, and limit length
      let cleanName = name.replace(/^["']|["']$/g, '').trim()
      if (cleanName.length > 60) {
        cleanName = cleanName.substring(0, 57) + '...'
      }

      return cleanName || 'Generated Quiz'
    } catch (error) {
      console.error('Failed to generate quiz name:', error)
      // Fallback: extract a simple name from the source
      try {
        const url = new URL(source)
        return url.pathname.split('/').pop()?.replace(/-/g, ' ') || 'Generated Quiz'
      } catch {
        return 'Generated Quiz'
      }
    }
  }

  async run(context: AgentContext): Promise<AgentResult> {
    const input = context.input as OrchestratorInput

    // Validate input
    if (!input.url && !input.document) {
      throw new Error('Either URL or document must be provided')
    }

    if (!input.difficulty || !['easy', 'medium', 'hard'].includes(input.difficulty)) {
      throw new Error('Difficulty must be easy, medium, or hard')
    }

    const numberOfQuestions = Math.min(input.numberOfQuestions || 100, 100)

    try {
      // Step 1: Extract content
      const extractionResult = await this.contentExtractionAgent.run({
        input: {
          url: input.url,
          document: input.document,
        },
        metadata: context.metadata,
      })

      const extractedContent = extractionResult.output.content

      // Step 2: Generate quiz name based on content
      const quizName = await this.generateQuizName(extractedContent, extractionResult.output.source)

      // Step 3: Generate quiz
      const quizResult = await this.quizGenerationAgent.run({
        input: {
          content: extractedContent,
          difficulty: input.difficulty,
          numberOfQuestions,
        },
        metadata: {
          ...context.metadata,
          source: extractionResult.output.source,
        },
      })

      return {
        output: {
          questions: quizResult.output.questions,
          quizName,
          metadata: {
            source: extractionResult.output.source,
            difficulty: input.difficulty,
            requestedQuestions: numberOfQuestions,
            generatedQuestions: quizResult.output.questions.length,
            extractedAt: extractionResult.output.extractedAt,
            generatedAt: quizResult.output.generatedAt,
          },
        },
        metadata: {
          extractionMetadata: extractionResult.metadata,
          generationMetadata: quizResult.metadata,
        },
      }
    } catch (error) {
      throw new Error(
        `Orchestration failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }
}

