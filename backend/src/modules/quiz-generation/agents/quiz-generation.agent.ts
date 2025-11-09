import { BaseAgent, type AgentContext, type AgentResult } from './base.agent'
import { 
  getQuizInstructions,
  GENERAL_QUIZ_REQUIREMENTS,
  ANSWER_VERIFICATION_INSTRUCTIONS,
  CODE_BASED_QUESTION_INSTRUCTIONS,
  FINAL_REMINDER_INSTRUCTIONS
} from './quiz-instructions'
import { z } from 'zod'

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

// Zod schema for structured output
const QuestionSchema = z.object({
  text: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
  explanation: z.string().optional(),
  codeSnippet: z.string().nullable().optional(),
  imageReference: z.string().nullable().optional(),
})

const QuizQuestionsSchema = z.array(QuestionSchema)

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
      // Use structured output with Zod schema for better reliability
      const userId = context.metadata?.userId
      if (!userId) {
        throw new Error('User ID is required in context metadata')
      }
      await this.ensureAIProvider(userId)
      if (!this.aiProvider) {
        throw new Error('AI provider not initialized')
      }

      let questions: GeneratedQuestion[] = []
      
      // Try structured output first (skip for now due to SDK limitations)
      // TODO: Re-enable when OpenAI Agents SDK properly supports outputType with Zod
      let useStructuredOutput = false
      
      if (useStructuredOutput) {
        try {
          console.log(`🔄 Attempting structured output with Zod schema...`)
          const structuredQuestions = await this.aiProvider.generateStructuredOutput(
            prompt,
            QuizQuestionsSchema
          )

        console.log(`✅ Successfully received ${structuredQuestions.length} questions via structured output (requested: ${count})`)

        // Map structured output to GeneratedQuestion format
        questions = structuredQuestions.map((q: any, index: number) => {
          const questionText = q.text || ''
          const codeSnippet = q.codeSnippet || null
          
          // Validate: if question mentions code but no codeSnippet, log warning
          const codeMentions = /code snippet|given the code|analyze the code|review the code|what does this code|the code below|the code above|following code/i.test(questionText)
          if (codeMentions && !codeSnippet) {
            console.warn(`Question ${index + 1} mentions code but has no codeSnippet: "${questionText.substring(0, 100)}..."`)
          }
          
          return {
            id: `q-${Date.now()}-${index}`,
            text: questionText,
            options: Array.isArray(q.options) ? q.options : [],
            correctAnswer: q.correctAnswer || '',
            difficulty: mappedDifficulty,
            explanation: q.explanation || null,
            codeSnippet: codeSnippet,
            imageReference: q.imageReference || null,
          }
        })
        } catch (structuredError) {
          // Fallback to text parsing if structured output fails
          console.warn(`⚠️ Structured output failed, falling back to text parsing: ${structuredError instanceof Error ? structuredError.message : 'Unknown error'}`)
          useStructuredOutput = false
        }
      }
      
      // Use text parsing (either as fallback or primary method)
      if (!useStructuredOutput) {
        const generatedText = await this.callModelDirect(prompt, {
          input: { content, difficulty, count },
          metadata: context.metadata,
        })

        // Log the raw response for debugging (first 500 chars)
        console.log(`📝 AI Response preview (first 500 chars): ${generatedText.substring(0, 500)}...`)
        console.log(`📏 AI Response total length: ${generatedText.length} characters`)

        // Parse the generated questions with better error handling
        try {
          questions = this.parseQuestions(generatedText, mappedDifficulty)
        } catch (parseError) {
          const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error'
          console.error(`❌ Failed to parse initial response: ${errorMessage}`)
          console.log(`❌ Failed response preview: ${generatedText.substring(0, 300)}...`)
          // Continue with empty questions array - will be handled by retry logic
          questions = []
        }
        
        console.log(`📊 Parsed ${questions.length} questions from AI response (requested: ${count})`)
        
        if (questions.length < count) {
          console.warn(`⚠️ AI generated fewer questions than requested. Response might be incomplete or parsing failed.`)
          console.log(`📄 Full AI response length: ${generatedText.length} characters`)
          
          // Check if response was truncated
          const lastChar = generatedText.trim().slice(-1)
          const hasClosingBracket = generatedText.includes(']')
          const lastBracketIndex = generatedText.lastIndexOf(']')
          const textAfterLastBracket = generatedText.substring(lastBracketIndex + 1).trim()
          
          console.log(`📋 Response analysis:`)
          console.log(`   - Ends with: "${lastChar}"`)
          console.log(`   - Has closing bracket: ${hasClosingBracket}`)
          console.log(`   - Text after last bracket: "${textAfterLastBracket.substring(0, 100)}"`)
          console.log(`   - Last 200 chars: "${generatedText.substring(generatedText.length - 200)}"`)
          
          if (!hasClosingBracket || textAfterLastBracket.length > 0) {
            console.warn(`⚠️ Response appears to be incomplete or truncated`)
          }
        }
      }

      // Validate code-based questions if content has code
      const hasCode = this.detectCodeInContent(content)
      if (hasCode) {
        const codeQuestions = questions.filter(q => q.codeSnippet && q.codeSnippet.trim().length > 0)
        const expectedCodeQuestions = Math.ceil(questions.length * (difficulty === 'easy' ? 0.4 : difficulty === 'medium' ? 0.5 : 0.6))
        
        if (codeQuestions.length < expectedCodeQuestions) {
          console.warn(`⚠️ WARNING: Only ${codeQuestions.length} code-based questions generated, expected at least ${expectedCodeQuestions} out of ${questions.length} total questions. Content contains code but code questions are missing.`)
        } else {
          console.log(`✓ Generated ${codeQuestions.length} code-based questions out of ${questions.length} total questions`)
        }
      }

      // Retry mechanism: keep generating until we have enough questions
      let attempts = 0
      const maxAttempts = 10
      
      while (questions.length < count && attempts < maxAttempts) {
        const needed = count - questions.length
        console.log(`⚠️ Only ${questions.length} questions generated, need ${count}. Generating ${needed} additional questions... (Attempt ${attempts + 1}/${maxAttempts})`)
        
        // Generate additional questions if needed
        const additionalQuestions = await this.generateAdditionalQuestions(
          content,
          difficulty,
          needed,
          questions,
          context
        )
        
        if (additionalQuestions.length > 0) {
          questions.push(...additionalQuestions)
          console.log(`✓ Added ${additionalQuestions.length} questions. Total now: ${questions.length}/${count}`)
        } else {
          console.warn(`⚠️ No additional questions generated in attempt ${attempts + 1} (either failed parsing or no valid questions)`)
        }
        
        attempts++
        
        // If we have enough questions, break early
        if (questions.length >= count) {
          break
        }
      }

      if (questions.length < count) {
        console.error(`❌ ERROR: Failed to generate enough questions after ${attempts} attempts. Got ${questions.length}, needed ${count}`)
        // Return what we have instead of failing completely
        console.warn(`⚠️ Returning ${questions.length} questions instead of ${count}`)
      } else {
        console.log(`✅ Successfully generated ${questions.length} questions (requested: ${count})`)
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
    
    // Extract markdown code blocks (most common format)
    const markdownCodeRegex = /```(?:[\w]+)?\n?([\s\S]*?)```/g
    let match
    while ((match = markdownCodeRegex.exec(content)) !== null) {
      const code = match[1].trim()
      const lines = code.split('\n').filter(line => line.trim().length > 0)
      // Filter out single-line commands (pip install, npm install, import statements alone)
      const isSingleCommand = lines.length === 1 && (
        code.startsWith('pip ') || 
        code.startsWith('npm ') || 
        code.startsWith('yarn ') ||
        (code.startsWith('import ') && !code.includes('{') && !code.includes('(')) ||
        (code.startsWith('from ') && !code.includes('import')) ||
        code.trim().split(/\s+/).length <= 3
      )
      // Only include code that is 2+ lines or has meaningful logic (not single commands)
      if (!isSingleCommand && code.length > 10 && code.length < 3000 && lines.length >= 1) {
        codeExamples.push(code)
      }
    }

    // Extract code from <code> tags
    const codeTagRegex = /<code[^>]*>([\s\S]*?)<\/code>/gi
    while ((match = codeTagRegex.exec(content)) !== null) {
      const code = match[1].trim()
      const lines = code.split('\n').filter(line => line.trim().length > 0)
      const isSingleCommand = lines.length === 1 && (
        code.startsWith('pip ') || 
        code.startsWith('npm ') || 
        code.startsWith('yarn ') ||
        (code.startsWith('import ') && !code.includes('{') && !code.includes('(')) ||
        (code.startsWith('from ') && !code.includes('import')) ||
        code.trim().split(/\s+/).length <= 3
      )
      if (!isSingleCommand && code.length > 10 && code.length < 3000 && lines.length >= 1) {
        codeExamples.push(code)
      }
    }

    // Extract code from <pre> tags
    const preTagRegex = /<pre[^>]*>([\s\S]*?)<\/pre>/gi
    while ((match = preTagRegex.exec(content)) !== null) {
      const code = match[1].trim()
      const lines = code.split('\n').filter(line => line.trim().length > 0)
      const isSingleCommand = lines.length === 1 && (
        code.startsWith('pip ') || 
        code.startsWith('npm ') || 
        code.startsWith('yarn ') ||
        (code.startsWith('import ') && !code.includes('{') && !code.includes('(')) ||
        (code.startsWith('from ') && !code.includes('import')) ||
        code.trim().split(/\s+/).length <= 3
      )
      if (!isSingleCommand && code.length > 10 && code.length < 3000 && lines.length >= 1) {
        codeExamples.push(code)
      }
    }

    // Extract inline code blocks (if they're substantial - likely code examples)
    const inlineCodeRegex = /`([^`]{30,})`/g
    while ((match = inlineCodeRegex.exec(content)) !== null) {
      const code = match[1].trim()
      // Only include if it looks like actual code (has keywords, operators, etc.)
      if (code.length > 30 && code.length < 800 && 
          /(?:function|def|class|const|let|var|import|export|return|if|for|while|=>|\(|\)|{|})/.test(code)) {
        codeExamples.push(code)
      }
    }

    // Try to extract code blocks by looking for function/class patterns (multi-line)
    // Look for complete function/class definitions with proper structure
    const functionBlockRegex = /(?:function|def|class|const|let|var|export|async)\s+[\w]+\s*[\(<\[{][\s\S]*?[\)>\]}]/g
    const functionMatches = content.match(functionBlockRegex)
    if (functionMatches) {
      functionMatches.forEach(match => {
        const lines = match.split('\n').filter(line => line.trim().length > 0)
        // Only include if it has 2+ lines (multi-line code) or is a substantial single-line function
        const isSubstantialSingleLine = lines.length === 1 && match.length > 100 && match.includes('{') && match.includes('}')
        if ((lines.length >= 2 || isSubstantialSingleLine) && match.length > 50 && match.length < 2000) {
          codeExamples.push(match)
        }
      })
    }

    // Remove duplicates and limit to top 15 examples (more code examples = better questions)
    const uniqueExamples = Array.from(new Set(codeExamples))
    return uniqueExamples.slice(0, 15)
  }

  private buildQuizGenerationPrompt(
    content: string,
    difficulty: DifficultyLevel,
    count: number
  ): string {
    // Get difficulty-specific instructions from separate file
    const difficultyInstructions = getQuizInstructions(difficulty)

    // Detect if content contains code
    const hasCode = this.detectCodeInContent(content)
    const codeExamples = hasCode ? this.extractCodeExamples(content) : []

    return `🚨🚨🚨 ABSOLUTELY CRITICAL - READ THIS FIRST 🚨🚨🚨

