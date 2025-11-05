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
  const [pausedAt, setPausedAt] = useState<number | null>(null)
  const [totalPausedDuration, setTotalPausedDuration] = useState(0)
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
        intervalRef.current = null
      }
    }
  }, [isRunning, timeRemaining])

  const start = useCallback((duration: number) => {
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    
    setInitialDuration(duration)
    setTimeRemaining(duration)
    setStartTime(Date.now())
    setPausedAt(null)
    setTotalPausedDuration(0)
    setIsRunning(true)
  }, [])

  const pause = useCallback(() => {
    if (!isRunning) return
    
    setIsRunning(false)
    setPausedAt(Date.now())
  }, [isRunning])

  const resume = useCallback(() => {
    if (isRunning || !pausedAt || !startTime) return
    
    // Calculate how long we were paused
    const pauseDuration = Math.floor((Date.now() - pausedAt) / 1000)
    const newTotalPausedDuration = totalPausedDuration + pauseDuration
    
    // Calculate remaining time based on elapsed time minus total pause time
    const elapsed = Math.floor((Date.now() - startTime) / 1000)
    const actualElapsed = elapsed - newTotalPausedDuration
    const remaining = Math.max(0, initialDuration - actualElapsed)
    
    if (remaining > 0) {
      setTimeRemaining(remaining)
      setTotalPausedDuration(newTotalPausedDuration)
      setPausedAt(null)
      setIsRunning(true)
    } else {
      // Time expired while paused
      setTimeRemaining(0)
      setIsRunning(false)
      if (expireCallbackRef.current) {
        expireCallbackRef.current()
      }
    }
  }, [isRunning, pausedAt, startTime, totalPausedDuration, initialDuration])

  const stop = useCallback(() => {
    setIsRunning(false)
    setTimeRemaining(0)
    setStartTime(null)
    setPausedAt(null)
    setTotalPausedDuration(0)
    setInitialDuration(0)
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
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
