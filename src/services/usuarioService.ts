import type { Usuario, UsuarioCreate, UsuarioUpdate } from '../models/usuario'
import { apiRequest } from './api'

export function listarUsuarios() {
  return apiRequest<Usuario[]>('/usuarios/')
}

export function crearUsuario(usuario: UsuarioCreate) {
  return apiRequest<Usuario, UsuarioCreate>('/usuarios/', {
    method: 'POST',
    body: usuario,
  })
}

export function obtenerUsuario(codigo: string) {
  return apiRequest<Usuario>(`/usuarios/${codigo}`)
}

export function actualizarUsuario(codigo: string, usuario: UsuarioUpdate) {
  return apiRequest<Usuario, UsuarioUpdate>(`/usuarios/${codigo}`, {
    method: 'PUT',
    body: usuario,
  })
}

export function eliminarUsuario(codigo: string) {
  return apiRequest<{ mensaje: string }>(`/usuarios/${codigo}`, {
    method: 'DELETE',
  })
}