YOU MUST GENERATE EXACTLY ${count} QUIZ QUESTIONS. NOT ${count - 1}, NOT ${count + 1}, EXACTLY ${count}.

THIS IS MANDATORY. IF YOU GENERATE FEWER THAN ${count} QUESTIONS, THE QUIZ WILL FAIL.

BEFORE SUBMITTING YOUR RESPONSE:
1. Count the questions in your JSON array
2. Ensure the array contains EXACTLY ${count} question objects
3. If you have fewer than ${count}, generate more until you have exactly ${count}
4. If you have more than ${count}, remove the extra ones until you have exactly ${count}

Generate exactly ${count} quiz questions based on the following content. The difficulty level is ${difficulty}.

${difficultyInstructions}

${hasCode ? `\n🚨 CRITICAL: CODE DETECTED IN CONTENT 🚨
The content contains code examples. You MUST create code-based questions with actual code snippets.

**MANDATORY REQUIREMENTS**:
- At least ${Math.ceil(count * (difficulty === 'easy' ? 0.4 : difficulty === 'medium' ? 0.5 : 0.6))} out of ${count} questions MUST be code-based

${CODE_BASED_QUESTION_INSTRUCTIONS}

If you fail to create proper code-based questions with meaningful code snippets, the quiz will be incomplete and invalid.
\n` : ''}

