import { useState, useCallback } from 'react'
import { googleLogout, useGoogleLogin } from '@react-oauth/google'
import { checkSheetAccess } from '../services/sheetAuth'
import type { GoogleProfile, AccessStatus } from '../types/auth'

const STORAGE_KEY = 'google_profile'
const TOKEN_KEY = 'google_access_token'
const TOKEN_EXPIRY_KEY = 'google_token_expiry'

const isTokenExpired = () => {
  const expiry = sessionStorage.getItem(TOKEN_EXPIRY_KEY)
  if (!expiry) return true
  return Date.now() > parseInt(expiry) - 60000 // buffer 1 นาที
}

interface UseGoogleAuthReturn {
  user: GoogleProfile | null
  accessToken: string | null
  status: AccessStatus
  login: () => void
  handleLogout: () => void
}

export function useGoogleAuth(): UseGoogleAuthReturn {
  const [user, setUser] = useState<GoogleProfile | null>(() => {
    try {
      // ถ้า token หมดอายุแล้ว ล้าง session ทิ้งเลย
      if (isTokenExpired()) {
        sessionStorage.removeItem(STORAGE_KEY)
        sessionStorage.removeItem(TOKEN_KEY)
        sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
        return null
      }
      const stored = sessionStorage.getItem(STORAGE_KEY)
      return stored ? JSON.parse(stored) : null
    } catch {
      return null
    }
  })

  const [accessToken, setAccessToken] = useState<string | null>(() => {
    if (isTokenExpired()) return null
    return sessionStorage.getItem(TOKEN_KEY)
  })

  const [status, setStatus] = useState<AccessStatus>(() => {
    try {
      if (isTokenExpired()) return 'idle'
      const stored = sessionStorage.getItem(STORAGE_KEY)
      return stored ? 'allowed' : 'idle'
    } catch {
      return 'idle'
    }
  })

  const handleLogout = useCallback(() => {
    googleLogout()
    sessionStorage.removeItem(STORAGE_KEY)
    sessionStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_EXPIRY_KEY)
    setUser(null)
    setAccessToken(null)
    setStatus('idle')
  }, [])

  const login = useGoogleLogin({
    scope: 'openid email profile https://www.googleapis.com/auth/drive.file',
    onSuccess: async (tokenResponse) => {
      setStatus('loading')
      try {
        const profileRes = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
          headers: { Authorization: `Bearer ${tokenResponse.access_token}` }
        })
        const profile: GoogleProfile = await profileRes.json()

        const { hasAccess } = await checkSheetAccess(profile.email)
        if (hasAccess) {
          // คำนวณเวลาหมดอายุ (expires_in เป็นวินาที ปกติ 3600 = 1 ชั่วโมง)
          const expiresAt = Date.now() + ((tokenResponse.expires_in ?? 3600) * 1000)

          sessionStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
          sessionStorage.setItem(TOKEN_KEY, tokenResponse.access_token)
          sessionStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt))

          // redirect กลับถ้ามาจาก QR
          const redirectUrl = sessionStorage.getItem('redirect_url')
          if (redirectUrl) {
            sessionStorage.removeItem('redirect_url')
            window.location.href = redirectUrl
            return
          }

          setUser(profile)
          setAccessToken(tokenResponse.access_token)
          setStatus('allowed')
        } else {
          setStatus('denied')
        }
      } catch {
        setStatus('error')
      }
    },
    onError: () => setStatus('error')
  })

  return { user, accessToken, status, login, handleLogout }
}