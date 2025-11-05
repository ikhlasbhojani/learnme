import React, { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { quizService } from '../services/quizService'
import { QuizInstance } from '../types'
import { theme, getThemeColors } from '../styles/theme'
import { useTheme } from '../contexts/ThemeContext'
import { Button } from '../components/common/Button'

export default function QuizHistory() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const [quizzes, setQuizzes] = useState<QuizInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadQuizzes()
  }, [])

  const loadQuizzes = async () => {
    setLoading(true)
    setError(null)
    try {
      const allQuizzes = await quizService.fetchAllQuizzes()
      // Sort by most recent first
      const sorted = allQuizzes.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0
        const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0
        return dateB - dateA
      })
      setQuizzes(sorted)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load quiz history')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Date(date).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  const getStatusColor = (status: QuizInstance['status']) => {
    switch (status) {
      case 'completed':
        return theme.colors.success || '#10b981'
      case 'expired':
        return theme.colors.warning || '#f59e0b'
      case 'in-progress':
        return theme.colors.primary[600]
      case 'pending':
        return theme.colors.neutral[500]
      default:
        return theme.colors.neutral[500]
    }
  }

  const getStatusLabel = (status: QuizInstance['status']) => {
    switch (status) {
      case 'completed':
        return 'Completed'
      case 'expired':
        return 'Expired'
      case 'in-progress':
        return 'In Progress'
      case 'pending':
        return 'Pending'
      default:
        return status
    }
  }

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
        <div>Loading quiz history...</div>
      </div>
    )
  }

  if (error) {
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
        <div style={{ color: colors.error }}>{error}</div>
        <Button onClick={loadQuizzes}>Retry</Button>
      </div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        minHeight: 'calc(100vh - 80px)',
        padding: theme.spacing.xl,
        position: 'relative',
      }}
    >
      <div style={{ maxWidth: '1200px', margin: '0 auto', position: 'relative', zIndex: 1 }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: theme.spacing['2xl'],
            flexWrap: 'wrap',
            gap: theme.spacing.lg,
          }}
        >
          <h1
            style={{
              fontSize: 'clamp(2rem, 4vw, 2.5rem)',
              fontWeight: theme.typography.fontWeight.bold,
              color: colors.text,
            }}
          >
            Assessment History
          </h1>
          <Button variant="primary" onClick={() => navigate('/quiz-config')}>
            Start New Quiz
          </Button>
        </div>

        {quizzes.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: theme.spacing['3xl'],
              background: colors.cardBg,
              borderRadius: theme.borderRadius['2xl'],
              boxShadow: theme.shadows.lg,
              border: `1px solid ${colors.border}`,
            }}
          >
            <p
              style={{
                fontSize: theme.typography.fontSize.lg,
                color: colors.text,
                marginBottom: theme.spacing.lg,
                fontWeight: theme.typography.fontWeight.medium,
              }}
            >
              No quiz attempts found
            </p>
            <Button variant="primary" onClick={() => navigate('/quiz-config')}>
              Start Your First Quiz
            </Button>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
              gap: theme.spacing.lg,
            }}
          >
            {quizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.03, y: -8 }}
                style={{
                  background: colors.cardBg,
                  padding: theme.spacing.xl,
                  borderRadius: theme.borderRadius['2xl'],
                  boxShadow: theme.shadows.lg,
                  cursor: 'pointer',
                  border: `1px solid ${colors.border}`,
                  transition: `all ${theme.transitions.normal}`,
                }}
                onClick={() => {
                  if (quiz.status === 'completed' || quiz.status === 'expired') {
                    navigate(`/assessment/${quiz.id}`)
                  } else if (quiz.status === 'in-progress') {
                    navigate(`/quiz/${quiz.id}`)
                  }
                }}
              >
                {quiz.name && (
                  <div
                    style={{
                      marginBottom: theme.spacing.md,
                    }}
                  >
                    <h3
                      style={{
                        fontSize: theme.typography.fontSize.xl,
                        fontWeight: theme.typography.fontWeight.bold,
                        color: colors.text,
                        marginBottom: theme.spacing.xs,
                        lineHeight: 1.3,
                      }}
                    >
                      {quiz.name}
                    </h3>
                  </div>
                )}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'flex-start',
                    marginBottom: theme.spacing.md,
                  }}
                >
                  <div>
                    <div
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: colors.gray[500],
                        marginBottom: theme.spacing.xs,
                        fontWeight: theme.typography.fontWeight.medium,
                      }}
                    >
                      {formatDate(quiz.createdAt)}
                    </div>
                    <div
                      style={{
                        fontSize: theme.typography.fontSize.sm,
                        color: colors.text,
                        fontWeight: theme.typography.fontWeight.semibold,
                      }}
                    >
                      {quiz.configuration.difficulty} • {quiz.questions.length} Questions
                    </div>
                  </div>
                  <div
                    style={{
                      padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                      backgroundColor: getStatusColor(quiz.status) + '20',
                      color: getStatusColor(quiz.status),
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.xs,
                      fontWeight: theme.typography.fontWeight.medium,
                    }}
                  >
                    {getStatusLabel(quiz.status)}
                  </div>
                </div>

                {quiz.status === 'completed' || quiz.status === 'expired' ? (
                  <div
                    style={{
                      marginTop: theme.spacing.md,
                      padding: theme.spacing.md,
                      background: colors.gray[50],
                      borderRadius: theme.borderRadius.lg,
                      border: `1px solid ${colors.border}`,
                    }}
                  >
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                      }}
                    >
                      <div>
                        <div
                          style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: colors.gray[500],
                            marginBottom: theme.spacing.xs,
                            fontWeight: theme.typography.fontWeight.medium,
                          }}
                        >
                          Score
                        </div>
                        <div
                          style={{
                            fontSize: theme.typography.fontSize['2xl'],
                            fontWeight: theme.typography.fontWeight.bold,
                            color: colors.text,
                          }}
                        >
                          {quiz.score !== null ? `${quiz.score.toFixed(1)}%` : 'N/A'}
                        </div>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div
                          style={{
                            fontSize: theme.typography.fontSize.xs,
                            color: colors.gray[500],
                            marginBottom: theme.spacing.xs,
                            fontWeight: theme.typography.fontWeight.medium,
                          }}
                        >
                          Correct
                        </div>
                        <div
                          style={{
                            fontSize: theme.typography.fontSize.lg,
                            fontWeight: theme.typography.fontWeight.semibold,
                            color: '#10b981',
                            textShadow: '0 2px 10px rgba(16, 185, 129, 0.3)',
                          }}
                        >
                          {quiz.correctCount ?? 0}/{quiz.questions.length}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div
                    style={{
                      marginTop: theme.spacing.md,
                      padding: theme.spacing.md,
                      background: colors.gray[50],
                      borderRadius: theme.borderRadius.md,
                      fontSize: theme.typography.fontSize.sm,
                      color: colors.text,
                      fontWeight: theme.typography.fontWeight.medium,
                    }}
                  >
                    {quiz.status === 'in-progress'
                      ? 'Click to continue quiz'
                      : 'Quiz not started yet'}
                  </div>
                )}

                {(quiz.status === 'completed' || quiz.status === 'expired') && (
                  <div
                    style={{
                      marginTop: theme.spacing.md,
                      padding: theme.spacing.sm,
                      textAlign: 'center',
                      fontSize: theme.typography.fontSize.xs,
                      color: colors.text,
                      fontWeight: theme.typography.fontWeight.semibold,
                    }}
                  >
                    Click to view detailed assessment →
                  </div>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