${GENERAL_QUIZ_REQUIREMENTS.replace('EXACTLY the requested number', `EXACTLY ${count}`).replace('the requested number', `${count}`)}

8. **CRITICAL - Question Distribution Strategy**:
   ${hasCode ? `
   - You MUST create a balanced mix of TWO types of questions:
     
     TYPE A: PRACTICAL CODE-BASED QUESTIONS (${difficulty === 'easy' ? '40-50%' : difficulty === 'medium' ? '50-60%' : '60-70%'} of total questions)
     - **MANDATORY**: These questions MUST include actual code in the "codeSnippet" field
     - These questions test if the user has PRACTICALLY worked with the code
     - They require understanding of code execution, output, errors, and behavior
     - Examples of what to ask:
       * "What is the output of this code?" (with actual code in codeSnippet)
       * "What error will this code produce?" (with buggy code in codeSnippet)
       * "What will happen when this code runs?" (with actual code in codeSnippet)
     - These questions prove the user has hands-on experience with the code
     - **CRITICAL**: If content has code, you MUST create code-based questions. Do NOT skip them.
     
     TYPE B: THEORY-BASED QUESTIONS (${difficulty === 'easy' ? '50-60%' : difficulty === 'medium' ? '40-50%' : '30-40%'} of total questions)
     - These questions test if the user has READ and UNDERSTOOD the documentation
     - They cover concepts, definitions, explanations, and theoretical knowledge
     - NO codeSnippet needed (set to null or omit the field)
     - These questions prove the user has studied the documentation
   
   - The mix ensures comprehensive assessment: practical skills + theoretical knowledge
   - **IMPORTANT**: If the content contains code examples, you MUST create code-based questions. Do not create only theory questions.
   ` : `
   - Create questions that test understanding of concepts, definitions, and theoretical knowledge from the content
   - Focus on what the user has learned from reading the documentation
   `}

