import React from 'react'
import { QuizConfiguration } from '../../types'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { validateQuizConfiguration } from '../../utils/validation'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../contexts/ThemeContext'

interface QuizConfigProps {
  difficulty: QuizConfiguration['difficulty']
  numberOfQuestions: string
  timeDuration: string
  onDifficultyChange: (difficulty: QuizConfiguration['difficulty']) => void
  onQuestionsChange: (value: string) => void
  onDurationChange: (value: string) => void
  onStart: () => void
  errors: string[]
  loading?: boolean
}

export const QuizConfig: React.FC<QuizConfigProps> = ({
  difficulty,
  numberOfQuestions,
  timeDuration,
  onDifficultyChange,
  onQuestionsChange,
  onDurationChange,
  onStart,
  errors,
  loading = false,
}) => {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const isFormValid = difficulty && numberOfQuestions && timeDuration && errors.length === 0

  return (
    <div
      style={{
        width: '100%',
        maxWidth: '500px',
        backgroundColor: colors.cardBg,
        padding: theme.spacing['2xl'],
        borderRadius: theme.borderRadius.xl,
        boxShadow: theme.shadows.lg,
        border: `1px solid ${colors.border}`,
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
        Configure Your Quiz
      </h1>

      <div style={{ marginBottom: theme.spacing.lg }}>
        <label
          style={{
            display: 'block',
            marginBottom: theme.spacing.sm,
            fontSize: theme.typography.fontSize.sm,
            fontWeight: theme.typography.fontWeight.medium,
            color: colors.gray[500],
          }}
        >
          Difficulty Level
        </label>
        <select
          value={difficulty}
          onChange={(e) => onDifficultyChange(e.target.value as QuizConfiguration['difficulty'])}
          style={{
            width: '100%',
            padding: theme.spacing.md,
            fontSize: theme.typography.fontSize.base,
            border: `1px solid ${colors.border}`,
            borderRadius: theme.borderRadius.md,
            backgroundColor: colors.cardBg,
            color: colors.text,
          }}
        >
          <option value="Easy">Easy</option>
          <option value="Normal">Normal</option>
          <option value="Hard">Hard</option>
          <option value="Master">Master</option>
        </select>
      </div>

      <Input
        type="number"
        label="Number of Questions"
        value={numberOfQuestions}
        onChange={(e) => onQuestionsChange(e.target.value)}
        min="1"
        required
        helperText="Enter any positive number"
      />

      <Input
        type="number"
        label="Time Duration (seconds)"
        value={timeDuration}
        onChange={(e) => onDurationChange(e.target.value)}
        min="1"
        required
        helperText="Enter time in seconds (e.g., 600 for 10 minutes)"
      />

      {errors.length > 0 && (
        <div
          style={{
            marginBottom: theme.spacing.md,
            padding: theme.spacing.md,
            backgroundColor: colors.error + '20',
            color: colors.error,
            borderRadius: theme.borderRadius.md,
            fontSize: theme.typography.fontSize.sm,
          }}
        >
          {errors.join(', ')}
        </div>
      )}

      <Button
        variant="primary"
        size="lg"
        onClick={onStart}
        disabled={!isFormValid || loading}
        isLoading={loading}
        style={{ width: '100%' }}
      >
        Start Quiz
      </Button>
    </div>
  )
}
