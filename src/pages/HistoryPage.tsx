import { useEffect, useState } from 'react'
import { SelectPicker, Button, Loader, Tag, Table, Modal, DatePicker } from 'rsuite'
import * as XLSX from 'xlsx'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  getHistory,
  type HistoryData, type HistoryRecord,
  type ExtGroup, type NotInspectedItem, type HistoryFilter
} from '../services/historyService'
import { getExtinguishers, type Extinguisher } from '../services/extinguisherService'
import { getLocations, type Location } from '../services/locationService'
import { getTypes, type ExtinguisherType } from '../services/typeService'
import { formatDate } from '../utils/formatDate'
import InspectionDetailModal from '../components/InspectionDetailModal'

const { Column, HeaderCell, Cell: TableCell } = Table
const COLORS = { pass: '#16a34a', fail: '#ba0b1b' }

const defaultData: HistoryData = {
  records: [],
  extGroups: [],
  notInspectedList: [],
  summary: { total: 0, uniqueInspected: 0, uniqueNotInspected: 0, passed: 0, failed: 0 },
  monthly: []
}

interface Props {
  accessToken: string | null
}

const toDateString = (date: Date | null) => {
  if (!date) return ''
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}

// ── Pagination ต้องอยู่นอก HistoryPage ──
const Pagination = ({
  current, total, onChange
}: { current: number; total: number; onChange: (p: number) => void }) => {
  if (total <= 1) return null
  return (
    <div style={{
      display: 'flex', justifyContent: 'center',
      alignItems: 'center', gap: 8, marginTop: 16
    }}>
      <button
        onClick={() => onChange(Math.max(1, current - 1))}
        disabled={current === 1}
        style={{
          padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db',
          background: current === 1 ? '#f3f4f6' : 'white',
          cursor: current === 1 ? 'not-allowed' : 'pointer', fontSize: 13
        }}
      >← ก่อนหน้า</button>
      <span style={{ fontSize: 13, color: '#666' }}>หน้า {current} / {total}</span>
      <button
        onClick={() => onChange(Math.min(total, current + 1))}
        disabled={current === total}
        style={{
          padding: '6px 14px', borderRadius: 8, border: '1px solid #d1d5db',
          background: current === total ? '#f3f4f6' : 'white',
          cursor: current === total ? 'not-allowed' : 'pointer', fontSize: 13
        }}
      >ถัดไป →</button>
    </div>
  )
}

