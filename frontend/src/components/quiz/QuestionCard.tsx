import React from 'react'
import { motion } from 'framer-motion'
import { Check, ArrowRight, Square, FileQuestion, Code, Image as ImageIcon } from 'lucide-react'
import { Question } from '../../types'
import { useTheme } from '../../contexts/ThemeContext'
import { getThemeColors } from '../../styles/theme'

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

  const handleNext = () => {
    if (selectedAnswer) {
      if (isLastQuestion) {
        onFinish()
      } else {
        onNext()
      }
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      style={{
        backgroundColor: colors.cardBg,
        border: `1px solid ${colors.border}`,
        borderRadius: '12px',
        padding: '24px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      }}
    >
      {/* Question Label */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
        <FileQuestion size={18} color={colors.text} style={{ opacity: 0.7 }} />
        <span style={{ fontSize: '14px', fontWeight: 600, color: colors.text, opacity: 0.7 }}>
          Question
        </span>
        {question.difficulty && (
          <span
            style={{
              fontSize: '12px',
              padding: '2px 8px',
              borderRadius: '4px',
              backgroundColor: colors.gray[100],
              color: colors.text,
              fontWeight: 500,
            }}
          >
            {question.difficulty}
          </span>
        )}
      </div>

      {/* Question Text */}
      <h3
        style={{
          fontSize: '18px',
          fontWeight: 600,
          color: colors.text,
          marginBottom: '24px',
          lineHeight: '1.6',
        }}
      >
        {question.text}
      </h3>

      {/* Code Snippet */}
      {question.codeSnippet && (
        <div
          style={{
            backgroundColor: colors.gray[50],
            border: `1px solid ${colors.border}`,
            borderRadius: '8px',
            padding: '16px',
            marginBottom: '24px',
            fontFamily: 'monospace',
            fontSize: '14px',
            overflowX: 'auto',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
            <Code size={16} color={colors.text} style={{ opacity: 0.7 }} />
            <span style={{ fontSize: '12px', color: colors.text, opacity: 0.7 }}>Code Snippet</span>
          </div>
          <pre style={{ margin: 0, color: colors.text, whiteSpace: 'pre-wrap' }}>{question.codeSnippet}</pre>
        </div>
      )}

      {/* Image Reference */}
      {question.imageReference && (
        <div
          style={{
            marginBottom: '24px',
            borderRadius: '8px',
            overflow: 'hidden',
            border: `1px solid ${colors.border}`,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '8px', backgroundColor: colors.gray[50] }}>
            <ImageIcon size={16} color={colors.text} style={{ opacity: 0.7 }} />
            <span style={{ fontSize: '12px', color: colors.text, opacity: 0.7 }}>Image Reference</span>
          </div>
          <img
            src={question.imageReference}
            alt="Question reference"
            style={{ width: '100%', display: 'block' }}
            onError={(e) => {
              e.currentTarget.style.display = 'none'
            }}
          />
        </div>
      )}

      {/* Answer Options */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '24px' }}>
        {question.options.map((option, index) => {
          const optionLetter = String.fromCharCode(65 + index) // A, B, C, D
          const isSelected =
            selectedAnswer !== null && selectedAnswer !== undefined && selectedAnswer !== '' && selectedAnswer === option

          return (
            <motion.button
              key={index}
              onClick={() => onAnswerSelect(option)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                padding: '16px',
                borderRadius: '8px',
                border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                backgroundColor: isSelected ? colors.gray[50] : 'transparent',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'all 0.2s',
              }}
            >
              {/* Checkbox Indicator */}
              <div
                style={{
                  flexShrink: 0,
                  width: '20px',
                  height: '20px',
                  borderRadius: '4px',
                  border: `2px solid ${isSelected ? colors.primary : colors.border}`,
                  backgroundColor: isSelected ? colors.primary : 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s',
                }}
              >
                {isSelected ? (
                  <Check size={14} color={isDark ? '#ffffff' : '#ffffff'} strokeWidth={3} />
                ) : (
                  <Square size={14} color={colors.text} strokeWidth={2} fill="none" style={{ opacity: 0.5 }} />
                )}
              </div>

              {/* Option Letter */}
              <div
                style={{
                  width: '32px',
                  height: '32px',
                  borderRadius: '50%',
                  backgroundColor: isSelected ? colors.primary : colors.gray[100],
                  color: isSelected ? '#ffffff' : colors.text,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontWeight: 600,
                  fontSize: '14px',
                  flexShrink: 0,
                }}
              >
                {optionLetter}
              </div>

              {/* Option Text */}
              <div style={{ flex: 1, color: colors.text, fontSize: '15px', lineHeight: '1.5' }}>{option}</div>
            </motion.button>
          )
        })}
      </div>

      {/* Next/Finish Button */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
        {!selectedAnswer && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 16px',
              color: colors.text,
              opacity: 0.6,
              fontSize: '14px',
            }}
          >
            <Square size={14} strokeWidth={2} fill="none" />
            <span>Select an option to continue</span>
          </motion.div>
        )}

        {selectedAnswer && (
          <motion.button
            onClick={handleNext}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '12px 24px',
              backgroundColor: colors.primary,
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              fontSize: '15px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <span>{isLastQuestion ? 'Finish Quiz' : 'Next Question'}</span>
            <ArrowRight size={18} />
          </motion.button>
        )}
      </div>
    </motion.div>
  )
}

