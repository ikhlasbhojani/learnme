import React from 'react'

interface QuestionCountProps {
  current: number
  total: number
  format?: 'short' | 'full'
}

export const QuestionCount: React.FC<QuestionCountProps> = ({ current, total, format = 'short' }) => {
  if (format === 'short') {
    return (
      <span>
        {current}/{total}
      </span>
    )
  }

  return (
    <span>
      Question {current} of {total}
    </span>
  )
}

