import { apiRequest } from './api'

export type LoginRequest = {
  email: string
  password: string
}

export type LoginResponse = {
  access_token: string
  token_type: string
}

export type PerfilResponse = {
  codigo: string
  nombres: string
  apellidos: string
  email: string
  pais: string
  id_rol: number
}

export function loginUser(credentials: LoginRequest) {
  return apiRequest<LoginResponse, LoginRequest>('/auth/login', {
    method: 'POST',
    body: credentials,
  })
}

export function getPerfil() {
  const token = localStorage.getItem('token') ?? ''

  return apiRequest<PerfilResponse>('/auth/me', {
    token,
  })
}
