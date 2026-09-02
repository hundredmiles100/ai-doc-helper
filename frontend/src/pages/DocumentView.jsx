import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import api from '../api/client'
import QuizView from '../components/QuizView'

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
      <h2>{doc.original_name}</h2>
      <p style={{ color: '#64748b', fontSize: 13 }}>{doc.page_count} pages • {(doc.file_size / 1024).toFixed(0)} KB • {doc.full_length} chars extracted</p>

      <div className="tabs" style={{ marginTop: 16 }}>
        {['summary','ask','extract','notes','quiz'].map(t => (
          <div key={t} className={`tab ${tab===t?'active':''}`} onClick={()=>setTab(t)}>{t === 'ask' ? 'Ask / Chat' : t.charAt(0).toUpperCase()+t.slice(1)}</div>
        ))}
      </div>

      {tab==='summary' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <button className="btn" disabled={loading} onClick={()=>doSummary('short')}>Short</button>
            <button className="btn" disabled={loading} onClick={()=>doSummary('medium')}>Medium</button>
            <button className="btn" disabled={loading} onClick={()=>doSummary('detailed')}>Detailed</button>
            {loading && <span style={{ fontSize:13, alignSelf:'center'}}>Generating...</span>}
          </div>
          {summary ? <div className="card markdown" style={{ whiteSpace:'pre-wrap' }}>{summary}</div> : <p style={{ color:'#64748b' }}>Click a button to summarize. Try "short" first.</p>}
        </div>
      )}

      {tab==='ask' && (
        <div>
          <div style={{ display:'flex', gap:8 }}>
            <input className="input" placeholder='e.g. Explain chapter 4 in simple language' value={qa.question} onChange={e=>setQa({...qa, question:e.target.value})} onKeyDown={e=>e.key==='Enter'&&ask()} />
            <button className="btn" disabled={loading} onClick={ask}>Ask</button>
          </div>
          {qa.answer && <div className="card" style={{ marginTop:12, whiteSpace:'pre-wrap' }}>{qa.answer}</div>}
          <div style={{ marginTop:16 }}>
            {qa.history.map((h,i)=>(
              <div key={i} className="card" style={{ marginBottom:8 }}>
                <p style={{ fontWeight:600 }}>Q: {h.question}</p>
                <p style={{ marginTop:6, color:'#334155' }}>{h.answer}</p>
                <p style={{ fontSize:12, color:'#94a3b8', marginTop:6 }}>{new Date(h.created_at).toLocaleString()}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab==='extract' && (
        <div>
          <button className="btn" disabled={loading} onClick={doExtract}>Extract Important Info</button>
          {extract && (
            <div style={{ marginTop:12 }}>
              <div className="card">
                <h4>Key Points</h4>
                <ul style={{ marginTop:8, marginLeft:18 }}>
                  {extract.key_points?.map((k,i)=><li key={i} style={{ marginBottom:4 }}>{k}</li>)}
                </ul>
                {extract.summary && <><h4 style={{ marginTop:12 }}>Summary</h4><p style={{ marginTop:6 }}>{extract.summary}</p></>}
                {extract.entities?.length>0 && <><h4 style={{ marginTop:12 }}>Entities</h4><p>{extract.entities.join(', ')}</p></>}
              </div>
            </div>
          )}
        </div>
      )}

      {tab==='notes' && (
        <div>
          <button className="btn" disabled={loading} onClick={genNotes}>Generate Notes</button>
          {notes.map(n=>(
            <div key={n.id} className="card" style={{ marginTop:12 }}>
              <div style={{ display:'flex', justifyContent:'space-between' }}>
                <span style={{ fontSize:12, color:'#64748b' }}>{new Date(n.created_at).toLocaleString()}</span>
                <button className="btn-secondary btn" style={{ padding:'4px 8px', fontSize:12 }} onClick={()=>genQuiz(n.id)}>Make Quiz from these notes</button>
              </div>
              <div className="markdown" style={{ whiteSpace:'pre-wrap', marginTop:8 }}>{n.content}</div>
            </div>
          ))}
          {notes.length===0 && <p style={{ color:'#64748b', marginTop:8 }}>No notes yet. Click generate.</p>}
        </div>
      )}

      {tab==='quiz' && (
        <div>
          <div style={{ display:'flex', gap:8, marginBottom:12 }}>
            <button className="btn" disabled={loading} onClick={()=>genQuiz()}>Generate Quiz (5 Qs)</button>
            <button className="btn-secondary btn" onClick={()=>genQuiz()} disabled={loading}>More</button>
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

      <div className="card" style={{ marginTop:24 }}>
        <h4>Raw extracted text (first 5000 chars)</h4>
        <p style={{ fontSize:13, whiteSpace:'pre-wrap', marginTop:8, color:'#334155' }}>{doc.content_text?.slice(0,5000)}</p>
      </div>
    </div>
  )
}
