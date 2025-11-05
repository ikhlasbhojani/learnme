import React, { useState, useEffect } from 'react'
import { Check, ArrowRight } from 'lucide-react'
import { Question } from '../../types'
import { Button } from '../common/Button'
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
  
  return (
    <div className={`${isDark ? 'bg-[#161b22]' : 'bg-[#ffffff]'} p-12 rounded-xl shadow-lg border ${isDark ? 'border-[#30363d]' : 'border-[#d0d7de]'} max-w-[800px] mx-auto`}>
      <div className={`mb-6 p-2 rounded-md text-sm font-medium ${isDark ? 'bg-[#161b22] text-[#6e7681]' : 'bg-[#f6f8fa] text-[#8c959f]'}`}>
        Difficulty: {question.difficulty}
      </div>

      <h2 className={`text-2xl font-semibold mb-8 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
        {question.text}
      </h2>

      <div className="flex flex-col gap-4">
        {question.options.map((option, index) => {
          const isSelected = selectedAnswer === option
          return (
            <button
              key={index}
              onClick={() => onAnswerSelect(option)}
              className={`
                px-6 py-4 rounded-md min-h-[56px] text-left text-base
                flex items-center justify-between relative
                transition-all duration-150
                ${isSelected
                  ? isDark
                    ? 'bg-[#21262d] border border-[#ffffff] text-[#c9d1d9] font-semibold'
                    : 'bg-[#f6f8fa] border border-[#24292f] text-[#24292f] font-semibold'
                  : isDark
                    ? 'bg-[#161b22] border border-[#30363d] text-[#c9d1d9] font-normal hover:bg-[#21262d] hover:border-[#484f58]'
                    : 'bg-[#ffffff] border border-[#d0d7de] text-[#24292f] font-normal hover:bg-[#f6f8fa] hover:border-[#afb8c1]'
                }
              `}
            >
              <span className="leading-6">
                <span className={`font-semibold mr-2 ${isDark ? 'text-[#6e7681]' : 'text-[#8c959f]'}`}>
                  {String.fromCharCode(65 + index)}.
                </span>
                {option}
              </span>
              {isSelected && (
                <Check size={20} className={isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'} strokeWidth={3} />
              )}
            </button>
          )
        })}
      </div>

      <div className={`mt-12 flex flex-col items-stretch gap-2 pt-8 border-t ${isDark ? 'border-[#21262d]' : 'border-[#d0d7de]'}`}>
        {!selectedAnswer && (
          <span className={`text-sm italic text-center mb-1 ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
            Please select an option to continue
          </span>
        )}
        <div className="flex justify-end">
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
              Next Question <ArrowRight size={18} className="ml-1 text-current" />
            </Button>
          )}
        </div>
      </div>
    </div>
  )
}