9. **PRACTICAL CODE-BASED QUESTIONS - Detailed Requirements**:
   ${hasCode ? `
   - **MANDATORY**: You MUST create code-based questions when code is present in content
   - These questions MUST test actual code execution and practical understanding
   - Use the code examples provided below - extract the EXACT code from the content
   - Preserve formatting, indentation, and syntax exactly as it appears in the content
   - Create questions that test REAL code behavior - ask about OUTPUT, ERRORS, or BEHAVIOR:
     
     SUBTYPE 1: Code Output/Result Questions (${difficulty === 'easy' ? '40-50%' : difficulty === 'medium' ? '35-45%' : '30-40%'} of code questions)
     - Provide CORRECT, working code in codeSnippet
     - Ask: "What is the output of this code?", "What does this function return?", "What value will be printed?"
     - Test if user can mentally execute the code and predict the result
     - EASY: Simple code with 1-2 operations, obvious output (e.g., basic arithmetic, simple function calls)
     - NORMAL: Code with loops, conditionals, function calls, some logic (e.g., for loops, if-else, array operations)
     - HARD: Complex code with multiple functions, recursion, async operations, advanced patterns (e.g., closures, promises, complex algorithms)
     
     SUBTYPE 2: Code Error/Problem Questions (${difficulty === 'easy' ? '30-40%' : difficulty === 'medium' ? '35-45%' : '40-50%'} of code questions)
     - Provide INCORRECT or buggy code in codeSnippet
     - Ask: "What error will this code produce?", "What is wrong with this code?", "Why will this code fail?"
     - Test if user can identify bugs, errors, and issues in code
     - EASY: Simple syntax errors, missing quotes, undefined variables, obvious mistakes
     - NORMAL: Logic errors, type mismatches, off-by-one errors, incorrect function usage
     - HARD: Subtle bugs, race conditions, memory leaks, design flaws, edge cases
     
     SUBTYPE 3: Code Behavior/Logic Questions (${difficulty === 'easy' ? '20-30%' : difficulty === 'medium' ? '20-30%' : '20-30%'} of code questions)
     - Provide CORRECT code in codeSnippet
     - Ask: "How does this code work?", "What happens if we change X to Y?", "What concept does this demonstrate?"
     - Test deeper understanding of code mechanics and concepts
     - EASY: Basic flow, simple concepts, straightforward logic
     - NORMAL: Intermediate patterns, algorithms, design principles
     - HARD: Advanced concepts, optimization, architectural decisions, complex patterns
   
   - When creating code-based questions, the codeSnippet MUST contain the complete, runnable code that the question is about
   - Format code snippets properly - preserve the original code format exactly
   - If multiple code examples exist, create multiple questions covering different code snippets
   - **CRITICAL**: If your question text mentions "code snippet below", "given the code", "analyze the code", or similar phrases, you MUST include the actual code in the "codeSnippet" field. Never create a question that references code without including it.
   ` : `
   - If the content contains code examples, create questions that test understanding of code concepts
   - Extract the EXACT code from the content and include it in the "codeSnippet" field
   - Create questions that test understanding of what the code does/outputs, how functions work, and code logic
   `}
