import type { AuthUserProfile } from '../../utils/auth'
import { AiPlannerPanel } from '../../features/ai/AiPlannerPanel'
import './ia.css'

type IAPageProps = {
  theme: 'dark' | 'light'
  userProfile: AuthUserProfile | null
}

export function IAPage({ theme, userProfile }: IAPageProps) {
  return (
    <main className={`ia-page ${theme === 'light' ? 'ia-page-light' : ''}`}>
      <section className="ia-workspace">
        <div className="ia-main-panel">
          <p>IA</p>
          <h1>Planner Agent</h1>
          <span>{userProfile?.email ?? 'Sesion activa'}</span>
        </div>

        <aside className="ia-side-panel">
          <AiPlannerPanel />
        </aside>
      </section>
    </main>
  )
}

export default IAPage
