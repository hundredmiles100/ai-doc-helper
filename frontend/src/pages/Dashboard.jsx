import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import UploadDropzone from '../components/UploadDropzone'

export default function Dashboard() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/documents')
      setDocs(res.data)
    } catch { }
    setLoading(false)
  }

  useEffect(() => { fetchDocs() }, [])

  const del = async (id) => {
    if (!confirm('Delete this document?')) return
    await api.delete(`/documents/${id}`)
    fetchDocs()
  }

  return (
    <div className="container">
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 8 }}>AI Document Helper</motion.h2>
      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ color: '#64748b', marginBottom: 16 }}>Upload PDFs, get summaries, ask questions, generate notes & quizzes. Example: upload 100-page textbook → "Explain chapter 4 simply".</motion.p>

      <UploadDropzone onUploaded={() => fetchDocs()} />

      <div style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h3>Your Documents ({docs.length})</h3>
        <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-secondary btn" onClick={fetchDocs}>Refresh</motion.button>
      </div>

      {loading ? <p style={{ marginTop: 12 }}>Loading...</p> : docs.length === 0 ? <p style={{ marginTop: 12, color: '#64748b' }}>No documents yet. Upload one above.</p> :
        <motion.div layout style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <AnimatePresence>
            {docs.map((d, i) => (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.04 }}
                whileHover={{ y: -2 }}
                className="card"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
              >
                <div>
                  <Link to={`/doc/${d.id}`} style={{ fontWeight: 600, color: '#0f172a' }}>{d.original_name}</Link>
                  <div style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>
                    <span className="badge">{d.page_count} pages</span> <span style={{ marginLeft: 6 }}>{(d.file_size / 1024).toFixed(0)} KB</span> <span style={{ marginLeft: 6 }}>{new Date(d.created_at).toLocaleString()}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', marginTop: 6 }}>{d.preview?.slice(0, 120)}...</p>
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 12 }}>
                  <Link to={`/doc/${d.id}`} className="btn">Open</Link>
                  <motion.button whileTap={{ scale: 0.95 }} className="btn-secondary btn" onClick={() => del(d.id)}>Delete</motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      }
    </div>
  )
}