10. **Image and Visual References**:
   - When a question references an image, diagram, chart, flowchart, or visual element from the content, include a clear description in "imageReference"
   - The imageReference should describe what the image shows, what it represents, or key elements visible in the image
   - Use imageReference for questions about visual concepts, diagrams, UI elements, or any graphical content

11. **Conditional Fields**:
   - ONLY include codeSnippet if the question is directly about code, functions, or programming concepts
   - ONLY include imageReference if the question references a visual element, diagram, or image
   - If a question is purely conceptual without code or visual elements, do NOT include codeSnippet or imageReference (set them to null or omit them)
   - When codeSnippet is included, make sure the question text references the code appropriately
   - **MANDATORY RULE**: If your question text contains phrases like "code snippet below", "given the code", "analyze the code", "review the code", "what does this code", or any reference to code, you MUST include the actual code in the "codeSnippet" field. Questions that reference code without including codeSnippet are INVALID.

${codeExamples.length > 0 ? `\n=== CODE EXAMPLES FROM CONTENT ===\nThe following code examples were extracted from the content. **YOU MUST USE THESE** when creating code-based questions. Extract 2-6 line meaningful code blocks from these examples for your questions:\n${codeExamples.map((code, i) => `\n--- Example ${i + 1} ---\n${code.substring(0, 1500)}${code.length > 1500 ? '\n... (truncated)' : ''}`).join('\n')}\n\n**CRITICAL INSTRUCTIONS FOR CODE QUESTIONS**:
- You MUST create at least ${Math.ceil(count * (difficulty === 'easy' ? 0.4 : difficulty === 'medium' ? 0.5 : 0.6))} code-based questions out of ${count} total questions
- For each code-based question, you MUST include actual executable code (2-6 lines minimum) in the "codeSnippet" field
- Code snippets MUST be proper multi-line code blocks with logic, NOT single commands or one-liners
- Use the code examples above - extract meaningful code blocks (2-6 lines) and use them for questions
- **USER WILL NOT RUN THE CODE** - they will analyze it visually, so questions must be answerable by reading the code
- Ask practical questions about code execution, output, errors, or behavior:
  * "Will this code run successfully or produce an error?" (include 2-6 lines of executable code in codeSnippet)
  * "What is the output of this code?" (include 2-6 lines of executable code in codeSnippet)
  * "What error will this code produce?" (include 2-6 lines of buggy code in codeSnippet)
  * "What will happen when this code runs?" (include 2-6 lines of code in codeSnippet)
  * "Which line in this code will cause an error?" (include 2-6 lines of code with error in codeSnippet)
  * "What does this function return when called with x=5?" (include 2-6 lines of function code in codeSnippet)
- Options must be clear and specific:
  * For "will it run" questions: Options like "A) Code runs successfully", "B) SyntaxError", "C) NameError", "D) TypeError"
  * For "output" questions: Options with specific outputs, not vague descriptions
  * For "error" questions: Options with specific error types
- Do NOT create questions that mention code without including it in codeSnippet
- Do NOT use single commands (pip install, npm install, import statements alone) as code snippets
- Do NOT create questions where the answer just repeats what's shown in the code snippet
- For "wrong code" questions, introduce realistic bugs/errors in 2-6 line code blocks based on the examples above
- For theory questions (no code), set "codeSnippet" to null or omit the field
` : hasCode ? `\n⚠️ WARNING: Code was detected in content but no code examples were extracted. Please manually extract code snippets from the content and create code-based questions with actual code in the codeSnippet field.\n` : ''}

