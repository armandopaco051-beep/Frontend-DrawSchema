import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ChevronDown,
  Database,
  FolderKanban,
  LayoutDashboard,
  Save,
  UserRound,
  UsersRound,
} from 'lucide-react'
import { AdminSidebarExtras } from '../../components/admin/AdminSidebarExtras'
import type { UsuarioUpdate } from '../../models/usuario'
import { actualizarUsuario, obtenerUsuario } from '../../services/usuarioService'
import type { AuthUserProfile } from '../../utils/auth'
import { buildUserProfileFromData } from '../../utils/auth'
import '../usuario/UsuariosPage.css'
import './PerfilPage.css'

type PerfilPageProps = {
  isStudentProfile: boolean
  theme: 'dark' | 'light'
  userProfile: AuthUserProfile | null
  onBack: () => void
  onProjects: () => void
  onStudentHome: () => void
  onToggleTheme: () => void
  onUsers: () => void
  onProfileUpdated: (profile: AuthUserProfile) => void
}

type PerfilFormValues = {
  codigo: string
  nombres: string
  apellidos: string
  email: string
  pais: string
  id_rol: number
  password: string
}

function createInitialForm(userProfile: AuthUserProfile | null): PerfilFormValues {
  return {
    codigo: userProfile?.codigo ?? '',
    nombres: userProfile?.nombres ?? '',
    apellidos: userProfile?.apellidos ?? '',
    email: userProfile?.email ?? '',
    pais: userProfile?.pais ?? '',
    id_rol: Number(userProfile?.idRol || 5),
    password: '',
  }
}

function roleLabel(idRol: number) {
  if (idRol === 1) {
    return 'Administrador'
  }

  if (idRol === 5) {
    return 'Estudiante'
  }

  return `Rol ${idRol}`
}

