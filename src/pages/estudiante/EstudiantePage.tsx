import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  addEdge,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import type {
  Connection,
  OnConnect,
  OnNodeDrag,
} from '@xyflow/react'
import {
  ArrowLeft,
  ChevronDown,
  Database,
  FileCode2,
  FolderKanban,
  LayoutDashboard,
  PanelLeftClose,
  PanelLeftOpen,
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react'
import { AdminSidebarExtras } from '../../components/admin/AdminSidebarExtras'
import { ClassFeaturesPanel } from '../../features/diagramador/components/ClassFeaturesPanel'
import { CreateClassPanel } from '../../features/diagramador/components/CreateClassPanel'
import { DiagramAssistantPanel } from '../../features/diagramador/components/DiagramAssistantPanel'
import { DiagramCanvas } from '../../features/diagramador/components/DiagramCanvas'
import { DiagramListPanel } from '../../features/diagramador/components/DiagramListPanel'
import { RelationBuilderPanel, RelationsPanel } from '../../features/diagramador/components/RelationsPanel'
import { useDiagramStore } from '../../features/diagrams/store/diagram.store'
import type {
  Cardinality,
  ClassAttribute,
  ClassFlowEdge,
  ClassFlowNode,
  ClassMethod,
  ClassNodeData,
  RelationType,
  UmlRelationData,
} from '../../features/diagrams/types/relation.types'
import {
  getRelationEdgeProps,
  normalizeCardinality,
  normalizeRelationType,
} from '../../features/diagrams/utils/relation-markers'
import { createDiagramEvent, validateRelation } from '../../features/diagrams/utils/relation-validation'
import type { Proyecto, ProyectoMiembro } from '../../models/proyecto'
import { ApiError } from '../../services/api'
import type { DiagramContent, DiagramEdge, DiagramNode, DiagramaResponse } from '../../services/diagramaService'
import {
  abrirDiagrama,
  agregarClase,
  crearDiagrama,
  eliminarDiagrama,
  guardarDiagrama,
  listarDiagramasPorProyecto,
  moverClase,
} from '../../services/diagramaService'
import {
  actualizarMiembro,
  agregarMiembro,
  crearProyecto,
  listarMiembros,
  listarProyectosPorUsuario,
  quitarMiembro,
} from '../../services/proyecto'
import { listarUsuarios } from '../../services/usuarioService'
import type { AuthUserProfile } from '../../utils/auth'
import '@xyflow/react/dist/style.css'
import '../usuario/UsuariosPage.css'
import '../IA/ia.css'
import './EstudiantePage.css'

type EstudiantePageProps = {
  theme: 'dark' | 'light'
  userProfile: AuthUserProfile | null
  onBack: () => void
  onProfile: () => void
  onToggleTheme: () => void
}

type StudentView = 'projects' | 'diagrammer'
type FeatureTab = 'attributes' | 'methods'

const memberRoleOptions = [
  {
    id: 2,
    label: 'Propietario',
  },
  {
    id: 3,
    label: 'Editor',
  },
  {
    id: 4,
    label: 'Visualizador',
  },
]

const emptyContent: DiagramContent = {
  nodes: [],
  edges: [],
}

const standardClassWidth = 245
const standardClassHeight = 180

function formatDate(value?: string | null) {
  if (!value) {
    return 'Sin fecha'
  }

  return new Date(value).toLocaleDateString('es-BO', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

function getMemberRoleName(roleId: number) {
  return memberRoleOptions.find((role) => role.id === roleId)?.label ?? 'Sin rol'
}

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

function parseMethodParameters(value: string) {
  return value
    .split(',')
    .map((parameter) => parameter.trim())
    .filter(Boolean)
    .map((name) => ({ name }))
}

function formatMethodParameters(parameters: unknown) {
  return normalizeMethodParameters(parameters).join(', ')
}

function getCollaboratorError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 403) {
    return 'No tienes permiso para gestionar colaboradores'
  }

  return error instanceof Error ? error.message : fallback
}

function getProjectActionError(error: unknown, fallback: string) {
  if (error instanceof ApiError && error.status === 403) {
    return 'No tienes permiso para editar este proyecto.'
  }

  return error instanceof Error ? error.message : fallback
}

function normalizeContent(content?: DiagramContent | null) {
  return content ?? emptyContent
}

function toFlowNodes(nodes: DiagramNode[]): ClassFlowNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: 'classNode',
    position: node.position,
    style: {
      ...node.style,
      width: Math.max(Number(node.style?.width ?? standardClassWidth), standardClassWidth),
      height: Math.max(Number(node.style?.height ?? standardClassHeight), standardClassHeight),
    },
    data: {
      ...node.data,
      name: node.data.name,
      attributes: node.data.attributes as ClassAttribute[],
      methods: node.data.methods as ClassMethod[],
    },
  }))
}

function toFlowEdges(edges: DiagramEdge[]): ClassFlowEdge[] {
  return edges.map((edge) => {
    const relationType = normalizeRelationType(edge.data?.relationType)

    return {
      id: edge.id,
      source: edge.source,
      target: edge.target,
      data: {
        ...edge.data,
        id: edge.id,
        sourceClassId: edge.source,
        targetClassId: edge.target,
        relationType,
        sourceCardinality: normalizeCardinality(edge.data?.sourceCardinality),
        targetCardinality: normalizeCardinality(edge.data?.targetCardinality),
        createdAt: String(edge.data?.createdAt ?? new Date().toISOString()),
      },
      ...getRelationEdgeProps(relationType),
    }
  })
}

function toDiagramContent(nodes: ClassFlowNode[], edges: ClassFlowEdge[]): DiagramContent {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: 'classNode',
      position: node.position,
      style: {
        width: Math.max(Number(node.style?.width ?? node.width ?? standardClassWidth), standardClassWidth),
        height: Math.max(Number(node.style?.height ?? node.height ?? standardClassHeight), standardClassHeight),
      },
      data: {
        ...node.data,
        name: node.data.name,
        attributes: node.data.attributes,
        methods: node.data.methods,
      },
    })),
    edges: edges.map((edge) => {
      const currentData = getEdgeData(edge)
      const { cardinality: _legacyCardinality, ...relationData } = currentData

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'umlRelation',
        data: {
          ...relationData,
          sourceClassId: edge.source,
          targetClassId: edge.target,
          sourceCardinality: normalizeCardinality(currentData.sourceCardinality),
          targetCardinality: normalizeCardinality(currentData.targetCardinality),
        },
      }
    }),
  }
}

function getEdgeData(edge: ClassFlowEdge): UmlRelationData {
  const relationType = normalizeRelationType(edge.data?.relationType)

  return {
    ...edge.data,
    id: edge.data?.id ?? edge.id,
    sourceClassId: edge.data?.sourceClassId ?? edge.source,
    targetClassId: edge.data?.targetClassId ?? edge.target,
    relationType,
    sourceCardinality: normalizeCardinality(edge.data?.sourceCardinality),
    targetCardinality: normalizeCardinality(edge.data?.targetCardinality),
    createdAt: edge.data?.createdAt ?? new Date().toISOString(),
  }
}

function getAssociationClassName(sourceName: string, targetName: string) {
  return `${sourceName}${targetName}`
    .replace(/[^a-zA-Z0-9]/g, ' ')
    .split(' ')
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join('')
}

