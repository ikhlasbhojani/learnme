import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTimerReturn {
  timeRemaining: number
  start: (initialTime: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  onExpire: (callback: () => void) => void
}

export function useTimer(): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const expireCallbackRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    if (isRunning && timeRemaining > 0) {
      intervalRef.current = setInterval(() => {
        setTimeRemaining((prev) => {
          if (prev <= 1) {
            setIsRunning(false)
            if (expireCallbackRef.current) {
              expireCallbackRef.current()
            }
            return 0
          }
          return prev - 1
        })
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning, timeRemaining])

  const start = useCallback((initialTime: number) => {
    setTimeRemaining(initialTime)
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
  }, [])

  const resume = useCallback(() => {
    if (timeRemaining > 0) {
      setIsRunning(true)
    }
  }, [timeRemaining])

  const stop = useCallback(() => {
    setIsRunning(false)
    setTimeRemaining(0)
  }, [])

  const onExpire = useCallback((callback: () => void) => {
    expireCallbackRef.current = callback
  }, [])

  return {
    timeRemaining,
    start,
    pause,
    resume,
    stop,
    onExpire,
  }
}

