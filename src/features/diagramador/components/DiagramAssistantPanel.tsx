import { AiCodegenPanel } from '../../ai/AiCodegenPanel'
import { AiPlannerPanel } from '../../ai/AiPlannerPanel'
import type { Proyecto } from '../../../models/proyecto'
import type { DiagramaResponse } from '../../../services/diagramaService'
import type { AuthUserProfile } from '../../../utils/auth'

type DiagramAssistantPanelProps = {
  canEditDiagram: boolean
  selectedDiagrama: DiagramaResponse | null
  selectedProyecto: Proyecto | null
  userProfile: AuthUserProfile | null
  onDiagramUpdated: (diagrama: DiagramaResponse) => void
}

export function DiagramAssistantPanel({
  canEditDiagram,
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
      <AiPlannerPanel
        autorCodigo={userProfile?.codigo}
        canEdit={canEditDiagram}
        compact
        diagramaId={selectedDiagrama.id}
        onDiagramUpdated={onDiagramUpdated}
        proyectoId={selectedProyecto.id}
      />
      <AiCodegenPanel
        diagramaId={selectedDiagrama.id}
        proyectoId={selectedProyecto.id}
        proyectoNombre={selectedProyecto.nombre}
      />
    </>
  )
}
