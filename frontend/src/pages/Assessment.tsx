import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AssessmentResults } from '../components/quiz/AssessmentResults'
import { AssessmentSummary } from '../components/quiz/AssessmentSummary'
import { AssessmentResult, QuizInstance } from '../types'
import { generateAssessment, expireQuiz } from '../utils/quiz'
import { getStorageItem, STORAGE_KEYS } from '../utils/storage'
import { theme } from '../styles/theme'

export default function Assessment() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [loading, setLoading] = useState(true)
  const isExpired = searchParams.get('expired') === 'true'

  useEffect(() => {
    if (!quizId) {
      navigate('/home')
      return
    }

    // Try to get quiz from storage (might be expired or completed)
    const savedQuiz = getStorageItem<QuizInstance>(STORAGE_KEYS.QUIZ(quizId))

    let quizToProcess: QuizInstance | null = savedQuiz

    // If quiz expired and not yet processed, expire it
    if (isExpired && savedQuiz && savedQuiz.status === 'in-progress') {
      quizToProcess = expireQuiz(savedQuiz)
    }

    if (quizToProcess && (quizToProcess.status === 'completed' || quizToProcess.status === 'expired')) {
      const assessment = generateAssessment(quizToProcess)
      setResult(assessment)
    } else {
      // Fallback: create dummy result if quiz not found (shouldn't happen in normal flow)
      const assessment: AssessmentResult = {
        quizInstanceId: quizId,
        totalScore: 0,
        correctCount: 0,
        incorrectCount: 0,
        unansweredCount: 0,
        performanceReview: 'Unable to load quiz results.',
        weakAreas: [],
        suggestions: ['Please try taking the quiz again.'],
        generatedAt: new Date(),
      }
      setResult(assessment)
    }

    setLoading(false)
  }, [quizId, navigate, isExpired])

  if (loading || !result) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div>Loading results...</div>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: 'calc(100vh - 80px)',
        padding: theme.spacing.xl,
      }}
    >
      {!showSummary ? (
        <AssessmentResults
          result={result}
          onViewSummary={() => setShowSummary(true)}
        />
      ) : (
        <AssessmentSummary result={result} />
      )}
    </motion.div>
  )
}
