import type {
  Proyecto,
  ProyectoCreate,
  MiembroFormValues,
  ProyectoMiembro,
  ProyectoUpdate,
} from '../models/proyecto'
import { apiRequest } from './api'

export function crearProyecto(proyecto: ProyectoCreate) {
  return apiRequest<Proyecto, ProyectoCreate>('/proyectos/', {
    method: 'POST',
    body: proyecto,
  })
}

export function listarProyectos() {
  return apiRequest<Proyecto[]>('/proyectos/')
}

export function obtenerProyecto(id: number) {
  return apiRequest<Proyecto>(`/proyectos/${id}`)
}

export function listarProyectosPorUsuario(usuarioCodigo: string) {
  return apiRequest<Proyecto[]>(`/proyectos/usuario/${usuarioCodigo}`)
}

export function actualizarProyecto(id: number, proyecto: ProyectoUpdate) {
  return apiRequest<Proyecto, ProyectoUpdate>(`/proyectos/${id}`, {
    method: 'PUT',
    body: proyecto,
  })
}

export function eliminarProyecto(id: number) {
  return apiRequest<{ mensaje: string }>(`/proyectos/${id}`, {
    method: 'DELETE',
  })
}

export function agregarMiembro(proyectoId: number, miembro: MiembroFormValues) {
  return apiRequest<ProyectoMiembro, MiembroFormValues>(
    `/proyectos/${proyectoId}/miembros`,
    {
      method: 'POST',
      body: miembro,
    },
  )
}

export function actualizarMiembro(proyectoId: number, usuarioCodigo: string, miembro: Pick<ProyectoMiembro, 'id_rol'>) {
  return apiRequest<ProyectoMiembro, Pick<ProyectoMiembro, 'id_rol'>>(
    `/proyectos/${proyectoId}/miembros/${usuarioCodigo}`,
    {
      method: 'PUT',
      body: miembro,
    },
  )
}

export function listarMiembros(proyectoId: number) {
  return apiRequest<ProyectoMiembro[]>(`/proyectos/${proyectoId}/miembros`)
}

export function quitarMiembro(proyectoId: number, usuarioCodigo: string) {
  return apiRequest<{ mensaje: string }>(
    `/proyectos/${proyectoId}/miembros/${usuarioCodigo}`,
    {
      method: 'DELETE',
    },
  )
}
