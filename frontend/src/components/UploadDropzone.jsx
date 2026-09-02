import { useState } from 'react'
import api from '../api/client'

export default function UploadDropzone({ onUploaded }) {
  const [drag, setDrag] = useState(false)
  const [loading, setLoading] = useState(false)

  const upload = async (file) => {
    if (!file || !file.name.endsWith('.pdf')) {
      alert('Only PDF allowed')
      return
    }
    setLoading(true)
    const fd = new FormData()
    fd.append('file', file)
    try {
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      onUploaded && onUploaded(res.data)
    } catch (e) {
      alert(e.response?.data?.detail || 'Upload failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className={`dropzone ${drag ? 'drag' : ''}`}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]) }}
      onClick={() => document.getElementById('fileInp').click()}
    >
      <input id="fileInp" type="file" accept=".pdf" hidden onChange={e => upload(e.target.files[0])} />
      {loading ? <p>Uploading...</p> : <>
        <p style={{ fontWeight: 600 }}>Drop PDF here or click to browse</p>
        <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Supports up to 20MB • Summarize, Chat, Notes, Quiz</p>
      </>}
    </div>
  )
}
