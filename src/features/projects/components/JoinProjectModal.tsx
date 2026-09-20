import { useEffect, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  FolderKanban,
  KeyRound,
  Loader2,
  Sparkles,
  UserPlus,
  X,
} from 'lucide-react'
import type { InvitacionPreviewResponse, Proyecto } from '../../../models/proyecto'
import { unirseAProyectoConCodigo, vistaPreviaInvitacion } from '../../../services/proyecto'
import './InviteModals.css'

type JoinProjectModalProps = {
  isOpen: boolean
  onClose: () => void
  onSuccess: (proyecto: Proyecto) => void
  theme?: 'dark' | 'light'
  initialCode?: string
}

export function JoinProjectModal({
  isOpen,
  onClose,
  onSuccess,
  theme = 'dark',
  initialCode = '',
}: JoinProjectModalProps) {
  const [codigo, setCodigo] = useState('')
  const [preview, setPreview] = useState<InvitacionPreviewResponse | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [isJoining, setIsJoining] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<Proyecto | null>(null)

  useEffect(() => {
    if (isOpen) {
      const cleanInit = initialCode.trim().toUpperCase()
      setCodigo(cleanInit)
      setError(null)
      setPreview(null)
      setSuccessData(null)

      if (cleanInit.length >= 6) {
        checkPreview(cleanInit)
      }
    }
  }, [isOpen, initialCode])

  const checkPreview = async (codeToTest: string) => {
    const clean = codeToTest.trim().toUpperCase()
    if (!clean || clean.length < 5) {
      setPreview(null)
      return
    }

    setIsPreviewLoading(true)
    setError(null)
    try {
      const res = await vistaPreviaInvitacion(clean)
      setPreview(res)
    } catch {
      // Si falla la vista previa simplemente se limpia
      setPreview(null)
    } finally {
      setIsPreviewLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toUpperCase().replace(/\s+/g, '')
    setCodigo(val)
    setError(null)

    if (val.length >= 6) {
      checkPreview(val)
    } else {
      setPreview(null)
    }
  }

  const handleJoin = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    const clean = codigo.trim().toUpperCase()
    if (!clean) {
      setError('Por favor ingresa un código de invitación.')
      return
    }

    setIsJoining(true)
    setError(null)

    try {
      const proyecto = await unirseAProyectoConCodigo(clean)
      setSuccessData(proyecto)
      setTimeout(() => {
        onSuccess(proyecto)
        onClose()
      }, 1500)
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'No se pudo unir al proyecto.'
      if (errMsg.toLowerCase().includes('expirado')) {
        setError('El código de invitación ha expirado. Solicita uno nuevo al propietario.')
      } else if (errMsg.toLowerCase().includes('perteneces') || errMsg.toLowerCase().includes('miembro')) {
        setError('Ya eres miembro de este proyecto.')
      } else if (errMsg.toLowerCase().includes('no encontrado') || errMsg.toLowerCase().includes('404')) {
        setError('Código de invitación no válido o no encontrado.')
      } else {
        setError(errMsg)
      }
    } finally {
      setIsJoining(false)
    }
  }

  if (!isOpen) {
    return null
  }

  return (
    <div className={`invite-modal-overlay ${theme === 'light' ? 'light-mode' : ''}`} onClick={onClose}>
      <div className="invite-modal-container join-modal" onClick={(e) => e.stopPropagation()}>
        <header className="invite-modal-header">
          <div className="invite-modal-header-title">
            <span className="invite-modal-header-icon join-icon">
              <UserPlus size={20} />
            </span>
            <div>
              <h3>Unirse a un Proyecto</h3>
              <p>Ingresa el código compartido por tu equipo</p>
            </div>
          </div>
          <button className="invite-modal-close" onClick={onClose} type="button" aria-label="Cerrar">
            <X size={18} />
          </button>
        </header>

        <div className="invite-modal-body">
          {successData ? (
            <div className="join-success-state">
              <CheckCircle2 size={44} className="join-success-icon" />
              <h4>¡Te has unido con éxito!</h4>
              <p>
                Ya formas parte del proyecto <strong>{successData.nombre}</strong> con rol de Editor.
              </p>
              <span className="join-redirect-hint">Redirigiendo a tu proyecto...</span>
            </div>
          ) : (
            <form onSubmit={handleJoin} className="join-modal-form">
              <div className="join-input-group">
                <label htmlFor="join-code-input">Código de Invitación</label>
                <div className="join-input-wrapper">
                  <KeyRound size={18} className="join-input-icon" />
                  <input
                    id="join-code-input"
                    type="text"
                    placeholder="Ej: PRJ-GXBL8R"
                    value={codigo}
                    onChange={handleInputChange}
                    disabled={isJoining}
                    autoFocus
                    maxLength={20}
                  />
                  {isPreviewLoading ? <Loader2 size={16} className="spin join-input-loader" /> : null}
                </div>
                <small>Los códigos tienen el formato PRJ-XXXXXX y distinguen mayúsculas.</small>
              </div>

              {preview ? (
                <div className="join-preview-card">
                  <div className="join-preview-header">
                    <FolderKanban size={18} className="join-preview-icon" />
                    <div>
                      <strong>{preview.nombre}</strong>
                      {preview.descripcion ? <p>{preview.descripcion}</p> : null}
                    </div>
                  </div>
                  <div className="join-preview-badge">
                    <Sparkles size={13} />
                    <span>Invitación activa para Editor</span>
                  </div>
                </div>
              ) : null}

              {error ? (
                <div className="invite-modal-error">
                  <AlertCircle size={18} />
                  <p>{error}</p>
                </div>
              ) : null}

              <button
                type="submit"
                className="join-submit-btn"
                disabled={isJoining || !codigo.trim()}
              >
                {isJoining ? (
                  <>
                    <Loader2 size={18} className="spin" />
                    <span>Uniéndote al proyecto...</span>
                  </>
                ) : (
                  <>
                    <span>Unirse al Proyecto</span>
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          )}
        </div>

        {!successData ? (
          <footer className="invite-modal-footer">
            <button type="button" className="invite-btn-close" onClick={onClose} disabled={isJoining}>
              Cancelar
            </button>
          </footer>
        ) : null}
      </div>
    </div>
  )
}
