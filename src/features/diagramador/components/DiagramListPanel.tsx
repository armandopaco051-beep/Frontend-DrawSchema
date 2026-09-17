import { FileCode2, Plus, Trash2 } from 'lucide-react'
import type { DiagramaResponse } from '../../../services/diagramaService'

type DiagramListPanelProps = {
  canEditDiagram: boolean
  diagramas: DiagramaResponse[]
  isSaving: boolean
  newDiagramName: string
  selectedDiagrama: DiagramaResponse | null
  selectedProyecto: unknown
  formatDate: (value?: string | null) => string
  createDiagrama: () => void
  openDiagrama: (diagramaId: number) => void
  removeDiagrama: (diagrama: DiagramaResponse) => void
  setNewDiagramName: (value: string) => void
}

export function DiagramListPanel({
  canEditDiagram,
  createDiagrama,
  diagramas,
  formatDate,
  isSaving,
  newDiagramName,
  openDiagrama,
  removeDiagrama,
  selectedDiagrama,
  selectedProyecto,
  setNewDiagramName,
}: DiagramListPanelProps) {
  return (
    <>
      <div className="panel-title">
        <div>
          <p>Diagramas</p>
          <h2>Archivos</h2>
        </div>
      </div>

      <div className="student-create-row">
        <input
          disabled={!canEditDiagram}
          onChange={(event) => setNewDiagramName(event.target.value)}
          placeholder="Nombre del diagrama"
          value={newDiagramName}
        />
        <button className="ghost-button" disabled={isSaving || !selectedProyecto || !canEditDiagram} onClick={createDiagrama} type="button">
          <Plus size={18} />
        </button>
      </div>

      <div className="diagram-list">
        {diagramas.map((diagrama) => (
          <article className={selectedDiagrama?.id === diagrama.id ? 'diagram-card active' : 'diagram-card'} key={diagrama.id}>
            <button onClick={() => openDiagrama(diagrama.id)} type="button">
              <FileCode2 size={18} />
              <span>
                <strong>{diagrama.nombre}</strong>
                <small>
                  v{diagrama.version} - {formatDate(diagrama.actualizado_en)}
                </small>
              </span>
            </button>
            <button className="icon-button danger" disabled={!canEditDiagram} onClick={() => removeDiagrama(diagrama)} type="button">
              <Trash2 size={15} />
            </button>
          </article>
        ))}
      </div>

      {diagramas.length === 0 ? <div className="empty-state compact">Crea un diagrama para empezar.</div> : null}
    </>
  )
}