Format your response as a valid JSON array with this exact structure (NO trailing commas, NO comments):

**EXAMPLE FOR CODE-BASED QUESTION**:
[
  {
    "text": "Will this code run successfully or produce an error?",
    "options": ["A) Code runs successfully", "B) SyntaxError", "C) NameError", "D) TypeError"],
    "correctAnswer": "A) Code runs successfully",
    "explanation": "The code imports required modules, creates an Agent, runs it, and prints the output. All syntax is correct.",
    "codeSnippet": "from agents import Agent, Runner\n\nagent = Agent(name=\"Assistant\", instructions=\"You are helpful\")\nresult = Runner.run_sync(agent, \"Write a haiku\")\nprint(result.final_output)",
    "imageReference": null
  }
]

**EXAMPLE FOR THEORY QUESTION**:
[
  {
    "text": "What is the purpose of the Agent class?",
    "options": ["A) To create AI agents with instructions", "B) To run code", "C) To install packages", "D) To format text"],
    "correctAnswer": "A) To create AI agents with instructions",
    "explanation": "The Agent class is used to create AI agents with specific instructions and behavior.",
    "codeSnippet": null,
    "imageReference": null
  }
]

IMPORTANT: 
- Return ONLY valid JSON - no markdown, no code blocks, no extra text
- Ensure all strings are properly quoted
- NO trailing commas after the last element in arrays or objects
- Make sure the JSON is complete and well-formed

Content:
${content.substring(0, 30000)}${content.length > 30000 ? '... (content truncated)' : ''}

${ANSWER_VERIFICATION_INSTRUCTIONS}

${hasCode ? `\n🚨 FINAL REMINDER: This content contains code. You MUST create code-based questions with actual code in codeSnippet fields. Do not skip code questions!\n` : ''}

