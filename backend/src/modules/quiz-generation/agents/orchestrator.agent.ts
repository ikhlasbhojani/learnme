import { BaseAgent, type AgentContext, type AgentResult } from './base.agent'
import { ContentExtractionAgent } from './content-extraction.agent'
import { QuizGenerationAgent, type DifficultyLevel } from './quiz-generation.agent'

export interface OrchestratorInput {
  url?: string
  urls?: string[]
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

  private async generateQuizName(
    content: string,
    source: string,
    pageTitle: string | null | undefined,
    context: AgentContext
  ): Promise<string> {
    try {
      // Use more content for better name generation (first 2000 characters)
      const contentPreview = content.substring(0, 2000)
      const sourceInfo = pageTitle ? `Page Title: ${pageTitle}\nSource: ${source}` : `Source: ${source}`

      const prompt = `Based on the following content, generate a concise and descriptive quiz title (maximum 60 characters).
The title should:
1. Summarize the main topic or subject matter covered in the content
2. Be clear, informative, and specific to the content
3. Not include words like "Quiz", "Test", or "Assessment" - just the topic/subject name
4. Use title case (capitalize important words)
5. Be specific enough to distinguish this quiz from others

${sourceInfo}

Content preview:
${contentPreview}${content.length > 2000 ? '...' : ''}

Generate only the title, nothing else. Do not include quotes or any other text.`

      const name = (await this.callModelDirect(prompt, {
        input: { content, source, pageTitle },
        metadata: context.metadata,
      })).trim()

      // Clean up the name - remove quotes, extra whitespace, and limit length
      let cleanName = name
        .replace(/^["']|["']$/g, '') // Remove surrounding quotes
        .replace(/^Title:\s*/i, '') // Remove "Title:" prefix if present
        .replace(/^Quiz\s*Title:\s*/i, '') // Remove "Quiz Title:" prefix if present
        .trim()

      // Limit to 60 characters
      if (cleanName.length > 60) {
        // Try to cut at word boundary
        const truncated = cleanName.substring(0, 57)
        const lastSpace = truncated.lastIndexOf(' ')
        cleanName = lastSpace > 40 ? truncated.substring(0, lastSpace) + '...' : truncated + '...'
      }

      return cleanName || this.getFallbackName(source, pageTitle)
    } catch (error) {
      console.error('Failed to generate quiz name:', error)
      return this.getFallbackName(source, pageTitle)
    }
  }

  private getFallbackName(source: string, pageTitle?: string | null): string {
    // Use page title if available
    if (pageTitle) {
      // Clean up page title (remove common suffixes like " | Site Name")
      const cleaned = pageTitle.split('|')[0].split('-')[0].trim()
      if (cleaned.length > 0 && cleaned.length <= 60) {
        return cleaned
      }
    }

    // Try to extract name from URL
    try {
      const url = new URL(source)
      const pathParts = url.pathname.split('/').filter((p) => p.length > 0)
      if (pathParts.length > 0) {
        const lastPart = pathParts[pathParts.length - 1]
        const name = lastPart
          .replace(/\.(html|htm|php|asp|aspx)$/i, '') // Remove file extensions
          .replace(/-/g, ' ')
          .replace(/_/g, ' ')
          .split(' ')
          .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
          .join(' ')
        return name || 'Generated Quiz'
      }
      // Use hostname as fallback
      return url.hostname.replace('www.', '').split('.')[0].charAt(0).toUpperCase() + 
             url.hostname.replace('www.', '').split('.')[0].slice(1) || 'Generated Quiz'
    } catch {
      // If source is not a URL, use a generic name
      return 'Generated Quiz'
    }
  }

  async run(context: AgentContext): Promise<AgentResult> {
    const input = context.input as OrchestratorInput

    // Validate input
    if (!input.url && !input.urls && !input.document) {
      throw new Error('Either URL, URLs array, or document must be provided')
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
          urls: input.urls,
          document: input.document,
        },
        metadata: context.metadata,
      })

      const extractedContent = extractionResult.output.content
      const pageTitle = extractionResult.output.pageTitle || null

      // Step 2: Generate quiz name based on content and page title
      const quizName = await this.generateQuizName(
        extractedContent,
        extractionResult.output.source,
        pageTitle,
        context
      )

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

