import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'

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

  return (
    <div className="container">
      <motion.h2 initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>Compare Two Documents</motion.h2>
      <p style={{ color:'#64748b', marginBottom:12 }}>Select two PDFs to see similarities, differences and coverage.</p>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }} className="grid">
        <select className="select" value={a} onChange={e=>setA(e.target.value)}>
          <option value="">Select Document 1</option>
          {docs.map(d=><option key={d.id} value={d.id}>{d.original_name}</option>)}
        </select>
        <select className="select" value={b} onChange={e=>setB(e.target.value)}>
          <option value="">Select Document 2</option>
          {docs.map(d=><option key={d.id} value={d.id}>{d.original_name}</option>)}
        </select>
      </motion.div>
      <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" style={{ marginTop:12 }} disabled={loading} onClick={compare}>{loading?'Comparing...':'Compare'}</motion.button>
      <AnimatePresence>
        {result && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="card"
            style={{ marginTop:16, whiteSpace:'pre-wrap' }}
          >
            {result}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

