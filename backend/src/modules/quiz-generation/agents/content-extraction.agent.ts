import axios from 'axios'
import * as cheerio from 'cheerio'
import { BaseAgent, type AgentContext, type AgentResult } from './base.agent'

export class ContentExtractionAgent extends BaseAgent {
  constructor() {
    super(
      'ContentExtractor',
      `You are a content extraction agent. Your job is to extract and summarize relevant content from URLs or documents.
      Extract the main text content, key concepts, and important information that would be useful for quiz generation.
      Focus on educational content, facts, concepts, and explanations.
      Remove any navigation, ads, or irrelevant content.`
    )
  }

  async run(context: AgentContext): Promise<AgentResult> {
    const { url, document } = context.input

    try {
      let extractedContent = ''

      if (url) {
        extractedContent = await this.extractFromUrl(url)
      } else if (document) {
        extractedContent = this.extractFromDocument(document)
      } else {
        throw new Error('Either URL or document must be provided')
      }

      // Use Gemini to clean and summarize the content
      const cleanedContent = await this.cleanAndSummarize(extractedContent)

      return {
        output: {
          content: cleanedContent,
          source: url || 'document',
          extractedAt: new Date().toISOString(),
        },
        metadata: {
          originalLength: extractedContent.length,
          cleanedLength: cleanedContent.length,
        },
      }
    } catch (error) {
      throw new Error(
        `Content extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async extractFromUrl(url: string): Promise<string> {
    try {
      const response = await axios.get(url, {
        timeout: 30000,
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
        },
      })

      const $ = cheerio.load(response.data)

      // Remove script and style elements
      $('script, style, nav, header, footer, aside, .ad, .advertisement').remove()

      // Extract text from main content areas
      const contentSelectors = [
        'article',
        'main',
        '.content',
        '.post-content',
        '.entry-content',
        '#content',
        'body',
      ]

      let text = ''
      for (const selector of contentSelectors) {
        const elements = $(selector)
        if (elements.length > 0) {
          text = elements.text()
          break
        }
      }

      // Fallback to body if no specific content found
      if (!text) {
        text = $('body').text()
      }

      // Clean up whitespace
      return text
        .replace(/\s+/g, ' ')
        .replace(/\n\s*\n/g, '\n')
        .trim()
    } catch (error) {
      if (axios.isAxiosError(error)) {
        throw new Error(`Failed to fetch URL: ${error.message}`)
      }
      throw error
    }
  }

  private extractFromDocument(document: string | Buffer): string {
    if (Buffer.isBuffer(document)) {
      // For binary files, you might want to use a different extraction method
      // For now, we'll assume text content
      return document.toString('utf-8')
    }
    return document
  }

  private async cleanAndSummarize(content: string): Promise<string> {
    const prompt = `Please clean and summarize the following extracted content, focusing on key educational information, concepts, facts, and explanations that would be useful for creating quiz questions. Remove any redundant information, formatting artifacts, or irrelevant content. Keep the summary comprehensive but focused on educational content.

Content to process:
${content.substring(0, 50000)}${content.length > 50000 ? '... (truncated)' : ''}`

    try {
      const result = await this.model.generateContent(prompt)
      const response = await result.response
      return response.text()
    } catch (error) {
      // If cleaning fails, return original content
      console.warn('Content cleaning failed, using original content:', error)
      return content.substring(0, 50000)
    }
  }
}

