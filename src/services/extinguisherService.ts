const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string

export interface Extinguisher {
  id: string
  extinguisherCode: string
  locationId: string
  locationName: string
  typeId: string
  typeName: string
  lastResult: string        
  lastRefillDate: string
  active: boolean
  lastInspectedDate: string
  lastInspectorName: string
  driveFolderId: string 
  lastRemark: string 
}

export interface ExtinguisherForm {
  id: string
  extinguisherCode: string
  locationId: string
  typeId: string
  lastRefillDate: string
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

export const getExtinguishers = () => post({ action: 'getExtinguishers' })
export const addExtinguisher = (data: ExtinguisherForm) => post({ action: 'addExtinguisher', ...data })
export const updateExtinguisher = (data: ExtinguisherForm) => post({ action: 'updateExtinguisher', ...data })
export const deleteExtinguisher = (id: string) => post({ action: 'deleteExtinguisher', id })