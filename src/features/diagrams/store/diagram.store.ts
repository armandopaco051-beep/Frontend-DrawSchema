import { create } from 'zustand'
import type { ClassFlowEdge, ClassFlowNode, DiagramEvent } from '../types/relation.types'

export type ActiveNodeCollaborator = {
  codigo?: string
  nombre?: string
  email?: string
  lastActiveAt: number
}

type DiagramState = {
  nodes: ClassFlowNode[]
  relations: ClassFlowEdge[]
  selectedRelationId: string
  pendingEvents: DiagramEvent[]
  nodeCollaborators: Record<string, ActiveNodeCollaborator>
  setDiagramState: (nodes: ClassFlowNode[], relations: ClassFlowEdge[]) => void
  addRelation: (relation: ClassFlowEdge, event?: DiagramEvent) => void
  updateRelation: (relationId: string, relation: ClassFlowEdge, event?: DiagramEvent) => void
  removeRelation: (relationId: string, event?: DiagramEvent) => void
  setSelectedRelationId: (relationId: string) => void
  recordEvent: (event: DiagramEvent) => void
  clearPendingEvents: () => void
  setNodeCollaborator: (nodeId: string, collaborator: ActiveNodeCollaborator) => void
  clearNodeCollaborator: (nodeId: string) => void
}

export const useDiagramStore = create<DiagramState>((set) => ({
  nodes: [],
  relations: [],
  selectedRelationId: '',
  pendingEvents: [],
  nodeCollaborators: {},
  setDiagramState: (nodes, relations) =>
    set({
      nodes,
      relations,
    }),
  addRelation: (relation, event) =>
    set((state) => ({
      relations: [...state.relations, relation],
      pendingEvents: event ? [...state.pendingEvents, event] : state.pendingEvents,
    })),
  updateRelation: (relationId, relation, event) =>
    set((state) => ({
      relations: state.relations.map((current) =>
        current.id === relationId ? relation : current,
      ),
      pendingEvents: event ? [...state.pendingEvents, event] : state.pendingEvents,
    })),
  removeRelation: (relationId, event) =>
    set((state) => ({
      relations: state.relations.filter((relation) => relation.id !== relationId),
      pendingEvents: event ? [...state.pendingEvents, event] : state.pendingEvents,
    })),
  setSelectedRelationId: (relationId) =>
    set({
      selectedRelationId: relationId,
    }),
  recordEvent: (event) =>
    set((state) => ({
      pendingEvents: [...state.pendingEvents, event],
    })),
  clearPendingEvents: () =>
    set({
      pendingEvents: [],
    }),
  setNodeCollaborator: (nodeId, collaborator) =>
    set((state) => ({
      nodeCollaborators: {
        ...state.nodeCollaborators,
        [nodeId]: collaborator,
      },
    })),
  clearNodeCollaborator: (nodeId) =>
    set((state) => {
      const next = { ...state.nodeCollaborators }
      delete next[nodeId]
      return { nodeCollaborators: next }
    }),
}))

