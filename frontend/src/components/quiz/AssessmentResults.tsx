import React from 'react'
import { AssessmentResult } from '../../types'
import { Button } from '../common/Button'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../contexts/ThemeContext'

interface AssessmentResultsProps {
  result: AssessmentResult
  onViewSummary: () => void
}

export const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  result,
  onViewSummary,
}) => {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  
  return (
    <div
      style={{
        backgroundColor: colors.cardBg,
        padding: theme.spacing['2xl'],
        borderRadius: theme.borderRadius.xl,
        boxShadow: theme.shadows.lg,
        border: `1px solid ${colors.border}`,
        maxWidth: '800px',
        margin: '0 auto',
      }}
    >
      <h2
        style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          marginBottom: theme.spacing.xl,
          textAlign: 'center',
          color: colors.text,
        }}
      >
        Quiz Results
      </h2>

      {/* Score Display */}
      <div
        style={{
          textAlign: 'center',
          marginBottom: theme.spacing['2xl'],
        }}
      >
        <div
          style={{
            fontSize: theme.typography.fontSize['4xl'],
            fontWeight: theme.typography.fontWeight.bold,
            color:
              result.totalScore >= 90
                ? colors.success
                : result.totalScore >= 70
                ? colors.info
                : result.totalScore >= 50
                ? colors.warning
                : colors.error,
            marginBottom: theme.spacing.md,
          }}
        >
          {result.totalScore}%
        </div>
        <div
          style={{
            fontSize: theme.typography.fontSize.lg,
            color: colors.gray[500],
          }}
        >
          {result.correctCount} Correct • {result.incorrectCount} Incorrect
          {result.unansweredCount > 0 && ` • ${result.unansweredCount} Unanswered`}
        </div>
      </div>

      {/* Stats Grid */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(3, 1fr)',
          gap: theme.spacing.md,
          marginBottom: theme.spacing.xl,
        }}
      >
        <div
          style={{
            padding: theme.spacing.lg,
            backgroundColor: colors.success + '20',
            borderRadius: theme.borderRadius.md,
            textAlign: 'center',
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: colors.success,
            }}
          >
            {result.correctCount}
          </div>
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: colors.gray[500],
            }}
          >
            Correct
          </div>
        </div>

        <div
          style={{
            padding: theme.spacing.lg,
            backgroundColor: colors.error + '20',
            borderRadius: theme.borderRadius.md,
            textAlign: 'center',
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: colors.error,
            }}
          >
            {result.incorrectCount}
          </div>
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: colors.gray[500],
            }}
          >
            Incorrect
          </div>
        </div>

        <div
          style={{
            padding: theme.spacing.lg,
            backgroundColor: colors.gray[50],
            borderRadius: theme.borderRadius.md,
            textAlign: 'center',
            border: `1px solid ${colors.border}`,
          }}
        >
          <div
            style={{
              fontSize: theme.typography.fontSize['2xl'],
              fontWeight: theme.typography.fontWeight.bold,
              color: colors.text,
            }}
          >
            {result.correctCount + result.incorrectCount + result.unansweredCount}
          </div>
          <div
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: colors.gray[500],
            }}
          >
            Total
          </div>
        </div>
      </div>

      <Button
        variant="primary"
        size="lg"
        onClick={onViewSummary}
        style={{ width: '100%' }}
      >
        View Summary
      </Button>
    </div>
  )
}
