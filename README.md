# 🧯 FireSafe Tracker

ระบบบริหารจัดการและตรวจสอบถังดับเพลิง สร้างด้วย React + TypeScript เชื่อมต่อกับ Google Sheets และ Google Drive ผ่าน Google Apps Script

## ✨ Features

- 🔐 **Google OAuth Login** — เข้าสู่ระบบด้วย Google และตรวจสอบสิทธิ์จาก Google Sheets
- 🧯 **Master Data** — จัดการข้อมูลถังดับเพลิง ตำแหน่งที่ตั้ง ประเภทถัง และผู้ใช้งาน
- 📋 **Inspection Form** — กรอกผลตรวจสอบถังดับเพลิง พร้อมถ่ายรูปและอัปโหลดไปยัง Google Drive
- 📱 **QR Code** — สร้าง QR Code ประจำแต่ละถัง สแกนแล้วเข้าสู่ฟอร์มตรวจสอบได้เลย
- 📊 **Dashboard** — ภาพรวมสถานะถังทั้งหมด กราฟผลตรวจ และรายการที่ต้องดำเนินการ
- 📜 **History** — ดูประวัติการตรวจย้อนหลัง พร้อม filter และ Export Excel

## 🛠️ Tech Stack

| ส่วน | เทคโนโลยี |
|---|---|
| Frontend | React 18 + TypeScript + Vite |
| UI Library | React Suite (rsuite) |
| Charts | Recharts |
| Authentication | Google OAuth 2.0 |
| Database | Google Sheets |
| File Storage | Google Drive |
| Backend | Google Apps Script |
| QR Code | qrcode.react + html5-qrcode |
| Excel Export | SheetJS (xlsx) |
| Deployment | Vercel |

## 📁 Project Structure
src/
├── components/
│   ├── InspectionDetailModal.tsx
│   ├── DriveImage.tsx
│   └── QRScanner.tsx
├── hooks/
│   ├── useGoogleAuth.ts
│   └── useCurrentUser.ts
├── layouts/
│   └── MainLayout.tsx
├── pages/
│   ├── DashboardPage.tsx
│   ├── HistoryPage.tsx
│   ├── InspectionPage.tsx
│   ├── LoginPage.tsx
│   └── master/
│       ├── ExtinguisherPage.tsx
│       ├── ExtinguisherTypePage.tsx
│       ├── LocationPage.tsx
│       └── UserPage.tsx
├── services/
│   ├── dashboardService.ts
│   ├── driveService.ts
│   ├── extinguisherService.ts
│   ├── historyService.ts
│   ├── locationService.ts
│   ├── qrService.ts
│   ├── sheetAuth.ts
│   ├── typeService.ts
│   └── userService.ts
├── types/
│   └── auth.ts
└── utils/
└── formatDate.ts

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- Google Account
- Google Cloud Project

### Installation

```bash
# Clone repository
git clone https://github.com/yourusername/firesafe-tracker.git
cd firesafe-tracker

# Install dependencies
npm install
```

### Environment Variables

สร้างไฟล์ `.env` ที่ root ของโปรเจ็ค

```env
VITE_GOOGLE_CLIENT_ID=your_google_client_id.apps.googleusercontent.com
VITE_APPS_SCRIPT_URL=https://script.google.com/macros/s/your_deployment_id/exec
```

### Google Cloud Setup

1. ไปที่ [Google Cloud Console](https://console.cloud.google.com)
2. สร้าง Project ใหม่
3. เปิดใช้งาน **Google Sheets API** และ **Google Drive API**
4. สร้าง **OAuth 2.0 Client ID** ประเภท Web Application
5. เพิ่ม Authorized JavaScript origins
   - `http://localhost:5173` (development)
   - `https://yourdomain.vercel.app` (production)

### Google Apps Script Setup

1. เปิด Google Sheets ที่ต้องการใช้
2. ไปที่ **Extensions → Apps Script**
3. วางโค้ดจากไฟล์ `apps-script/Code.gs`
4. Deploy เป็น **Web App**
   - Execute as: **Me**
   - Who has access: **Anyone**
5. คัดลอก Deployment URL ไปใส่ใน `.env`

### Google Sheets Structure

สร้าง Sheet ต่อไปนี้ใน Spreadsheet เดียวกัน

| Sheet | Columns |
|---|---|
| `extinguishers` | id, extinguisherCode, locationId, typeId, lastResult, lastRefillDate, active, lastInspectedDate, lastInspectorName, driveFolderId, lastRemark |
| `inspections` | timestamp, inspectorName, extinguisherNo, tankCondition, hoseCondition, pressureGauge, noObstruction, sealCondition, labelVisible, result, remark, photoUrls |
| `locations` | id, code, name, remark, active |
| `extinguisher_types` | id, code, name, remark, active |
| `users` | id, email, firstName, lastName, role, active |

### Google Drive Setup

1. สร้าง folder ชื่อ **`FireSafe Inspections`** ใน Google Drive
2. คัดลอก Folder ID จาก URL
3. วาง Folder ID ใน Apps Script

```javascript
const DRIVE_PARENT_FOLDER_ID = 'your_folder_id'
```

### Run Development Server

```bash
npm run dev
```

## 📱 QR Code Usage

1. ไปที่ **Master → ถังดับเพลิง**
2. กดปุ่ม **QR** ที่แถวของถังที่ต้องการ
3. ดาวน์โหลด QR Code SVG และพิมพ์ติดที่ถัง
4. สแกน QR Code ด้วยมือถือ → เข้าสู่ฟอร์มตรวจสอบอัตโนมัติ

## 🚢 Deployment

### Vercel

```bash
# Build
npm run build

# หรือ deploy ผ่าน Vercel CLI
npm i -g vercel
vercel
```

หรือ connect GitHub repository กับ Vercel แล้ว auto deploy ทุกครั้งที่ push

อย่าลืมเพิ่ม Environment Variables ใน Vercel Dashboard ด้วยครับ

## 📄 License

MIT