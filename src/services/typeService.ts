const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string

export interface ExtinguisherType {
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

export const getTypes = () => post({ action: 'getTypes' })
export const addType = (data: ExtinguisherType) => post({ action: 'addType', ...data })
export const updateType = (data: ExtinguisherType) => post({ action: 'updateType', ...data })
export const deleteType = (id: string) => post({ action: 'deleteType', id })