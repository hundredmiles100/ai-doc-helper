import { motion } from 'framer-motion'

function Gear({ size = 260, x, y, duration = 22, reverse = false, opacity = 0.09, stroke = '#334155' }) {
  return (
    <motion.div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        left: x,
        top: y,
        opacity,
        pointerEvents: 'none',
      }}
      animate={{ rotate: reverse ? -360 : 360 }}
      transition={{ duration, repeat: Infinity, ease: 'linear' }}
    >
      <svg viewBox="0 0 120 120" width="100%" height="100%" style={{ overflow: 'visible' }}>
        {/* outer teeth */}
        <g fill="none" stroke={stroke} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
          {/* 12 teeth as rectangles around circle */}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180
            const r1 = 46, r2 = 54
            const x1 = 60 + Math.cos(a) * r1
            const y1 = 60 + Math.sin(a) * r1
            const x2 = 60 + Math.cos(a) * r2
            const y2 = 60 + Math.sin(a) * r2
            // tooth width perpendicular
            const w = 6
            const px = -Math.sin(a) * w
            const py = Math.cos(a) * w
            return <line key={i} x1={x1 + px} y1={y1 + py} x2={x2 + px} y2={y2 + py} opacity="0.95" />
          })}
          {Array.from({ length: 12 }).map((_, i) => {
            const a = (i * 30 * Math.PI) / 180
            const r1 = 46, r2 = 54
            const x1 = 60 + Math.cos(a) * r1
            const y1 = 60 + Math.sin(a) * r1
            const x2 = 60 + Math.cos(a) * r2
            const y2 = 60 + Math.sin(a) * r2
            const w = 6
            const px = Math.sin(a) * w
            const py = -Math.cos(a) * w
            return <line key={`b-${i}`} x1={x1 + px} y1={y1 + py} x2={x2 + px} y2={y2 + py} opacity="0.95" />
          })}
          {/* main rings */}
          <circle cx="60" cy="60" r="42" opacity="0.9" />
          <circle cx="60" cy="60" r="34" opacity="0.55" strokeDasharray="3 5" />
          <circle cx="60" cy="60" r="18" opacity="0.85" />
          <circle cx="60" cy="60" r="8" fill={stroke} fillOpacity="0.08" />
          {/* spokes 6 */}
          {Array.from({ length: 6 }).map((_, i) => {
            const a = (i * 60 * Math.PI) / 180
            const x1 = 60 + Math.cos(a) * 10
            const y1 = 60 + Math.sin(a) * 10
            const x2 = 60 + Math.cos(a) * 31
            const y2 = 60 + Math.sin(a) * 31
            return <line key={`s-${i}`} x1={x1} y1={y1} x2={x2} y2={y2} strokeWidth="1" opacity="0.6" />
          })}
          {/* center bolt */}
          <circle cx="60" cy="60" r="2.8" fill={stroke} stroke="none" opacity="0.9" />
        </g>
      </svg>
    </motion.div>
  )
}

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
      {/* blueprint base + subtle steel vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(900px 500px at 15% 0%, rgba(51,65,85,0.06), transparent 60%),
            radial-gradient(700px 400px at 90% 12%, rgba(71,85,105,0.05), transparent 60%),
            linear-gradient(180deg, #f8fafc 0%, #f1f5f9 100%)
          `,
        }}
      />

      {/* blueprint grid - human made technical drawing */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.55,
          backgroundImage: `
            linear-gradient(rgba(15,23,42,0.045) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15,23,42,0.045) 1px, transparent 1px),
            linear-gradient(rgba(15,23,42,0.02) 1px, transparent 1px),
            linear-gradient(90deg, rgba(15,23,42,0.02) 1px, transparent 1px)
          `,
          backgroundSize: '80px 80px, 80px 80px, 16px 16px, 16px 16px',
          maskImage: 'radial-gradient(1200px 600px at 50% 0%, black 60%, transparent 85%)',
          WebkitMaskImage: 'radial-gradient(1200px 600px at 50% 0%, black 60%, transparent 85%)',
        }}
      />

      {/* dashed conveyor / assembly line dots */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '42%',
          height: 1,
          opacity: 0.18,
          backgroundImage: `repeating-linear-gradient(90deg, #64748b 0 10px, transparent 10px 22px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '43.2%',
          height: 1,
          opacity: 0.12,
          backgroundImage: `repeating-linear-gradient(90deg, #94a3b8 0 6px, transparent 6px 18px)`,
        }}
      />

      {/* moving dash - gives mechanical motion */}
      <motion.div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          top: '42%',
          height: 1,
          backgroundImage: `repeating-linear-gradient(90deg, transparent 0 12px, rgba(79,70,229,0.35) 12px 14px, transparent 14px 22px)`,
          opacity: 0.9,
        }}
        animate={{ backgroundPositionX: ['0px', '44px'] }}
        transition={{ duration: 1.2, repeat: Infinity, ease: 'linear' }}
      />

      {/* blueprint border - like engineering sheet */}
      <div
        style={{
          position: 'absolute',
          inset: 14,
          border: '1px solid rgba(15,23,42,0.07)',
          borderRadius: 18,
          pointerEvents: 'none',
        }}
      >
        {/* corner rivets */}
        {[
          [14, 14],
          [null, 14],
          [14, null],
          [null, null],
        ].map(([l, t], i) => (
          <div
            key={i}
            style={{
              position: 'absolute',
              width: 7,
              height: 7,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 30% 30%, #e2e8f0, #94a3b8)',
              border: '1px solid rgba(15,23,42,0.12)',
              boxShadow: 'inset 0 1px 1px rgba(255,255,255,0.9), 0 1px 2px rgba(15,23,42,0.08)',
              left: l !== null ? l : undefined,
              right: l === null ? 14 : undefined,
              top: t !== null ? t : undefined,
              bottom: t === null ? 14 : undefined,
            }}
          />
        ))}

        {/* title block - human made stamp */}
        <div
          style={{
            position: 'absolute',
            right: 18,
            bottom: 10,
            display: 'flex',
            gap: 10,
            alignItems: 'center',
            opacity: 0.32,
            fontFamily: 'ui-monospace, SFMono-Regular, monospace',
            fontSize: 9,
            letterSpacing: '0.08em',
            color: '#334155',
          }}
        >
          <span style={{ border: '1px solid rgba(15,23,42,0.14)', padding: '3px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.7)' }}>
            SHEET 01 / 01
          </span>
          <span style={{ border: '1px solid rgba(15,23,42,0.14)', padding: '3px 6px', borderRadius: 4, background: 'rgba(255,255,255,0.7)' }}>
            DOC HELPER — MECHANICAL SYSTEM 2026
          </span>
          <span style={{ width: 28, height: 1, background: 'rgba(15,23,42,0.18)' }} />
          <span style={{ fontSize: 8, opacity: 0.8 }}>SCALE 1:1 • REV. 2.0</span>
        </div>
      </div>

      {/* gears - very subtle, behind content */}
      <Gear size={520} x={-130} y={-140} duration={42} opacity={0.065} />
      <Gear size={380} x={-30} y={-90} duration={28} reverse opacity={0.055} stroke="#475569" />
      <Gear size={640} x={680} y={-180} duration={55} opacity={0.05} stroke="#334155" />
      <Gear size={440} x={820} y={90} duration={34} reverse opacity={0.045} />
      <Gear size={300} x={420} y={520} duration={26} opacity={0.035} stroke="#475569" />
      <Gear size={200} x={1020} y={560} duration={20} reverse opacity={0.04} />

      {/* vertical blueprint dimension lines */}
      <div
        style={{
          position: 'absolute',
          left: '22%',
          top: 0,
          bottom: 0,
          width: 1,
          opacity: 0.06,
          background: `repeating-linear-gradient(180deg, #334155 0 8px, transparent 8px 16px)`,
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '18%',
          top: 0,
          bottom: 0,
          width: 1,
          opacity: 0.05,
          background: `repeating-linear-gradient(180deg, #334155 0 6px, transparent 6px 14px)`,
        }}
      />

      {/* slow scanning highlight - like plotter */}
      <motion.div
        style={{
          position: 'absolute',
          top: 0,
          bottom: 0,
          left: 0,
          width: 1,
          background: 'linear-gradient(180deg, transparent, rgba(79,70,229,0.18), transparent)',
          boxShadow: '0 0 12px rgba(79,70,229,0.22)',
          opacity: 0.9,
        }}
        animate={{ left: ['0%', '100%'] }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear', repeatDelay: 2 }}
      />

      {/* subtle noise - makes it feel manufactured paper */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          opacity: 0.025,
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E")`,
        }}
      />

      {/* bottom factory haze */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 220,
          background: 'linear-gradient(180deg, transparent, rgba(241,245,249,0.9) 70%)',
        }}
      />
    </div>
  )
}
