import { useState, useEffect, useCallback } from 'react'

export interface UseFullscreenReturn {
  isFullscreen: boolean
  isSupported: boolean
  enterFullscreen: (element?: HTMLElement) => Promise<void>
  exitFullscreen: () => Promise<void>
  error: string | null
}

export function useFullscreen(): UseFullscreenReturn {
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Check support
  const isSupported =
    typeof document !== 'undefined' &&
    (document.fullscreenEnabled ||
      (document as any).webkitFullscreenEnabled ||
      (document as any).mozFullScreenEnabled ||
      (document as any).msFullscreenEnabled)

  // Listen to fullscreen changes
  useEffect(() => {
    if (typeof document === 'undefined') return

    const handleFullscreenChange = () => {
      const isFs =
        !!(document.fullscreenElement ||
          (document as any).webkitFullscreenElement ||
          (document as any).mozFullScreenElement ||
          (document as any).msFullscreenElement)
      setIsFullscreen(isFs)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    document.addEventListener('webkitfullscreenchange', handleFullscreenChange)
    document.addEventListener('mozfullscreenchange', handleFullscreenChange)
    document.addEventListener('MSFullscreenChange', handleFullscreenChange)

    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
      document.removeEventListener('webkitfullscreenchange', handleFullscreenChange)
      document.removeEventListener('mozfullscreenchange', handleFullscreenChange)
      document.removeEventListener('MSFullscreenChange', handleFullscreenChange)
    }
  }, [])

  const enterFullscreen = useCallback(
    async (element?: HTMLElement) => {
      if (!isSupported) {
        const errorMsg = 'Fullscreen API not supported'
        setError(errorMsg)
        throw new Error(errorMsg)
      }

      const target = element || document.documentElement

      try {
        if ((target as any).requestFullscreen) {
          await (target as any).requestFullscreen()
        } else if ((target as any).webkitRequestFullscreen) {
          await (target as any).webkitRequestFullscreen()
        } else if ((target as any).mozRequestFullScreen) {
          await (target as any).mozRequestFullScreen()
        } else if ((target as any).msRequestFullscreen) {
          await (target as any).msRequestFullscreen()
        } else {
          throw new Error('Fullscreen API not available')
        }
        setError(null)
      } catch (err) {
        const errorMsg =
          err instanceof Error
            ? err.message.includes('permission')
              ? 'Fullscreen permission denied'
              : err.message
            : 'Fullscreen permission denied'
        setError(errorMsg)
        throw new Error(errorMsg)
      }
    },
    [isSupported]
  )

  const exitFullscreen = useCallback(async () => {
    if (typeof document === 'undefined') return

    try {
      if (document.exitFullscreen) {
        await document.exitFullscreen()
      } else if ((document as any).webkitExitFullscreen) {
        await (document as any).webkitExitFullscreen()
      } else if ((document as any).mozCancelFullScreen) {
        await (document as any).mozCancelFullScreen()
      } else if ((document as any).msExitFullscreen) {
        await (document as any).msExitFullscreen()
      }
      setError(null)
    } catch (err) {
      // Exit fullscreen errors are usually non-critical
      console.error('Error exiting fullscreen:', err)
    }
  }, [])

  return {
    isFullscreen,
    isSupported,
    enterFullscreen,
    exitFullscreen,
    error,
  }
}
