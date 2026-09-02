import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function QuizView({ questions }) {
  const [answers, setAnswers] = useState({})
  const [show, setShow] = useState(false)

  if (!questions || questions.length === 0) return <p>No questions</p>

  const score = questions.reduce((acc, q, idx) => acc + (answers[idx] === q.correct_index ? 1 : 0), 0)

  return (
    <div>
      <AnimatePresence>
        {show && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} style={{ marginBottom: 12, fontWeight: 600 }}>
            Score: {score} / {questions.length}
          </motion.div>
        )}
      </AnimatePresence>
      {questions.map((q, idx) => (
        <motion.div
          key={idx}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: idx * 0.05 }}
          className="card"
          style={{ marginBottom: 12 }}
        >
          <p style={{ fontWeight: 600, marginBottom: 8 }}>{idx + 1}. {q.question}</p>
          {q.options.map((opt, oi) => {
            let cls = "quiz-opt"
            if (show) {
              if (oi === q.correct_index) cls += " correct"
              else if (answers[idx] === oi) cls += " wrong"
            } else if (answers[idx] === oi) cls += " selected"
            return (
              <motion.div
                key={oi}
                whileHover={!show ? { x: 4 } : {}}
                whileTap={!show ? { scale: 0.98 } : {}}
                className={cls}
                onClick={() => !show && setAnswers({ ...answers, [idx]: oi })}
              >
                {String.fromCharCode(65 + oi)}. {opt}
              </motion.div>
            )
          })}
          {show && q.explanation && <p style={{ fontSize: 13, color: '#475569', marginTop: 8 }}>💡 {q.explanation}</p>}
        </motion.div>
      ))}
      {!show ? (
        <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} className="btn" onClick={() => setShow(true)}>Submit</motion.button>
      ) : (
        <motion.button whileHover={{ scale: 1.02 }} className="btn-secondary btn" onClick={() => { setShow(false); setAnswers({}) }}>Retry</motion.button>
      )}
    </div>
  )
}

