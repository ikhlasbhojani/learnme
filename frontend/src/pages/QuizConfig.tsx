import React, { useState } from 'react'
import { motion } from 'framer-motion'
import { QuizConfig } from '../components/quiz/QuizConfig'
import { validateQuizConfiguration } from '../utils/validation'
import { QuizConfiguration } from '../types'
import { theme } from '../styles/theme'
import { useQuiz } from '../hooks/useQuiz'

export default function QuizConfigPage() {
  const { startQuiz, loading: quizLoading } = useQuiz()
  const [difficulty, setDifficulty] = useState<QuizConfiguration['difficulty']>('Easy')
  const [numberOfQuestions, setNumberOfQuestions] = useState('10')
  const [timeDuration, setTimeDuration] = useState('600') // 10 minutes in seconds
  const [errors, setErrors] = useState<string[]>([])
  const [isStarting, setIsStarting] = useState(false)

  const handleStart = async () => {
    const numQuestions = parseInt(numberOfQuestions, 10)
    const duration = parseInt(timeDuration, 10)

    const validation = validateQuizConfiguration({
      difficulty,
      numberOfQuestions: numQuestions,
      timeDuration: duration,
    })

    if (!validation.valid) {
      setErrors(validation.errors)
      return
    }

    setErrors([])
    setIsStarting(true)

    try {
      // Create and start quiz on backend first, then navigate
      const config: QuizConfiguration = {
        difficulty,
        numberOfQuestions: numQuestions,
        timeDuration: duration,
      }
      await startQuiz(config, null)
      // Navigation will happen inside startQuiz hook
    } catch (error) {
      console.error('Failed to start quiz:', error)
      setErrors([error instanceof Error ? error.message : 'Failed to start quiz'])
      setIsStarting(false)
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        minHeight: 'calc(100vh - 80px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: theme.spacing.xl,
      }}
    >
      <QuizConfig
        difficulty={difficulty}
        numberOfQuestions={numberOfQuestions}
        timeDuration={timeDuration}
        onDifficultyChange={setDifficulty}
        onQuestionsChange={(value) => {
          setNumberOfQuestions(value)
          setErrors([])
        }}
        onDurationChange={(value) => {
          setTimeDuration(value)
          setErrors([])
        }}
        onStart={handleStart}
        errors={errors}
        loading={isStarting || quizLoading}
      />
    </motion.div>
  )
}
