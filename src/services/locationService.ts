const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string

export interface Location {
  id: string
  code: string
  name: string
  remark: string
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

export const getLocations = () => post({ action: 'getLocations' })
export const addLocation = (data: Location) => post({ action: 'addLocation', ...data })
export const updateLocation = (data: Location) => post({ action: 'updateLocation', ...data })
export const deleteLocation = (id: string) => post({ action: 'deleteLocation', id })