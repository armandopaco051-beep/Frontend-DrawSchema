import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import { MessageSquare } from 'lucide-react'
import type { ClassFlowNode } from '../../diagrams/types/relation.types'
import { useCommentStore } from '../../comments/store/comment.store'
import { useDiagramStore } from '../../diagrams/store/diagram.store'
import { getCollaboratorColor, getCollaboratorInitials } from '../../../utils/collaboratorColor'

function normalizeMethodParameters(parameters: unknown) {
  if (!Array.isArray(parameters)) {
    return []
  }

  return parameters
    .map((parameter) => {
      if (typeof parameter === 'string') {
        return parameter.trim()
      }

      if (parameter && typeof parameter === 'object') {
        const value = parameter as Record<string, unknown>
        return String(value.name ?? value.nombre ?? value.parameter ?? '').trim()
      }

      return ''
    })
    .filter(Boolean)
}

function formatMethodParameters(parameters: unknown) {
  return normalizeMethodParameters(parameters).join(', ')
}

export function ClassNode({ id, data, isConnectable, selected }: NodeProps<ClassFlowNode>) {
  const pendingCount = useCommentStore((state) => state.pendingCountsByNode[id] ?? 0)
  const openDrawerForNode = useCommentStore((state) => state.openDrawerForNode)
  const activeCollaborator = useDiagramStore((state) => state.nodeCollaborators[id])

  const isCollaboratorActive = Boolean(
    activeCollaborator && Date.now() - activeCollaborator.lastActiveAt < 5000,
  )

  const collaboratorColor = getCollaboratorColor(
    activeCollaborator?.codigo || activeCollaborator?.email || activeCollaborator?.nombre,
  )
  const collaboratorInitials = getCollaboratorInitials(activeCollaborator)

  return (
    <article
      className={selected ? 'flow-class-node selected' : 'flow-class-node'}
      style={
        isCollaboratorActive
          ? {
              borderColor: collaboratorColor.border,
              boxShadow: `0 0 0 2px ${collaboratorColor.border}55, 0 20px 48px rgba(0, 0, 0, 0.4)`,
            }
          : undefined
      }
    >
      <NodeResizer
        color="#8fb6ff"
        handleClassName="flow-resize-handle"
        isVisible={selected && isConnectable}
        lineClassName="flow-resize-line"
        minHeight={140}
        minWidth={210}
      />
      <Handle className="flow-handle flow-handle-top" id="top" position={Position.Top} type="source" />
      <Handle className="flow-handle flow-handle-right" id="right" position={Position.Right} type="source" />
      <Handle className="flow-handle flow-handle-bottom" id="bottom" position={Position.Bottom} type="source" />
      <Handle className="flow-handle flow-handle-left" id="left" position={Position.Left} type="source" />

      {/* Indicador de colaborador en tiempo real (Figma / Miro style) */}
      {isCollaboratorActive && activeCollaborator ? (
        <div
          className="flow-node-collaborator-pill nodrag"
          style={{
            backgroundColor: collaboratorColor.bg,
            borderColor: collaboratorColor.border,
            color: collaboratorColor.text,
          }}
        >
          <span className="flow-node-collaborator-avatar">{collaboratorInitials}</span>
          <span className="flow-node-collaborator-text">
            {activeCollaborator.nombre ? activeCollaborator.nombre.split(' ')[0] : 'Colaborador'}
          </span>

          {/* Tooltip interactivo con información completa al poner el puntero */}
          <div className="flow-node-collaborator-tooltip">
            <div className="collaborator-tooltip-top">
              <span
                className="collaborator-tooltip-avatar"
                style={{ backgroundColor: collaboratorColor.bg, color: collaboratorColor.text }}
              >
                {collaboratorInitials}
              </span>
              <div className="collaborator-tooltip-names">
                <strong>{activeCollaborator.nombre || 'Colaborador'}</strong>
                {activeCollaborator.email ? <span>{activeCollaborator.email}</span> : null}
                {activeCollaborator.codigo ? <small>Código: {activeCollaborator.codigo}</small> : null}
              </div>
            </div>
            <div className="collaborator-tooltip-status">
              <span className="collaborator-status-pulse" style={{ backgroundColor: collaboratorColor.border }} />
              Moviendo clase en tiempo real...
            </div>
          </div>
        </div>
      ) : null}

      <header className="flow-class-node-header">
        <strong>{data.name}</strong>
        <div className="flow-node-header-actions">
          {pendingCount > 0 ? (
            <button
              className="flow-node-comment-badge active nodrag"
              onClick={(e) => {
                e.stopPropagation()
                openDrawerForNode(id)
              }}
              title={`${pendingCount} comentarios pendientes`}
              type="button"
            >
              <MessageSquare size={11} />
              <span>{pendingCount}</span>
            </button>
          ) : (
            <button
              className="flow-node-comment-badge nodrag"
              onClick={(e) => {
                e.stopPropagation()
                openDrawerForNode(id)
              }}
              title="Comentar esta clase"
              type="button"
            >
              <MessageSquare size={11} />
            </button>
          )}
        </div>
      </header>
      <div>
        {data.attributes.length > 0 ? (
          data.attributes.map((attribute, index) => {
            const isPk = Boolean(attribute.primaryKey || (attribute as any).isPrimaryKey)
            const isFk = Boolean(attribute.foreignKey || (attribute as any).isForeignKey)

            let prefix = '+ '
            let badge = ''
            if (isPk && isFk) {
              prefix = '# '
              badge = ' [PK, FK]'
            } else if (isPk) {
              prefix = '# '
              badge = ' [PK]'
            } else if (isFk) {
              prefix = '+ '
              badge = ' [FK]'
            }

            return (
              <p key={`${String(attribute.name)}-${index}`}>
                {prefix}
                {String(attribute.name ?? 'atributo')}: {String(attribute.type ?? 'TEXT')}
                {badge ? <span className="attribute-key-badge">{badge}</span> : null}
              </p>
            )
          })
        ) : (
          <p className="muted-line">Sin atributos</p>
        )}
      </div>
      <footer>
        {data.methods.length > 0 ? (
          data.methods.map((method, index) => (
            <p key={`${String(method.name)}-${index}`}>
              {String(method.name ?? 'metodo')}({formatMethodParameters(method.parameters)}): {String(method.returnType ?? 'void')}
            </p>
          ))
        ) : (
          <p className="muted-line">Sin metodos</p>
        )}
      </footer>
    </article>
  )
}
