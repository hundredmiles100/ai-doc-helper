import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

let pushToast = null

export function useToast() {
  const [toasts, setToasts] = useState([])
  useEffect(() => {
    pushToast = (msg, type = 'default') => {
      const id = Date.now()
      setToasts(t => [...t, { id, msg, type }])
      setTimeout(() => setToasts(t => t.filter(x => x.id !== id)), 3000)
    }
  }, [])
  return { toasts, push: (m, t) => pushToast?.(m, t) }
}

export function toast(msg, type = 'default') {
  pushToast?.(msg, type)
}

export default function ToastContainer({ toasts }) {
  return (
    <div style={{ position: 'fixed', bottom: 20, right: 20, zIndex: 100, display: 'flex', flexDirection: 'column', gap: 8 }}>
      <AnimatePresence>
        {toasts.map(t => (
          <motion.div
            key={t.id}
            initial={{ opacity: 0, x: 40, scale: 0.96 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20 }}
            style={{
              background: t.type === 'success' ? '#0f172a' : t.type === 'error' ? '#dc2626' : 'white',
              color: t.type === 'default' ? '#0f172a' : 'white',
              padding: '12px 16px',
              borderRadius: 12,
              border: '1px solid rgba(226,232,240,0.8)',
              boxShadow: '0 8px 32px rgba(15,23,42,0.15)',
              fontSize: 13,
              maxWidth: 320
            }}
          >
            {t.msg}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  )
}
