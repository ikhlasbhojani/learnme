import OpenAI from 'openai'

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
  protected openai: OpenAI | null = null
  protected tools: AgentTool[] = []
  protected name: string
  protected instructions: string

  constructor(name: string, instructions: string) {
    this.name = name
    this.instructions = instructions
    // OpenAI client will be initialized when needed
  }

  protected async initializeOpenAI() {
    if (!process.env.OPENAI_API_KEY) {
      throw new Error('OpenAI API key not configured. Please set OPENAI_API_KEY in your .env file.')
    }
    
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    })
  }

  protected async ensureOpenAI() {
    if (!this.openai) {
      await this.initializeOpenAI()
    }
  }

  addTool(tool: AgentTool) {
    this.tools.push(tool)
  }

  protected async callModel(prompt: string, context: AgentContext): Promise<string> {
    try {
      await this.ensureOpenAI()
      if (!this.openai) {
        throw new Error('OpenAI client not initialized')
      }
      const fullPrompt = this.buildPrompt(prompt, context)
      const response = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: fullPrompt }],
      })
      return response.choices[0]?.message?.content || ''
    } catch (error) {
      throw new Error(`Agent ${this.name} error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  protected async callModelForJSON(prompt: string, context: AgentContext): Promise<any> {
    try {
      await this.ensureOpenAI()
      if (!this.openai) {
        throw new Error('OpenAI client not initialized')
      }
      const response = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        response_format: { type: 'json_object' },
      })
      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }
      return JSON.parse(content)
    } catch (error) {
      throw new Error(`Agent ${this.name} error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  protected async callModelDirect(prompt: string, context: AgentContext): Promise<string> {
    // Direct call without building full prompt - use when prompt is already complete
    try {
      await this.ensureOpenAI()
      if (!this.openai) {
        throw new Error('OpenAI client not initialized')
      }
      const response = await this.openai.chat.completions.create({
        model: process.env.AI_MODEL || 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      })
      return response.choices[0]?.message?.content || ''
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

