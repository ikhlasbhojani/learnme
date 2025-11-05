import React, { useState, useEffect } from 'react'
import { Question } from '../../types'
import { Button } from '../common/Button'
import { theme, getThemeColors } from '../../styles/theme'
import { useTheme } from '../../contexts/ThemeContext'

interface QuestionCardProps {
  question: Question
  selectedAnswer: string | null
  onAnswerSelect: (answer: string) => void
  onNext: () => void
  onFinish: () => void
  isLastQuestion: boolean
}

export const QuestionCard: React.FC<QuestionCardProps> = ({
  question,
  selectedAnswer,
  onAnswerSelect,
  onNext,
  onFinish,
  isLastQuestion,
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
      <div
        style={{
          marginBottom: theme.spacing.lg,
          padding: theme.spacing.sm,
          backgroundColor: colors.gray[50],
          borderRadius: theme.borderRadius.md,
          fontSize: theme.typography.fontSize.sm,
          color: colors.gray[500],
          fontWeight: theme.typography.fontWeight.medium,
        }}
      >
        Difficulty: {question.difficulty}
      </div>

      <h2
        style={{
          fontSize: theme.typography.fontSize['2xl'],
          fontWeight: theme.typography.fontWeight.semibold,
          marginBottom: theme.spacing.xl,
          color: colors.text,
        }}
      >
        {question.text}
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: theme.spacing.md }}>
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option
          return (
            <button
              key={index}
              onClick={() => onAnswerSelect(option)}
              style={{
                padding: theme.spacing.lg,
                border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                borderRadius: theme.borderRadius.md,
                backgroundColor: isSelected ? colors.gray[50] : colors.cardBg,
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: theme.typography.fontSize.base,
                color: colors.text,
                transition: `all ${theme.transitions.normal}`,
                fontWeight: isSelected
                  ? theme.typography.fontWeight.medium
                  : theme.typography.fontWeight.normal,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                position: 'relative',
              }}
              onMouseEnter={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = colors.gray[400]
                  e.currentTarget.style.backgroundColor = colors.gray[50]
                }
              }}
              onMouseLeave={(e) => {
                if (!isSelected) {
                  e.currentTarget.style.borderColor = colors.border
                  e.currentTarget.style.backgroundColor = colors.cardBg
                }
              }}
            >
              <span>{String.fromCharCode(65 + index)}. {option}</span>
              {isSelected && (
                <span
                  style={{
                    fontSize: theme.typography.fontSize.lg,
                    color: colors.primary,
                    fontWeight: theme.typography.fontWeight.bold,
                  }}
                >
                  ✓
                </span>
              )}
            </button>
          )
        })}
      </div>

      <div
        style={{
          marginTop: theme.spacing.xl,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: theme.spacing.sm,
        }}
      >
        {!selectedAnswer && (
          <span
            style={{
              fontSize: theme.typography.fontSize.sm,
              color: colors.gray[500],
              fontStyle: 'italic',
            }}
          >
            Please select an option to continue
          </span>
        )}
        {isLastQuestion ? (
          <Button
            variant="primary"
            size="lg"
            onClick={onFinish}
          >
            Finish Quiz
          </Button>
        ) : (
          <Button
            variant="primary"
            size="lg"
            onClick={onNext}
            disabled={!selectedAnswer}
          >
            Next Question
          </Button>
        )}
      </div>
    </div>
  )
}
