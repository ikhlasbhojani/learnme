import { useState, useEffect, useRef, useCallback } from 'react'

export interface UseTimerReturn {
  timeRemaining: number // in seconds
  isRunning: boolean
  start: (duration: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  onExpire: (callback: () => void) => void
}

export function useTimer(): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [startTime, setStartTime] = useState<number | null>(null)
  const [pausedDuration, setPausedDuration] = useState(0)
  const [initialDuration, setInitialDuration] = useState(0)
  const expireCallbackRef = useRef<(() => void) | null>(null)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)

  const onExpire = useCallback((callback: () => void) => {
    expireCallbackRef.current = callback
  }, [])

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

  const start = useCallback((duration: number) => {
    setInitialDuration(duration)
    setTimeRemaining(duration)
    setStartTime(Date.now())
    setPausedDuration(0)
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    setIsRunning(false)
    if (startTime) {
      const elapsed = Math.floor((Date.now() - startTime) / 1000)
      setPausedDuration(elapsed)
    }
  }, [startTime])

  const resume = useCallback(() => {
    if (startTime && pausedDuration > 0) {
      const remaining = initialDuration - pausedDuration
      if (remaining > 0) {
        setTimeRemaining(remaining)
        setStartTime(Date.now())
        setIsRunning(true)
      }
    }
  }, [startTime, pausedDuration, initialDuration])

  const stop = useCallback(() => {
    setIsRunning(false)
    setTimeRemaining(0)
    setStartTime(null)
    setPausedDuration(0)
    setInitialDuration(0)
  }, [])

  return {
    timeRemaining,
    isRunning,
    start,
    pause,
    resume,
    stop,
    onExpire,
  }
}
