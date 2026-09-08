export const API_URL = 'http://127.0.0.1:8001'

type RequestOptions<TBody> = {
  body?: TBody
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE'
  token?: string
}

export async function apiRequest<TResponse, TBody = unknown>(
  path: string,
  options: RequestOptions<TBody> = {},
): Promise<TResponse> {
  const token = options.token ?? localStorage.getItem('token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${API_URL}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new Error(data?.detail ?? data?.message ?? 'Error en la peticion. Revisa el backend.')
  }

  return data as TResponse
}

export function postData<TResponse, TBody>(path: string, body: TBody) {
  return apiRequest<TResponse, TBody>(path, {
    method: 'POST',
    body,
  })
}
