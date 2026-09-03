import { useRef } from 'react'
import { motion } from 'framer-motion'

// Liquid Glass wrapper — iOS 26 inspired
// Props: intensity 0-1, interactive (mouse highlight), radius, padding, className, style, hover
export default function LiquidGlass({
  children,
  intensity = 0.85,
  interactive = false,
  radius = 20,
  padding,
  className = '',
  style = {},
  hover = true,
  as: As = 'div',
  ...props
}) {
  const ref = useRef(null)

  const handleMouseMove = (e) => {
    if (!interactive || !ref.current) return
    const rect = ref.current.getBoundingClientRect()
    const x = ((e.clientX - rect.left) / rect.width) * 100
    const y = ((e.clientY - rect.top) / rect.height) * 100
    ref.current.style.setProperty('--mx', `${x}%`)
    ref.current.style.setProperty('--my', `${y}%`)
  }

  const baseStyle = {
    borderRadius: radius,
    padding,
    ...style,
  }

  const Component = As

  // motion component if hover
  if (hover) {
    return (
      <motion.div
        ref={ref}
        className={`liquid-glass ${intensity > 0.8 ? 'liquid-strong' : ''} ${interactive ? 'liquid-interactive' : ''} ${className}`}
        style={baseStyle}
        onMouseMove={handleMouseMove}
        whileHover={hover ? { y: -2 } : undefined}
        transition={{ type: 'spring', stiffness: 400, damping: 28 }}
        {...props}
      >
        {/* specular highlight */}
        <span className="liquid-highlight" aria-hidden />
        {children}
      </motion.div>
    )
  }

  return (
    <div
      ref={ref}
      className={`liquid-glass ${intensity > 0.8 ? 'liquid-strong' : ''} ${interactive ? 'liquid-interactive' : ''} ${className}`}
      style={baseStyle}
      onMouseMove={handleMouseMove}
      {...props}
    >
      <span className="liquid-highlight" aria-hidden />
      {children}
    </div>
  )
}