function createAssociationClassNode(
  relationId: string,
  sourceClassId: string,
  targetClassId: string,
  currentNodes: ClassFlowNode[],
): ClassFlowNode | null {
  const source = currentNodes.find((node) => node.id === sourceClassId)
  const target = currentNodes.find((node) => node.id === targetClassId)

  if (!source || !target) {
    return null
  }

  const associationClassId = `assoc-class-${relationId}`
  const sourceName = source.data.name || 'Origen'
  const targetName = target.data.name || 'Destino'

  return {
    id: associationClassId,
    type: 'classNode',
    position: {
      x: (source.position.x + target.position.x) / 2,
      y: Math.min(source.position.y, target.position.y) - 170,
    },
    data: {
      name: getAssociationClassName(sourceName, targetName) || 'AssociationClass',
      attributes: [],
      methods: [],
    },
  }
}

function buildRelationData({
  associationClassId,
  createdAt,
  createdBy,
  relationId,
  relationType,
  sourceClassId,
  sourceCardinality = '1..*',
  targetClassId,
  targetCardinality = '1',
}: {
  associationClassId?: string
  createdAt?: string
  createdBy?: string
  relationId: string
  relationType: RelationType
  sourceClassId: string
  sourceCardinality?: Cardinality
  targetClassId: string
  targetCardinality?: Cardinality
}): UmlRelationData {
  const semanticData =
    relationType === 'generalization'
      ? {
          childClassId: sourceClassId,
          parentClassId: targetClassId,
        }
      : relationType === 'composition' || relationType === 'aggregation'
        ? {
            wholeClassId: sourceClassId,
            partClassId: targetClassId,
          }
        : {}

  return {
    id: relationId,
    sourceClassId,
    targetClassId,
    relationType,
    sourceCardinality,
    targetCardinality,
    associationClassId,
    createdBy,
    createdAt: createdAt ?? new Date().toISOString(),
    ...semanticData,
  }
}

function getRecursiveHandles(sourceHandle?: string | null, targetHandle?: string | null) {
  if (sourceHandle && targetHandle && sourceHandle !== targetHandle) {
    return {
      sourceHandle,
      targetHandle,
    }
  }

  return {
    sourceHandle: 'right',
    targetHandle: 'top',
  }
}

