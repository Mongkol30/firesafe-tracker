export const getInspectionUrl = (extinguisherId: string) => {
  const base = window.location.origin
  return `${base}/inspection?extinguisherNo=${extinguisherId}`
}