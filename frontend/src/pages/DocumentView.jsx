import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import QuizView from '../components/QuizView'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { toast } from '../components/Toast'

export default function DocumentView() {
  const { id } = useParams()
  const [doc, setDoc] = useState(null)
  const [tab, setTab] = useState('summary')
  const [summary, setSummary] = useState('')
  const [qa, setQa] = useState({ question: '', answer: '', history: [] })
  const [extract, setExtract] = useState(null)
  const [notes, setNotes] = useState([])
  const [quizzes, setQuizzes] = useState([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    api.get(`/documents/${id}`).then(r => setDoc(r.data))
    api.get(`/ask/history/${id}`).then(r => setQa(s => ({ ...s, history: r.data }))).catch(() => {})
    api.get(`/notes/${id}`).then(r => setNotes(r.data)).catch(() => {})
    api.get(`/quiz/${id}`).then(r => setQuizzes(r.data)).catch(() => {})
  }, [id])

  const doSummary = async (len) => {
    setLoading(true)
    try {
      const res = await api.post(`/summarize/${id}`, { length: len })
      setSummary(res.data.summary)
      toast(`Summary (${len}) ready`, 'success')
    } catch (e) { toast(e.response?.data?.detail || 'Summary failed', 'error') }
    setLoading(false)
  }

  const ask = async () => {
    if (!qa.question.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/ask', { document_id: Number(id), question: qa.question })
      setQa(s => ({ ...s, answer: res.data.answer, history: [{ question: qa.question, answer: res.data.answer, created_at: new Date().toISOString() }, ...s.history], question: '' }))
      toast('Answer ready', 'success')
    } catch { toast('Ask failed', 'error') }
    setLoading(false)
  }

  const doExtract = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/extract/${id}`)
      setExtract(res.data)
      toast('Key info extracted', 'success')
    } catch {}
    setLoading(false)
  }

  const genNotes = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/notes/${id}`)
      setNotes(n => [{ id: res.data.note_id, content: res.data.notes, created_at: new Date().toISOString() }, ...n])
      toast('Notes generated', 'success')
    } catch { toast('Notes failed', 'error') }
    setLoading(false)
  }

  const copyText = (t) => {
    navigator.clipboard.writeText(t)
    toast('Copied to clipboard', 'success')
  }

  const genQuiz = async (fromNoteId) => {
    setLoading(true)
    try {
      let res
      if (fromNoteId) res = await api.post(`/quiz/from-notes/${fromNoteId}`)
      else res = await api.post(`/quiz/${id}`, { num_questions: 5 })
      const qs = res.data.questions
      setQuizzes(q => [{ id: res.data.quiz_id, title: 'New Quiz', questions: qs, created_at: new Date().toISOString() }, ...q])
      setTab('quiz')
      toast('Quiz ready — try it!', 'success')
    } catch { toast('Quiz failed', 'error') }
    setLoading(false)
  }

  if (!doc) return <div className="container"><div className="card shimmer" style={{ height: 120 }} /></div>

  return (
    <div className="container">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
        <div>
          <h2 style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <span style={{ width: 36, height: 36, borderRadius: 10, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', display: 'grid', placeItems: 'center', color: 'white', fontSize: 14 }}>PDF</span>
            {doc.original_name}
          </h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 4, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            <span className="badge">{doc.page_count} pages</span>
            <span className="badge">{(doc.file_size / 1024).toFixed(0)} KB</span>
            <span className="badge">{doc.full_length} chars</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary btn" onClick={() => copyText(doc.content_text)}>Copy text</button>
          <a href={`http://localhost:8000/api/documents/${id}`} target="_blank" rel="noreferrer" className="btn-ghost btn" style={{ padding: '9px 14px', borderRadius: 10, fontSize: 14, fontWeight: 600 }}>Raw JSON</a>
        </div>
      </motion.div>

      <div className="tabs" style={{ marginTop: 16 }}>
        {[
          { k: 'summary', label: '📝 Summary', desc: 'bullets + table' },
          { k: 'ask', label: '💬 Ask', desc: 'chat' },
          { k: 'extract', label: '🔍 Extract', desc: 'tables' },
          { k: 'notes', label: '📚 Notes', desc: 'markdown' },
          { k: 'quiz', label: '🧠 Quiz', desc: `${quizzes.length}` },
        ].map(t => (
          <motion.div
            key={t.k}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className={`tab ${tab===t.k?'active':''}`}
            onClick={()=>setTab(t.k)}
            style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}
          >
            <span>{t.label}</span>
            <span style={{ fontSize: 10, opacity: 0.6 }}>{t.desc}</span>
          </motion.div>
        ))}
      </div>

      <AnimatePresence mode="wait">
        <motion.div
          key={tab}
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
        >
          {tab==='summary' && (
            <div>
              <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap: 'wrap', alignItems:'center' }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" disabled={loading} onClick={()=>doSummary('short')}>Short</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" disabled={loading} onClick={()=>doSummary('medium')}>Medium</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" disabled={loading} onClick={()=>doSummary('detailed')}>Detailed</motion.button>
                {loading && <span className="shimmer" style={{ height: 8, width: 80, borderRadius: 999, display:'inline-block' }} />}
                {summary && <button className="btn-secondary btn" onClick={() => copyText(summary)} style={{ marginLeft: 'auto' }}>Copy</button>}
              </div>
              {summary ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <MarkdownRenderer content={summary} />
                </motion.div>
              ) : <p style={{ color:'#64748b' }}>Click a length to summarize. Tables & bullets will appear here.</p>}
            </div>
          )}

          {tab==='ask' && (
            <div>
              <div style={{ display:'flex', gap:8 }}>
                <input className="input" placeholder='e.g. Explain chapter 4 in simple language' value={qa.question} onChange={e=>setQa({...qa, question:e.target.value})} onKeyDown={e=>e.key==='Enter'&&ask()} />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" disabled={loading} onClick={ask}>{loading ? '…' : 'Ask'}</motion.button>
              </div>
              <div style={{ display:'flex', gap:6, marginTop:8, flexWrap:'wrap' }}>
                {['Explain in simple words', 'Give 5 key points', 'What is the conclusion?'].map(q => (
                  <button key={q} className="btn-ghost btn" style={{ fontSize:12, padding:'6px 10px', border:'1px solid #e2e8f0', borderRadius:999, background:'white' }} onClick={() => setQa(s=>({...s, question:q}))}>{q}</button>
                ))}
              </div>
              {qa.answer && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ marginTop:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <strong style={{ fontSize:13 }}>Answer</strong>
                    <button className="btn-secondary btn" style={{ padding:'4px 8px', fontSize:12 }} onClick={() => copyText(qa.answer)}>Copy</button>
                  </div>
                  <MarkdownRenderer content={qa.answer} />
                </motion.div>
              )}
              <div style={{ marginTop:16, display:'grid', gap:8 }}>
                {qa.history.map((h,i)=>(
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="card" style={{ padding:14 }}>
                    <p style={{ fontWeight:700, fontSize:13 }}>Q: {h.question}</p>
                    <div style={{ marginTop:8 }}>
                      <MarkdownRenderer content={h.answer} />
                    </div>
                    <p style={{ fontSize:11, color:'#94a3b8', marginTop:6 }}>{new Date(h.created_at).toLocaleString()}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {tab==='extract' && (
            <div>
              <motion.button whileHover={{ scale: 1.02 }} className="btn" disabled={loading} onClick={doExtract}>{loading ? 'Extracting…' : 'Extract Important Info'}</motion.button>
              {extract && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ marginTop:12, display:'grid', gap:12 }}>
                  <div className="card">
                    <h3 style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>Key Points <span className="badge">{extract.key_points?.length || 0}</span></h3>
                    <ul style={{ marginTop:10, marginLeft:18 }}>
                      {extract.key_points?.map((k,i)=><li key={i} style={{ marginBottom:6 }}>{k}</li>)}
                    </ul>
                    {extract.summary && (
                      <>
                        <h3 style={{ marginTop:14 }}>Summary</h3>
                        <div style={{ marginTop:6, padding:12, background:'#f8fafc', borderRadius:10, border:'1px solid #e2e8f0' }}>
                          <MarkdownRenderer content={extract.summary} />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="grid">
                    <div className="card">
                      <h3>Entities</h3>
                      {extract.entities?.length > 0 ? (
                        <table style={{ width:'100%', marginTop:8, borderCollapse:'collapse', fontSize:13 }}>
                          <thead><tr style={{ background:'#f8fafc' }}><th style={{ textAlign:'left', padding:'8px', border:'1px solid #e2e8f0' }}>#</th><th style={{ textAlign:'left', padding:'8px', border:'1px solid #e2e8f0' }}>Entity</th></tr></thead>
                          <tbody>
                            {extract.entities.map((en, idx) => (
                              <tr key={idx}><td style={{ padding:'7px 8px', border:'1px solid #e2e8f0' }}>{idx+1}</td><td style={{ padding:'7px 8px', border:'1px solid #e2e8f0' }}>{en}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <p style={{ color:'#64748b', marginTop:8 }}>No entities found</p>}
                    </div>
                    <div className="card">
                      <h3>Dates & Numbers</h3>
                      {extract.dates?.length > 0 ? (
                        <table style={{ width:'100%', marginTop:8, borderCollapse:'collapse', fontSize:13 }}>
                          <thead><tr style={{ background:'#f8fafc' }}><th style={{ textAlign:'left', padding:'8px', border:'1px solid #e2e8f0' }}>#</th><th style={{ textAlign:'left', padding:'8px', border:'1px solid #e2e8f0' }}>Date / Value</th></tr></thead>
                          <tbody>
                            {extract.dates.map((d, idx) => (
                              <tr key={idx}><td style={{ padding:'7px 8px', border:'1px solid #e2e8f0' }}>{idx+1}</td><td style={{ padding:'7px 8px', border:'1px solid #e2e8f0' }}>{d}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <p style={{ color:'#64748b', marginTop:8 }}>No dates detected</p>}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {tab==='notes' && (
            <div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <motion.button whileHover={{ scale: 1.02 }} className="btn" disabled={loading} onClick={genNotes}>{loading ? 'Generating…' : 'Generate Notes'}</motion.button>
                <span style={{ fontSize:12, color:'#64748b' }}>{notes.length} saved</span>
              </div>
              {notes.map((n, idx)=>(
                <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.04 }} className="card" style={{ marginTop:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:11, color:'#64748b', background:'#f1f5f9', padding:'4px 8px', borderRadius:999 }}>{new Date(n.created_at).toLocaleString()}</span>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn-secondary btn" style={{ padding:'5px 10px', fontSize:12 }} onClick={() => copyText(n.content)}>Copy</button>
                      <motion.button whileHover={{ scale: 1.05 }} className="btn" style={{ padding:'5px 10px', fontSize:12 }} onClick={()=>genQuiz(n.id)}>Make Quiz →</motion.button>
                    </div>
                  </div>
                  <div style={{ marginTop:10 }}>
                    <MarkdownRenderer content={n.content} />
                  </div>
                </motion.div>
              ))}
              {notes.length===0 && <p style={{ color:'#64748b', marginTop:10 }}>No notes yet. Click generate — you’ll get a table of terms + key takeaways.</p>}
            </div>
          )}

          {tab==='quiz' && (
            <div>
              <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
                <motion.button whileHover={{ scale: 1.02 }} className="btn" disabled={loading} onClick={()=>genQuiz()}>{loading ? '…' : 'Generate Quiz (5 Qs)'}</motion.button>
                <span style={{ alignSelf:'center', fontSize:12, color:'#64748b' }}>{quizzes.length} quizzes</span>
              </div>
              {quizzes.map(q=>(
                <motion.div key={q.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:16 }}>
                  <h4 style={{ marginBottom:8, display:'flex', gap:8, alignItems:'center' }}>
                    <span style={{ background:'#0f172a', color:'white', padding:'3px 8px', borderRadius:999, fontSize:11 }}>QUIZ</span>
                    {q.title} — {new Date(q.created_at).toLocaleDateString()}
                  </h4>
                  <QuizView questions={q.questions} />
                </motion.div>
              ))}
              {quizzes.length===0 && <p style={{ color:'#64748b' }}>No quizzes yet. Generate from notes or from document.</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="card" style={{ marginTop:22 }}>
        <h4 style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
          Raw extracted text
          <button className="btn-secondary btn" style={{ padding:'4px 8px', fontSize:11 }} onClick={() => copyText(doc.content_text)}>Copy all</button>
        </h4>
        <p style={{ fontSize:12, whiteSpace:'pre-wrap', marginTop:8, color:'#334155', maxHeight:260, overflow:'auto', background:'#f8fafc', padding:12, borderRadius:10, border:'1px solid #f1f5f9' }}>{doc.content_text?.slice(0,5000) || 'No text'}</p>
      </motion.div>
    </div>
  )
}
