import { useEffect, useState } from 'react'
import {
  Table, Button, Modal, Form, Input, Toggle,
  IconButton, ButtonToolbar, useToaster, Message, Tag
} from 'rsuite'
import PlusIcon from '@rsuite/icons/Plus'
import EditIcon from '@rsuite/icons/Edit'
import TrashIcon from '@rsuite/icons/Trash'
import {
  getTypes, addType, updateType, deleteType,
  type ExtinguisherType
} from '../../services/typeService'

const { Column, HeaderCell, Cell } = Table

const emptyForm: ExtinguisherType = {
  id: '', code: '', name: '', remark: '', active: true
}

export default function ExtinguisherTypePage() {
  const toaster = useToaster()
  const [data, setData] = useState<ExtinguisherType[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<ExtinguisherType | null>(null)
  const [form, setForm] = useState<ExtinguisherType>(emptyForm)
  const [isEdit, setIsEdit] = useState(false)
  const [saving, setSaving] = useState(false)

  const notify = (type: 'success' | 'error', msg: string) =>
    toaster.push(
      <Message type={type} showIcon closable duration={3000}>{msg}</Message>,
      { placement: 'topCenter' }
    )

  const fetchData = async () => {
    setLoading(true)
    try {
      const res = await getTypes()
      setData(res.data)
    } catch {
      notify('error', 'โหลดข้อมูลไม่สำเร็จ')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchData() }, [])

  const openAdd = () => {
    setForm(emptyForm)
    setIsEdit(false)
    setModalOpen(true)
  }

  const openEdit = (row: ExtinguisherType) => {
    setForm({ ...row })
    setIsEdit(true)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.id || !form.code || !form.name) {
      notify('error', 'กรุณากรอก ID, Code และ Name')
      return
    }
    setSaving(true)
    try {
      isEdit ? await updateType(form) : await addType(form)
      notify('success', isEdit ? 'แก้ไขสำเร็จ' : 'เพิ่มสำเร็จ')
      setModalOpen(false)
      fetchData()
    } catch {
      notify('error', 'บันทึกไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setSaving(true)
    try {
      await deleteType(deleteTarget.id)
      notify('success', 'ลบสำเร็จ')
      setDeleteTarget(null)
      fetchData()
    } catch {
      notify('error', 'ลบไม่สำเร็จ')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>ประเภทถังดับเพลิง</h2>
        <Button
          appearance="primary"
          startIcon={<PlusIcon />}
          onClick={openAdd}
          style={{ background: '#ba0b1b', border: 'none' }}
        >
          เพิ่มประเภท
        </Button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <Table data={data} loading={loading} autoHeight bordered cellBordered>
          <Column width={80}>
            <HeaderCell>ID</HeaderCell>
            <Cell dataKey="id" />
          </Column>
          <Column width={120}>
            <HeaderCell>Code</HeaderCell>
            <Cell dataKey="code" />
          </Column>
          <Column minWidth={160} flexGrow={1}>
            <HeaderCell>ชื่อประเภท</HeaderCell>
            <Cell dataKey="name" />
          </Column>
          <Column minWidth={200} flexGrow={2}>
            <HeaderCell>หมายเหตุ</HeaderCell>
            <Cell dataKey="remark" />
          </Column>
          <Column width={100}>
            <HeaderCell>สถานะ</HeaderCell>
            <Cell>
              {(rowData) => (
                <Tag color={(rowData as ExtinguisherType).active ? 'green' : 'red'}>
                  {(rowData as ExtinguisherType).active ? 'Active' : 'Inactive'}
                </Tag>
              )}
            </Cell>
          </Column>
          <Column width={100} fixed="right">
            <HeaderCell>จัดการ</HeaderCell>
            <Cell>
              {(rowData) => (
                <ButtonToolbar>
                  <IconButton icon={<EditIcon />} size="xs" onClick={() => openEdit(rowData as ExtinguisherType)} />
                  <IconButton icon={<TrashIcon />} size="xs" color="red" appearance="subtle"
                    onClick={() => setDeleteTarget(rowData as ExtinguisherType)} />
                </ButtonToolbar>
              )}
            </Cell>
          </Column>
        </Table>
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="xs">
        <Modal.Header>
          <Modal.Title>{isEdit ? 'แก้ไขประเภทถัง' : 'เพิ่มประเภทถัง'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form fluid>
            <Form.Group>
              <Form.Label>ID</Form.Label>
              <Input value={form.id} onChange={v => setForm({ ...form, id: v })} disabled={isEdit} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Code</Form.Label>
              <Input value={form.code} onChange={v => setForm({ ...form, code: v })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>ชื่อประเภท</Form.Label>
              <Input value={form.name} onChange={v => setForm({ ...form, name: v })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>หมายเหตุ</Form.Label>
              <Input as="textarea" rows={3} value={form.remark} onChange={v => setForm({ ...form, remark: v })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>สถานะ</Form.Label>
              <Toggle
                checked={form.active}
                onChange={v => setForm({ ...form, active: v })}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleSave} appearance="primary" loading={saving}
            style={{ background: '#ba0b1b', border: 'none' }}>
            บันทึก
          </Button>
          <Button onClick={() => setModalOpen(false)} appearance="subtle">ยกเลิก</Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal open={!!deleteTarget} onClose={() => setDeleteTarget(null)} size="xs">
        <Modal.Header>
          <Modal.Title>ยืนยันการลบ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ต้องการลบ <strong>{deleteTarget?.name}</strong> ใช่หรือไม่?
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleDelete} appearance="primary" color="red" loading={saving}>ลบ</Button>
          <Button onClick={() => setDeleteTarget(null)} appearance="subtle">ยกเลิก</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}