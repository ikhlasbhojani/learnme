import React, { useState, useEffect } from 'react'
import { Input } from './Input'
import { Button } from './Button'
import { theme } from '../../styles/theme'

interface URLInputProps {
  onURLSubmit: (url: string) => void
  onError?: (error: string) => void
  isLoading?: boolean
}

/**
 * Validate URL format and check if it exists
 */
function validateURLFormat(urlString: string): { valid: boolean; error?: string } {
  if (!urlString || !urlString.trim()) {
    return { valid: false, error: 'URL is required' }
  }

  try {
    const url = new URL(urlString)
    
    // Must be http or https
    if (url.protocol !== 'http:' && url.protocol !== 'https:') {
      return { valid: false, error: 'URL must start with http:// or https://' }
    }

    // Check if hostname looks valid (has at least one dot for domain)
    if (!url.hostname.includes('.')) {
      return { valid: false, error: 'Invalid domain name' }
    }

    // Check if hostname has valid TLD (at least 2 characters)
    const parts = url.hostname.split('.')
    const tld = parts[parts.length - 1]
    if (tld.length < 2) {
      return { valid: false, error: 'Invalid domain extension' }
    }

    return { valid: true }
  } catch (err) {
    return { valid: false, error: 'Invalid URL format. Please enter a valid web address (e.g., https://example.com)' }
  }
}

/**
 * Check if URL actually exists by making a HEAD request
 */
async function checkURLExists(urlString: string): Promise<{ exists: boolean; error?: string }> {
  try {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 8000) // 8 second timeout

    // Try with CORS first to get actual status
    try {
      const response = await fetch(urlString, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'cors',
      })

      clearTimeout(timeoutId)

      if (response.ok || response.status === 403 || response.status === 401) {
        // 200s or auth required = exists
        return { exists: true }
      } else if (response.status === 404) {
        return { exists: false, error: 'URL not found (404). Please check the URL and try again.' }
      } else if (response.status >= 500) {
        return { exists: false, error: 'Server error. The website may be temporarily down.' }
      }

      return { exists: true } // Other statuses, let backend handle
    } catch (corsError: any) {
      // CORS blocked - try with no-cors as fallback
      const noCorsResponse = await fetch(urlString, {
        method: 'HEAD',
        signal: controller.signal,
        mode: 'no-cors',
      })

      clearTimeout(timeoutId)
      // If no-cors succeeds, URL likely exists (CORS is blocking details)
      return { exists: true }
    }
  } catch (err: any) {
    if (err.name === 'AbortError') {
      return { exists: false, error: 'URL verification timed out. The URL may be slow or unreachable.' }
    }
    
    // Network error - URL probably doesn't exist
    if (err.message?.includes('Failed to fetch') || err.message?.includes('NetworkError')) {
      return { exists: false, error: 'Unable to reach this URL. Please check if the website exists.' }
    }

    // Unknown error - be lenient, backend will validate
    return { exists: true }
  }
}

export const URLInput: React.FC<URLInputProps> = ({
  onURLSubmit,
  onError,
  isLoading = false,
}) => {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [touched, setTouched] = useState(false)
  const [validating, setValidating] = useState(false)

  // Real-time validation as user types
  useEffect(() => {
    // Only validate if user has started typing and field has been touched
    if (!touched || !url.trim()) {
      setError(null)
      setValidating(false)
      return
    }

    // Debounce validation to avoid excessive checks
    const timeoutId = setTimeout(async () => {
      // First check format
      const formatCheck = validateURLFormat(url)
      
      if (!formatCheck.valid) {
        setError(formatCheck.error || 'Invalid URL')
        onError?.(formatCheck.error || 'Invalid URL')
        setValidating(false)
        return
      }

      // URL format is valid, now check if it exists
      setError(null)
      setValidating(true)
      
      const existsCheck = await checkURLExists(url)
      setValidating(false)
      
      if (!existsCheck.exists) {
        const errorMsg = existsCheck.error || 'Unable to verify URL'
        setError(errorMsg)
        onError?.(errorMsg)
      } else {
        setError(null)
      }
    }, 800) // 800ms debounce - give user time to finish typing

    return () => clearTimeout(timeoutId)
  }, [url, touched, onError])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setTouched(true)
    setError(null)

    // Final validation before submit
    const formatCheck = validateURLFormat(url)
    if (!formatCheck.valid) {
      const errorMsg = formatCheck.error || 'Invalid URL format'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    // URL is valid, proceed
    onURLSubmit(url)
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="url"
        label="Enter Web URL"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value)
          setTouched(true)
        }}
        onBlur={() => setTouched(true)}
        placeholder="https://example.com/article"
        required
        disabled={isLoading}
        error={error || undefined}
        helperText={validating ? '🔍 Checking URL...' : 'Paste a web link to learning content'}
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        disabled={isLoading || !url || !!error}
        style={{ width: '100%' }}
      >
        Process URL
      </Button>
    </form>
  )
}
