import { Plus } from 'lucide-react'

type CreateClassPanelProps = {
  canEditDiagram: boolean
  isSaving: boolean
  newAttributeName: string
  newAttributeType: string
  newClassName: string
  selectedDiagrama: unknown
  onAddClass: () => void
  onAttributeNameChange: (value: string) => void
  onAttributeTypeChange: (value: string) => void
  onClassNameChange: (value: string) => void
  variant?: 'canvas' | 'sidebar'
}

export function CreateClassPanel({
  canEditDiagram,
  isSaving,
  newAttributeName,
  newAttributeType,
  newClassName,
  onAddClass,
  onAttributeNameChange,
  onAttributeTypeChange,
  onClassNameChange,
  selectedDiagrama,
  variant = 'sidebar',
}: CreateClassPanelProps) {
  const className =
    variant === 'canvas' ? 'create-class-panel canvas-create-class-panel' : 'create-class-panel'

  return (
    <section className={className}>
      <div className="panel-title">
        <div>
          <p>Clase</p>
          <h2>Nueva clase</h2>
        </div>
      </div>

      <label>
        Nombre de clase
        <input
          disabled={!canEditDiagram}
          onChange={(event) => onClassNameChange(event.target.value)}
          placeholder="Cliente"
          value={newClassName}
        />
      </label>

      <div className="form-row two-columns">
        <label>
          Atributo
          <input
            disabled={!canEditDiagram}
            onChange={(event) => onAttributeNameChange(event.target.value)}
            placeholder="id"
            value={newAttributeName}
          />
        </label>
        <label>
          Tipo
          <input
            disabled={!canEditDiagram}
            onChange={(event) => onAttributeTypeChange(event.target.value)}
            placeholder="BIGINT"
            value={newAttributeType}
          />
        </label>
      </div>

      <button
        className="primary-action"
        disabled={!selectedDiagrama || isSaving || !canEditDiagram || !newClassName.trim()}
        onClick={onAddClass}
        type="button"
      >
        <Plus size={18} /> Crear clase
      </button>
    </section>
  )
}