export default function HistoryPage({ accessToken }: Props) {
  const [data, setData] = useState<HistoryData>(defaultData)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<ExtGroup | null>(null)
  const [inspectedPage, setInspectedPage] = useState(1)
  const [notInspectedPage, setNotInspectedPage] = useState(1)
  const tablePageSize = 10

  const [extOptions, setExtOptions] = useState<{ label: string; value: string }[]>([])
  const [locOptions, setLocOptions] = useState<{ label: string; value: string }[]>([])
  const [typeOptions, setTypeOptions] = useState<{ label: string; value: string }[]>([])

  const [filterExt, setFilterExt] = useState<string | null>(null)
  const [filterLoc, setFilterLoc] = useState<string | null>(null)
  const [filterType, setFilterType] = useState<string | null>(null)
  const [filterFrom, setFilterFrom] = useState<Date | null>(null)
  const [filterTo, setFilterTo] = useState<Date | null>(null)
  const [filterResult, setFilterResult] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getExtinguishers(), getLocations(), getTypes()]).then(([extRes, locRes, typeRes]) => {
      setExtOptions(
        extRes.data
          .filter((e: Extinguisher) => e.active)
          .map((e: Extinguisher) => ({
            label: `${e.extinguisherCode || e.id} (${e.locationName})`,
            value: String(e.id)
          }))
      )
      setLocOptions(
        locRes.data
          .filter((l: Location) => l.active)
          .map((l: Location) => ({ label: l.name, value: l.name }))
      )
      setTypeOptions(
        typeRes.data
          .filter((t: ExtinguisherType) => t.active)
          .map((t: ExtinguisherType) => ({ label: t.name, value: t.name }))
      )
    })
  }, [])

  const handleSearch = async () => {
    setLoading(true)
    setInspectedPage(1)
    setNotInspectedPage(1)
    try {
      const filter: HistoryFilter = {}
      if (filterExt) filter.extinguisherNo = filterExt
      if (filterLoc) filter.locationName = filterLoc
      if (filterType) filter.typeName = filterType
      if (filterFrom) filter.dateFrom = toDateString(filterFrom)
      if (filterTo) filter.dateTo = toDateString(filterTo)
      if (filterResult) filter.result = filterResult
      const res = await getHistory(filter)
      setData(res)
      setSearched(true)
    } finally {
      setLoading(false)
    }
  }

  const handleClear = () => {
    setFilterExt(null)
    setFilterLoc(null)
    setFilterType(null)
    setFilterFrom(null)
    setFilterTo(null)
    setFilterResult(null)
    setData(defaultData)
    setSearched(false)
    setInspectedPage(1)
    setNotInspectedPage(1)
  }

  const handleExport = () => {
    const { extGroups, notInspectedList, summary } = data

    const inspectedRows = extGroups.map(g => ({
      'รหัสถัง': g.extinguisherCode,
      'ตำแหน่ง': g.locationName,
      'ประเภท': g.typeName,
      'จำนวนครั้งที่ตรวจ': g.count,
      'ผลล่าสุด': g.lastResult,
      'วันที่ตรวจล่าสุด': formatDate(g.lastTimestamp),
      'ผู้ตรวจล่าสุด': g.lastInspector,
    }))

    const notInspectedRows = notInspectedList.map(n => ({
      'รหัสถัง': n.extinguisherCode,
      'ตำแหน่ง': n.locationName,
      'ประเภท': n.typeName,
      'จำนวนครั้งที่ตรวจ': 0,
      'ผลล่าสุด (ทั้งหมด)': n.globalLastResult || '-',
      'วันที่ตรวจล่าสุด (ทั้งหมด)': formatDate(n.globalLastDate),
    }))

    const summaryRows = [
      { 'รายการ': 'ถังที่ตรวจในช่วงที่เลือก', 'จำนวน': summary.uniqueInspected },
      { 'รายการ': 'ถังที่ไม่ได้ตรวจในช่วงที่เลือก', 'จำนวน': summary.uniqueNotInspected },
      { 'รายการ': 'ผ่าน (ผลล่าสุด)', 'จำนวน': summary.passed },
      { 'รายการ': 'ไม่ผ่าน (ผลล่าสุด)', 'จำนวน': summary.failed },
      {
        'รายการ': 'อัตราผ่าน (%)',
        'จำนวน': summary.uniqueInspected > 0
          ? ((summary.passed / summary.uniqueInspected) * 100).toFixed(1) + '%'
          : '0%'
      },
    ]

    const wb = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(inspectedRows), 'ถังที่ตรวจ')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(notInspectedRows), 'ถังที่ไม่ได้ตรวจ')
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(summaryRows), 'สรุป')

    const dateStr = new Date().toLocaleDateString('en-US').replace(/\//g, '-')
    XLSX.writeFile(wb, `FireSafe_History_${dateStr}.xlsx`)
  }

  const formatMonth = (month: string) => {
    const [y, m] = month.split('-')
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    return `${monthNames[parseInt(m) - 1]} ${parseInt(y) + 543}`
  }

  const toRecentInspection = (r: HistoryRecord) => ({
    timestamp: r.timestamp, inspectorName: r.inspectorName,
    extinguisherNo: r.extinguisherNo, extinguisherCode: r.extinguisherCode,
    locationName: r.locationName, typeName: r.typeName,
    driveFolderId: r.driveFolderId, tankCondition: r.tankCondition,
    hoseCondition: r.hoseCondition, pressureGauge: r.pressureGauge,
    noObstruction: r.noObstruction, sealCondition: r.sealCondition,
    labelVisible: r.labelVisible, result: r.result,
    remark: r.remark, photoUrls: r.photoUrls
  })

  const { extGroups, notInspectedList, summary, monthly } = data

  const sectionStyle: React.CSSProperties = {
    background: 'white', borderRadius: 12,
    padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    marginBottom: 16
  }

  const pagedInspected = extGroups.slice(
    (inspectedPage - 1) * tablePageSize, inspectedPage * tablePageSize
  )
  const pagedNotInspected = notInspectedList.slice(
    (notInspectedPage - 1) * tablePageSize, notInspectedPage * tablePageSize
  )

  return (
    <div>
      <h2 style={{ marginBottom: 20 }}>History</h2>

      {/* Filter */}
      <div style={sectionStyle}>
        <div style={{ fontWeight: 600, marginBottom: 16 }}>🔍 ค้นหา</div>
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 12, marginBottom: 16
        }}>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>ถังดับเพลิง</div>
            <SelectPicker data={extOptions} value={filterExt}
              onChange={setFilterExt} placeholder="ทั้งหมด" block cleanable />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>ตำแหน่ง</div>
            <SelectPicker data={locOptions} value={filterLoc}
              onChange={setFilterLoc} placeholder="ทั้งหมด" block cleanable />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>ประเภทถัง</div>
            <SelectPicker data={typeOptions} value={filterType}
              onChange={setFilterType} placeholder="ทั้งหมด" block cleanable />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>วันที่เริ่มต้น</div>
            <DatePicker
              value={filterFrom} onChange={setFilterFrom}
              oneTap block format="dd/MM/yyyy" placeholder="dd/mm/yyyy"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>วันที่สิ้นสุด</div>
            <DatePicker
              value={filterTo} onChange={setFilterTo}
              oneTap block format="dd/MM/yyyy" placeholder="dd/mm/yyyy"
              style={{ width: '100%' }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>ผลตรวจ</div>
            <SelectPicker
              data={[{ label: 'PASS', value: 'PASS' }, { label: 'FAIL', value: 'FAIL' }]}
              value={filterResult} onChange={setFilterResult}
              placeholder="ทั้งหมด" block cleanable />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button appearance="primary" onClick={handleSearch} loading={loading}
            style={{ background: '#ba0b1b', border: 'none' }}>
            ค้นหา
          </Button>
          <Button appearance="subtle" onClick={handleClear}>ล้างตัวกรอง</Button>
          {searched && extGroups.length > 0 && (
            <Button appearance="ghost" onClick={handleExport}
              style={{ borderColor: '#16a34a', color: '#16a34a' }}>
              📥 Export Excel
            </Button>
          )}
        </div>
      </div>

      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <Loader size="lg" content="กำลังโหลด..." vertical />
        </div>
      )}

      {!loading && searched && (
        <>
          {/* Summary Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12, marginBottom: 16
          }}>
            {[
              { title: 'ถังที่ตรวจ', value: summary.uniqueInspected, color: '#0369a1', icon: '📋' },
              { title: 'ถังที่ไม่ได้ตรวจ', value: summary.uniqueNotInspected, color: '#f59e0b', icon: '⏳' },
              { title: 'ผ่าน', value: summary.passed, color: '#16a34a', icon: '✅' },
              { title: 'ไม่ผ่าน', value: summary.failed, color: '#ba0b1b', icon: '❌' },
              {
                title: 'อัตราผ่าน',
                value: summary.uniqueInspected > 0
                  ? `${((summary.passed / summary.uniqueInspected) * 100).toFixed(1)}%`
                  : '0%',
                color: '#7c3aed', icon: '📊'
              },
            ].map(card => (
              <div key={card.title} style={{
                background: 'white', borderRadius: 12, padding: '16px',
                boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
                borderTop: `4px solid ${card.color}`,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
                  <span style={{ fontSize: 18 }}>{card.icon}</span>
                  <span style={{ fontSize: 12, color: '#6b7280' }}>{card.title}</span>
                </div>
                <div style={{ fontSize: 26, fontWeight: 700, color: card.color }}>{card.value}</div>
              </div>
            ))}
          </div>

          {/* Trend Chart */}
          {monthly.length > 0 && (
            <div style={sectionStyle}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>📈 Trend ผลตรวจ</div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>
                นับจากผลล่าสุดของแต่ละถังในแต่ละเดือน
              </div>
              <ResponsiveContainer width="100%" height={220}>
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
            </div>
          )}

          {/* ตารางถังที่ตรวจ */}
          <div style={sectionStyle}>
            <div style={{ fontWeight: 600, marginBottom: 4 }}>
              ✅ ถังที่ตรวจในช่วงที่เลือก ({extGroups.length} ถัง)
            </div>
            <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>
              คลิกที่แถวเพื่อดู timeline การตรวจของถังนั้น
            </div>
            <div style={{ overflowX: 'auto' }}>
              <Table data={pagedInspected} autoHeight bordered cellBordered
                onRowClick={row => setSelectedGroup(row as ExtGroup)}
                style={{ cursor: 'pointer' }}>
                <Column width={130}>
                  <HeaderCell>รหัสถัง</HeaderCell>
                  <TableCell dataKey="extinguisherCode" />
                </Column>
                <Column minWidth={120} flexGrow={1}>
                  <HeaderCell>ตำแหน่ง</HeaderCell>
                  <TableCell dataKey="locationName" />
                </Column>
                <Column minWidth={100} flexGrow={1}>
                  <HeaderCell>ประเภท</HeaderCell>
                  <TableCell dataKey="typeName" />
                </Column>
                <Column width={90}>
                  <HeaderCell>ตรวจ</HeaderCell>
                  <TableCell>{(rowData: any) => `${rowData.count} ครั้ง`}</TableCell>
                </Column>
                <Column width={110}>
                  <HeaderCell>ผลล่าสุด</HeaderCell>
                  <TableCell>
                    {(rowData: any) => (
                      <Tag color={rowData.lastResult === 'PASS' ? 'green' : 'red'}>
                        {rowData.lastResult}
                      </Tag>
                    )}
                  </TableCell>
                </Column>
                <Column width={130}>
                  <HeaderCell>วันที่ล่าสุด</HeaderCell>
                  <TableCell>{(rowData: any) => formatDate(rowData.lastTimestamp)}</TableCell>
                </Column>
                <Column minWidth={120} flexGrow={1}>
                  <HeaderCell>ผู้ตรวจล่าสุด</HeaderCell>
                  <TableCell dataKey="lastInspector" />
                </Column>
                <Column width={60}>
                  <HeaderCell>{''}</HeaderCell>
                  <TableCell>
                    {() => <span style={{ color: '#ba0b1b', fontSize: 13 }}>ดู →</span>}
                  </TableCell>
                </Column>
              </Table>
            </div>
            <Pagination
              current={inspectedPage}
              total={Math.ceil(extGroups.length / tablePageSize)}
              onChange={setInspectedPage}
            />
          </div>

          {/* ตารางถังที่ไม่ได้ตรวจ */}
          {notInspectedList.length > 0 && (
            <div style={sectionStyle}>
              <div style={{ fontWeight: 600, marginBottom: 4 }}>
                ⏳ ถังที่ไม่ได้ตรวจในช่วงที่เลือก ({notInspectedList.length} ถัง)
              </div>
              <div style={{ fontSize: 11, color: '#888', marginBottom: 12 }}>
                แสดงผลตรวจล่าสุดของทั้งหมด (ไม่จำกัดช่วงเวลา)
              </div>
              <div style={{ overflowX: 'auto' }}>
                <Table data={pagedNotInspected} autoHeight bordered cellBordered>
                  <Column width={130}>
                    <HeaderCell>รหัสถัง</HeaderCell>
                    <TableCell dataKey="extinguisherCode" />
                  </Column>
                  <Column minWidth={120} flexGrow={1}>
                    <HeaderCell>ตำแหน่ง</HeaderCell>
                    <TableCell dataKey="locationName" />
                  </Column>
                  <Column minWidth={100} flexGrow={1}>
                    <HeaderCell>ประเภท</HeaderCell>
                    <TableCell dataKey="typeName" />
                  </Column>
                  <Column width={150}>
                    <HeaderCell>ผลตรวจล่าสุด (ทั้งหมด)</HeaderCell>
                    <TableCell>
                      {(rowData: any) => {
                        const r = (rowData as NotInspectedItem).globalLastResult
                        if (!r) return <span style={{ color: '#aaa' }}>ยังไม่เคยตรวจ</span>
                        return <Tag color={r === 'PASS' ? 'green' : 'red'}>{r}</Tag>
                      }}
                    </TableCell>
                  </Column>
                  <Column width={160}>
                    <HeaderCell>วันที่ตรวจล่าสุด (ทั้งหมด)</HeaderCell>
                    <TableCell>
                      {(rowData: any) => formatDate((rowData as NotInspectedItem).globalLastDate) || '-'}
                    </TableCell>
                  </Column>
                </Table>
              </div>
              <Pagination
                current={notInspectedPage}
                total={Math.ceil(notInspectedList.length / tablePageSize)}
                onChange={setNotInspectedPage}
              />
            </div>
          )}
        </>
      )}

      {!loading && !searched && (
        <div style={{
          textAlign: 'center', color: '#aaa', padding: '4rem',
          background: 'white', borderRadius: 12, boxShadow: '0 1px 4px rgba(0,0,0,0.07)'
        }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🔍</div>
          <div style={{ fontSize: 16 }}>เลือก filter แล้วกด ค้นหา</div>
        </div>
      )}

      {/* Timeline Modal */}
      <Modal open={!!selectedGroup} onClose={() => setSelectedGroup(null)} size="md">
        <Modal.Header>
          <Modal.Title>
            Timeline — {selectedGroup?.extinguisherCode} ({selectedGroup?.locationName})
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedGroup && (
            <>
              <div style={{ marginBottom: 16, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                <div style={{
                  background: '#f9fafb', borderRadius: 8, padding: '8px 16px',
                  fontSize: 13, color: '#444'
                }}>
                  ตรวจทั้งหมด <strong>{selectedGroup.count} ครั้ง</strong>
                </div>
                <div style={{
                  background: selectedGroup.lastResult === 'PASS' ? '#f0fdf4' : '#fff5f5',
                  borderRadius: 8, padding: '8px 16px', fontSize: 13
                }}>
                  ผลล่าสุด{' '}
                  <Tag color={selectedGroup.lastResult === 'PASS' ? 'green' : 'red'}>
                    {selectedGroup.lastResult}
                  </Tag>
                </div>
              </div>
              <div>
                {selectedGroup.records.map((r, i) => (
                  <div key={i}
                    style={{
                      display: 'flex', gap: 12, padding: '12px 0',
                      borderBottom: i < selectedGroup.records.length - 1 ? '1px solid #f0f0f0' : 'none',
                      alignItems: 'center', cursor: 'pointer'
                    }}
                    onClick={() => setSelectedRecord(r)}
                  >
                    <div style={{
                      width: 8, height: 8, borderRadius: '50%', flexShrink: 0,
                      background: r.result === 'PASS' ? '#16a34a' : '#ba0b1b',
                      marginTop: 4
                    }} />
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <span style={{ fontSize: 13, fontWeight: 500 }}>{formatDate(r.timestamp)}</span>
                        <Tag color={r.result === 'PASS' ? 'green' : 'red'} size="sm">
                          {r.result}
                        </Tag>
                      </div>
                      <div style={{ fontSize: 12, color: '#888' }}>
                        ผู้ตรวจ: {r.inspectorName}
                        {r.remark && (
                          <span style={{ marginLeft: 8, color: '#f59e0b' }}>⚠️ {r.remark}</span>
                        )}
                      </div>
                    </div>
                    <span style={{ color: '#ba0b1b', fontSize: 13 }}>ดู →</span>
                  </div>
                ))}
              </div>
            </>
          )}
        </Modal.Body>
      </Modal>

      <InspectionDetailModal
        data={selectedRecord ? toRecentInspection(selectedRecord) : null}
        accessToken={accessToken}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  )
}