${FINAL_REMINDER_INSTRUCTIONS.replace('the requested number', `${count}`).replace('question N', `question ${count}`)}`
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
              
              // If we've closed all brackets and braces, we might have a complete array
              // BUT: Don't return early - continue to the end to get ALL questions
              // Only check at the very end if brackets are balanced
            }
          }
          
          // If array is incomplete (brackets not balanced), extract ALL complete objects
          // This handles cases where the response was truncated but we can still extract valid questions
          if (bracketCount > 0 || braceCount > 0) {
            console.log(`⚠️ Array appears incomplete (bracketCount: ${bracketCount}, braceCount: ${braceCount}). Extracting all complete objects...`)
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
              console.log(`📦 Extracted ${completeObjects.length} complete question objects from incomplete array`)
              return '[' + completeObjects.join(',') + ']'
            }
          }
          
          // If we reach here and brackets are balanced, return the complete array
          if (bracketCount === 0 && braceCount === 0) {
            return text
          }
          
          return null
        }
        
        let completeArray = findCompleteArray(jsonCandidate)
        
        // If findCompleteArray returns null, try to extract all complete objects manually
        if (!completeArray) {
          console.log('⚠️ findCompleteArray returned null, trying to extract all complete objects...')
          const allObjects: string[] = []
          let currentObject = ''
          let objectBraceCount = 0
          let objectInString = false
          let objectEscapeNext = false
          
          for (let i = 0; i < jsonCandidate.length; i++) {
            const char = jsonCandidate[i]
            
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
                    allObjects.push(currentObject.trim())
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
          
          if (allObjects.length > 0) {
            completeArray = '[' + allObjects.join(',') + ']'
            console.log(`📦 Extracted ${allObjects.length} complete objects manually`)
          }
        }
        
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
              console.log(`✅ Successfully parsed ${parsed.length} questions from JSON array`)
              const filtered = parsed.filter((q: any) => q && (q.text || q.question))
              console.log(`📋 After filtering: ${filtered.length} valid questions`)
              return filtered
                .map((q: any, index: number) => {
                  const questionText = q.text || q.question || ''
                  const codeSnippet = q.codeSnippet || null
                  
                  // Validate: if question mentions code but no codeSnippet, log warning
                  const codeMentions = /code snippet|given the code|analyze the code|review the code|what does this code|the code below|the code above|following code/i.test(questionText)
                  if (codeMentions && !codeSnippet) {
                    console.warn(`Question ${index + 1} mentions code but has no codeSnippet: "${questionText.substring(0, 100)}..."`)
                  }
                  
                  return {
                    id: `q-${Date.now()}-${index}`,
                    text: questionText,
                    options: Array.isArray(q.options) ? q.options : [],
                    correctAnswer: q.correctAnswer || q.answer || '',
                    difficulty,
                    explanation: q.explanation || null,
                    codeSnippet: codeSnippet,
                    imageReference: q.imageReference || null,
                  }
                })
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
                  .map((q: any, index: number) => {
                    const questionText = q.text || q.question || ''
                    const codeSnippet = q.codeSnippet || null
                    
                    // Validate: if question mentions code but no codeSnippet, log warning
                    const codeMentions = /code snippet|given the code|analyze the code|review the code|what does this code|the code below|the code above|following code/i.test(questionText)
                    if (codeMentions && !codeSnippet) {
                      console.warn(`Question ${index + 1} mentions code but has no codeSnippet: "${questionText.substring(0, 100)}..."`)
                    }
                    
                    return {
                      id: `q-${Date.now()}-${index}`,
                      text: questionText,
                      options: Array.isArray(q.options) ? q.options : [],
                      correctAnswer: q.correctAnswer || q.answer || '',
                      difficulty,
                      explanation: q.explanation || null,
                      codeSnippet: codeSnippet,
                      imageReference: q.imageReference || null,
                    }
                  })
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
                      .map((q: any, index: number) => {
                        const questionText = q.text || q.question || ''
                        const codeSnippet = q.codeSnippet || null
                        
                        // Validate: if question mentions code but no codeSnippet, log warning
                        const codeMentions = /code snippet|given the code|analyze the code|review the code|what does this code|the code below|the code above|following code/i.test(questionText)
                        if (codeMentions && !codeSnippet) {
                          console.warn(`Question ${index + 1} mentions code but has no codeSnippet: "${questionText.substring(0, 100)}..."`)
                        }
                        
                        return {
                          id: `q-${Date.now()}-${index}`,
                          text: questionText,
                          options: Array.isArray(q.options) ? q.options : [],
                          correctAnswer: q.correctAnswer || q.answer || '',
                          difficulty,
                          explanation: q.explanation || null,
                          codeSnippet: codeSnippet,
                          imageReference: q.imageReference || null,
                        }
                      })
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
          explanation: explanation || undefined,
          codeSnippet: undefined,
          imageReference: undefined,
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
    // Use the same prompt structure as main generation but with additional context
    const existingTexts = existingQuestions.map((q, i) => `${i + 1}. ${q.text}`).join('\n')
    const prompt = this.buildQuizGenerationPrompt(content, difficulty, count)
    
    // Add instruction to avoid duplicating existing questions
    const enhancedPrompt = `${prompt}

