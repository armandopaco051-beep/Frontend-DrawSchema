import { LockKeyhole, Users } from 'lucide-react'
import './ChatScopeSelector.css'

export type ChatScope = 'individual' | 'grupal'

type ChatScopeSelectorProps = {
    value: ChatScope
    disabled?: boolean
    onChange: (value: ChatScope) => void
}

export function ChatScopeSelector({
    value,
    disabled = false,
    onChange,
}: ChatScopeSelectorProps) {
    return (
        <div className="ai-chat-scope">
            <div
                aria-label="Tipo de conversación"
                className="ai-chat-scope-options"
                role="group"
            >
                <button
                    aria-pressed={value === 'individual'}
                    disabled={disabled}
                    onClick={() => onChange('individual')}
                    type="button"
                >
                    <LockKeyhole aria-hidden="true" size={14} />
                    <span>Individual</span>
                </button>

                <button
                    aria-pressed={value === 'grupal'}
                    disabled={disabled}
                    onClick={() => onChange('grupal')}
                    type="button"
                >
                    <Users aria-hidden="true" size={14} />
                    <span>Grupal</span>
                </button>
            </div>

            <small className="ai-chat-scope-description" role="status">
                {value === 'individual'
                    ? 'Tu espacio personal con la IA.'
                    : 'Espacio para los miembros del proyecto.'}
            </small>
        </div>
    )
}