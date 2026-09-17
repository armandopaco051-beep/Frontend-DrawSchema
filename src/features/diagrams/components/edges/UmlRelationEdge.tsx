import { BaseEdge, getSmoothStepPath } from '@xyflow/react'
import type { EdgeProps } from '@xyflow/react'
import type { ClassFlowEdge } from '../../types/relation.types'
import { normalizeRelationType } from '../../utils/relation-markers'

export function UmlRelationEdge({
  data,
  id,
  markerEnd,
  markerStart,
  selected,
  sourcePosition,
  sourceX,
  sourceY,
  style,
  targetPosition,
  targetX,
  targetY,
}: EdgeProps<ClassFlowEdge>) {
  const [edgePath] = getSmoothStepPath({
    sourcePosition,
    sourceX,
    sourceY,
    targetPosition,
    targetX,
    targetY,
  })
  const relationType = normalizeRelationType(data?.relationType)

  return (
    <BaseEdge
      className={`uml-relation-edge-path uml-relation-edge-${relationType} ${
        selected ? 'selected' : ''
      }`}
      id={id}
      markerEnd={markerEnd}
      markerStart={markerStart}
      path={edgePath}
      style={style}
    />
  )
}
