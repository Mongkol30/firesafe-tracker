import { useEffect, useState } from 'react'
import {
  SelectPicker, Button, Loader, Tag, Table
} from 'rsuite'
import * as XLSX from 'xlsx'
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer
} from 'recharts'
import {
  getHistory, type HistoryData, type HistoryRecord, type HistoryFilter
} from '../services/historyService'
import { getExtinguishers, type Extinguisher } from '../services/extinguisherService'
import { getLocations, type Location } from '../services/locationService'
import { formatDate } from '../utils/formatDate'
import InspectionDetailModal from '../components/InspectionDetailModal'

const { Column, HeaderCell, Cell: TableCell } = Table
const COLORS = { pass: '#16a34a', fail: '#ba0b1b' }

const defaultData: HistoryData = {
  records: [],
  summary: { total: 0, passed: 0, failed: 0, uniqueExt: 0 },
  monthly: []
}

interface Props {
  accessToken: string | null
}

export default function HistoryPage({ accessToken }: Props) {
  const [data, setData] = useState<HistoryData>(defaultData)
  const [loading, setLoading] = useState(false)
  const [searched, setSearched] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<HistoryRecord | null>(null)
  const [currentPage, setCurrentPage] = useState(1)
  const pageSize = 10

  // dropdown options
  const [extOptions, setExtOptions] = useState<{ label: string; value: string }[]>([])
  const [locOptions, setLocOptions] = useState<{ label: string; value: string }[]>([])

  // filters
  const [filterExt, setFilterExt] = useState<string | null>(null)
  const [filterLoc, setFilterLoc] = useState<string | null>(null)
  const [filterFrom, setFilterFrom] = useState('')
  const [filterTo, setFilterTo] = useState('')
  const [filterResult, setFilterResult] = useState<string | null>(null)

  useEffect(() => {
    Promise.all([getExtinguishers(), getLocations()]).then(([extRes, locRes]) => {
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
    })
  }, [])

  const handleSearch = async () => {
    setLoading(true)
    setCurrentPage(1)
    try {
      const filter: HistoryFilter = {}
      if (filterExt) filter.extinguisherNo = filterExt
      if (filterLoc) filter.locationName = filterLoc
      if (filterFrom) filter.dateFrom = filterFrom
      if (filterTo) filter.dateTo = filterTo
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
    setFilterFrom('')
    setFilterTo('')
    setFilterResult(null)
    setData(defaultData)
    setSearched(false)
    setCurrentPage(1)
  }

  const handleExport = () => {
    const { records, summary } = data

    // Sheet 1 — รายการตรวจ
    const recordRows = records.map(r => ({
      'วันที่ตรวจ': formatDate(r.timestamp),
      'รหัสถัง': r.extinguisherCode,
      'ตำแหน่ง': r.locationName,
      'ประเภท': r.typeName,
      'ผู้ตรวจ': r.inspectorName,
      'สภาพถัง': r.tankCondition,
      'สายฉีด': r.hoseCondition,
      'เข็มแรงดัน': r.pressureGauge,
      'พื้นที่โดยรอบ': r.noObstruction,
      'สลัก/ซีล': r.sealCondition,
      'ป้ายประจำถัง': r.labelVisible,
      'ผลตรวจ': r.result,
      'หมายเหตุ': r.remark,
    }))

    // Sheet 2 — summary
    const summaryRows = [
      { 'รายการ': 'จำนวนครั้งที่ตรวจทั้งหมด', 'จำนวน': summary.total },
      { 'รายการ': 'จำนวนถังที่ตรวจ (unique)', 'จำนวน': summary.uniqueExt },
      { 'รายการ': 'ผ่าน (PASS)', 'จำนวน': summary.passed },
      { 'รายการ': 'ไม่ผ่าน (FAIL)', 'จำนวน': summary.failed },
      { 'รายการ': 'อัตราผ่าน (%)', 'จำนวน': summary.total > 0 ? ((summary.passed / summary.total) * 100).toFixed(1) + '%' : '0%' },
    ]

    const wb = XLSX.utils.book_new()
    const ws1 = XLSX.utils.json_to_sheet(recordRows)
    const ws2 = XLSX.utils.json_to_sheet(summaryRows)

    // ปรับความกว้าง column
    ws1['!cols'] = [
      { wch: 16 }, { wch: 14 }, { wch: 20 }, { wch: 14 }, { wch: 20 },
      { wch: 10 }, { wch: 10 }, { wch: 12 }, { wch: 14 }, { wch: 10 },
      { wch: 14 }, { wch: 10 }, { wch: 30 },
    ]
    ws2['!cols'] = [{ wch: 30 }, { wch: 12 }]

    XLSX.utils.book_append_sheet(wb, ws1, 'รายการตรวจ')
    XLSX.utils.book_append_sheet(wb, ws2, 'สรุป')

    const dateStr = new Date().toLocaleDateString('en-US').replace(/\//g, '-')
    XLSX.writeFile(wb, `FireSafe_History_${dateStr}.xlsx`)
  }

  const formatMonth = (month: string) => {
    const [y, m] = month.split('-')
    const monthNames = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.',
      'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']
    return `${monthNames[parseInt(m) - 1]} ${parseInt(y) + 543}`
  }

  const { records, summary, monthly } = data
  const totalPages = Math.ceil(records.length / pageSize)
  const pagedRecords = records.slice((currentPage - 1) * pageSize, currentPage * pageSize)

  const sectionStyle: React.CSSProperties = {
    background: 'white', borderRadius: 12,
    padding: '20px', boxShadow: '0 1px 4px rgba(0,0,0,0.07)',
    marginBottom: 16
  }

  const toRecentInspection = (r: HistoryRecord) => ({
    timestamp: r.timestamp,
    inspectorName: r.inspectorName,
    extinguisherNo: r.extinguisherNo,
    extinguisherCode: r.extinguisherCode,
    locationName: r.locationName,
    typeName: r.typeName,
    driveFolderId: r.driveFolderId,
    tankCondition: r.tankCondition,
    hoseCondition: r.hoseCondition,
    pressureGauge: r.pressureGauge,
    noObstruction: r.noObstruction,
    sealCondition: r.sealCondition,
    labelVisible: r.labelVisible,
    result: r.result,
    remark: r.remark,
    photoUrls: r.photoUrls
  })

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
            <SelectPicker
              data={extOptions} value={filterExt}
              onChange={setFilterExt} placeholder="ทั้งหมด" block cleanable
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>ตำแหน่ง</div>
            <SelectPicker
              data={locOptions} value={filterLoc}
              onChange={setFilterLoc} placeholder="ทั้งหมด" block cleanable
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>วันที่เริ่มต้น</div>
            <input
              type="date" value={filterFrom}
              onChange={e => setFilterFrom(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px', borderRadius: 8,
                border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>วันที่สิ้นสุด</div>
            <input
              type="date" value={filterTo}
              onChange={e => setFilterTo(e.target.value)}
              style={{
                width: '100%', padding: '7px 10px', borderRadius: 8,
                border: '1px solid #d1d5db', fontSize: 14, boxSizing: 'border-box'
              }}
            />
          </div>
          <div>
            <div style={{ fontSize: 12, color: '#888', marginBottom: 4 }}>ผลตรวจ</div>
            <SelectPicker
              data={[{ label: 'PASS', value: 'PASS' }, { label: 'FAIL', value: 'FAIL' }]}
              value={filterResult} onChange={setFilterResult}
              placeholder="ทั้งหมด" block cleanable
            />
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <Button
            appearance="primary" onClick={handleSearch} loading={loading}
            style={{ background: '#ba0b1b', border: 'none' }}
          >
            ค้นหา
          </Button>
          <Button appearance="subtle" onClick={handleClear}>
            ล้างตัวกรอง
          </Button>
          {searched && records.length > 0 && (
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
              { title: 'ตรวจทั้งหมด', value: summary.total, color: '#1a1a2e', icon: '📋' },
              { title: 'ถังที่ตรวจ', value: summary.uniqueExt, color: '#0369a1', icon: '🧯' },
              { title: 'ผ่าน', value: summary.passed, color: '#16a34a', icon: '✅' },
              { title: 'ไม่ผ่าน', value: summary.failed, color: '#ba0b1b', icon: '❌' },
              {
                title: 'อัตราผ่าน',
                value: summary.total > 0 ? `${((summary.passed / summary.total) * 100).toFixed(1)}%` : '0%',
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
              <div style={{ fontWeight: 600, marginBottom: 16 }}>📈 Trend ผลตรวจ</div>
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

          {/* Timeline Table */}
          <div style={sectionStyle}>
            <div style={{
              fontWeight: 600, marginBottom: 16,
              display: 'flex', alignItems: 'center', justifyContent: 'space-between'
            }}>
              <span>🕐 รายการตรวจ ({records.length} รายการ)</span>
            </div>

            {records.length === 0 ? (
              <div style={{ textAlign: 'center', color: '#aaa', padding: '2rem' }}>
                ไม่พบข้อมูล
              </div>
            ) : (
              <>
                <div style={{ overflowX: 'auto' }}>
                  <Table
                    data={pagedRecords} autoHeight bordered cellBordered
                    onRowClick={row => setSelectedRecord(row as HistoryRecord)}
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
                    <Column minWidth={140} flexGrow={2}>
                      <HeaderCell>หมายเหตุ</HeaderCell>
                      <TableCell>
                        {(rowData: any) => (
                          <span style={{ color: rowData.remark ? '#444' : '#aaa', fontSize: 13 }}>
                            {rowData.remark || '-'}
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
                </div>

                {/* Pagination */}
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
              </>
            )}
          </div>
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

      <InspectionDetailModal
        data={selectedRecord ? toRecentInspection(selectedRecord) : null}
        accessToken={accessToken}
        onClose={() => setSelectedRecord(null)}
      />
    </div>
  )
}