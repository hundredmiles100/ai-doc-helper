import { useEffect, useState, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import UploadDropzone from '../components/UploadDropzone'
import { toast } from '../components/Toast'
import { useAuth } from '../context/AuthContext'

export default function Dashboard() {
  const { user } = useAuth()
  const [docs, setDocs] = useState([])
  const [loading, setLoading] = useState(true)
  const [query, setQuery] = useState('')
  const [sort, setSort] = useState('newest')

  const fetchDocs = async () => {
    setLoading(true)
    try {
      const res = await api.get('/documents')
      setDocs(res.data)
    } catch { toast('Could not load your documents', 'error') }
    setLoading(false)
  }

  useEffect(() => { fetchDocs() }, [])

  const del = async (id) => {
    if (!confirm('Delete this document? This cannot be undone.')) return
    await api.delete(`/documents/${id}`)
    toast('Document deleted', 'success')
    fetchDocs()
  }

  const filtered = useMemo(() => {
    let arr = [...docs]
    if (query) arr = arr.filter(d => d.original_name.toLowerCase().includes(query.toLowerCase()))
    if (sort === 'newest') arr.sort((a, b) => new Date(b.created_at) - new Date(a.created_at))
    if (sort === 'pages') arr.sort((a, b) => b.page_count - a.page_count)
    if (sort === 'name') arr.sort((a, b) => a.original_name.localeCompare(b.original_name))
    return arr
  }, [docs, query, sort])

  const totalPages = docs.reduce((s, d) => s + (d.page_count || 0), 0)

  return (
    <div className="container">
      {/* friendly hero — liquid glass, no dev jargon */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: 'easeOut' }}
        className="hero-glass"
      >
        <div style={{ position: 'absolute', inset: 0, background: 'radial-gradient(600px 280px at 85% 0%, rgba(99,102,241,0.09), transparent 60%)', pointerEvents: 'none', borderRadius: 24 }} />
        <motion.div
          animate={{ y: [0, -6, 0] }}
          transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          style={{ position: 'absolute', width: 180, height: 180, right: 24, top: -20, borderRadius: '50%', background: 'radial-gradient(circle at 30% 30%, rgba(99,102,241,0.14), transparent 70%)', filter: 'blur(2px)', pointerEvents: 'none' }}
        />
        <div style={{ position: 'relative', zIndex: 1, maxWidth: 640 }}>
          <p style={{ fontSize: 12, letterSpacing: '0.06em', fontWeight: 700, color: '#6366f1' }}>WELCOME BACK{user ? `, ${user.username}` : ''} • PRIVATE & SECURE</p>
          <h1 style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.12, marginTop: 8, letterSpacing: '-0.02em' }}>
            Your PDFs, <span style={{ background: 'linear-gradient(135deg, #4f46e5, #06b6d4)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>ready to chat with</span>
          </h1>
          <p style={{ marginTop: 10, color: '#475569', fontSize: 15, lineHeight: 1.55 }}>
            Drop a document and instantly get summaries, answers, study notes and quizzes. Everything stays private to your account.
          </p>
          <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
            {[
              { l: 'Summarize', e: '✦' },
              { l: 'Ask anything', e: '💬' },
              { l: 'Study notes', e: '📝' },
              { l: 'Quiz me', e: '✺' },
            ].map(t => (
              <span key={t.l} style={{ background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.9)', padding: '6px 12px', borderRadius: 999, fontSize: 12, fontWeight: 600, color: '#334155', backdropFilter: 'blur(8px)', display: 'flex', gap: 6, alignItems: 'center' }}><span>{t.e}</span>{t.l}</span>
            ))}
          </div>
        </div>
      </motion.div>

      {/* user-centric stats — no Groq / model names */}
      <div className="grid" style={{ marginTop: 16, gridTemplateColumns: 'repeat(3, 1fr)' }}>
        {[
          { label: 'Your documents', value: docs.length, sub: docs.length ? `${totalPages} pages total` : 'No uploads yet', icon: '📄' },
          { label: 'Private', value: 'Only you', sub: 'No one else can see them', icon: '🔒' },
          { label: 'What you can do', value: 'Chat + Quiz', sub: 'Summaries, notes & more', icon: '✨' },
        ].map((s, i) => (
          <motion.div
            key={s.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 * i }}
            className="liquid-glass"
            style={{ padding: 16, display: 'flex', gap: 12, alignItems: 'center' }}
          >
            <div style={{ width: 44, height: 44, borderRadius: 12, background: 'rgba(255,255,255,0.72)', display: 'grid', placeItems: 'center', fontSize: 18, border: '1px solid rgba(255,255,255,0.9)', boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.9)' }}>{s.icon}</div>
            <div>
              <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: '-0.01em' }}>{s.value}</div>
              <div style={{ fontSize: 12, color: '#334155', fontWeight: 600 }}>{s.label}</div>
              <div style={{ fontSize: 11, color: '#94a3b8' }}>{s.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.15 }} style={{ marginTop: 18 }}>
        <UploadDropzone onUploaded={() => fetchDocs()} />
      </motion.div>

      {/* controls */}
      <div style={{ marginTop: 22, display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between' }}>
        <h3 style={{ fontSize: 16, fontWeight: 700, letterSpacing: '-0.01em' }}>Your library {filtered.length ? `• ${filtered.length}` : ''}</h3>
        <div style={{ display: 'flex', gap: 8, flex: 1, maxWidth: 520, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
          <div style={{ position: 'relative', flex: 1, minWidth: 180 }}>
            <span style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontSize: 13 }}>⌕</span>
            <input
              className="input"
              placeholder="Search your documents…"
              value={query}
              onChange={e => setQuery(e.target.value)}
              style={{ paddingLeft: 34 }}
            />
          </div>
          <select className="select" value={sort} onChange={e => setSort(e.target.value)} style={{ width: 148 }}>
            <option value="newest">Newest first</option>
            <option value="pages">Most pages</option>
            <option value="name">Name A–Z</option>
          </select>
          <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn-secondary btn" onClick={fetchDocs} style={{ borderRadius: 999 }}>Refresh</motion.button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="liquid-glass" style={{ height: 96, borderRadius: 20 }} />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="liquid-glass"
          style={{ marginTop: 14, textAlign: 'center', padding: 32 }}
        >
          <div style={{ width: 56, height: 56, borderRadius: 16, background: 'rgba(255,255,255,0.72)', border: '1px solid rgba(255,255,255,0.9)', display: 'grid', placeItems: 'center', margin: '0 auto', fontSize: 24 }}>📄</div>
          <p style={{ fontWeight: 700, marginTop: 12, fontSize: 15 }}>{query ? `No results for “${query}”` : 'Nothing here yet'}</p>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 6, maxWidth: 380, margin: '6px auto 0', lineHeight: 1.5 }}>
            {query ? 'Try a different search term.' : 'Upload your first PDF above — we’ll turn it into summaries, notes and quizzes just for you.'}
          </p>
        </motion.div>
      ) : (
        <motion.div layout style={{ display: 'grid', gap: 12, marginTop: 14 }}>
          <AnimatePresence>
            {filtered.map((d, i) => (
              <motion.div
                key={d.id}
                layout
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ delay: i * 0.035, type: 'spring', stiffness: 300, damping: 25 }}
                className="liquid-glass"
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, padding: 16 }}
              >
                <div style={{ minWidth: 0, flex: 1 }}>
                  <Link to={`/doc/${d.id}`} style={{ fontWeight: 700, color: '#0f172a', display: 'block', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', fontSize: 14 }}>{d.original_name}</Link>
                  <div style={{ fontSize: 12, color: '#64748b', marginTop: 6, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span className="badge badge-accent">{d.page_count} pages</span>
                    <span className="badge">{(d.file_size / 1024).toFixed(0)} KB</span>
                    <span style={{ color: '#94a3b8' }}>{new Date(d.created_at).toLocaleDateString()}</span>
                  </div>
                  <p style={{ fontSize: 13, color: '#475569', marginTop: 7, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: 1.5 }}>{d.preview || 'Ready to summarize and chat'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, marginLeft: 12, flexShrink: 0, alignItems: 'center' }}>
                  <Link to={`/doc/${d.id}`} className="btn" style={{ borderRadius: 999, padding: '9px 16px' }}>Open</Link>
                  <motion.button whileTap={{ scale: 0.95 }} className="btn-secondary btn" style={{ borderRadius: 999 }} onClick={() => del(d.id)}>Delete</motion.button>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  )
}
