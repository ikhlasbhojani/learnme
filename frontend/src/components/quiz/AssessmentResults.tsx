import React from 'react'
import { FileText } from 'lucide-react'
import { AssessmentResult } from '../../types'
import { Button } from '../common/Button'
import { useTheme } from '../../contexts/ThemeContext'

interface AssessmentResultsProps {
  result: AssessmentResult
  quizName?: string | null
  onViewSummary: () => void
}

export const AssessmentResults: React.FC<AssessmentResultsProps> = ({
  result,
  quizName,
  onViewSummary,
}) => {
  const { isDark } = useTheme()
  
  const totalQuestions = result.correctCount + result.incorrectCount + result.unansweredCount
  const correctPercentage = totalQuestions > 0 ? (result.correctCount / totalQuestions) * 100 : 0
  const incorrectPercentage = totalQuestions > 0 ? (result.incorrectCount / totalQuestions) * 100 : 0
  
  // Score color based on performance
  const getScoreColor = () => {
    if (result.totalScore >= 90) return isDark ? 'text-[#3fb950]' : 'text-[#1a7f37]'
    if (result.totalScore >= 70) return isDark ? 'text-[#58a6ff]' : 'text-[#0969da]'
    if (result.totalScore >= 50) return isDark ? 'text-[#d29922]' : 'text-[#9a6700]'
    return isDark ? 'text-[#f85149]' : 'text-[#cf222e]'
  }
  
  return (
    <div className={`${isDark ? 'bg-[#161b22]' : 'bg-[#ffffff]'} p-8 rounded-xl border ${isDark ? 'border-[#30363d]' : 'border-[#d0d7de]'} shadow-lg max-w-[800px] mx-auto`}>
      {/* Quiz Name Section */}
      {quizName && (
        <div className={`mb-8 pb-6 border-b ${isDark ? 'border-[#21262d]' : 'border-[#d0d7de]'}`}>
          <h1 className={`text-2xl font-bold ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
            {quizName}
          </h1>
        </div>
      )}
      
      {/* Header */}
      <div className="mb-8">
        <h2 className={`text-xl font-semibold mb-6 ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
          Quiz Results
        </h2>
        
        {/* Score Display */}
        <div className="mb-6">
          <div className={`text-5xl font-bold mb-3 ${getScoreColor()}`}>
            {result.totalScore}%
          </div>
          <div className={`text-base ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
            {result.correctCount} Correct • {result.incorrectCount} Incorrect
            {result.unansweredCount > 0 && ` • ${result.unansweredCount} Unanswered`}
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="space-y-4 mb-8">
        {/* Correct Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-lg font-semibold ${isDark ? 'text-[#3fb950]' : 'text-[#1a7f37]'}`}>
              {result.correctCount}
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
              Correct
            </span>
          </div>
          <div className={`h-10 rounded-md overflow-hidden ${isDark ? 'bg-[#0d1117]' : 'bg-[#f6f8fa]'} border ${isDark ? 'border-[#21262d]' : 'border-[#d0d7de]'}`}>
            <div 
              className={`h-full ${isDark ? 'bg-[#3fb950]' : 'bg-[#1a7f37]'} flex items-center justify-end pr-3 transition-all duration-300`}
              style={{ width: `${correctPercentage}%` }}
            >
              {correctPercentage > 15 && (
                <span className="text-xs font-semibold text-white">
                  {result.correctCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Incorrect Bar */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className={`text-lg font-semibold ${isDark ? 'text-[#f85149]' : 'text-[#cf222e]'}`}>
              {result.incorrectCount}
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
              Incorrect
            </span>
          </div>
          <div className={`h-10 rounded-md overflow-hidden ${isDark ? 'bg-[#0d1117]' : 'bg-[#f6f8fa]'} border ${isDark ? 'border-[#21262d]' : 'border-[#d0d7de]'}`}>
            <div 
              className={`h-full ${isDark ? 'bg-[#f85149]' : 'bg-[#cf222e]'} flex items-center justify-end pr-3 transition-all duration-300`}
              style={{ width: `${incorrectPercentage}%` }}
            >
              {incorrectPercentage > 15 && (
                <span className="text-xs font-semibold text-white">
                  {result.incorrectCount}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Total */}
        <div className={`pt-4 mt-4 border-t ${isDark ? 'border-[#21262d]' : 'border-[#d0d7de]'}`}>
          <div className="flex items-center justify-between">
            <span className={`text-lg font-semibold ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
              {totalQuestions}
            </span>
            <span className={`text-sm font-medium ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}>
              Total Questions
            </span>
          </div>
        </div>
      </div>

      {/* Action Button */}
      <div className={`pt-6 border-t ${isDark ? 'border-[#21262d]' : 'border-[#d0d7de]'}`}>
        <Button
          variant="primary"
          size="lg"
          onClick={onViewSummary}
          className="w-full flex items-center justify-center gap-2"
        >
          <FileText size={18} strokeWidth={2.5} className="shrink-0 text-current" />
          <span>View Summary</span>
        </Button>
      </div>
    </div>
  )
}
