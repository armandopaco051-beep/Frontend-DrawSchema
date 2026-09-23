import { ListTree, Plus, Save, Trash2, Workflow } from 'lucide-react'
import type { ClassFlowNode, ClassNodeData } from '../../diagrams/types/relation.types'

type FeatureTab = 'attributes' | 'methods'

type ClassFeaturesPanelProps = {
  canEditDiagram: boolean
  featureTab: FeatureTab
  isSaving: boolean
  newAttributeName: string
  newAttributeType: string
  newMethodName: string
  newMethodParameters: string
  newMethodReturnType: string
  selectedNode: ClassFlowNode
  addAttributeToSelectedClass: () => void
  addMethodToSelectedClass: () => void
  formatMethodParameters: (parameters: unknown) => string
  removeAttributeFromSelectedClass: (index: number) => void
  removeMethodFromSelectedClass: (index: number) => void
  removeSelectedClass: () => void
  saveSelectedClass: (data: ClassNodeData) => void
  setFeatureTab: (tab: FeatureTab) => void
  setNewAttributeName: (value: string) => void
  setNewAttributeType: (value: string) => void
  setNewMethodName: (value: string) => void
  setNewMethodParameters: (value: string) => void
  setNewMethodReturnType: (value: string) => void
  updateSelectedAttribute: (index: number, key: 'name' | 'type' | 'primaryKey' | 'foreignKey' | 'nullable', value: string | boolean) => void
  updateSelectedClassDraft: (data: ClassNodeData) => void
  updateSelectedMethod: (index: number, key: 'name' | 'returnType' | 'parameters', value: string) => void
}

