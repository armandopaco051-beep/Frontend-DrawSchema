import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  addEdge,
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import type {
  Connection,
  Edge,
  Node,
  NodeProps,
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
  Plus,
  RefreshCw,
  Save,
  Trash2,
} from 'lucide-react'
import { AdminSidebarExtras } from '../../components/admin/AdminSidebarExtras'
import type { Proyecto } from '../../models/proyecto'
import type { DiagramContent, DiagramEdge, DiagramNode, DiagramaResponse } from '../../services/diagramaService'
import {
  abrirDiagrama,
  agregarClase,
  crearDiagrama,
  editarClase,
  eliminarDiagrama,
  guardarDiagrama,
  listarDiagramasPorProyecto,
  moverClase,
} from '../../services/diagramaService'
import { crearProyecto, listarProyectosPorUsuario } from '../../services/proyecto'
import type { AuthUserProfile } from '../../utils/auth'
import '@xyflow/react/dist/style.css'
import '../usuario/UsuariosPage.css'
import './EstudiantePage.css'

type EstudiantePageProps = {
  theme: 'dark' | 'light'
  userProfile: AuthUserProfile | null
  onBack: () => void
  onProfile: () => void
  onToggleTheme: () => void
}

type StudentView = 'projects' | 'diagrammer'

type ClassAttribute = {
  name?: string
  type?: string
  primaryKey?: boolean
  nullable?: boolean
  [key: string]: unknown
}

type ClassMethod = {
  name?: string
  returnType?: string
  parameters?: Record<string, unknown>[]
  [key: string]: unknown
}

type ClassNodeData = {
  name: string
  attributes: ClassAttribute[]
  methods: ClassMethod[]
  [key: string]: unknown
}

type ClassFlowNode = Node<ClassNodeData, 'classNode'>
type ClassFlowEdge = Edge<Record<string, unknown>>

const emptyContent: DiagramContent = {
  nodes: [],
  edges: [],
}

const nodeTypes = {
  classNode: ClassNode,
}

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

function normalizeContent(content?: DiagramContent | null) {
  return content ?? emptyContent
}

function toFlowNodes(nodes: DiagramNode[]): ClassFlowNode[] {
  return nodes.map((node) => ({
    id: node.id,
    type: 'classNode',
    position: node.position,
    data: {
      name: node.data.name,
      attributes: node.data.attributes as ClassAttribute[],
      methods: node.data.methods as ClassMethod[],
    },
  }))
}

function toFlowEdges(edges: DiagramEdge[]): ClassFlowEdge[] {
  return edges.map((edge) => ({
    id: edge.id,
    source: edge.source,
    target: edge.target,
    type: edge.type ?? 'smoothstep',
    data: edge.data ?? {},
  }))
}

function toDiagramContent(nodes: ClassFlowNode[], edges: ClassFlowEdge[]): DiagramContent {
  return {
    nodes: nodes.map((node) => ({
      id: node.id,
      type: 'classNode',
      position: node.position,
      data: {
        name: node.data.name,
        attributes: node.data.attributes,
        methods: node.data.methods,
      },
    })),
    edges: edges.map((edge) => ({
      id: edge.id,
      source: edge.source,
      target: edge.target,
      type: edge.type,
      data: edge.data,
    })),
  }
}

