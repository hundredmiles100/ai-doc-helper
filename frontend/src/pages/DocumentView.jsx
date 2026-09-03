import { useEffect, useState } from 'react'
import { useParams, Link } from 'react-router-dom'
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
  const [showSource, setShowSource] = useState(false)

  useEffect(() => {
    api.get(`/documents/${id}`).then(r => setDoc(r.data)).catch(() => toast('Could not open document', 'error'))
    api.get(`/ask/history/${id}`).then(r => setQa(s => ({ ...s, history: r.data }))).catch(() => {})
    api.get(`/notes/${id}`).then(r => setNotes(r.data)).catch(() => {})
    api.get(`/quiz/${id}`).then(r => setQuizzes(r.data)).catch(() => {})
  }, [id])

  const doSummary = async (len) => {
    setLoading(true)
    try {
      const res = await api.post(`/summarize/${id}`, { length: len })
      setSummary(res.data.summary)
      toast('Summary ready', 'success')
    } catch (e) { toast(e.response?.data?.detail || 'Could not summarize', 'error') }
    setLoading(false)
  }

  const ask = async () => {
    if (!qa.question.trim()) return
    setLoading(true)
    try {
      const res = await api.post('/ask', { document_id: Number(id), question: qa.question })
      setQa(s => ({ ...s, answer: res.data.answer, history: [{ question: qa.question, answer: res.data.answer, created_at: new Date().toISOString() }, ...s.history], question: '' }))
      toast('Answer ready', 'success')
    } catch { toast('Could not answer — try again', 'error') }
    setLoading(false)
  }

  const doExtract = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/extract/${id}`)
      setExtract(res.data)
      toast('Highlights ready', 'success')
    } catch { toast('Could not extract', 'error') }
    setLoading(false)
  }

  const genNotes = async () => {
    setLoading(true)
    try {
      const res = await api.post(`/notes/${id}`)
      setNotes(n => [{ id: res.data.note_id, content: res.data.notes, created_at: new Date().toISOString() }, ...n])
      toast('Study notes ready', 'success')
    } catch { toast('Could not create notes', 'error') }
    setLoading(false)
  }

  const copyText = (t) => {
    navigator.clipboard.writeText(t)
    toast('Copied', 'success')
  }

  const genQuiz = async (fromNoteId) => {
    setLoading(true)
    try {
      let res
      if (fromNoteId) res = await api.post(`/quiz/from-notes/${fromNoteId}`)
      else res = await api.post(`/quiz/${id}`, { num_questions: 5 })
      const qs = res.data.questions
      setQuizzes(q => [{ id: res.data.quiz_id, title: 'New quiz', questions: qs, created_at: new Date().toISOString() }, ...q])
      setTab('quiz')
      toast('Quiz ready', 'success')
    } catch { toast('Could not create quiz', 'error') }
    setLoading(false)
  }

  if (!doc) return <div className="container"><div className="liquid-glass shimmer" style={{ height: 120 }} /></div>

  return (
    <div className="container">
      <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="liquid-glass" style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', flexWrap: 'wrap', padding: 16 }}>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center', minWidth: 0 }}>
          <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', display: 'grid', placeItems: 'center', color: 'white', fontSize: 16, flexShrink: 0, boxShadow: '0 4px 16px rgba(79,70,229,0.22)' }}>📄</div>
          <div style={{ minWidth: 0 }}>
            <h2 style={{ fontSize: 15, fontWeight: 750, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', letterSpacing: '-0.01em' }}>{doc.original_name}</h2>
            <p style={{ color: '#64748b', fontSize: 12, marginTop: 3, display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
              <span className="badge">{doc.page_count} pages</span>
              <span className="badge">{(doc.file_size / 1024).toFixed(0)} KB</span>
              <Link to="/" style={{ color: '#4f46e5', fontWeight: 600 }}>← Back to library</Link>
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn-secondary btn" style={{ borderRadius: 999 }} onClick={() => copyText(doc.content_text)}>Copy text</button>
        </div>
      </motion.div>

      <div className="tabs" style={{ marginTop: 16 }}>
        {[
          { k: 'summary', label: 'Summary' },
          { k: 'ask', label: 'Ask' },
          { k: 'extract', label: 'Highlights' },
          { k: 'notes', label: 'Notes' },
          { k: 'quiz', label: `Quiz${quizzes.length ? ` • ${quizzes.length}` : ''}` },
        ].map(t => (
          <motion.div
            key={t.k}
            whileHover={{ y: -1 }}
            whileTap={{ scale: 0.97 }}
            className={`tab ${tab===t.k?'active':''}`}
            onClick={()=>setTab(t.k)}
          >
            <span>{t.label}</span>
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
              <div style={{ display:'flex', gap:8, marginBottom:14, flexWrap: 'wrap', alignItems:'center' }}>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" disabled={loading} onClick={()=>doSummary('short')} style={{ borderRadius: 999 }}>Short</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" disabled={loading} onClick={()=>doSummary('medium')} style={{ borderRadius: 999 }}>Balanced</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" disabled={loading} onClick={()=>doSummary('detailed')} style={{ borderRadius: 999 }}>Detailed</motion.button>
                {loading && <span className="shimmer" style={{ height: 8, width: 80, borderRadius: 999, display:'inline-block' }} />}
                {summary && <button className="btn-secondary btn" onClick={() => copyText(summary)} style={{ marginLeft: 'auto', borderRadius: 999 }}>Copy</button>}
              </div>
              {summary ? (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="liquid-glass" style={{ padding: 18 }}>
                  <MarkdownRenderer content={summary} />
                </motion.div>
              ) : <p style={{ color:'#64748b', fontSize: 14, lineHeight: 1.6 }}>Choose a length above — we’ll create a clear, readable summary for you.</p>}
            </div>
          )}

          {tab==='ask' && (
            <div>
              <div style={{ display:'flex', gap:8 }}>
                <input className="input" placeholder='Ask anything about this document…' value={qa.question} onChange={e=>setQa({...qa, question:e.target.value})} onKeyDown={e=>e.key==='Enter'&&ask()} />
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" disabled={loading} onClick={ask} style={{ borderRadius: 999, padding: '12px 18px' }}>{loading ? '…' : 'Ask'}</motion.button>
              </div>
              <div style={{ display:'flex', gap:6, marginTop:10, flexWrap:'wrap' }}>
                {['Explain simply', 'Key takeaways', 'What’s the conclusion?'].map(q => (
                  <button key={q} className="btn-secondary btn" style={{ fontSize:12, padding:'7px 12px', borderRadius:999 }} onClick={() => setQa(s=>({...s, question:q}))}>{q}</button>
                ))}
              </div>
              {qa.answer && (
                <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="liquid-glass" style={{ marginTop:14, padding: 16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:8 }}>
                    <strong style={{ fontSize:13 }}>Answer</strong>
                    <button className="btn-secondary btn" style={{ padding:'6px 10px', fontSize:12, borderRadius: 999 }} onClick={() => copyText(qa.answer)}>Copy</button>
                  </div>
                  <MarkdownRenderer content={qa.answer} />
                </motion.div>
              )}
              <div style={{ marginTop:16, display:'grid', gap:10 }}>
                {qa.history.map((h,i)=>(
                  <motion.div key={i} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.02 }} className="liquid-glass" style={{ padding:14 }}>
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
              <motion.button whileHover={{ scale: 1.02 }} className="btn" disabled={loading} onClick={doExtract} style={{ borderRadius: 999 }}>{loading ? 'Gathering…' : 'Show key highlights'}</motion.button>
              {extract && (
                <motion.div initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} style={{ marginTop:14, display:'grid', gap:12 }}>
                  <div className="liquid-glass" style={{ padding: 16 }}>
                    <h3 style={{ display:'flex', justifyContent:'space-between', alignItems:'center', fontSize: 14 }}>Key points <span className="badge">{extract.key_points?.length || 0}</span></h3>
                    <ul style={{ marginTop:10, marginLeft:18, lineHeight: 1.6 }}>
                      {extract.key_points?.map((k,i)=><li key={i} style={{ marginBottom:6 }}>{k}</li>)}
                    </ul>
                    {extract.summary && (
                      <>
                        <h3 style={{ marginTop:16, fontSize: 14 }}>Overview</h3>
                        <div style={{ marginTop:8, padding:14, background:'rgba(255,255,255,0.6)', borderRadius:12, border:'1px solid rgba(255,255,255,0.9)' }}>
                          <MarkdownRenderer content={extract.summary} />
                        </div>
                      </>
                    )}
                  </div>
                  <div className="grid">
                    <div className="liquid-glass" style={{ padding: 16 }}>
                      <h3 style={{ fontSize: 14 }}>People & topics</h3>
                      {extract.entities?.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                          {extract.entities.map((en, idx) => (
                            <span key={idx} className="badge" style={{ padding: '6px 10px' }}>{en}</span>
                          ))}
                        </div>
                      ) : <p style={{ color:'#64748b', marginTop:8, fontSize: 13 }}>Nothing standout found</p>}
                    </div>
                    <div className="liquid-glass" style={{ padding: 16 }}>
                      <h3 style={{ fontSize: 14 }}>Dates & numbers</h3>
                      {extract.dates?.length > 0 ? (
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 10 }}>
                          {extract.dates.map((d, idx) => (
                            <span key={idx} className="badge" style={{ padding: '6px 10px' }}>{d}</span>
                          ))}
                        </div>
                      ) : <p style={{ color:'#64748b', marginTop:8, fontSize: 13 }}>No dates detected</p>}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          )}

          {tab==='notes' && (
            <div>
              <div style={{ display:'flex', gap:8, alignItems:'center' }}>
                <motion.button whileHover={{ scale: 1.02 }} className="btn" disabled={loading} onClick={genNotes} style={{ borderRadius: 999 }}>{loading ? 'Creating…' : 'Create study notes'}</motion.button>
                <span style={{ fontSize:12, color:'#64748b' }}>{notes.length ? `${notes.length} saved` : 'No notes yet'}</span>
              </div>
              {notes.map((n, idx)=>(
                <motion.div key={n.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }} className="liquid-glass" style={{ marginTop:12, padding: 16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:8, flexWrap:'wrap' }}>
                    <span style={{ fontSize:11, color:'#64748b', background:'rgba(255,255,255,0.7)', padding:'5px 10px', borderRadius:999, border: '1px solid rgba(255,255,255,0.9)' }}>{new Date(n.created_at).toLocaleString()}</span>
                    <div style={{ display:'flex', gap:6 }}>
                      <button className="btn-secondary btn" style={{ padding:'6px 10px', fontSize:12, borderRadius: 999 }} onClick={() => copyText(n.content)}>Copy</button>
                      <motion.button whileHover={{ scale: 1.03 }} className="btn" style={{ padding:'6px 12px', fontSize:12, borderRadius: 999 }} onClick={()=>genQuiz(n.id)}>Make quiz</motion.button>
                    </div>
                  </div>
                  <div style={{ marginTop:12 }}>
                    <MarkdownRenderer content={n.content} />
                  </div>
                </motion.div>
              ))}
              {notes.length===0 && <p style={{ color:'#64748b', marginTop:12, fontSize: 13 }}>Tap “Create study notes” to get a tidy, ready-to-revise version of your document.</p>}
            </div>
          )}

          {tab==='quiz' && (
            <div>
              <div style={{ display:'flex', gap:8, marginBottom:12, flexWrap:'wrap' }}>
                <motion.button whileHover={{ scale: 1.02 }} className="btn" disabled={loading} onClick={()=>genQuiz()} style={{ borderRadius: 999 }}>{loading ? '…' : 'Create quiz'}</motion.button>
                <span style={{ alignSelf:'center', fontSize:12, color:'#64748b' }}>{quizzes.length ? `${quizzes.length} quiz${quizzes.length>1 ? 'zes' : ''}` : 'No quizzes yet'}</span>
              </div>
              {quizzes.map(q=>(
                <motion.div key={q.id} initial={{ opacity:0, y:8 }} animate={{ opacity:1, y:0 }} style={{ marginBottom:16 }}>
                  <h4 style={{ marginBottom:8, display:'flex', gap:8, alignItems:'center', fontSize: 13, fontWeight: 700 }}>
                    <span style={{ background:'#0f172a', color:'white', padding:'4px 10px', borderRadius:999, fontSize:11 }}>Quiz</span>
                    {q.title} • {new Date(q.created_at).toLocaleDateString()}
                  </h4>
                  <QuizView questions={q.questions} />
                </motion.div>
              ))}
              {quizzes.length===0 && <p style={{ color:'#64748b', fontSize: 13 }}>Create a quiz from your document or from notes — practice right away.</p>}
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="liquid-glass" style={{ marginTop:20, padding: 14 }}>
        <button onClick={() => setShowSource(!showSource)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', fontWeight: 650, fontSize: 13, color: '#334155' }}>
          <span>Source text</span>
          <span style={{ fontSize: 11, color: '#94a3b8', background: 'rgba(255,255,255,0.7)', padding: '4px 10px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.9)' }}>{showSource ? 'Hide' : 'Show'}</span>
        </button>
        <AnimatePresence>
          {showSource && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden' }}>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 10 }}>
                <button className="btn-secondary btn" style={{ padding:'5px 10px', fontSize:11, borderRadius: 999 }} onClick={() => copyText(doc.content_text)}>Copy all</button>
              </div>
              <p style={{ fontSize:12, whiteSpace:'pre-wrap', marginTop:10, color:'#334155', maxHeight:260, overflow:'auto', background:'rgba(255,255,255,0.6)', padding:12, borderRadius:12, border:'1px solid rgba(255,255,255,0.9)', lineHeight: 1.6 }}>{doc.content_text?.slice(0,5000) || 'No text extracted from this PDF'}</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  )
}
