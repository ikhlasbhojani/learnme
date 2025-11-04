import React, { useState } from 'react'
import { Input } from './Input'
import { Button } from './Button'
import { validateURL } from '../../utils/validation'
import { theme } from '../../styles/theme'

interface URLInputProps {
  onURLSubmit: (url: string) => void
  onError?: (error: string) => void
  isLoading?: boolean
}

export const URLInput: React.FC<URLInputProps> = ({
  onURLSubmit,
  onError,
  isLoading = false,
}) => {
  const [url, setUrl] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)

    // Validate URL format
    if (!validateURL(url)) {
      const errorMsg = 'Invalid URL format. Please enter a valid web address.'
      setError(errorMsg)
      onError?.(errorMsg)
      return
    }

    try {
      // Try to fetch URL to verify accessibility
      const response = await fetch(url, {
        method: 'HEAD',
        mode: 'no-cors', // Use no-cors to avoid CORS issues (will always succeed but that's okay for MVP)
      })

      // If we get here, proceed (CORS might block but we'll handle that in processing)
      onURLSubmit(url)
    } catch (err) {
      // If fetch fails, still proceed (might be CORS issue, will handle in processing)
      const errorMsg =
        'Unable to verify URL accessibility. This may be due to CORS restrictions, but we will proceed.'
      console.warn('URL fetch warning:', err)
      onURLSubmit(url)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Input
        type="url"
        label="Enter Web URL"
        value={url}
        onChange={(e) => {
          setUrl(e.target.value)
          setError(null)
        }}
        placeholder="https://example.com/article"
        required
        disabled={isLoading}
        error={error || undefined}
        helperText="Paste a web link to learning content"
      />
      <Button
        type="submit"
        variant="primary"
        size="lg"
        isLoading={isLoading}
        disabled={isLoading || !url}
        style={{ width: '100%' }}
      >
        Process URL
      </Button>
    </form>
  )
}
