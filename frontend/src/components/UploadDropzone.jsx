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
      toast('Please choose a PDF file', 'error')
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
      toast(`Added “${file.name}”`, 'success')
      setTimeout(() => {
        onUploaded && onUploaded(res.data)
        setProgress(0)
        setLoading(false)
      }, 400)
    } catch (e) {
      clearInterval(interval)
      toast(e.response?.data?.detail || 'Upload failed — try again', 'error')
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
              style={{ width: 32, height: 32, border: '3px solid rgba(255,255,255,0.9)', borderTopColor: '#4f46e5', borderRadius: '50%', margin: '0 auto 10px', background: 'rgba(255,255,255,0.6)' }}
            />
            <p style={{ fontWeight: 650, fontSize: 14 }}>Uploading… {progress}%</p>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Keeping it private to you</p>
            <div style={{ height: 6, background: 'rgba(255,255,255,0.7)', borderRadius: 999, marginTop: 12, overflow: 'hidden', maxWidth: 220, margin: '12px auto 0', border: '1px solid rgba(255,255,255,0.9)' }}>
              <motion.div animate={{ width: `${progress}%` }} transition={{ ease: 'easeOut' }} style={{ height: '100%', background: 'linear-gradient(90deg, #4f46e5, #06b6d4)', borderRadius: 999 }} />
            </div>
          </motion.div>
        ) : (
          <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ position: 'relative', zIndex: 1 }}>
            <motion.div
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 2.2, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width: 52, height: 52, borderRadius: 14, background: 'rgba(255,255,255,0.75)', border: '1px solid rgba(255,255,255,0.9)', display: 'grid', placeItems: 'center', margin: '0 auto 12px', fontSize: 22, boxShadow: '0 4px 16px rgba(15,23,42,0.06)' }}
            >⬆</motion.div>
            <p style={{ fontWeight: 750, fontSize: 15, letterSpacing: '-0.01em' }}>Drop your PDF here or click to browse</p>
            <p style={{ fontSize: 13, color: '#64748b', marginTop: 6 }}>Private to you • up to 20 MB</p>
            <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>We’ll turn it into summaries, notes & quizzes</p>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}
