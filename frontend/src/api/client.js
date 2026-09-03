import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL ? `${import.meta.env.VITE_API_URL}/api` : '/api',
})

// inject token from localStorage if present (for page reload before AuthContext sets header)
if (typeof window !== 'undefined') {
  const existing = localStorage.getItem('token')
  if (existing) {
    api.defaults.headers.common['Authorization'] = `Bearer ${existing}`
  }
}

// on 401 auto-redirect to login (unless already on login/register)
api.interceptors.response.use(
  (res) => res,
  (err) => {
    if (err.response && err.response.status === 401) {
      const path = window.location.pathname
      if (path !== '/login' && path !== '/register') {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
        // avoid loop: only redirect if we had a token before
        if (localStorage.getItem('token') === null) {
          // token already cleared, but we still redirect to force login
          // use location to ensure full redirect outside React Router edge
          // only if not already handling
        }
        // soft redirect via window.location — React Router will also catch but this ensures no stale UI
        if (!path.startsWith('/login')) {
          window.location.href = '/login'
        }
      }
    }
    return Promise.reject(err)
  }
)

export default api
