import { useEffect, useState } from 'react'
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
      <h2>Compare Two Documents</h2>
      <p style={{ color:'#64748b', marginBottom:12 }}>Select two PDFs to see similarities, differences and coverage.</p>
      <div className="grid">
        <select className="select" value={a} onChange={e=>setA(e.target.value)}>
          <option value="">Select Document 1</option>
          {docs.map(d=><option key={d.id} value={d.id}>{d.original_name}</option>)}
        </select>
        <select className="select" value={b} onChange={e=>setB(e.target.value)}>
          <option value="">Select Document 2</option>
          {docs.map(d=><option key={d.id} value={d.id}>{d.original_name}</option>)}
        </select>
      </div>
      <button className="btn" style={{ marginTop:12 }} disabled={loading} onClick={compare}>{loading?'Comparing...':'Compare'}</button>
      {result && <div className="card" style={{ marginTop:16, whiteSpace:'pre-wrap' }}>{result}</div>}
    </div>
  )
}
