const WS_URL = 'ws://127.0.0.1:8001'
const MAX_RECONNECT_ATTEMPTS = 3
const RECONNECT_DELAY_MS = 2000

export type RealtimeDiagramEventType =
  | 'connection_ack'
  | 'user_joined'
  | 'user_left'
  | 'cursor_moved'
  | 'selection_changed'
  | 'typing_started'
  | 'typing_stopped'
  | 'class_created'
  | 'class_updated'
  | 'class_deleted'
  | 'class_moved'
  | 'relation_created'
  | 'relation_updated'
  | 'relation_deleted'
  | 'diagram_saved'
  | 'diagram_reloaded'
  | 'event_rejected'
  | 'comment_created'
  | 'comment_updated'
  | 'comment_resolved'
  | 'comment_deleted'

export type RealtimeDiagramUser = {
  codigo?: string
  nombre?: string
  email?: string
  can_edit?: boolean
}

export type RealtimeDiagramEvent<TPayload = Record<string, unknown>> = {
  type: RealtimeDiagramEventType
  diagrama_id?: number
  user?: RealtimeDiagramUser
  payload?: TPayload
  timestamp?: string
}

type RealtimeCallbacks = {
  onClose?: () => void
  onEvent?: (event: RealtimeDiagramEvent) => void
  onOpen?: () => void
  onReconnectFailed?: () => void
}

let socket: WebSocket | null = null
let activeDiagramaId: number | null = null
let activeCallbacks: RealtimeCallbacks = {}
let reconnectAttempts = 0
let reconnectTimer: number | null = null
let manualDisconnect = false

function clearReconnectTimer() {
  if (reconnectTimer !== null) {
    window.clearTimeout(reconnectTimer)
    reconnectTimer = null
  }
}

function buildSocketUrl(diagramaId: number) {
  const token = localStorage.getItem('token') ?? ''
  return `${WS_URL}/ws/diagramas/${diagramaId}?token=${encodeURIComponent(token)}`
}

function openSocket(diagramaId: number, callbacks: RealtimeCallbacks) {
  socket = new WebSocket(buildSocketUrl(diagramaId))

  socket.onopen = () => {
    reconnectAttempts = 0
    callbacks.onOpen?.()
  }

  socket.onmessage = (message) => {
    try {
      const event = JSON.parse(message.data) as RealtimeDiagramEvent
      callbacks.onEvent?.(event)
    } catch {
      // Ignore malformed realtime messages so the diagrammer keeps running.
    }
  }

  socket.onclose = () => {
    socket = null
    callbacks.onClose?.()

    if (manualDisconnect || activeDiagramaId !== diagramaId) {
      return
    }

    if (reconnectAttempts >= MAX_RECONNECT_ATTEMPTS) {
      callbacks.onReconnectFailed?.()
      return
    }

    reconnectAttempts += 1
    clearReconnectTimer()
    reconnectTimer = window.setTimeout(() => {
      openSocket(diagramaId, callbacks)
    }, RECONNECT_DELAY_MS)
  }
}

export function connectDiagramSocket(diagramaId: number, callbacks: RealtimeCallbacks = {}) {
  disconnectDiagramSocket()
  manualDisconnect = false
  activeDiagramaId = diagramaId
  activeCallbacks = callbacks
  reconnectAttempts = 0
  openSocket(diagramaId, callbacks)
}

export function disconnectDiagramSocket() {
  manualDisconnect = true
  clearReconnectTimer()

  if (socket) {
    socket.close()
    socket = null
  }

  activeDiagramaId = null
  activeCallbacks = {}
  reconnectAttempts = 0
}

export function sendRealtimeEvent(type: RealtimeDiagramEventType, payload: Record<string, unknown> = {}) {
  if (!socket || socket.readyState !== WebSocket.OPEN) {
    return false
  }

  socket.send(
    JSON.stringify({
      type,
      payload,
    }),
  )

  return true
}

export function getActiveRealtimeCallbacks() {
  return activeCallbacks
}