🚨 CRITICAL: You have already generated ${existingQuestions.length} questions. You MUST now generate EXACTLY ${count} ADDITIONAL, UNIQUE questions that are DIFFERENT from these existing ones.

Existing questions (DO NOT REPEAT THESE):
${existingTexts}

**MANDATORY REQUIREMENTS**: 
- Generate EXACTLY ${count} questions - no more, no less
- Do NOT repeat or rephrase the existing questions above
- Generate ${count} completely NEW questions covering different aspects
- Ensure all ${count} questions are unique and different from the existing ones
- Follow the same format and difficulty level (${difficulty})
- Count your questions before submitting - you MUST submit exactly ${count} questions

${ANSWER_VERIFICATION_INSTRUCTIONS}`

    try {
      console.log(`🔄 Generating ${count} additional questions...`)
      const generatedText = await this.callModelDirect(enhancedPrompt, {
        input: { content, difficulty, count },
        metadata: context.metadata,
      })

      console.log(`📝 Additional questions response length: ${generatedText.length} characters`)
      console.log(`📝 Additional questions preview: ${generatedText.substring(0, 300)}...`)

      const mappedDifficulty: 'Easy' | 'Normal' | 'Hard' | 'Master' =
        difficulty === 'easy' ? 'Easy' : difficulty === 'medium' ? 'Normal' : 'Hard'

      let additionalQuestions: GeneratedQuestion[] = []
      try {
        additionalQuestions = this.parseQuestions(generatedText, mappedDifficulty)
      } catch (parseError) {
        const errorMessage = parseError instanceof Error ? parseError.message : 'Unknown parsing error'
        console.error(`❌ Failed to parse additional questions: ${errorMessage}`)
        console.log(`❌ Failed response preview: ${generatedText.substring(0, 300)}...`)
        // Return empty array on parse failure
        return []
      }
      
      // Filter out duplicates by checking question text similarity
      const uniqueQuestions = additionalQuestions.filter(newQ => {
        return !existingQuestions.some(existingQ => {
          // Check if questions are too similar (more than 80% text match)
          const similarity = this.calculateTextSimilarity(newQ.text, existingQ.text)
          return similarity > 0.8
        })
      })
      
      console.log(`✅ Generated ${additionalQuestions.length} additional questions, ${uniqueQuestions.length} are unique`)
      
      return uniqueQuestions
    } catch (error) {
      console.error('❌ Failed to generate additional questions:', error)
      return []
    }
  }

  private calculateTextSimilarity(text1: string, text2: string): number {
    // Simple similarity calculation based on common words
    const words1 = new Set(text1.toLowerCase().split(/\s+/))
    const words2 = new Set(text2.toLowerCase().split(/\s+/))
    
    const intersection = new Set([...words1].filter(x => words2.has(x)))
    const union = new Set([...words1, ...words2])
    
    return intersection.size / union.size
  }

}

