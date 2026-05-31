import { Modal, Tag, Divider, Button } from "rsuite";
import { formatDate } from "../utils/formatDate";
import type { RecentInspection } from "../services/dashboardService";
import DriveImage from './DriveImage'

interface Props {
  data: RecentInspection | null;
  accessToken: string | null;
  onClose: () => void;
}

const CHECKS = [
  {
    name: "tankCondition",
    label: "สภาพถัง",
    desc: "ไม่มีรอยแตกร้าว สนิม หรือชำรุด",
  },
  { name: "hoseCondition", label: "สายฉีด", desc: "ไม่ขาด แตก หรือชำรุด" },
  {
    name: "pressureGauge",
    label: "เข็มแรงดัน",
    desc: "อยู่ในโซนเขียว (ผงเคมีแห้ง)",
  },
  { name: "noObstruction", label: "พื้นที่โดยรอบ", desc: "ไม่มีสิ่งกีดขวาง" },
  { name: "sealCondition", label: "สลัก / ซีล", desc: "อยู่ครบ ไม่ถูกดัดแปลง" },
  { name: "labelVisible", label: "ป้ายประจำถัง", desc: "มองเห็นได้ชัดเจน" },
];

export default function InspectionDetailModal({
  data,
  accessToken,
  onClose,
}: Props) {
  if (!data) return null;

  const photoUrls: string[] = (() => {
    try {
      return JSON.parse(data.photoUrls || "[]");
    } catch {
      return [];
    }
  })();

  return (
    <Modal open={!!data} onClose={onClose} size="sm">
      <Modal.Header>
        <Modal.Title>รายละเอียดการตรวจ</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {/* Result Banner */}
        <div
          style={{
            background: data.result === "PASS" ? "#16a34a" : "#ba0b1b",
            borderRadius: 12,
            padding: "16px 20px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ color: "white" }}>
            <div style={{ fontSize: 13, opacity: 0.8 }}>ผลการตรวจ</div>
            <div style={{ fontSize: 24, fontWeight: 700 }}>
              {data.result === "PASS" ? "✅ PASS" : "❌ FAIL"}
            </div>
          </div>
          <div
            style={{
              textAlign: "right",
              color: "rgba(255,255,255,0.85)",
              fontSize: 13,
            }}
          >
            <div>{formatDate(data.timestamp)}</div>
            <div>{data.inspectorName}</div>
          </div>
        </div>

        {/* Info */}
        <div
          style={{
            background: "#f9fafb",
            borderRadius: 10,
            padding: "12px 16px",
            marginBottom: 16,
          }}
        >
          <Row label="หมายเลขถัง" value={data.extinguisherNo} />
          <Row label="รหัสถัง" value={data.extinguisherCode} />
          <Row label="ตำแหน่ง" value={data.locationName} />
          <Row label="ประเภท" value={data.typeName} />
        </div>

        {/* Check Items */}
        <div style={{ marginBottom: 16 }}>
          <div
            style={{
              fontWeight: 600,
              fontSize: 14,
              color: "#ba0b1b",
              marginBottom: 10,
            }}
          >
            รายการตรวจสอบ
          </div>
          {CHECKS.map((c, i) => {
            const val = data[c.name as keyof RecentInspection] as string;
            const isPass = val === "PASS";
            return (
              <div
                key={c.name}
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  padding: "10px 0",
                  borderBottom:
                    i < CHECKS.length - 1 ? "1px solid #f0f0f0" : "none",
                  background: !isPass ? "#fff5f5" : "white",
                  borderRadius: 4,
                  paddingLeft: 8,
                  paddingRight: 8,
                }}
              >
                <div>
                  <div style={{ fontSize: 14, fontWeight: 500 }}>{c.label}</div>
                  <div style={{ fontSize: 12, color: "#888" }}>{c.desc}</div>
                </div>
                <Tag color={isPass ? "green" : "red"}>
                  {isPass ? "PASS" : "FAIL"}
                </Tag>
              </div>
            );
          })}
        </div>

        {/* Remark */}
        {data.remark && (
          <div
            style={{
              marginBottom: 16,
              padding: "10px 14px",
              background: "#fffbeb",
              borderRadius: 8,
              fontSize: 13,
              color: "#92400e",
            }}
          >
            <span style={{ fontWeight: 600 }}>หมายเหตุ: </span>
            {data.remark}
          </div>
        )}

        {/* Photos */}
        {photoUrls.length > 0 && accessToken && (
  <>
    <Divider style={{ margin: '12px 0' }} />
    <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 10 }}>
      📷 รูปภาพ ({photoUrls.length} รูป)
    </div>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
      {photoUrls.map((url, i) => {
        const match = url.match(/\/d\/(.*?)\//)
        const fileId = match?.[1]
        if (!fileId) return null
        return (
          <DriveImage
            key={i}
            fileId={fileId}
            accessToken={accessToken}
            viewUrl={url}
          />
        )
      })}
    </div>
  </>
)}
      </Modal.Body>
      <Modal.Footer>
        <Button onClick={onClose} appearance="subtle">
          ปิด
        </Button>
      </Modal.Footer>
    </Modal>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        padding: "4px 0",
        fontSize: 13,
      }}
    >
      <span style={{ color: "#888" }}>{label}</span>
      <span style={{ fontWeight: 500 }}>{value || "-"}</span>
    </div>
  );
}
