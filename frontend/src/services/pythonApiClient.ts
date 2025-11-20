/**
 * Python Service API Client
 * Connects to the Python FastAPI service (port 8000)
 */
const pythonApiBaseUrl = 'http://localhost:8000/api'

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

interface RequestOptions extends RequestInit {
  method?: RequestMethod
  parseJson?: boolean
}

/**
 * Get user from localStorage to extract AI configuration
 */
function getUserFromStorage(): { aiProvider?: string; aiApiKey?: string; aiModel?: string; aiBaseUrl?: string } | null {
  try {
    const stored = localStorage.getItem('learnme_user')
    if (!stored) return null
    const user = JSON.parse(stored)
    return {
      aiProvider: user.aiProvider,
      aiApiKey: user.aiApiKey,
      aiModel: user.aiModel,
      aiBaseUrl: user.aiBaseUrl,
    }
  } catch {
    return null
  }
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', headers, body, parseJson = true, ...rest } = options

  const baseHeaders = new Headers()
  if (!(body instanceof FormData)) {
    baseHeaders.set('Content-Type', 'application/json')
  }

  // Add AI configuration headers from user's stored config (REQUIRED for Python backend)
  const userConfig = getUserFromStorage()
  if (userConfig?.aiProvider && userConfig?.aiApiKey) {
    baseHeaders.set('X-AI-Provider', userConfig.aiProvider)
    baseHeaders.set('X-AI-API-Key', userConfig.aiApiKey)
    if (userConfig.aiModel) {
      baseHeaders.set('X-AI-Model', userConfig.aiModel)
    }
    if (userConfig.aiBaseUrl) {
      baseHeaders.set('X-AI-Base-URL', userConfig.aiBaseUrl)
    }
  }

  if (headers) {
    const provided = new Headers(headers as HeadersInit)
    provided.forEach((value, key) => {
      baseHeaders.set(key, value)
    })
  }

  const fetchOptions: RequestInit = {
    method,
    credentials: 'include',
    headers: baseHeaders,
    body: body instanceof FormData ? body : body ? JSON.stringify(body) : undefined,
    ...rest,
  }

  const response = await fetch(`${pythonApiBaseUrl}${path}`, fetchOptions)

  if (!parseJson) {
    if (!response.ok) {
      throw new Error(response.statusText || 'Request failed')
    }
    return undefined as T
  }

  const contentType = response.headers.get('content-type') || ''
  const isJson = contentType.includes('application/json')
  const payload = isJson ? await response.json() : await response.text()

  if (!response.ok) {
    let message = response.statusText || 'Request failed'

    if (isJson && payload) {
      if (typeof payload === 'object') {
        if ('message' in payload && typeof payload.message === 'string') {
          message = payload.message
        } else if ('detail' in payload && typeof payload.detail === 'string') {
          message = payload.detail
        } else if ('error' in payload && typeof payload.error === 'string') {
          message = payload.error
        }
      }
    }

    const error = new Error(message) as Error & { status?: number }
    error.status = response.status
    throw error
  }

  // Python service returns { message, data } format
  if (isJson && payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T
  }

  return payload as T
}

export const pythonApiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
}

