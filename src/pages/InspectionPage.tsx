import { useEffect, useState, useRef } from "react";
import { useToaster, Message, SelectPicker, Input, Button, Tag } from "rsuite";
import { useSearchParams } from "react-router-dom";
import {
  getExtinguishers,
  type Extinguisher,
} from "../services/extinguisherService";
import { uploadFileToDrive } from "../services/driveService";
import { formatDate } from "../utils/formatDate";
import type { User } from "../services/userService";
import QRScanner from "../components/QRScanner";

interface Props {
  currentUser: User | null;
  accessToken: string | null;
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

function InspectionPage({ currentUser, accessToken }: Props) {
  const APPS_SCRIPT_URL = import.meta.env.VITE_APPS_SCRIPT_URL as string;
  const toaster = useToaster();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchParams] = useSearchParams();

  const [extinguishers, setExtinguishers] = useState<Extinguisher[]>([]);
  const [extOptions, setExtOptions] = useState<
    { label: string; value: string }[]
  >([]);
  const [saving, setSaving] = useState(false);
  const [step, setStep] = useState<"form" | "confirm" | "success">("form");
  const [photos, setPhotos] = useState<File[]>([]);
  const [photoPreviews, setPhotoPreviews] = useState<string[]>([]);
  const [showScanner, setShowScanner] = useState(false);

  const inspectorName = currentUser
    ? `${currentUser.firstName} ${currentUser.lastName}`
    : "";

  const emptyForm = () => ({
    action: "saveData",
    timestamp: new Date().toLocaleString("en-US"),
    inspectorName,
    extinguisherNo: "",
    tankCondition: "PASS",
    hoseCondition: "PASS",
    pressureGauge: "PASS",
    noObstruction: "PASS",
    sealCondition: "PASS",
    labelVisible: "PASS",
    result: "PASS",
    remark: "",
  });

  const [formData, setFormData] = useState(emptyForm);

  useEffect(() => {
    getExtinguishers().then((res) => {
      setExtinguishers(res.data.filter((e: Extinguisher) => e.active));
      setExtOptions(
        res.data
          .filter((e: Extinguisher) => e.active)
          .map((e: Extinguisher) => ({
            label: `${e.id}${e.extinguisherCode ? ` - ${e.extinguisherCode}` : ""} (${e.locationName})`,
            value: String(e.id),
          })),
      );
    });
  }, []);

  useEffect(() => {
    const extNo = searchParams.get("extinguisherNo");
    if (extNo) setFormData((prev) => ({ ...prev, extinguisherNo: extNo }));
  }, [searchParams]);

  useEffect(() => {
    if (inspectorName) setFormData((prev) => ({ ...prev, inspectorName }));
  }, [inspectorName]);

  useEffect(() => {
    const result = CHECKS.map(
      (c) => formData[c.name as keyof typeof formData],
    ).includes("FAIL")
      ? "FAIL"
      : "PASS";
    setFormData((prev) => ({ ...prev, result }));
  }, [
    formData.tankCondition,
    formData.hoseCondition,
    formData.pressureGauge,
    formData.noObstruction,
    formData.sealCondition,
    formData.labelVisible,
  ]);

  const toggle = (name: string) => {
    const current = formData[name as keyof typeof formData];
    setFormData((prev) => ({
      ...prev,
      [name]: current === "PASS" ? "FAIL" : "PASS",
    }));
  };

