import { useState } from 'react'
import { Loader2, Send } from 'lucide-react'
import { ApiError } from '../../services/api'
import type { DiagramaResponse } from '../../services/diagramaService'
import type { AiPlannerQuestion, AiPlannerResponse } from '../../services/aiService'
import { executeDiagramPlan, planWithAi } from '../../services/aiService'

type AiPlannerPanelProps = {
  proyectoId?: number | null
  diagramaId?: number | null
  autorCodigo?: string | null
  compact?: boolean
  canEdit?: boolean
  onDiagramUpdated?: (diagrama: DiagramaResponse) => void
}

type ChatMessage = {
  id: string
  role: 'user' | 'assistant' | 'error'
  text: string
  plan?: AiPlannerResponse
}

function getQuestionText(question: AiPlannerQuestion) {
  if (typeof question === 'string') {
    return question
  }

  return question.question ?? question.text ?? question.message ?? JSON.stringify(question)
}

function createMessage(role: ChatMessage['role'], text: string, plan?: AiPlannerResponse): ChatMessage {
  return {
    id: crypto.randomUUID(),
    role,
    text,
    plan,
  }
}

export function AiPlannerPanel({ compact = false, diagramaId, proyectoId, autorCodigo,
  canEdit = true,
  onDiagramUpdated, }: AiPlannerPanelProps) {
  const [message, setMessage] = useState('')
  const [localProyectoId, setLocalProyectoId] = useState(proyectoId ? String(proyectoId) : '')
  const [localDiagramaId, setLocalDiagramaId] = useState(diagramaId ? String(diagramaId) : '')
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [isApplying, setIsApplying] = useState(false)

  const activeProyectoId = proyectoId ?? Number(localProyectoId)
  const activeDiagramaId = diagramaId ?? Number(localDiagramaId)

  function pushError(text: string) {
    setMessages((current) => [...current, createMessage('error', text)])
  }

  async function handleApplyPlan(plan: AiPlannerResponse) {
    if (!Number.isFinite(activeDiagramaId) || activeDiagramaId <= 0) {
      pushError('No hay un diagrama seleccionado.')
      return
    }

    if (!autorCodigo) {
      pushError('No se encontro el codigo del usuario.')
      return
    }

    if (!canEdit) {
      pushError('No tienes permiso para modificar este diagrama.')
      return
    }

    if (!plan.can_execute || plan.actions.length === 0) {
      pushError('Este plan no tiene acciones listas para aplicar.')
      return
    }

    setIsApplying(true)

    try {
      const result = await executeDiagramPlan({
        diagrama_id: activeDiagramaId,
        autor_codigo: autorCodigo,
        confirmed: true,
        actions: plan.actions,
      })

      if (!result.success) {
        pushError(result.message || 'El agente IA no pudo aplicar el plan.')
        return
      }

      if (result.diagrama) {
        onDiagramUpdated?.(result.diagrama)
      }

      setMessages((current) => [
        ...current,
        createMessage('assistant', result.message || 'Listo, actualice el diagrama.'),
      ])
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        pushError(String(requestError.message))
      } else {
        pushError('No se pudo aplicar el plan del agente IA.')
      }
    } finally {
      setIsApplying(false)
    }
  }

  async function handlePlan() {
    const cleanMessage = message.trim()

    if (!cleanMessage) {
      pushError('Escribe una peticion para el agente IA.')
      return
    }

    if (!Number.isFinite(activeProyectoId) || activeProyectoId <= 0) {
      pushError('Selecciona o escribe un proyecto valido.')
      return
    }

    if (!Number.isFinite(activeDiagramaId) || activeDiagramaId <= 0) {
      pushError('Selecciona o escribe un diagrama valido.')
      return
    }

    setMessages((current) => [...current, createMessage('user', cleanMessage)])
    setMessage('')
    setIsLoading(true)

    try {
      const nextPlan = await planWithAi({
        message: cleanMessage,
        proyecto_id: activeProyectoId,
        diagrama_id: activeDiagramaId,
      })

      setMessages((current) => [
        ...current,
        createMessage('assistant', nextPlan.summary || 'Ya tengo un plan para tu diagrama.', nextPlan),
      ])
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        pushError(String(requestError.message))
      } else {
        pushError('No se pudo conectar con el backend IA.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <section className={compact ? 'ai-chat-panel ai-chat-panel-compact' : 'ai-chat-panel'}>
      <header className="ai-planner-header">
        <div>
          <p>Asistente</p>
          <h2>Conversar el diagrama</h2>
        </div>
      </header>

      <div className="ai-chat-messages">
        {messages.length === 0 ? (
          <div className="ai-chat-empty">
            <strong>Escribi lo que quieres construir.</strong>
            <p>Por ejemplo: crea un sistema de ventas con clientes, productos y pedidos.</p>
          </div>
        ) : null}

        {messages.map((chatMessage) => {
          const sortedActions = [...(chatMessage.plan?.actions ?? [])].sort(
            (first, second) => first.order - second.order,
          )

          return (
            <article className={`ai-chat-message ${chatMessage.role}`} key={chatMessage.id}>
              <div className="ai-chat-bubble">
                <p>{chatMessage.text}</p>

                {chatMessage.plan ? (
                  <>
                    {sortedActions.length > 0 ? (
                      <div className="ai-chat-actions">
                        <strong className="ai-chat-section-title">Plan sugerido</strong>
                        {sortedActions.map((action) => (
                          <div className="ai-chat-action" key={`${action.order}-${action.tool}`}>
                            <span>{action.order}</span>
                            <div>
                              <strong>{action.description}</strong>
                              <small>{action.requires_confirmation ? 'Requiere confirmacion' : 'Listo para revisar'}</small>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : null}

                    {chatMessage.plan.questions.length > 0 ? (
                      <div className="ai-chat-questions">
                        <strong className="ai-chat-section-title">Antes de avanzar</strong>
                        {chatMessage.plan.questions.map((question, index) => (
                          <p key={`${getQuestionText(question)}-${index}`}>{getQuestionText(question)}</p>
                        ))}
                      </div>
                    ) : null}

                    <button
                      className="primary-action ai-apply-button"
                      disabled={isApplying || !canEdit || !chatMessage.plan.can_execute || sortedActions.length === 0}
                      onClick={() => handleApplyPlan(chatMessage.plan!)}
                      type="button"
                    >
                      {isApplying ? 'Aplicando...' : 'Aplicar plan'}
                    </button>
                  </>
                ) : null}
              </div>
            </article>
          )
        })}

        {isLoading ? (
          <article className="ai-chat-message assistant">
            <div className="ai-chat-bubble ai-typing">
              <Loader2 className="ai-spin" size={17} />
              <span>Planificando respuesta...</span>
            </div>
          </article>
        ) : null}
      </div>

      {!proyectoId || !diagramaId ? (
        <div className="ai-context-grid">
          {!proyectoId ? (
            <label>
              Proyecto ID
              <input
                min="1"
                onChange={(event) => setLocalProyectoId(event.target.value)}
                placeholder="2"
                type="number"
                value={localProyectoId}
              />
            </label>
          ) : null}

          {!diagramaId ? (
            <label>
              Diagrama ID
              <input
                min="1"
                onChange={(event) => setLocalDiagramaId(event.target.value)}
                placeholder="1"
                type="number"
                value={localDiagramaId}
              />
            </label>
          ) : null}
        </div>
      ) : null}

      <div className="ai-chat-composer">
        <textarea
          disabled={isLoading}
          onChange={(event) => setMessage(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
              event.preventDefault()
              void handlePlan()
            }
          }}
          placeholder="Pide algo para tu diagrama..."
          value={message}
        />
        <button aria-label="Enviar peticion IA" disabled={isLoading || isApplying || !message.trim()} onClick={handlePlan} type="button">
          {isLoading ? <Loader2 className="ai-spin" size={18} /> : <Send size={18} />}
        </button>
      </div>
    </section>
  )
}
