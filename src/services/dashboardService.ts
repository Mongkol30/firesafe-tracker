const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string

export interface DashboardSummary {
  total: number
  inspectedThisMonth: number
  passedThisMonth: number
  failedThisMonth: number
}

export interface MonthlyData {
  month: string
  pass: number
  fail: number
}

export interface UrgentItem {
  id: string
  extinguisherCode: string
  locationName: string
  typeName: string
  lastResult: string
  lastInspectedDate: string
  lastInspectorName: string
  lastRemark: string
  driveFolderId: string
  reason: string
  timestamp: string
  inspectorName: string
  tankCondition: string
  hoseCondition: string
  pressureGauge: string
  noObstruction: string
  sealCondition: string
  labelVisible: string
  remark: string
  photoUrls: string
}

export interface ExtinguisherListItem {
  id: string
  extinguisherCode: string
  locationId: string
  locationName: string
  typeId: string
  typeName: string
  lastResult: string
  lastRefillDate: string
  lastInspectedDate: string
  lastInspectorName: string
  lastRemark: string
}

export interface RecentInspection {
  timestamp: string
  inspectorName: string
  extinguisherNo: string
  extinguisherCode: string
  locationName: string
  typeName: string
  driveFolderId: string
  tankCondition: string
  hoseCondition: string
  pressureGauge: string
  noObstruction: string
  sealCondition: string
  labelVisible: string
  result: string
  remark: string
  photoUrls: string
}

export interface DashboardData {
  summary: DashboardSummary
  monthly: MonthlyData[]
  urgentList: UrgentItem[]
  extinguisherList: ExtinguisherListItem[]
  recentInspections: RecentInspection[]
}

const post = async (body: object) => {
  const res = await fetch(APPS_SCRIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(body),
  })
  return res.json()
}

export const getDashboard = async (): Promise<DashboardData> => {
  const res = await post({ action: 'getDashboard' })
  return {
    summary: res.summary ?? defaultSummary,
    monthly: res.monthly ?? [],
    urgentList: res.urgentList ?? [],
    extinguisherList: res.extinguisherList ?? [],
    recentInspections: res.recentInspections ?? [],
  }
}

const defaultSummary = {
  total: 0,
  inspectedThisMonth: 0,
  passedThisMonth: 0,
  failedThisMonth: 0,
}