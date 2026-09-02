import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import MarkdownRenderer from '../components/MarkdownRenderer'

export default function ComparePage() {
  const [docs, setDocs] = useState([])
  const [a, setA] = useState('')
  const [b, setB] = useState('')
  const [result, setResult] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => { api.get('/documents').then(r => setDocs(r.data)) }, [])

  const compare = async () => {
    if (!a || !b) return alert('Pick two docs')
    if (a === b) return alert('Pick different docs')
    setLoading(true)
    try {
      const res = await api.post('/compare', { doc_id_1: Number(a), doc_id_2: Number(b) })
      setResult(res.data.comparison)
    } catch (e) { alert(e.response?.data?.detail || 'failed') }
    setLoading(false)
  }

  const selA = docs.find(d => String(d.id) === String(a))
  const selB = docs.find(d => String(d.id) === String(b))

  return (
    <div className="container">
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: 22 }}>Compare Two Documents</motion.h2>
      <p style={{ color:'#64748b', marginBottom:14, marginTop:6 }}>Select two PDFs to see a side-by-side table: similarities, differences, coverage.</p>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="card" style={{ padding: 16 }}>
        <div className="grid" style={{ position: 'relative' }}>
          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#475569' }}>Document 1</label>
            <select className="select" value={a} onChange={e=>setA(e.target.value)} style={{ marginTop:6, background: selA ? '#eef2ff' : 'white', borderColor: selA ? '#c7d2fe' : '#e2e8f0' }}>
              <option value="">Select Document 1</option>
              {docs.map(d=><option key={d.id} value={d.id}>{d.original_name} — {d.page_count}p</option>)}
            </select>
            {selA && (
              <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} style={{ marginTop:8, fontSize:12, color:'#475569', background:'#f8fafc', padding:8, borderRadius:8, border:'1px solid #e2e8f0' }}>
                <strong>{selA.original_name}</strong> • {selA.page_count} pages • {(selA.file_size/1024).toFixed(0)} KB
              </motion.div>
            )}
          </div>

          <div style={{ display:'grid', placeItems:'center', position:'relative' }}>
            <motion.div
              animate={{ scale: [1, 1.08, 1], rotate: [0, 3, -3, 0] }}
              transition={{ duration: 3, repeat: Infinity }}
              style={{ width:44, height:44, borderRadius:'50%', background:'linear-gradient(135deg,#4f46e5,#06b6d4)', color:'white', display:'grid', placeItems:'center', fontWeight:800, fontSize:12, boxShadow:'0 4px 16px rgba(79,70,229,0.3)' }}
            >VS</motion.div>
            <div style={{ position:'absolute', top:'50%', left:0, right:0, height:1, background:'#e2e8f0', zIndex:-1 }} />
          </div>

          <div>
            <label style={{ fontSize:12, fontWeight:700, color:'#475569' }}>Document 2</label>
            <select className="select" value={b} onChange={e=>setB(e.target.value)} style={{ marginTop:6, background: selB ? '#eef2ff' : 'white', borderColor: selB ? '#c7d2fe' : '#e2e8f0' }}>
              <option value="">Select Document 2</option>
              {docs.map(d=><option key={d.id} value={d.id}>{d.original_name} — {d.page_count}p</option>)}
            </select>
            {selB && (
              <motion.div initial={{ opacity:0, y:4 }} animate={{ opacity:1, y:0 }} style={{ marginTop:8, fontSize:12, color:'#475569', background:'#f8fafc', padding:8, borderRadius:8, border:'1px solid #e2e8f0' }}>
                <strong>{selB.original_name}</strong> • {selB.page_count} pages • {(selB.file_size/1024).toFixed(0)} KB
              </motion.div>
            )}
          </div>
        </div>

        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" style={{ marginTop:14, width:'100%', padding:12, fontSize:15 }} disabled={loading || !a || !b} onClick={compare}>
          {loading ? 'Comparing…' : 'Compare → Generate table'}
        </motion.button>
        {(!a || !b) && <p style={{ fontSize:11, color:'#94a3b8', marginTop:6, textAlign:'center' }}>Pick two different documents</p>}
      </motion.div>

      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="card"
            style={{ marginTop:16 }}
          >
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
              <h3 style={{ fontSize:14 }}>Comparison Result</h3>
              <button className="btn-secondary btn" style={{ padding:'4px 8px', fontSize:12 }} onClick={() => navigator.clipboard.writeText(result)}>Copy</button>
            </div>
            <MarkdownRenderer content={result} />
          </motion.div>
        )}
      </AnimatePresence>

      {!result && (
        <motion.div initial={{ opacity:0 }} animate={{ opacity:1 }} transition={{ delay:0.2 }} style={{ marginTop:16, display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
          {[
            { t: 'Side-by-side table', d: 'Aspect | Doc1 | Doc2' },
            { t: 'Similarities', d: 'What they share' },
            { t: 'Differences', d: 'Where they diverge' },
          ].map(c => (
            <div key={c.t} className="card" style={{ textAlign:'center', padding:14 }}>
              <div style={{ fontWeight:700, fontSize:13 }}>{c.t}</div>
              <div style={{ fontSize:11, color:'#64748b', marginTop:4 }}>{c.d}</div>
            </div>
          ))}
        </motion.div>
      )}
    </div>
  )
}
