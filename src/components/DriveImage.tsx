import { useEffect, useState } from 'react'
import { fetchImageAsBlob } from '../services/driveService'

interface Props {
  fileId: string
  accessToken: string
  viewUrl: string
  style?: React.CSSProperties
}

export default function DriveImage({ fileId, accessToken, viewUrl, style }: Props) {
  const [src, setSrc] = useState<string | null>(null)
  const [error, setError] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    let objectUrl: string | null = null

    fetchImageAsBlob(fileId, accessToken)
      .then(url => {
        objectUrl = url
        setSrc(url)
      })
      .catch(err => {
        console.error(err)
        if (err.message.includes('401')) {
          setErrorMsg('Token หมดอายุ กรุณา login ใหม่')
        }
        setError(true)
      })

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl)
    }
  }, [fileId, accessToken])

  if (error) {
    return (
      <a href={viewUrl} target="_blank" rel="noopener noreferrer">
        <div style={{
          width: '100%', aspectRatio: '1', background: '#f3f4f6',
          borderRadius: 8, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center',
          fontSize: 24, gap: 4, cursor: 'pointer', ...style
        }}>
          <span>📷</span>
          <span style={{ fontSize: 11, color: '#888' }}>
            {errorMsg || 'กดเพื่อดู'}
          </span>
        </div>
      </a>
    )
  }

  if (!src) {
    return (
      <div style={{
        width: '100%', aspectRatio: '1', background: '#f3f4f6',
        borderRadius: 8, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: 20, ...style
      }}>
        ⏳
      </div>
    )
  }

  return (
    <a href={viewUrl} target="_blank" rel="noopener noreferrer">
      <img
        src={src}
        alt="inspection photo"
        style={{
          width: '100%', aspectRatio: '1',
          objectFit: 'cover', borderRadius: 8,
          border: '1px solid #f0f0f0', cursor: 'pointer',
          ...style
        }}
      />
    </a>
  )
}