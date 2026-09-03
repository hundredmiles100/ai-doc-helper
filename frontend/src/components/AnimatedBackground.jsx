import { motion } from 'framer-motion'

export default function AnimatedBackground() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        pointerEvents: 'none',
        background: '#f8fafc',
      }}
      aria-hidden
    >
      {/* soft mesh + orbs — liquid glass backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(820px 520px at 18% 12%, rgba(99,102,241,0.09), transparent 62%),
            radial-gradient(760px 480px at 88% 18%, rgba(6,182,214,0.08), transparent 62%),
            radial-gradient(640px 420px at 52% 92%, rgba(168,85,247,0.07), transparent 64%),
            linear-gradient(180deg, #f8fafc 0%, #f3f4ff 48%, #f8fafc 100%)
          `,
        }}
      />

      {/* liquid orbs — slow drift */}
      <motion.div
        className="orb"
        style={{
          width: 560, height: 560,
          left: -80, top: -120,
          background: 'radial-gradient(circle at 35% 35%, rgba(99,102,241,0.22), rgba(99,102,241,0.04) 68%)',
        }}
        animate={{ x: [0, 18, 0], y: [0, -12, 0], scale: [1, 1.04, 1] }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
      />
      <motion.div
        className="orb"
        style={{
          width: 480, height: 480,
          right: -60, top: -40,
          background: 'radial-gradient(circle at 40% 30%, rgba(6,182,214,0.18), rgba(6,182,214,0.03) 70%)',
        }}
        animate={{ x: [0, -14, 0], y: [0, 10, 0], scale: [1, 1.03, 1] }}
        transition={{ duration: 11, repeat: Infinity, ease: 'easeInOut', delay: 0.6 }}
      />
      <motion.div
        className="orb"
        style={{
          width: 620, height: 420,
          left: '22%', bottom: -80,
          background: 'radial-gradient(ellipse at 50% 40%, rgba(168,85,247,0.14), transparent 72%)',
          filter: 'blur(46px)',
        }}
        animate={{ x: [0, 12, 0], y: [0, -10, 0] }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
      />
      <motion.div
        className="orb"
        style={{
          width: 360, height: 360,
          right: '18%', bottom: 80,
          background: 'radial-gradient(circle at 50% 50%, rgba(99,102,241,0.10), transparent 70%)',
        }}
        animate={{ x: [0, -10, 0], y: [0, -14, 0] }}
        transition={{ duration: 8.5, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
      />

      {/* subtle grain — soft paper */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  )
}
