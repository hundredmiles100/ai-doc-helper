import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import UploadDropzone from '../components/UploadDropzone'
import { toast } from '../components/Toast'

export default function Dashboard() {
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/documents')
      setDocs(res.data)
    } catch { toast('Failed to load docs', 'error') }
    setLoading(false)
  }

  useEffect(() => { fetchDocs() }, [])

  const del = async (id) => {
    if (!confirm('Delete this document?')) return
    await api.delete(`/documents/${id}`)
    toast('Document deleted', 'success')
    fetchDocs()
  }

  const filtered = useMemo(() => {
    let arr = [...docs]
    if (query) {
      arr = arr.filter(d => d.original_name.toLowerCase().includes(query.toLowerCase()))
    }
    if (sort === 'newest') arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (sort === 'pages') arr.sort((a, b) => b.page_count - a.page_count)
    if (sort === 'name') arr.sort((a, b) => a.original_name.localeCompare(b.original_name))
    return arr
  }, [docs, query, sort])

  const totalPages = docs.reduce((s, d) => s + (d.page_count || 0), 0)

  return (
    <div className="container">
      {/* hero */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="card"
        style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e1b4b 45%, #312e81 100%)',
          color: 'white',
          border: 'none',
          overflow: 'hidden',
          position: 'relative',
          padding: 28
        }}
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(600px 300px at 85% 0%, rgba(6,182,214,0.25), transparent 60%)', pointerEvents: 'none' }} />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 40, repeat: Infinity, ease: 'linear' }}
          style={{ position: 'absolute', width: 280, height: 280, right: -40, top: -80, borderRadius: '50%', border: '1px solid rgba(255,255,255,0.08)', pointerEvents: 'none' }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640 }}>
          <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} style={{ fontSize: 12, letterSpacing: '0.08em', opacity: 0.7, fontWeight: 700 }}>AI DOCUMENT HELPER • FOR STUDENTS</motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.1, marginTop: 8 }}
          >
            Turn any PDF into <span style={{ background: 'linear-gradient(90deg, #a5b4fc, #67e8f9)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>notes, quizzes & answers</span>
          </motion.h1>
          <p style={{ marginTop: 10, opacity: 0.85, fontSize: 14, lineHeight: 1.5 }}>Upload a 100-page textbook → ask “Explain chapter 4 simply” → get table-formatted notes instantly. Works locally without API key.</p>
          <div style={{ display: 'flex', gap: 8, marginTop: 14, flexWrap: 'wrap' }}>
            <span style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', padding: '5px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>📝 Summarize</span>
            <span style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', padding: '5px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>💬 Ask</span>
            <span style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', padding: '5px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>📊 Tables</span>
            <span style={{ background: 'rgba(255,255,255,0.14)', border: '1px solid rgba(255,255,255,0.18)', padding: '5px 10px', borderRadius: 999, fontSize: 12, fontWeight: 600 }}>🧠 Quiz</span>
          </div>
        </div>
      </motion.div>

      {/* stats */}
      <div className="grid" style={{ marginTop: 16, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Documents', value: docs.length, sub: `${totalPages} pages total`, icon: '📚' },
          { label: 'AI Ready', value: docs.length ? 'Mock → Real' : '—', sub: 'Add OPENAI_API_KEY', icon: '⚡' },
          { label: 'Features', value: '6-in-1', sub: 'Summarize • Chat • Extract', icon: '✨' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            whileHover={{ y: -3 }}
            className="card"
            style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}
          >
            <div style={{ width: 42, height: 42, borderRadius: 10, background: 'linear-gradient(135deg, #eef2ff, #f1f5f9)', display: 'grid', placeItems: 'center', fontSize: 18, border: '1px solid #e2e8f0' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800 }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#64748b', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} style={{ marginTop: 18 }}>
        <UploadDropzone onUploaded={() => fetchDocs()} />
      </motion.div>

      {/* controls */}
      <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 16 }}>Your Documents ({filtered.length})</h3>
        <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 520, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8' }}>🔍</span>
            <input
              className="input"
              placeholder="Search PDFs…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ paddingLeft: 30 }}
            />
          </div>
          <select className="select" value={sort} onChange={e => setSort(e.target.value)} style={{ width: 140 }}>
            <option value="newest">Newest</option>
            <option value="pages">Most pages</option>
            <option value="name">Name A-Z</option>
          </select>
          <motion.button whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.97 }} className="btn-secondary btn" onClick={fetchDocs}>↻ Refresh</motion.button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="card shimmer" style={{ height: 86, borderRadius: 16 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="card"
          style={{ marginTop: 12, textAlign: 'center', padding: 28, borderStyle: 'dashed' }}
        >
          <div style={{ fontSize: 32, marginBottom: 8 }}>📭</div>
          <p style={{ fontWeight: 700 }}>{query ? `No match for "${query}"` : 'No documents yet'}</p>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4 }}>{query ? 'Try another keyword' : 'Upload a PDF above to get started — tables, notes & quizzes in seconds.'}</p>
        </motion.div>
      ) : (
        <motion.div layout style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          <AnimatePresence>
            {filtered.map((d, i) => (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.035, type: 'spring', stiffness: 300, damping: 25 }}
                whileHover={{ y: -3, boxShadow: '0 16px 40px rgba(15,23,42,0.10)' }}
                className="card"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Link to={`/doc/${d.id}`} style={{ fontWeight: 700, color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{d.original_name}</Link>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 5, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="badge badge-accent">{d.page_count} pages</span>
                    <span className="badge">{(d.file_size / 1024).toFixed(0)} KB</span>
                    <span style={{ color: '#94a3b8' }}>{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', marginTop: 6, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{d.preview || 'No preview'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 12, flexShrink: 0 }}>
                  <Link to={`/doc/${d.id}`} className="btn">Open →</Link>
                  <motion.button whileTap={{ scale: 0.95 }} className="btn-secondary btn" onClick={() => del(d.id)}>Delete</motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
