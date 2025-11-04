import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFullscreen } from '../useFullscreen'

// Mock document methods
const mockRequestFullscreen = vi.fn().mockResolvedValue(undefined)
const mockExitFullscreen = vi.fn().mockResolvedValue(undefined)
const mockWebkitRequestFullscreen = vi.fn().mockResolvedValue(undefined)
const mockWebkitExitFullscreen = vi.fn().mockResolvedValue(undefined)

describe('useFullscreen', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    // Setup default document mocks
    Object.defineProperty(document, 'fullscreenEnabled', {
      writable: true,
      value: true,
    })
    Object.defineProperty(document.documentElement, 'requestFullscreen', {
      writable: true,
      value: mockRequestFullscreen,
    })
    Object.defineProperty(document, 'exitFullscreen', {
      writable: true,
      value: mockExitFullscreen,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should detect fullscreen support', () => {
    const { result } = renderHook(() => useFullscreen())
    expect(result.current.isSupported).toBe(true)
  })

  it('should detect when fullscreen is not supported', () => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      writable: true,
      value: false,
    })
    delete (document.documentElement as any).requestFullscreen

    const { result } = renderHook(() => useFullscreen())
    expect(result.current.isSupported).toBe(false)
  })

  it('should enter fullscreen mode', async () => {
    const { result } = renderHook(() => useFullscreen())

    await act(async () => {
      await result.current.enterFullscreen()
    })

    expect(mockRequestFullscreen).toHaveBeenCalled()
    expect(result.current.error).toBeNull()
  })

  it('should enter fullscreen with custom element', async () => {
    const { result } = renderHook(() => useFullscreen())
    const customElement = document.createElement('div')
    customElement.requestFullscreen = vi.fn().mockResolvedValue(undefined)

    await act(async () => {
      await result.current.enterFullscreen(customElement)
    })

    expect(customElement.requestFullscreen).toHaveBeenCalled()
  })

  it('should handle fullscreen permission denied', async () => {
    const error = new Error('Permission denied')
    mockRequestFullscreen.mockRejectedValueOnce(error)

    const { result } = renderHook(() => useFullscreen())

    await act(async () => {
      await expect(result.current.enterFullscreen()).rejects.toThrow()
    })

    expect(result.current.error).toBeTruthy()
  })

  it('should handle fullscreen API not supported', async () => {
    Object.defineProperty(document, 'fullscreenEnabled', {
      writable: true,
      value: false,
    })
    delete (document.documentElement as any).requestFullscreen

    const { result } = renderHook(() => useFullscreen())

    await act(async () => {
      await expect(result.current.enterFullscreen()).rejects.toThrow(
        'Fullscreen API not supported'
      )
    })

    expect(result.current.error).toBe('Fullscreen API not supported')
  })

  it('should exit fullscreen mode', async () => {
    const { result } = renderHook(() => useFullscreen())

    await act(async () => {
      await result.current.exitFullscreen()
    })

    expect(mockExitFullscreen).toHaveBeenCalled()
  })

  it('should update isFullscreen state on fullscreen change', async () => {
    const { result } = renderHook(() => useFullscreen())

    // Simulate fullscreen change event
    act(() => {
      Object.defineProperty(document, 'fullscreenElement', {
        writable: true,
        value: document.documentElement,
      })
      document.dispatchEvent(new Event('fullscreenchange'))
    })

    await waitFor(() => {
      expect(result.current.isFullscreen).toBe(true)
    })
  })

  it('should handle webkit fullscreen API', async () => {
    delete (document.documentElement as any).requestFullscreen
    Object.defineProperty(document.documentElement, 'webkitRequestFullscreen', {
      writable: true,
      value: mockWebkitRequestFullscreen,
    })
    Object.defineProperty(document, 'webkitFullscreenEnabled', {
      writable: true,
      value: true,
    })

    const { result } = renderHook(() => useFullscreen())

    await act(async () => {
      await result.current.enterFullscreen()
    })

    expect(mockWebkitRequestFullscreen).toHaveBeenCalled()
  })
})
