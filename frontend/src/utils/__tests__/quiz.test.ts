import { describe, it, expect, beforeEach, vi } from 'vitest'
import { QuizInstance, QuizConfiguration } from '../../types'
import { createQuiz, pauseQuiz, resumeQuiz } from '../quiz'

// Mock the generateQuestions function
vi.mock('../mockQuestions', () => ({
  generateQuestions: vi.fn(() => [
    {
      id: 'q1',
      question: 'Test Question 1',
      options: ['A', 'B', 'C', 'D'],
      correctAnswer: 'A',
      difficulty: 'easy',
    },
  ]),
}))

describe('pauseQuiz', () => {
  let quiz: QuizInstance

  beforeEach(() => {
    quiz = createQuiz('user1', {
      timeLimit: 30,
      questionCount: 10,
      difficulty: 'medium',
    })
    quiz.status = 'in-progress'
    quiz.startTime = new Date()
  })

  it('should pause an in-progress quiz with tab-change reason', () => {
    const pausedQuiz = pauseQuiz(quiz, 'tab-change')

    expect(pausedQuiz.pauseReason).toBe('tab-change')
    expect(pausedQuiz.pausedAt).toBeInstanceOf(Date)
    expect(pausedQuiz.pauseCount).toBe(1)
    expect(pausedQuiz.status).toBe('in-progress')
  })

  it('should pause an in-progress quiz with manual reason', () => {
    const pausedQuiz = pauseQuiz(quiz, 'manual')

    expect(pausedQuiz.pauseReason).toBe('manual')
    expect(pausedQuiz.pausedAt).toBeInstanceOf(Date)
    expect(pausedQuiz.pauseCount).toBe(1)
  })

  it('should throw error when quiz is not in progress', () => {
    quiz.status = 'pending'

    expect(() => pauseQuiz(quiz)).toThrow('Quiz not in progress')
  })

  it('should ignore pause if quiz is already paused', () => {
    const firstPause = pauseQuiz(quiz, 'tab-change')
    const secondPause = pauseQuiz(firstPause, 'tab-change')

    expect(secondPause.pauseCount).toBe(1)
    expect(secondPause.pausedAt).toEqual(firstPause.pausedAt)
  })

  it('should increment pauseCount on subsequent pauses', () => {
    const firstPause = pauseQuiz(quiz, 'tab-change')
    // Resume first
    const resumed = resumeQuiz(firstPause)
    // Pause again
    const secondPause = pauseQuiz(resumed, 'tab-change')

    expect(secondPause.pauseCount).toBe(2)
  })
})

describe('resumeQuiz', () => {
  let quiz: QuizInstance

  beforeEach(() => {
    quiz = createQuiz('user1', {
      timeLimit: 30,
      questionCount: 10,
      difficulty: 'medium',
    })
    quiz.status = 'in-progress'
    quiz.startTime = new Date()
  })

  it('should resume a paused quiz', () => {
    const pausedQuiz = pauseQuiz(quiz, 'tab-change')
    const resumedQuiz = resumeQuiz(pausedQuiz)

    expect(resumedQuiz.pauseReason).toBeNull()
    expect(resumedQuiz.pausedAt).toBeNull()
    expect(resumedQuiz.status).toBe('in-progress')
    expect(resumedQuiz.pauseCount).toBe(1) // pauseCount should remain
  })

  it('should throw error when quiz is not paused', () => {
    expect(() => resumeQuiz(quiz)).toThrow('Quiz is not paused')
  })

  it('should preserve all other quiz properties when resuming', () => {
    const pausedQuiz = pauseQuiz(quiz, 'tab-change')
    pausedQuiz.answers = { q1: 'A' }
    pausedQuiz.currentQuestionIndex = 2

    const resumedQuiz = resumeQuiz(pausedQuiz)

    expect(resumedQuiz.answers).toEqual({ q1: 'A' })
    expect(resumedQuiz.currentQuestionIndex).toBe(2)
    expect(resumedQuiz.id).toBe(pausedQuiz.id)
    expect(resumedQuiz.userId).toBe(pausedQuiz.userId)
  })
})
