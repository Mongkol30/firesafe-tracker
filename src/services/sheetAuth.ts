import type { AccessResponse } from '../types/auth'

const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string

export async function checkSheetAccess(email: string): Promise<AccessResponse> {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' }, // Apps Script ต้องการ text/plain
    body: JSON.stringify({ action: 'checkAccess', email }),
  })

  if (!res.ok) throw new Error(`HTTP error: ${res.status}`)

  const data: AccessResponse = await res.json()
  return data
}