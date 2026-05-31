import { useState, useEffect } from 'react'
import { getUserByEmail, type User } from '../services/userService'
import type { GoogleProfile } from '../types/auth'

export function useCurrentUser(profile: GoogleProfile | null) {
  const [currentUser, setCurrentUser] = useState<User | null>(null)

  useEffect(() => {
    if (!profile?.email) return
    getUserByEmail(profile.email).then(res => {
      setCurrentUser(res.user)
    })
  }, [profile?.email])

  return currentUser
}