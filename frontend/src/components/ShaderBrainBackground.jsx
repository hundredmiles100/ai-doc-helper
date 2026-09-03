import { useState } from 'react'

// Performant brain video background — no WebGL, no blur
// - keeps brain.mp4 but with light warm wash for readability
// - pure CSS, no canvas, no backdrop-filter, no turbulence loop
const BRAIN_VIDEO = '/brain.mp4'

export default function ShaderBrainBackground() {
  const [videoOk, setVideoOk] = useState(true)

  return (
    <div
      aria-hidden
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: -1,
        overflow: 'hidden',
        background: '#fdfcfa',
        pointerEvents: 'none',
      }}
    >
      {videoOk && (
        <video
          autoPlay
          loop
          muted
          playsInline
          preload="metadata"
          onError={() => setVideoOk(false)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center 42%',
            opacity: 0.16,
            filter: 'contrast(1.02) saturate(0.9)',
            transform: 'scale(1.03)',
          }}
        >
          <source src={BRAIN_VIDEO} type="video/mp4" />
        </video>
      )}

      {/* warm paper wash — ensures text readability without blur */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: `
            radial-gradient(700px 380px at 50% 0%, rgba(255,255,255,0.92), transparent 68%),
            linear-gradient(180deg, rgba(253,252,250,0.88) 0%, rgba(253,252,250,0.62) 22%, rgba(253,252,250,0.22) 44%, rgba(253,252,250,0.74) 86%, rgba(248,250,252,0.96) 100%)
          `,
        }}
      />

      {/* subtle vignette */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(1000px 600px at 50% 50%, transparent 62%, rgba(15,23,42,0.04) 100%)',
        }}
      />
    </div>
  )
}
