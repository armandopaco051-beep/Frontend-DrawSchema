import { useMemo, useState, useRef } from 'react'
import {
  CheckCircle2,
  Circle,
  Edit3,
  Layers,
  MessageSquare,
  Send,
  Trash2,
  X,
} from 'lucide-react'
import type { ClassFlowNode } from '../../diagrams/types/relation.types'
import { useCommentStore } from '../store/comment.store'
import {
  crearComentario,
  editarComentario,
  eliminarComentario,
  resolverComentario,
} from '../../../services/comentarioService'
import type { Comentario } from '../../../models/comentario'
import './CommentsDrawer.css'

type CommentsDrawerProps = {
  diagramaId: number
  theme: 'dark' | 'light'
  canEdit: boolean
  currentUserCodigo?: string
  nodes: ClassFlowNode[]
  onSelectNode?: (nodeId: string) => void
  onCommentMutated?: (
    type: 'comment_created' | 'comment_updated' | 'comment_resolved' | 'comment_deleted',
    payload: Record<string, unknown>,
  ) => void
}

function formatCommentDate(dateString: string): string {
  try {
    const date = new Date(dateString)
    if (isNaN(date.getTime())) return dateString

    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / 60000)

    if (diffMins < 1) return 'Hace un momento'
    if (diffMins < 60) return `Hace ${diffMins} min`

    const diffHours = Math.floor(diffMins / 60)
    if (diffHours < 24) return `Hace ${diffHours} h`

    return date.toLocaleDateString(undefined, {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return dateString
  }
}

export function CommentsDrawer({
  diagramaId,
  theme,
  canEdit,
  currentUserCodigo,
  nodes,
  onSelectNode,
  onCommentMutated,
}: CommentsDrawerProps) {
  const {
    comentarios,
    isOpen,
    setIsOpen,
    filterStatus,
    setFilterStatus,
    selectedNodeId,
    setSelectedNodeId,
    addComentario,
    updateComentario,
    removeComentario,
    totalPendingCount,
  } = useCommentStore()

  const [newText, setNewText] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [editingCommentId, setEditingCommentId] = useState<number | null>(null)
  const [editText, setEditText] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const listEndRef = useRef<HTMLDivElement | null>(null)

  // Nombre de la clase seleccionada (si hay filtro por nodo)
  const targetNode = useMemo(
    () => (selectedNodeId ? nodes.find((n) => n.id === selectedNodeId) : null),
    [selectedNodeId, nodes],
  )

  // Mapeo id_nodo -> nombre clase
  const nodeNamesMap = useMemo(() => {
    const map = new Map<string, string>()
    for (const node of nodes) {
      map.set(node.id, node.data?.name || node.id)
    }
    return map
  }, [nodes])

  // Filtrado de comentarios según tab y nodo seleccionado
  const filteredComentarios = useMemo(() => {
    return comentarios.filter((c) => {
      if (filterStatus === 'pending' && c.resuelto) {
        return false
      }
      if (selectedNodeId && c.nodo_id !== selectedNodeId) {
        return false
      }
      return true
    })
  }, [comentarios, filterStatus, selectedNodeId])

  if (!isOpen) {
    return null
  }

  async function handleCreateComment(e?: React.FormEvent) {
    if (e) e.preventDefault()
    const trimmed = newText.trim()
    if (!trimmed || isSubmitting) return

    setIsSubmitting(true)
    setErrorMsg('')
    try {
      const created = await crearComentario(diagramaId, {
        nodo_id: selectedNodeId || null,
        texto: trimmed,
      })
      addComentario(created)
      setNewText('')
      onCommentMutated?.('comment_created', { comentario: created })
      setTimeout(() => {
        listEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 100)
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al publicar comentario')
    } finally {
      setIsSubmitting(false)
    }
  }

  async function handleToggleResolve(comentario: Comentario) {
    try {
      const nextResolved = !comentario.resuelto
      const updated = await resolverComentario(comentario.id, nextResolved)
      updateComentario(updated)
      onCommentMutated?.('comment_resolved', { comentario: updated })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al cambiar estado')
    }
  }

  async function handleSaveEdit(comentarioId: number) {
    const trimmed = editText.trim()
    if (!trimmed) return

    try {
      const updated = await editarComentario(comentarioId, trimmed)
      updateComentario(updated)
      setEditingCommentId(null)
      onCommentMutated?.('comment_updated', { comentario: updated })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al editar comentario')
    }
  }

  async function handleDeleteComment(comentarioId: number) {
    if (!window.confirm('¿Eliminar este comentario?')) return

    try {
      await eliminarComentario(comentarioId)
      removeComentario(comentarioId)
      onCommentMutated?.('comment_deleted', { comentario_id: comentarioId })
    } catch (err) {
      setErrorMsg(err instanceof Error ? err.message : 'Error al eliminar comentario')
    }
  }

  return (
    <div className="comments-drawer-backdrop" onClick={() => setIsOpen(false)}>
      <aside
        className={`comments-drawer ${theme === 'light' ? 'light' : ''}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabecera */}
        <header className="comments-drawer-header">
          <div className="comments-drawer-title-group">
            <MessageSquare size={18} />
            <h3>Comentarios</h3>
            {totalPendingCount > 0 && (
              <span className="comments-badge-pill" title="Comentarios pendientes">
                {totalPendingCount} pendientes
              </span>
            )}
          </div>
          <button
            className="comments-close-btn"
            onClick={() => setIsOpen(false)}
            title="Cerrar panel"
            type="button"
          >
            <X size={18} />
          </button>
        </header>

        {/* Barra de Filtros */}
        <div className="comments-filter-bar">
          <div className="comments-tabs">
            <button
              className={`comments-tab-btn ${filterStatus === 'all' ? 'active' : ''}`}
              onClick={() => setFilterStatus('all')}
              type="button"
            >
              Todos ({comentarios.length})
            </button>
            <button
              className={`comments-tab-btn ${filterStatus === 'pending' ? 'active' : ''}`}
              onClick={() => setFilterStatus('pending')}
              type="button"
            >
              Pendientes ({totalPendingCount})
            </button>
          </div>

          {targetNode ? (
            <div className="comments-node-filter-chip">
              <Layers size={13} />
              <span>{targetNode.data?.name || 'Clase'}</span>
              <button
                onClick={() => setSelectedNodeId(null)}
                title="Quitar filtro de clase"
                type="button"
              >
                <X size={12} />
              </button>
            </div>
          ) : null}
        </div>

        {errorMsg && (
          <div style={{ padding: '8px 20px', background: '#e11d4822', color: '#fb7185', fontSize: '0.8rem' }}>
            {errorMsg}
          </div>
        )}

        {/* Lista de Comentarios */}
        <div className="comments-list">
          {filteredComentarios.length === 0 ? (
            <div className="comments-empty-state">
              <MessageSquare size={38} />
              <p>
                {selectedNodeId
                  ? 'No hay comentarios en esta clase.'
                  : 'Aún no hay comentarios en este diagrama.'}
              </p>
              <span style={{ fontSize: '0.78rem', color: '#888' }}>
                ¡Inicia una discusión sobre el diseño o los atributos!
              </span>
            </div>
          ) : (
            filteredComentarios.map((c) => {
              const isAuthor = currentUserCodigo && c.autor_codigo === currentUserCodigo
              const isEditing = editingCommentId === c.id
              const nodeName = c.nodo_id ? nodeNamesMap.get(c.nodo_id) || 'Clase' : null
              const initials = (c.autor_nombre || c.autor_codigo || 'U')
                .split(' ')
                .map((n) => n[0])
                .slice(0, 2)
                .join('')

              return (
                <div key={c.id} className={`comment-card ${c.resuelto ? 'resolved' : ''}`}>
                  <div className="comment-card-top">
                    <div className="comment-author-info">
                      <div className="comment-avatar">{initials}</div>
                      <div>
                        <span className="comment-author-name">
                          {c.autor_nombre || c.autor_codigo}
                        </span>
                        <div className="comment-date">{formatCommentDate(c.creado_en)}</div>
                      </div>
                    </div>

                    <div className="comment-card-actions">
                      <button
                        className={`comment-action-btn resolve ${c.resuelto ? 'active' : ''}`}
                        onClick={() => handleToggleResolve(c)}
                        title={c.resuelto ? 'Reabrir comentario' : 'Marcar como resuelto'}
                        type="button"
                      >
                        {c.resuelto ? <CheckCircle2 size={16} /> : <Circle size={16} />}
                      </button>

                      {isAuthor && !isEditing && (
                        <button
                          className="comment-action-btn"
                          onClick={() => {
                            setEditingCommentId(c.id)
                            setEditText(c.texto)
                          }}
                          title="Editar texto"
                          type="button"
                        >
                          <Edit3 size={15} />
                        </button>
                      )}

                      {(isAuthor || canEdit) && (
                        <button
                          className="comment-action-btn delete"
                          onClick={() => handleDeleteComment(c.id)}
                          title="Eliminar comentario"
                          type="button"
                        >
                          <Trash2 size={15} />
                        </button>
                      )}
                    </div>
                  </div>

                  {nodeName && (
                    <button
                      className="comment-node-tag"
                      onClick={() => {
                        if (c.nodo_id && onSelectNode) {
                          onSelectNode(c.nodo_id)
                        }
                      }}
                      title="Ver clase en el canvas"
                      type="button"
                    >
                      <Layers size={11} />
                      <span>{nodeName}</span>
                    </button>
                  )}

                  {isEditing ? (
                    <div className="comment-edit-box">
                      <textarea
                        value={editText}
                        onChange={(e) => setEditText(e.target.value)}
                        rows={2}
                      />
                      <div className="comment-edit-actions">
                        <button
                          className="btn-cancel"
                          onClick={() => setEditingCommentId(null)}
                          type="button"
                        >
                          Cancelar
                        </button>
                        <button
                          className="btn-save"
                          onClick={() => handleSaveEdit(c.id)}
                          type="button"
                        >
                          Guardar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="comment-card-body">{c.texto}</div>
                  )}
                </div>
              )
            })
          )}
          <div ref={listEndRef} />
        </div>

        {/* Formulario Inferior */}
        <footer className="comments-drawer-footer">
          <div className="comments-composer-target">
            <span>
              {targetNode ? (
                <span className="comments-target-badge">
                  <Layers size={13} />
                  En: {targetNode.data?.name || 'Clase'}
                </span>
              ) : (
                'Comentario general del diagrama'
              )}
            </span>
            {targetNode && (
              <button
                style={{ background: 'transparent', border: 'none', color: '#888', cursor: 'pointer', fontSize: '0.72rem' }}
                onClick={() => setSelectedNodeId(null)}
                type="button"
              >
                Cambiar a general
              </button>
            )}
          </div>

          <form onSubmit={handleCreateComment} className="comments-composer-input-row">
            <textarea
              className="comments-composer-textarea"
              placeholder="Escribe un comentario... (Ctrl + Enter)"
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              onKeyDown={(e) => {
                if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
                  e.preventDefault()
                  handleCreateComment()
                }
              }}
              rows={2}
            />
            <button
              className="comments-send-btn"
              disabled={!newText.trim() || isSubmitting}
              title="Publicar comentario"
              type="submit"
            >
              <Send size={16} />
            </button>
          </form>
        </footer>
      </aside>
    </div>
  )
}
