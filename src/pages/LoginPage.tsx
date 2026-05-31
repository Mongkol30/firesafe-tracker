import { Panel, Stack, Button, Message } from 'rsuite'
import type { AccessStatus } from '../types/auth'

interface LoginPageProps {
  onLogin: () => void
  onLogout: () => void
  status: AccessStatus
  email?: string
}

export default function LoginPage({ onLogin, onLogout, status, email }: LoginPageProps) {

  const renderBody = () => {
    if (status === 'loading') {
      return (
        <Stack justifyContent="center" alignItems="center" style={{ minHeight: 80 }}>
          <div style={{ textAlign: 'center', color: '#888', fontSize: 14 }}>กำลังตรวจสิทธิ์...</div>
        </Stack>
      )
    }

    if (status === 'denied') {
      return (
        <Stack direction="column" spacing={16} alignItems="stretch">
          <Message type="error" showIcon>
            <strong>{email}</strong> ไม่มีสิทธิ์เข้าถึงระบบ
          </Message>
          <Button block appearance="subtle" onClick={onLogout}
            style={{ borderColor: '#ba0b1b', color: '#ba0b1b' }}>
            ลองบัญชีอื่น
          </Button>
        </Stack>
      )
    }

    if (status === 'error') {
      return (
        <Stack direction="column" spacing={16} alignItems="stretch">
          <Message type="warning" showIcon>
            เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง
          </Message>
          <Button block appearance="subtle" onClick={onLogout}
            style={{ borderColor: '#ba0b1b', color: '#ba0b1b' }}>
            ลองใหม่
          </Button>
        </Stack>
      )
    }

    return (
      <Stack justifyContent="center">
        <button
          onClick={onLogin}
          style={{
            display: 'flex', alignItems: 'center', gap: 12,
            padding: '10px 16px', border: '1px solid #dadce0',
            borderRadius: 8, background: 'white', cursor: 'pointer',
            fontSize: 14, fontWeight: 500, color: '#3c4043'
          }}
        >
          <svg width="20" height="20" viewBox="0 0 48 48">
            <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.08 17.74 9.5 24 9.5z"/>
            <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"/>
            <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"/>
            <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.18 1.48-4.97 2.31-8.16 2.31-6.26 0-11.57-3.59-13.46-8.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/>
          </svg>
          เข้าสู่ระบบด้วย Google
        </button>
      </Stack>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#f5f5f5',
    }}>
      <Panel style={{ width: 400, padding: 0, overflow: 'hidden', borderRadius: 12 }} bordered>
        <div style={{
          background: '#ba0b1b',
          padding: '2.5rem 2rem 2rem',
          textAlign: 'center',
        }}>
          <div style={{
            width: 56, height: 56, background: 'white', borderRadius: '50%',
            margin: '0 auto 1rem', display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="#ba0b1b"
              strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <path d="M3 9h18M3 15h18M9 3v18"/>
            </svg>
          </div>
          <p style={{ color: 'white', fontSize: 20, fontWeight: 500, margin: '0 0 4px' }}>
            ยินดีต้อนรับ
          </p>
          <p style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13, margin: 0 }}>
            กรุณาเข้าสู่ระบบด้วยบัญชี Google
          </p>
        </div>

        <div style={{ padding: '2rem', background: 'white', minHeight: 140 }}>
          {renderBody()}
          <div style={{
            marginTop: '1.5rem', paddingTop: '1.5rem',
            borderTop: '1px solid #f0f0f0', textAlign: 'center',
          }}>
            <p style={{ fontSize: 12, color: '#888', margin: 0, lineHeight: 1.6 }}>
              เฉพาะผู้ที่ได้รับสิทธิ์เข้าถึงเท่านั้น<br />
              ระบบจะตรวจสอบสิทธิ์จาก Google Sheets
            </p>
          </div>
        </div>
      </Panel>
    </div>
  )
}