import React from 'react'
import { Modal } from '../common/Modal'
import { Button } from '../common/Button'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../contexts/ThemeContext'

export interface ResumePromptProps {
  isOpen: boolean
  pauseReason: 'tab-change' | 'manual'
  pausedAt: Date | null
  onResume: () => Promise<void>
}

export function ResumePrompt({
  isOpen,
  pauseReason,
  pausedAt,
  onResume,
}: ResumePromptProps) {
  const { isDark } = useTheme()
  const colors = getThemeColors(isDark)
  const elapsedTime = pausedAt
    ? Math.floor((Date.now() - pausedAt.getTime()) / 1000)
    : 0

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={() => {}} // Prevent closing - user must click Resume
      title="Quiz Paused"
      size="md"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: theme.spacing.lg,
        }}
      >
        <p
          style={{
            fontSize: theme.typography.fontSize.base,
            color: colors.gray[500],
            lineHeight: 1.6,
          }}
        >
          {pauseReason === 'tab-change'
            ? 'The quiz was paused because you switched tabs.'
            : 'The quiz was paused.'}
        </p>
        {pausedAt && (
          <p
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: colors.gray[400],
            }}
          >
            Paused for: {formatTime(elapsedTime)}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: theme.spacing.md,
          }}
        >
          <Button onClick={onResume} variant="primary">
            Resume Quiz
          </Button>
        </div>
      </div>
    </Modal>
  )
}
