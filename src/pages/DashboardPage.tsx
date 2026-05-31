import { useEffect, useState } from 'react'
import { Table, Tag, Loader, SelectPicker } from 'rsuite'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer
} from 'recharts'
import {
  getDashboard, type DashboardData, type RecentInspection, type UrgentItem
} from '../services/dashboardService'
import { formatDate } from '../utils/formatDate'
import InspectionDetailModal from '../components/InspectionDetailModal'

const { Column, HeaderCell, Cell: TableCell } = Table
const COLORS = { pass: '#16a34a', fail: '#ba0b1b' }

const defaultData: DashboardData = {
  summary: { total: 0, inspectedThisMonth: 0, passedThisMonth: 0, failedThisMonth: 0 },
  monthly: [],
  urgentList: [],
  extinguisherList: [],
  recentInspections: []
}

interface Props {
  accessToken: string | null
}

const urgentToInspection = (item: UrgentItem): RecentInspection => ({
  timestamp:        item.timestamp,
  inspectorName:    item.inspectorName,
  extinguisherNo:   String(item.id),
  extinguisherCode: item.extinguisherCode,
  locationName:     item.locationName,
  typeName:         item.typeName,
  driveFolderId:    item.driveFolderId,
  tankCondition:    item.tankCondition,
  hoseCondition:    item.hoseCondition,
  pressureGauge:    item.pressureGauge,
  noObstruction:    item.noObstruction,
  sealCondition:    item.sealCondition,
  labelVisible:     item.labelVisible,
  result:           item.lastResult,
  remark:           item.remark,
  photoUrls:        item.photoUrls
})