  const isPass = (name: string) =>
    formData[name as keyof typeof formData] === "PASS";

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (photos.length + files.length > 6) {
      toaster.push(
        <Message type="warning" showIcon closable duration={3000}>
          อัปโหลดได้สูงสุด 6 รูป
        </Message>,
        { placement: "topCenter" },
      );
      return;
    }
    const newPhotos = [...photos, ...files].slice(0, 6);
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map((f) => URL.createObjectURL(f)));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const removePhoto = (index: number) => {
    const newPhotos = photos.filter((_, i) => i !== index);
    setPhotos(newPhotos);
    setPhotoPreviews(newPhotos.map((f) => URL.createObjectURL(f)));
  };

  const handleNext = () => {
    if (!formData.extinguisherNo) {
      toaster.push(
        <Message type="warning" showIcon closable duration={3000}>
          กรุณาเลือกหมายเลขถัง
        </Message>,
        { placement: "topCenter" },
      );
      return;
    }
    setStep("confirm");
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      let photoUrls: string[] = [];

      if (photos.length > 0 && accessToken) {
        const selectedExt = extinguishers.find(
          (e) => String(e.id) === formData.extinguisherNo,
        );
        const folderId = selectedExt?.driveFolderId;
        if (folderId) {
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          const uploadResults = await Promise.all(
            photos.map((photo, i) => {
              const ext = photo.name.split(".").pop();
              const fileName = `${formData.extinguisherNo}_${timestamp}_${i + 1}.${ext}`;
              const renamedFile = new File([photo], fileName, {
                type: photo.type,
              });
              return uploadFileToDrive(renamedFile, folderId, accessToken);
            }),
          );
          photoUrls = uploadResults.map(
            (fileId) => `https://drive.google.com/file/d/${fileId}/view`,
          );
        }
      }

      await fetch(APPS_SCRIPT_URL, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          photoUrls: JSON.stringify(photoUrls), // ส่งเป็น JSON string
        }),
      });

      toaster.push(
        <Message type="success" showIcon closable duration={3000}>
          บันทึกข้อมูลสำเร็จ
        </Message>,
        { placement: "topCenter" },
      );

      setFormData(emptyForm());
      setPhotos([]);
      setPhotoPreviews([]);
      setStep("success");
    } catch (error) {
      console.error(error);
      toaster.push(
        <Message type="error" showIcon closable duration={4000}>
          บันทึกไม่สำเร็จ กรุณาลองใหม่
        </Message>,
        { placement: "topCenter" },
      );
    } finally {
      setSaving(false);
    }
  };

  // Success Screen
  if (step === "success") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 4px" }}>
        <div
          style={{
            background: "white",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
            textAlign: "center",
          }}
        >
          <div style={{ background: "#16a34a", padding: "40px 20px" }}>
            <div style={{ fontSize: 60, marginBottom: 8 }}>✅</div>
            <div style={{ color: "white", fontSize: 24, fontWeight: 700 }}>
              บันทึกสำเร็จ
            </div>
          </div>
          <div
            style={{
              padding: "24px 20px",
              display: "flex",
              flexDirection: "column",
              gap: 12,
            }}
          >
            <Button
              appearance="primary"
              block
              onClick={() => setShowScanner(true)}
              style={{
                background: "#ba0b1b",
                border: "none",
                borderRadius: 10,
                padding: "14px 0",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              📷 สแกน QR ถังต่อไป
            </Button>
            <Button
              appearance="subtle"
              block
              onClick={() => setStep("form")}
              style={{
                borderRadius: 10,
                padding: "14px 0",
                fontWeight: 600,
                fontSize: 15,
              }}
            >
              ตรวจถังนี้อีกครั้ง
            </Button>
          </div>
        </div>

        {showScanner && (
          <QRScanner
            onScan={(extNo) => {
              setFormData({ ...emptyForm(), extinguisherNo: extNo });
              setShowScanner(false);
              setStep("form");
            }}
            onClose={() => setShowScanner(false)}
          />
        )}
      </div>
    );
  }

  // Confirm Screen
  if (step === "confirm") {
    return (
      <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 4px" }}>
        <div style={{ marginBottom: 20 }}>
          <button
            onClick={() => setStep("form")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "#ba0b1b",
              fontWeight: 600,
              fontSize: 15,
              padding: 0,
            }}
          >
            ← แก้ไข
          </button>
        </div>
        <div
          style={{
            background: "white",
            borderRadius: 16,
            overflow: "hidden",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          }}
        >
          <div
            style={{
              background: formData.result === "PASS" ? "#16a34a" : "#ba0b1b",
              padding: "24px 20px",
              textAlign: "center",
            }}
          >
            <div style={{ fontSize: 40, marginBottom: 4 }}>
              {formData.result === "PASS" ? "✅" : "❌"}
            </div>
            <div style={{ color: "white", fontSize: 28, fontWeight: 700 }}>
              {formData.result}
            </div>
            <div
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: 13,
                marginTop: 4,
              }}
            >
              ผลการตรวจสอบ
            </div>
          </div>
          <div style={{ padding: "20px" }}>
            <div
              style={{
                marginBottom: 16,
                padding: "12px 16px",
                background: "#f9fafb",
                borderRadius: 10,
              }}
            >
              <Row label="ผู้ตรวจ" value={formData.inspectorName} />
              <Row
                label="ถัง"
                value={
                  extinguishers.find(
                    (e) => String(e.id) === formData.extinguisherNo,
                  )?.extinguisherCode || formData.extinguisherNo
                }
              />
              <Row label="วันที่" value={formatDate(formData.timestamp)} />
            </div>
            <div style={{ marginBottom: 16 }}>
              {CHECKS.map((c) => (
                <div
                  key={c.name}
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    padding: "10px 0",
                    borderBottom: "1px solid #f0f0f0",
                  }}
                >
                  <span style={{ fontSize: 14, color: "#444" }}>{c.label}</span>
                  <Tag color={isPass(c.name) ? "green" : "red"}>
                    {isPass(c.name) ? "PASS" : "FAIL"}
                  </Tag>
                </div>
              ))}
            </div>
            {photoPreviews.length > 0 && (
              <div style={{ marginBottom: 16 }}>
                <div style={{ fontSize: 13, color: "#888", marginBottom: 8 }}>
                  รูปภาพ ({photoPreviews.length} รูป)
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(3, 1fr)",
                    gap: 8,
                  }}
                >
                  {photoPreviews.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`photo-${i}`}
                      style={{
                        width: "100%",
                        aspectRatio: "1",
                        objectFit: "cover",
                        borderRadius: 8,
                      }}
                    />
                  ))}
                </div>
              </div>
            )}
            {formData.remark && (
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
                {formData.remark}
              </div>
            )}
            <Button
              appearance="primary"
              block
              loading={saving}
              onClick={handleSubmit}
              style={{
                background: "#ba0b1b",
                border: "none",
                borderRadius: 10,
                padding: "14px 0",
                fontWeight: 600,
                fontSize: 16,
              }}
            >
              ยืนยันบันทึก
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Main Form
  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: "0 4px" }}>
      <h2 style={{ marginBottom: 20 }}>Inspection Form</h2>

      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: "20px",
          marginBottom: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
            ผู้ตรวจ
          </div>
          <Input value={formData.inspectorName} disabled />
        </div>
        <div style={{ marginBottom: 14 }}>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
            วันที่ตรวจ
          </div>
          <Input value={formatDate(formData.timestamp)} disabled />
        </div>
        <div>
          <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
            เลือกถังดับเพลิง <span style={{ color: "#ba0b1b" }}>*</span>
          </div>
          <SelectPicker
            data={extOptions}
            value={formData.extinguisherNo}
            onChange={(v) =>
              setFormData({ ...formData, extinguisherNo: v ?? "" })
            }
            cleanable={false}
            block
            placeholder="เลือกถัง..."
          />
        </div>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 16,
          overflow: "hidden",
          marginBottom: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        }}
      >
        <div
          style={{
            padding: "14px 20px",
            borderBottom: "1px solid #f0f0f0",
            fontWeight: 600,
            color: "#ba0b1b",
            fontSize: 14,
          }}
        >
          รายการตรวจสอบ
        </div>
        {CHECKS.map((c, i) => (
          <div
            key={c.name}
            onClick={() => toggle(c.name)}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom:
                i < CHECKS.length - 1 ? "1px solid #f0f0f0" : "none",
              cursor: "pointer",
              background: !isPass(c.name) ? "#fff5f5" : "white",
            }}
          >
            <div style={{ flex: 1, marginRight: 12 }}>
              <div style={{ fontWeight: 500, fontSize: 14 }}>{c.label}</div>
              <div style={{ fontSize: 12, color: "#888", marginTop: 2 }}>
                {c.desc}
              </div>
            </div>
            <div
              style={{
                minWidth: 64,
                height: 32,
                borderRadius: 20,
                background: isPass(c.name) ? "#dcfce7" : "#fee2e2",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontWeight: 700,
                fontSize: 13,
                color: isPass(c.name) ? "#16a34a" : "#ba0b1b",
                border: `1.5px solid ${isPass(c.name) ? "#16a34a" : "#ba0b1b"}`,
                userSelect: "none",
              }}
            >
              {isPass(c.name) ? "PASS" : "FAIL"}
            </div>
          </div>
        ))}
      </div>

      <div
        style={{
          borderRadius: 16,
          padding: "16px 20px",
          marginBottom: 16,
          background: formData.result === "PASS" ? "#f0fdf4" : "#fff5f5",
          border: `2px solid ${formData.result === "PASS" ? "#16a34a" : "#ba0b1b"}`,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span style={{ fontWeight: 600, fontSize: 15 }}>ผลการตรวจ</span>
        <span
          style={{
            fontWeight: 700,
            fontSize: 22,
            color: formData.result === "PASS" ? "#16a34a" : "#ba0b1b",
          }}
        >
          {formData.result === "PASS" ? "✅ PASS" : "❌ FAIL"}
        </span>
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: "20px",
          marginBottom: 16,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        }}
      >
        <div
          style={{
            fontWeight: 600,
            fontSize: 14,
            marginBottom: 12,
            color: "#444",
          }}
        >
          📷 รูปภาพประกอบ
          <span
            style={{
              fontWeight: 400,
              fontSize: 12,
              color: "#aaa",
              marginLeft: 8,
            }}
          >
            (ไม่บังคับ สูงสุด 6 รูป)
          </span>
        </div>
        {photoPreviews.length > 0 && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(3, 1fr)",
              gap: 8,
              marginBottom: 12,
            }}
          >
            {photoPreviews.map((src, i) => (
              <div key={i} style={{ position: "relative" }}>
                <img
                  src={src}
                  alt={`photo-${i}`}
                  style={{
                    width: "100%",
                    aspectRatio: "1",
                    objectFit: "cover",
                    borderRadius: 8,
                  }}
                />
                <button
                  onClick={() => removePhoto(i)}
                  style={{
                    position: "absolute",
                    top: 4,
                    right: 4,
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "rgba(0,0,0,0.6)",
                    color: "white",
                    border: "none",
                    cursor: "pointer",
                    fontSize: 12,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}
        {photos.length < 6 && (
          <>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              multiple
              onChange={handlePhotoChange}
              style={{ display: "none" }}
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              style={{
                width: "100%",
                padding: "12px",
                border: "2px dashed #d1d5db",
                borderRadius: 10,
                background: "#f9fafb",
                cursor: "pointer",
                fontSize: 14,
                color: "#6b7280",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 8,
              }}
            >
              📷{" "}
              {photos.length === 0
                ? "ถ่ายหรืออัปโหลดรูป"
                : `เพิ่มรูป (${photos.length}/6)`}
            </button>
          </>
        )}
      </div>

      <div
        style={{
          background: "white",
          borderRadius: 16,
          padding: "20px",
          marginBottom: 20,
          boxShadow: "0 1px 4px rgba(0,0,0,0.07)",
        }}
      >
        <div style={{ fontSize: 12, color: "#888", marginBottom: 6 }}>
          หมายเหตุ (ถ้ามี)
        </div>
        <Input
          as="textarea"
          rows={3}
          value={formData.remark}
          onChange={(v) => setFormData({ ...formData, remark: v })}
          placeholder="ระบุรายละเอียดเพิ่มเติม..."
        />
      </div>

      <Button
        appearance="primary"
        block
        onClick={handleNext}
        style={{
          background: "#ba0b1b",
          border: "none",
          borderRadius: 10,
          padding: "14px 0",
          fontWeight: 600,
          fontSize: 16,
        }}
      >
        ถัดไป → ตรวจสอบก่อนบันทึก
      </Button>

      {showScanner && (
        <QRScanner
          onScan={(extNo) => {
            setFormData({ ...emptyForm(), extinguisherNo: extNo });
            setShowScanner(false);
            setStep("form");
          }}
          onClose={() => setShowScanner(false)}
        />
      )}
    </div>
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
      <span style={{ fontWeight: 500 }}>{value}</span>
    </div>
  );
}

export default InspectionPage;
