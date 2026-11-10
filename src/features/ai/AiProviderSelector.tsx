import { useId } from 'react'
import { ChevronDown } from 'lucide-react'
import type { TextProvider } from '../../services/chatService'

type Props = {
  value: TextProvider
  disabled?: boolean
  onChange: (provider: TextProvider) => void
}

export function AiProviderSelector({ value, disabled = false, onChange }: Props) {
  const hintId = useId()
  return (
    <label className={`ai-model-picker${disabled ? ' is-disabled' : ''}`}
      title="Seleccionar IA para texto. Las imágenes se analizan siempre con Gemini.">
      <span className="ai-model-picker-display" aria-hidden="true">
        <strong>{value === 'gemini' ? 'Gemini' : 'IA local'}</strong>
        <span>{value === 'gemini' ? 'Google' : 'Ollama'}</span>
        <ChevronDown size={13} strokeWidth={1.6} />
      </span>
      <select aria-label="Seleccionar IA para texto" aria-describedby={hintId}
        value={value} disabled={disabled}
        onChange={(event) => onChange(event.target.value as TextProvider)}>
        <option value="gemini">Gemini · Google</option>
        <option value="local">IA local · Ollama</option>
      </select>
      <span className="ai-model-picker-hint" id={hintId}>
        Las imágenes se analizan siempre con Gemini.
      </span>
    </label>
  )
}
