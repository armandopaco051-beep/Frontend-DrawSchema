import { apiRequest, API_URL, ApiError } from './api'

export type ChatScope = 'individual' | 'grupal'
export type TextProvider = 'gemini' | 'local'

export type Conversation = {
  id: number
  proyecto_id: number
  tipo: ChatScope
  propietario_codigo: string | null
  creado_en: string
}

export type StoredMessage = {
  id: number
  conversacion_id: number
  diagrama_id: number | null
  rol: 'user' | 'assistant'
  autor_codigo: string | null
  autor_nombre: string
  texto: string
  resultado_ia: Record<string, unknown> | null
  creado_en: string
}

export type MessagePage = {
  mensajes: StoredMessage[]
  siguiente_antes_de: number | null
}

export function openConversation(projectId: number, scope: ChatScope, signal?: AbortSignal) {
  return apiRequest<Conversation>(`/proyectos/${projectId}/conversaciones`, {
    method: 'POST', body: { tipo: scope }, signal,
  })
}

export function listMessages(conversationId: number, before?: number, signal?: AbortSignal) {
  const params = new URLSearchParams({ limite: '100' })
  if (before !== undefined) params.set('antes_de', String(before))
  return apiRequest<MessagePage>(`/conversaciones/${conversationId}/mensajes?${params}`, { signal })
}

export function sendMessage(conversationId: number, text: string, diagramId?: number) {
  return apiRequest<StoredMessage>(`/conversaciones/${conversationId}/mensajes`, {
    method: 'POST',
    body: { texto: text, ...(diagramId ? { diagrama_id: diagramId } : {}) },
  })
}

export function requestAiReply(conversationId: number, messageId: number, diagramId?: number, provider: TextProvider = 'gemini') {
  const params = new URLSearchParams({ text_provider: provider })
  if (diagramId) params.set('expected_diagrama_id', String(diagramId))
  const query = `?${params}`
  return apiRequest<StoredMessage>(
    `/conversaciones/${conversationId}/mensajes/${messageId}/respuesta-ia${query}`,
    { method: 'POST' },
  )
}

export async function requestImageReply(conversationId: number, diagramId: number, image: File) {
  const data = new FormData()
  data.append('diagrama_id', String(diagramId))
  data.append('image', image)
  const token = localStorage.getItem('token')
  const response = await fetch(`${API_URL}/conversaciones/${conversationId}/imagen`, {
    method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: data,
  })
  const result = await response.json().catch(() => null)
  if (!response.ok) throw new ApiError(result?.detail || 'No se pudo analizar la imagen.', response.status, result?.detail)
  return result as { consulta: StoredMessage; respuesta: StoredMessage }
}
