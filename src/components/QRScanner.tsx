import { useEffect, useRef } from 'react'
import { Html5Qrcode } from 'html5-qrcode'

interface Props {
  onScan: (extinguisherNo: string) => void
  onClose: () => void
}

export default function QRScanner({ onScan, onClose }: Props) {
  const scannerRef = useRef<Html5Qrcode | null>(null)

  useEffect(() => {
    const scanner = new Html5Qrcode('qr-reader')
    scannerRef.current = scanner

    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 250, height: 250 } },
      (decodedText) => {
        try {
          const url = new URL(decodedText)
          const extNo = url.searchParams.get('extinguisherNo')
          if (extNo) {
            scanner.stop().then(() => onScan(extNo))
          }
        } catch {
          // ไม่ใช่ URL ที่ถูกต้อง
        }
      },
      () => {} // error callback ไม่ต้องทำอะไร
    ).catch(err => {
      console.error('QR Scanner error:', err)
      onClose()
    })

    return () => {
      scanner.isScanning && scanner.stop().catch(() => {})
    }
  }, [])

  return (
    <div style={{
      position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)',
      zIndex: 9999, display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{ color: 'white', fontSize: 16, fontWeight: 600, marginBottom: 20 }}>
        📷 สแกน QR Code ถังดับเพลิง
      </div>

      <div id="qr-reader" style={{ width: 300, borderRadius: 12, overflow: 'hidden' }} />

      <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: 13, marginTop: 16, textAlign: 'center' }}>
        จ่อกล้องไปที่ QR Code บนถังดับเพลิง
      </div>

      <button
        onClick={onClose}
        style={{
          marginTop: 24, padding: '12px 32px',
          background: 'white', border: 'none', borderRadius: 10,
          fontWeight: 600, fontSize: 15, cursor: 'pointer', color: '#ba0b1b'
        }}
      >
        ยกเลิก
      </button>
    </div>
  )
}