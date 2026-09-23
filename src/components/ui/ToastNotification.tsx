import { AlertCircle, CheckCircle2, Sparkles, Users, X } from 'lucide-react'
import { useToastStore, type ToastVariant } from './toast.store'
import './ToastNotification.css'

function getToastIcon(variant: ToastVariant) {
  switch (variant) {
    case 'ia':
      return <Sparkles className="toast-icon toast-icon-ia" size={18} />
    case 'collaborator':
      return <Users className="toast-icon toast-icon-collaborator" size={18} />
    case 'success':
      return <CheckCircle2 className="toast-icon toast-icon-success" size={18} />
    default:
      return <AlertCircle className="toast-icon toast-icon-info" size={18} />
  }
}

export function ToastContainer() {
  const toasts = useToastStore((state) => state.toasts)
  const removeToast = useToastStore((state) => state.removeToast)

  if (toasts.length === 0) {
    return null
  }

  return (
    <div className="toast-container" aria-live="polite">
      {toasts.map((toast) => (
        <div key={toast.id} className={`toast-card toast-${toast.variant}`}>
          <div className="toast-icon-box">{getToastIcon(toast.variant)}</div>
          <div className="toast-content">
            {toast.actor ? (
              <div className="toast-header">
                {toast.variant === 'ia' ? (
                  <span className="toast-tag toast-tag-ia">IA</span>
                ) : (
                  <span className="toast-tag toast-tag-collaborator">En vivo</span>
                )}
                <span className="toast-actor">{toast.actor}</span>
              </div>
            ) : null}
            <p className="toast-message">{toast.message}</p>
          </div>
          <button
            className="toast-close-btn"
            onClick={() => removeToast(toast.id)}
            type="button"
            aria-label="Cerrar notificación"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
