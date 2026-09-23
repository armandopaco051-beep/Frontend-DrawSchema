import { create } from 'zustand'

export type ToastVariant = 'ia' | 'collaborator' | 'info' | 'success' | 'warning'

export type ToastItem = {
  id: string
  message: string
  actor?: string
  variant: ToastVariant
  createdAt: number
}

type ToastState = {
  toasts: ToastItem[]
  addToast: (message: string, variant?: ToastVariant, actor?: string) => void
  removeToast: (id: string) => void
  clearToasts: () => void
}

export const useToastStore = create<ToastState>((set) => ({
  toasts: [],
  addToast: (message: string, variant = 'info', actor?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`
    const isAi = variant === 'ia' || (actor ? /ia|ai|asistente|agente/i.test(actor) : false)
    const finalVariant: ToastVariant = isAi ? 'ia' : variant

    set((state) => ({
      toasts: [...state.toasts.slice(-4), { id, message, actor, variant: finalVariant, createdAt: Date.now() }],
    }))

    // Auto dismiss after 4.5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }))
    }, 4500)
  },
  removeToast: (id: string) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
  clearToasts: () => set({ toasts: [] }),
}))

export function showToast(message: string, variant: ToastVariant = 'info', actor?: string) {
  useToastStore.getState().addToast(message, variant, actor)
}

export const Toast = showToast
