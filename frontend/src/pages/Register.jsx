import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { useAuth } from '../context/AuthContext'
import { toast } from '../components/Toast'

export default function Register() {
  const { register, guest } = useAuth()
  const nav = useNavigate()
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [guestLoading, setGuestLoading] = useState(false)

  const submit = async (e) => {
    e.preventDefault()
    if (!username.trim() || !password) return toast('Choose a username and password', 'error')
    if (password.length < 6) return toast('Password must be at least 6 characters', 'error')
    setLoading(true)
    try {
      await register(username.trim(), password, email.trim() || undefined)
      toast('Account created — welcome!', 'success')
      nav('/')
    } catch (err) {
      toast(err.response?.data?.detail || 'Could not create account', 'error')
    }
    setLoading(false)
  }

  const doGuest = async () => {
    setGuestLoading(true)
    try { await guest(); toast('Guest account created — free!', 'success'); nav('/') } catch (e) { toast(e.response?.data?.detail || 'Guest failed', 'error') }
    setGuestLoading(false)
  }

  return (
    <div className="container" style={{ maxWidth: 440, marginTop: 36 }}>
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="liquid-glass" style={{ padding: 28 }}>
        <div style={{ textAlign: 'center', marginBottom: 18 }}>
          <div style={{ width: 48, height: 48, borderRadius: 14, background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', display: 'grid', placeItems: 'center', margin: '0 auto', color: 'white', fontSize: 20, boxShadow: '0 8px 20px rgba(79,70,229,0.22)' }}>✺</div>
          <h2 style={{ marginTop: 14, fontSize: 20, fontWeight: 800, letterSpacing: '-0.02em' }}>Create your account — free</h2>
          <p style={{ color: '#64748b', fontSize: 13, marginTop: 6, lineHeight: 1.5 }}>Free forever • No credit card • Private</p>
        </div>
        <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} onClick={doGuest} disabled={guestLoading} style={{ width: '100%', padding: '13px 16px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.9)', background: 'linear-gradient(135deg,#4f46e5,#06b6d4)', color: 'white', fontWeight: 750, fontSize: 14, cursor: 'pointer', boxShadow: '0 8px 24px rgba(79,70,229,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {guestLoading ? 'Creating…' : '⚡ Try as guest — instant, free'}
        </motion.button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, margin: '14px 0' }}>
          <div style={{ flex: 1, height: 1, background: 'rgba(226,232,240,0.8)' }} />
          <span style={{ fontSize: 11, color: '#94a3b8', fontWeight: 600 }}>or create with password</span>
          <div style={{ flex: 1, height: 1, background: 'rgba(226,232,240,0.8)' }} />
        </div>
        <form onSubmit={submit} style={{ display: 'grid', gap: 12 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 650, color: '#334155' }}>Username</label>
            <input className="input" placeholder="Pick a username" value={username} onChange={e => setUsername(e.target.value)} style={{ marginTop: 6 }} autoComplete="username" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 650, color: '#334155' }}>Email <span style={{ fontWeight: 400, color: '#94a3b8' }}>(optional)</span></label>
            <input className="input" placeholder="you@example.com" value={email} onChange={e => setEmail(e.target.value)} style={{ marginTop: 6 }} autoComplete="email" />
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 650, color: '#334155' }}>Password</label>
            <input className="input" type="password" placeholder="At least 6 characters" value={password} onChange={e => setPassword(e.target.value)} style={{ marginTop: 6 }} autoComplete="new-password" />
          </div>
          <motion.button whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.97 }} className="btn" disabled={loading} type="submit" style={{ marginTop: 4, padding: 13, borderRadius: 999, background: 'rgba(255,255,255,0.9)', color: '#0f172a', border: '1px solid rgba(255,255,255,0.9)' }}>
            {loading ? 'Creating…' : 'Create account'}
          </motion.button>
        </form>
        <p style={{ textAlign: 'center', marginTop: 14, fontSize: 13, color: '#64748b' }}>
          Already have an account? <Link to="/login" style={{ color: '#4f46e5', fontWeight: 700 }}>Sign in</Link>
        </p>
      </motion.div>
    </div>
  )
}