export default function DashboardPage({ accessToken }: Props) {
  const [data, setData] = useState<DashboardData>(defaultData)
  const [loading, setLoading] = useState(true)
  const [selectedInspection, setSelectedInspection] = useState<RecentInspection | null>(null)
  const [selectedUrgent, setSelectedUrgent] = useState<UrgentItem | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const [filterMonth, setFilterMonth] = useState<string | null>(null)
  const [filterInspLocation, setFilterInspLocation] = useState<string | null>(null)
  const [filterInspType, setFilterInspType] = useState<string | null>(null)
  const [filterInspResult, setFilterInspResult] = useState<string | null>(null)
  const pageSize = 10

  useEffect(() => {
    getDashboard()
      .then(res => setData(res))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
        <Loader size="lg" content="กำลังโหลด..." vertical />
      </div>
    )
  }

  const { summary, monthly, urgentList, recentInspections } = data

  const pct = (val: number) =>
    summary.total > 0 ? ((val / summary.total) * 100).toFixed(1) : '0.0'

  const cards = [
    {
      title: 'ถังทั้งหมด', value: summary.total,
      sub: 'ถังที่ใช้งานอยู่', color: '#1a1a2e', icon: '🧯'
    },
    {
      title: 'ตรวจแล้วเดือนนี้', value: summary.inspectedThisMonth,
      sub: `${pct(summary.inspectedThisMonth)}% ของทั้งหมด`, color: '#0369a1', icon: '📋'
    },
    {
      title: 'ผ่านเดือนนี้', value: summary.passedThisMonth,
      sub: `จาก ${summary.inspectedThisMonth} ถังที่ตรวจ`, color: '#16a34a', icon: '✅'
    },
    {
      title: 'ไม่ผ่านเดือนนี้', value: summary.failedThisMonth,
      sub: `จาก ${summary.inspectedThisMonth} ถังที่ตรวจ`, color: '#ba0b1b', icon: '❌'
    },
  ]

  const pieData = [
    { name: 'PASS', value: summary.passedThisMonth },
    { name: 'FAIL', value: summary.failedThisMonth },
  ]

  const formatMonth = (month: string) => {
    const [y, m] = month.split('-')
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    return `${monthNames[parseInt(m) - 1]} ${parseInt(y) + 543}`
  }

  const monthOptions = [...new Set(recentInspections.map(r => {
    const d = new Date(r.timestamp)
    return isNaN(d.getTime()) ? null :
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
  }).filter(Boolean))].map(m => ({
    label: formatMonth(m!), value: m!
  }))

  const inspLocationOptions = [...new Set(recentInspections.map(r => r.locationName).filter(Boolean))]
    .map(l => ({ label: l, value: l }))

  const inspTypeOptions = [...new Set(recentInspections.map(r => r.typeName).filter(Boolean))]
    .map(t => ({ label: t, value: t }))

  const inspResultOptions = [
    { label: 'PASS', value: 'PASS' },
    { label: 'FAIL', value: 'FAIL' },
  ]

  const handleFilterChange = (setter: (v: any) => void) => (v: any) => {
    setter(v)
    setCurrentPage(1)
  }

  const filteredInspections = recentInspections.filter(r => {
    const d = new Date(r.timestamp)
    const monthKey = isNaN(d.getTime()) ? '' :
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
    return (
      (!filterMonth || monthKey === filterMonth) &&
      (!filterInspLocation || r.locationName === filterInspLocation) &&
      (!filterInspType || r.typeName === filterInspType) &&
      (!filterInspResult || r.result === filterInspResult)
    )
  })

  const totalPages = Math.ceil(filteredInspections.length / pageSize)
  const pagedInspections = filteredInspections.slice(
    (currentPage - 1) * pageSize, currentPage * pageSize
  )

  const sectionStyle: React.CSSProperties = {
    background: 'white', borderRadius: 12,
    padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    marginBottom: 16
  }

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>Dashboard</h2>

      {/* Summary Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
        gap: 12, marginBottom: 16
      }}>
        {cards.map(card => (
          <div key={card.title} style={{
            background: 'white', borderRadius: 12, padding: '16px',
            boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
            borderTop: `4px solid ${card.color}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span style={{ fontSize: 20 }}>{card.icon}</span>
              <span style={{ fontSize: 12, color: '#6b7280' }}>{card.title}</span>
            </div>
            <div style={{ fontSize: 28, fontWeight: 700, color: card.color }}>{card.value}</div>
            <div style={{ fontSize: 11, color: card.color, marginTop: 4, fontWeight: 500 }}>
              {card.sub}
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
        gap: 16, marginBottom: 16
      }}>
        <div style={sectionStyle}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>ผลตรวจย้อนหลัง 6 เดือน</div>
          {monthly.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem' }}>ไม่มีข้อมูล</div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={monthly.map(m => ({ ...m, month: formatMonth(m.month) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="pass" name="PASS" fill={COLORS.pass} radius={[4, 4, 0, 0]} />
                <Bar dataKey="fail" name="FAIL" fill={COLORS.fail} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        <div style={sectionStyle}>
          <div style={{ fontWeight: 600, marginBottom: 16 }}>สัดส่วน PASS / FAIL เดือนนี้</div>
          {summary.passedThisMonth === 0 && summary.failedThisMonth === 0 ? (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem' }}>
              ยังไม่มีการตรวจเดือนนี้
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData} cx="50%" cy="50%"
                  innerRadius={55} outerRadius={80}
                  paddingAngle={4} dataKey="value"
                  label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
                >
                  <Cell fill={COLORS.pass} />
                  <Cell fill={COLORS.fail} />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* Urgent List */}
      <div style={sectionStyle}>
        <div style={{
          fontWeight: 600, marginBottom: 16,
          display: 'flex', alignItems: 'center', gap: 8
        }}>
          <span>⚠️ รายการที่ต้องดำเนินการ</span>
          {urgentList.length > 0 && (
            <span style={{
              background: '#ba0b1b', color: 'white',
              borderRadius: 20, fontSize: 12, padding: '2px 10px', fontWeight: 500
            }}>
              {urgentList.length} รายการ
            </span>
          )}
        </div>
        <div style={{ overflowX: 'auto' }}>
          <Table
            data={urgentList} autoHeight bordered cellBordered
            onRowClick={row => setSelectedUrgent(row as UrgentItem)}
            style={{ cursor: 'pointer' }}
          >
            <Column width={80}>
              <HeaderCell>ID</HeaderCell>
              <TableCell dataKey="id" />
            </Column>
            <Column width={120}>
              <HeaderCell>รหัสถัง</HeaderCell>
              <TableCell dataKey="extinguisherCode" />
            </Column>
            <Column flexGrow={1} minWidth={130}>
              <HeaderCell>สาเหตุ</HeaderCell>
              <TableCell>
                {(rowData: any) => <Tag color="red">{rowData.reason}</Tag>}
              </TableCell>
            </Column>
            <Column width={110}>
              <HeaderCell>ผลตรวจ</HeaderCell>
              <TableCell>
                {(rowData: any) => (
                  <Tag color={rowData.lastResult === 'PASS' ? 'green' : 'red'}>
                    {rowData.lastResult}
                  </Tag>
                )}
              </TableCell>
            </Column>
            <Column width={120}>
              <HeaderCell>ตรวจล่าสุด</HeaderCell>
              <TableCell>{(rowData: any) => formatDate(rowData.lastInspectedDate)}</TableCell>
            </Column>
            <Column minWidth={120} flexGrow={1}>
              <HeaderCell>ผู้ตรวจล่าสุด</HeaderCell>
              <TableCell dataKey="lastInspectorName" />
            </Column>
            <Column minWidth={160} flexGrow={2}>
              <HeaderCell>หมายเหตุ</HeaderCell>
              <TableCell>
                {(rowData: any) => (
                  <span style={{ color: rowData.lastRemark ? '#444' : '#aaa', fontSize: 13 }}>
                    {rowData.lastRemark || '-'}
                  </span>
                )}
              </TableCell>
            </Column>
            <Column width={60}>
              <HeaderCell>{''}</HeaderCell>
              <TableCell>
                {() => <span style={{ color: '#ba0b1b', fontSize: 13 }}>ดู →</span>}
              </TableCell>
            </Column>
          </Table>
          {urgentList.length === 0 && (
            <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem' }}>
              ✅ ไม่มีรายการที่ต้องดำเนินการ
            </div>
          )}
        </div>
      </div>

      {/* Recent Inspections */}
      <div style={sectionStyle}>
        <div style={{ fontWeight: 600, marginBottom: 16 }}>🕐 ประวัติการตรวจ</div>

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))',
          gap: 8, marginBottom: 12
        }}>
          <SelectPicker
            data={monthOptions} placeholder="เดือน"
            value={filterMonth} onChange={handleFilterChange(setFilterMonth)} block
          />
          <SelectPicker
            data={inspLocationOptions} placeholder="ตำแหน่ง"
            value={filterInspLocation} onChange={handleFilterChange(setFilterInspLocation)} block
          />
          <SelectPicker
            data={inspTypeOptions} placeholder="ประเภทถัง"
            value={filterInspType} onChange={handleFilterChange(setFilterInspType)} block
          />
          <SelectPicker
            data={inspResultOptions} placeholder="ผลตรวจ"
            value={filterInspResult} onChange={handleFilterChange(setFilterInspResult)} block
          />
        </div>

        <div style={{ fontSize: 12, color: '#888', marginBottom: 8 }}>
          แสดง {filteredInspections.length} รายการ
        </div>

        <div style={{ overflowX: 'auto' }}>
          <Table
            data={pagedInspections} autoHeight bordered cellBordered
            onRowClick={row => setSelectedInspection(row as RecentInspection)}
            style={{ cursor: 'pointer' }}
          >
            <Column width={130}>
              <HeaderCell>วันที่</HeaderCell>
              <TableCell>{(rowData: any) => formatDate(rowData.timestamp)}</TableCell>
            </Column>
            <Column width={140}>
              <HeaderCell>รหัสถัง</HeaderCell>
              <TableCell dataKey="extinguisherCode" />
            </Column>
            <Column minWidth={60} flexGrow={1}>
              <HeaderCell>ตำแหน่ง</HeaderCell>
              <TableCell dataKey="locationName" />
            </Column>
            <Column minWidth={80} flexGrow={2}>
              <HeaderCell>ผู้ตรวจ</HeaderCell>
              <TableCell dataKey="inspectorName" />
            </Column>
            <Column width={100}>
              <HeaderCell>ผลตรวจ</HeaderCell>
              <TableCell>
                {(rowData: any) => (
                  <Tag color={rowData.result === 'PASS' ? 'green' : 'red'}>
                    {rowData.result}
                  </Tag>
                )}
              </TableCell>
            </Column>
            <Column width={60}>
              <HeaderCell>{''}</HeaderCell>
              <TableCell>
                {() => <span style={{ color: '#ba0b1b', fontSize: 13 }}>ดู →</span>}
              </TableCell>
            </Column>
          </Table>
        </div>

        {totalPages > 1 && (
          <div style={{
            display: 'flex', justifyContent: 'center',
            alignItems: 'center', gap: 8, marginTop: 16
          }}>
            <button
              onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              style={{
                padding: '6px 14px', borderRadius: 8,
                border: '1px solid #d1d5db',
                background: currentPage === 1 ? '#f3f4f6' : 'white',
                cursor: currentPage === 1 ? 'not-allowed' : 'pointer', fontSize: 13
              }}
            >
              ← ก่อนหน้า
            </button>
            <span style={{ fontSize: 13, color: '#666' }}>
              หน้า {currentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              style={{
                padding: '6px 14px', borderRadius: 8,
                border: '1px solid #d1d5db',
                background: currentPage === totalPages ? '#f3f4f6' : 'white',
                cursor: currentPage === totalPages ? 'not-allowed' : 'pointer', fontSize: 13
              }}
            >
              ถัดไป →
            </button>
          </div>
        )}
      </div>

      {/* Modals */}
      <InspectionDetailModal
        data={selectedInspection}
        accessToken={accessToken}
        onClose={() => setSelectedInspection(null)}
      />

      <InspectionDetailModal
        data={selectedUrgent ? urgentToInspection(selectedUrgent) : null}
        accessToken={accessToken}
        onClose={() => setSelectedUrgent(null)}
      />
    </div>
  )
}