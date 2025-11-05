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
      `You are a quiz analysis agent. Your job is to analyze quiz results and provide comprehensive feedback.
      Analyze the user's performance based on:
      - Overall score and percentage
      - Correct vs incorrect answers
      - Difficulty levels of questions answered correctly/incorrectly
      - Questions left unanswered
      - Time taken (if available)
      
      Provide:
      1. A comprehensive performance review
      2. Identification of weak areas (difficulty levels or topics)
      3. Actionable suggestions for improvement
      4. Identification of strengths
      5. Specific improvement areas
      6. A detailed analysis explaining the performance`
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
      const analysisText = await this.aiProvider.generateText(prompt)

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
    return `Analyze this quiz performance and provide comprehensive feedback.

Performance Summary:
- Overall Score: ${score.toFixed(1)}%
- Correct Answers: ${correctCount}
- Incorrect Answers: ${incorrectCount}
- Unanswered Questions: ${unansweredCount}
- Total Questions: ${totalQuestions}

Performance by Difficulty Level:
${Object.entries(difficultyStats)
  .map(
    ([diff, stats]) =>
      `- ${diff}: ${stats.correct}/${stats.total} correct (${((stats.correct / stats.total) * 100).toFixed(1)}%)`
  )
  .join('\n')}

Sample Questions Answered:
${answeredQuestions.slice(0, 10).map((q, i) => `${i + 1}. ${q.question}\n   Your Answer: ${q.userAnswer}\n   Correct Answer: ${q.correctAnswer}\n   Result: ${q.isCorrect ? 'Correct' : 'Incorrect'}\n   Difficulty: ${q.difficulty}`).join('\n\n')}

Please provide a comprehensive analysis in the following JSON format:
{
  "performanceReview": "A detailed 2-3 paragraph review of the overall performance",
  "weakAreas": ["array of difficulty levels or topics where performance was weak"],
  "suggestions": ["array of actionable suggestions for improvement"],
  "strengths": ["array of identified strengths"],
  "improvementAreas": ["array of specific areas that need improvement"],
  "detailedAnalysis": "A comprehensive paragraph explaining the performance, patterns, and insights"
}

Focus on:
1. Identifying patterns in correct/incorrect answers
2. Difficulty level performance (Easy, Normal, Hard, Master)
3. Specific areas that need attention
4. Actionable recommendations
5. Positive reinforcement for strengths

Generate the analysis now:`
  }

  private parseAnalysis(
    analysisText: string,
    difficultyStats: Record<string, { correct: number; total: number; incorrect: number }>,
    score: number
  ): QuizAnalysisResult {
    try {
      // Try to extract JSON from response
      const jsonMatch = analysisText.match(/\{[\s\S]*\}/)
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0])
        return {
          performanceReview: parsed.performanceReview || '',
          weakAreas: Array.isArray(parsed.weakAreas) ? parsed.weakAreas : [],
          suggestions: Array.isArray(parsed.suggestions) ? parsed.suggestions : [],
          strengths: Array.isArray(parsed.strengths) ? parsed.strengths : [],
          improvementAreas: Array.isArray(parsed.improvementAreas) ? parsed.improvementAreas : [],
          detailedAnalysis: parsed.detailedAnalysis || '',
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

  private generateBasicAnalysis(
    score: number,
    correctCount: number,
    incorrectCount: number,
    unansweredCount: number,
    difficultyStats: Record<string, { correct: number; total: number; incorrect: number }>
  ): QuizAnalysisResult {
    const weakAreas: string[] = []
    const strengths: string[] = []

    Object.entries(difficultyStats).forEach(([difficulty, stats]) => {
      const percentage = (stats.correct / stats.total) * 100
      if (percentage < 50) {
        weakAreas.push(difficulty)
      } else if (percentage >= 75) {
        strengths.push(difficulty)
      }
    })

    let performanceReview = ''
    if (score >= 90) {
      performanceReview =
        'Excellent performance! You have demonstrated a strong understanding of the material across all difficulty levels.'
    } else if (score >= 70) {
      performanceReview =
        'Good performance! You have a solid grasp of most concepts, with room for improvement in some areas.'
    } else if (score >= 50) {
      performanceReview =
        'Fair performance. There is room for improvement in several areas. Focus on reviewing the material and practicing more.'
    } else {
      performanceReview =
        'Needs improvement. Consider reviewing the material more thoroughly and taking additional practice quizzes.'
    }

    const suggestions: string[] = []
    if (weakAreas.length > 0) {
      suggestions.push(`Focus on ${weakAreas.join(' and ')} difficulty questions to improve your understanding.`)
    }
    if (unansweredCount > 0) {
      suggestions.push(
        `Try to answer all questions. You left ${unansweredCount} question${unansweredCount > 1 ? 's' : ''} unanswered.`
      )
    }
    if (score < 70) {
      suggestions.push('Review the material again and take another quiz to reinforce learning.')
    }
    if (suggestions.length === 0) {
      suggestions.push('Keep up the great work! Continue practicing to maintain your skills.')
    }

    return {
      performanceReview,
      weakAreas,
      suggestions,
      strengths,
      improvementAreas: weakAreas,
      detailedAnalysis: `You scored ${score.toFixed(1)}% with ${correctCount} correct and ${incorrectCount} incorrect answers. ${performanceReview}`,
    }
  }
}

