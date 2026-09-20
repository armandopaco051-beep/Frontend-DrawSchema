export interface Comentario {
  id: number
  diagrama_id: number
  autor_codigo: string
  autor_nombre: string | null
  nodo_id: string | null
  texto: string
  resuelto: boolean
  creado_en: string
  actualizado_en: string
}

export interface CrearComentarioDTO {
  nodo_id?: string | null
  texto: string
}

export interface EditarComentarioDTO {
  texto: string
}

export interface ResolverComentarioDTO {
  resuelto: boolean
}

export interface ListarComentariosFiltros {
  solo_pendientes?: boolean
  nodo_id?: string
}
