import React, { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Clock, CheckCircle, XCircle, AlertCircle, Eye, Trash2 } from 'lucide-react'
import { quizService } from '../services/quizService'
import { QuizInstance } from '../types'
import { useTheme } from '../contexts/ThemeContext'
import { getThemeColors } from '../styles/theme'

export default function QuizHistory() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)

  const [quizzes, setQuizzes] = useState<QuizInstance[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingQuizId, setDeletingQuizId] = useState<string | null>(null)

  useEffect(() => {
    const loadQuizzes = async () => {
      try {
        setLoading(true)
        const quizList = await quizService.listQuizzes()
        // Sort by creation date (newest first)
        quizList.sort((a, b) => {
          const dateA = a.createdAt ? a.createdAt.getTime() : 0
          const dateB = b.createdAt ? b.createdAt.getTime() : 0
          return dateB - dateA
        })
        setQuizzes(quizList)
      } catch (err: any) {
        const errorMessage = err?.message || 'Failed to load quiz history'
        setError(errorMessage)
      } finally {
        setLoading(false)
      }
    }

    loadQuizzes()
  }, [])

  const getStatusIcon = (status: QuizInstance['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle size={18} color="#28a745" />
      case 'expired':
        return <XCircle size={18} color="#f85149" />
      case 'in-progress':
        return <Clock size={18} color="#0969da" />
      case 'pending':
        return <AlertCircle size={18} color="#f59e0b" />
      default:
        return null
    }
  }

  const getStatusColor = (status: QuizInstance['status']) => {
    switch (status) {
      case 'completed':
        return '#28a745'
      case 'expired':
        return '#f85149'
      case 'in-progress':
        return '#0969da'
      case 'pending':
        return '#f59e0b'
      default:
        return colors.text
    }
  }

  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A'
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(date)
  }

  const handleDeleteQuiz = async (quizId: string, e: React.MouseEvent) => {
    e.stopPropagation() // Prevent card click

    if (!window.confirm('Are you sure you want to delete this quiz? This action cannot be undone.')) {
      return
    }

    try {
      setDeletingQuizId(quizId)
      await quizService.deleteQuiz(quizId)
      // Remove quiz from list
      setQuizzes(quizzes.filter(quiz => quiz.id !== quizId))
    } catch (err: any) {
      const errorMessage = err?.message || 'Failed to delete quiz'
      alert(`Error: ${errorMessage}`)
    } finally {
      setDeletingQuizId(null)
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
        <div style={{ fontSize: '18px', color: colors.text }}>Loading quiz history...</div>
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
          gap: '16px',
        }}
      >
        <div style={{ fontSize: '18px', color: colors.text }}>{error}</div>
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
      </div>
    )
  }

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
          maxWidth: '1200px',
          margin: '0 auto',
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 'bold', color: colors.text, marginBottom: '8px' }}>
            Quiz History
          </h1>
          <p style={{ fontSize: '15px', color: colors.text, opacity: 0.7 }}>
            View all your quiz attempts and results
          </p>
        </div>

        {quizzes.length === 0 ? (
          <div
            style={{
              backgroundColor: colors.cardBg,
              border: `1px solid ${colors.border}`,
              padding: '48px',
              borderRadius: '12px',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: '16px', color: colors.text, opacity: 0.7, marginBottom: '24px' }}>
              No quizzes found. Create your first quiz to get started!
            </p>
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
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {quizzes.map((quiz) => (
              <motion.div
                key={quiz.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                style={{
                  backgroundColor: colors.cardBg,
                  border: `1px solid ${colors.border}`,
                  padding: '20px',
                  borderRadius: '12px',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'translateY(-2px)'
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(0,0,0,0.15)'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'translateY(0)'
                  e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)'
                }}
                onClick={() => {
                  if (quiz.status === 'completed' || quiz.status === 'expired') {
                    navigate(`/assessment/${quiz.id}`)
                  } else if (quiz.status === 'in-progress' || quiz.status === 'pending') {
                    navigate(`/quiz/${quiz.id}`)
                  }
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '8px' }}>
                      {getStatusIcon(quiz.status)}
                      <h3 style={{ fontSize: '18px', fontWeight: 600, color: colors.text, margin: 0 }}>
                        {quiz.name || 'Untitled Quiz'}
                      </h3>
                      <span
                        style={{
                          fontSize: '12px',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          backgroundColor: colors.gray[100],
                          color: getStatusColor(quiz.status),
                          fontWeight: 600,
                          textTransform: 'capitalize',
                        }}
                      >
                        {quiz.status}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', marginBottom: '12px' }}>
                      <div style={{ fontSize: '14px', color: colors.text, opacity: 0.7 }}>
                        Questions: {quiz.questions?.length || 0}
                      </div>
                      <div style={{ fontSize: '14px', color: colors.text, opacity: 0.7 }}>
                        Difficulty: {quiz.configuration.difficulty}
                      </div>
                      {quiz.score !== null && (
                        <div style={{ fontSize: '14px', color: colors.text, opacity: 0.7 }}>
                          Score: {quiz.score}%
                        </div>
                      )}
                    </div>

                    <div style={{ fontSize: '13px', color: colors.text, opacity: 0.6 }}>
                      Created: {formatDate(quiz.createdAt)}
                      {quiz.startTime && ` • Started: ${formatDate(quiz.startTime)}`}
                      {quiz.endTime && ` • Completed: ${formatDate(quiz.endTime)}`}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div 
                      style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        cursor: 'pointer',
                        padding: '8px',
                        borderRadius: '6px',
                        transition: 'background-color 0.2s',
                      }}
                      onClick={(e) => {
                        if (quiz.status === 'completed' || quiz.status === 'expired') {
                          navigate(`/assessment/${quiz.id}`)
                        } else if (quiz.status === 'in-progress' || quiz.status === 'pending') {
                          navigate(`/quiz/${quiz.id}`)
                        }
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = isDark ? 'rgba(88, 166, 255, 0.1)' : 'rgba(9, 105, 218, 0.1)'
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                      }}
                    >
                      <Eye size={18} color={colors.text} style={{ opacity: 0.7 }} />
                      <span style={{ fontSize: '14px', color: colors.text, opacity: 0.7 }}>
                        {quiz.status === 'completed' || quiz.status === 'expired' ? 'View Results' : 'Continue Quiz'}
                      </span>
                    </div>
                    <button
                      onClick={(e) => handleDeleteQuiz(quiz.id, e)}
                      disabled={deletingQuizId === quiz.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '8px',
                        backgroundColor: 'transparent',
                        border: `1px solid ${colors.border}`,
                        borderRadius: '6px',
                        cursor: deletingQuizId === quiz.id ? 'not-allowed' : 'pointer',
                        color: '#f85149',
                        transition: 'all 0.2s',
                        opacity: deletingQuizId === quiz.id ? 0.5 : 1,
                      }}
                      onMouseEnter={(e) => {
                        if (deletingQuizId !== quiz.id) {
                          e.currentTarget.style.backgroundColor = 'rgba(248, 81, 73, 0.1)'
                          e.currentTarget.style.borderColor = '#f85149'
                        }
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent'
                        e.currentTarget.style.borderColor = colors.border
                      }}
                      title="Delete quiz"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  )
}

