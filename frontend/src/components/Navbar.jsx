import { Link, useLocation, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'

export default function Navbar() {
  const loc = useLocation()
  const nav = useNavigate()
  const { user, logout, token } = useAuth()
  const isActive = (p) => loc.pathname === p

  return (
    <motion.nav
      initial={{ y: -10, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      style={{
        background: 'rgba(255,255,255,0.62)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.65)',
        boxShadow: '0 4px 24px rgba(15,23,42,0.04), inset 0 1px 0 rgba(255,255,255,0.7)'
      }}
    >
      <Link to="/" className="logo" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <span style={{
          width: 32, height: 32, borderRadius: 10,
          background: 'linear-gradient(135deg,#4f46e5 0%, #06b6d4 100%)',
          display: 'grid', placeItems: 'center', color: 'white', fontSize: 15,
          boxShadow: '0 4px 12px rgba(79,70,229,0.28)', border: '1px solid rgba(255,255,255,0.22)'
        }}>✦</span>
        <span>DocHelper</span>
        <span style={{ fontSize: 11, fontWeight: 600, color: '#64748b', background: 'rgba(255,255,255,0.7)', padding: '3px 8px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.9)', marginLeft: 2 }}>private</span>
      </Link>

      <div className="links" style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
        {token && user ? (
          <>
            {[
              { to: '/', label: 'My docs' },
              { to: '/compare', label: 'Compare' },
            ].map(item => (
              <motion.div key={item.to} whileHover={{ y: -1 }} whileTap={{ scale: 0.97 }}>
                <Link
                  to={item.to}
                  style={{
                    padding: '7px 14px',
                    borderRadius: 999,
                    background: isActive(item.to) ? '#0f172a' : 'rgba(255,255,255,0.6)',
                    color: isActive(item.to) ? 'white' : '#334155',
                    fontWeight: isActive(item.to) ? 600 : 500,
                    display: 'block',
                    border: isActive(item.to) ? '1px solid rgba(15,23,42,1)' : '1px solid rgba(255,255,255,0.8)',
                    backdropFilter: 'blur(8px)'
                  }}
                >
                  {item.label}
                </Link>
              </motion.div>
            ))}
            <span style={{ marginLeft: 10, fontSize: 12, color: '#334155', background: 'rgba(255,255,255,0.72)', padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.9)', fontWeight: 600, backdropFilter: 'blur(8px)' }}>
              {user.username}
            </span>
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.97 }} onClick={() => { logout(); nav('/login') }} style={{ marginLeft: 4, padding: '7px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.9)', background: 'rgba(255,255,255,0.7)', fontSize: 13, fontWeight: 600, color: '#475569', cursor: 'pointer', backdropFilter: 'blur(8px)' }}>
              Sign out
            </motion.button>
          </>
        ) : (
          <>
            <Link to="/login" style={{ padding: '8px 16px', borderRadius: 999, background: isActive('/login') ? '#0f172a' : 'rgba(255,255,255,0.7)', color: isActive('/login') ? 'white' : '#334155', fontWeight: 600, display: 'block', border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>Sign in</Link>
            <Link to="/register" style={{ padding: '8px 16px', borderRadius: 999, background: '#0f172a', color: 'white', fontWeight: 600, display: 'block', boxShadow: '0 4px 16px rgba(15,23,42,0.15)' }}>Create account</Link>
          </>
        )}
      </div>
    </motion.nav>
  )
}
