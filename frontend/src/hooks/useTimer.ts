import { useState, useEffect, useRef, useCallback } from 'react'

interface UseTimerReturn {
  timeRemaining: number
  isInitialized: boolean
  start: (initialTime: number) => void
  pause: () => void
  resume: () => void
  stop: () => void
  onExpire: (callback: () => void) => void
}

export function useTimer(): UseTimerReturn {
  const [timeRemaining, setTimeRemaining] = useState(0)
  const [isRunning, setIsRunning] = useState(false)
  const [isInitialized, setIsInitialized] = useState(false)
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const expireCallbackRef = useRef<(() => void) | null>(null)
  const hasExpiredRef = useRef(false)
  const timeRemainingRef = useRef(0)

  // Keep ref in sync with state
  useEffect(() => {
    timeRemainingRef.current = timeRemaining
  }, [timeRemaining])

  useEffect(() => {
    // Clear any existing interval first
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }

    // Start new interval if running
    // Use ref to check time to avoid dependency on timeRemaining state
    if (isRunning) {
      // Wait a tiny bit to ensure state has updated
      const checkAndStart = () => {
        const currentTime = timeRemainingRef.current
        if (currentTime > 0) {
          hasExpiredRef.current = false
          intervalRef.current = setInterval(() => {
            setTimeRemaining((prev) => {
              const newTime = prev - 1
              timeRemainingRef.current = newTime // Keep ref in sync
              if (newTime <= 0) {
                setIsRunning(false)
                timeRemainingRef.current = 0
                if (!hasExpiredRef.current && expireCallbackRef.current) {
                  hasExpiredRef.current = true
                  setTimeout(() => {
                    if (expireCallbackRef.current) {
                      expireCallbackRef.current()
                    }
                  }, 100)
                }
                return 0
              }
              return newTime
            })
          }, 1000)
        }
      }
      
      // Use setTimeout to ensure state updates have been processed
      const timeoutId = setTimeout(checkAndStart, 10)
      
      return () => {
        clearTimeout(timeoutId)
        if (intervalRef.current) {
          clearInterval(intervalRef.current)
          intervalRef.current = null
        }
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }
  }, [isRunning])

  const start = useCallback((initialTime: number) => {
    hasExpiredRef.current = false
    // Set ref synchronously first to ensure it's available immediately
    timeRemainingRef.current = initialTime
    // Set state - these will trigger the effect
    setTimeRemaining(initialTime)
    setIsInitialized(true)
    // Set isRunning last to ensure all state is ready
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
    isInitialized,
    start,
    pause,
    resume,
    stop,
    onExpire,
  }
}

