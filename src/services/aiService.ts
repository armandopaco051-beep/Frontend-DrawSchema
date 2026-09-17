import { ApiError } from './api'
import type { DiagramaResponse } from './diagramaService'

export const AI_API_URL = 'http://127.0.0.1:8002'

export type AiPlannerRequest = {
  message: string
  proyecto_id: number
  diagrama_id: number
}

export type AiPlannerAction = {
  order: number
  tool: string
  description: string
  arguments: Record<string, unknown>
  requires_confirmation: boolean
}

export type AiPlannerQuestion =
  | string
  | {
      question?: string
      text?: string
      message?: string
      [key: string]: unknown
    }

export type AiPlannerResponse = {
  intent: string
  summary: string
  actions: AiPlannerAction[]
  questions: AiPlannerQuestion[]
  can_execute: boolean
}

export async function planWithAi(body: AiPlannerRequest) {
  const token = localStorage.getItem('token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${AI_API_URL}/ai/planner`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      data?.detail ?? data?.message ?? 'No se pudo planificar con el agente IA.',
      response.status,
      data?.detail,
    )
  }

  return data as AiPlannerResponse
}



export type DiagramExecutePlanRequest = {
  diagrama_id: number
  autor_codigo: string
  confirmed: true
  actions: AiPlannerAction[]
}

export type DiagramExecutePlanResponse = {
  success: boolean
  message: string
  executed: Record<string, unknown>[]
  failed_action?: AiPlannerAction | null
  diagrama?: DiagramaResponse | null
}

export async function executeDiagramPlan(body: DiagramExecutePlanRequest) {
  const token = localStorage.getItem('token')

  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const response = await fetch(`${AI_API_URL}/ai/diagram/execute-plan`, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      data?.detail ?? data?.message ?? 'No se pudo ejecutar el plan del agente IA.',
      response.status,
      data?.detail,
    )
  }

  return data as DiagramExecutePlanResponse
}

export type AiCodegenFile = {
  path: string
  language: string
  content: string
}

export type GenerateSpringBackendRequest = {
  proyecto_id: number
  diagrama_id: number
  message: string
  target: 'spring_boot'
  project_name: string
  base_package: string
  database_name: string
}

export type GenerateSpringBackendResponse = {
  success: boolean
  summary: string
  target: string
  project_name: string
  base_package: string
  database_name: string
  files: AiCodegenFile[]
  warnings: string[]
  generation_id?: string | null
  download_url?: string | null
}

function getAuthorizationHeaders() {
  const token = localStorage.getItem('token')
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

export async function generateSpringBackend(body: GenerateSpringBackendRequest) {
  const response = await fetch(`${AI_API_URL}/ai/codegen`, {
    method: 'POST',
    headers: getAuthorizationHeaders(),
    body: JSON.stringify(body),
  })

  const data = await response.json().catch(() => null)

  if (!response.ok) {
    throw new ApiError(
      data?.detail ?? data?.message ?? 'No se pudo generar el backend Spring Boot.',
      response.status,
      data?.detail,
    )
  }

  return data as GenerateSpringBackendResponse
}

type DownloadGeneratedBackendOptions = {
  generationId?: string | null
  downloadUrl?: string | null
  projectName: string
}

export async function downloadGeneratedBackend({
  downloadUrl,
  generationId,
  projectName,
}: DownloadGeneratedBackendOptions) {
  if (!generationId && !downloadUrl) {
    throw new ApiError('No hay un ZIP generado para descargar.', 400, null)
  }

  const token = localStorage.getItem('token')
  const headers: HeadersInit = {}

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  const downloadEndpoint = downloadUrl
    ? downloadUrl.startsWith('http')
      ? downloadUrl
      : `${AI_API_URL}${downloadUrl}`
    : `${AI_API_URL}/ai/codegen/${encodeURIComponent(generationId!)}/download`

  const response = await fetch(downloadEndpoint, {
    method: 'GET',
    headers,
  })

  const contentType = response.headers.get('content-type') ?? ''

  if (!response.ok) {
    const data = await response.json().catch(() => null)
    throw new ApiError(
      data?.detail ?? data?.message ?? 'No se pudo descargar el ZIP generado.',
      response.status,
      data?.detail,
    )
  }

  if (contentType.includes('application/json')) {
    const data = await response.json().catch(() => null)
    throw new ApiError(
      data?.detail ?? data?.message ?? 'El backend no devolvio un archivo ZIP.',
      response.status,
      data?.detail,
    )
  }

  const blob = await response.blob()
  if (blob.size === 0) {
    throw new ApiError('El ZIP generado esta vacio o no fue devuelto por el backend.', response.status, null)
  }

  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement('a')
  const cleanProjectName = projectName.trim() || generationId || 'backend-generado'

  anchor.href = objectUrl
  anchor.download = `${cleanProjectName}.zip`
  document.body.appendChild(anchor)
  anchor.click()
  anchor.remove()
  window.setTimeout(() => URL.revokeObjectURL(objectUrl), 1000)
}
  
