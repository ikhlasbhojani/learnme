import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { AssessmentResults } from '../components/quiz/AssessmentResults'
import { AssessmentSummary } from '../components/quiz/AssessmentSummary'
import { AssessmentResult } from '../types'
import { quizService } from '../services/quizService'
import { theme } from '../styles/theme'

export default function Assessment() {
  const { quizId } = useParams<{ quizId: string }>()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const [result, setResult] = useState<AssessmentResult | null>(null)
  const [quizName, setQuizName] = useState<string | null>(null)
  const [showSummary, setShowSummary] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!quizId) {
      navigate('/home')
      return
    }

    const fetchAssessment = async () => {
      try {
        setLoading(true)
        setError(null)
        // Fetch both assessment and quiz info
        const [assessment, quiz] = await Promise.all([
          quizService.fetchAssessment(quizId),
          quizService.fetchQuiz(quizId).catch(() => null), // Don't fail if quiz fetch fails
        ])
        setResult(assessment)
        setQuizName(quiz?.name || null)
      } catch (err) {
        console.error('Failed to fetch assessment:', err)
        setError(err instanceof Error ? err.message : 'Failed to load assessment')
        // Fallback: create dummy result
        const assessment: AssessmentResult = {
          quizInstanceId: quizId,
          totalScore: 0,
          correctCount: 0,
          incorrectCount: 0,
          unansweredCount: 0,
          performanceReview: 'Unable to load quiz results. Please try again later.',
          weakAreas: [],
          suggestions: ['Please try refreshing the page or taking the quiz again.'],
          generatedAt: new Date(),
        }
        setResult(assessment)
      } finally {
        setLoading(false)
      }
    }

    fetchAssessment()
  }, [quizId, navigate])

  if (loading || !result) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: theme.spacing.md,
        }}
      >
        <div>Loading assessment results...</div>
        {error && (
          <div style={{ color: theme.colors.error, fontSize: theme.typography.fontSize.sm }}>
            {error}
          </div>
        )}
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
          quizName={quizName}
          onViewSummary={() => setShowSummary(true)}
        />
      ) : (
        <AssessmentSummary result={result} quizName={quizName} />
      )}
    </motion.div>
  )
}
