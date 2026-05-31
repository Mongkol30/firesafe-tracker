import Sidebar from '../components/Sidebar'
import Topbar from '../components/Topbar'
import type { GoogleProfile } from '../types/auth'
import type { User } from '../services/userService'

type Props = {
  children: React.ReactNode
  profile: GoogleProfile | null
  currentUser: User | null
  onLogout: () => void
}

function MainLayout({ children, profile, currentUser, onLogout }: Props) {
  return (
    <div style={{ display: 'flex', overflow: 'hidden' }}>
      <Sidebar />
      <div style={{
        flex: 1,
        padding: '20px',
        background: '#f3f4f6',
        minHeight: '100vh'
      }}>
        <Topbar profile={profile} currentUser={currentUser} onLogout={onLogout} />
        {children}
      </div>
    </div>
  )
}

export default MainLayout