export function EstudiantePage({
  theme,
  userProfile,
  onBack,
  onProfile,
  onToggleTheme,
}: EstudiantePageProps) {
  const [view, setView] = useState<StudentView>('projects')
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [diagramas, setDiagramas] = useState<DiagramaResponse[]>([])
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null)
  const [selectedDiagrama, setSelectedDiagrama] = useState<DiagramaResponse | null>(null)
  const [miembros, setMiembros] = useState<ProyectoMiembro[]>([])
  const [memberRoleDrafts, setMemberRoleDrafts] = useState<Record<string, number>>({})
  const [newMemberEmail, setNewMemberEmail] = useState('')
  const [newMemberRole, setNewMemberRole] = useState(3)
  const [nodes, setNodes, onNodesChange] = useNodesState<ClassFlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<ClassFlowEdge>([])
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const [selectedEdgeId, setSelectedEdgeId] = useState('')
  const [diagramName, setDiagramName] = useState('')
  const [newDiagramName, setNewDiagramName] = useState('Diagrama principal')
  const [newClassName, setNewClassName] = useState('Cliente')
  const [newAttributeName, setNewAttributeName] = useState('id')
  const [newAttributeType, setNewAttributeType] = useState('BIGINT')
  const [newMethodName, setNewMethodName] = useState('registrar')
  const [newMethodParameters, setNewMethodParameters] = useState('')
  const [newMethodReturnType, setNewMethodReturnType] = useState('void')
  const [newProjectName, setNewProjectName] = useState('Mi nuevo proyecto')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [featureTab, setFeatureTab] = useState<FeatureTab>('attributes')
  const [selectedRelationType, setSelectedRelationType] = useState<RelationType>('association')
  const [relationSourceId, setRelationSourceId] = useState('')
  const [relationTargetId, setRelationTargetId] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isMembersLoading, setIsMembersLoading] = useState(false)
  const [isMembersSaving, setIsMembersSaving] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [isCreateClassOpen, setIsCreateClassOpen] = useState(false)
  const [isRelationToolboxOpen, setIsRelationToolboxOpen] = useState(true)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [membersMessage, setMembersMessage] = useState('')
  const [membersError, setMembersError] = useState('')
  const setDiagramState = useDiagramStore((state) => state.setDiagramState)
  const addStoredRelation = useDiagramStore((state) => state.addRelation)
  const updateStoredRelation = useDiagramStore((state) => state.updateRelation)
  const removeStoredRelation = useDiagramStore((state) => state.removeRelation)
  const setStoredSelectedRelationId = useDiagramStore((state) => state.setSelectedRelationId)

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )
  const miembroActual = useMemo(
    () => miembros.find((miembro) => miembro.usuario_codigo === userProfile?.codigo) ?? null,
    [miembros, userProfile?.codigo],
  )
  const canEditDiagram = miembroActual?.id_rol === 2 || miembroActual?.id_rol === 3
  const canManageMembers = miembroActual?.id_rol === 2
  const canViewOnly = miembroActual?.id_rol === 4

  function denyDiagramEdit() {
    setError('No tienes permiso para editar este diagrama.')
  }

  function denyMemberManagement() {
    setMembersError('No tienes permiso para gestionar colaboradores')
  }

  useEffect(() => {
    if (nodes.length === 0) {
      setRelationSourceId('')
      setRelationTargetId('')
      return
    }

    setRelationSourceId((current) => current || nodes[0].id)
    setRelationTargetId((current) => current || nodes[1]?.id || nodes[0].id)
  }, [nodes])

  const loadProyectos = useCallback(async () => {
    if (!userProfile?.codigo) {
      setError('No se encontro el codigo del usuario en la sesion.')
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const data = await listarProyectosPorUsuario(userProfile.codigo)
      setProyectos(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar tus proyectos')
    } finally {
      setIsLoading(false)
    }
  }, [userProfile?.codigo])

  const loadMiembros = useCallback(async (proyectoId: number) => {
    setIsMembersLoading(true)
    setMembersError('')

    try {
      const data = await listarMiembros(proyectoId)

      setMiembros(data)
      setMemberRoleDrafts(
        data.reduce<Record<string, number>>((drafts, miembro) => {
          drafts[miembro.usuario_codigo] = miembro.id_rol
          return drafts
        }, {}),
      )
    } catch (loadError) {
      setMembersError(getCollaboratorError(loadError, 'No se pudieron cargar los colaboradores'))
    } finally {
      setIsMembersLoading(false)
    }
  }, [])

  async function openCollaborators(proyecto: Proyecto) {
    setSelectedProyecto(proyecto)
    setSelectedDiagrama(null)
    setNodes([])
    setEdges([])
    setDiagramas([])
    setSelectedNodeId('')
    setSelectedEdgeId('')
    setStoredSelectedRelationId('')
    setMembersMessage('')
    setMembersError('')
    await loadMiembros(proyecto.id)
  }

  async function openProyecto(proyecto: Proyecto) {
    setSelectedProyecto(proyecto)
    setSelectedDiagrama(null)
    setMiembros([])
    setMemberRoleDrafts({})
    setNewMemberEmail('')
    setNewMemberRole(3)
    setNodes([])
    setEdges([])
    setDiagramas([])
    setSelectedNodeId('')
    setView('diagrammer')
    setMessage('')
    setError('')
    setMembersMessage('')
    setMembersError('')

    try {
      const [data] = await Promise.all([
        listarDiagramasPorProyecto(proyecto.id),
        loadMiembros(proyecto.id),
      ])
      setDiagramas(data)

      if (data.length > 0) {
        await openDiagrama(data[0].id)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los diagramas')
    }
  }

  async function addMiembro() {
    const usuarioEmail = newMemberEmail.trim().toLowerCase()

    if (!selectedProyecto) {
      setMembersError('Abre un proyecto antes de agregar colaboradores.')
      return
    }

    if (!canManageMembers) {
      denyMemberManagement()
      return
    }

    if (!usuarioEmail) {
      setMembersError('Escribe el correo electronico del usuario.')
      return
    }

    if (!usuarioEmail.includes('@')) {
      setMembersError('Escribe un correo electronico valido.')
      return
    }

    setIsMembersSaving(true)
    setMembersError('')
    setMembersMessage('')

    try {
      const usuarios = await listarUsuarios()
      const usuario = usuarios.find((item) => item.email.trim().toLowerCase() === usuarioEmail)

      if (!usuario) {
        setMembersError('No se encontro un usuario registrado con ese correo.')
        return
      }

      await agregarMiembro(selectedProyecto.id, {
        usuario_codigo: usuario.codigo,
        id_rol: newMemberRole,
      })
      setNewMemberEmail('')
      setNewMemberRole(3)
      setMembersMessage('Colaborador agregado.')
      await loadMiembros(selectedProyecto.id)
    } catch (memberError) {
      setMembersError(getCollaboratorError(memberError, 'No se pudo agregar el colaborador'))
    } finally {
      setIsMembersSaving(false)
    }
  }

  async function saveMemberRole(miembro: ProyectoMiembro) {
    if (!selectedProyecto) {
      return
    }

    if (!canManageMembers) {
      denyMemberManagement()
      return
    }

    const nextRole = memberRoleDrafts[miembro.usuario_codigo]

    if (!nextRole) {
      setMembersError('Selecciona un rol valido.')
      return
    }

    setIsMembersSaving(true)
    setMembersError('')
    setMembersMessage('')

    try {
      await actualizarMiembro(selectedProyecto.id, miembro.usuario_codigo, {
        id_rol: nextRole,
      })
      setMembersMessage('Rol actualizado.')
      await loadMiembros(selectedProyecto.id)
    } catch (memberError) {
      setMembersError(getCollaboratorError(memberError, 'No se pudo actualizar el rol'))
    } finally {
      setIsMembersSaving(false)
    }
  }

  async function removeMiembro(miembro: ProyectoMiembro) {
    if (!selectedProyecto) {
      return
    }

    if (!canManageMembers) {
      denyMemberManagement()
      return
    }

    const confirmed = window.confirm(`Quitar al colaborador ${miembro.usuario_codigo} de este proyecto?`)

    if (!confirmed) {
      return
    }

    setIsMembersSaving(true)
    setMembersError('')
    setMembersMessage('')

    try {
      await quitarMiembro(selectedProyecto.id, miembro.usuario_codigo)
      setMembersMessage('Colaborador quitado.')
      await loadMiembros(selectedProyecto.id)
    } catch (memberError) {
      setMembersError(getCollaboratorError(memberError, 'No se pudo quitar el colaborador'))
    } finally {
      setIsMembersSaving(false)
    }
  }

  async function openDiagrama(diagramaId: number) {
    setError('')
    setMessage('')

    try {
      const diagrama = await abrirDiagrama(diagramaId)
      const content = normalizeContent(diagrama.contenido)

      setSelectedDiagrama(diagrama)
      setDiagramName(diagrama.nombre)
      const nextNodes = toFlowNodes(content.nodes)
      const nextEdges = toFlowEdges(content.edges)

      setNodes(nextNodes)
      setEdges(nextEdges)
      setDiagramState(nextNodes, nextEdges)
      setSelectedNodeId('')
      setSelectedEdgeId('')
      setStoredSelectedRelationId('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo abrir el diagrama')
    }
  }

  function handleAiDiagramUpdated(diagrama: DiagramaResponse) {
    const content = normalizeContent(diagrama.contenido)
    const nextNodes = toFlowNodes(content.nodes)
    const nextEdges = toFlowEdges(content.edges)

    setSelectedDiagrama(diagrama)
    setDiagramName(diagrama.nombre)
    setNodes(nextNodes)
    setEdges(nextEdges)
    setDiagramState(nextNodes, nextEdges)
    setDiagramas((current) =>
      current.map((currentDiagrama) => (currentDiagrama.id === diagrama.id ? diagrama : currentDiagrama)),
    )
    setSelectedNodeId('')
    setSelectedEdgeId('')
    setStoredSelectedRelationId('')
    setMessage('El agente IA actualizo el diagrama.')
  }

  async function createProyecto() {
    if (!userProfile?.codigo) {
      setError('No se encontro el codigo del usuario en la sesion.')
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const proyecto = await crearProyecto({
        nombre: newProjectName,
        descripcion: newProjectDescription,
        usuario_codigo: userProfile.codigo,
        id_rol: 2,
      })

      setProyectos((current) => [proyecto, ...current])
      setNewProjectName('Mi nuevo proyecto')
      setNewProjectDescription('')
      await openProyecto(proyecto)
      setMessage('Proyecto creado correctamente.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo crear el proyecto')
    } finally {
      setIsSaving(false)
    }
  }

  async function createDiagrama() {
    if (!selectedProyecto) {
      setError('Selecciona un proyecto antes de crear un diagrama.')
      return
    }

    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const diagrama = await crearDiagrama({
        id_proyecto: selectedProyecto.id,
        nombre: newDiagramName,
        contenido: emptyContent,
      })

      setDiagramas((current) => [diagrama, ...current])
      setNewDiagramName('Diagrama principal')
      await openDiagrama(diagrama.id)
      setMessage('Diagrama creado correctamente.')
    } catch (saveError) {
      setError(getProjectActionError(saveError, 'No se pudo crear el diagrama'))
    } finally {
      setIsSaving(false)
    }
  }

  async function addClass() {
    if (!selectedDiagrama) {
      setError('Crea o abre un diagrama antes de agregar clases.')
      return
    }

    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const hasAttribute = newAttributeName.trim().length > 0
      const diagrama = await agregarClase(selectedDiagrama.id, {
        name: newClassName,
        x: 120 + nodes.length * 44,
        y: 110 + nodes.length * 34,
        attributes: hasAttribute
          ? [
              {
                name: newAttributeName,
                type: newAttributeType,
                primaryKey: newAttributeName.toLowerCase() === 'id',
                nullable: false,
              },
            ]
          : [],
        methods: [],
        autor_codigo: userProfile?.codigo,
      })

      const content = normalizeContent(diagrama.contenido)
      const nextNodes = toFlowNodes(content.nodes)
      const nextEdges = toFlowEdges(content.edges)

      setSelectedDiagrama(diagrama)
      setNodes(nextNodes)
      setEdges(nextEdges)
      setDiagramState(nextNodes, nextEdges)
      setNewClassName('Cliente')
      setNewAttributeName('id')
      setNewAttributeType('BIGINT')
      setIsCreateClassOpen(false)
      setMessage('Clase agregada al diagrama.')
    } catch (saveError) {
      setError(getProjectActionError(saveError, 'No se pudo agregar la clase'))
    } finally {
      setIsSaving(false)
    }
  }

  async function saveSelectedClass(nextData: ClassNodeData) {
    if (!selectedDiagrama || !selectedNode) {
      return
    }

    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    const nextNodes = nodes.map((node) =>
      node.id === selectedNode.id
        ? {
            ...node,
            data: nextData,
          }
        : node,
    )

    await saveDiagrama(nextNodes, edges)
    setSelectedNodeId(selectedNode.id)
  }

  async function saveDiagrama(nextNodes = nodes, nextEdges = edges) {
    if (!selectedDiagrama) {
      return
    }

    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const diagrama = await guardarDiagrama(selectedDiagrama.id, {
        nombre: diagramName,
        contenido: toDiagramContent(nextNodes, nextEdges),
        autor_codigo: userProfile?.codigo,
      })
      const content = normalizeContent(diagrama.contenido)
      const persistedNodes = toFlowNodes(content.nodes)
      const persistedEdges = toFlowEdges(content.edges)

      setSelectedDiagrama(diagrama)
      setNodes(persistedNodes)
      setEdges(persistedEdges)
      setDiagramState(persistedNodes, persistedEdges)
      setDiagramas((current) => current.map((item) => (item.id === diagrama.id ? diagrama : item)))
      setMessage('Diagrama guardado correctamente.')
    } catch (saveError) {
      setError(getProjectActionError(saveError, 'No se pudo guardar el diagrama'))
    } finally {
      setIsSaving(false)
    }
  }

  const connectNodes: OnConnect = async (connection: Connection) => {
    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    if (!connection.source || !connection.target) {
      setError('Selecciona una clase origen y una clase destino para crear la relacion.')
      return
    }

    const isRecursiveRelation = connection.source === connection.target
    const recursiveHandles = isRecursiveRelation
      ? getRecursiveHandles(connection.sourceHandle, connection.targetHandle)
      : {
          sourceHandle: connection.sourceHandle,
          targetHandle: connection.targetHandle,
        }
    const relationId = `rel-${connection.source}-${connection.target}-${Date.now()}`
    const validation = validateRelation(
      {
        id: relationId,
        sourceClassId: connection.source,
        targetClassId: connection.target,
        sourceHandle: recursiveHandles.sourceHandle,
        targetHandle: recursiveHandles.targetHandle,
        relationType: selectedRelationType,
        sourceCardinality: '1..*',
        targetCardinality: '1',
        createdBy: userProfile?.codigo,
      },
      nodes,
      edges,
    )

    if (!validation.valid) {
      setError(validation.message ?? 'La relacion no es valida.')
      return
    }

    const associationClassNode =
      selectedRelationType === 'associationClass'
        ? createAssociationClassNode(relationId, connection.source, connection.target, nodes)
        : null
    const nextNodes = associationClassNode ? [...nodes, associationClassNode] : nodes

    const nextEdges = addEdge(
      {
        ...connection,
        sourceHandle: recursiveHandles.sourceHandle,
        targetHandle: recursiveHandles.targetHandle,
        id: relationId,
        data: buildRelationData({
          associationClassId: associationClassNode?.id,
          createdBy: userProfile?.codigo,
          relationId,
          relationType: selectedRelationType,
          sourceClassId: connection.source,
          sourceCardinality: '1..*',
          targetClassId: connection.target,
          targetCardinality: '1',
        }),
        ...getRelationEdgeProps(selectedRelationType),
      },
      edges,
    )

    setNodes(nextNodes)
    setEdges(nextEdges)
    setDiagramState(nextNodes, nextEdges)
    setSelectedEdgeId(nextEdges.at(-1)?.id ?? '')
    setStoredSelectedRelationId(nextEdges.at(-1)?.id ?? '')
    addStoredRelation(nextEdges.at(-1) as ClassFlowEdge, createDiagramEvent('RELATION_CREATED', relationId, userProfile?.codigo))
    setMessage(
      selectedRelationType === 'associationClass'
        ? 'Relacion creada con clase intermedia.'
        : 'Relacion creada y guardada.',
    )
    await saveDiagrama(nextNodes, nextEdges)
  }

  async function createRelationFromPanel() {
    if (!selectedDiagrama) {
      setError('Abre un diagrama antes de crear relaciones.')
      return
    }

    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    if (!relationSourceId || !relationTargetId) {
      setError('Selecciona una clase origen y una clase destino.')
      return
    }

    const isRecursiveRelation = relationSourceId === relationTargetId
    const recursiveHandles = isRecursiveRelation
      ? getRecursiveHandles()
      : {
          sourceHandle: undefined,
          targetHandle: undefined,
        }
    const relationId = `rel-${relationSourceId}-${relationTargetId}-${Date.now()}`
    const validation = validateRelation(
      {
        id: relationId,
        sourceClassId: relationSourceId,
        targetClassId: relationTargetId,
        relationType: selectedRelationType,
        sourceCardinality: '1..*',
        targetCardinality: '1',
        createdBy: userProfile?.codigo,
      },
      nodes,
      edges,
    )

    if (!validation.valid) {
      setError(validation.message ?? 'La relacion no es valida.')
      return
    }

    const associationClassNode =
      selectedRelationType === 'associationClass'
        ? createAssociationClassNode(relationId, relationSourceId, relationTargetId, nodes)
        : null
    const nextNodes = associationClassNode ? [...nodes, associationClassNode] : nodes

    const nextEdge: ClassFlowEdge = {
      id: relationId,
      source: relationSourceId,
      target: relationTargetId,
      sourceHandle: recursiveHandles.sourceHandle,
      targetHandle: recursiveHandles.targetHandle,
      data: buildRelationData({
        associationClassId: associationClassNode?.id,
        createdBy: userProfile?.codigo,
        relationId,
        relationType: selectedRelationType,
        sourceClassId: relationSourceId,
        sourceCardinality: '1..*',
        targetClassId: relationTargetId,
        targetCardinality: '1',
      }),
      ...getRelationEdgeProps(selectedRelationType),
    }

    const nextEdges = [...edges, nextEdge]

    setNodes(nextNodes)
    setEdges(nextEdges)
    setDiagramState(nextNodes, nextEdges)
    setSelectedEdgeId(nextEdge.id)
    setStoredSelectedRelationId(nextEdge.id)
    addStoredRelation(nextEdge, createDiagramEvent('RELATION_CREATED', nextEdge.id, userProfile?.codigo))
    setSelectedNodeId('')
    setMessage(
      selectedRelationType === 'associationClass'
        ? 'Relacion creada con clase intermedia.'
        : 'Relacion creada y guardada.',
    )
    await saveDiagrama(nextNodes, nextEdges)
  }

  function updateSelectedClassDraft(nextData: ClassNodeData) {
    if (!selectedNode) {
      return
    }

    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    setNodes((current) =>
      current.map((node) =>
        node.id === selectedNode.id
          ? {
              ...node,
              data: nextData,
            }
          : node,
      ),
    )
  }

  async function removeSelectedClass() {
    if (!selectedNode) {
      return
    }

    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    const relatedEdges = edges.filter(
      (edge) =>
        edge.source === selectedNode.id ||
        edge.target === selectedNode.id ||
        edge.data?.associationClassId === selectedNode.id,
    )
    const associationClassIdsToRemove = new Set(
      relatedEdges
        .map((edge) => edge.data?.associationClassId)
        .filter((associationClassId): associationClassId is string => typeof associationClassId === 'string'),
    )
    const nextNodes = nodes.filter(
      (node) => node.id !== selectedNode.id && !associationClassIdsToRemove.has(node.id),
    )
    const nextEdges = edges.filter(
      (edge) =>
        edge.source !== selectedNode.id &&
        edge.target !== selectedNode.id &&
        edge.data?.associationClassId !== selectedNode.id,
    )

    setSelectedNodeId('')
    setSelectedEdgeId('')
    setStoredSelectedRelationId('')
    setNodes(nextNodes)
    setEdges(nextEdges)
    setDiagramState(nextNodes, nextEdges)
    await saveDiagrama(nextNodes, nextEdges)
  }

  const removeSelectedClassRef = useRef(removeSelectedClass)

  useEffect(() => {
    removeSelectedClassRef.current = removeSelectedClass
  })

  useEffect(() => {
    function isWritingInField(target: EventTarget | null) {
      if (!(target instanceof HTMLElement)) {
        return false
      }

      const tagName = target.tagName.toLowerCase()

      return tagName === 'input' || tagName === 'textarea' || tagName === 'select' || target.isContentEditable
    }

    function handleDeleteSelectedClass(event: KeyboardEvent) {
      if (event.key !== 'Delete' || event.ctrlKey || event.metaKey || event.altKey || event.shiftKey) {
        return
      }

      if (!selectedNode || isSaving || isWritingInField(event.target)) {
        return
      }

      event.preventDefault()
      void removeSelectedClassRef.current()
    }

    window.addEventListener('keydown', handleDeleteSelectedClass)

    return () => {
      window.removeEventListener('keydown', handleDeleteSelectedClass)
    }
  }, [isSaving, selectedNode])

  function updateSelectedAttribute(
    attributeIndex: number,
    field: 'name' | 'type' | 'primaryKey' | 'nullable',
    value: string | boolean,
  ) {
    if (!selectedNode) {
      return
    }

    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    updateSelectedClassDraft({
      ...selectedNode.data,
      attributes: selectedNode.data.attributes.map((attribute, index) =>
        index === attributeIndex
          ? {
              ...attribute,
              [field]: value,
            }
          : attribute,
      ),
    })
  }

  function updateSelectedMethod(methodIndex: number, field: 'name' | 'returnType' | 'parameters', value: string) {
    if (!selectedNode) {
      return
    }

    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    updateSelectedClassDraft({
      ...selectedNode.data,
      methods: selectedNode.data.methods.map((method, index) =>
        index === methodIndex
          ? {
              ...method,
              [field]: field === 'parameters' ? parseMethodParameters(value) : value,
            }
          : method,
      ),
    })
  }

  async function removeAttributeFromSelectedClass(attributeIndex: number) {
    if (!selectedNode) {
      return
    }

    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    await saveSelectedClass({
      ...selectedNode.data,
      attributes: selectedNode.data.attributes.filter((_attribute, index) => index !== attributeIndex),
    })
  }

  async function removeMethodFromSelectedClass(methodIndex: number) {
    if (!selectedNode) {
      return
    }

    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    await saveSelectedClass({
      ...selectedNode.data,
      methods: selectedNode.data.methods.filter((_method, index) => index !== methodIndex),
    })
  }

  function getClassNameById(nodeId: string) {
    return nodes.find((node) => node.id === nodeId)?.data.name ?? nodeId
  }

  async function updateRelation(edgeId: string, relationType: RelationType) {
    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    const relation = edges.find((edge) => edge.id === edgeId)

    if (!relation) {
      return
    }

    let nextNodes = nodes
    const currentData = getEdgeData(relation)
    const associationClassNode =
      relationType === 'associationClass' && !currentData.associationClassId
        ? createAssociationClassNode(relation.id, relation.source, relation.target, nodes)
        : null
    const associationClassId =
      relationType === 'associationClass'
        ? currentData.associationClassId ?? associationClassNode?.id
        : undefined
    const validation = validateRelation(
      {
        id: edgeId,
        sourceClassId: relation.source,
        targetClassId: relation.target,
        relationType,
        sourceCardinality: currentData.sourceCardinality,
        targetCardinality: currentData.targetCardinality,
        associationClassId,
        createdBy: userProfile?.codigo,
      },
      associationClassNode ? [...nodes, associationClassNode] : nodes,
      edges,
    )

    if (!validation.valid) {
      setError(validation.message ?? 'La relacion no es valida.')
      return
    }

    const nextEdges: ClassFlowEdge[] = edges.map((edge) => {
      if (edge.id !== edgeId) {
        return edge
      }

      if (associationClassNode) {
        nextNodes = [...nextNodes, associationClassNode]
      }

      if (currentData.associationClassId && relationType !== 'associationClass') {
        nextNodes = nextNodes.filter((node) => node.id !== currentData.associationClassId)
      }

      const nextData = buildRelationData({
        associationClassId,
        createdAt: currentData.createdAt,
        createdBy: currentData.createdBy ?? userProfile?.codigo,
        relationId: edge.id,
        relationType,
        sourceClassId: edge.source,
        sourceCardinality: currentData.sourceCardinality,
        targetClassId: edge.target,
        targetCardinality: currentData.targetCardinality,
      })

      return {
        ...edge,
        data: nextData,
        ...getRelationEdgeProps(relationType),
      }
    })
    const updatedRelation = nextEdges.find((edge) => edge.id === edgeId)

    setNodes(nextNodes)
    setEdges(nextEdges)
    setDiagramState(nextNodes, nextEdges)
    setSelectedEdgeId(edgeId)
    if (updatedRelation) {
      updateStoredRelation(
        edgeId,
        updatedRelation,
        createDiagramEvent('RELATION_UPDATED', edgeId, userProfile?.codigo, { relationType }),
      )
    }
    await saveDiagrama(nextNodes, nextEdges)
  }

  async function updateRelationCardinality(
    edgeId: string,
    field: 'sourceCardinality' | 'targetCardinality',
    value: string,
  ) {
    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    const nextEdges: ClassFlowEdge[] = edges.map((edge) => {
      if (edge.id !== edgeId) {
        return edge
      }

      const currentData = getEdgeData(edge)
      const nextData = {
        ...currentData,
        [field]: value as Cardinality,
      }

      return {
        ...edge,
        data: nextData,
      }
    })
    const updatedRelation = nextEdges.find((edge) => edge.id === edgeId)

    setEdges(nextEdges)
    setSelectedEdgeId(edgeId)
    if (updatedRelation) {
      updateStoredRelation(
        edgeId,
        updatedRelation,
        createDiagramEvent('RELATION_UPDATED', edgeId, userProfile?.codigo, { [field]: value }),
      )
    }
    await saveDiagrama(nodes, nextEdges)
  }

  async function invertRelationDirection(edgeId: string) {
    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    const relation = edges.find((edge) => edge.id === edgeId)

    if (!relation) {
      return
    }

    const currentData = getEdgeData(relation)
    const validation = validateRelation(
      {
        id: edgeId,
        sourceClassId: relation.target,
        targetClassId: relation.source,
        relationType: currentData.relationType,
        sourceCardinality: currentData.targetCardinality,
        targetCardinality: currentData.sourceCardinality,
        associationClassId: currentData.associationClassId,
        templateBindings: currentData.templateBindings,
        createdBy: userProfile?.codigo,
      },
      nodes,
      edges,
    )

    if (!validation.valid) {
      setError(validation.message ?? 'No se puede invertir esta relacion.')
      return
    }

    const nextEdges: ClassFlowEdge[] = edges.map((edge) => {
      if (edge.id !== edgeId) {
        return edge
      }

      const nextData = {
        ...buildRelationData({
          associationClassId: currentData.associationClassId,
          createdAt: currentData.createdAt,
          createdBy: currentData.createdBy ?? userProfile?.codigo,
          relationId: edge.id,
          relationType: currentData.relationType,
          sourceClassId: edge.target,
          sourceCardinality: currentData.targetCardinality,
          targetClassId: edge.source,
          targetCardinality: currentData.sourceCardinality,
        }),
        sourceClassId: edge.target,
        targetClassId: edge.source,
        sourceRole: currentData.targetRole,
        targetRole: currentData.sourceRole,
        navigableSource: currentData.navigableTarget,
        navigableTarget: currentData.navigableSource,
        templateBindings: currentData.templateBindings,
      }

      return {
        ...edge,
        source: edge.target,
        target: edge.source,
        sourceHandle: edge.targetHandle,
        targetHandle: edge.sourceHandle,
        data: nextData,
      }
    })
    const updatedRelation = nextEdges.find((edge) => edge.id === edgeId)

    setEdges(nextEdges)
    setSelectedEdgeId(edgeId)
    if (updatedRelation) {
      updateStoredRelation(
        edgeId,
        updatedRelation,
        createDiagramEvent('RELATION_UPDATED', edgeId, userProfile?.codigo, { direction: 'inverted' }),
      )
    }
    await saveDiagrama(nodes, nextEdges)
  }

  async function removeRelation(edgeId: string) {
    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    const relation = edges.find((edge) => edge.id === edgeId)
    const associationClassId = relation?.data?.associationClassId
    const nextNodes =
      typeof associationClassId === 'string' ? nodes.filter((node) => node.id !== associationClassId) : nodes
    const nextEdges = edges.filter((edge) => edge.id !== edgeId)

    setNodes(nextNodes)
    setEdges(nextEdges)
    setDiagramState(nextNodes, nextEdges)
    setSelectedEdgeId('')
    setStoredSelectedRelationId('')
    removeStoredRelation(edgeId, createDiagramEvent('RELATION_DELETED', edgeId, userProfile?.codigo))
    await saveDiagrama(nextNodes, nextEdges)
  }

  const saveNodePosition: OnNodeDrag<ClassFlowNode> = async (_event, node) => {
    if (!selectedDiagrama) {
      return
    }

    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    try {
      const diagrama = await moverClase(selectedDiagrama.id, node.id, {
        x: node.position.x,
        y: node.position.y,
        autor_codigo: userProfile?.codigo,
      })
      const content = normalizeContent(diagrama.contenido)
      const nextNodes = toFlowNodes(content.nodes)
      const nextEdges = toFlowEdges(content.edges)

      setSelectedDiagrama(diagrama)
      setNodes(nextNodes)
      setEdges(nextEdges)
      setDiagramState(nextNodes, nextEdges)
      setDiagramas((current) => current.map((item) => (item.id === diagrama.id ? diagrama : item)))
    } catch (moveError) {
      setError(getProjectActionError(moveError, 'No se pudo mover la clase'))
    }
  }

  async function addAttributeToSelectedClass() {
    if (!selectedNode || !newAttributeName.trim()) {
      return
    }

    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    await saveSelectedClass({
      ...selectedNode.data,
      attributes: [
        ...selectedNode.data.attributes,
        {
          name: newAttributeName,
          type: newAttributeType,
          primaryKey: newAttributeName.toLowerCase() === 'id',
          nullable: false,
        },
      ],
    })
    setNewAttributeName('id')
    setNewAttributeType('BIGINT')
  }

  async function addMethodToSelectedClass() {
    if (!selectedNode || !newMethodName.trim()) {
      return
    }

    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    await saveSelectedClass({
      ...selectedNode.data,
      methods: [
        ...selectedNode.data.methods,
        {
          name: newMethodName,
          parameters: parseMethodParameters(newMethodParameters),
          returnType: newMethodReturnType,
        },
      ],
    })
    setNewMethodName('registrar')
    setNewMethodParameters('')
    setNewMethodReturnType('void')
  }

  async function removeDiagrama(diagrama: DiagramaResponse) {
    if (!canEditDiagram) {
      denyDiagramEdit()
      return
    }

    const confirmed = window.confirm(`Eliminar diagrama "${diagrama.nombre}"?`)

    if (!confirmed) {
      return
    }

    setError('')
    setMessage('')

    try {
      await eliminarDiagrama(diagrama.id)
      setDiagramas((current) => current.filter((item) => item.id !== diagrama.id))

      if (selectedDiagrama?.id === diagrama.id) {
        setSelectedDiagrama(null)
        setNodes([])
        setEdges([])
        setSelectedNodeId('')
        setSelectedEdgeId('')
        setStoredSelectedRelationId('')
      }

      setMessage('Diagrama eliminado correctamente.')
    } catch (deleteError) {
      setError(getProjectActionError(deleteError, 'No se pudo eliminar el diagrama'))
    }
  }

  function backToProjects() {
    setView('projects')
    setSelectedProyecto(null)
    setSelectedDiagrama(null)
    setNodes([])
    setEdges([])
    setDiagramas([])
    setSelectedNodeId('')
    setSelectedEdgeId('')
    setStoredSelectedRelationId('')
    setMessage('')
    setError('')
  }

  useEffect(() => {
    loadProyectos()
  }, [loadProyectos])

  return (
    <main
      className={`users-page student-page ${theme === 'light' ? 'users-page-light' : ''} ${
        isSidebarCollapsed ? 'student-sidebar-collapsed' : ''
      }`}
    >
      <aside className="admin-sidebar student-sidebar" aria-label="Navegacion de estudiante">
        <button
          aria-label={isSidebarCollapsed ? 'Abrir barra lateral' : 'Cerrar barra lateral'}
          className="student-sidebar-toggle"
          onClick={() => setIsSidebarCollapsed((current) => !current)}
          title={isSidebarCollapsed ? 'Abrir barra lateral' : 'Cerrar barra lateral'}
          type="button"
        >
          {isSidebarCollapsed ? <PanelLeftOpen size={17} /> : <PanelLeftClose size={17} />}
        </button>

        <a className="admin-brand" href="#top" onClick={onBack}>
          <span>
            <Database size={20} />
          </span>
          <strong>DrawSchema</strong>
        </a>

        <nav className="admin-nav">
          <p>Workspace</p>
          <button
            className={view === 'projects' ? 'active' : ''}
            onClick={backToProjects}
            title="Mis proyectos"
            type="button"
          >
            <LayoutDashboard size={18} />
            <span>Mis proyectos</span>
          </button>
          {selectedProyecto ? (
            <button className={view === 'diagrammer' ? 'active' : ''} title="Diagramador" type="button">
              <FileCode2 size={18} />
              <span>Diagramador</span>
            </button>
          ) : null}
        </nav>

        <AdminSidebarExtras
          theme={theme}
          userProfile={userProfile}
          onProfile={onProfile}
          onToggleTheme={onToggleTheme}
        />

        <button className="sidebar-back" onClick={onBack} type="button">
          <ArrowLeft size={16} /> Volver al sitio
        </button>
      </aside>

      <section className={view === 'diagrammer' ? 'users-workspace diagrammer-workspace' : 'users-workspace'}>
        {view === 'projects' ? (
          <>
            <header className="users-header">
              <div>
                <p>Estudiante</p>
                <h1>Mis proyectos</h1>
              </div>

              <button className="ghost-button" onClick={loadProyectos} type="button">
                <RefreshCw size={18} /> Recargar
              </button>
            </header>

            {error ? <p className="users-message error">{error}</p> : null}
            {message ? <p className="users-message success">{message}</p> : null}
            {isLoading ? <p className="users-loading">Cargando tus proyectos...</p> : null}

            <section className="student-projects-home">
              <div className="student-panel student-create-project-panel">
                <div className="panel-title">
                  <div>
                    <p>Nuevo proyecto</p>
                    <h2>Crear workspace</h2>
                  </div>
                </div>

                <div className="student-project-form">
                  <input
                    onChange={(event) => setNewProjectName(event.target.value)}
                    placeholder="Nombre del proyecto"
                    value={newProjectName}
                  />
                  <textarea
                    onChange={(event) => setNewProjectDescription(event.target.value)}
                    placeholder="Descripcion opcional"
                    value={newProjectDescription}
                  />
                  <button
                    className="primary-action"
                    disabled={isSaving || !newProjectName.trim()}
                    onClick={createProyecto}
                    type="button"
                  >
                    <Plus size={18} /> Crear proyecto
                  </button>
                </div>
              </div>

              <div className="student-panel">
                <div className="panel-title">
                  <div>
                    <p>Proyectos</p>
                    <h2>Abre tu diagramador</h2>
                  </div>
                </div>

                <div className="student-project-grid">
                  {proyectos.map((proyecto) => (
                    <article
                      className={selectedProyecto?.id === proyecto.id ? 'student-project-card active' : 'student-project-card'}
                      key={proyecto.id}
                    >
                      <span>
                        <FolderKanban size={20} />
                      </span>
                      <strong>{proyecto.nombre}</strong>
                      <small>{proyecto.descripcion || 'Sin descripcion'}</small>
                      <div className="student-project-actions">
                        <button onClick={() => openProyecto(proyecto)} type="button">
                          <FileCode2 size={16} /> Abrir
                        </button>
                        <button onClick={() => openCollaborators(proyecto)} type="button">
                          <Plus size={16} /> Colaboradores
                        </button>
                      </div>
                    </article>
                  ))}
                </div>

                {proyectos.length === 0 && !isLoading ? (
                  <div className="empty-state">Todavia no tienes proyectos. Crea uno para empezar.</div>
                ) : null}

                {selectedProyecto ? (
                  <section className="collaborators-panel project-collaborators-panel">
                    <div className="panel-title compact-title">
                      <div>
                        <p>Colaboradores</p>
                        <h2>{selectedProyecto.nombre}</h2>
                      </div>
                      <button
                        className="icon-button"
                        disabled={isMembersLoading}
                        onClick={() => loadMiembros(selectedProyecto.id)}
                        title="Recargar colaboradores"
                        type="button"
                      >
                        <RefreshCw size={15} />
                      </button>
                    </div>

                    {membersError ? <p className="collaborators-message error">{membersError}</p> : null}
                    {membersMessage ? <p className="collaborators-message success">{membersMessage}</p> : null}
                    {!canManageMembers ? (
                      <p className="collaborators-message info">Solo el propietario puede gestionar colaboradores.</p>
                    ) : null}

                    <div className="collaborator-form project-collaborator-form">
                      <label>
                        Correo electronico
                        <input
                          disabled={!canManageMembers || isMembersSaving}
                          onChange={(event) => setNewMemberEmail(event.target.value)}
                          placeholder="usuario@correo.com"
                          type="email"
                          value={newMemberEmail}
                        />
                      </label>
                      <label>
                        Rol
                        <select
                          disabled={!canManageMembers || isMembersSaving}
                          onChange={(event) => setNewMemberRole(Number(event.target.value))}
                          value={newMemberRole}
                        >
                          {memberRoleOptions.map((role) => (
                            <option key={role.id} value={role.id}>
                              {role.label}
                            </option>
                          ))}
                        </select>
                      </label>
                      <button
                        className="primary-action"
                        disabled={isMembersSaving || !canManageMembers || !newMemberEmail.trim()}
                        onClick={addMiembro}
                        type="button"
                      >
                        <Plus size={17} /> Agregar colaborador
                      </button>
                    </div>

                    <div className="collaborators-list project-collaborators-list">
                      {isMembersLoading ? <p className="collaborators-loading">Cargando colaboradores...</p> : null}
                      {!isMembersLoading && miembros.length === 0 ? (
                        <p className="collaborators-loading">Sin colaboradores registrados.</p>
                      ) : null}

                      {miembros.map((miembro) => (
                        <article className="collaborator-card" key={miembro.usuario_codigo}>
                          <div>
                            <strong>{miembro.usuario_codigo}</strong>
                            <span>{getMemberRoleName(miembro.id_rol)}</span>
                          </div>
                          <select
                            aria-label={`Rol de ${miembro.usuario_codigo}`}
                            disabled={isMembersSaving || !canManageMembers}
                            onChange={(event) =>
                              setMemberRoleDrafts((current) => ({
                                ...current,
                                [miembro.usuario_codigo]: Number(event.target.value),
                              }))
                            }
                            value={memberRoleDrafts[miembro.usuario_codigo] ?? miembro.id_rol}
                          >
                            {memberRoleOptions.map((role) => (
                              <option key={role.id} value={role.id}>
                                {role.label}
                              </option>
                            ))}
                          </select>
                          <div className="collaborator-actions">
                            <button
                              className="icon-button"
                              disabled={
                                isMembersSaving ||
                                !canManageMembers ||
                                memberRoleDrafts[miembro.usuario_codigo] === miembro.id_rol
                              }
                              onClick={() => saveMemberRole(miembro)}
                              title="Guardar rol"
                              type="button"
                            >
                              <Save size={15} />
                            </button>
                            <button
                              className="icon-button danger"
                              disabled={isMembersSaving || !canManageMembers}
                              onClick={() => removeMiembro(miembro)}
                              title="Quitar colaborador"
                              type="button"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  </section>
                ) : null}
              </div>
            </section>
          </>
        ) : (
          <>
            <header className="diagrammer-header">
              <button className="ghost-button" onClick={backToProjects} type="button">
                <ArrowLeft size={18} /> Proyectos
              </button>
              <div>
                <p>Diagramador</p>
                <h1>{selectedProyecto?.nombre ?? 'Proyecto'}</h1>
              </div>
              <div className="diagrammer-header-actions">
                {selectedProyecto ? (
                  <span className={canViewOnly ? 'project-role-badge view-only' : 'project-role-badge'}>
                    {miembroActual ? getMemberRoleName(miembroActual.id_rol) : 'Cargando rol'}
                  </span>
                ) : null}
                <button
                  className="primary-action diagrammer-save"
                  disabled={!selectedDiagrama || isSaving || !canEditDiagram}
                  onClick={() => saveDiagrama()}
                  type="button"
                >
                  <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar'}
                </button>
              </div>
            </header>

            {error ? <p className="users-message error">{error}</p> : null}
            {message ? <p className="users-message success">{message}</p> : null}
            {canViewOnly ? (
              <p className="users-message info">Estas como visualizador: puedes revisar el diagrama, pero no editarlo.</p>
            ) : null}

            <section className="diagrammer-shell">
              <aside className="diagrammer-left-panel">
                <DiagramListPanel
                  canEditDiagram={canEditDiagram}
                  createDiagrama={createDiagrama}
                  diagramas={diagramas}
                  formatDate={formatDate}
                  isSaving={isSaving}
                  newDiagramName={newDiagramName}
                  openDiagrama={openDiagrama}
                  removeDiagrama={removeDiagrama}
                  selectedDiagrama={selectedDiagrama}
                  selectedProyecto={selectedProyecto}
                  setNewDiagramName={setNewDiagramName}
                />

                <RelationBuilderPanel
                  canEditDiagram={canEditDiagram}
                  createRelationFromPanel={createRelationFromPanel}
                  edges={edges}
                  getClassNameById={getClassNameById}
                  invertRelationDirection={invertRelationDirection}
                  isOpen={isRelationToolboxOpen}
                  isSaving={isSaving}
                  nodes={nodes}
                  onRelationTypeChange={setSelectedRelationType}
                  onSelectEdge={(edgeId) => {
                    setSelectedEdgeId(edgeId)
                    setSelectedNodeId('')
                  }}
                  onSourceChange={setRelationSourceId}
                  onTargetChange={setRelationTargetId}
                  onToggleOpen={() => setIsRelationToolboxOpen((current) => !current)}
                  relationSourceId={relationSourceId}
                  relationTargetId={relationTargetId}
                  removeRelation={removeRelation}
                  selectedDiagrama={selectedDiagrama}
                  selectedEdgeId={selectedEdgeId}
                  selectedRelationType={selectedRelationType}
                  updateRelation={updateRelation}
                  updateRelationCardinality={updateRelationCardinality}
                />
              </aside>

              <section className="diagram-flow-panel">
                <div className="diagram-canvas-topbar">
                  <label>
                    Nombre
                      <input
                      disabled={!selectedDiagrama || !canEditDiagram}
                      onChange={(event) => setDiagramName(event.target.value)}
                      value={diagramName}
                    />
                  </label>
                  <div className="diagram-stats">
                    <span>{nodes.length} clases</span>
                    <span>{edges.length} relaciones</span>
                  </div>
                  <button
                    aria-expanded={isCreateClassOpen}
                    className="create-class-toggle canvas-create-class-toggle"
                    disabled={!selectedDiagrama || !canEditDiagram}
                    onClick={() => setIsCreateClassOpen((current) => !current)}
                    type="button"
                  >
                    <Plus size={18} />
                    Crear clase
                    <ChevronDown size={16} />
                  </button>
                </div>

                {isCreateClassOpen ? (
                  <CreateClassPanel
                    canEditDiagram={canEditDiagram}
                    isSaving={isSaving}
                    newAttributeName={newAttributeName}
                    newAttributeType={newAttributeType}
                    newClassName={newClassName}
                    onAddClass={addClass}
                    onAttributeNameChange={setNewAttributeName}
                    onAttributeTypeChange={setNewAttributeType}
                    onClassNameChange={setNewClassName}
                    selectedDiagrama={selectedDiagrama}
                    variant="canvas"
                  />
                ) : null}

                <DiagramCanvas
                  canEditDiagram={canEditDiagram}
                  connectNodes={connectNodes}
                  edges={edges}
                  nodes={nodes}
                  onEdgesChange={onEdgesChange}
                  onNodesChange={onNodesChange}
                  saveNodePosition={saveNodePosition}
                  selectedDiagrama={selectedDiagrama}
                  selectedEdgeId={selectedEdgeId}
                  setSelectedEdgeId={setSelectedEdgeId}
                  setSelectedNodeId={setSelectedNodeId}
                  setStoredSelectedRelationId={setStoredSelectedRelationId}
                  theme={theme}
                />

                {selectedNode ? (
                  <ClassFeaturesPanel
                    addAttributeToSelectedClass={addAttributeToSelectedClass}
                    addMethodToSelectedClass={addMethodToSelectedClass}
                    canEditDiagram={canEditDiagram}
                    featureTab={featureTab}
                    formatMethodParameters={formatMethodParameters}
                    isSaving={isSaving}
                    newAttributeName={newAttributeName}
                    newAttributeType={newAttributeType}
                    newMethodName={newMethodName}
                    newMethodParameters={newMethodParameters}
                    newMethodReturnType={newMethodReturnType}
                    removeAttributeFromSelectedClass={removeAttributeFromSelectedClass}
                    removeMethodFromSelectedClass={removeMethodFromSelectedClass}
                    removeSelectedClass={removeSelectedClass}
                    saveSelectedClass={saveSelectedClass}
                    selectedNode={selectedNode}
                    setFeatureTab={setFeatureTab}
                    setNewAttributeName={setNewAttributeName}
                    setNewAttributeType={setNewAttributeType}
                    setNewMethodName={setNewMethodName}
                    setNewMethodParameters={setNewMethodParameters}
                    setNewMethodReturnType={setNewMethodReturnType}
                    updateSelectedAttribute={updateSelectedAttribute}
                    updateSelectedClassDraft={updateSelectedClassDraft}
                    updateSelectedMethod={updateSelectedMethod}
                  />
                ) : null}

                <RelationsPanel
                  canEditDiagram={canEditDiagram}
                  edges={edges}
                  getClassNameById={getClassNameById}
                  invertRelationDirection={invertRelationDirection}
                  isSaving={isSaving}
                  removeRelation={removeRelation}
                  selectedEdgeId={selectedEdgeId}
                  selectedRelationType={selectedRelationType}
                  updateRelation={updateRelation}
                  updateRelationCardinality={updateRelationCardinality}
                />
              </section>

              <aside className="diagrammer-right-panel">
                <DiagramAssistantPanel
                  canEditDiagram={canEditDiagram}
                  onDiagramUpdated={handleAiDiagramUpdated}
                  selectedDiagrama={selectedDiagrama}
                  selectedProyecto={selectedProyecto}
                  userProfile={userProfile}
                />
              </aside>
            </section>
          </>
        )}
      </section>
    </main>
  )
}
