import { AiPlannerPanel } from '../../ai/AiPlannerPanel'
import type { Proyecto } from '../../../models/proyecto'
import type { DiagramaResponse } from '../../../services/diagramaService'
import type { AuthUserProfile } from '../../../utils/auth'

type DiagramAssistantPanelProps = {
  canEditDiagram: boolean
  isAssistantVisible: boolean
  selectedDiagrama: DiagramaResponse | null
  selectedProyecto: Proyecto | null
  userProfile: AuthUserProfile | null
  onDiagramUpdated: (diagrama: DiagramaResponse) => void
}

export function DiagramAssistantPanel({
  canEditDiagram,
  isAssistantVisible,
  onDiagramUpdated,
  selectedDiagrama,
  selectedProyecto,
  userProfile,
}: DiagramAssistantPanelProps) {
  if (!selectedProyecto) {
    return null
  }

  if (!selectedDiagrama) {
    return (
      <div className="ai-chat-panel">
        <div className="ai-chat-header">
          <div className="ai-chat-title">
            <span className="ai-chat-avatar">AI</span>
            <div>
              <strong>Asistente DrawSchema</strong>
              <small>Diseño y asistencia UML</small>
            </div>
          </div>
        </div>
        <div style={{ padding: '32px 18px', textAlign: 'center', color: '#94a3b8' }}>
          <p style={{ margin: '0 0 10px', fontSize: '0.9rem', lineHeight: '1.5', color: '#cbd5e1' }}>
            Abre o crea un diagrama para activar el Asistente IA.
          </p>
          <small style={{ display: 'block', fontSize: '0.8rem', color: '#64748b' }}>
            La IA puede diseñar clases, métodos, atributos y generar relaciones automáticamente para tu proyecto.
          </small>
        </div>
      </div>
    )
  }

  return (
    <>
      {isAssistantVisible ? (
        <AiPlannerPanel
          autorCodigo={userProfile?.codigo}
          canEdit={canEditDiagram}
          compact
          diagramaId={selectedDiagrama.id}
          onDiagramUpdated={onDiagramUpdated}
          proyectoId={selectedProyecto.id}
        />
      ) : null}
    </>
  )
}
