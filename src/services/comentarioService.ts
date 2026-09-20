import { apiRequest } from './api'
import type {
  Comentario,
  CrearComentarioDTO,
  EditarComentarioDTO,
  ListarComentariosFiltros,
  ResolverComentarioDTO,
} from '../models/comentario'

export async function listarComentarios(
  diagramaId: number,
  filtros: ListarComentariosFiltros = {},
): Promise<Comentario[]> {
  const queryParams = new URLSearchParams()

  if (filtros.solo_pendientes !== undefined) {
    queryParams.set('solo_pendientes', String(filtros.solo_pendientes))
  }

  if (filtros.nodo_id) {
    queryParams.set('nodo_id', filtros.nodo_id)
  }

  const queryString = queryParams.toString()
  const path = `/diagramas/${diagramaId}/comentarios${queryString ? `?${queryString}` : ''}`

  return apiRequest<Comentario[]>(path, {
    method: 'GET',
  })
}

export async function crearComentario(
  diagramaId: number,
  body: CrearComentarioDTO,
): Promise<Comentario> {
  return apiRequest<Comentario, CrearComentarioDTO>(`/diagramas/${diagramaId}/comentarios`, {
    method: 'POST',
    body,
  })
}

export async function resolverComentario(
  comentarioId: number,
  resuelto: boolean,
): Promise<Comentario> {
  return apiRequest<Comentario, ResolverComentarioDTO>(`/comentarios/${comentarioId}/resolver`, {
    method: 'PATCH',
    body: { resuelto },
  })
}

export async function editarComentario(
  comentarioId: number,
  texto: string,
): Promise<Comentario> {
  return apiRequest<Comentario, EditarComentarioDTO>(`/comentarios/${comentarioId}`, {
    method: 'PUT',
    body: { texto },
  })
}

export async function eliminarComentario(
  comentarioId: number,
): Promise<{ message?: string } | void> {
  return apiRequest<{ message?: string } | void>(`/comentarios/${comentarioId}`, {
    method: 'DELETE',
  })
}
