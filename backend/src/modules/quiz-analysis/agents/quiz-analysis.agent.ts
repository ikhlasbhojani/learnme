import { BaseAgent, type AgentContext, type AgentResult } from '../../quiz-generation/agents/base.agent'
import { type IQuizDocument } from '../../quiz/quiz.model'

export interface QuizAnalysisResult {
  performanceReview: string
  weakAreas: string[]
  suggestions: string[]
  detailedAnalysis: string
  strengths: string[]
  improvementAreas: string[]
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

    try {
      const analysis = await this.analyzeQuiz(quiz, answers)

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
    answers: Record<string, string>
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

    // Build analysis prompt
    const prompt = this.buildAnalysisPrompt(
      score,
      correctCount,
      incorrectCount,
      unansweredCount,
      difficultyStats,
      answeredQuestionsList,
      totalQuestions
    )

    try {
      const analysisText = await this.callModelDirect(prompt, {
        input: context.input,
        metadata: context.metadata,
      })

      // Parse the analysis
      return this.parseAnalysis(analysisText, difficultyStats, score)
    } catch (error) {
      // Fallback to basic analysis if AI parsing fails
      return this.generateBasicAnalysis(
        score,
        correctCount,
        incorrectCount,
        unansweredCount,
        difficultyStats
      )
    }
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
    totalQuestions: number
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
${incorrectQuestions.slice(0, 8).map((q, i) => 
  `${i + 1}. [${q.difficulty}] ${q.question.substring(0, 150)}${q.question.length > 150 ? '...' : ''}\n   ❌ Your Answer: ${q.userAnswer}\n   ✅ Correct Answer: ${q.correctAnswer}`
).join('\n\n')}

${correctQuestions.length > 0 ? `\nCorrect Answers (showing strengths):\n${correctQuestions.slice(0, 5).map((q, i) => 
  `${i + 1}. [${q.difficulty}] ${q.question.substring(0, 150)}${q.question.length > 150 ? '...' : ''}\n   ✅ Correctly answered: ${q.userAnswer}`
).join('\n\n')}` : ''}

=== ANALYSIS REQUIREMENTS ===
Provide a comprehensive analysis in this EXACT JSON format (NO trailing commas, valid JSON only):
{
  "performanceReview": "A detailed 3-4 paragraph comprehensive review covering: overall performance assessment, score interpretation, what the score means in context, key observations about the user's knowledge level, and an encouraging but honest evaluation. Be specific about what they did well and what needs work.",
  "weakAreas": ["List specific weak areas. For each difficulty level where performance < 60%, include: 'Difficulty Level: [Easy/Normal/Hard/Master]' and specific topics/concepts that were missed. Be specific - e.g., 'Hard: Advanced concepts in [topic]', 'Normal: Application of [concept]'"],
  "suggestions": ["Provide 5-7 actionable, specific suggestions. Each should be: 1) Specific to their weak areas, 2) Actionable (what to do, not just 'study more'), 3) Prioritized (most important first). Examples: 'Focus on practicing [specific topic] questions at [difficulty] level', 'Review [specific concept] before attempting harder questions', 'Take practice quizzes focusing on [weak area]'"],
  "strengths": ["List 3-5 specific strengths. Be specific: 'Strong performance in [difficulty] level questions', 'Good understanding of [topic/concept]', 'Consistent accuracy in [area]'. Include positive reinforcement."],
  "improvementAreas": ["List 3-5 specific areas needing improvement. Be detailed: 'Master difficulty questions - scored [X]%', 'Time management - [X] unanswered questions', 'Concept application in [specific area]'. Include specific metrics."],
  "detailedAnalysis": "A comprehensive 4-5 paragraph detailed analysis covering: 1) Performance patterns and trends, 2) Specific analysis of incorrect answers (what patterns emerge, what concepts were misunderstood), 3) Difficulty progression analysis (how performance changes across difficulty levels), 4) Learning gaps identification (specific knowledge gaps), 5) Personalized learning path recommendations (what to study next, in what order, how to progress). Be very specific and detailed."
}

=== CRITICAL INSTRUCTIONS ===
1. Be SPECIFIC - mention actual difficulty levels, topics, and concepts
2. Be ACTIONABLE - every suggestion should tell them WHAT to do, not just what's wrong
3. Be ENCOURAGING - highlight strengths while being honest about weaknesses
4. Be DETAILED - the detailedAnalysis should be comprehensive (4-5 paragraphs)
5. Use the actual data provided - reference specific scores, difficulty levels, and question patterns
6. Return ONLY valid JSON - no markdown, no code blocks, no extra text

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
        
        // Clean JSON string
        jsonStr = jsonStr
          // Remove trailing commas before closing brackets/braces
          .replace(/,(\s*[\]}])/g, '$1')
          // Fix common quote issues
          .replace(/(['"])?([a-zA-Z0-9_]+)(['"])?\s*:/g, '"$2":')
          // Remove any control characters
          .replace(/[\x00-\x1F\x7F]/g, '')
          // Fix double commas
          .replace(/,,+/g, ',')
          // Remove commas at start of objects/arrays
          .replace(/(\[|\{)\s*,/g, '$1')
        
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
            console.warn('Aggressive JSON clean also failed, using basic analysis')
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

  private aggressiveJsonClean(jsonStr: string): string {
    try {
      // Remove any text before first { and after last }
      const firstBrace = jsonStr.indexOf('{')
      const lastBrace = jsonStr.lastIndexOf('}')
      
      if (firstBrace === -1 || lastBrace === -1 || firstBrace >= lastBrace) {
        throw new Error('No valid object structure found')
      }
      
      let cleaned = jsonStr.substring(firstBrace, lastBrace + 1)
      
      // More aggressive cleaning
      cleaned = cleaned
        // Remove trailing commas
        .replace(/,(\s*[}\]])/g, '$1')
        // Fix unquoted keys
        .replace(/(\{|,)\s*([a-zA-Z_][a-zA-Z0-9_]*)\s*:/g, '$1"$2":')
        // Remove duplicate commas
        .replace(/,+/g, ',')
        // Remove commas at start of objects/arrays
        .replace(/(\[|\{)\s*,/g, '$1')
        // Fix newlines in strings (replace with space)
        .replace(/"\s*\n\s*"/g, '" "')
        // Remove any standalone commas
        .replace(/,\s*,/g, ',')
        // Fix missing commas between objects
        .replace(/\}\s*\{/g, '},{')
        // Remove any control characters except newlines in strings
        .replace(/[\x00-\x09\x0B-\x1F\x7F]/g, '')
      
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

