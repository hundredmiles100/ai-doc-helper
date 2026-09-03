import { createContext, useContext, useState, useEffect } from 'react'
import api from '../api/client'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [token, setToken] = useState(() => localStorage.getItem('token'))
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (token) {
      localStorage.setItem('token', token)
      api.defaults.headers.common['Authorization'] = `Bearer ${token}`
    } else {
      localStorage.removeItem('token')
      delete api.defaults.headers.common['Authorization']
    }
  }, [token])

  // validate token on mount and when token changes
  useEffect(() => {
    const init = async () => {
      if (!token) {
        setUser(null)
        setLoading(false)
        return
      }
      try {
        api.defaults.headers.common['Authorization'] = `Bearer ${token}`
        const res = await api.get('/auth/me')
        setUser(res.data)
      } catch {
        // token invalid
        setToken(null)
        setUser(null)
        localStorage.removeItem('token')
        localStorage.removeItem('user')
      }
      setLoading(false)
    }
    init()
  }, [token])

  const login = async (username, password) => {
    // backend expects OAuth2PasswordRequestForm (form-encoded) at /api/auth/login
    const params = new URLSearchParams()
    params.append('username', username)
    params.append('password', password)
    const res = await api.post('/auth/login', params, {
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    })
    const data = res.data
    setToken(data.access_token)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify({ username: data.username, id: data.user_id }))
    // fetch me
    try {
      const me = await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.access_token}` } })
      setUser(me.data)
    } catch {
      setUser({ username: data.username, id: data.user_id })
    }
    return data
  }

  const register = async (username, password, email) => {
    const res = await api.post('/auth/register', { username, password, email: email || undefined })
    const data = res.data
    setToken(data.access_token)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify({ username: data.username, id: data.user_id }))
    try {
      const me = await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.access_token}` } })
      setUser(me.data)
    } catch {
      setUser({ username: data.username, id: data.user_id })
    }
    return data
  }

  const guest = async () => {
    const res = await api.post('/auth/guest')
    const data = res.data
    setToken(data.access_token)
    localStorage.setItem('token', data.access_token)
    localStorage.setItem('user', JSON.stringify({ username: data.username, id: data.user_id }))
    try {
      const me = await api.get('/auth/me', { headers: { Authorization: `Bearer ${data.access_token}` } })
      setUser(me.data)
    } catch {
      setUser({ username: data.username, id: data.user_id })
    }
    return data
  }

  const logout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    delete api.defaults.headers.common['Authorization']
  }

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, guest, logout, isAuthed: !!token && !!user }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be inside AuthProvider')
  return ctx
}
