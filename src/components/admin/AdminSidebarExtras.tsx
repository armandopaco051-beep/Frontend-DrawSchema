import { LogIn, Moon, Sun } from 'lucide-react'
import type { AuthUserProfile } from '../../utils/auth'

type AdminSidebarExtrasProps = {
  theme: 'dark' | 'light'
  userProfile: AuthUserProfile | null
  onProfile: () => void
  onToggleTheme: () => void
}

function getRoleName(userProfile: AuthUserProfile | null) {
  const roleValue = String(userProfile?.idRol || userProfile?.rol || '').toLowerCase()

  if (roleValue === '1' || roleValue.includes('admin')) {
    return 'Administrador'
  }

  if (roleValue === '5' || roleValue.includes('estudiante')) {
    return 'Estudiante'
  }

  return userProfile?.rol || 'Usuario'
}

export function AdminSidebarExtras({
  theme,
  userProfile,
  onProfile,
  onToggleTheme,
}: AdminSidebarExtrasProps) {
  const fullName = [userProfile?.nombres, userProfile?.apellidos].filter(Boolean).join(' ')
  const displayName = fullName || userProfile?.email || userProfile?.codigo || 'Usuario'
  const roleName = getRoleName(userProfile)

  return (
    <div className="sidebar-bottom-stack">
      <button className="sidebar-tone-button" onClick={onToggleTheme} type="button">
        {theme === 'dark' ? <Sun size={17} /> : <Moon size={17} />}
        <span>{theme === 'dark' ? 'Modo claro' : 'Modo oscuro'}</span>
      </button>

      <button className="sidebar-user-card sidebar-user-trigger" onClick={onProfile} type="button">
        <span className="sidebar-user-avatar">{userProfile?.initials ?? 'US'}</span>
        <div>
          <strong>{displayName}</strong>
          <p>{roleName}</p>
        </div>
        <LogIn size={16} />
      </button>
    </div>
  )
}
