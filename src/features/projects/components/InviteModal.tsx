import { useEffect, useState } from 'react'
import {
  AlertCircle,
  Check,
  Clock,
  Copy,
  KeyRound,
  Link,
  RefreshCw,
  Share2,
  X,
} from 'lucide-react'
import type { CodigoInvitacionResponse } from '../../../models/proyecto'
import { obtenerOCrearCodigoInvitacion } from '../../../services/proyecto'
import './InviteModals.css'

type InviteModalProps = {
  isOpen: boolean
  onClose: () => void
  proyectoId: number
  proyectoNombre: string
  theme?: 'dark' | 'light'
}

export function InviteModal({
  isOpen,
  onClose,
  proyectoId,
  proyectoNombre,
  theme = 'dark',
}: InviteModalProps) {
  const [data, setData] = useState<CodigoInvitacionResponse | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [copiedCode, setCopiedCode] = useState(false)
  const [copiedLink, setCopiedLink] = useState(false)
  const [confirmRegenerate, setConfirmRegenerate] = useState(false)

  useEffect(() => {
    if (!isOpen || !proyectoId) {
      return
    }

    let isMounted = true
    setIsLoading(true)
    setError(null)
    setConfirmRegenerate(false)
    setCopiedCode(false)
    setCopiedLink(false)

    obtenerOCrearCodigoInvitacion(proyectoId, false)
      .then((res) => {
        if (isMounted) {
          setData(res)
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err instanceof Error ? err.message : 'No se pudo obtener el código de invitación.')
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoading(false)
        }
      })

    return () => {
      isMounted = false
    }
  }, [isOpen, proyectoId])

  if (!isOpen) {
    return null
  }

  const handleCopyCode = async () => {
    if (!data?.codigo) return
    try {
      await navigator.clipboard.writeText(data.codigo)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleCopyLink = async () => {
    if (!data?.codigo) return
    const url = `${window.location.origin}/?invitacion=${encodeURIComponent(data.codigo)}`
    try {
      await navigator.clipboard.writeText(url)
      setCopiedLink(true)
      setTimeout(() => setCopiedLink(false), 2000)
    } catch {
      // Fallback
    }
  }

  const handleRegenerate = async () => {
    setIsRegenerating(true)
    setError(null)
    try {
      const res = await obtenerOCrearCodigoInvitacion(proyectoId, true)
      setData(res)
      setConfirmRegenerate(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo regenerar el código.')
    } finally {
      setIsRegenerating(false)
    }
  }

  return (
    <div className={`invite-modal-overlay ${theme === 'light' ? 'light-mode' : ''}`} onClick={onClose}>
      <div className="invite-modal-container" onClick={(e) => e.stopPropagation()}>
        <header className="invite-modal-header">
          <div className="invite-modal-header-title">
            <span className="invite-modal-header-icon">
              <Share2 size={20} />
            </span>
            <div>
              <h3>Invitar Colaboradores</h3>
              <p>{proyectoNombre}</p>
            </div>
          </div>
          <button className="invite-modal-close" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <div className="invite-modal-body">
          {isLoading ? (
            <div className="invite-modal-loading">
              <RefreshCw className="spin" size={26} />
              <span>Generando código de invitación...</span>
            </div>
          ) : error ? (
            <div className="invite-modal-error">
              <AlertCircle size={20} />
              <p>{error}</p>
              <button
                type="button"
                onClick={() => {
                  setError(null)
                  setIsLoading(true)
                  obtenerOCrearCodigoInvitacion(proyectoId, false)
                    .then(setData)
                    .catch((err) => setError(err.message))
                    .finally(() => setIsLoading(false))
                }}
              >
                Reintentar
              </button>
            </div>
          ) : data ? (
            <>
              <p className="invite-modal-description">
                Comparte este código o enlace con tus compañeros para que se unan al proyecto con rol de{' '}
                <strong>Editor</strong>.
              </p>

              <div className="invite-code-box">
                <div className="invite-code-inner">
                  <KeyRound size={22} className="invite-code-icon" />
                  <span className="invite-code-value">{data.codigo}</span>
                </div>
                <button
                  type="button"
                  className={`invite-copy-btn ${copiedCode ? 'copied' : ''}`}
                  onClick={handleCopyCode}
                  title="Copiar código al portapapeles"
                >
                  {copiedCode ? <Check size={16} /> : <Copy size={16} />}
                  <span>{copiedCode ? '¡Copiado!' : 'Copiar Código'}</span>
                </button>
              </div>

              <div className="invite-modal-actions-row">
                <button
                  type="button"
                  className={`invite-action-secondary ${copiedLink ? 'copied' : ''}`}
                  onClick={handleCopyLink}
                >
                  {copiedLink ? <Check size={16} /> : <Link size={16} />}
                  <span>{copiedLink ? '¡Enlace copiado!' : 'Copiar enlace directo'}</span>
                </button>

                <div className="invite-expiry-info">
                  <Clock size={14} />
                  <span>
                    Válido por 7 días{' '}
                    <strong>({data.dias_restantes} {data.dias_restantes === 1 ? 'día restante' : 'días restantes'})</strong>
                  </span>
                </div>
              </div>

              <div className="invite-regenerate-section">
                {!confirmRegenerate ? (
                  <button
                    type="button"
                    className="invite-regenerate-link"
                    onClick={() => setConfirmRegenerate(true)}
                  >
                    <RefreshCw size={13} />
                    Regenerar nuevo código
                  </button>
                ) : (
                  <div className="invite-regenerate-confirm">
                    <p>
                      ¿Seguro? El código anterior quedará invalidado y nadie más podrá usarlo.
                    </p>
                    <div className="invite-confirm-buttons">
                      <button
                        type="button"
                        className="invite-btn-confirm"
                        onClick={handleRegenerate}
                        disabled={isRegenerating}
                      >
                        {isRegenerating ? 'Regenerando...' : 'Sí, regenerar'}
                      </button>
                      <button
                        type="button"
                        className="invite-btn-cancel"
                        onClick={() => setConfirmRegenerate(false)}
                      >
                        Cancelar
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>

        <footer className="invite-modal-footer">
          <button type="button" className="invite-btn-close" onClick={onClose}>
            Cerrar
          </button>
        </footer>
      </div>
    </div>
  )
}
