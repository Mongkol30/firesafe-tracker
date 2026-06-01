import { useEffect, useState } from "react";
import {
  Table,
  Button,
  Modal,
  Form,
  Input,
  Toggle,
  SelectPicker,
  IconButton,
  ButtonToolbar,
  useToaster,
  Message,
  Tag,
} from "rsuite";
import PlusIcon from "@rsuite/icons/Plus";
import EditIcon from "@rsuite/icons/Edit";
import TrashIcon from "@rsuite/icons/Trash";
import { QRCodeSVG } from "qrcode.react";
import {
  getExtinguishers,
  addExtinguisher,
  updateExtinguisher,
  deleteExtinguisher,
  type Extinguisher,
  type ExtinguisherForm,
} from "../../services/extinguisherService";
import { getLocations, type Location } from "../../services/locationService";
import { getTypes, type ExtinguisherType } from "../../services/typeService";
import { formatDate } from "../../utils/formatDate";
import { getInspectionUrl } from "../../services/qrService";

const { Column, HeaderCell, Cell } = Table;

const emptyForm: ExtinguisherForm = {
  id: "",
  extinguisherCode: "",
  locationId: "",
  typeId: "",
  lastRefillDate: "",
  active: true,
};

export default function ExtinguisherPage() {
  const toaster = useToaster();
  const [data, setData] = useState<Extinguisher[]>([]);
  const [locations, setLocations] = useState<
    { label: string; value: string }[]
  >([]);
  const [types, setTypes] = useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Extinguisher | null>(null);
  const [qrTarget, setQrTarget] = useState<Extinguisher | null>(null);
  const [form, setForm] = useState<ExtinguisherForm>(emptyForm);
  const [isEdit, setIsEdit] = useState(false);
  const [saving, setSaving] = useState(false);

  // filter states
  const [search, setSearch] = useState("");
  const [filterLoc, setFilterLoc] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterResult, setFilterResult] = useState<string | null>(null);

  const notify = (type: "success" | "error", msg: string) =>
    toaster.push(
      <Message type={type} showIcon closable duration={3000}>
        {msg}
      </Message>,
      { placement: "topCenter" },
    );

  const fetchDropdowns = async () => {
    try {
      const [locRes, typeRes] = await Promise.all([getLocations(), getTypes()]);
      setLocations(
        locRes.data
          .filter((l: Location) => l.active)
          .map((l: Location) => ({
            label: `${l.code} - ${l.name}`,
            value: l.id,
          })),
      );
      setTypes(
        typeRes.data
          .filter((t: ExtinguisherType) => t.active)
          .map((t: ExtinguisherType) => ({
            label: `${t.code} - ${t.name}`,
            value: t.id,
          })),
      );
    } catch {
      notify("error", "โหลด dropdown ไม่สำเร็จ");
    }
  };

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await getExtinguishers();
      setData(res.data);
    } catch {
      notify("error", "โหลดข้อมูลไม่สำเร็จ");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDropdowns();
    fetchData();
  }, []);

  // filter options จากข้อมูลจริง
  const locFilterOptions = [
    ...new Set(data.map((e) => e.locationName).filter(Boolean)),
  ].map((l) => ({ label: l, value: l }));

  const typeFilterOptions = [
    ...new Set(data.map((e) => e.typeName).filter(Boolean)),
  ].map((t) => ({ label: t, value: t }));

  const resultOptions = [
    { label: "PASS", value: "PASS" },
    { label: "FAIL", value: "FAIL" },
    { label: "ยังไม่ตรวจ", value: "" },
  ];

  const filteredData = data.filter((e) => {
    const matchSearch =
      !search ||
      String(e.id).includes(search) ||
      e.extinguisherCode.toLowerCase().includes(search.toLowerCase());
    const matchLoc = !filterLoc || e.locationName === filterLoc;
    const matchType = !filterType || e.typeName === filterType;
    const matchResult = filterResult === null || e.lastResult === filterResult;
    return matchSearch && matchLoc && matchType && matchResult;
  });

  const openAdd = () => {
    setForm(emptyForm);
    setIsEdit(false);
    setModalOpen(true);
  };

  const openEdit = (row: Extinguisher) => {
    setForm({
      id: row.id,
      extinguisherCode: row.extinguisherCode,
      locationId: row.locationId,
      typeId: row.typeId,
      lastRefillDate: row.lastRefillDate,
      active: row.active,
    });
    setIsEdit(true);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.id || !form.locationId || !form.typeId) {
      notify("error", "กรุณากรอก ID, ตำแหน่ง และประเภทถัง");
      return;
    }
    setSaving(true);
    try {
      isEdit ? await updateExtinguisher(form) : await addExtinguisher(form);
      notify("success", isEdit ? "แก้ไขสำเร็จ" : "เพิ่มสำเร็จ");
      setModalOpen(false);
      fetchData();
    } catch {
      notify("error", "บันทึกไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setSaving(true);
    try {
      await deleteExtinguisher(deleteTarget.id);
      notify("success", "ลบสำเร็จ");
      setDeleteTarget(null);
      fetchData();
    } catch {
      notify("error", "ลบไม่สำเร็จ");
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadQR = () => {
    if (!qrTarget) return;
    const cardWidth = 300;
    const cardHeight = 364;
    const qrDiv = document.getElementById("qr-print");
    const qrSvg = qrDiv?.querySelector("svg");
    if (!qrSvg) return;

    const svgNS = "http://www.w3.org/2000/svg";
    const card = document.createElementNS(svgNS, "svg");
    card.setAttribute("xmlns", svgNS);
    card.setAttribute("width", String(cardWidth));
    card.setAttribute("height", String(cardHeight));
    card.setAttribute("viewBox", `0 0 ${cardWidth} ${cardHeight}`);

    const bg = document.createElementNS(svgNS, "rect");
    bg.setAttribute("width", String(cardWidth));
    bg.setAttribute("height", String(cardHeight));
    bg.setAttribute("fill", "white");
    bg.setAttribute("rx", "16");
    card.appendChild(bg);

    const border = document.createElementNS(svgNS, "rect");
    border.setAttribute("width", String(cardWidth - 2));
    border.setAttribute("height", String(cardHeight - 2));
    border.setAttribute("x", "1");
    border.setAttribute("y", "1");
    border.setAttribute("fill", "none");
    border.setAttribute("stroke", "black");
    border.setAttribute("stroke-width", "2");
    border.setAttribute("rx", "16");
    card.appendChild(border);

    const header = document.createElementNS(svgNS, "rect");
    header.setAttribute("width", String(cardWidth));
    header.setAttribute("height", "56");
    header.setAttribute("fill", "#ba0b1b");
    header.setAttribute("rx", "16");
    card.appendChild(header);

    const headerFix = document.createElementNS(svgNS, "rect");
    headerFix.setAttribute("y", "36");
    headerFix.setAttribute("width", String(cardWidth));
    headerFix.setAttribute("height", "20");
    headerFix.setAttribute("fill", "#ba0b1b");
    card.appendChild(headerFix);

    const icon = document.createElementNS(svgNS, "text");
    icon.setAttribute("x", String(cardWidth / 2));
    icon.setAttribute("y", "38");
    icon.setAttribute("text-anchor", "middle");
    icon.setAttribute("font-size", "28");
    icon.textContent = "🧯";
    card.appendChild(icon);

    const qrClone = qrSvg.cloneNode(true) as SVGElement;
    qrClone.setAttribute("x", "50");
    qrClone.setAttribute("y", "68");
    qrClone.setAttribute("width", "200");
    qrClone.setAttribute("height", "200");
    card.appendChild(qrClone);

    const divider = document.createElementNS(svgNS, "line");
    divider.setAttribute("x1", "24");
    divider.setAttribute("y1", "280");
    divider.setAttribute("x2", String(cardWidth - 24));
    divider.setAttribute("y2", "280");
    divider.setAttribute("stroke", "#f0f0f0");
    divider.setAttribute("stroke-width", "1");
    card.appendChild(divider);

    const codeLabel = document.createElementNS(svgNS, "text");
    codeLabel.setAttribute("x", String(cardWidth / 2));
    codeLabel.setAttribute("y", "304");
    codeLabel.setAttribute("text-anchor", "middle");
    codeLabel.setAttribute("fill", "#888");
    codeLabel.setAttribute("font-size", "11");
    codeLabel.setAttribute("font-family", "sans-serif");
    codeLabel.textContent = "รหัสถัง";
    card.appendChild(codeLabel);

    const codeValue = document.createElementNS(svgNS, "text");
    codeValue.setAttribute("x", String(cardWidth / 2));
    codeValue.setAttribute("y", "324");
    codeValue.setAttribute("text-anchor", "middle");
    codeValue.setAttribute("fill", "#ba0b1b");
    codeValue.setAttribute("font-size", "20");
    codeValue.setAttribute("font-weight", "700");
    codeValue.setAttribute("font-family", "sans-serif");
    codeValue.textContent = qrTarget.extinguisherCode || String(qrTarget.id);
    card.appendChild(codeValue);

    const locLabel = document.createElementNS(svgNS, "text");
    locLabel.setAttribute("x", String(cardWidth / 2));
    locLabel.setAttribute("y", "344");
    locLabel.setAttribute("text-anchor", "middle");
    locLabel.setAttribute("fill", "#666");
    locLabel.setAttribute("font-size", "12");
    locLabel.setAttribute("font-family", "sans-serif");
    locLabel.textContent = `📍 ${qrTarget.locationName}`;
    card.appendChild(locLabel);

    const serialized = new XMLSerializer().serializeToString(card);
    const blob = new Blob([serialized], { type: "image/svg+xml" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `QR_${qrTarget.extinguisherCode || qrTarget.id}.svg`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 16,
        }}
      >
        <h2 style={{ margin: 0 }}>ถังดับเพลิง</h2>
        <Button
          appearance="primary"
          startIcon={<PlusIcon />}
          onClick={openAdd}
          style={{ background: "#ba0b1b", border: "none" }}
        >
          เพิ่มถัง
        </Button>
      </div>

      {/* Filter */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
          gap: 8,
          marginBottom: 8,
        }}
      >
        <Input
          placeholder="ค้นหารหัสถัง..."
          value={search}
          onChange={(v) => setSearch(v)}
        />
        <SelectPicker
          data={locFilterOptions}
          placeholder="ตำแหน่ง"
          value={filterLoc}
          onChange={setFilterLoc}
          block
          cleanable
        />
        <SelectPicker
          data={typeFilterOptions}
          placeholder="ประเภทถัง"
          value={filterType}
          onChange={setFilterType}
          block
          cleanable
        />
        <SelectPicker
          data={resultOptions}
          placeholder="ผลตรวจล่าสุด"
          value={filterResult}
          onChange={(v) => setFilterResult(v ?? null)}
          block
          cleanable
        />
      </div>

      <div style={{ fontSize: 12, color: "#888", marginBottom: 8 }}>
        แสดง {filteredData.length} จาก {data.length} รายการ
      </div>

      <div style={{ overflowX: "auto" }}>
        <Table
          data={filteredData}
          loading={loading}
          autoHeight
          bordered
          cellBordered
        >
          <Column width={80} fixed>
            <HeaderCell>ID</HeaderCell>
            <Cell dataKey="id" />
          </Column>
          <Column width={120}>
            <HeaderCell>รหัสถัง</HeaderCell>
            <Cell dataKey="extinguisherCode" />
          </Column>
          <Column minWidth={140} flexGrow={1}>
            <HeaderCell>ตำแหน่งที่ตั้ง</HeaderCell>
            <Cell dataKey="locationName" />
          </Column>
          <Column minWidth={120} flexGrow={1}>
            <HeaderCell>ประเภทถัง</HeaderCell>
            <Cell dataKey="typeName" />
          </Column>
          <Column width={120}>
            <HeaderCell>ผลตรวจล่าสุด</HeaderCell>
            <Cell>
              {(rowData) => {
                const result = (rowData as Extinguisher).lastResult;
                if (!result) return <span style={{ color: "#aaa" }}>-</span>;
                return (
                  <Tag color={result === "PASS" ? "green" : "red"}>
                    {result}
                  </Tag>
                );
              }}
            </Cell>
          </Column>
          <Column width={130}>
            <HeaderCell>เติมสารล่าสุด</HeaderCell>
            <Cell>
              {(rowData) =>
                formatDate((rowData as Extinguisher).lastRefillDate)
              }
            </Cell>
          </Column>
          <Column width={120}>
            <HeaderCell>ตรวจล่าสุด</HeaderCell>
            <Cell>
              {(rowData) =>
                formatDate((rowData as Extinguisher).lastInspectedDate)
              }
            </Cell>
          </Column>
          <Column minWidth={120} flexGrow={1}>
            <HeaderCell>ผู้ตรวจล่าสุด</HeaderCell>
            <Cell dataKey="lastInspectorName" />
          </Column>
          <Column minWidth={120} flexGrow={1}>
            <HeaderCell>หมายเหตุล่าสุด</HeaderCell>
            <Cell>
              {(rowData) => (
                <span
                  style={{
                    color: (rowData as Extinguisher).lastRemark
                      ? "#444"
                      : "#aaa",
                    fontSize: 13,
                  }}
                >
                  {(rowData as Extinguisher).lastRemark || "-"}
                </span>
              )}
            </Cell>
          </Column>
          <Column width={90}>
            <HeaderCell>สถานะ</HeaderCell>
            <Cell>
              {(rowData) => (
                <Tag color={(rowData as Extinguisher).active ? "green" : "red"}>
                  {(rowData as Extinguisher).active ? "Active" : "Inactive"}
                </Tag>
              )}
            </Cell>
          </Column>
          <Column width={120} fixed="right">
            <HeaderCell>จัดการ</HeaderCell>
            <Cell>
              {(rowData) => (
                <ButtonToolbar>
                  <IconButton
                    icon={<EditIcon />}
                    size="xs"
                    onClick={() => openEdit(rowData as Extinguisher)}
                  />
                  <IconButton
                    icon={<TrashIcon />}
                    size="xs"
                    color="red"
                    appearance="subtle"
                    onClick={() => setDeleteTarget(rowData as Extinguisher)}
                  />
                  <IconButton
                    icon={
                      <span style={{ fontSize: 11, fontWeight: 700 }}>QR</span>
                    }
                    size="xs"
                    appearance="subtle"
                    onClick={() => setQrTarget(rowData as Extinguisher)}
                  />
                </ButtonToolbar>
              )}
            </Cell>
          </Column>
        </Table>
      </div>

      {/* Add / Edit Modal */}
      <Modal open={modalOpen} onClose={() => setModalOpen(false)} size="xs">
        <Modal.Header>
          <Modal.Title>
            {isEdit ? "แก้ไขถังดับเพลิง" : "เพิ่มถังดับเพลิง"}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form fluid>
            <Form.Group>
              <Form.Label>ID</Form.Label>
              <Input
                value={form.id}
                onChange={(v) => setForm({ ...form, id: v })}
                disabled={isEdit}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>รหัสถัง</Form.Label>
              <Input
                value={form.extinguisherCode}
                onChange={(v) => setForm({ ...form, extinguisherCode: v })}
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>ตำแหน่งที่ตั้ง</Form.Label>
              <SelectPicker
                data={locations}
                value={form.locationId}
                onChange={(v) => setForm({ ...form, locationId: v ?? "" })}
                cleanable={false}
                block
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>ประเภทถัง</Form.Label>
              <SelectPicker
                data={types}
                value={form.typeId}
                onChange={(v) => setForm({ ...form, typeId: v ?? "" })}
                cleanable={false}
                block
              />
            </Form.Group>
            <Form.Group>
              <Form.Label>วันที่เติมสารล่าสุด</Form.Label>
              <Input
                type="date"
                value={form.lastRefillDate}
                onChange={(v) => setForm({ ...form, lastRefillDate: v })}
              />
            </Form.Group>
            {isEdit && (
              <>
                <Form.Group>
                  <Form.Label>วันที่ตรวจล่าสุด</Form.Label>
                  <Input
                    value={formatDate(
                      data.find((d) => d.id === form.id)?.lastInspectedDate,
                    )}
                    disabled
                  />
                </Form.Group>
                <Form.Group>
                  <Form.Label>ชื่อผู้ตรวจล่าสุด</Form.Label>
                  <Input
                    value={
                      data.find((d) => d.id === form.id)?.lastInspectorName ??
                      "-"
                    }
                    disabled
                  />
                </Form.Group>
              </>
            )}
            <Form.Group>
              <Form.Label>สถานะ</Form.Label>
              <Toggle
                checked={form.active}
                onChange={(v) => setForm({ ...form, active: v })}
                checkedChildren="Active"
                unCheckedChildren="Inactive"
              />
            </Form.Group>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={handleSave}
            appearance="primary"
            loading={saving}
            style={{ background: "#ba0b1b", border: "none" }}
          >
            บันทึก
          </Button>
          <Button onClick={() => setModalOpen(false)} appearance="subtle">
            ยกเลิก
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Delete Modal */}
      <Modal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        size="xs"
      >
        <Modal.Header>
          <Modal.Title>ยืนยันการลบ</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          ต้องการลบถัง <strong>{deleteTarget?.id}</strong> ใช่หรือไม่?
        </Modal.Body>
        <Modal.Footer>
          <Button
            onClick={handleDelete}
            appearance="primary"
            color="red"
            loading={saving}
          >
            ลบ
          </Button>
          <Button onClick={() => setDeleteTarget(null)} appearance="subtle">
            ยกเลิก
          </Button>
        </Modal.Footer>
      </Modal>

      {/* QR Modal */}
      <Modal open={!!qrTarget} onClose={() => setQrTarget(null)} size="xs">
        <Modal.Header>
          <Modal.Title>
            QR Code — {qrTarget?.extinguisherCode || qrTarget?.id}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {qrTarget && (
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div
                style={{
                  width: 260,
                  borderRadius: 16,
                  overflow: "hidden",
                  boxShadow: "0 4px 16px rgba(0,0,0,0.12)",
                  background: "white",
                  border: "2px solid black",
                }}
              >
                <div
                  style={{
                    background: "#ba0b1b",
                    padding: "16px 20px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <span style={{ fontSize: 32 }}>🧯</span>
                </div>
                <div
                  id="qr-print"
                  style={{
                    display: "flex",
                    justifyContent: "center",
                    padding: "20px 20px 12px",
                  }}
                >
                  <QRCodeSVG
                    value={getInspectionUrl(String(qrTarget.id))}
                    size={180}
                    level="H"
                    includeMargin
                  />
                </div>
                <div
                  style={{
                    borderTop: "1px solid #f0f0f0",
                    padding: "12px 20px 20px",
                    textAlign: "center",
                  }}
                >
                  <div style={{ fontSize: 11, color: "#888", marginBottom: 4 }}>
                    รหัสถัง
                  </div>
                  <div
                    style={{
                      fontSize: 20,
                      fontWeight: 700,
                      color: "#ba0b1b",
                      marginBottom: 6,
                    }}
                  >
                    {qrTarget.extinguisherCode || qrTarget.id}
                  </div>
                  <div style={{ fontSize: 12, color: "#666" }}>
                    📍 {qrTarget.locationName}
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            appearance="primary"
            onClick={handleDownloadQR}
            style={{ background: "#ba0b1b", border: "none" }}
          >
            ดาวน์โหลด SVG
          </Button>
          <Button appearance="subtle" onClick={() => setQrTarget(null)}>
            ปิด
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
}
