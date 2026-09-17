import { Handle, NodeResizer, Position, type NodeProps } from '@xyflow/react'
import type { ClassFlowNode } from '../../diagrams/types/relation.types'

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

export function ClassNode({ data, isConnectable, selected }: NodeProps<ClassFlowNode>) {
  return (
    <article className={selected ? 'flow-class-node selected' : 'flow-class-node'}>
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
      <header>
        <strong>{data.name}</strong>
      </header>
      <div>
        {data.attributes.length > 0 ? (
          data.attributes.map((attribute, index) => (
            <p key={`${String(attribute.name)}-${index}`}>
              {attribute.primaryKey ? '# ' : '+ '}
              {String(attribute.name ?? 'atributo')}: {String(attribute.type ?? 'TEXT')}
            </p>
          ))
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
