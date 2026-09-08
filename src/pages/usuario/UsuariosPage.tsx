import { useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  Database,
  FolderKanban,
  LayoutDashboard,
  Plus,
  RefreshCw,
  Search,
  UsersRound,
  X,
} from 'lucide-react'
import { AdminSidebarExtras } from '../../components/admin/AdminSidebarExtras'
import { UsuarioForm } from '../../components/usuarios/UsuarioForm'
import { UsuariosTable } from '../../components/usuarios/UsuariosTable'
import { useUsuariosController } from '../../controllers/useUsuariosController'
import type { AuthUserProfile } from '../../utils/auth'
import './UsuariosPage.css'

type UsuariosPageProps = {
  theme: 'dark' | 'light'
  userProfile: AuthUserProfile | null
  onBack: () => void
  onProfile: () => void
  onProjects: () => void
  onToggleTheme: () => void
}

export function UsuariosPage({
  theme,
  userProfile,
  onBack,
  onProfile,
  onProjects,
  onToggleTheme,
}: UsuariosPageProps) {
  const usuarios = useUsuariosController()
  const [isFormOpen, setIsFormOpen] = useState(false)

  function openNewUserForm() {
    usuarios.resetForm()
    setIsFormOpen(true)
  }

  function editUser(usuario: Parameters<typeof usuarios.selectUsuario>[0]) {
    usuarios.selectUsuario(usuario)
    setIsFormOpen(true)
  }

  async function saveUser() {
    await usuarios.saveUsuario()
    setIsFormOpen(false)
  }

  function closeForm() {
    usuarios.resetForm()
    setIsFormOpen(false)
  }

  return (
    <main className={`users-page ${theme === 'light' ? 'users-page-light' : ''}`}>
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
            <small>Control global - 12 workspaces</small>
          </span>
          <ChevronDown size={16} />
        </button>

        <nav className="admin-nav">
          <p>Workspace</p>
          <button onClick={onBack} type="button">
            <LayoutDashboard size={18} />
            Dashboard
          </button>
          <button onClick={onProjects} type="button">
            <FolderKanban size={18} />
            Workspaces
          </button>
          <button className="active" type="button">
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
            <h1>Gestion de usuarios</h1>
          </div>

          <div className="header-actions">
            <button className="ghost-button" onClick={openNewUserForm} type="button">
              <Plus size={18} /> Nuevo usuario
            </button>
            <button className="ghost-button header-back" onClick={onBack} type="button">
              <ArrowLeft size={18} /> Volver
            </button>
          </div>
        </header>

        <section className="users-content">
          <div className="users-list-panel">
            <div className="users-toolbar">
              <label className="search-box">
                <Search size={18} />
                <input
                  onChange={(event) => usuarios.setSearchTerm(event.target.value)}
                  placeholder="Buscar por codigo, nombre o email"
                  value={usuarios.searchTerm}
                />
              </label>

              <button className="ghost-button" onClick={usuarios.loadUsuarios} type="button">
                <RefreshCw size={18} /> Recargar
              </button>
            </div>

            {usuarios.error ? <p className="users-message error">{usuarios.error}</p> : null}
            {usuarios.message ? <p className="users-message success">{usuarios.message}</p> : null}
            {usuarios.isLoading ? <p className="users-loading">Cargando usuarios...</p> : null}

            <UsuariosTable
              onDelete={usuarios.removeUsuario}
              onEdit={editUser}
              usuarios={usuarios.filteredUsuarios}
            />
          </div>

          {isFormOpen ? (
            <div className="floating-form-backdrop" role="presentation">
              <aside
                aria-label={usuarios.selectedUser ? 'Editar usuario' : 'Crear usuario'}
                className="users-form-panel floating-form-panel"
              >
                <button
                  aria-label="Cerrar formulario"
                  className="floating-form-close"
                  onClick={closeForm}
                  type="button"
                >
                  <X size={18} />
                </button>
              <UsuarioForm
                formValues={usuarios.formValues}
                isSaving={usuarios.isSaving}
                onChange={usuarios.updateFormValue}
                onSubmit={saveUser}
                selectedUser={usuarios.selectedUser}
              />
              </aside>
            </div>
          ) : null}
        </section>
      </section>
    </main>
  )
}
