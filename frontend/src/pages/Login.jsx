import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/Toast'

export default function Login() {
  const { login, guest } = useAuth()
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) return toast('Enter your username and password', 'error')
    setLoading(true)
    try {
      await login(username.trim(), password)
      toast('Welcome back', 'success')
      nav('/')
    } catch (err) {
      toast(err.response?.data?.detail || 'Could not sign in', 'error')
    }
    setLoading(false)
  }

  const doGuest = async () => {
    setGuestLoading(true)
    try {
      await guest()
      toast('Signed in as guest — free!', 'success')
      nav('/')
    } catch (e) { toast(e.response?.data?.detail || 'Guest sign in failed', 'error') }
    setGuestLoading(false)
  }

  return (
    <div className="container" style={{ maxWidth: 440, marginTop: 36 }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="liquid-glass" style={{ padding: 28 }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', display: 'grid', placeItems: 'center', margin: '0 auto', color: 'white', fontSize: 20, boxShadow: '0 8px 20px rgba(79,70,229,0.22)' }}>✦</div>
          <h2 style={{ marginTop: 14, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Welcome back</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>Sign in — free, instant, your docs stay private.</p>
        </div>
        {/* FREE guest — most visible */}
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} onClick={doGuest} disabled={guestLoading} style={{ width: '100%', padding: '13px 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.9)', background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', color: 'white', fontWeight: 750, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 24px rgba(79,70,229,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {guestLoading ? 'Creating guest…' : '⚡ Continue as guest — free'}
        </motion.button>
        <p style={{ textAlign: 'center', fontSize: 11, color: '#94a3b8', marginTop: 6 }}>No password needed • instant private session</p>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '16px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(226,232,240,0.8)' }} />
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>or sign in</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(226,232,240,0.8)' }} />
        </div>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 650, color: '#334155' }}>Username</label>
            <input className="input" placeholder="Your username" value={username} onChange={e => setUsername(e.target.value)} style={{ marginTop: 6 }} autoComplete="username" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 650, color: '#334155' }}>Password</label>
            <input className="input" type="password" placeholder="Your password" value={password} onChange={e => setPassword(e.target.value)} style={{ marginTop: 6 }} autoComplete="current-password" />
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} className="btn" disabled={loading} type="submit" style={{ marginTop: 4, padding: 13, borderRadius: 999, background: 'rgba(255,255,255,0.9)', color: '#0f172a', border: '1px solid rgba(255,255,255,0.9)' }}>
            {loading ? 'Signing in…' : 'Sign in with password'}
          </motion.button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#64748b' }}>
          New here? <Link to="/register" style={{ color: '#4f46e5', fontWeight: 700 }}>Create an account — free</Link>
        </p>
      </motion.div>
      <p style={{ textAlign: 'center', marginTop: 12, fontSize: 11, color: '#94a3b8' }}>Free forever • No credit card • Private</p>
    </div>
  )
}
