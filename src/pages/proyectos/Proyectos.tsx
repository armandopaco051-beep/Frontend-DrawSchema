import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  Database,
  FolderKanban,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  UsersRound,
  X,
} from 'lucide-react'
import { AdminSidebarExtras } from '../../components/admin/AdminSidebarExtras'
import type {
  MiembroFormValues,
  Proyecto,
  ProyectoFormValues,
  ProyectoMiembro,
} from '../../models/proyecto'
import {
  actualizarProyecto,
  agregarMiembro,
  crearProyecto,
  eliminarProyecto,
  listarMiembros,
  listarProyectos,
  listarProyectosPorUsuario,
  quitarMiembro,
} from '../../services/proyecto'
import type { AuthUserProfile } from '../../utils/auth'
import '../usuario/UsuariosPage.css'
import './Proyectos.css'

type ProyectosPageProps = {
  theme: 'dark' | 'light'
  userProfile: AuthUserProfile | null
  onBack: () => void
  onProfile: () => void
  onToggleTheme: () => void
  onUsers: () => void
}

const emptyProyectoForm: ProyectoFormValues = {
  nombre: '',
  descripcion: '',
  usuario_codigo: '',
  id_rol: 2,
}

const emptyMiembroForm: MiembroFormValues = {
  usuario_codigo: '',
  id_rol: 3,
}

