import { BaseAgent, type AgentContext, type AgentResult } from '../../quiz-generation/agents/base.agent'
import { type IQuizDocument } from '../../quiz/quiz.model'

export interface QuizAnalysisResult {
  performanceReview: string
  weakAreas: string[]
  suggestions: string[]
  detailedAnalysis: string
  strengths: string[]
  improvementAreas: string[]
  topicsToReview?: string[]
}

export class QuizAnalysisAgent extends BaseAgent {
  constructor() {
    super(
      'QuizAnalyzer',
      `You are an expert quiz analysis agent specializing in providing detailed, actionable feedback on quiz performance.
      
      Your role is to:
      1. Analyze quiz results comprehensively
      2. Identify specific weak areas and patterns
      3. Provide detailed, actionable improvement strategies
      4. Highlight strengths to build confidence
      5. Offer personalized learning recommendations
      
      Always provide:
      - Detailed performance breakdown by difficulty level
      - Specific weak areas with examples
      - Concrete, actionable improvement steps
      - Encouragement and positive reinforcement
      - Learning path recommendations`
    )
  }

  async run(context: AgentContext): Promise<AgentResult> {
    const quiz = context.input.quiz as IQuizDocument
    const answers = context.input.answers as Record<string, string>
    const originalContent = context.input.originalContent as string | null | undefined
    const userId = context.metadata?.userId

    try {
      await this.ensureAIProvider(userId)
      const analysis = await this.analyzeQuiz(quiz, answers, originalContent, userId)

      return {
        output: analysis,
        metadata: {
          analyzedAt: new Date().toISOString(),
          quizId: quiz.id,
        },
      }
    } catch (error) {
      throw new Error(
        `Quiz analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      )
    }
  }

  private async analyzeQuiz(
    quiz: IQuizDocument,
    answers: Record<string, string>,
    originalContent: string | null | undefined,
    userId?: string
  ): Promise<QuizAnalysisResult> {
    const totalQuestions = quiz.questions.length
    const answeredQuestions = Object.keys(answers).length
    const unansweredCount = totalQuestions - answeredQuestions

    // Calculate performance by difficulty
    const difficultyStats: Record<string, { correct: number; total: number; incorrect: number }> =
      {}
    const answeredQuestionsList: Array<{
      question: string
      userAnswer: string
      correctAnswer: string
      difficulty: string
      isCorrect: boolean
    }> = []

    quiz.questions.forEach((question) => {
      const diff = question.difficulty
      if (!difficultyStats[diff]) {
        difficultyStats[diff] = { correct: 0, total: 0, incorrect: 0 }
      }
      difficultyStats[diff].total += 1

      const userAnswer = answers[question.id]
      if (userAnswer) {
        const isCorrect = userAnswer === question.correctAnswer
        if (isCorrect) {
          difficultyStats[diff].correct += 1
        } else {
          difficultyStats[diff].incorrect += 1
        }

        answeredQuestionsList.push({
          question: question.text,
          userAnswer,
          correctAnswer: question.correctAnswer,
          difficulty: diff,
          isCorrect,
        })
      }
    })

    const score = quiz.score || 0
    const correctCount = quiz.correctCount || 0
    const incorrectCount = quiz.incorrectCount || 0

    // Extract topics from wrong questions using AI
    const incorrectQuestions = answeredQuestionsList.filter(q => !q.isCorrect)
    let topicsToReview: string[] = []
    
    if (incorrectQuestions.length > 0) {
      try {
        topicsToReview = await this.extractTopicsFromWrongQuestions(
          incorrectQuestions,
          originalContent,
          userId
        )
      } catch (error) {
        console.warn('Failed to extract topics from wrong questions:', error)
      }
    }

    // Build analysis prompt
    const prompt = this.buildAnalysisPrompt(
      score,
      correctCount,
      incorrectCount,
      unansweredCount,
      difficultyStats,
      answeredQuestionsList,
      totalQuestions,
      topicsToReview,
      originalContent
    )

    try {
      const analysisText = await this.callModelDirect(prompt, {
        input: { quiz, answers, originalContent },
        metadata: { userId: quiz.userId, quizId: quiz.id },
      })

      // Parse the analysis
      const analysis = this.parseAnalysis(analysisText, difficultyStats, score)
      
      // Add topics to review
      return {
        ...analysis,
        topicsToReview,
      }
    } catch (error) {
      // Fallback to basic analysis if AI parsing fails
      const basicAnalysis = this.generateBasicAnalysis(
        score,
        correctCount,
        incorrectCount,
        unansweredCount,
        difficultyStats
      )
      return {
        ...basicAnalysis,
        topicsToReview,
      }
    }
  }

  private async extractTopicsFromWrongQuestions(
    incorrectQuestions: Array<{
      question: string
      userAnswer: string
      correctAnswer: string
      difficulty: string
      isCorrect: boolean
    }>,
    originalContent: string | null | undefined,
    userId?: string
  ): Promise<string[]> {
    if (incorrectQuestions.length === 0) {
      return []
    }

    const questionsText = incorrectQuestions
      .map((q, i) => `${i + 1}. ${q.question}\n   Your Answer: ${q.userAnswer}\n   Correct Answer: ${q.correctAnswer}`)
      .join('\n\n')

    const prompt = `Analyze the following questions that were answered incorrectly and identify the specific topics, concepts, or subject areas that the user needs to review.

${originalContent ? `Original Content Context:\n${originalContent.substring(0, 2000)}${originalContent.length > 2000 ? '...' : ''}\n\n` : ''}

Incorrect Questions:
${questionsText}

Based on these incorrect answers, identify 5-10 specific topics, concepts, or subject areas that the user should focus on reviewing. Be specific and actionable.

Return ONLY a JSON array of topic strings, no other text:
["Topic 1", "Topic 2", "Topic 3", ...]`

    try {
      const response = await this.callModelDirect(prompt, {
        input: { originalContent },
        metadata: userId ? { userId } : {},
      })

      // Clean and parse JSON
      let cleaned = response.trim()
      if (cleaned.startsWith('```')) {
        cleaned = cleaned.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      }

      const arrayMatch = cleaned.match(/\[[\s\S]*\]/)
      if (arrayMatch) {
        let jsonStr = arrayMatch[0]
          .replace(/,(\s*[\]}])/g, '$1')
          .replace(/[\x00-\x1F\x7F]/g, '')
        
        const parsed = JSON.parse(jsonStr)
        if (Array.isArray(parsed)) {
          return parsed.filter((t): t is string => typeof t === 'string' && t.trim().length > 0)
        }
      }
    } catch (error) {
      console.warn('Failed to extract topics:', error)
    }

    return []
  }

  private buildAnalysisPrompt(
    score: number,
    correctCount: number,
    incorrectCount: number,
    unansweredCount: number,
    difficultyStats: Record<string, { correct: number; total: number; incorrect: number }>,
    answeredQuestions: Array<{
      question: string
      userAnswer: string
      correctAnswer: string
      difficulty: string
      isCorrect: boolean
    }>,
    totalQuestions: number,
    topicsToReview: string[],
    originalContent: string | null | undefined
  ): string {
    // Calculate detailed statistics
    const incorrectQuestions = answeredQuestions.filter(q => !q.isCorrect)
    const correctQuestions = answeredQuestions.filter(q => q.isCorrect)
    
    // Analyze patterns in incorrect answers
    const incorrectByDifficulty: Record<string, number> = {}
    incorrectQuestions.forEach(q => {
      incorrectByDifficulty[q.difficulty] = (incorrectByDifficulty[q.difficulty] || 0) + 1
    })

    return `You are analyzing a quiz performance. Provide a DETAILED, COMPREHENSIVE analysis with specific insights and actionable recommendations.

=== PERFORMANCE METRICS ===
Overall Score: ${score.toFixed(1)}%
- Correct Answers: ${correctCount} out of ${totalQuestions} (${((correctCount / totalQuestions) * 100).toFixed(1)}%)
- Incorrect Answers: ${incorrectCount} (${((incorrectCount / totalQuestions) * 100).toFixed(1)}%)
- Unanswered Questions: ${unansweredCount} (${((unansweredCount / totalQuestions) * 100).toFixed(1)}%)

=== PERFORMANCE BY DIFFICULTY LEVEL ===
${Object.entries(difficultyStats)
  .map(([diff, stats]) => {
    const percentage = ((stats.correct / stats.total) * 100).toFixed(1)
    const performance = percentage >= 80 ? 'Excellent' : percentage >= 60 ? 'Good' : percentage >= 40 ? 'Needs Improvement' : 'Weak'
    return `- ${diff}: ${stats.correct}/${stats.total} correct (${percentage}%) - ${performance}`
  })
  .join('\n')}

=== INCORRECT ANSWERS ANALYSIS ===
Total Incorrect: ${incorrectCount}
Breakdown by Difficulty:
${Object.entries(incorrectByDifficulty)
  .map(([diff, count]) => `- ${diff}: ${count} incorrect`)
  .join('\n')}

=== SAMPLE QUESTIONS FOR ANALYSIS ===
Incorrect Answers (showing patterns):
${incorrectQuestions.slice(0, 10).map((q, i) => 
  `${i + 1}. [${q.difficulty}] ${q.question}\n   ❌ Your Answer: ${q.userAnswer}\n   ✅ Correct Answer: ${q.correctAnswer}`
).join('\n\n')}

${correctQuestions.length > 0 ? `\nCorrect Answers (showing strengths):\n${correctQuestions.slice(0, 5).map((q, i) => 
  `${i + 1}. [${q.difficulty}] ${q.question.substring(0, 200)}${q.question.length > 200 ? '...' : ''}\n   ✅ Correctly answered: ${q.userAnswer}`
).join('\n\n')}` : ''}

${topicsToReview.length > 0 ? `\n=== IDENTIFIED TOPICS TO REVIEW ===\n${topicsToReview.map((t, i) => `${i + 1}. ${t}`).join('\n')}\n` : ''}

${originalContent ? `\n=== ORIGINAL CONTENT CONTEXT ===\n${originalContent.substring(0, 3000)}${originalContent.length > 3000 ? '\n... (content truncated)' : ''}\n` : ''}

=== ANALYSIS REQUIREMENTS ===
Provide a comprehensive analysis in this EXACT JSON format (NO trailing commas, valid JSON only):
{
  "performanceReview": "A detailed 4-5 paragraph comprehensive review covering: 1) Overall performance assessment with specific score interpretation, 2) What the score means in the context of the material covered, 3) Key observations about the user's knowledge level and understanding, 4) Specific patterns observed in correct vs incorrect answers, 5) An encouraging but honest evaluation with specific examples. Reference actual questions and topics where relevant.",
  "weakAreas": ["List specific weak areas based on the incorrect questions. For each difficulty level where performance < 60%, include: 'Difficulty Level: [Easy/Normal/Hard/Master] - [specific topic/concept]'. Reference the identified topics to review. Be very specific - e.g., 'Hard: Advanced concepts in [specific topic from topics list]', 'Normal: Application of [specific concept]', 'Master: Understanding of [specific topic]'. Include at least 5-7 specific weak areas."],
  "suggestions": ["Provide 7-10 actionable, specific suggestions. Each should be: 1) Specific to their weak areas and the topics identified, 2) Actionable (what to do, not just 'study more'), 3) Prioritized (most important first), 4) Reference specific topics from the topics to review list. Examples: 'Review [specific topic from topics list] - focus on [specific aspect]', 'Practice [specific topic] questions at [difficulty] level', 'Re-read the section on [specific topic] and take notes', 'Create flashcards for [specific concept]', 'Take another quiz focusing on [weak area]'. Be very specific and actionable."],
  "strengths": ["List 4-6 specific strengths. Be specific: 'Strong performance in [difficulty] level questions about [specific topic]', 'Good understanding of [topic/concept] - answered [X] questions correctly', 'Consistent accuracy in [area] - [specific examples]', 'Excellent grasp of [concept] as shown by correct answers to [specific questions]'. Include positive reinforcement with specific examples."],
  "improvementAreas": ["List 5-7 specific areas needing improvement. Be detailed: 'Master difficulty questions about [specific topic] - scored [X]%', 'Time management - [X] unanswered questions', 'Concept application in [specific area] - missed [X] questions', 'Understanding of [specific topic] - got [X] out of [Y] questions wrong', 'Application of [concept] in practical scenarios'. Include specific metrics and reference topics."],
  "detailedAnalysis": "A comprehensive 6-8 paragraph detailed analysis covering: 1) Performance patterns and trends with specific statistics, 2) Deep analysis of incorrect answers (what patterns emerge, what concepts were misunderstood, why the wrong answers were chosen), 3) Difficulty progression analysis (how performance changes across difficulty levels, where the user struggles most), 4) Learning gaps identification (specific knowledge gaps based on wrong questions and topics), 5) Topic-specific analysis (which topics from the identified list need the most attention and why), 6) Personalized learning path recommendations (what to study next, in what order, how to progress, which topics to prioritize), 7) Study strategy recommendations (how to approach reviewing the weak areas). Be very specific, reference actual questions, topics, and provide actionable insights."
}

=== CRITICAL INSTRUCTIONS ===
1. Be SPECIFIC - mention actual difficulty levels, topics from the topics list, and concepts from the questions
2. Be ACTIONABLE - every suggestion should tell them WHAT to do, not just what's wrong. Reference specific topics to review.
3. Be ENCOURAGING - highlight strengths while being honest about weaknesses
4. Be DETAILED - the detailedAnalysis should be comprehensive (6-8 paragraphs), performanceReview should be 4-5 paragraphs
5. Use the actual data provided - reference specific scores, difficulty levels, question patterns, and topics
6. Reference the identified topics to review throughout your analysis
7. Analyze WHY questions were wrong - what concepts were misunderstood
8. Provide topic-specific recommendations based on the topics list
9. Return ONLY valid JSON - no markdown, no code blocks, no extra text

Generate the detailed analysis now:`
  }

  private parseAnalysis(
    analysisText: string,
    difficultyStats: Record<string, { correct: number; total: number; incorrect: number }>,
    score: number
  ): QuizAnalysisResult {
    try {
      // Clean the text - remove markdown code blocks
      let cleanedText = analysisText.trim()
      if (cleanedText.startsWith('```')) {
        cleanedText = cleanedText.replace(/^```(?:json)?\s*/i, '').replace(/\s*```$/, '')
      }

      // Try to extract JSON from response
      const jsonMatch = cleanedText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        let jsonStr = jsonMatch[0]
        
        // Clean JSON string - more comprehensive cleaning
        jsonStr = this.cleanJsonString(jsonStr)
        
        try {
          const parsed = JSON.parse(jsonStr)
          return {
            performanceReview: parsed.performanceReview || '',
            weakAreas: Array.isArray(parsed.weakAreas) ? parsed.weakAreas : [],
            suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
            strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
            improvementAreas: Array.isArray(parsed.improvementAreas) ? parsed.improvementAreas : [],
            detailedAnalysis: parsed.detailedAnalysis || '',
          }
        } catch (parseError) {
          console.warn('JSON parse failed after cleaning, trying aggressive clean:', parseError)
          // Try aggressive cleaning
          try {
            jsonStr = this.aggressiveJsonClean(jsonStr)
            const parsed = JSON.parse(jsonStr)
            return {
              performanceReview: parsed.performanceReview || '',
              weakAreas: Array.isArray(parsed.weakAreas) ? parsed.weakAreas : [],
              suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
              strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
              improvementAreas: Array.isArray(parsed.improvementAreas) ? parsed.improvementAreas : [],
              detailedAnalysis: parsed.detailedAnalysis || '',
            }
          } catch (finalError) {
            console.warn('Aggressive JSON clean also failed, trying object extraction:', finalError)
            // Last resort: try to extract and fix the JSON object
            try {
              const fixed = this.extractAndFixJsonObject(jsonStr)
              if (fixed) {
                const parsed = JSON.parse(fixed)
                return {
                  performanceReview: parsed.performanceReview || '',
                  weakAreas: Array.isArray(parsed.weakAreas) ? parsed.weakAreas : [],
                  suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
                  strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
                  improvementAreas: Array.isArray(parsed.improvementAreas) ? parsed.improvementAreas : [],
                  detailedAnalysis: parsed.detailedAnalysis || '',
                }
              }
            } catch {
              console.warn('Object extraction also failed, using basic analysis')
            }
          }
        }
      }
    } catch (error) {
      console.warn('Failed to parse AI analysis, using basic analysis:', error)
    }

    // Fallback to basic analysis
    return this.generateBasicAnalysis(
      score,
      difficultyStats['Easy']?.correct || 0,
      difficultyStats['Easy']?.incorrect || 0,
      0,
      difficultyStats
    )
  }

  private extractAndFixJsonObject(jsonStr: string): string | null {
    // Extract the main JSON object and try to fix it
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
              let cleaned = this.cleanJsonString(currentObj)
              const test = JSON.parse(cleaned)
              if (test && typeof test === 'object') {
                return cleaned
              }
            } catch {
              // Invalid object, continue searching
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
    
    return null
  }

  private cleanJsonString(jsonStr: string): string {
    // Comprehensive JSON cleaning with multiple passes
    let cleaned = jsonStr
      // Remove trailing commas before closing brackets/braces (multiple passes)
      .replace(/,(\s*[\]}])/g, '$1')
      .replace(/,(\s*[\]}])/g, '$1') // Second pass for nested structures
      // Fix common quote issues
      .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
      // Fix double commas
      .replace(/,,+/g, ',')
      // Remove commas at start of objects/arrays
      .replace(/(\[|\{)\s*,/g, '$1')
      // Fix missing commas between array elements (but be careful with strings)
      .replace(/\]\s*\[/g, '],[')
    
    // Fix arrays specifically
    cleaned = this.fixJsonArrays(cleaned)
    
    // Remove control characters (but preserve escaped ones)
    cleaned = cleaned.replace(/[\x00-\x08\x0B-\x0C\x0E-\x1F\x7F]/g, '')
    
    return cleaned
  }

  private fixJsonArrays(jsonStr: string): string {
    // Fix malformed arrays by processing them carefully
    // This handles cases where array elements are missing commas or have other issues
    let result = ''
    let inString = false
    let escapeNext = false
    let arrayDepth = 0
    let lastChar = ''
    let lastNonWhitespace = ''
    
    for (let i = 0; i < jsonStr.length; i++) {
      const char = jsonStr[i]
      
      if (escapeNext) {
        escapeNext = false
        result += char
        lastChar = char
        if (!/\s/.test(char)) lastNonWhitespace = char
        continue
      }
      
      if (char === '\\') {
        escapeNext = true
        result += char
        lastChar = char
        lastNonWhitespace = char
        continue
      }
      
      if (char === '"' && !escapeNext) {
        inString = !inString
        result += char
        lastChar = char
        lastNonWhitespace = char
        continue
      }
      
      if (!inString) {
        if (char === '[') {
          arrayDepth++
          result += char
          lastChar = char
          lastNonWhitespace = char
        } else if (char === ']') {
          arrayDepth--
          // Remove trailing comma before closing bracket
          if (lastNonWhitespace === ',') {
            // Find and remove the last comma
            let commaPos = result.lastIndexOf(',')
            if (commaPos > 0) {
              // Check if it's actually a trailing comma (not inside a string)
              let beforeComma = result.substring(Math.max(0, commaPos - 10), commaPos)
              if (!beforeComma.includes('"') || beforeComma.split('"').length % 2 === 0) {
                result = result.substring(0, commaPos) + result.substring(commaPos + 1)
              }
            }
          }
          result += char
          lastChar = char
          lastNonWhitespace = char
        } else if (char === ',' && arrayDepth > 0) {
          // Ensure we don't have double commas or comma after opening bracket
          if (lastNonWhitespace !== ',' && lastNonWhitespace !== '[' && lastNonWhitespace !== '{') {
            result += char
            lastChar = char
            lastNonWhitespace = char
          }
        } else if (/\s/.test(char)) {
          // Whitespace - preserve it
          result += char
          lastChar = char
        } else {
          // Regular character - just add it
          result += char
          lastChar = char
          lastNonWhitespace = char
        }
      } else {
        result += char
        lastChar = char
        lastNonWhitespace = char
      }
    }
    
    // Final pass: remove any remaining trailing commas before ]
    result = result.replace(/,(\s*\])/g, '$1')
    
    return result
  }

  private aggressiveJsonClean(jsonStr: string): string {
    try {
      // Remove any text before first { and after last }
      const firstBrace = jsonStr.indexOf('{')
      const lastBrace = jsonStr.lastIndexOf('}')
      
      if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        throw new Error('No valid object structure found')
      }
      
      let cleaned = jsonStr.substring(firstBrace, lastBrace + 1)
      
      // Use the comprehensive cleaning method
      cleaned = this.cleanJsonString(cleaned)
      
      // Additional aggressive fixes
      cleaned = cleaned
        // Fix unquoted keys
        .replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
        // Remove duplicate commas
        .replace(/,+/g, ',')
        // Fix missing commas between objects
        .replace(/\}\s*\{/g, '},{')
      
      return cleaned
    } catch (error) {
      console.warn('Aggressive JSON clean failed:', error)
      return jsonStr
    }
  }

  private generateBasicAnalysis(
    score: number,
    correctCount: number,
    incorrectCount: number,
    unansweredCount: number,
    difficultyStats: Record<string, { correct: number; total: number; incorrect: number }>
  ): QuizAnalysisResult {
    const weakAreas: string[] = []
    const strengths: string[] = []
    const improvementAreas: string[] = []

    // Analyze performance by difficulty
    Object.entries(difficultyStats).forEach(([difficulty, stats]) => {
      const percentage = (stats.correct / stats.total) * 100
      if (percentage < 50) {
        weakAreas.push(`${difficulty} difficulty (${percentage.toFixed(1)}% correct)`)
        improvementAreas.push(`${difficulty} level questions - scored ${percentage.toFixed(1)}% (${stats.correct}/${stats.total} correct)`)
      } else if (percentage >= 75) {
        strengths.push(`Strong performance in ${difficulty} level questions (${percentage.toFixed(1)}% correct)`)
      } else {
        improvementAreas.push(`${difficulty} level questions - scored ${percentage.toFixed(1)}% (needs improvement)`)
      }
    })

    // Generate detailed performance review
    let performanceReview = ''
    if (score >= 90) {
      performanceReview = `Excellent performance! You scored ${score.toFixed(1)}% with ${correctCount} correct answers out of ${correctCount + incorrectCount + unansweredCount} total questions. You have demonstrated a strong understanding of the material across all difficulty levels. Your consistent accuracy shows solid comprehension of the core concepts.`
    } else if (score >= 70) {
      performanceReview = `Good performance! You scored ${score.toFixed(1)}% with ${correctCount} correct and ${incorrectCount} incorrect answers. You have a solid grasp of most concepts, with room for improvement in some areas. Focus on the areas where you struggled to further enhance your understanding.`
    } else if (score >= 50) {
      performanceReview = `Fair performance. You scored ${score.toFixed(1)}% with ${correctCount} correct and ${incorrectCount} incorrect answers. There is room for improvement in several areas. Focus on reviewing the material more thoroughly and practicing more questions, especially in the difficulty levels where you struggled.`
    } else {
      performanceReview = `Your score of ${score.toFixed(1)}% indicates that you need to review the material more thoroughly. You answered ${correctCount} questions correctly and ${incorrectCount} incorrectly. Consider going back to the source material, focusing on the fundamental concepts, and taking additional practice quizzes to reinforce your learning.`
    }

    // Generate actionable suggestions
    const suggestions: string[] = []
    if (weakAreas.length > 0) {
      suggestions.push(`Focus on practicing ${weakAreas.map(a => a.split(' ')[0]).join(' and ')} difficulty questions to improve your understanding in these areas.`)
    }
    if (unansweredCount > 0) {
      suggestions.push(
        `Try to answer all questions. You left ${unansweredCount} question${unansweredCount > 1 ? 's' : ''} unanswered, which affected your score. Practice time management to ensure you can attempt all questions.`
      )
    }
    if (score < 70) {
      suggestions.push('Review the source material again, paying special attention to the concepts you missed, and take another quiz to reinforce your learning.')
    }
    if (incorrectCount > correctCount) {
      suggestions.push('Consider reviewing the fundamental concepts before attempting more advanced questions. Build a strong foundation first.')
    }
    if (suggestions.length === 0) {
      suggestions.push('Keep up the great work! Continue practicing to maintain and further improve your skills.')
    }

    // Generate detailed analysis
    const difficultyBreakdown = Object.entries(difficultyStats)
      .map(([diff, stats]) => {
        const pct = ((stats.correct / stats.total) * 100).toFixed(1)
        return `${diff}: ${stats.correct}/${stats.total} (${pct}%)`
      })
      .join(', ')

    const detailedAnalysis = `Performance Analysis:
You achieved an overall score of ${score.toFixed(1)}%, answering ${correctCount} questions correctly, ${incorrectCount} incorrectly, and leaving ${unansweredCount} unanswered.

Performance Breakdown by Difficulty:
${difficultyBreakdown}

${weakAreas.length > 0 ? `Areas needing attention: ${weakAreas.join(', ')}.` : ''}
${strengths.length > 0 ? `Your strengths: ${strengths.join(', ')}.` : ''}

${score >= 70 ? 'You have a solid foundation. Continue practicing to maintain and improve your performance.' : 'Focus on reviewing the material, especially in the areas where you struggled, and take practice quizzes to reinforce your learning.'}`

    return {
      performanceReview,
      weakAreas: weakAreas.map(a => a.split('(')[0].trim()),
      suggestions,
      strengths,
      improvementAreas,
      detailedAnalysis,
    }
  }
}

