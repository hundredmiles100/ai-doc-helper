// liquid-glass.js — tiny helper to drive the liquid highlight & turbulence
// moves --mx/--my CSS vars on .liquid-glass and animates SVG turbulence for refraction

export function initLiquidGlass() {
  if (typeof window === 'undefined') return

  // mouse highlight
  const update = (e) => {
    document.querySelectorAll('.liquid-glass, .hero-glass, .dropzone, nav').forEach(el => {
      const r = el.getBoundingClientRect()
      // only if mouse near
      if (e.clientX < r.left - 80 || e.clientX > r.right + 80 || e.clientY < r.top - 80 || e.clientY > r.bottom + 80) return
      const x = ((e.clientX - r.left) / r.width) * 100
      const y = ((e.clientY - r.top) / r.height) * 100
      el.style.setProperty('--mx', `${x}%`)
      el.style.setProperty('--my', `${y}%`)
    })
  }
  window.addEventListener('mousemove', update, { passive: true })

  // animate turbulence for subtle liquid breathing
  let t = 0
  const turb = () => document.querySelector('#liquidGlass feTurbulence')
  const loop = () => {
    t += 0.003
    const el = turb()
    if (el) {
      const f = 0.009 + Math.sin(t) * 0.002
      el.setAttribute('baseFrequency', `${f.toFixed(4)} ${f.toFixed(4)}`)
    }
    requestAnimationFrame(loop)
  }
  requestAnimationFrame(loop)

  return () => window.removeEventListener('mousemove', update)
}
