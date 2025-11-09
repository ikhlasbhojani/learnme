import { Agent, run, extractAllTextOutput } from '@openai/agents'
import { AIProvider } from '../ai-provider.interface'
import { z } from 'zod'

export class AgentsProvider implements AIProvider {
  constructor() {
    // OpenAI Agents SDK automatically reads OPENAI_API_KEY from environment
    // Following OpenAI Agents SDK quickstart: https://openai.github.io/openai-agents-js/guides/quickstart/
    // No configuration needed - SDK uses OPENAI_API_KEY environment variable
  }

  async generateText(prompt: string): Promise<string> {
    try {
      // Create agent following OpenAI Agents SDK quickstart pattern
      // https://openai.github.io/openai-agents-js/guides/quickstart/
      // Agent uses default model from SDK
      const agent = new Agent({
        name: 'TextGenerator',
        instructions: 'You are a helpful assistant that provides clear and accurate responses.',
      })

      // Use run function directly as per quickstart guide
      // This is the simplest way to run an agent
      const result = await run(agent, prompt)

      // Extract text from the result using extractAllTextOutput
      const textOutput = result.finalOutput || extractAllTextOutput(result.newItems) || ''
      if (!textOutput) {
        throw new Error('No text output received from agent')
      }

      return typeof textOutput === 'string' ? textOutput : String(textOutput)
    } catch (error: any) {
      // Extract detailed error information
      const statusCode = error?.status || error?.response?.status || error?.code
      const statusText = error?.statusText || error?.response?.statusText
      const errorBody = error?.response?.data || error?.error || error?.message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Build detailed error message
      let detailedError = `Agents SDK error: ${errorMessage}`
      if (statusCode) {
        detailedError += ` (${statusCode}${statusText ? ` ${statusText}` : ''})`
      }
      if (errorBody && typeof errorBody === 'object') {
        detailedError += ` - ${JSON.stringify(errorBody)}`
      } else if (errorBody && typeof errorBody === 'string') {
        detailedError += ` - ${errorBody}`
      }

      // Add helpful message for 404 errors
      if (statusCode === 404) {
        detailedError += `. This usually means the API endpoint or model name is incorrect. Please check your AI_MODEL configuration and ensure your OpenAI API key is valid.`
      }

      throw new Error(detailedError)
    }
  }

  async generateJSON(prompt: string): Promise<any> {
    try {
      // Create agent with JSON output instructions
      // Following OpenAI Agents SDK quickstart pattern
      const agent = new Agent({
        name: 'JSONGenerator',
        instructions: `You are a helpful assistant that responds with valid JSON only. 
        Do not include any text before or after the JSON. 
        Always return valid JSON objects or arrays.`,
      })

      // Run the agent with JSON-specific prompt
      const enhancedPrompt = `${prompt}\n\nRespond with valid JSON only. Do not include any explanatory text, only the JSON object or array.`

      // Use run function directly as per quickstart guide
      const result = await run(agent, enhancedPrompt)

      // Extract text from the result
      const textOutput = result.finalOutput || extractAllTextOutput(result.newItems) || '{}'
      const textOutputStr = typeof textOutput === 'string' ? textOutput : String(textOutput)

      // Try to extract JSON if it's wrapped in markdown code blocks or text
      let jsonText = textOutputStr.trim()

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
    } catch (error: any) {
      // Extract detailed error information
      const statusCode = error?.status || error?.response?.status || error?.code
      const statusText = error?.statusText || error?.response?.statusText
      const errorBody = error?.response?.data || error?.error || error?.message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'

      // Build detailed error message
      let detailedError = `Agents SDK error: ${errorMessage}`
      if (statusCode) {
        detailedError += ` (${statusCode}${statusText ? ` ${statusText}` : ''})`
      }
      if (errorBody && typeof errorBody === 'object') {
        detailedError += ` - ${JSON.stringify(errorBody)}`
      } else if (errorBody && typeof errorBody === 'string') {
        detailedError += ` - ${errorBody}`
      }

      // Add helpful message for 404 errors
      if (statusCode === 404) {
        detailedError += `. This usually means the API endpoint or model name is incorrect. Please check your AI_MODEL configuration and ensure your OpenAI API key is valid.`
      }

      throw new Error(detailedError)
    }
  }

  async generateStructuredOutput<T>(prompt: string, schema: z.ZodSchema<T>): Promise<T> {
    try {
      // Create agent with outputType using Zod schema
      // Following OpenAI Agents SDK pattern with outputType
      // Note: outputType expects a ZodObject or ZodArray, so we pass the schema directly
      const agent = new Agent({
        name: 'StructuredGenerator',
        instructions: 'You are a helpful assistant that provides structured responses according to the specified schema.',
        // @ts-ignore - outputType accepts Zod schemas, type definition might be incomplete
        outputType: schema as any,
      })

      // Use run function directly
      const result = await run(agent, prompt)

      // Extract structured output from result
      // The outputType ensures the result matches the schema
      const output = result.finalOutput
      
      if (!output) {
        throw new Error('No structured output received from agent')
      }

      // Validate against schema
      return schema.parse(output)
    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      throw new Error(`Structured output generation failed: ${errorMessage}`)
    }
  }
}

