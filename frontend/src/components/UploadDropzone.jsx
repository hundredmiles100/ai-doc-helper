import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import { toast } from './Toast'

export default function UploadDropzone({ onUploaded }) {
  const [drag, setDrag] = useState(false)
  const [loading, setLoading] = useState(false)
  const [progress, setProgress] = useState(0)

  const upload = async (file) => {
    if (!file || !file.name.toLowerCase().endsWith('.pdf')) {
      toast('Only PDF files allowed', 'error')
      return
    }
    setLoading(true)
    setProgress(10)
    const fd = new FormData()
    fd.append('file', file)
    const interval = setInterval(() => setProgress(p => Math.min(p + 18, 90)), 200)
    try {
      const res = await api.post('/upload', fd, { headers: { 'Content-Type': 'multipart/form-data' } })
      clearInterval(interval)
      setProgress(100)
      toast(`Uploaded ${file.name} — ${res.data.page_count} pages`, 'success')
      setTimeout(() => {
        onUploaded && onUploaded(res.data)
        setProgress(0)
        setLoading(false)
      }, 400)
    } catch (e) {
      clearInterval(interval)
      toast(e.response?.data?.detail || 'Upload failed', 'error')
      setLoading(false)
      setProgress(0)
    }
  }

  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      whileTap={{ scale: 0.995 }}
      className={`dropzone ${drag ? 'drag' : ''}`}
      onDragOver={e => { e.preventDefault(); setDrag(true) }}
      onDragLeave={() => setDrag(false)}
      onDrop={e => { e.preventDefault(); setDrag(false); upload(e.dataTransfer.files[0]) }}
      onClick={() => !loading && document.getElementById('fileInp').click()}
      animate={drag ? { scale: 1.015 } : {}}
      transition={{ type: 'spring', stiffness: 400, damping: 25 }}
      style={{ position: 'relative' }}
    >
      <input id="fileInp" type="file" accept=".pdf" hidden onChange={e => upload(e.target.files[0])} />

      <AnimatePresence mode="wait">
        {loading ? (
          <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'relative', zIndex: 1 }}>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
              style={{ width: 32, height: 32, border: '3px solid #e2e8f0', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 10px' }}
            />
            <p style={{ fontWeight: 600 }}>Uploading… {progress}%</p>
            <div style={{ height: 4, background: '#f1f5f9', borderRadius: 999, marginTop: 12, overflow: 'hidden', maxWidth: 220, margin: '12px auto 0' }}>
              <motion.div animate={{ width: `${progress}%` }} transition={{ ease: 'easeOut' }} style={{ height: '100%', background: 'linear-gradient(90deg, #4f46e5, #06b6d4)', borderRadius: 999 }} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'relative', zIndex: 1 }}>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ fontSize: 28, marginBottom: 8 }}
            >📄</motion.div>
            <p style={{ fontWeight: 700, fontSize: 15 }}>Drop PDF here or click to browse</p>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Up to 20MB • Summarize, Chat, Notes, Quiz instantly</p>
            <div style={{ display: 'flex', gap: 6, justifyContent: 'center', marginTop: 10, flexWrap: 'wrap' }}>
              {['Summarize', 'Ask', 'Notes', 'Quiz', 'Compare'].map(tag => (
                <span key={tag} style={{ fontSize: 11, padding: '3px 8px', background: 'white', border: '1px solid #e2e8f0', borderRadius: 999, fontWeight: 600, color: '#475569' }}>{tag}</span>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
