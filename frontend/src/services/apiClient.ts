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
    const message = isJson && payload?.message ? payload.message : response.statusText || 'Request failed'
    const error = new Error(message) as Error & { status?: number }
    error.status = response.status
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

