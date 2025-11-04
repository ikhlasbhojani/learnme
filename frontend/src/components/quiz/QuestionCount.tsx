import React from 'react'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../contexts/ThemeContext'

export interface QuestionCountProps {
  current: number
  total: number
  format?: 'full' | 'remaining'
}

export function QuestionCount({
  current,
  total,
  format = 'full',
}: QuestionCountProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const remaining = total - current

  const displayText =
    format === 'full'
      ? `Question ${current} of ${total}`
      : `${remaining} question${remaining !== 1 ? 's' : ''} remaining`

  return (
    <div
      className="question-count"
      aria-label={`Question ${current} of ${total}`}
      style={{
        fontSize: theme.typography.fontSize.base,
        fontWeight: theme.typography.fontWeight.medium,
        color: colors.gray[500],
        padding: `${theme.spacing.sm} ${theme.spacing.md}`,
        backgroundColor: colors.gray[50],
        borderRadius: theme.borderRadius.md,
        display: 'inline-block',
      }}
    >
      {displayText}
    </div>
  )
}
