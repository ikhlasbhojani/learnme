/**
 * Python Service API Client
 * Connects to the Python FastAPI service (port 8000)
 */
const DEFAULT_PYTHON_API_BASE = 'http://localhost:8000/api'

const pythonApiBaseUrl = import.meta.env.VITE_PYTHON_API_URL ?? DEFAULT_PYTHON_API_BASE

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

