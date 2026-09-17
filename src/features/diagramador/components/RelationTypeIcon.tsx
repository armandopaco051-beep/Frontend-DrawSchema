import type { RelationType } from '../../diagrams/types/relation.types'

type RelationTypeIconProps = {
  type: RelationType
}

export function RelationTypeIcon({ type }: RelationTypeIconProps) {
  if (type === 'generalization' || type === 'realization') {
    return (
      <svg aria-hidden="true" className="relation-type-icon" viewBox="0 0 46 28">
        <path className={type === 'realization' ? 'dashed' : ''} d="M4 14 H25" />
        <path className="empty-fill" d="M25 5 L42 14 L25 23 Z" />
      </svg>
    )
  }

  if (type === 'composition' || type === 'aggregation') {
    return (
      <svg aria-hidden="true" className="relation-type-icon" viewBox="0 0 46 28">
        <path d="M20 14 H42" />
        <path className={type === 'composition' ? 'solid-fill' : 'empty-fill'} d="M4 14 L12 6 L20 14 L12 22 Z" />
      </svg>
    )
  }

  if (type === 'associationClass') {
    return (
      <svg aria-hidden="true" className="relation-type-icon association-class-icon" viewBox="0 0 46 32">
        <path d="M4 12 H42" />
        <path className="dashed" d="M23 12 V27" />
        <rect className="empty-fill" height="10" rx="2" width="16" x="15" y="20" />
      </svg>
    )
  }

  if (type === 'templateBinding') {
    return (
      <svg aria-hidden="true" className="relation-type-icon" viewBox="0 0 46 28">
        <path className="dashed" d="M4 14 H34" />
        <path d="M29 8 L36 14 L29 20" />
        <text x="9" y="11">T</text>
      </svg>
    )
  }

  return (
    <svg aria-hidden="true" className="relation-type-icon" viewBox="0 0 46 28">
      <path d="M4 14 H34" />
      <path d="M28 8 L36 14 L28 20" />
    </svg>
  )
}
