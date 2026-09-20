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
  if (!selectedProyecto || !selectedDiagrama) {
    return null
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
