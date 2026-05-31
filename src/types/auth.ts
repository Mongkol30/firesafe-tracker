export interface GoogleProfile {
  email: string
  name: string
  picture: string
  sub: string
}

export interface AccessResponse {
  hasAccess: boolean
  error?: string
}

export type AccessStatus = 'idle' | 'loading' | 'allowed' | 'denied' | 'error'