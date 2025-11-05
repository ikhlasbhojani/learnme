import React from 'react'
import { QuizConfiguration } from '../../types'
import { Input } from '../common/Input'
import { Button } from '../common/Button'
import { validateQuizConfiguration } from '../../utils/validation'
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
  const isFormValid = difficulty && numberOfQuestions && timeDuration && errors.length === 0

  return (
    <div className={`w-full max-w-[500px] ${isDark ? 'bg-[#161b22]' : 'bg-[#ffffff]'} p-8 rounded-xl border ${isDark ? 'border-[#30363d]' : 'border-[#d0d7de]'} shadow-lg`}>
      <h1 className={`text-3xl font-bold mb-8 text-center ${isDark ? 'text-[#c9d1d9]' : 'text-[#24292f]'}`}>
        Configure Your Quiz
      </h1>

      <div className="mb-6">
        <label
          className={`block mb-2 text-sm font-medium ${isDark ? 'text-[#8b949e]' : 'text-[#656d76]'}`}
        >
          Difficulty Level
        </label>
        <select
          value={difficulty}
          onChange={(e) => onDifficultyChange(e.target.value as QuizConfiguration['difficulty'])}
          className={`
            w-full px-4 py-2 text-base rounded-md border transition-all duration-300
            outline-none focus:ring-2 focus:ring-offset-0
            ${isDark
              ? 'border-[#30363d] bg-[#0d1117] text-[#c9d1d9] focus:border-[#58a6ff] focus:ring-[#58a6ff]'
              : 'border-[#d0d7de] bg-[#ffffff] text-[#24292f] focus:border-[#0969da] focus:ring-[#0969da]'
            }
          `}
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
          className={`mb-4 p-4 rounded-md text-sm ${isDark ? 'bg-[#f85149]/20 text-[#f85149]' : 'bg-[#cf222e]/20 text-[#cf222e]'}`}
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
        className="w-full"
      >
        Start Quiz
      </Button>
    </div>
  )
}
