export const formatDate = (dateStr: string | null | undefined): string => {
  if (!dateStr) return '-'

  // yyyy-MM-dd
  if (/^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-')
    return `${d}/${m}/${y}`
  }

  // ISO string "2026-05-06T17:00:00.000Z"
  if (dateStr.includes('T')) {
    const [datePart] = dateStr.split('T')
    const [y, m, d] = datePart.split('-')
    return `${d}/${m}/${y}`
  }

  // "5/31/2026, 9:39:12 AM" หรือ format อื่น → ให้ Date parse
  const date = new Date(dateStr)
  if (!isNaN(date.getTime())) {
    const d = String(date.getDate()).padStart(2, '0')
    const m = String(date.getMonth() + 1).padStart(2, '0')
    const y = date.getFullYear()
    return `${d}/${m}/${y}`
  }

  return dateStr
}