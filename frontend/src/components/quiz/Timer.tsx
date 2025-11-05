import React from 'react'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../contexts/ThemeContext'

interface TimerProps {
  timeRemaining: number // in seconds
  totalTime: number // in seconds
}

export const Timer: React.FC<TimerProps> = ({ timeRemaining, totalTime }) => {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const minutes = Math.floor(timeRemaining / 60)
  const seconds = timeRemaining % 60
  const percentage = totalTime > 0 ? (timeRemaining / totalTime) * 100 : 0

  const getColor = () => {
    if (percentage > 50) return colors.success
    if (percentage > 25) return colors.warning
    return colors.error
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: theme.spacing.sm,
      }}
    >
      <div
        style={{
          fontSize: theme.typography.fontSize['3xl'],
          fontWeight: theme.typography.fontWeight.bold,
          color: getColor(),
          fontFamily: theme.typography.fontFamily.mono.join(', '),
        }}
      >
        {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
      </div>
      <div
        style={{
          width: '200px',
          height: '8px',
          backgroundColor: colors.gray[200],
          borderRadius: theme.borderRadius.full,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: getColor(),
            transition: 'width 1s linear, background-color 0.3s',
          }}
        />
      </div>
    </div>
  )
}
