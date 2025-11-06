import React from 'react'
import { Check, ArrowRight, Circle, FileQuestion, Code, Image as ImageIcon } from 'lucide-react'
import { Question } from '../../types'
import { Button } from '../common/Button'
import { useTheme } from '../../contexts/ThemeContext'
import { motion } from 'framer-motion'

interface QuestionCardProps {
  question: Question
  selectedAnswer: string | null
  onAnswerSelect: (answer: string) => void
  onNext: () => void
  onFinish: () => void
  isLastQuestion: boolean
}

const difficultyColors = {
  Easy: { bg: 'bg-green-500/10', text: 'text-green-600', border: 'border-green-500/20', darkText: 'text-green-400', darkBg: 'bg-green-500/10' },
  Normal: { bg: 'bg-blue-500/10', text: 'text-blue-600', border: 'border-blue-500/20', darkText: 'text-blue-400', darkBg: 'bg-blue-500/10' },
  Hard: { bg: 'bg-orange-500/10', text: 'text-orange-600', border: 'border-orange-500/20', darkText: 'text-orange-400', darkBg: 'bg-orange-500/10' },
  Master: { bg: 'bg-red-500/10', text: 'text-red-600', border: 'border-red-500/20', darkText: 'text-red-400', darkBg: 'bg-red-500/10' },
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
  const difficultyColor = difficultyColors[question.difficulty] || difficultyColors.Normal
  
  return (
    <div className="w-full max-w-[1200px] mx-auto space-y-6">
      {/* Question Section - Separate Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className={`
          w-full
          ${isDark ? 'bg-[#0d1117]' : 'bg-[#f6f8fa]'} 
          rounded-lg border
          ${isDark ? 'border-[#21262d]' : 'border-[#d0d7de]'}
          overflow-hidden
        `}
      >
        {/* Question Header */}
        <div className={`
          px-6 py-4 border-b
          ${isDark ? 'border-[#21262d] bg-[#161b22]' : 'border-[#d0d7de] bg-white'}
          flex items-center justify-between
        `}>
          <div className="flex items-center gap-3">
            <div className={`
              p-2 rounded-md
              ${isDark ? 'bg-[#21262d]' : 'bg-[#f6f8fa]'}
            `}>
              <FileQuestion size={18} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
            </div>
            <span className={`
              text-sm font-medium
              ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}
            `}>
              Question
            </span>
          </div>
          <span
            className={`
              inline-flex items-center px-2.5 py-1 rounded-md text-xs font-semibold
              ${isDark 
                ? `${difficultyColor.darkBg} ${difficultyColor.darkText} border ${difficultyColor.border}` 
                : `${difficultyColor.bg} ${difficultyColor.text} border ${difficultyColor.border}`
              }
              border
            `}
          >
            {question.difficulty}
          </span>
      </div>

        {/* Question Text - Scrollable for long questions */}
        <div className={`
          px-6 py-6
          ${isDark ? 'bg-[#0d1117]' : 'bg-[#f6f8fa]'}
          max-h-[400px] overflow-y-auto
          custom-scrollbar
        `}>
          <h2 className={`
            text-xl md:text-2xl font-semibold leading-relaxed
            ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}
            whitespace-pre-wrap break-words
            mb-4
          `}>
        {question.text}
      </h2>

          {/* Code Snippet Box - Only show if code exists */}
          {(question.codeSnippet || question.imageReference) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className={`
                mt-4 rounded-lg border overflow-hidden
                ${isDark 
                  ? 'bg-[#161b22] border-[#30363d]' 
                  : 'bg-[#ffffff] border-[#d0d7de]'
                }
              `}
            >
              {/* Code/Image Header */}
              <div className={`
                px-4 py-2.5 border-b flex items-center gap-2
                ${isDark 
                  ? 'bg-[#0d1117] border-[#21262d]' 
                  : 'bg-[#f6f8fa] border-[#d0d7de]'
                }
              `}>
                {question.codeSnippet ? (
                  <>
                    <Code size={16} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
                    <span className={`
                      text-xs font-medium
                      ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}
                    `}>
                      Code Snippet
                    </span>
                  </>
                ) : question.imageReference ? (
                  <>
                    <ImageIcon size={16} className={isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'} />
                    <span className={`
                      text-xs font-medium
                      ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}
                    `}>
                      Image Reference
                    </span>
                  </>
                ) : null}
              </div>

              {/* Code Content */}
              {question.codeSnippet && (
                <div className={`
                  p-4 overflow-x-auto max-h-[400px] overflow-y-auto
                  ${isDark ? 'bg-[#0d1117]' : 'bg-[#ffffff]'}
                  custom-scrollbar
                `}>
                  <pre className={`
                    text-sm font-mono leading-relaxed
                    ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}
                    whitespace-pre
                    m-0
                    overflow-x-auto
                  `}>
                    <code className="block">{question.codeSnippet}</code>
                  </pre>
                </div>
              )}

              {/* Image Reference Content */}
              {question.imageReference && !question.codeSnippet && (
                <div className={`
                  p-4
                  ${isDark ? 'bg-[#0d1117]' : 'bg-[#ffffff]'}
                `}>
                  <p className={`
                    text-sm leading-relaxed
                    ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}
                    whitespace-pre-wrap
                  `}>
                    {question.imageReference}
                  </p>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* Options Section - Separate Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
        className={`
          w-full
          ${isDark ? 'bg-[#161b22]' : 'bg-white'} 
          rounded-lg border
          ${isDark ? 'border-[#30363d]' : 'border-[#d0d7de]'}
          p-6
        `}
      >
        <div className="mb-4">
          <span className={`
            text-sm font-medium
            ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}
          `}>
            Select your answer:
          </span>
        </div>

        {/* Options */}
        <div className="flex flex-col gap-3 mb-8">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option
            const optionLetter = String.fromCharCode(65 + index)
            
          return (
              <motion.button
              key={index}
              onClick={() => onAnswerSelect(option)}
                whileHover={{ scale: 1.01, x: 4 }}
                whileTap={{ scale: 0.99 }}
              className={`
                  group relative
                  px-5 py-4 rounded-lg
                  text-left transition-all duration-200
                  flex items-center gap-4
                  min-h-[64px]
                ${isSelected
                  ? isDark
                      ? 'bg-[#1f6feb] border-2 border-[#1f6feb] text-white shadow-md'
                      : 'bg-[#0969da] border-2 border-[#0969da] text-white shadow-md'
                  : isDark
                      ? 'bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] hover:border-[#58a6ff] hover:bg-[#161b22]'
                      : 'bg-[#ffffff] border border-[#d0d7de] text-[#24292f] hover:border-[#0969da] hover:bg-[#f6f8fa]'
                  }
                `}
              >
                {/* Radio Button Indicator */}
                <div className={`
                  flex-shrink-0 w-5 h-5 rounded-full border-2 flex items-center justify-center
                  transition-all duration-200
                  ${isSelected
                    ? isDark
                      ? 'border-white bg-white'
                      : 'border-white bg-white'
                    : isDark
                      ? 'border-[#484f58] bg-transparent group-hover:border-[#58a6ff]'
                      : 'border-[#8c959f] bg-transparent group-hover:border-[#0969da]'
                }
                `}>
                  {isSelected ? (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className={`w-2.5 h-2.5 rounded-full ${isDark ? 'bg-[#1f6feb]' : 'bg-[#0969da]'}`}
                    />
                  ) : (
                    <Circle size={10} className={isDark ? 'text-[#484f58]' : 'text-[#8c959f]'} fill="currentColor" />
                  )}
                </div>

                {/* Option Letter Badge */}
                <div className={`
                  flex-shrink-0 w-7 h-7 rounded-md flex items-center justify-center font-bold text-xs
                  transition-all duration-200
                  ${isSelected
                    ? 'bg-white/20 text-white'
                    : isDark
                      ? 'bg-[#21262d] text-[#8b949e] group-hover:bg-[#30363d] group-hover:text-[#58a6ff]'
                      : 'bg-[#f6f8fa] text-[#656d76] group-hover:bg-[#0969da]/10 group-hover:text-[#0969da]'
                  }
                `}>
                  {optionLetter}
                </div>

                {/* Option Text */}
                <span className={`
                  flex-1 text-base font-normal leading-relaxed
                  ${isSelected ? 'text-white' : isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}
                `}>
                {option}
              </span>

                {/* Check Icon */}
              {isSelected && (
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    className="flex-shrink-0"
                  >
                    <Check size={20} className="text-white" strokeWidth={2.5} />
                  </motion.div>
              )}
              </motion.button>
          )
        })}
      </div>

        {/* Action Section */}
        <div className={`
          pt-6 border-t
          ${isDark ? 'border-[#21262d]' : 'border-[#d0d7de]'}
        `}>
        {!selectedAnswer && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`
                text-sm text-center mb-4
                ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}
              `}
            >
              <span className="inline-flex items-center gap-2">
                <Circle size={14} className="opacity-50" />
                Select an option to continue
          </span>
            </motion.div>
        )}
          
        <div className="flex justify-end">
          {isLastQuestion ? (
            <Button
              variant="primary"
              size="lg"
              onClick={onFinish}
                className="min-w-[160px]"
            >
              Finish Quiz
            </Button>
          ) : (
            <Button
              variant="primary"
              size="lg"
              onClick={onNext}
              disabled={!selectedAnswer}
                className="min-w-[180px]"
            >
                Next Question
                <ArrowRight size={18} className="ml-2" />
            </Button>
          )}
        </div>
      </div>
      </motion.div>
    </div>
  )
}