export function ProyectosPage({
  theme,
  userProfile,
  onBack,
  onProfile,
  onToggleTheme,
  onUsers,
}: ProyectosPageProps) {
  const [proyectos, setProyectos] = useState<Proyecto[]>([])
  const [miembros, setMiembros] = useState<ProyectoMiembro[]>([])
  const [selectedProyecto, setSelectedProyecto] = useState<Proyecto | null>(null)
  const [formValues, setFormValues] = useState<ProyectoFormValues>(emptyProyectoForm)
  const [miembroForm, setMiembroForm] = useState<MiembroFormValues>(emptyMiembroForm)
  const [searchTerm, setSearchTerm] = useState('')
  const [usuarioFiltro, setUsuarioFiltro] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [isMemberSaving, setIsMemberSaving] = useState(false)
  const [isProjectFormOpen, setIsProjectFormOpen] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  const filteredProyectos = useMemo(() => {
    const value = searchTerm.trim().toLowerCase()

    if (!value) {
      return proyectos
    }

    return proyectos.filter((proyecto) => proyecto.nombre.toLowerCase().includes(value))
  }, [proyectos, searchTerm])

  async function loadProyectos() {
    setIsLoading(true)
    setError('')

    try {
      const usuarioCodigo = usuarioFiltro.trim()
      const data = usuarioCodigo
        ? await listarProyectosPorUsuario(usuarioCodigo)
        : await listarProyectos()

      setProyectos(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar proyectos')
    } finally {
      setIsLoading(false)
    }
  }

  async function loadMiembros(proyectoId: number) {
    setError('')

    try {
      const data = await listarMiembros(proyectoId)
      setMiembros(data)
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : 'No se pudieron cargar miembros')
    }
  }

  useEffect(() => {
    loadProyectos()
  }, [])

  function updateProyectoForm(name: keyof ProyectoFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [name]: name === 'id_rol' ? Number(value) : value,
    }))
  }

  function updateMiembroForm(name: keyof MiembroFormValues, value: string) {
    setMiembroForm((current) => ({
      ...current,
      [name]: name === 'id_rol' ? Number(value) : value,
    }))
  }

  function selectProyecto(proyecto: Proyecto) {
    setSelectedProyecto(proyecto)
    setMessage('')
    setError('')
    setFormValues({
      nombre: proyecto.nombre,
      descripcion: proyecto.descripcion ?? '',
      usuario_codigo: '',
      id_rol: 2,
    })
    loadMiembros(proyecto.id)
    setIsProjectFormOpen(true)
  }

  function resetForm() {
    setSelectedProyecto(null)
    setFormValues(emptyProyectoForm)
    setMiembroForm(emptyMiembroForm)
    setMiembros([])
    setMessage('')
    setError('')
  }

  function openNewProyectoForm() {
    resetForm()
    setFormValues({
      ...emptyProyectoForm,
      usuario_codigo: userProfile?.codigo ?? '',
    })
    setIsProjectFormOpen(true)
  }

  function closeProjectForm() {
    resetForm()
    setIsProjectFormOpen(false)
  }

  async function saveProyecto() {
    setIsSaving(true)
    setMessage('')
    setError('')

    try {
      if (selectedProyecto) {
        await actualizarProyecto(selectedProyecto.id, {
          nombre: formValues.nombre,
          descripcion: formValues.descripcion,
        })
        setMessage('Proyecto actualizado correctamente.')
      } else {
        await crearProyecto({
          nombre: formValues.nombre,
          descripcion: formValues.descripcion,
          usuario_codigo: formValues.usuario_codigo,
          id_rol: formValues.id_rol,
        })
        setMessage('Proyecto creado correctamente.')
      }

      await loadProyectos()
      setSelectedProyecto(null)
      setFormValues(emptyProyectoForm)
      setMiembroForm(emptyMiembroForm)
      setMiembros([])
      setIsProjectFormOpen(false)
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo guardar el proyecto')
    } finally {
      setIsSaving(false)
    }
  }

  async function removeProyecto(proyecto: Proyecto) {
    const confirmed = window.confirm(`Eliminar proyecto "${proyecto.nombre}"?`)

    if (!confirmed) {
      return
    }

    setMessage('')
    setError('')

    try {
      await eliminarProyecto(proyecto.id)
      setMessage('Proyecto eliminado correctamente.')
      await loadProyectos()

      if (selectedProyecto?.id === proyecto.id) {
        resetForm()
        setIsProjectFormOpen(false)
      }
    } catch (deleteError) {
      setError(deleteError instanceof Error ? deleteError.message : 'No se pudo eliminar el proyecto')
    }
  }

  async function saveMiembro() {
    if (!selectedProyecto) {
      setError('Selecciona un proyecto antes de agregar miembros.')
      return
    }

    setIsMemberSaving(true)
    setMessage('')
    setError('')

    try {
      await agregarMiembro(selectedProyecto.id, {
        usuario_codigo: miembroForm.usuario_codigo,
        id_rol: miembroForm.id_rol,
      })
      setMessage('Miembro agregado correctamente.')
      setMiembroForm(emptyMiembroForm)
      await loadMiembros(selectedProyecto.id)
    } catch (memberError) {
      setError(memberError instanceof Error ? memberError.message : 'No se pudo agregar el miembro')
    } finally {
      setIsMemberSaving(false)
    }
  }

  async function removeMiembro(usuarioCodigo: string) {
    if (!selectedProyecto) {
      return
    }

    const confirmed = window.confirm(`Quitar usuario ${usuarioCodigo} del proyecto?`)

    if (!confirmed) {
      return
    }

    setMessage('')
    setError('')

    try {
      await quitarMiembro(selectedProyecto.id, usuarioCodigo)
      setMessage('Miembro quitado correctamente.')
      await loadMiembros(selectedProyecto.id)
    } catch (memberError) {
      setError(memberError instanceof Error ? memberError.message : 'No se pudo quitar el miembro')
    }
  }

  return (
    <main className={`users-page projects-page ${theme === 'light' ? 'users-page-light' : ''}`}>
      <aside className="admin-sidebar" aria-label="Navegacion de administracion">
        <a className="admin-brand" href="#top" onClick={onBack}>
          <span>
            <Database size={20} />
          </span>
          <strong>DrawSchema</strong>
        </a>

        <button className="admin-profile" type="button">
          <span className="admin-avatar">AC</span>
          <span>
            <strong>Admin Console</strong>
            <small>Control global · proyectos</small>
          </span>
          <ChevronDown size={16} />
        </button>

        <nav className="admin-nav">
          <p>Workspace</p>
          <button onClick={onBack} type="button">
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button className="active" type="button">
            <FolderKanban size={18} />
            Workspaces
          </button>
          <button onClick={onUsers} type="button">
            <UsersRound size={18} />
            Usuarios
          </button>
        </nav>

        <AdminSidebarExtras
          theme={theme}
          userProfile={userProfile}
          onProfile={onProfile}
          onToggleTheme={onToggleTheme}
        />

        <button className="sidebar-back" onClick={onBack} type="button">
          <ArrowLeft size={16} /> Volver al sitio
        </button>
      </aside>

      <section className="users-workspace">
        <header className="users-header">
          <div>
            <p>Admin</p>
            <h1>Gestion de proyectos</h1>
          </div>

          <div className="header-actions">
            <button className="ghost-button" onClick={openNewProyectoForm} type="button">
              <Plus size={18} /> Nuevo proyecto
            </button>
            <button className="ghost-button header-back" onClick={onBack} type="button">
              <ArrowLeft size={18} /> Volver
            </button>
          </div>
        </header>

        <section className="projects-content">
          <div className="users-list-panel">
            <div className="users-toolbar projects-toolbar">
              <label className="search-box">
                <Search size={18} />
                <input
                  onChange={(event) => setSearchTerm(event.target.value)}
                  placeholder="Buscar por nombre"
                  value={searchTerm}
                />
              </label>

              <label className="search-box user-filter">
                <input
                  onChange={(event) => setUsuarioFiltro(event.target.value)}
                  placeholder="Codigo de usuario"
                  value={usuarioFiltro}
                />
              </label>

              <button className="ghost-button" onClick={loadProyectos} type="button">
                <RefreshCw size={18} /> Buscar
              </button>
            </div>

                {error ? <p className="users-message error">{error}</p> : null}
                {message ? <p className="users-message success">{message}</p> : null}
            {isLoading ? <p className="users-loading">Cargando proyectos...</p> : null}

            <div className="project-grid">
              {filteredProyectos.map((proyecto) => (
                <article
                  className={
                    selectedProyecto?.id === proyecto.id
                      ? 'project-card selected'
                      : 'project-card'
                  }
                  key={proyecto.id}
                >
                  <button className="project-card-main" onClick={() => selectProyecto(proyecto)} type="button">
                    <span>Proyecto #{proyecto.id}</span>
                    <h2>{proyecto.nombre}</h2>
                    <p>{proyecto.descripcion ?? 'Sin descripcion'}</p>
                    <small>{proyecto.creado_en ?? 'Sin fecha registrada'}</small>
                  </button>

                  <button className="icon-button danger" onClick={() => removeProyecto(proyecto)} type="button">
                    <Trash2 size={16} />
                  </button>
                </article>
              ))}
            </div>

            {filteredProyectos.length === 0 && !isLoading ? (
              <div className="empty-state">No hay proyectos para mostrar.</div>
            ) : null}
          </div>

          {isProjectFormOpen ? (
            <div className="floating-form-backdrop" role="presentation">
              <aside
                aria-label={selectedProyecto ? 'Editar proyecto' : 'Crear proyecto'}
                className="users-form-panel projects-side-panel floating-form-panel project-floating-panel"
              >
                <button
                  aria-label="Cerrar formulario"
                  className="floating-form-close"
                  onClick={closeProjectForm}
                  type="button"
                >
                  <X size={18} />
                </button>

                <form
                  className="users-form"
                  onSubmit={(event) => {
                    event.preventDefault()
                    saveProyecto()
                  }}
                >
                  <div className="panel-title">
                    <div>
                      <p>{selectedProyecto ? 'Editar proyecto' : 'Nuevo proyecto'}</p>
                      <h2>{selectedProyecto ? selectedProyecto.nombre : 'Crear workspace'}</h2>
                    </div>
                    {selectedProyecto ? (
                      <button className="icon-button" onClick={openNewProyectoForm} type="button">
                        <Plus size={18} />
                      </button>
                    ) : null}
                  </div>

                  <label>
                    Nombre
                    <input
                      onChange={(event) => updateProyectoForm('nombre', event.target.value)}
                      placeholder="Sistema de ventas"
                      required
                      value={formValues.nombre}
                    />
                  </label>

                  <label>
                    Descripcion
                    <textarea
                      onChange={(event) => updateProyectoForm('descripcion', event.target.value)}
                      placeholder="Modelo para clientes, productos y ventas"
                      value={formValues.descripcion}
                    />
                  </label>

                  {!selectedProyecto ? (
                    <div className="form-row">
                      <label>
                        Usuario creador
                        <input
                          onChange={(event) => updateProyectoForm('usuario_codigo', event.target.value)}
                          placeholder="U001"
                          required
                          value={formValues.usuario_codigo}
                        />
                      </label>

                      <label>
                        Rol
                        <input
                          min="1"
                          max="5"
                          onChange={(event) => updateProyectoForm('id_rol', event.target.value)}
                          required
                          type="number"
                          value={formValues.id_rol}
                        />
                      </label>
                    </div>
                  ) : null}

                  <button className="primary-action" disabled={isSaving} type="submit">
                    {isSaving ? 'Guardando...' : selectedProyecto ? 'Guardar cambios' : 'Crear proyecto'}
                  </button>
                </form>

                <section className="members-box">
                  <div className="panel-title">
                    <div>
                      <p>Miembros</p>
                      <h2>{selectedProyecto ? 'Equipo del proyecto' : 'Selecciona un proyecto'}</h2>
                    </div>
                  </div>

                  {selectedProyecto ? (
                    <>
                      <div className="member-form">
                        <label>
                          Codigo
                          <input
                            onChange={(event) => updateMiembroForm('usuario_codigo', event.target.value)}
                            placeholder="U002"
                            value={miembroForm.usuario_codigo}
                          />
                        </label>

                        <label>
                          Rol
                          <input
                            min="1"
                            max="5"
                            onChange={(event) => updateMiembroForm('id_rol', event.target.value)}
                            type="number"
                            value={miembroForm.id_rol}
                          />
                        </label>

                        <button className="primary-action" disabled={isMemberSaving} onClick={saveMiembro} type="button">
                          {isMemberSaving ? 'Agregando...' : 'Agregar miembro'}
                        </button>
                      </div>

                      <div className="members-list">
                        {miembros.map((miembro) => (
                          <div className="member-item" key={miembro.usuario_codigo}>
                            <span>{miembro.usuario_codigo}</span>
                            <small>Rol {miembro.id_rol}</small>
                            <button
                              className="icon-button danger"
                              onClick={() => removeMiembro(miembro.usuario_codigo)}
                              type="button"
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        ))}
                      </div>

                      {miembros.length === 0 ? (
                        <div className="empty-state compact">Todavia no hay miembros en este proyecto.</div>
                      ) : null}
                    </>
                  ) : (
                    <p className="panel-note">Guarda el proyecto para agregar miembros despues.</p>
                  )}
                </section>
              </aside>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}
