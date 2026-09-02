import { useState } from 'react'

export default function QuizView({ questions }) {
  const [answers, setAnswers] = useState({})
  const [show, setShow] = useState(false)

  if (!questions || questions.length === 0) return <p>No questions</p>

  const score = questions.reduce((acc, q, idx) => acc + (answers[idx] === q.correct_index ? 1 : 0), 0)

  return (
    <div>
      {show && <div style={{ marginBottom: 12, fontWeight: 600 }}>Score: {score} / {questions.length}</div>}
      {questions.map((q, idx) => (
        <div key={idx} className="card" style={{ marginBottom: 12 }}>
          <p style={{ fontWeight: 600, marginBottom: 8 }}>{idx + 1}. {q.question}</p>
          {q.options.map((opt, oi) => {
            let cls = "quiz-opt"
            if (show) {
              if (oi === q.correct_index) cls += " correct"
              else if (answers[idx] === oi) cls += " wrong"
            } else if (answers[idx] === oi) cls += " selected"
            return (
              <div key={oi} className={cls} onClick={() => !show && setAnswers({ ...answers, [idx]: oi })}>
                {String.fromCharCode(65 + oi)}. {opt}
              </div>
            )
          })}
          {show && q.explanation && <p style={{ fontSize: 13, color: '#475569', marginTop: 8 }}>💡 {q.explanation}</p>}
        </div>
      ))}
      {!show ? <button className="btn" onClick={() => setShow(true)}>Submit</button>
        : <button className="btn-secondary btn" onClick={() => { setShow(false); setAnswers({}) }}>Retry</button>}
    </div>
  )
}