function ClassNode({ data, selected }: NodeProps<ClassFlowNode>) {
  return (
    <article className={selected ? 'flow-class-node selected' : 'flow-class-node'}>
      <Handle className="flow-handle" position={Position.Left} type="target" />
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
              {String(method.name ?? 'metodo')}(): {String(method.returnType ?? 'void')}
            </p>
          ))
        ) : (
          <p className="muted-line">Sin metodos</p>
        )}
      </footer>
      <Handle className="flow-handle" position={Position.Right} type="source" />
    </article>
  )
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
  const [nodes, setNodes, onNodesChange] = useNodesState<ClassFlowNode>([])
  const [edges, setEdges, onEdgesChange] = useEdgesState<ClassFlowEdge>([])
  const [selectedNodeId, setSelectedNodeId] = useState('')
  const [diagramName, setDiagramName] = useState('')
  const [newDiagramName, setNewDiagramName] = useState('Diagrama principal')
  const [newClassName, setNewClassName] = useState('Cliente')
  const [newAttributeName, setNewAttributeName] = useState('id')
  const [newAttributeType, setNewAttributeType] = useState('BIGINT')
  const [newMethodName, setNewMethodName] = useState('registrar')
  const [newMethodReturnType, setNewMethodReturnType] = useState('void')
  const [newProjectName, setNewProjectName] = useState('Mi nuevo proyecto')
  const [newProjectDescription, setNewProjectDescription] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const selectedNode = useMemo(
    () => nodes.find((node) => node.id === selectedNodeId) ?? null,
    [nodes, selectedNodeId],
  )

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

  async function openProyecto(proyecto: Proyecto) {
    setSelectedProyecto(proyecto)
    setSelectedDiagrama(null)
    setNodes([])
    setEdges([])
    setDiagramas([])
    setSelectedNodeId('')
    setView('diagrammer')
    setMessage('')
    setError('')

    try {
      const data = await listarDiagramasPorProyecto(proyecto.id)
      setDiagramas(data)

      if (data.length > 0) {
        await openDiagrama(data[0].id)
      }
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar los diagramas')
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
      setNodes(toFlowNodes(content.nodes))
      setEdges(toFlowEdges(content.edges))
      setSelectedNodeId('')
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudo abrir el diagrama')
    }
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
      setError(saveError instanceof Error ? saveError.message : 'No se pudo crear el diagrama')
    } finally {
      setIsSaving(false)
    }
  }

  async function addClass() {
    if (!selectedDiagrama) {
      setError('Crea o abre un diagrama antes de agregar clases.')
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

      setSelectedDiagrama(diagrama)
      setNodes(toFlowNodes(content.nodes))
      setEdges(toFlowEdges(content.edges))
      setNewClassName('Cliente')
      setNewAttributeName('id')
      setNewAttributeType('BIGINT')
      setMessage('Clase agregada al diagrama.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo agregar la clase')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveSelectedClass(nextData: ClassNodeData) {
    if (!selectedDiagrama || !selectedNode) {
      return
    }

    setIsSaving(true)
    setError('')
    setMessage('')

    try {
      const diagrama = await editarClase(selectedDiagrama.id, selectedNode.id, {
        name: nextData.name,
        attributes: nextData.attributes,
        methods: nextData.methods,
        autor_codigo: userProfile?.codigo,
      })
      const content = normalizeContent(diagrama.contenido)

      setSelectedDiagrama(diagrama)
      setNodes(toFlowNodes(content.nodes))
      setEdges(toFlowEdges(content.edges))
      setMessage('Clase actualizada.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar la clase')
    } finally {
      setIsSaving(false)
    }
  }

  async function saveDiagrama(nextNodes = nodes, nextEdges = edges) {
    if (!selectedDiagrama) {
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

      setSelectedDiagrama(diagrama)
      setNodes(toFlowNodes(content.nodes))
      setEdges(toFlowEdges(content.edges))
      setDiagramas((current) => current.map((item) => (item.id === diagrama.id ? diagrama : item)))
      setMessage('Diagrama guardado correctamente.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el diagrama')
    } finally {
      setIsSaving(false)
    }
  }

  const connectNodes: OnConnect = async (connection: Connection) => {
    const nextEdges = addEdge(
      {
        ...connection,
        id: `rel-${connection.source}-${connection.target}-${Date.now()}`,
        type: 'smoothstep',
        data: {
          relationType: 'association',
          cardinality: '1:N',
        },
      },
      edges,
    )

    setEdges(nextEdges)
    await saveDiagrama(nodes, nextEdges)
  }

  const saveNodePosition: OnNodeDrag<ClassFlowNode> = async (_event, node) => {
    if (!selectedDiagrama) {
      return
    }

    try {
      const diagrama = await moverClase(selectedDiagrama.id, node.id, {
        x: node.position.x,
        y: node.position.y,
        autor_codigo: userProfile?.codigo,
      })
      const content = normalizeContent(diagrama.contenido)

      setSelectedDiagrama(diagrama)
      setNodes(toFlowNodes(content.nodes))
      setEdges(toFlowEdges(content.edges))
      setDiagramas((current) => current.map((item) => (item.id === diagrama.id ? diagrama : item)))
    } catch (moveError) {
      setError(moveError instanceof Error ? moveError.message : 'No se pudo mover la clase')
    }
  }

  async function addAttributeToSelectedClass() {
    if (!selectedNode || !newAttributeName.trim()) {
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

    await saveSelectedClass({
      ...selectedNode.data,
      methods: [
        ...selectedNode.data.methods,
        {
          name: newMethodName,
          returnType: newMethodReturnType,
          parameters: [],
        },
      ],
    })
    setNewMethodName('registrar')
    setNewMethodReturnType('void')
  }

  async function removeDiagrama(diagrama: DiagramaResponse) {
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
      }

      setMessage('Diagrama eliminado correctamente.')
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el diagrama')
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
    setMessage('')
    setError('')
  }

  useEffect(() => {
    loadProyectos()
  }, [loadProyectos])

  return (
    <main className={`users-page student-page ${theme === 'light' ? 'users-page-light' : ''}`}>
      <aside className="admin-sidebar" aria-label="Navegacion de estudiante">
        <a className="admin-brand" href="#top" onClick={onBack}>
          <span>
            <Database size={20} />
          </span>
          <strong>DrawSchema</strong>
        </a>

        <button className="admin-profile" type="button">
          <span className="admin-avatar">{userProfile?.initials ?? 'ES'}</span>
          <span>
            <strong>Student Console</strong>
            <small>Mis proyectos y diagramas</small>
          </span>
          <ChevronDown size={16} />
        </button>

        <nav className="admin-nav">
          <p>Workspace</p>
          <button className={view === 'projects' ? 'active' : ''} onClick={backToProjects} type="button">
            <LayoutDashboard size={18} />
            Mis proyectos
          </button>
          {selectedProyecto ? (
            <button className={view === 'diagrammer' ? 'active' : ''} type="button">
              <FileCode2 size={18} />
              Diagramador
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

      <section className="users-workspace">
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
                    <button
                      className="student-project-card"
                      key={proyecto.id}
                      onClick={() => openProyecto(proyecto)}
                      type="button"
                    >
                      <span>
                        <FolderKanban size={20} />
                      </span>
                      <strong>{proyecto.nombre}</strong>
                      <small>{proyecto.descripcion || 'Sin descripcion'}</small>
                      <em>Abrir diagramador</em>
                    </button>
                  ))}
                </div>

                {proyectos.length === 0 && !isLoading ? (
                  <div className="empty-state">Todavia no tienes proyectos. Crea uno para empezar.</div>
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
              <button className="primary-action diagrammer-save" disabled={!selectedDiagrama || isSaving} onClick={() => saveDiagrama()} type="button">
                <Save size={18} /> {isSaving ? 'Guardando...' : 'Guardar'}
              </button>
            </header>

            {error ? <p className="users-message error">{error}</p> : null}
            {message ? <p className="users-message success">{message}</p> : null}

            <section className="diagrammer-shell">
              <aside className="diagrammer-left-panel">
                <div className="panel-title">
                  <div>
                    <p>Diagramas</p>
                    <h2>Archivos</h2>
                  </div>
                </div>

                <div className="student-create-row">
                  <input
                    onChange={(event) => setNewDiagramName(event.target.value)}
                    placeholder="Nombre del diagrama"
                    value={newDiagramName}
                  />
                  <button className="ghost-button" disabled={isSaving || !selectedProyecto} onClick={createDiagrama} type="button">
                    <Plus size={18} />
                  </button>
                </div>

                <div className="diagram-list">
                  {diagramas.map((diagrama) => (
                    <article
                      className={selectedDiagrama?.id === diagrama.id ? 'diagram-card active' : 'diagram-card'}
                      key={diagrama.id}
                    >
                      <button onClick={() => openDiagrama(diagrama.id)} type="button">
                        <FileCode2 size={18} />
                        <span>
                          <strong>{diagrama.nombre}</strong>
                          <small>v{diagrama.version} - {formatDate(diagrama.actualizado_en)}</small>
                        </span>
                      </button>
                      <button className="icon-button danger" onClick={() => removeDiagrama(diagrama)} type="button">
                        <Trash2 size={15} />
                      </button>
                    </article>
                  ))}
                </div>

                {diagramas.length === 0 ? (
                  <div className="empty-state compact">Crea un diagrama para empezar.</div>
                ) : null}
              </aside>

              <section className="diagram-flow-panel">
                <div className="diagram-canvas-topbar">
                  <label>
                    Nombre
                    <input
                      disabled={!selectedDiagrama}
                      onChange={(event) => setDiagramName(event.target.value)}
                      value={diagramName}
                    />
                  </label>
                  <div className="diagram-stats">
                    <span>{nodes.length} clases</span>
                    <span>{edges.length} relaciones</span>
                  </div>
                </div>

                <div className="react-flow-canvas">
                  <ReactFlow
                    colorMode={theme}
                    edges={edges}
                    fitView
                    nodeTypes={nodeTypes}
                    nodes={nodes}
                    onConnect={connectNodes}
                    onEdgesChange={onEdgesChange}
                    onNodeClick={(_event, node) => setSelectedNodeId(node.id)}
                    onNodeDragStop={saveNodePosition}
                    onNodesChange={onNodesChange}
                  >
                    <Background gap={28} />
                    <Controls />
                    <MiniMap pannable zoomable />
                  </ReactFlow>

                  {!selectedDiagrama ? (
                    <div className="flow-empty-overlay">
                      <FileCode2 size={28} />
                      <strong>Abre o crea un diagrama</strong>
                      <span>Luego crea clases y conectalas visualmente.</span>
                    </div>
                  ) : null}
                </div>
              </section>

              <aside className="diagrammer-right-panel">
                <div className="panel-title">
                  <div>
                    <p>Clase</p>
                    <h2>{selectedNode ? 'Editar clase' : 'Crear clase'}</h2>
                  </div>
                </div>

                <label>
                  Nombre de clase
                  <input
                    onChange={(event) => setNewClassName(event.target.value)}
                    placeholder="Cliente"
                    value={newClassName}
                  />
                </label>

                <div className="form-row two-columns">
                  <label>
                    Atributo
                    <input
                      onChange={(event) => setNewAttributeName(event.target.value)}
                      placeholder="id"
                      value={newAttributeName}
                    />
                  </label>
                  <label>
                    Tipo
                    <input
                      onChange={(event) => setNewAttributeType(event.target.value)}
                      placeholder="BIGINT"
                      value={newAttributeType}
                    />
                  </label>
                </div>

                <button className="primary-action" disabled={!selectedDiagrama || isSaving || !newClassName.trim()} onClick={addClass} type="button">
                  <Plus size={18} /> Crear clase
                </button>

                {selectedNode ? (
                  <section className="selected-class-panel">
                    <div className="panel-title">
                      <div>
                        <p>Seleccionada</p>
                        <h2>{selectedNode.data.name}</h2>
                      </div>
                    </div>

                    <label>
                      Nombre
                      <input
                        onChange={(event) =>
                          setNodes((current) =>
                            current.map((node) =>
                              node.id === selectedNode.id
                                ? {
                                    ...node,
                                    data: {
                                      ...node.data,
                                      name: event.target.value,
                                    },
                                  }
                                : node,
                            ),
                          )
                        }
                        value={selectedNode.data.name}
                      />
                    </label>

                    <div className="class-items-list">
                      {selectedNode.data.attributes.map((attribute, index) => (
                        <span key={`${String(attribute.name)}-${index}`}>
                          {String(attribute.name)}: {String(attribute.type)}
                        </span>
                      ))}
                    </div>

                    <button className="ghost-button" disabled={isSaving || !newAttributeName.trim()} onClick={addAttributeToSelectedClass} type="button">
                      <Plus size={17} /> Agregar atributo
                    </button>

                    <div className="form-row two-columns">
                      <label>
                        Metodo
                        <input
                          onChange={(event) => setNewMethodName(event.target.value)}
                          placeholder="registrar"
                          value={newMethodName}
                        />
                      </label>
                      <label>
                        Retorno
                        <input
                          onChange={(event) => setNewMethodReturnType(event.target.value)}
                          placeholder="void"
                          value={newMethodReturnType}
                        />
                      </label>
                    </div>

                    <div className="class-items-list">
                      {selectedNode.data.methods.map((method, index) => (
                        <span key={`${String(method.name)}-${index}`}>
                          {String(method.name)}(): {String(method.returnType ?? 'void')}
                        </span>
                      ))}
                    </div>

                    <button className="ghost-button" disabled={isSaving || !newMethodName.trim()} onClick={addMethodToSelectedClass} type="button">
                      <Plus size={17} /> Agregar metodo
                    </button>

                    <button className="primary-action" disabled={isSaving} onClick={() => saveSelectedClass(selectedNode.data)} type="button">
                      <Save size={18} /> Guardar clase
                    </button>
                  </section>
                ) : (
                  <div className="empty-state compact">Selecciona una clase del canvas para editarla.</div>
                )}
              </aside>
            </section>
          </>
        )}
      </section>
    </main>
  )
}
