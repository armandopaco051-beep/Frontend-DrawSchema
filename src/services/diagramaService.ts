import { apiRequest } from './api'

export type DiagramNode = {
  id: string
  type: string
  position: {
    x: number
    y: number
  }
  style?: {
    width?: number | string
    height?: number | string
    [key: string]: unknown
  }
  data: {
    name: string
    attributes: Record<string, unknown>[]
    methods: Record<string, unknown>[]
    kind?: 'class' | 'abstractClass' | 'interface'
    templateParameters?: string[]
    [key: string]: unknown
  }
}

export type DiagramEdge = {
  id: string
  source: string
  target: string
  type?: string
  data?: Record<string, unknown>
}

export type DiagramContent = {
  nodes: DiagramNode[]
  edges: DiagramEdge[]
}

export type DiagramaCreate = {
  id_proyecto: number
  nombre: string
  contenido?: DiagramContent
}

export type DiagramaUpdate = {
  nombre?: string
  contenido?: DiagramContent
  autor_codigo?: string
}

export type DiagramaResponse = {
  id: number
  id_proyecto: number
  nombre: string
  contenido: DiagramContent
  version: number
  creado_en?: string | null
  actualizado_en?: string | null
}

export type ClaseCreate = {
  id?: string
  name: string
  x?: number
  y?: number
  attributes?: Record<string, unknown>[]
  methods?: Record<string, unknown>[]
  autor_codigo?: string
}

export type ClaseUpdate = {
  name?: string
  attributes?: Record<string, unknown>[]
  methods?: Record<string, unknown>[]
  autor_codigo?: string
}

export type ClaseMove = {
  x: number
  y: number
  autor_codigo?: string
}

export function crearDiagrama(diagrama: DiagramaCreate) {
  return apiRequest<DiagramaResponse, DiagramaCreate>('/diagramas/', {
    method: 'POST',
    body: diagrama,
  })
}

export function listarDiagramas() {
  return apiRequest<DiagramaResponse[]>('/diagramas/')
}

export function listarDiagramasPorProyecto(idProyecto: number) {
  return apiRequest<DiagramaResponse[]>(`/diagramas/proyecto/${idProyecto}`)
}

export function abrirDiagrama(id: number) {
  return apiRequest<DiagramaResponse>(`/diagramas/${id}`)
}

export function guardarDiagrama(id: number, diagrama: DiagramaUpdate) {
  return apiRequest<DiagramaResponse, DiagramaUpdate>(`/diagramas/${id}`, {
    method: 'PUT',
    body: diagrama,
  })
}

export function eliminarDiagrama(id: number) {
  return apiRequest<{ mensaje: string }>(`/diagramas/${id}`, {
    method: 'DELETE',
  })
}

export function agregarClase(diagramaId: number, clase: ClaseCreate) {
  return apiRequest<DiagramaResponse, ClaseCreate>(`/diagramas/${diagramaId}/clases`, {
    method: 'POST',
    body: clase,
  })
}

export function moverClase(diagramaId: number, claseId: string, posicion: ClaseMove) {
  return apiRequest<DiagramaResponse, ClaseMove>(
    `/diagramas/${diagramaId}/clases/${claseId}/mover`,
    {
      method: 'PATCH',
      body: posicion,
    },
  )
}

export function editarClase(diagramaId: number, claseId: string, clase: ClaseUpdate) {
  return apiRequest<DiagramaResponse, ClaseUpdate>(`/diagramas/${diagramaId}/clases/${claseId}`, {
    method: 'PUT',
    body: clase,
  })
}

export function eliminarClase(diagramaId: number, claseId: string, autorCodigo?: string) {
  const query = autorCodigo ? `?autor_codigo=${encodeURIComponent(autorCodigo)}` : ''

  return apiRequest<DiagramaResponse>(`/diagramas/${diagramaId}/clases/${claseId}${query}`, {
    method: 'DELETE',
  })
}
