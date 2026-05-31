export const uploadFileToDrive = async (
  file: File,
  folderId: string,
  accessToken: string
): Promise<string> => {
  const metadata = {
    name: file.name,
    parents: [folderId],
  }

  const form = new FormData()
  form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }))
  form.append('file', file)

  const res = await fetch('https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart', {
    method: 'POST',
    headers: { Authorization: `Bearer ${accessToken}` },
    body: form,
  })

  if (!res.ok) throw new Error(`Upload failed: ${res.status}`)

  const data = await res.json()
  return data.id // return fileId
}

export const getFileUrl = (fileId: string) =>
  `https://drive.google.com/file/d/${fileId}/view`


export const fetchImageAsBlob = async (
  fileId: string,
  accessToken: string
): Promise<string> => {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } }
  )
  if (!res.ok) throw new Error(`Fetch image failed: ${res.status}`)
  const blob = await res.blob()
  return URL.createObjectURL(blob)
}