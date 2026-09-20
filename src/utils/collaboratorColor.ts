export type CollaboratorColor = {
  bg: string
  border: string
  text: string
}

const COLLABORATOR_PALETTE: CollaboratorColor[] = [
  { bg: '#3b82f6', border: '#60a5fa', text: '#ffffff' }, // Azul
  { bg: '#10b981', border: '#34d399', text: '#ffffff' }, // Esmeralda
  { bg: '#8b5cf6', border: '#a78bfa', text: '#ffffff' }, // Violeta
  { bg: '#f59e0b', border: '#fbbf24', text: '#111827' }, // Ámbar
  { bg: '#ec4899', border: '#f472b6', text: '#ffffff' }, // Rosa
  { bg: '#06b6d4', border: '#22d3ee', text: '#ffffff' }, // Cian
  { bg: '#f97316', border: '#fb923c', text: '#ffffff' }, // Naranja
  { bg: '#14b8a6', border: '#2dd4bf', text: '#ffffff' }, // Verde azulado
]

export function getCollaboratorColor(identifier?: string): CollaboratorColor {
  if (!identifier) {
    return COLLABORATOR_PALETTE[0]
  }

  let hash = 0
  for (let i = 0; i < identifier.length; i++) {
    hash = identifier.charCodeAt(i) + ((hash << 5) - hash)
  }
  const index = Math.abs(hash) % COLLABORATOR_PALETTE.length
  return COLLABORATOR_PALETTE[index]
}

export function getCollaboratorInitials(user?: { nombre?: string; email?: string; codigo?: string }): string {
  if (!user) return '?'

  if (user.nombre && user.nombre.trim()) {
    const parts = user.nombre.trim().split(/\s+/).filter(Boolean)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
    }
    return parts[0].slice(0, 2).toUpperCase()
  }

  if (user.email && user.email.trim()) {
    const namePart = user.email.split('@')[0]
    return namePart.slice(0, 2).toUpperCase()
  }

  if (user.codigo && user.codigo.trim()) {
    return user.codigo.slice(0, 2).toUpperCase()
  }

  return '?'
}
