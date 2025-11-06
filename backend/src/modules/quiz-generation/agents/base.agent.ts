import { AIProvider } from '../../../services/ai/ai-provider.interface'
import { createAIProvider } from '../../../services/ai/ai-provider.factory'
import { getAIConfig } from '../../setup/setup.service'

export interface AgentContext {
  input: any
  metadata?: Record<string, any>
}

export interface AgentResult {
  output: any
  metadata?: Record<string, any>
}

export interface AgentTool {
  name: string
  description: string
  execute: (params: any, context: AgentContext) => Promise<any>
  parameters?: Record<string, any>
}

export abstract class BaseAgent {
  protected aiProvider: AIProvider | null = null
  protected tools: AgentTool[] = []
  protected name: string
  protected instructions: string

  constructor(name: string, instructions: string) {
    this.name = name
    this.instructions = instructions
    // AI provider will be initialized when needed with userId
  }

  protected async initializeAIProvider(userId: string) {
    const config = await getAIConfig(userId)
    if (!config) {
      throw new Error('AI configuration not found. Please set up your API key in the setup page.')
    }
    this.aiProvider = createAIProvider(config)
  }

  protected async ensureAIProvider(userId: string) {
    if (!this.aiProvider) {
      await this.initializeAIProvider(userId)
    }
  }

  addTool(tool: AgentTool) {
    this.tools.push(tool)
  }

  protected async callModel(prompt: string, context: AgentContext): Promise<string> {
    try {
      const userId = context.metadata?.userId
      if (!userId) {
        throw new Error('User ID is required in context metadata')
      }
      await this.ensureAIProvider(userId)
      if (!this.aiProvider) {
        throw new Error('AI provider not initialized')
      }
      const fullPrompt = this.buildPrompt(prompt, context)
      return await this.aiProvider.generateText(fullPrompt)
    } catch (error) {
      throw new Error(`Agent ${this.name} error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  protected async callModelForJSON(prompt: string, context: AgentContext): Promise<any> {
    try {
      const userId = context.metadata?.userId
      if (!userId) {
        throw new Error('User ID is required in context metadata')
      }
      await this.ensureAIProvider(userId)
      if (!this.aiProvider) {
        throw new Error('AI provider not initialized')
      }
      return await this.aiProvider.generateJSON(prompt)
    } catch (error) {
      throw new Error(`Agent ${this.name} error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  protected async callModelDirect(prompt: string, context: AgentContext): Promise<string> {
    // Direct call without building full prompt - use when prompt is already complete
    try {
      const userId = context.metadata?.userId
      if (!userId) {
        throw new Error('User ID is required in context metadata')
      }
      await this.ensureAIProvider(userId)
      if (!this.aiProvider) {
        throw new Error('AI provider not initialized')
      }
      return await this.aiProvider.generateText(prompt)
    } catch (error) {
      throw new Error(`Agent ${this.name} error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  protected buildPrompt(userPrompt: string, context: AgentContext): string {
    let prompt = `${this.instructions}\n\n`

    if (this.tools.length > 0) {
      prompt += `Available tools:\n`
      this.tools.forEach((tool) => {
        prompt += `- ${tool.name}: ${tool.description}\n`
      })
      prompt += `\nYou can use these tools by describing what you need. The system will execute them for you.\n\n`
    }

    prompt += `User request: ${userPrompt}\n\n`
    prompt += `Context: ${JSON.stringify(context, null, 2)}\n\n`
    prompt += `Please process this request according to your instructions.`

    return prompt
  }

  protected async executeTool(toolName: string, params: any, context: AgentContext): Promise<any> {
    const tool = this.tools.find((t) => t.name === toolName)
    if (!tool) {
      throw new Error(`Tool ${toolName} not found`)
    }
    return await tool.execute(params, context)
  }

  abstract run(context: AgentContext): Promise<AgentResult>
}

