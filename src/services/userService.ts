const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string

export interface User {
  id: string
  email: string
  firstName: string
  lastName: string
  role: string
  active: boolean
}

const post = async (body: object) => {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export const getUsers = () => post({ action: 'getUsers' })
export const addUser = (data: User) => post({ action: 'addUser', ...data })
export const updateUser = (data: User) => post({ action: 'updateUser', ...data })
export const deleteUser = (id: string) => post({ action: 'deleteUser', id })
export const getUserByEmail = (email: string) => post({ action: 'getUserByEmail', email })