import { motion } from 'framer-motion'

export default function AnimatedBackground() {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: -1, overflow: 'hidden', pointerEvents: 'none' }}>
      <motion.div
        className="blob"
        style={{ width: 600, height: 600, background: 'radial-gradient(circle, rgba(79,70,229,0.18), transparent 70%)', top: -120, left: -120 }}
        animate={{ x: [0, 20, 0], y: [0, -15, 0], scale: [1, 1.05, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="blob"
        style={{ width: 500, height: 500, background: 'radial-gradient(circle, rgba(6,182,214,0.14), transparent 70%)', top: 80, right: -80 }}
        animate={{ x: [0, -18, 0], y: [0, 12, 0], scale: [1, 0.97, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="blob"
        style={{ width: 700, height: 400, background: 'radial-gradient(ellipse, rgba(168,85,247,0.10), transparent 70%)', bottom: -60, left: '30%' }}
        animate={{ x: [0, 12, 0], y: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
      />
    </div>
  )
}
