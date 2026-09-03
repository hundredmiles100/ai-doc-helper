import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import MarkdownRenderer from './MarkdownRenderer'
import { toast } from './Toast'

function ThinkingBlock({ thinking, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen)
  if (!thinking) return null
  return (
    <div style={{ marginBottom: 12, border: '1px solid #e7e5e4', borderRadius: 10, overflow: 'hidden', background: '#fcfaf8' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%', display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 12px', background: 'transparent', border: 'none',
          cursor: 'pointer', fontSize: 12, fontWeight: 650, color: '#57534e',
          textAlign: 'left'
        }}
      >
        <span style={{
          width: 18, height: 18, borderRadius: 6, display: 'grid', placeItems: 'center',
          background: '#fff', border: '1px solid #e7e5e4', fontSize: 10
        }}>{open ? '−' : '+'}</span>
        <span style={{ flex: 1 }}>Thinking</span>
        <span style={{ fontSize: 11, color: '#a8a29e', fontWeight: 500 }}>{open ? 'Hide' : 'Show'} • {Math.ceil(thinking.length / 5)}s</span>
        <span style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform .15s', fontSize: 10, color: '#a8a29e' }}>▾</span>
      </button>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.18 }}
            style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 12px 12px', fontSize: 12, lineHeight: 1.6, color: '#57534e', whiteSpace: 'pre-wrap', borderTop: '1px solid #f5f5f4' }}>
              <div style={{ paddingTop: 10 }}>{thinking}</div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

function ActionBar({ onCopy, onRetry, answer }) {
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState(null) // 'up' | 'down' | null

  const handleCopy = () => {
    navigator.clipboard.writeText(answer || '')
    setCopied(true)
    toast('Copied', 'success')
    onCopy && onCopy()
    setTimeout(() => setCopied(false), 1200)
  }

  const btnStyle = (active) => ({
    padding: '6px 10px', borderRadius: 999, border: '1px solid #e7e5e4',
    background: active ? '#0f172a' : 'white', color: active ? 'white' : '#57534e',
    fontSize: 12, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6,
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)', transition: 'all .14s'
  })

  return (
    <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginTop: 14, paddingTop: 10, borderTop: '1px solid #f5f5f4' }}>
      <button onClick={handleCopy} style={btnStyle(false)} title="Copy">
        <span style={{ fontSize: 12 }}>{copied ? '✓' : '⎘'}</span> {copied ? 'Copied' : 'Copy'}
      </button>
      {onRetry && (
        <button onClick={onRetry} style={btnStyle(false)} title="Regenerate">
          <span style={{ fontSize: 12 }}>↻</span> Retry
        </button>
      )}
      <div style={{ width: 1, height: 22, background: '#e7e5e4', alignSelf: 'center', margin: '0 2px' }} />
      <button onClick={() => { setLiked(liked === 'up' ? null : 'up'); if (liked !== 'up') toast('Thanks for feedback', 'success') }} style={btnStyle(liked === 'up')} title="Helpful">
        <span>👍</span>
      </button>
      <button onClick={() => { setLiked(liked === 'down' ? null : 'down'); if (liked !== 'down') toast('Thanks for feedback', 'success') }} style={btnStyle(liked === 'down')} title="Not helpful">
        <span>👎</span>
      </button>
      <button
        onClick={() => { navigator.clipboard.writeText(answer || ''); toast('Link copied', 'success') }}
        style={btnStyle(false)} title="Share"
      >
        <span>↗</span> Share
      </button>
    </div>
  )
}

export default function ClaudeAnswer({
  question,
  answer,
  thinking,
  loading = false,
  onRetry,
  onCopy,
  variant = 'answer', // answer | summary | notes | extract
  meta = null, // e.g. timestamp
}) {
  // auto-generate thinking if not provided
  const genThinking = () => {
    if (thinking) return thinking
    if (!question && !answer) return ''
    const q = question || (variant === 'summary' ? 'Summarize this document' : variant === 'notes' ? 'Create study notes' : 'Extract key info')
    return `User query: "${q}"\n\n• Scanning document for relevant passages and overall structure\n• Identifying key points, entities, and supporting details\n• Checking for context that answers the question directly vs. needs synthesis\n• Planning a clear, structured response with markdown, tables where helpful, and concise explanations\n• Ensuring answer is grounded only in the provided document`
  }

  const th = genThinking()
  const [showThinking, setShowThinking] = useState(false)

  // while loading, show thinking expanded
  useEffect(() => {
    if (loading) setShowThinking(true)
  }, [loading])

  if (loading) {
    return (
      <div className="card" style={{ padding: 16, borderRadius: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={{ width: 26, height: 26, borderRadius: 8, background: '#0f172a', display: 'grid', placeItems: 'center', color: 'white', fontSize: 11 }}>✦</div>
          <span style={{ fontSize: 13, fontWeight: 700, color: '#0f172a' }}>Claude</span>
          <span style={{ fontSize: 11, color: '#a8a29e' }}>thinking…</span>
          <span className="shimmer" style={{ width: 60, height: 6, borderRadius: 999 }} />
        </div>
        <ThinkingBlock thinking={th} defaultOpen={true} />
        <div style={{ display: 'grid', gap: 8, marginTop: 4 }}>
          <div className="shimmer" style={{ height: 12, borderRadius: 6 }} />
          <div className="shimmer" style={{ height: 12, borderRadius: 6, width: '92%' }} />
          <div className="shimmer" style={{ height: 12, borderRadius: 6, width: '78%' }} />
        </div>
      </div>
    )
  }

  if (!answer) return null

  return (
    <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ padding: 0, overflow: 'hidden', borderRadius: 16 }}>
      {/* header like Claude */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', borderBottom: '1px solid #f5f5f4', background: '#fcfaf8' }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: '#0f172a', display: 'grid', placeItems: 'center', color: 'white', fontSize: 11, flexShrink: 0 }}>✦</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 13, fontWeight: 750, color: '#0f172a', display: 'flex', gap: 6, alignItems: 'center' }}>
            Claude
            <span style={{ fontSize: 10, fontWeight: 600, color: '#a8a29e', background: 'white', border: '1px solid #e7e5e4', padding: '2px 6px', borderRadius: 999 }}>Sonnet</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: '#a8a29e' }}>• {variant}</span>
          </div>
          {question && <div style={{ fontSize: 12, color: '#57534e', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: 1 }}>Q: {question}</div>}
        </div>
        {meta && <span style={{ fontSize: 11, color: '#a8a29e', flexShrink: 0 }}>{meta}</span>}
      </div>

      <div style={{ padding: '14px 16px' }}>
        <ThinkingBlock thinking={th} defaultOpen={showThinking} />
        <div className="markdown" style={{ fontSize: 14, lineHeight: 1.72 }}>
          <MarkdownRenderer content={answer} />
        </div>
        <ActionBar answer={answer} onCopy={onCopy} onRetry={onRetry} />
      </div>
    </motion.div>
  )
}

// compact version for history list — collapsed thinking by default
export function ClaudeHistoryItem({ question, answer, created_at, onRetry }) {
  return (
    <ClaudeAnswer
      question={question}
      answer={answer}
      variant="answer"
      meta={created_at ? new Date(created_at).toLocaleString() : null}
      onRetry={onRetry}
    />
  )
}
