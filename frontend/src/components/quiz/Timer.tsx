import React from 'react'

interface TimerProps {
  timeRemaining: number
  totalTime: number
  isInitialized?: boolean
}

export const Timer: React.FC<TimerProps> = ({ timeRemaining, totalTime, isInitialized = false }) => {
  // If timer hasn't been initialized yet, show totalTime
  // Once initialized, use timeRemaining (which will count down from totalTime to 0)
  const displayTime = !isInitialized ? totalTime : timeRemaining
  const minutes = Math.floor(displayTime / 60)
  const seconds = displayTime % 60
  const formattedTime = `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
  const percentage = totalTime > 0 ? (displayTime / totalTime) * 100 : 0
  const isLowTime = displayTime < 60 && displayTime > 0 // Less than 1 minute and not expired

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px' }}>
      <div
        style={{
          fontSize: '18px',
          fontWeight: 'bold',
          color: isLowTime ? '#f85149' : 'inherit',
          fontFamily: 'monospace',
        }}
      >
        {formattedTime}
      </div>
      <div
        style={{
          width: '100px',
          height: '4px',
          backgroundColor: '#e5e7eb',
          borderRadius: '2px',
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            width: `${percentage}%`,
            height: '100%',
            backgroundColor: isLowTime ? '#f85149' : '#0969da',
            transition: 'width 1s linear, background-color 0.3s',
          }}
        />
      </div>
    </div>
  )
}

