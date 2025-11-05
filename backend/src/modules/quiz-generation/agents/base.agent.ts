import { GoogleGenerativeAI } from '@google/generative-ai'
import { appEnv } from '../../../config/env'

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
  protected model: any
  protected tools: AgentTool[] = []
  protected name: string
  protected instructions: string

  constructor(name: string, instructions: string) {
    this.name = name
    this.instructions = instructions
    this.initializeModel()
  }

  protected initializeModel() {
    const genAI = new GoogleGenerativeAI(appEnv.geminiApiKey)
    this.model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' })
  }

  addTool(tool: AgentTool) {
    this.tools.push(tool)
  }

  protected async callModel(prompt: string, context: AgentContext): Promise<string> {
    try {
      const fullPrompt = this.buildPrompt(prompt, context)
      const result = await this.model.generateContent(fullPrompt)
      const response = await result.response
      return response.text()
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

