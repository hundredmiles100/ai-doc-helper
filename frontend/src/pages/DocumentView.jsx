import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import api from '../api/client'
import QuizView from '../components/QuizView'
import MarkdownRenderer from '../components/MarkdownRenderer'

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
    } catch (e) { alert(e.response?.data?.detail || 'failed') }
    setLoading(false)
  }

  const ask = async () => {
    if (!qa.question.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/ask', { document_id: Number(id), question: qa.question })
      setQa(s => ({ ...s, answer: res.data.answer, history: [{ question: qa.question, answer: res.data.answer, created_at: new Date().toISOString() }, ...s.history], question: '' }))
    } catch (e) { alert('ask failed') }
    setLoading(false)
  }

  const doExtract = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/extract/${id}`)
      setExtract(res.data)
    } catch {}
    setLoading(false)
  }

  const genNotes = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/notes/${id}`)
      setNotes(n => [{ id: res.data.note_id, content: res.data.notes, created_at: new Date().toISOString() }, ...n])
    } catch {}
    setLoading(false)
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
    } catch {}
    setLoading(false)
  }

  if (!doc) return <div className="container">Loading...</div>

  return (
    <div className="container">
      <motion.h2 initial={{ opacity: 0 }} animate={{ opacity: 1 }}>{doc.original_name}</motion.h2>
      <p style={{ color: '#64748b', fontSize: 13 }}>{doc.page_count} pages • {(doc.file_size / 1024).toFixed(0)} KB • {doc.full_length} chars extracted</p>

      <div className="tabs" style={{ marginTop: 16 }}>
        {['summary','ask','extract','notes','quiz'].map(t => (
          <motion.div
            key={t}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className={`tab ${tab===t?'active':''}`}
            onClick={()=>setTab(t)}
          >
            {t === 'ask' ? 'Ask / Chat' : t.charAt(0).toUpperCase()+t.slice(1)}
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
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" disabled={loading} onClick={()=>doSummary('short')}>Short</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" disabled={loading} onClick={()=>doSummary('medium')}>Medium</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" disabled={loading} onClick={()=>doSummary('detailed')}>Detailed</motion.button>
                {loading && <span style={{ fontSize:13, alignSelf:'center'}}>Generating...</span>}
              </div>
              {summary ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="card">
                  <MarkdownRenderer content={summary} />
                </motion.div>
              ) : <p style={{ color:'#64748b' }}>Click a button to summarize. Try "short" first.</p>}
            </div>
          )}

          {tab==='ask' && (
            <div>
              <div style={{ display:'flex', gap:8 }}>
                <input className="input" placeholder='e.g. Explain chapter 4 in simple language' value={qa.question} onChange={e=>setQa({...qa, question:e.target.value})} onKeyDown={e=>e.key==='Enter'&&ask()} />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" disabled={loading} onClick={ask}>Ask</motion.button>
              </div>
              {qa.answer && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ marginTop:12 }}>
                  <MarkdownRenderer content={qa.answer} />
                </motion.div>
              )}
              <div style={{ marginTop:16 }}>
                {qa.history.map((h,i)=>(
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }} className="card" style={{ marginBottom:8 }}>
                    <p style={{ fontWeight:600 }}>Q: {h.question}</p>
                    <div style={{ marginTop:6 }}>
                      <MarkdownRenderer content={h.answer} />
                    </div>
                    <p style={{ fontSize:12, color:'#94a3b8', marginTop:6 }}>{new Date(h.created_at).toLocaleString()}</p>
                  </motion.div>
                ))}
              </div>
            </div>
          )}

          {tab==='extract' && (
            <div>
              <motion.button whileHover={{ scale: 1.02 }} className="btn" disabled={loading} onClick={doExtract}>Extract Important Info</motion.button>
              {extract && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ marginTop:12, display:'grid', gap:12 }}>
                  <div className="card markdown">
                    <h3>Key Points</h3>
                    <ul>
                      {extract.key_points?.map((k,i)=><li key={i}>{k}</li>)}
                    </ul>
                    {extract.summary && (
                      <>
                        <h3 style={{ marginTop:14 }}>Summary</h3>
                        <MarkdownRenderer content={extract.summary} />
                      </>
                    )}
                  </div>

                  <div className="grid">
                    <div className="card markdown">
                      <h3>Entities</h3>
                      {extract.entities?.length > 0 ? (
                        <table>
                          <thead><tr><th>#</th><th>Entity</th></tr></thead>
                          <tbody>
                            {extract.entities.map((en, idx) => (
                              <tr key={idx}><td>{idx+1}</td><td>{en}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <p style={{ color:'#64748b' }}>No entities found</p>}
                    </div>

                    <div className="card markdown">
                      <h3>Dates & Numbers</h3>
                      {extract.dates?.length > 0 ? (
                        <table>
                          <thead><tr><th>#</th><th>Date / Value</th></tr></thead>
                          <tbody>
                            {extract.dates.map((d, idx) => (
                              <tr key={idx}><td>{idx+1}</td><td>{d}</td></tr>
                            ))}
                          </tbody>
                        </table>
                      ) : <p style={{ color:'#64748b' }}>No dates detected</p>}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {tab==='notes' && (
            <div>
              <motion.button whileHover={{ scale: 1.02 }} className="btn" disabled={loading} onClick={genNotes}>Generate Notes</motion.button>
              {notes.map((n, idx)=>(
                <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }} className="card" style={{ marginTop:12 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
                    <span style={{ fontSize:12, color:'#64748b' }}>{new Date(n.created_at).toLocaleString()}</span>
                    <motion.button whileHover={{ scale: 1.05 }} className="btn-secondary btn" style={{ padding:'4px 8px', fontSize:12 }} onClick={()=>genQuiz(n.id)}>Make Quiz from these notes</motion.button>
                  </div>
                  <div style={{ marginTop:8 }}>
                    <MarkdownRenderer content={n.content} />
                  </div>
                </motion.div>
              ))}
              {notes.length===0 && <p style={{ color:'#64748b', marginTop:8 }}>No notes yet. Click generate.</p>}
            </div>
          )}

          {tab==='quiz' && (
            <div>
              <div style={{ display:'flex', gap:8, marginBottom:12 }}>
                <motion.button whileHover={{ scale: 1.02 }} className="btn" disabled={loading} onClick={()=>genQuiz()}>Generate Quiz (5 Qs)</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} className="btn-secondary btn" onClick={()=>genQuiz()} disabled={loading}>More</motion.button>
              </div>
              {quizzes.map(q=>(
                <div key={q.id} style={{ marginBottom:16 }}>
                  <h4 style={{ marginBottom:8 }}>{q.title} — {new Date(q.created_at).toLocaleDateString()}</h4>
                  <QuizView questions={q.questions} />
                </div>
              ))}
              {quizzes.length===0 && <p style={{ color:'#64748b' }}>No quizzes yet.</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="card" style={{ marginTop:24 }}>
        <h4>Raw extracted text (first 5000 chars)</h4>
        <p style={{ fontSize:13, whiteSpace:'pre-wrap', marginTop:8, color:'#334155' }}>{doc.content_text?.slice(0,5000)}</p>
      </motion.div>
    </div>
  )
}
