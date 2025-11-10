import React, { useState, useEffect } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { CheckCircle, XCircle, AlertCircle, TrendingUp, BookOpen } from 'lucide-react'
import { quizService } from '../services/quizService'
import { AssessmentResult } from '../types'
import { useTheme } from '../contexts/ThemeContext'
import { getThemeColors } from '../styles/theme'

export default function Assessment() {
  const { quizId } = useParams<{ quizId: string }>()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const [assessment, setAssessment] = useState<AssessmentResult | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const isExpired = searchParams.get('expired') === 'true'

  useEffect(() => {
    if (!quizId) {
      navigate('/generate-quiz')
      return
    }

    const loadAssessment = async () => {
      try {
        setLoading(true)
        const result = await quizService.getAssessment(quizId)
        setAssessment(result)
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to load assessment'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadAssessment()
  }, [quizId, navigate])

  if (loading) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <div style={{ fontSize: '18px', color: colors.text }}>Loading assessment...</div>
      </div>
    )
  }

  if (error || !assessment) {
    return (
      <div
        style={{
          minHeight: 'calc(100vh - 80px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '18px', color: colors.text }}>{error || 'Assessment not found'}</div>
        <button
          onClick={() => navigate('/generate-quiz')}
          style={{
            padding: '12px 24px',
            backgroundColor: colors.primary,
            color: '#ffffff',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer',
            fontSize: '15px',
            fontWeight: 600,
          }}
        >
          Go Back
        </button>
      </div>
    )
  }

  const scorePercentage = assessment.totalScore
  const isGoodScore = scorePercentage >= 70

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: 'calc(100vh - 80px)',
        padding: '24px',
      }}
    >
      <div
        style={{
          maxWidth: '1000px',
          margin: '0 auto',
          display: 'flex',
          flexDirection: 'column',
          gap: '24px',
        }}
      >
        {/* Header */}
        <div
          style={{
            backgroundColor: colors.cardBg,
            border: `1px solid ${colors.border}`,
            padding: '24px',
            borderRadius: '12px',
            boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            textAlign: 'center',
          }}
        >
          {isExpired && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                marginBottom: '16px',
                color: '#f85149',
                fontSize: '16px',
                fontWeight: 600,
              }}
            >
              <AlertCircle size={20} />
              <span>Quiz Expired</span>
            </div>
          )}

          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.text, marginBottom: '16px' }}>
            Quiz Assessment
          </h1>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '16px',
              marginBottom: '24px',
            }}
          >
            <div
              style={{
                width: '120px',
                height: '120px',
                borderRadius: '50%',
                border: `8px solid ${isGoodScore ? '#28a745' : '#f85149'}`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '32px',
                fontWeight: 'bold',
                color: isGoodScore ? '#28a745' : '#f85149',
              }}
            >
              {scorePercentage}%
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '32px', flexWrap: 'wrap' }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#28a745' }}>{assessment.correctCount}</div>
              <div style={{ fontSize: '14px', color: colors.text, opacity: 0.7 }}>Correct</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: '#f85149' }}>{assessment.incorrectCount}</div>
              <div style={{ fontSize: '14px', color: colors.text, opacity: 0.7 }}>Incorrect</div>
            </div>
            <div style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '24px', fontWeight: 'bold', color: colors.text }}>{assessment.unansweredCount}</div>
              <div style={{ fontSize: '14px', color: colors.text, opacity: 0.7 }}>Unanswered</div>
            </div>
          </div>
        </div>

        {/* Performance Review */}
        {assessment.performanceReview && (
          <div
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <TrendingUp size={20} />
              Performance Review
            </h2>
            <p style={{ fontSize: '15px', color: colors.text, lineHeight: '1.6', whiteSpace: 'pre-wrap' }}>
              {assessment.performanceReview}
            </p>
          </div>
        )}

        {/* Strengths */}
        {assessment.strengths && assessment.strengths.length > 0 && (
          <div
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <CheckCircle size={20} color="#28a745" />
              Strengths
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {assessment.strengths.map((strength, index) => (
                <li
                  key={index}
                  style={{
                    padding: '8px 0',
                    fontSize: '15px',
                    color: colors.text,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <CheckCircle size={16} color="#28a745" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{strength}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Weak Areas */}
        {assessment.weakAreas && assessment.weakAreas.length > 0 && (
          <div
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <XCircle size={20} color="#f85149" />
              Areas for Improvement
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {assessment.weakAreas.map((area, index) => (
                <li
                  key={index}
                  style={{
                    padding: '8px 0',
                    fontSize: '15px',
                    color: colors.text,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <XCircle size={16} color="#f85149" style={{ marginTop: '2px', flexShrink: 0 }} />
                  <span>{area}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Suggestions */}
        {assessment.suggestions && assessment.suggestions.length > 0 && (
          <div
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <BookOpen size={20} />
              Suggestions
            </h2>
            <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
              {assessment.suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  style={{
                    padding: '8px 0',
                    fontSize: '15px',
                    color: colors.text,
                    display: 'flex',
                    alignItems: 'flex-start',
                    gap: '8px',
                  }}
                >
                  <span
                    style={{
                      width: '20px',
                      height: '20px',
                      borderRadius: '50%',
                      backgroundColor: colors.primary,
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '12px',
                      fontWeight: 'bold',
                      flexShrink: 0,
                      marginTop: '2px',
                    }}
                  >
                    {index + 1}
                  </span>
                  <span>{suggestion}</span>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Topics to Review */}
        {assessment.topicsToReview && assessment.topicsToReview.length > 0 && (
          <div
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              padding: '24px',
              borderRadius: '12px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
            }}
          >
            <h2
              style={{
                fontSize: '20px',
                fontWeight: 'bold',
                color: colors.text,
                marginBottom: '16px',
              }}
            >
              Topics to Review
            </h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {assessment.topicsToReview.map((topic, index) => (
                <span
                  key={index}
                  style={{
                    padding: '6px 12px',
                    backgroundColor: colors.gray[100],
                    border: `1px solid ${colors.border}`,
                    borderRadius: '6px',
                    fontSize: '14px',
                    color: colors.text,
                  }}
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '16px' }}>
          <button
            onClick={() => navigate('/generate-quiz')}
            style={{
              padding: '12px 24px',
              backgroundColor: colors.primary,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            Create New Quiz
          </button>
          <button
            onClick={() => navigate('/quiz-history')}
            style={{
              padding: '12px 24px',
              backgroundColor: 'transparent',
              color: colors.text,
              border: `1px solid ${colors.border}`,
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '15px',
              fontWeight: 600,
            }}
          >
            View History
          </button>
        </div>
      </div>
    </motion.div>
  )
}