export function PerfilPage({
  isStudentProfile,
  theme,
  userProfile,
  onBack,
  onProfileUpdated,
  onProjects,
  onStudentHome,
  onToggleTheme,
  onUsers,
}: PerfilPageProps) {
  const [formValues, setFormValues] = useState<PerfilFormValues>(() => createInitialForm(userProfile))
  const [isLoading, setIsLoading] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')

  useEffect(() => {
    async function loadProfile() {
      if (!userProfile?.codigo) {
        return
      }

      setIsLoading(true)
      setError('')

      try {
        const usuario = await obtenerUsuario(userProfile.codigo)

        setFormValues({
          codigo: usuario.codigo,
          nombres: usuario.nombres,
          apellidos: usuario.apellidos,
          email: usuario.email,
          pais: usuario.pais,
          id_rol: usuario.id_rol,
          password: '',
        })
      } catch (loadError) {
        setError(loadError instanceof Error ? loadError.message : 'No se pudo cargar tu perfil')
      } finally {
        setIsLoading(false)
      }
    }

    loadProfile()
  }, [userProfile?.codigo])

  function updateFormValue(name: keyof PerfilFormValues, value: string) {
    setFormValues((current) => ({
      ...current,
      [name]: name === 'id_rol' ? Number(value) : value,
    }))
  }

  async function saveProfile() {
    if (!formValues.codigo) {
      setError('No se encontro el codigo de tu usuario.')
      return
    }

    setIsSaving(true)
    setMessage('')
    setError('')

    const payload: UsuarioUpdate = {
      nombres: formValues.nombres,
      apellidos: formValues.apellidos,
      email: formValues.email,
      pais: formValues.pais,
    }

    if (formValues.password.trim()) {
      payload.password = formValues.password
    }

    try {
      const updatedUser = await actualizarUsuario(formValues.codigo, payload)

      setFormValues({
        codigo: updatedUser.codigo,
        nombres: updatedUser.nombres,
        apellidos: updatedUser.apellidos,
        email: updatedUser.email,
        pais: updatedUser.pais,
        id_rol: updatedUser.id_rol,
        password: '',
      })
      onProfileUpdated(buildUserProfileFromData(updatedUser))
      setMessage('Perfil actualizado correctamente.')
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : 'No se pudo actualizar tu perfil')
    } finally {
      setIsSaving(false)
    }
  }

  return (
    <main className={`users-page profile-page ${theme === 'light' ? 'users-page-light' : ''}`}>
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
            <strong>{isStudentProfile ? 'Student Console' : 'Admin Console'}</strong>
            <small>{isStudentProfile ? 'Mis proyectos y diagramas' : 'Control global - 12 workspaces'}</small>
          </span>
          <ChevronDown size={16} />
        </button>

        <nav className="admin-nav">
          <p>Workspace</p>
          {isStudentProfile ? (
            <button onClick={onStudentHome} type="button">
              <FolderKanban size={18} />
              Mis proyectos
            </button>
          ) : (
            <>
              <button onClick={onBack} type="button">
                <LayoutDashboard size={18} />
                Dashboard
              </button>
              <button onClick={onProjects} type="button">
                <FolderKanban size={18} />
                Workspaces
              </button>
              <button onClick={onUsers} type="button">
                <UsersRound size={18} />
                Usuarios
              </button>
            </>
          )}
          <button className="active" type="button">
            <UserRound size={18} />
            Mi perfil
          </button>
        </nav>

        <AdminSidebarExtras
          theme={theme}
          userProfile={userProfile}
          onProfile={() => undefined}
          onToggleTheme={onToggleTheme}
        />

        <button className="sidebar-back" onClick={onBack} type="button">
          <ArrowLeft size={16} /> Volver al sitio
        </button>
      </aside>

      <section className="users-workspace">
        <header className="users-header">
          <div>
            <p>Cuenta</p>
            <h1>Mi perfil</h1>
          </div>

          <button
            className="ghost-button header-back"
            onClick={isStudentProfile ? onStudentHome : onUsers}
            type="button"
          >
            <ArrowLeft size={18} /> Volver
          </button>
        </header>

        <section className="profile-content">
          <article className="profile-summary">
            <span className="profile-avatar">{userProfile?.initials ?? 'US'}</span>
            <p>{roleLabel(formValues.id_rol)}</p>
            <h2>
              {[formValues.nombres, formValues.apellidos].filter(Boolean).join(' ') || 'Usuario'}
            </h2>
            <small>{formValues.email || 'Sin email registrado'}</small>
          </article>

          <form
            className="users-form profile-form"
            onSubmit={(event) => {
              event.preventDefault()
              saveProfile()
            }}
          >
            <div className="panel-title">
              <div>
                <p>Datos personales</p>
                <h2>Editar informacion</h2>
              </div>
            </div>

            {isLoading ? <p className="users-loading">Cargando perfil...</p> : null}
            {error ? <p className="users-message error">{error}</p> : null}
            {message ? <p className="users-message success">{message}</p> : null}

            <div className="form-row two-columns">
              <label>
                Codigo
                <input disabled value={formValues.codigo} />
              </label>

              <label>
                Rol
                <input disabled value={roleLabel(formValues.id_rol)} />
              </label>
            </div>

            <div className="form-row two-columns">
              <label>
                Nombres
                <input
                  onChange={(event) => updateFormValue('nombres', event.target.value)}
                  required
                  value={formValues.nombres}
                />
              </label>

              <label>
                Apellidos
                <input
                  onChange={(event) => updateFormValue('apellidos', event.target.value)}
                  required
                  value={formValues.apellidos}
                />
              </label>
            </div>

            <label>
              Email
              <input
                onChange={(event) => updateFormValue('email', event.target.value)}
                required
                type="email"
                value={formValues.email}
              />
            </label>

            <label>
              Pais
              <input
                onChange={(event) => updateFormValue('pais', event.target.value)}
                required
                value={formValues.pais}
              />
            </label>

            <label>
              Nueva password
              <input
                minLength={6}
                onChange={(event) => updateFormValue('password', event.target.value)}
                placeholder="Dejar vacio para mantener la actual"
                type="password"
                value={formValues.password}
              />
            </label>

            <button className="primary-action" disabled={isSaving} type="submit">
              <Save size={18} />
              {isSaving ? 'Guardando...' : 'Guardar perfil'}
            </button>
          </form>
        </section>
      </section>
    </main>
  )
}