export function ClassFeaturesPanel({
  addAttributeToSelectedClass,
  addMethodToSelectedClass,
  canEditDiagram,
  featureTab,
  formatMethodParameters,
  isSaving,
  newAttributeName,
  newAttributeType,
  newMethodName,
  newMethodParameters,
  newMethodReturnType,
  removeAttributeFromSelectedClass,
  removeMethodFromSelectedClass,
  removeSelectedClass,
  saveSelectedClass,
  selectedNode,
  setFeatureTab,
  setNewAttributeName,
  setNewAttributeType,
  setNewMethodName,
  setNewMethodParameters,
  setNewMethodReturnType,
  updateSelectedAttribute,
  updateSelectedClassDraft,
  updateSelectedMethod,
}: ClassFeaturesPanelProps) {
  return (
    <section className="class-features-panel">
      <header className="class-features-header">
        <div>
          <p>Seleccionada</p>
          <h2>{selectedNode.data.name}</h2>
        </div>

        <label>
          Nombre de clase
          <input
            disabled={!canEditDiagram}
            onChange={(event) =>
              updateSelectedClassDraft({
                ...selectedNode.data,
                name: event.target.value,
              })
            }
            value={selectedNode.data.name}
          />
        </label>

        <label>
          Tipo de elemento
          <select
            disabled={!canEditDiagram}
            onChange={(event) =>
              updateSelectedClassDraft({
                ...selectedNode.data,
                kind: event.target.value as ClassNodeData['kind'],
              })
            }
            value={selectedNode.data.kind ?? 'class'}
          >
            <option value="class">Clase</option>
            <option value="abstractClass">Clase abstracta</option>
            <option value="interface">Interfaz</option>
          </select>
        </label>

        <button className="primary-action" disabled={isSaving || !canEditDiagram} onClick={() => saveSelectedClass(selectedNode.data)} type="button">
          <Save size={18} /> Guardar clase
        </button>
        <button className="ghost-button danger" disabled={isSaving || !canEditDiagram} onClick={removeSelectedClass} type="button">
          <Trash2 size={16} /> Eliminar clase
        </button>
      </header>

      <div className="features-tabs" role="tablist" aria-label="Detalles de clase">
        <button className={featureTab === 'attributes' ? 'active' : ''} onClick={() => setFeatureTab('attributes')} role="tab" type="button">
          <ListTree size={16} /> Atributos
        </button>
        <button className={featureTab === 'methods' ? 'active' : ''} onClick={() => setFeatureTab('methods')} role="tab" type="button">
          <Workflow size={16} /> Procedimientos
        </button>
      </div>

      {featureTab === 'attributes' ? (
        <div className="features-table">
          <div className="features-grid features-grid-attributes features-head">
            <span>Nombre</span>
            <span>Tipo</span>
            <span>PK</span>
            <span>FK</span>
            <span>Null</span>
            <span />
          </div>

          {selectedNode.data.attributes.map((attribute, index) => (
            <div className="features-grid features-grid-attributes" key={`${String(attribute.name)}-${index}`}>
              <input
                aria-label="Nombre del atributo"
                disabled={!canEditDiagram}
                onChange={(event) => updateSelectedAttribute(index, 'name', event.target.value)}
                placeholder="nuevo_atributo"
                value={String(attribute.name ?? '')}
              />
              <input
                aria-label="Tipo del atributo"
                disabled={!canEditDiagram}
                onChange={(event) => updateSelectedAttribute(index, 'type', event.target.value)}
                placeholder="VARCHAR"
                value={String(attribute.type ?? '')}
              />
              <label className="mini-check" title="Clave Primaria (PK)">
                <input
                  checked={Boolean(attribute.primaryKey || (attribute as any).isPrimaryKey)}
                  disabled={!canEditDiagram}
                  onChange={(event) => updateSelectedAttribute(index, 'primaryKey', event.target.checked)}
                  type="checkbox"
                />
              </label>
              <label className="mini-check" title="Clave Foránea (FK)">
                <input
                  checked={Boolean(attribute.foreignKey || (attribute as any).isForeignKey)}
                  disabled={!canEditDiagram}
                  onChange={(event) => updateSelectedAttribute(index, 'foreignKey', event.target.checked)}
                  type="checkbox"
                />
              </label>
              <label className="mini-check" title="Permite Null">
                <input
                  checked={Boolean(attribute.nullable)}
                  disabled={!canEditDiagram}
                  onChange={(event) => updateSelectedAttribute(index, 'nullable', event.target.checked)}
                  type="checkbox"
                />
              </label>
              <button
                className="icon-button danger"
                disabled={isSaving || !canEditDiagram}
                onClick={() => removeAttributeFromSelectedClass(index)}
                type="button"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          <div className="features-grid features-grid-attributes features-new-row">
            <input disabled={!canEditDiagram} onChange={(event) => setNewAttributeName(event.target.value)} placeholder="nombre" value={newAttributeName} />
            <input disabled={!canEditDiagram} onChange={(event) => setNewAttributeType(event.target.value)} placeholder="tipo" value={newAttributeType} />
            <span />
            <span />
            <span />
            <button className="ghost-button" disabled={isSaving || !canEditDiagram || !newAttributeName.trim()} onClick={addAttributeToSelectedClass} type="button">
              <Plus size={16} /> +
            </button>
          </div>
        </div>
      ) : (
        <div className="features-table">
          <div className="features-grid features-grid-methods features-head">
            <span>Nombre</span>
            <span>Parametros</span>
            <span>Retorno</span>
            <span />
          </div>

          {selectedNode.data.methods.map((method, index) => (
            <div className="features-grid features-grid-methods" key={`${String(method.name)}-${index}`}>
              <input
                aria-label="Nombre del procedimiento"
                disabled={!canEditDiagram}
                onChange={(event) => updateSelectedMethod(index, 'name', event.target.value)}
                placeholder="calcular"
                value={String(method.name ?? '')}
              />
              <input
                aria-label="Parametros del procedimiento"
                disabled={!canEditDiagram}
                onChange={(event) => updateSelectedMethod(index, 'parameters', event.target.value)}
                placeholder="a, b"
                value={formatMethodParameters(method.parameters)}
              />
              <input
                aria-label="Retorno del procedimiento"
                disabled={!canEditDiagram}
                onChange={(event) => updateSelectedMethod(index, 'returnType', event.target.value)}
                placeholder="void"
                value={String(method.returnType ?? '')}
              />
              <button
                className="icon-button danger"
                disabled={isSaving || !canEditDiagram}
                onClick={() => removeMethodFromSelectedClass(index)}
                type="button"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))}

          <div className="features-grid features-grid-methods features-new-row">
            <input disabled={!canEditDiagram} onChange={(event) => setNewMethodName(event.target.value)} placeholder="procedimiento" value={newMethodName} />
            <input disabled={!canEditDiagram} onChange={(event) => setNewMethodParameters(event.target.value)} placeholder="a, b" value={newMethodParameters} />
            <input disabled={!canEditDiagram} onChange={(event) => setNewMethodReturnType(event.target.value)} placeholder="retorno" value={newMethodReturnType} />
            <button className="ghost-button" disabled={isSaving || !canEditDiagram || !newMethodName.trim()} onClick={addMethodToSelectedClass} type="button">
              <Plus size={16} /> Agregar
            </button>
          </div>
        </div>
      )}
    </section>
  )
}
