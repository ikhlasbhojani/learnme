import OpenAI from 'openai'
import { AIProvider } from '../ai-provider.interface'

export class OpenAIProvider implements AIProvider {
  private client: OpenAI
  private model: string

  constructor(apiKey: string, modelName: string = 'gpt-4o-mini', baseUrl?: string) {
    // Create OpenAI client - can work with OpenAI or any OpenAI-compatible API
    const config: any = {
      apiKey,
    }
    
    // If baseUrl is provided, use it for external/custom providers
    // Otherwise, use OpenAI's default API endpoint
    if (baseUrl && baseUrl !== 'custom') {
      config.baseURL = baseUrl
    }
    
    this.client = new OpenAI(config)
    this.model = modelName
  }

  async generateText(prompt: string): Promise<string> {
    try {
      const response = await this.client.chat.completions.create({
        model: this.model,
        messages: [{ role: 'user', content: prompt }],
      })
      return response.choices[0]?.message?.content || ''
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  async generateJSON(prompt: string): Promise<any> {
    try {
      // Try JSON mode for OpenAI models (gpt-4, gpt-3.5) or if explicitly supported
      // For other models, rely on prompt instructions
      const supportsJsonMode = 
        this.model.includes('gpt-4') || 
        this.model.includes('gpt-3.5') ||
        this.model.includes('o1') ||
        this.model.includes('o3')
      
      const messages = supportsJsonMode
        ? [
            {
              role: 'system',
              content: 'You are a helpful assistant that responds with valid JSON only. Do not include any text before or after the JSON.',
            },
            { role: 'user', content: prompt },
          ]
        : [
            {
              role: 'system',
              content: 'You are a helpful assistant. Always respond with valid JSON only. Do not include any explanatory text, only the JSON object or array.',
            },
            { role: 'user', content: `${prompt}\n\nRespond with valid JSON only.` }
          ]

      const requestOptions: any = {
        model: this.model,
        messages: messages as any,
      }
      
      // Only use response_format for OpenAI models that explicitly support it
      if (supportsJsonMode) {
        requestOptions.response_format = { type: 'json_object' }
      }

      const response = await this.client.chat.completions.create(requestOptions)
      const text = response.choices[0]?.message?.content || '{}'
      
      // Try to extract JSON if it's wrapped in markdown code blocks or text
      let jsonText = text.trim()
      
      // Remove markdown code blocks if present
      if (jsonText.startsWith('```')) {
        jsonText = jsonText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      }
      
      // Try to find JSON object or array in the text
      // First try to find complete JSON
      const completeJsonMatch = jsonText.match(/(\[[\s\S]*\]|{[\s\S]*})/)
      if (completeJsonMatch) {
        try {
          return JSON.parse(completeJsonMatch[0])
        } catch (e) {
          // If complete match fails, try to repair
          console.warn('Complete JSON parse failed, attempting repair')
        }
      }
      
      // Try to extract and repair incomplete JSON
      // For arrays, try to find complete objects
      if (jsonText.trim().startsWith('[')) {
        const arrayStart = jsonText.indexOf('[')
        let bracketCount = 0
        let braceCount = 0
        let inString = false
        let escapeNext = false
        
        for (let i = arrayStart; i < jsonText.length; i++) {
          const char = jsonText[i]
          
          if (escapeNext) {
            escapeNext = false
            continue
          }
          
          if (char === '\\') {
            escapeNext = true
            continue
          }
          
          if (char === '"' && !escapeNext) {
            inString = !inString
            continue
          }
          
          if (!inString) {
            if (char === '[') bracketCount++
            if (char === ']') bracketCount--
            if (char === '{') braceCount++
            if (char === '}') braceCount--
            
            if (bracketCount === 0 && braceCount === 0 && i > arrayStart) {
              try {
                return JSON.parse(jsonText.substring(arrayStart, i + 1))
              } catch (e) {
                break
              }
            }
          }
        }
      }
      
      // Final attempt - try parsing the whole text
      try {
        return JSON.parse(jsonText)
      } catch (e) {
        throw new Error(`Failed to parse JSON: ${e instanceof Error ? e.message : 'Unknown error'}`)
      }
    } catch (error) {
      throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }
}

