import { useEffect, useMemo, useState } from 'react'
import { Download, Loader2, Server, X } from 'lucide-react'
import { ApiError } from '../../services/api'
import {
  downloadGeneratedBackend,
  generateSpringBackend,
  type GenerateSpringBackendResponse,
} from '../../services/aiService'

type AiCodegenPanelProps = {
  proyectoId?: number | null
  proyectoNombre?: string | null
  diagramaId?: number | null
  variant?: 'panel' | 'button'
}

function toSlug(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function defaultProjectName(proyectoNombre?: string | null) {
  const slug = toSlug(proyectoNombre ?? '')
  return slug ? `${slug}-api` : 'generated-api'
}

export function AiCodegenPanel({ diagramaId, proyectoId, proyectoNombre, variant = 'panel' }: AiCodegenPanelProps) {
  const suggestedProjectName = useMemo(() => defaultProjectName(proyectoNombre), [proyectoNombre])
  const [projectName, setProjectName] = useState(suggestedProjectName)
  const [basePackage, setBasePackage] = useState('com.drawschema.generated')
  const [databaseName, setDatabaseName] = useState('generated_db')
  const [message, setMessage] = useState('Genera un backend Spring Boot completo con CRUD y PostgreSQL')
  const [result, setResult] = useState<GenerateSpringBackendResponse | null>(null)
  const [error, setError] = useState('')
  const [downloadMessage, setDownloadMessage] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    setProjectName(suggestedProjectName)
    setResult(null)
    setError('')
    setDownloadMessage('')
  }, [suggestedProjectName, diagramaId])

  function validateForm() {
    if (!proyectoId) {
      return 'Selecciona un proyecto antes de generar backend.'
    }

    if (!diagramaId) {
      return 'Selecciona un diagrama antes de generar backend.'
    }

    if (!localStorage.getItem('token')) {
      return 'No se encontro token de sesion. Inicia sesion nuevamente.'
    }

    if (!projectName.trim()) {
      return 'Escribe el nombre del proyecto Spring Boot.'
    }

    if (!basePackage.trim()) {
      return 'Escribe el base package.'
    }

    if (!databaseName.trim()) {
      return 'Escribe el nombre de la base de datos.'
    }

    return ''
  }

  async function handleGenerate() {
    const validationError = validateForm()

    if (validationError) {
      setError(validationError)
      return
    }

    setError('')
    setDownloadMessage('')
    setResult(null)
    setIsGenerating(true)

    try {
      const response = await generateSpringBackend({
        proyecto_id: proyectoId!,
        diagrama_id: diagramaId!,
        message: message.trim() || 'Genera un backend Spring Boot completo con CRUD y PostgreSQL',
        target: 'spring_boot',
        project_name: projectName.trim(),
        base_package: basePackage.trim(),
        database_name: databaseName.trim(),
      })

      setResult(response)

      if (!response.success) {
        setError(response.summary || 'El backend IA no pudo generar el proyecto.')
      }
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(String(requestError.message))
      } else {
        setError('No se pudo conectar con el backend IA.')
      }
    } finally {
      setIsGenerating(false)
    }
  }

  async function handleDownload() {
    if (!result?.generation_id && !result?.download_url) {
      setError('No hay un ZIP generado para descargar.')
      return
    }

    setError('')
    setDownloadMessage('')
    setIsDownloading(true)

    try {
      await downloadGeneratedBackend({
        generationId: result.generation_id,
        downloadUrl: result.download_url,
        projectName: result.project_name || projectName,
      })
      setDownloadMessage('ZIP descargado. Revisa tu carpeta de descargas.')
    } catch (requestError) {
      if (requestError instanceof ApiError) {
        setError(String(requestError.message))
      } else {
        setError('No se pudo descargar el ZIP generado.')
      }
    } finally {
      setIsDownloading(false)
    }
  }

  return (
    <>
      <section className={variant === 'button' ? 'ai-codegen-launcher ai-codegen-launcher-inline' : 'ai-codegen-launcher'}>
        <button className="ai-codegen-open-button" onClick={() => setIsOpen(true)} type="button">
          <Server size={17} />
          Generar backend
        </button>
        {variant === 'panel' && result ? <small>Ultimo generado: {result.project_name}</small> : null}
      </section>

      {isOpen ? (
        <div className="ai-codegen-overlay" role="dialog" aria-modal="true" aria-label="Generar backend Spring Boot">
          <section className="ai-codegen-panel ai-codegen-modal">
            <header className="ai-planner-header">
              <div>
                <p>Backend</p>
                <h2>Generar Spring Boot</h2>
              </div>
              <button className="ai-codegen-close" onClick={() => setIsOpen(false)} type="button" aria-label="Cerrar">
                <X size={18} />
              </button>
            </header>

            <div className="ai-codegen-form">
              <label>
                Nombre del proyecto
                <input
                  onChange={(event) => setProjectName(event.target.value)}
                  placeholder="ventas-api"
                  value={projectName}
                />
              </label>

              <label>
                Base package
                <input
                  onChange={(event) => setBasePackage(event.target.value)}
                  placeholder="com.drawschema.ventas"
                  value={basePackage}
                />
              </label>

              <label>
                Base de datos
                <input
                  onChange={(event) => setDatabaseName(event.target.value)}
                  placeholder="ventas_db"
                  value={databaseName}
                />
              </label>

              <label>
                Mensaje opcional
                <textarea
                  onChange={(event) => setMessage(event.target.value)}
                  placeholder="Genera un backend Spring Boot completo con CRUD y PostgreSQL"
                  value={message}
                />
              </label>

              <button
                className="primary-action ai-codegen-primary"
                disabled={isGenerating}
                onClick={handleGenerate}
                type="button"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="ai-spin" size={17} /> Generando...
                  </>
                ) : (
                  <>
                    <Server size={17} /> Generar backend
                  </>
                )}
              </button>
            </div>

            {error ? <p className="ai-codegen-message error">{error}</p> : null}
            {downloadMessage ? <p className="ai-codegen-message success">{downloadMessage}</p> : null}

            {result ? (
              <div className="ai-codegen-result">
                <p>{result.summary || 'Backend Spring Boot generado.'}</p>
                <div className="ai-codegen-meta">
                  <span>{result.files?.length ?? 0} archivos</span>
                  <span>{result.database_name}</span>
                </div>

                {result.warnings?.length > 0 ? (
                  <div className="ai-codegen-warnings">
                    <strong>Advertencias</strong>
                    {result.warnings.map((warning, index) => (
                      <p key={`${warning}-${index}`}>{warning}</p>
                    ))}
                  </div>
                ) : null}

                <button
                  className="ghost-button ai-codegen-download"
                  disabled={(!result.generation_id && !result.download_url) || isDownloading}
                  onClick={handleDownload}
                  type="button"
                >
                  <Download size={17} />
                  {isDownloading ? 'Descargando...' : 'Descargar ZIP'}
                </button>
              </div>
            ) : null}
          </section>
        </div>
      ) : null}
    </>
  )
}
