import { useEffect, useMemo, useState } from 'react'
import { Background, ReactFlow } from '@xyflow/react'
import type { Edge, Node } from '@xyflow/react'
import { ArrowLeft, Clock3, Eye, RotateCcw } from 'lucide-react'
import type { AuthUserProfile } from '../../utils/auth'
import type { DiagramaResponse, VersionHistorialResponse } from '../../services/diagramaService'
import { listarVersionesDiagrama, restaurarVersionDiagrama } from '../../services/diagramaService'
import { UmlRelationEdge } from '../../features/diagrams/components/edges/UmlRelationEdge'
import { getRelationEdgeProps, normalizeRelationType } from '../../features/diagrams/utils/relation-markers'
import { ClassNode } from '../../features/diagramador/components/ClassNode'
import './VersionHistoryPage.css'

const nodeTypes = {
  classNode: ClassNode,
}

const edgeTypes = {
  umlRelation: UmlRelationEdge,
}

type VersionHistoryPageProps = {
  theme: 'dark' | 'light'
  userProfile: AuthUserProfile | null
  onBack: () => void
  onRestored: (diagrama: DiagramaResponse) => void
}

function formatVersionDate(value: string) {
  return new Date(value).toLocaleString('es-BO', {
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    month: 'long',
    year: 'numeric',
  })
}

function getAuthorName(version: VersionHistorialResponse) {
  if (version.autor) {
    return `${version.autor.nombres} ${version.autor.apellidos}`.trim()
  }

  return version.autor_id
}

function getRelativeGroup(value: string) {
  const date = new Date(value)
  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday)
  startOfYesterday.setDate(startOfToday.getDate() - 1)
  const startOfWeek = new Date(startOfToday)
  startOfWeek.setDate(startOfToday.getDate() - 7)

  if (date >= startOfToday) {
    return 'Hoy'
  }

  if (date >= startOfYesterday) {
    return 'Ayer'
  }

  if (date >= startOfWeek) {
    return 'La semana pasada'
  }

  return 'Este mes'
}

