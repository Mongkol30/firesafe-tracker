import { useEffect, useState } from 'react'
import {
  Table, Button, Modal, Form, Input, Toggle,
  IconButton, ButtonToolbar, useToaster, Message, Tag
} from 'rsuite'
import PlusIcon from '@rsuite/icons/Plus'
import EditIcon from '@rsuite/icons/Edit'
import TrashIcon from '@rsuite/icons/Trash'
import { getUsers, addUser, updateUser, deleteUser, type User } from '../../services/userService'

const { Column, HeaderCell, Cell } = Table

const emptyForm: User = {
  id: '', email: '', firstName: '', lastName: '', role: '', active: true
}

export default function UserPage() {
  const toaster = useToaster()
  const [data, setData] = useState<User[]>([])
  const [loading, setLoading] = useState(false)
  const [modalOpen, setModalOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<User | null>(null)
  const [form, setForm] = useState<User>(emptyForm)
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
      const res = await getUsers()
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

  const openEdit = (row: User) => {
    setForm({ ...row })
    setIsEdit(true)
    setModalOpen(true)
  }

  const handleSave = async () => {
    if (!form.id || !form.email || !form.firstName || !form.lastName) {
      notify('error', 'กรุณากรอกข้อมูลให้ครบ')
      return
    }
    setSaving(true)
    try {
      isEdit ? await updateUser(form) : await addUser(form)
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
      await deleteUser(deleteTarget.id)
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
        <h2 style={{ margin: 0 }}>ผู้ใช้งาน</h2>
        <Button appearance="primary" startIcon={<PlusIcon />} onClick={openAdd}
          style={{ background: '#ba0b1b', border: 'none' }}>
          เพิ่มผู้ใช้
        </Button>
      </div>

      <div style={{ overflowX: 'auto' }}>
        <Table data={data} loading={loading} autoHeight bordered cellBordered>
          <Column width={80}>
            <HeaderCell>ID</HeaderCell>
            <Cell dataKey="id" />
          </Column>
          <Column minWidth={180} flexGrow={1}>
            <HeaderCell>Email</HeaderCell>
            <Cell dataKey="email" />
          </Column>
          <Column minWidth={120} flexGrow={1}>
            <HeaderCell>ชื่อ</HeaderCell>
            <Cell dataKey="firstName" />
          </Column>
          <Column minWidth={120} flexGrow={1}>
            <HeaderCell>นามสกุล</HeaderCell>
            <Cell dataKey="lastName" />
          </Column>
          <Column width={120}>
            <HeaderCell>Role</HeaderCell>
            <Cell dataKey="role" />
          </Column>
          <Column width={100}>
            <HeaderCell>สถานะ</HeaderCell>
            <Cell>
              {(rowData) => (
                <Tag color={(rowData as User).active ? 'green' : 'red'}>
                  {(rowData as User).active ? 'Active' : 'Inactive'}
                </Tag>
              )}
            </Cell>
          </Column>
          <Column width={100} fixed="right">
            <HeaderCell>จัดการ</HeaderCell>
            <Cell>
              {(rowData) => (
                <ButtonToolbar>
                  <IconButton icon={<EditIcon />} size="xs" onClick={() => openEdit(rowData as User)} />
                  <IconButton icon={<TrashIcon />} size="xs" color="red" appearance="subtle"
                    onClick={() => setDeleteTarget(rowData as User)} />
                </ButtonToolbar>
              )}
            </Cell>
          </Column>
        </Table>
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="xs">
        <Modal.Header>
          <Modal.Title>{isEdit ? 'แก้ไขผู้ใช้' : 'เพิ่มผู้ใช้'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form fluid>
            <Form.Group>
              <Form.Label>ID</Form.Label>
              <Input value={form.id} onChange={v => setForm({ ...form, id: v })} disabled={isEdit} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Email</Form.Label>
              <Input value={form.email} onChange={v => setForm({ ...form, email: v })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>ชื่อ</Form.Label>
              <Input value={form.firstName} onChange={v => setForm({ ...form, firstName: v })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>นามสกุล</Form.Label>
              <Input value={form.lastName} onChange={v => setForm({ ...form, lastName: v })} />
            </Form.Group>
            <Form.Group>
              <Form.Label>Role</Form.Label>
              <Input value={form.role} onChange={v => setForm({ ...form, role: v })} />
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
          ต้องการลบ <strong>{deleteTarget?.email}</strong> ใช่หรือไม่?
        </Modal.Body>
        <Modal.Footer>
          <Button onClick={handleDelete} appearance="primary" color="red" loading={saving}>ลบ</Button>
          <Button onClick={() => setDeleteTarget(null)} appearance="subtle">ยกเลิก</Button>
        </Modal.Footer>
      </Modal>
    </div>
  )
}