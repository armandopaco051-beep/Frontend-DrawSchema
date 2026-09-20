import { create } from 'zustand'
import type { Comentario } from '../../../models/comentario'

type FilterStatus = 'all' | 'pending'

type CommentState = {
  comentarios: Comentario[]
  isOpen: boolean
  filterStatus: FilterStatus
  selectedNodeId: string | null
  pendingCountsByNode: Record<string, number>
  totalPendingCount: number
  setComentarios: (comentarios: Comentario[]) => void
  addComentario: (comentario: Comentario) => void
  updateComentario: (comentario: Comentario) => void
  removeComentario: (comentarioId: number) => void
  setIsOpen: (isOpen: boolean) => void
  openDrawerForNode: (nodeId: string | null) => void
  setFilterStatus: (status: FilterStatus) => void
  setSelectedNodeId: (nodeId: string | null) => void
}

function calculateCounts(comentarios: Comentario[]) {
  const pendingCountsByNode: Record<string, number> = {}
  let totalPendingCount = 0

  for (const c of comentarios) {
    if (!c.resuelto) {
      totalPendingCount += 1
      if (c.nodo_id) {
        pendingCountsByNode[c.nodo_id] = (pendingCountsByNode[c.nodo_id] ?? 0) + 1
      }
    }
  }

  return { pendingCountsByNode, totalPendingCount }
}

export const useCommentStore = create<CommentState>((set) => ({
  comentarios: [],
  isOpen: false,
  filterStatus: 'all',
  selectedNodeId: null,
  pendingCountsByNode: {},
  totalPendingCount: 0,

  setComentarios: (comentarios) => {
    const { pendingCountsByNode, totalPendingCount } = calculateCounts(comentarios)
    set({
      comentarios,
      pendingCountsByNode,
      totalPendingCount,
    })
  },

  addComentario: (comentario) => {
    set((state) => {
      // Evitar duplicados si ya llegó por HTTP o WebSocket
      const exists = state.comentarios.some((c) => c.id === comentario.id)
      const comentarios = exists
        ? state.comentarios.map((c) => (c.id === comentario.id ? comentario : c))
        : [comentario, ...state.comentarios]

      const { pendingCountsByNode, totalPendingCount } = calculateCounts(comentarios)
      return { comentarios, pendingCountsByNode, totalPendingCount }
    })
  },

  updateComentario: (comentario) => {
    set((state) => {
      const comentarios = state.comentarios.map((c) =>
        c.id === comentario.id ? comentario : c,
      )
      const { pendingCountsByNode, totalPendingCount } = calculateCounts(comentarios)
      return { comentarios, pendingCountsByNode, totalPendingCount }
    })
  },

  removeComentario: (comentarioId) => {
    set((state) => {
      const comentarios = state.comentarios.filter((c) => c.id !== comentarioId)
      const { pendingCountsByNode, totalPendingCount } = calculateCounts(comentarios)
      return { comentarios, pendingCountsByNode, totalPendingCount }
    })
  },

  setIsOpen: (isOpen) => set({ isOpen }),

  openDrawerForNode: (nodeId) =>
    set({
      isOpen: true,
      selectedNodeId: nodeId,
    }),

  setFilterStatus: (filterStatus) => set({ filterStatus }),

  setSelectedNodeId: (selectedNodeId) => set({ selectedNodeId }),
}))
