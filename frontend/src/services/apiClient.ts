const DEFAULT_API_BASE = 'http://localhost:5000/api'

const apiBaseUrl = import.meta.env.VITE_API_URL ?? DEFAULT_API_BASE

type RequestMethod = 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE'

interface RequestOptions extends RequestInit {
  method?: RequestMethod
  parseJson?: boolean
}

async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { method = 'GET', headers, body, parseJson = true, ...rest } = options

  const baseHeaders = new Headers()
  if (!(body instanceof FormData)) {
    baseHeaders.set('Content-Type', 'application/json')
  }

  // Add Authorization header with token from localStorage if available
  const token = localStorage.getItem('auth_token')
  if (token) {
    baseHeaders.set('Authorization', `Bearer ${token}`)
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

  const response = await fetch(`${apiBaseUrl}${path}`, fetchOptions)

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
    // Try to extract user-friendly error message from response
    let message = response.statusText || 'Request failed'
    let errorCode: string | undefined
    let retryAfter: number | undefined

    if (isJson && payload) {
      // Check for common error message fields
      if (typeof payload === 'object') {
        if ('message' in payload && typeof payload.message === 'string') {
          message = payload.message
        }
        if ('error' in payload) {
          if (typeof payload.error === 'string') {
            message = payload.error
          } else if (typeof payload.error === 'object' && payload.error !== null) {
            // Handle structured error object
            const errorObj = payload.error as any
            if (errorObj.message && typeof errorObj.message === 'string') {
              message = errorObj.message
            }
            if (errorObj.details && typeof errorObj.details === 'string') {
              // Prefer details over message if available
              message = errorObj.details
            }
            if (errorObj.code && typeof errorObj.code === 'string') {
              errorCode = errorObj.code
            }
            if (typeof errorObj.retryAfter === 'number') {
              retryAfter = errorObj.retryAfter
            }
          }
        } else if ('errors' in payload && Array.isArray(payload.errors) && payload.errors.length > 0) {
          // Handle validation errors array
          message = payload.errors[0]?.message || payload.errors[0] || message
        }
      }
    }

    // Handle 401 errors - clear stale auth and force re-login
    if (response.status === 401) {
      localStorage.removeItem('auth_token')
      localStorage.removeItem('user')
      
      // Only redirect to login if not already on auth pages
      if (!window.location.pathname.includes('/login') && !window.location.pathname.includes('/signup')) {
        window.location.href = '/login'
      }
    }

    const error = new Error(message) as Error & { 
      status?: number
      code?: string
      retryAfter?: number
      response?: any
    }
    error.status = response.status
    error.code = errorCode
    error.retryAfter = retryAfter
    error.response = payload
    throw error
  }

  if (isJson && payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T
  }

  return payload as T
}

export const apiClient = {
  get: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'GET' }),
  post: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'POST', body }),
  patch: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PATCH', body }),
  put: <T>(path: string, body?: unknown, options?: RequestOptions) =>
    request<T>(path, { ...options, method: 'PUT', body }),
  delete: <T>(path: string, options?: RequestOptions) => request<T>(path, { ...options, method: 'DELETE' }),
}

export type ApiClient = typeof apiClient

