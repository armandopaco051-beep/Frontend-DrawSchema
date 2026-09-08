type TokenPayload = {
  codigo?: string
  sub?: string
  nombres?: string
  nombre?: string
  name?: string
  apellidos?: string
  apellido?: string
  email?: string
  pais?: string
  country?: string
  id_rol?: number
  rol?: string
  role?: string
  [key: string]: unknown
}

export type AuthUserProfile = {
  codigo: string
  nombres: string
  apellidos: string
  email: string
  pais: string
  idRol: string
  rol: string
  initials: string
}

export function getStoredToken() {
  return localStorage.getItem('token')
}

export function clearStoredToken() {
  localStorage.removeItem('token')
}

export function getTokenPayload(token: string): TokenPayload | null {
  try {
    const payload = token.split('.')[1]

    if (!payload) {
      return null
    }

    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decodedPayload = atob(normalizedPayload)

    return JSON.parse(decodedPayload) as TokenPayload
  } catch {
    return null
  }
}

function pickText(...values: unknown[]) {
  const value = values.find((item) => typeof item === 'string' && item.trim().length > 0)

  return typeof value === 'string' ? value.trim() : ''
}

function pickNumberText(...values: unknown[]) {
  const value = values.find((item) => typeof item === 'number' || typeof item === 'string')

  return value === undefined || value === null || value === '' ? '' : String(value)
}

function buildInitials(nombres: string, apellidos: string, email: string) {
  const source = `${nombres} ${apellidos}`.trim() || email
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  const initials = parts.slice(0, 2).map((part) => part[0]?.toUpperCase()).join('')

  return initials || 'US'
}

export function buildUserProfileFromData(user: {
  codigo?: string
  nombres?: string
  apellidos?: string
  email?: string
  pais?: string
  id_rol?: number
  rol?: string
}): AuthUserProfile {
  const idRol = pickNumberText(user.id_rol)
  const rol = pickText(user.rol, idRol ? `Rol ${idRol}` : '')

  return {
    codigo: pickText(user.codigo),
    nombres: pickText(user.nombres),
    apellidos: pickText(user.apellidos),
    email: pickText(user.email),
    pais: pickText(user.pais),
    idRol,
    rol,
    initials: buildInitials(pickText(user.nombres), pickText(user.apellidos), pickText(user.email)),
  }
}

export function getUserProfileFromToken(token: string | null): AuthUserProfile | null {
  if (!token) {
    return null
  }

  const payload = getTokenPayload(token)

  if (!payload) {
    return null
  }

  const fullName = pickText(payload.name)
  const [firstName = '', ...lastNameParts] = fullName.split(' ').filter(Boolean)
  const nombres = pickText(payload.nombres, payload.nombre, firstName)
  const apellidos = pickText(payload.apellidos, payload.apellido, lastNameParts.join(' '))
  const email = pickText(payload.email)
  const idRol = pickNumberText(payload.id_rol)
  const rol = pickText(payload.rol, payload.role, idRol ? `Rol ${idRol}` : '')

  return buildUserProfileFromData({
    codigo: pickText(payload.codigo, payload.sub),
    nombres,
    apellidos,
    email,
    pais: pickText(payload.pais, payload.country),
    id_rol: idRol ? Number(idRol) : undefined,
    rol,
  })
}

export function isSuperAdminToken(token: string | null) {
  if (!token) {
    return false
  }

  const payload = getTokenPayload(token)

  if (!payload) {
    return false
  }

  const roleText = String(payload.rol ?? payload.role ?? '').toLowerCase()

  return payload.id_rol === 1 || roleText === 'superadmin' || roleText === 'super_admin'
}

export function isStudentToken(token: string | null) {
  if (!token) {
    return false
  }

  const payload = getTokenPayload(token)

  if (!payload) {
    return false
  }

  const roleText = String(payload.rol ?? payload.role ?? '').toLowerCase()

  return payload.id_rol === 5 || roleText === 'estudiante' || roleText === 'student'
}
