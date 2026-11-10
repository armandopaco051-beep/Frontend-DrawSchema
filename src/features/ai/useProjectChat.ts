import { useEffect, useState } from 'react'
import { ApiError } from '../../services/api'
import { listMessages, openConversation, sendMessage, requestAiReply, requestImageReply } from '../../services/chatService'
import type { ChatScope, StoredMessage } from '../../services/chatService'
import type { TextProvider } from '../../services/chatService'

type ChatState = {
  key: string
  conversationId: number | null
  messages: StoredMessage[]
  before: number | null
  loading: boolean
  loadingOlder: boolean
  error: string | null
  blocked: boolean
}

function errorText(error: unknown) {
  return error instanceof Error ? error.message : 'No se pudo conectar con el chat.'
}

function mergeMessages(current: StoredMessage[], incoming: StoredMessage[]) {
  const unique = new Map(current.map((message) => [message.id, message]))
  for (const message of incoming) unique.set(message.id, message)
  return [...unique.values()].sort((a, b) => a.id - b.id)
}

function isAccessError(error: unknown) {
  return error instanceof ApiError && [401, 403, 404].includes(error.status)
}

export function useProjectChat(projectId: number, scope: ChatScope, userCode: string) {
  const enabled = Number.isInteger(projectId) && projectId > 0 && Boolean(userCode)
  const [attempt, setAttempt] = useState(0)
  const key = JSON.stringify([projectId, scope, userCode, attempt])
  const [state, setState] = useState<ChatState>({
    key: '', conversationId: null, messages: [], before: null,
    loading: false, loadingOlder: false, error: null, blocked: false,
  })

  useEffect(() => {
    const controller = new AbortController()
    let timer: ReturnType<typeof setTimeout> | undefined
    let cancelled = false

    async function start() {
      if (!enabled) return
      try {
        const conversation = await openConversation(projectId, scope, controller.signal)
        const page = await listMessages(conversation.id, undefined, controller.signal)
        if (cancelled) return
        setState({
          key, conversationId: conversation.id, messages: page.mensajes,
          before: page.siguiente_antes_de, loading: false,
          loadingOlder: false, error: null, blocked: false,
        })

        // Poll sequentially: no overlapping requests. WebSockets can replace this later.
        async function refresh() {
          let blocked = false
          try {
            const latest = await listMessages(conversation.id, undefined, controller.signal)
            if (cancelled) return
            setState((current) => current.key === key ? {
              ...current, messages: mergeMessages(current.messages, latest.mensajes), error: null,
            } : current)
          } catch (error) {
            if (cancelled) return
            blocked = isAccessError(error)
            setState((current) => current.key === key ? {
              ...current, error: errorText(error), blocked,
              ...(blocked ? { messages: [], conversationId: null } : {}),
            } : current)
          } finally {
            if (!cancelled && !blocked) timer = setTimeout(refresh, 5000)
          }
        }
        timer = setTimeout(refresh, 5000)
      } catch (error) {
        if (cancelled) return
        setState({
          key, conversationId: null, messages: [], before: null,
          loading: false, loadingOlder: false,
          error: errorText(error), blocked: isAccessError(error),
        })
      }
    }
    void start()
    return () => {
      cancelled = true
      controller.abort()
      clearTimeout(timer)
    }
  }, [enabled, key, projectId, scope, attempt])

  const current = state.key === key ? state : null

  async function send(text: string, diagramId?: number) {
    if (!current?.conversationId || current.blocked) {
      throw new Error('La conversación todavía no está disponible.')
    }
    const saved = await sendMessage(current.conversationId, text, diagramId)
    setState((previous) => previous.key === key && !previous.blocked ? {
      ...previous, messages: mergeMessages(previous.messages, [saved]),
    } : previous)
    return saved
  }

  async function loadOlder() {
    if (!current?.conversationId || !current.before || current.loadingOlder || current.blocked) return
    const conversationId = current.conversationId
    const before = current.before
    setState((previous) => previous.key === key ? { ...previous, loadingOlder: true } : previous)
    try {
      const page = await listMessages(conversationId, before)
      setState((previous) => previous.key === key && !previous.blocked ? {
        ...previous, messages: mergeMessages(previous.messages, page.mensajes),
        before: page.siguiente_antes_de, error: null,
      } : previous)
    } catch (error) {
      setState((previous) => previous.key === key ? {
        ...previous, error: errorText(error),
      } : previous)
    } finally {
      setState((previous) => previous.key === key ? { ...previous, loadingOlder: false } : previous)
    }
  }

  async function respond(messageId: number, diagramId?: number, provider: TextProvider = 'gemini') {
    if (!current?.conversationId || current.blocked) throw new Error('Conversación no disponible.')
    const answer = await requestAiReply(current.conversationId, messageId, diagramId, provider)
    setState((previous) => previous.key === key && !previous.blocked ? {
      ...previous, messages: mergeMessages(previous.messages, [answer]),
    } : previous)
    return answer
  }

  async function analyze(image: File, diagramId: number) {
    if (!current?.conversationId || current.blocked) throw new Error('Conversación no disponible.')
    const result = await requestImageReply(current.conversationId, diagramId, image)
    setState((previous) => previous.key === key && !previous.blocked ? {
      ...previous, messages: mergeMessages(previous.messages, [result.consulta, result.respuesta]),
    } : previous)
    return result.respuesta
  }

  return {
    messages: current?.messages ?? [],
    ready: enabled && Boolean(current?.conversationId) && !current?.blocked,
    loading: enabled && (!current || current.loading),
    loadingOlder: current?.loadingOlder ?? false,
    hasOlder: Boolean(current?.before),
    blocked: current?.blocked ?? false,
    error: current?.error ?? null,
    send, respond, analyze, loadOlder,
    retry: () => setAttempt((value) => value + 1),
  }
}
