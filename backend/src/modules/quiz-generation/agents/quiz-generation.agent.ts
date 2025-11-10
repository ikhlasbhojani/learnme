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
  codeSnippet?: string | null
  imageReference?: string | null
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
    const questions = await this.generateQuestions(content, difficulty, maxQuestions, context)

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
    count: number,
    context: AgentContext
  ): Promise<GeneratedQuestion[]> {
    const difficultyMapping: Record<DifficultyLevel, 'Easy' | 'Normal' | 'Hard' | 'Master'> = {
      easy: 'Easy',
      medium: 'Normal',
      hard: 'Hard',
    }

    const mappedDifficulty = difficultyMapping[difficulty]

    const prompt = this.buildQuizGenerationPrompt(content, difficulty, count)

    try {
      const generatedText = await this.callModelDirect(prompt, {
        input: { content, difficulty, count },
        metadata: context.metadata,
      })

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
          questions,
          context
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

  private detectCodeInContent(content: string): boolean {
    // Common code indicators
    const codePatterns = [
      /```[\s\S]*?```/g, // Markdown code blocks
      /`[^`]+`/g, // Inline code
      /\bfunction\s+\w+\s*\(/i, // Function declarations
      /\bclass\s+\w+/i, // Class declarations
      /\bconst\s+\w+\s*=/i, // Const declarations
      /\blet\s+\w+\s*=/i, // Let declarations
      /\bvar\s+\w+\s*=/i, // Var declarations
      /\bdef\s+\w+\s*\(/i, // Python function
      /\bimport\s+.*from/i, // Import statements
      /\breturn\s+/i, // Return statements
      /\{[\s\S]{20,}\}/, // Code blocks with braces
      /\[[\s\S]{20,}\]/, // Code blocks with brackets
      /<script[\s\S]*?>[\s\S]*?<\/script>/i, // Script tags
      /<code[\s\S]*?>[\s\S]*?<\/code>/i, // Code tags
    ]

    return codePatterns.some(pattern => pattern.test(content))
  }

  private extractCodeExamples(content: string): string[] {
    const codeExamples: string[] = []
    
    // Extract markdown code blocks
    const markdownCodeRegex = /```(?:[\w]+)?\n?([\s\S]*?)```/g
    let match
    while ((match = markdownCodeRegex.exec(content)) !== null) {
      const code = match[1].trim()
      if (code.length > 10 && code.length < 2000) { // Reasonable size
        codeExamples.push(code)
      }
    }

    // Extract inline code blocks (if they're substantial)
    const inlineCodeRegex = /`([^`]{20,})`/g
    while ((match = inlineCodeRegex.exec(content)) !== null) {
      const code = match[1].trim()
      if (code.length > 20 && code.length < 500) {
        codeExamples.push(code)
      }
    }

    // Extract code from <code> tags
    const codeTagRegex = /<code[^>]*>([\s\S]*?)<\/code>/gi
    while ((match = codeTagRegex.exec(content)) !== null) {
      const code = match[1].trim()
      if (code.length > 10 && code.length < 2000) {
        codeExamples.push(code)
      }
    }

    // Extract code from <pre> tags
    const preTagRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi
    while ((match = preTagRegex.exec(content)) !== null) {
      const code = match[1].trim()
      if (code.length > 10 && code.length < 2000) {
        codeExamples.push(code)
      }
    }

    // Try to extract code blocks by looking for function/class patterns
    const functionRegex = /(?:function|def|class|const|let|var)\s+[\w\s\(\)\{\}\[\];:=\+\-\*\/\.<>!&|]+/gi
    const functionMatches = content.match(functionRegex)
    if (functionMatches) {
      functionMatches.forEach(match => {
        if (match.length > 30 && match.length < 1000) {
          codeExamples.push(match)
        }
      })
    }

    // Remove duplicates and limit to top 10 examples
    const uniqueExamples = Array.from(new Set(codeExamples))
    return uniqueExamples.slice(0, 10)
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

    // Detect if content contains code
    const hasCode = this.detectCodeInContent(content)
    const codeExamples = hasCode ? this.extractCodeExamples(content) : []

    return `Generate exactly ${count} quiz questions based on the following content. The difficulty level is ${difficulty}.

${difficultyGuidelines[difficulty]}

${hasCode ? `\n⚠️ CODE DETECTED: The content contains code examples. You MUST create code-based questions using the code snippets provided below.\n` : ''}

Requirements:
1. Generate exactly ${count} questions
2. Each question must have exactly 4 multiple-choice options (A, B, C, D)
3. Clearly indicate the correct answer
4. Provide an explanation for each correct answer
5. Questions should be diverse and cover different aspects of the content
6. Questions should be clear and unambiguous
7. Avoid trick questions or overly ambiguous wording
8. **CRITICAL - Code and Practical Implementation Questions**: 
   ${hasCode ? `
   - The content contains code examples. You MUST create a significant portion of questions (at least 40-60%) about code
   - Use the code examples provided below - extract the EXACT code from the content and include it in the "codeSnippet" field
   - Preserve formatting, indentation, and syntax exactly as it appears in the content
   - Create THREE types of code-based questions:
     
     TYPE 1: Correct Code - Output Questions (${difficulty === 'easy' ? '30-40%' : difficulty === 'medium' ? '25-35%' : '20-30%'} of code questions)
     - Provide CORRECT, working code in codeSnippet
     - Ask what the code outputs, returns, or does
     - Examples: "What is the output of this code?", "What does this function return?", "What value is printed?"
     - For EASY: Simple code with obvious output
     - For MEDIUM: Code with some logic, loops, or conditionals
     - For HARD: Complex code with multiple functions, recursion, or advanced concepts
     
     TYPE 2: Wrong Code - Debug Questions (${difficulty === 'easy' ? '20-30%' : difficulty === 'medium' ? '30-40%' : '35-45%'} of code questions)
     - Provide INCORRECT or buggy code in codeSnippet
     - Ask what's wrong, what error occurs, or how to fix it
     - Examples: "What is wrong with this code?", "What error will this produce?", "How should this be fixed?"
     - For EASY: Simple syntax errors or obvious bugs
     - For MEDIUM: Logic errors, off-by-one errors, type mismatches
     - For HARD: Subtle bugs, race conditions, memory issues, or design flaws
     
     TYPE 3: Code Logic Questions (${difficulty === 'easy' ? '30-40%' : difficulty === 'medium' ? '30-40%' : '25-35%'} of code questions)
     - Provide CORRECT code in codeSnippet
     - Ask about how the code works, what concepts it demonstrates, or how to modify it
     - Examples: "How does this function work?", "What concept does this code demonstrate?", "What would happen if we change X?"
     - For EASY: Basic concepts and simple logic
     - For MEDIUM: Intermediate concepts, patterns, or algorithms
     - For HARD: Advanced concepts, optimization, or architectural decisions
   
   - When creating code-based questions, the codeSnippet MUST contain the complete, relevant code that the question is about
   - Format code snippets properly - preserve the original code format exactly
   - If multiple code examples exist, create multiple questions covering different code snippets
   - Mix the three types of code questions appropriately based on difficulty level
   ` : `
   - If the content contains code examples, functions, classes, methods, or any programming constructs, create questions that test understanding of that code
   - Extract the EXACT code from the content and include it in the "codeSnippet" field - preserve formatting, indentation, and syntax
   - Create questions that test understanding of what the code does/outputs, how functions work, and code logic
   `}
9. **Image and Visual References**:
   - When a question references an image, diagram, chart, flowchart, or visual element from the content, include a clear description in "imageReference"
   - The imageReference should describe what the image shows, what it represents, or key elements visible in the image
   - Use imageReference for questions about visual concepts, diagrams, UI elements, or any graphical content
10. **Conditional Fields**:
   - ONLY include codeSnippet if the question is directly about code, functions, or programming concepts
   - ONLY include imageReference if the question references a visual element, diagram, or image
   - If a question is purely conceptual without code or visual elements, do NOT include codeSnippet or imageReference (set them to null or omit them)
   - When codeSnippet is included, make sure the question text references the code appropriately

${codeExamples.length > 0 ? `\n=== CODE EXAMPLES FROM CONTENT ===\nThe following code examples were extracted from the content. Use these EXACT code snippets when creating code-based questions. You may modify them slightly for wrong code questions, but base them on these examples:\n${codeExamples.map((code, i) => `\n--- Example ${i + 1} ---\n${code.substring(0, 1500)}${code.length > 1500 ? '\n... (truncated)' : ''}`).join('\n')}\n\nIMPORTANT: When creating questions with codeSnippet, use the code from these examples. For "wrong code" questions, introduce realistic bugs/errors based on these examples.\n` : ''}

Format your response as a valid JSON array with this exact structure (NO trailing commas, NO comments):
[
  {
    "text": "Question text here?",
    "options": ["Option A", "Option B", "Option C", "Option D"],
    "correctAnswer": "Option A",
    "explanation": "Explanation of why this answer is correct",
    "codeSnippet": "// Only include if question is about code\nfunction example() {\n  return true;\n}",
    "imageReference": "Only include if question references an image/diagram"
  }
]

Note: codeSnippet and imageReference are optional. Only include them if they are relevant to the question.

IMPORTANT: 
- Return ONLY valid JSON - no markdown, no code blocks, no extra text
- Ensure all strings are properly quoted
- NO trailing commas after the last element in arrays or objects
- Make sure the JSON is complete and well-formed
- **CRITICAL for codeSnippet**: When including code in the "codeSnippet" field, you MUST properly escape all special characters:
  * Escape newlines as \\n
  * Escape tabs as \\t
  * Escape quotes as \\"
  * Escape backslashes as \\\\
  * The codeSnippet must be a valid JSON string - all special characters must be escaped

Content:
${content.substring(0, 30000)}${content.length > 30000 ? '... (content truncated)' : ''}

Generate the questions now:`
  }

  private parseQuestions(
    generatedText: string,
    difficulty: 'Easy' | 'Normal' | 'Hard' | 'Master'
  ): GeneratedQuestion[] {
    try {
      // Clean the text - remove markdown code blocks
      let cleanedText = generatedText.trim()
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      }

      // Try to find JSON array - be more flexible with matching
      // Look for array start and try to extract complete objects
      const arrayStartMatch = cleanedText.match(/\[[\s\S]*/)
      if (arrayStartMatch) {
        let jsonCandidate = arrayStartMatch[0]
        
        // Helper function to count nested brackets properly
        const findCompleteArray = (text: string): string | null => {
          let bracketCount = 0
          let braceCount = 0
          let inString = false
          let escapeNext = false
          
          for (let i = 0; i < text.length; i++) {
            const char = text[i]
            
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
              
              // If we've closed all brackets and braces, we have a complete array
              if (bracketCount === 0 && braceCount === 0 && i > 0) {
                return text.substring(0, i + 1)
              }
            }
          }
          
          // If array is incomplete, try to extract complete objects
          if (bracketCount > 0 || braceCount > 0) {
            // Find all complete question objects using a more sophisticated approach
            const completeObjects: string[] = []
            let currentObject = ''
            let objectBraceCount = 0
            let objectInString = false
            let objectEscapeNext = false
            
            for (let i = 0; i < text.length; i++) {
              const char = text[i]
              
              if (objectEscapeNext) {
                objectEscapeNext = false
                currentObject += char
                continue
              }
              
              if (char === '\\') {
                objectEscapeNext = true
                currentObject += char
                continue
              }
              
              if (char === '"' && !objectEscapeNext) {
                objectInString = !objectInString
                currentObject += char
                continue
              }
              
              if (!objectInString) {
                if (char === '{') {
                  if (objectBraceCount === 0) currentObject = ''
                  objectBraceCount++
                  currentObject += char
                } else if (char === '}') {
                  objectBraceCount--
                  currentObject += char
                  if (objectBraceCount === 0 && currentObject.trim()) {
                    // Check if this looks like a complete question object
                    if (currentObject.includes('"text') || currentObject.includes('"question')) {
                      completeObjects.push(currentObject.trim())
                    }
                    currentObject = ''
                  }
                } else if (objectBraceCount > 0) {
                  currentObject += char
                }
              } else if (objectBraceCount > 0) {
                currentObject += char
              }
            }
            
            if (completeObjects.length > 0) {
              return '[' + completeObjects.join(',') + ']'
            }
          }
          
          return null
        }
        
        let completeArray = findCompleteArray(jsonCandidate)
        if (completeArray) {
          try {
            // Additional JSON cleaning before parsing
            // First, try to fix escaped characters in strings (especially code snippets)
            completeArray = this.fixJsonStringEscaping(completeArray)
            
            // Clean the JSON
            completeArray = completeArray
              // Remove trailing commas before closing brackets/braces
              .replace(/,(\s*[\]}])/g, '$1')
              // Fix common quote issues (but be careful not to break strings)
              .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
              // Fix double commas
              .replace(/,,+/g, ',')
              // Remove commas before closing array
              .replace(/,\s*\]/g, ']')
              // Remove commas before closing object
              .replace(/,\s*\}/g, '}')
            
            // Try parsing with error handling
            let parsed
            try {
              parsed = JSON.parse(completeArray)
            } catch (parseErr) {
              // If parsing fails, try to extract and fix individual objects
              const fixed = this.extractAndFixJsonObjects(completeArray)
              if (fixed) {
                parsed = JSON.parse(fixed)
              } else {
                throw parseErr
              }
            }
            if (Array.isArray(parsed) && parsed.length > 0) {
              return parsed
                .filter((q: any) => q && (q.text || q.question))
                .map((q: any, index: number) => ({
                  id: `q-${Date.now()}-${index}`,
                  text: q.text || q.question || '',
                  options: Array.isArray(q.options) ? q.options : [],
                  correctAnswer: q.correctAnswer || q.answer || '',
                  difficulty,
                  explanation: q.explanation || null,
                  codeSnippet: q.codeSnippet || null,
                  imageReference: q.imageReference || null,
                }))
            }
          } catch (parseError) {
            // JSON is still invalid, try alternative extraction
            console.warn('JSON parse failed after repair, trying text parsing:', parseError)
            // Try one more time with aggressive cleaning
            try {
              const aggressiveCleaned = this.aggressiveJsonClean(completeArray)
              const parsed = JSON.parse(aggressiveCleaned)
              if (Array.isArray(parsed) && parsed.length > 0) {
                return parsed
                  .filter((q: any) => q && (q.text || q.question))
                  .map((q: any, index: number) => ({
            id: `q-${Date.now()}-${index}`,
            text: q.text || q.question || '',
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: q.correctAnswer || q.answer || '',
            difficulty,
            explanation: q.explanation || null,
                    codeSnippet: q.codeSnippet || null,
                    imageReference: q.imageReference || null,
          }))
              }
            } catch (finalError) {
              console.warn('Aggressive JSON clean also failed, trying object extraction:', finalError)
              // Last resort: try to extract individual objects
              try {
                const extracted = this.extractAndFixJsonObjects(completeArray)
                if (extracted) {
                  const parsed = JSON.parse(extracted)
                  if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed
                      .filter((q: any) => q && (q.text || q.question))
                      .map((q: any, index: number) => ({
                        id: `q-${Date.now()}-${index}`,
                        text: q.text || q.question || '',
                        options: Array.isArray(q.options) ? q.options : [],
                        correctAnswer: q.correctAnswer || q.answer || '',
                        difficulty,
                        explanation: q.explanation || null,
                        codeSnippet: q.codeSnippet || null,
                        imageReference: q.imageReference || null,
                      }))
                  }
                }
              } catch {
                console.warn('Object extraction also failed, falling back to text parsing')
              }
            }
          }
        }
      }

      // Fallback: Try to parse as structured text
      return this.parseQuestionsFromText(generatedText, difficulty)
    } catch (error) {
      console.warn('Failed to parse JSON, trying text parsing:', error)
      return this.parseQuestionsFromText(generatedText, difficulty)
    }
  }

  private fixJsonStringEscaping(jsonStr: string): string {
    // Fix common escaping issues in JSON strings, especially in code snippets
    // This handles cases where code snippets contain unescaped characters
    
    // Simple approach: try to parse and if it fails, use a more lenient approach
    try {
      // First, try to parse as-is
      JSON.parse(jsonStr)
      return jsonStr
    } catch {
      // If parsing fails, try to fix common issues
      // For code snippets, we'll use a simpler approach - just ensure the JSON structure is valid
      // The AI should be generating properly escaped JSON, but if not, we'll handle it in aggressiveJsonClean
      return jsonStr
    }
  }

  private extractAndFixJsonObjects(jsonStr: string): string | null {
    // Extract individual JSON objects and try to fix them
    const objects: string[] = []
    let depth = 0
    let inString = false
    let escapeNext = false
    let currentObj = ''
    let objStart = -1
    
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i]
      
      if (escapeNext) {
        escapeNext = false
        if (objStart >= 0) currentObj += char
        continue
      }
      
      if (char === '\\') {
        escapeNext = true
        if (objStart >= 0) currentObj += char
        continue
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString
        if (objStart >= 0) currentObj += char
        continue
      }
      
      if (!inString) {
        if (char === '{') {
          if (depth === 0) {
            objStart = i
            currentObj = char
          } else if (objStart >= 0) {
            currentObj += char
          }
          depth++
        } else if (char === '}') {
          depth--
          if (objStart >= 0) currentObj += char
          if (depth === 0 && objStart >= 0) {
            // Try to fix and parse this object
            try {
              // Clean the object
              let cleaned = currentObj
                .replace(/,(\s*[\]}])/g, '$1')
                .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
              
              const test = JSON.parse(cleaned)
              if (test && (test.text || test.question)) {
                objects.push(cleaned)
              }
            } catch {
              // Skip invalid objects
            }
            objStart = -1
            currentObj = ''
          }
        } else if (objStart >= 0) {
          currentObj += char
        }
      } else if (objStart >= 0) {
        currentObj += char
      }
    }
    
    return objects.length > 0 ? '[' + objects.join(',') + ']' : null
  }

  private aggressiveJsonClean(jsonStr: string): string {
    try {
      // Remove any text before first [ and after last ]
      const firstBracket = jsonStr.indexOf('[')
      const lastBracket = jsonStr.lastIndexOf(']')
      
      if (firstBracket === -1 || lastBracket === -1 || firstBracket >= lastBracket) {
        throw new Error('No valid array structure found')
      }
      
      let cleaned = jsonStr.substring(firstBracket, lastBracket + 1)
      
      // Try to extract valid JSON objects one by one
      const validObjects: string[] = []
      let depth = 0
      let inString = false
      let escapeNext = false
      let currentObject = ''
      let objectStart = -1
      
      for (let i = 0; i < cleaned.length; i++) {
        const char = cleaned[i]
        
        if (escapeNext) {
          escapeNext = false
          if (objectStart >= 0) currentObject += char
          continue
        }
        
        if (char === '\\') {
          escapeNext = true
          if (objectStart >= 0) currentObject += char
          continue
        }
        
        if (char === '"' && !escapeNext) {
          inString = !inString
          if (objectStart >= 0) currentObject += char
          continue
        }
        
        if (!inString) {
          if (char === '{') {
            if (depth === 0) {
              objectStart = i
              currentObject = char
            } else if (objectStart >= 0) {
              currentObject += char
            }
            depth++
          } else if (char === '}') {
            depth--
            if (objectStart >= 0) currentObject += char
            if (depth === 0 && objectStart >= 0) {
              // Try to parse this object
              try {
                const testObj = JSON.parse(currentObject)
                if (testObj && (testObj.text || testObj.question)) {
                  validObjects.push(currentObject)
                }
              } catch {
                // Invalid object, skip it
              }
              objectStart = -1
              currentObject = ''
            }
          } else if (objectStart >= 0) {
            currentObject += char
          }
        } else if (objectStart >= 0) {
          currentObject += char
        }
      }
      
      // If we found valid objects, reconstruct the array
      if (validObjects.length > 0) {
        return '[' + validObjects.join(',') + ']'
      }
      
      // Fallback to original cleaning
      cleaned = cleaned
        // Remove trailing commas
        .replace(/,\s*([}\]])/g, '$1')
        // Fix unquoted keys (but be careful with strings)
        .replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
        // Remove duplicate commas
        .replace(/,,+/g, ',')
        // Remove commas at start of objects/arrays
        .replace(/(\[|\{)\s*,/g, '$1')
        // Remove any standalone commas
        .replace(/,\s*,/g, ',')
        // Fix missing commas between objects
        .replace(/\}\s*\{/g, '},{')
        // Remove control characters (but preserve \n, \t, \r in strings)
        .replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
      
      return cleaned
    } catch (error) {
      console.warn('Aggressive JSON clean failed:', error)
      return jsonStr
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
          codeSnippet: null,
          imageReference: null,
        })
      }
    })

    return questions
  }

  private async generateAdditionalQuestions(
    content: string,
    difficulty: DifficultyLevel,
    count: number,
    existingQuestions: GeneratedQuestion[],
    context: AgentContext
  ): Promise<GeneratedQuestion[]> {
    const existingTexts = existingQuestions.map((q) => q.text).join('\n')
    const prompt = `Generate ${count} additional quiz questions based on the same content. 
    Make sure these questions are different from the existing ones:
    ${existingTexts}
    
    Generate ${count} new, unique questions following the same format and difficulty level (${difficulty}).`

    try {
      const generatedText = await this.callModelDirect(prompt, {
        input: { content, difficulty, count: existingQuestions.length },
        metadata: context.metadata,
      })
      const mappedDifficulty: 'Easy' | 'Normal' | 'Hard' | 'Master' =
        difficulty === 'easy' ? 'Easy' : difficulty === 'medium' ? 'Normal' : 'Hard'
      return this.parseQuestions(generatedText, mappedDifficulty)
    } catch (error) {
      console.warn('Failed to generate additional questions:', error)
      return []
    }
  }
}

