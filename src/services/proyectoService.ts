import { apiRequest } from './api'

export type ProyectoCreate = {
  nombre: string
  descripcion?: string
  usuario_codigo: string
  id_rol: number
}

export type ProyectoUpdate = {
  nombre?: string
  descripcion?: string
}

export type ProyectoResponse = {
  id: number
  nombre: string
  descripcion?: string | null
  creado_en?: string | null
}

export type ProyectoUsuarioCreate = {
  usuario_codigo: string
  id_proyecto?: number
  id_rol: number
}

export type ProyectoUsuarioResponse = {
  usuario_codigo: string
  id_proyecto: number
  id_rol: number
}

export function crearProyecto(proyecto: ProyectoCreate) {
  return apiRequest<ProyectoResponse, ProyectoCreate>('/proyectos/', {
    method: 'POST',
    body: proyecto,
  })
}

export function listarProyectos() {
  return apiRequest<ProyectoResponse[]>('/proyectos/')
}

export function obtenerProyecto(id: number) {
  return apiRequest<ProyectoResponse>(`/proyectos/${id}`)
}

export function listarProyectosPorUsuario(usuarioCodigo: string) {
  return apiRequest<ProyectoResponse[]>(`/proyectos/usuario/${usuarioCodigo}`)
}

export function actualizarProyecto(id: number, proyecto: ProyectoUpdate) {
  return apiRequest<ProyectoResponse, ProyectoUpdate>(`/proyectos/${id}`, {
    method: 'PUT',
    body: proyecto,
  })
}

export function eliminarProyecto(id: number) {
  return apiRequest<{ mensaje: string }>(`/proyectos/${id}`, {
    method: 'DELETE',
  })
}

export function agregarMiembro(proyectoId: number, miembro: ProyectoUsuarioCreate) {
  return apiRequest<ProyectoUsuarioResponse, ProyectoUsuarioCreate>(
    `/proyectos/${proyectoId}/miembros`,
    {
      method: 'POST',
      body: miembro,
    },
  )
}

export function listarMiembros(proyectoId: number) {
  return apiRequest<ProyectoUsuarioResponse[]>(`/proyectos/${proyectoId}/miembros`)
}

export function quitarMiembro(proyectoId: number, usuarioCodigo: string) {
  return apiRequest<{ mensaje: string }>(
    `/proyectos/${proyectoId}/miembros/${usuarioCodigo}`,
    {
      method: 'DELETE',
    },
  )
}
