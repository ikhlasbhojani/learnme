import React from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Button } from '../components/common/Button'
import { theme, getThemeColors } from '../styles/theme'
import { useTheme } from '../contexts/ThemeContext'

export default function LearningModes() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const [searchParams] = useSearchParams()
  const inputType = searchParams.get('input') || 'manual'

  const handleMCQs = () => {
    navigate('/quiz-config')
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: 'calc(100vh - 80px)',
        padding: theme.spacing.xl,
        maxWidth: '1200px',
        margin: '0 auto',
      }}
    >
      <h1
        style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          marginBottom: theme.spacing['2xl'],
          textAlign: 'center',
          color: colors.text,
        }}
      >
        Choose Learning Mode
      </h1>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
          gap: theme.spacing.xl,
        }}
      >
        {/* MCQs Mode - Enabled */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          style={{
            backgroundColor: colors.cardBg,
            padding: theme.spacing['2xl'],
            borderRadius: theme.borderRadius.xl,
            boxShadow: theme.shadows.lg,
            border: `2px solid ${colors.primary}`,
          }}
        >
          <h2
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
              color: colors.text,
            }}
          >
            MCQs
          </h2>
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: colors.gray[500],
              marginBottom: theme.spacing.lg,
            }}
          >
            Test your knowledge with multiple choice questions
          </p>
          <Button variant="primary" size="lg" onClick={handleMCQs} style={{ width: '100%' }}>
            Start MCQs
          </Button>
        </motion.div>

        {/* Mind Map Mode - Enabled */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          whileHover={{ scale: 1.02 }}
          style={{
            backgroundColor: colors.cardBg,
            padding: theme.spacing['2xl'],
            borderRadius: theme.borderRadius.xl,
            boxShadow: theme.shadows.lg,
            border: `2px solid ${colors.primary}`,
          }}
        >
          <h2
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.semibold,
              marginBottom: theme.spacing.md,
              color: colors.text,
            }}
          >
            Mind Map
          </h2>
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: colors.gray[500],
              marginBottom: theme.spacing.lg,
            }}
          >
            Explore interactive mind maps of learning materials and generate quizzes from any chapter
          </p>
          <Button
            variant="primary"
            size="lg"
            onClick={() => navigate('/books')}
            style={{ width: '100%' }}
          >
            Explore Mind Maps
          </Button>
        </motion.div>

        {/* Coming Soon Modes */}
        {['Create Notes', 'Questions & Answers'].map((mode, index) => (
          <motion.div
            key={mode}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 * (index + 2) }}
            style={{
              backgroundColor: theme.colors.neutral[50],
              padding: theme.spacing['2xl'],
              borderRadius: theme.borderRadius.xl,
              boxShadow: theme.shadows.md,
              border: `1px solid ${theme.colors.neutral[200]}`,
              opacity: 0.6,
              position: 'relative',
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: theme.spacing.md,
                right: theme.spacing.md,
                backgroundColor: theme.colors.neutral[500],
                color: 'white',
                padding: `${theme.spacing.xs} ${theme.spacing.sm}`,
                borderRadius: theme.borderRadius.md,
                fontSize: theme.typography.fontSize.xs,
                fontWeight: theme.typography.fontWeight.medium,
              }}
            >
              Coming Soon
            </div>
            <h2
              style={{
                fontSize: theme.typography.fontSize['2xl'],
                fontWeight: theme.typography.fontWeight.semibold,
                marginBottom: theme.spacing.md,
                color: colors.gray[500],
              }}
            >
              {mode}
            </h2>
            <p
              style={{
                fontSize: theme.typography.fontSize.sm,
                color: colors.gray[400],
                marginBottom: theme.spacing.lg,
              }}
            >
              This feature is coming soon
            </p>
            <Button variant="ghost" size="lg" disabled style={{ width: '100%' }}>
              Unavailable
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  )
}
