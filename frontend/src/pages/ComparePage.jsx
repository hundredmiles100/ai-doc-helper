import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { toast } from '../components/Toast'

export default function ComparePage() {
  const [docs, setDocs] = useState([])
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { api.get('/documents').then(r => setDocs(r.data)).catch(() => {}) }, [])

  const compare = async () => {
    if (!a || !b) return toast('Pick two documents', 'error')
    if (a === b) return toast('Pick two different documents', 'error')
    setLoading(true)
    try {
      const res = await api.post('/compare', { doc_id_1: Number(a), doc_id_2: Number(b) })
      setResult(res.data.comparison)
      toast('Comparison ready', 'success')
    } catch (e) { toast(e.response?.data?.detail || 'Could not compare', 'error') }
    setLoading(false)
  }

  const selA = docs.find(d => String(d.id) === String(a))
  const selB = docs.find(d => String(d.id) === String(b))

  return (
    <div className="container" style={{ maxWidth: 860 }}>
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ textAlign: 'center', marginBottom: 18 }}>
        <h2 style={{ fontSize: 24, fontWeight: 800, letterSpacing: '-0.02em' }}>Compare documents</h2>
        <p style={{ color:'#64748b', marginTop: 6, fontSize: 14, lineHeight: 1.5 }}>Pick any two PDFs from your library — see what’s similar and what’s different.</p>
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.08 }} className="liquid-glass" style={{ padding: 18 }}>
        <div className="grid" style={{ position: 'relative', gap: 16 }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#334155' }}>First document</label>
            <select className="select" value={a} onChange={e=>setA(e.target.value)} style={{ marginTop:8, background: selA ? 'rgba(238,242,255,0.9)' : 'rgba(255,255,255,0.72)', borderColor: selA ? 'rgba(199,210,254,0.9)' : 'rgba(255,255,255,0.9)' }}>
              <option value="">Choose a document</option>
              {docs.map(d=><option key={d.id} value={d.id}>{d.original_name} — {d.page_count} pages</option>)}
            </select>
            {selA && (
              <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} style={{ marginTop:10, fontSize:12, color:'#475569', background:'rgba(255,255,255,0.65)', padding:10, borderRadius:12, border:'1px solid rgba(255,255,255,0.9)' }}>
                <strong>{selA.original_name}</strong> • {selA.page_count} pages
              </motion.div>
            )}
          </div>

          <div style={{ display:'grid', placeItems:'center', position:'relative' }}>
            <motion.div
              animate={{ scale: [1, 1.06, 1] }}
              transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
              style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#06b6d4)', color:'white', display:'grid', placeItems:'center', fontWeight:750, fontSize:12, boxShadow:'0 6px 20px rgba(79,70,229,0.28)', border: '1px solid rgba(255,255,255,0.22)' }}
            >vs</motion.div>
            <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:'rgba(226,232,240,0.7)', zIndex:-1 }} />
          </div>

          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#334155' }}>Second document</label>
            <select className="select" value={b} onChange={e=>setB(e.target.value)} style={{ marginTop:8, background: selB ? 'rgba(238,242,255,0.9)' : 'rgba(255,255,255,0.72)', borderColor: selB ? 'rgba(199,210,254,0.9)' : 'rgba(255,255,255,0.9)' }}>
              <option value="">Choose a document</option>
              {docs.map(d=><option key={d.id} value={d.id}>{d.original_name} — {d.page_count} pages</option>)}
            </select>
            {selB && (
              <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} style={{ marginTop:10, fontSize:12, color:'#475569', background:'rgba(255,255,255,0.65)', padding:10, borderRadius:12, border:'1px solid rgba(255,255,255,0.9)' }}>
                <strong>{selB.original_name}</strong> • {selB.page_count} pages
              </motion.div>
            )}
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} className="btn" style={{ marginTop:16, width:'100%', padding:13, fontSize:15, borderRadius: 999 }} disabled={loading || !a || !b} onClick={compare}>
          {loading ? 'Comparing…' : 'Compare now'}
        </motion.button>
        {(!a || !b) && <p style={{ fontSize:12, color:'#94a3b8', marginTop:8, textAlign:'center' }}>Choose two different files from your library</p>}
        {docs.length < 2 && <p style={{ fontSize:12, color:'#f59e0b', marginTop:8, textAlign:'center', background: 'rgba(255,251,235,0.8)', padding: '8px 12px', borderRadius: 999, border: '1px solid rgba(252,211,77,0.25)' }}>You need at least 2 documents — upload another to compare</p>}
      </motion.div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="liquid-glass"
            style={{ marginTop:16, padding: 18 }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <h3 style={{ fontSize:14, fontWeight: 700 }}>Result</h3>
              <button className="btn-secondary btn" style={{ padding:'6px 12px', fontSize:12, borderRadius: 999 }} onClick={() => { navigator.clipboard.writeText(result); toast('Copied', 'success') }}>Copy</button>
            </div>
            <MarkdownRenderer content={result} />
          </motion.div>
        )}
      </AnimatePresence>

      {!result && docs.length >= 2 && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.15 }} style={{ marginTop:16, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[
            { t: 'Clear table', d: 'Side-by-side view' },
            { t: 'Similarities', d: 'What overlaps' },
            { t: 'Differences', d: 'What’s unique' },
          ].map(c => (
            <div key={c.t} className="liquid-glass" style={{ textAlign:'center', padding:14 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>{c.t}</div>
              <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>{c.d}</div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
