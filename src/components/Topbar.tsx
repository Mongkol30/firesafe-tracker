import { Avatar, Popover, Whisper, Button, Divider } from 'rsuite'
import type { GoogleProfile } from '../types/auth'
import type { User } from '../services/userService'

interface TopbarProps {
  profile: GoogleProfile | null
  currentUser: User | null
  onLogout: () => void
}

const formatDate = () => {
  return new Date().toLocaleDateString('th-TH', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

const getInitials = (user: User | null, profile: GoogleProfile | null) => {
  if (user?.firstName && user?.lastName) {
    return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase()
  }
  if (profile?.name) return profile.name[0].toUpperCase()
  return '?'
}

const getDisplayName = (user: User | null, profile: GoogleProfile | null) => {
  if (user?.firstName && user?.lastName) return `${user.firstName} ${user.lastName}`
  if (profile?.name) return profile.name
  return profile?.email ?? ''
}

export default function Topbar({ profile, currentUser, onLogout }: TopbarProps) {
  const displayName = getDisplayName(currentUser, profile)
  const initials = getInitials(currentUser, profile)

  const speaker = (
    <Popover style={{ minWidth: 200 }}>
      <div style={{ padding: '4px 0' }}>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{displayName}</div>
        <div style={{ color: '#888', fontSize: 13, marginTop: 2 }}>{profile?.email}</div>
        {currentUser?.role && (
          <div style={{
            display: 'inline-block',
            marginTop: 8,
            padding: '2px 10px',
            background: '#fef2f2',
            color: '#ba0b1b',
            borderRadius: 20,
            fontSize: 12,
            fontWeight: 500
          }}>
            {currentUser.role}
          </div>
        )}
      </div>
      <Divider style={{ margin: '10px 0' }} />
      <Button
        block
        appearance="subtle"
        color="red"
        onClick={onLogout}
        style={{ color: '#ba0b1b' }}
      >
        ออกจากระบบ
      </Button>
    </Popover>
  )

  return (
    <div style={{
      background: 'white',
      padding: '12px 24px',
      borderRadius: '12px',
      marginBottom: '20px',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      boxShadow: '0 1px 4px rgba(0,0,0,0.06)',
    }}>
      <div>
        <div style={{ fontSize: 13, color: '#888' }}>วันนี้</div>
        <div style={{ fontWeight: 600, fontSize: 15 }}>{formatDate()}</div>
      </div>

      <Whisper placement="bottomEnd" trigger="click" speaker={speaker}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontWeight: 600, fontSize: 14 }}>{displayName}</div>
            {currentUser?.role && (
              <div style={{ fontSize: 12, color: '#888' }}>{currentUser.role}</div>
            )}
          </div>
          <Avatar
            circle
            style={{ background: '#ba0b1b', color: 'white', fontWeight: 600, cursor: 'pointer' }}
          >
            {initials}
          </Avatar>
        </div>
      </Whisper>
    </div>
  )
}