export function VersionHistoryPage({ theme, userProfile, onBack, onRestored }: VersionHistoryPageProps) {
  const [versions, setVersions] = useState<VersionHistorialResponse[]>([])
  const [previewVersion, setPreviewVersion] = useState<VersionHistorialResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRestoring, setIsRestoring] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')
  const params = new URLSearchParams(window.location.search)
  const diagramaId = Number(params.get('diagrama_id'))
  const proyectoId = Number(params.get('proyecto_id'))
  const diagramaNombre = params.get('nombre') ?? 'Diagrama'

  const groupedVersions = useMemo(() => {
    return versions.reduce<Record<string, VersionHistorialResponse[]>>((groups, version) => {
      const group = getRelativeGroup(version.fecha)
      groups[group] = [...(groups[group] ?? []), version]
      return groups
    }, {})
  }, [versions])

  const previewNodes = useMemo<Node[]>(() => {
    return (previewVersion?.contenido.nodes ?? []).map((node) => ({
      id: node.id,
      type: 'classNode',
      position: node.position,
      data: {
        ...node.data,
        attributes: node.data.attributes,
        methods: node.data.methods,
      },
      style: {
        width: Number(node.style?.width ?? 245),
        height: Number(node.style?.height ?? 180),
      },
    }))
  }, [previewVersion])

  const previewEdges = useMemo<Edge[]>(() => {
    return (previewVersion?.contenido.edges ?? []).map((edge) => {
      const relationType = normalizeRelationType(edge.data?.relationType)

      return {
        id: edge.id,
        source: edge.source,
        target: edge.target,
        type: 'umlRelation',
        data: {
          ...edge.data,
          relationType,
          sourceClassId: edge.source,
          targetClassId: edge.target,
        },
        ...getRelationEdgeProps(relationType),
      }
    })
  }, [previewVersion])

  useEffect(() => {
    async function loadVersions() {
      if (!diagramaId) {
        setError('No se encontro el diagrama para consultar versiones.')
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const data = await listarVersionesDiagrama(diagramaId)
        setVersions(data)
        setPreviewVersion(data[0] ?? null)
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar el historial de versiones')
      } finally {
        setIsLoading(false)
      }
    }

    void loadVersions()
  }, [diagramaId])

  async function restoreVersion(version: VersionHistorialResponse) {
    const confirmed = window.confirm(
      `Volver a la version ${version.version}? Se guardara un respaldo del diagrama actual antes de restaurar.`,
    )

    if (!confirmed) {
      return
    }

    setIsRestoring(true)
    setError('')
    setMessage('')

    try {
      const diagrama = await restaurarVersionDiagrama(diagramaId, version.id, userProfile?.codigo)
      sessionStorage.setItem(
        'drawschema:open-diagram',
        JSON.stringify({
          diagramaId: diagrama.id,
          proyectoId: proyectoId || diagrama.id_proyecto,
        }),
      )
      setMessage('Version restaurada correctamente.')
      onRestored(diagrama)
    } catch (restoreError) {
      setError(restoreError instanceof Error ? restoreError.message : 'No se pudo restaurar la version')
    } finally {
      setIsRestoring(false)
    }
  }

  return (
    <main className={`version-history-page ${theme === 'light' ? 'version-history-light' : ''}`}>
      <aside className="version-history-sidebar">
        <button className="history-back" onClick={onBack} type="button">
          <ArrowLeft size={17} />
          Diagramador
        </button>

        <div className="history-title">
          <span>
            <Clock3 size={19} />
          </span>
          <div>
            <p>Control de versiones</p>
            <h1>Historial de versiones</h1>
          </div>
        </div>

        <select aria-label="Filtro de versiones" defaultValue="all">
          <option value="all">Todas las versiones</option>
        </select>
      </aside>

      <section className="version-history-content">
        <header>
          <div>
            <p>Diagrama</p>
            <h2>{diagramaNombre}</h2>
          </div>
          <span>{versions.length} versiones</span>
        </header>

        {error ? <p className="history-message error">{error}</p> : null}
        {message ? <p className="history-message success">{message}</p> : null}
        {isLoading ? <p className="history-empty">Cargando historial...</p> : null}

        {!isLoading && versions.length === 0 ? (
          <p className="history-empty">Todavia no hay checkpoints para este diagrama.</p>
        ) : null}

        <div className="history-workspace">
          <div className="history-timeline">
            {Object.entries(groupedVersions).map(([group, items]) => (
              <section className="history-group" key={group}>
                <h3>{group}</h3>
                <div className="history-list">
                  {items.map((version, index) => (
                    <article
                      className={previewVersion?.id === version.id ? 'history-card active' : 'history-card'}
                      key={version.id}
                    >
                      <div className="history-card-main">
                        <button
                          aria-label={`Ver version ${version.version}`}
                          onClick={() => setPreviewVersion(version)}
                          type="button"
                        >
                          <Clock3 size={16} />
                        </button>
                        <div>
                          <strong>{formatVersionDate(version.fecha)}</strong>
                          <span>{index === 0 ? 'Version actual guardada' : version.titulo ?? `Version ${version.version}`}</span>
                          <small>
                            <i></i>
                            {getAuthorName(version)}
                          </small>
                        </div>
                      </div>

                      <div className="history-card-actions">
                        <button className="preview-version-button" onClick={() => setPreviewVersion(version)} type="button">
                          <Eye size={15} />
                          Ver version
                        </button>
                        <button
                          className="restore-version-button"
                          disabled={isRestoring}
                          onClick={() => restoreVersion(version)}
                          type="button"
                        >
                          <RotateCcw size={15} />
                          Volver a esta version
                        </button>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <aside className="version-preview-panel">
            <div className="preview-panel-title">
              <div>
                <p>Vista previa</p>
                <h3>{previewVersion ? `Version ${previewVersion.version}` : 'Selecciona una version'}</h3>
              </div>
              {previewVersion ? <span>{formatVersionDate(previewVersion.fecha)}</span> : null}
            </div>

            <div className="version-preview-canvas">
              {previewVersion ? (
                <ReactFlow
                  colorMode={theme}
                  edgeTypes={edgeTypes}
                  edges={previewEdges}
                  fitView
                  nodes={previewNodes}
                  nodeTypes={nodeTypes}
                  nodesConnectable={false}
                  nodesDraggable={false}
                  panOnDrag
                  zoomOnPinch
                  zoomOnScroll
                >
                  <Background gap={26} />
                </ReactFlow>
              ) : (
                <p>Elige una version para verla antes de restaurarla.</p>
              )}
            </div>

            {previewVersion ? (
              <div className="preview-version-detail">
                <strong>{getAuthorName(previewVersion)}</strong>
                <span>{previewVersion.descripcion || previewVersion.titulo || 'Checkpoint automatico del diagrama.'}</span>
                <button
                  className="restore-version-button"
                  disabled={isRestoring}
                  onClick={() => restoreVersion(previewVersion)}
                  type="button"
                >
                  <RotateCcw size={15} />
                  Volver a esta version
                </button>
              </div>
            ) : null}
          </aside>
        </div>
      </section>
    </main>
  )
}
