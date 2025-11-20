/**
 * AI API Key Validation Service
 * Tests API keys against their respective providers to ensure they are valid and have quota
 */

interface ValidationResult {
  valid: boolean
  error?: string
  errorType?: 'INVALID_KEY' | 'QUOTA_EXCEEDED' | 'NETWORK_ERROR' | 'PERMISSION_DENIED' | 'UNKNOWN'
}

/**
 * Validate Gemini API key
 */
async function validateGeminiKey(apiKey: string, model: string, baseUrl?: string): Promise<ValidationResult> {
  const endpoint = baseUrl || 'https://generativelanguage.googleapis.com/v1beta'
  
  try {
    // Test with a simple model listing or generation request
    const testUrl = `${endpoint}/models/${model}:generateContent?key=${apiKey}`
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: 'Hello'
          }]
        }]
      })
    })

    const data = await response.json()

    if (response.ok) {
      return { valid: true }
    }

    // Parse Gemini error responses
    if (data.error) {
      const errorMessage = data.error.message || ''
      const errorStatus = data.error.status || ''

      // API key invalid
      if (errorMessage.includes('API key not valid') || 
          errorMessage.includes('API_KEY_INVALID') ||
          errorStatus === 'INVALID_ARGUMENT') {
        return {
          valid: false,
          error: 'Invalid API key. Please check your Gemini API key and try again.',
          errorType: 'INVALID_KEY'
        }
      }

      // Quota exceeded
      if (errorMessage.includes('quota') || 
          errorMessage.includes('RESOURCE_EXHAUSTED') ||
          errorStatus === 'RESOURCE_EXHAUSTED') {
        return {
          valid: false,
          error: 'API quota exceeded. Please check your billing or wait for quota reset.',
          errorType: 'QUOTA_EXCEEDED'
        }
      }

      // Permission denied
      if (errorMessage.includes('permission') || 
          errorStatus === 'PERMISSION_DENIED') {
        return {
          valid: false,
          error: 'Permission denied. Your API key may not have access to this model.',
          errorType: 'PERMISSION_DENIED'
        }
      }

      // Model not found or not accessible
      if (errorMessage.includes('models/') || errorMessage.includes('not found')) {
        return {
          valid: false,
          error: `Model "${model}" not found or not accessible with your API key. Try a different model.`,
          errorType: 'PERMISSION_DENIED'
        }
      }

      // Generic error
      return {
        valid: false,
        error: `Validation failed: ${errorMessage}`,
        errorType: 'UNKNOWN'
      }
    }

    return {
      valid: false,
      error: 'Unable to validate API key. Please try again.',
      errorType: 'UNKNOWN'
    }

  } catch (error: any) {
    console.error('Gemini validation error:', error)
    return {
      valid: false,
      error: `Network error: ${error.message || 'Unable to connect to Gemini API'}`,
      errorType: 'NETWORK_ERROR'
    }
  }
}

/**
 * Validate OpenAI API key
 */
async function validateOpenAIKey(apiKey: string, model: string, baseUrl?: string): Promise<ValidationResult> {
  const endpoint = baseUrl || 'https://api.openai.com/v1'
  
  try {
    // Test with a minimal chat completion request
    const testUrl = `${endpoint}/chat/completions`
    
    const response = await fetch(testUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: model,
        messages: [{ role: 'user', content: 'Hi' }],
        max_tokens: 5
      })
    })

    const data = await response.json()

    if (response.ok) {
      return { valid: true }
    }

    // Parse OpenAI error responses
    if (data.error) {
      const errorMessage = data.error.message || ''
      const errorType = data.error.type || ''
      const errorCode = data.error.code || ''

      // Invalid API key
      if (response.status === 401 || 
          errorType === 'invalid_request_error' && errorMessage.includes('API key')) {
        return {
          valid: false,
          error: 'Invalid API key. Please check your OpenAI API key and try again.',
          errorType: 'INVALID_KEY'
        }
      }

      // Quota exceeded
      if (response.status === 429 || 
          errorType === 'insufficient_quota' ||
          errorCode === 'insufficient_quota') {
        return {
          valid: false,
          error: 'API quota exceeded. Please check your OpenAI billing and usage limits.',
          errorType: 'QUOTA_EXCEEDED'
        }
      }

      // Model not found or not accessible
      if (errorCode === 'model_not_found' || 
          errorMessage.includes('does not exist') ||
          errorMessage.includes('model') && response.status === 404) {
        return {
          valid: false,
          error: `Model "${model}" not found or not accessible. Try a different model or check your API access.`,
          errorType: 'PERMISSION_DENIED'
        }
      }

      // Permission issues
      if (response.status === 403 || errorType === 'permission_error') {
        return {
          valid: false,
          error: 'Permission denied. Your API key may not have access to this model.',
          errorType: 'PERMISSION_DENIED'
        }
      }

      // Generic error
      return {
        valid: false,
        error: `Validation failed: ${errorMessage}`,
        errorType: 'UNKNOWN'
      }
    }

    return {
      valid: false,
      error: 'Unable to validate API key. Please try again.',
      errorType: 'UNKNOWN'
    }

  } catch (error: any) {
    console.error('OpenAI validation error:', error)
    return {
      valid: false,
      error: `Network error: ${error.message || 'Unable to connect to OpenAI API'}`,
      errorType: 'NETWORK_ERROR'
    }
  }
}

/**
 * Validate API key for the given provider
 */
export async function validateAPIKey(
  provider: 'gemini' | 'openai',
  apiKey: string,
  model: string,
  baseUrl?: string
): Promise<ValidationResult> {
  if (!apiKey || !apiKey.trim()) {
    return {
      valid: false,
      error: 'API key is required',
      errorType: 'INVALID_KEY'
    }
  }

  if (!model || !model.trim()) {
    return {
      valid: false,
      error: 'Model selection is required',
      errorType: 'INVALID_KEY'
    }
  }

  if (provider === 'gemini') {
    return validateGeminiKey(apiKey.trim(), model, baseUrl)
  } else if (provider === 'openai') {
    return validateOpenAIKey(apiKey.trim(), model, baseUrl)
  } else {
    return {
      valid: false,
      error: 'Unsupported AI provider',
      errorType: 'UNKNOWN'
    }
  }
}
