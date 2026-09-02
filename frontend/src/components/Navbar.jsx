import { Link, useLocation } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Navbar() {
  const loc = useLocation()
  const isActive = (p) => loc.pathname === p
  const showApiDocs = typeof window !== 'undefined' && (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1' || import.meta.env.DEV)

  return (
    <motion.nav
      initial={{ y: -16, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: 'easeOut' }}
    >
      <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <motion.span
          animate={{ rotate: [0, 8, -6, 0] }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{ fontSize: 22 }}
        >🤖</motion.span>
        DocHelper
      </Link>

      <div className="links" style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
        {[
          { to: '/', label: 'Dashboard' },
          { to: '/compare', label: 'Compare' },
        ].map(item => (
          <motion.div key={item.to} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
            <Link
              to={item.to}
              style={{
                padding: '7px 14px',
                borderRadius: 10,
                background: isActive(item.to) ? '#0f172a' : 'transparent',
                color: isActive(item.to) ? 'white' : '#475569',
                fontWeight: isActive(item.to) ? 600 : 500,
                display: 'block'
              }}
            >
              {item.label}
            </Link>
          </motion.div>
        ))}
        {showApiDocs && (
          <motion.a
            href="http://localhost:8000/docs"
            target="_blank"
            rel="noreferrer"
            whileHover={{ y: -1 }}
            style={{
              marginLeft: 6,
              padding: '7px 12px',
              borderRadius: 10,
              border: '1px solid #e2e8f0',
              background: 'white',
              fontSize: 13,
              fontWeight: 600,
              color: '#475569'
            }}
          >
            API Docs ↗
          </motion.a>
        )}
      </div>
    </motion.nav>
  )
}
