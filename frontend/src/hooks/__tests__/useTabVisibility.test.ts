import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTabVisibility } from '../useTabVisibility'

describe('useTabVisibility', () => {
  beforeEach(() => {
    // Reset document visibility state
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible',
      configurable: true,
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('should initialize with visible state when document is visible', () => {
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible',
      configurable: true,
    })

    const { result } = renderHook(() => useTabVisibility())

    expect(result.current.isVisible).toBe(true)
    expect(result.current.visibilityState).toBe('visible')
  })

  it('should initialize with hidden state when document is hidden', () => {
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'hidden',
      configurable: true,
    })

    const { result } = renderHook(() => useTabVisibility())

    expect(result.current.isVisible).toBe(false)
    expect(result.current.visibilityState).toBe('hidden')
  })

  it('should update isVisible when visibility changes to hidden', async () => {
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'visible',
      configurable: true,
    })

    const { result } = renderHook(() => useTabVisibility())

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden',
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await waitFor(() => {
      expect(result.current.isVisible).toBe(false)
      expect(result.current.visibilityState).toBe('hidden')
    })
  })

  it('should update isVisible when visibility changes to visible', async () => {
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'hidden',
      configurable: true,
    })

    const { result } = renderHook(() => useTabVisibility())

    act(() => {
      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'visible',
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    await waitFor(() => {
      expect(result.current.isVisible).toBe(true)
      expect(result.current.visibilityState).toBe('visible')
    })
  })

  it('should handle prerender state', async () => {
    Object.defineProperty(document, 'visibilityState', {
      writable: true,
      value: 'prerender',
      configurable: true,
    })

    const { result } = renderHook(() => useTabVisibility())

    expect(result.current.visibilityState).toBe('prerender')
    expect(result.current.isVisible).toBe(false)
  })

  it('should call callback when visibility changes via onVisibilityChange', () => {
    const callback = vi.fn()

    const { result } = renderHook(() => useTabVisibility())

    act(() => {
      const unsubscribe = result.current.onVisibilityChange(callback)

      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden',
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))

      unsubscribe()
    })

    expect(callback).toHaveBeenCalledWith(false)
  })

  it('should unsubscribe callback when cleanup is called', () => {
    const callback = vi.fn()

    const { result } = renderHook(() => useTabVisibility())

    act(() => {
      const unsubscribe = result.current.onVisibilityChange(callback)
      unsubscribe()

      Object.defineProperty(document, 'visibilityState', {
        writable: true,
        value: 'hidden',
        configurable: true,
      })
      document.dispatchEvent(new Event('visibilitychange'))
    })

    // Callback should not be called after unsubscribe
    expect(callback).not.toHaveBeenCalled()
  })

  it('should handle SSR environment (no document)', () => {
    const originalDocument = global.document
    // @ts-ignore
    delete global.document

    const { result } = renderHook(() => useTabVisibility())

    // Should default to visible state when document is undefined
    expect(result.current.isVisible).toBe(true)
    expect(result.current.visibilityState).toBe('visible')
    expect(result.current.isSupported).toBe(false)

    // Restore document
    global.document = originalDocument
  })

  it('should detect Page Visibility API support', () => {
    const { result } = renderHook(() => useTabVisibility())
    expect(result.current.isSupported).toBe(true)
  })

  it('should return isSupported false when API is not available', () => {
    const originalVisibilityState = document.visibilityState
    // @ts-ignore
    delete document.visibilityState

    const { result } = renderHook(() => useTabVisibility())
    expect(result.current.isSupported).toBe(false)

    // Restore
    document.visibilityState = originalVisibilityState
  })
})
