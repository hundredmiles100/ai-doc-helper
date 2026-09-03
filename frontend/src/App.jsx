import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import DocumentView from './pages/DocumentView'
import ComparePage from './pages/ComparePage'
import Login from './pages/Login'
import Register from './pages/Register'
import AnimatedBackground from './components/AnimatedBackground'
import ToastContainer, { useToast } from './components/Toast'
import { AuthProvider, useAuth } from './context/AuthContext'

function ProtectedRoute({ children }) {
  const { user, loading, token } = useAuth()
  if (loading) return <div className="container"><div className="card shimmer" style={{ height: 120, marginTop: 20 }} /></div>
  if (!token || !user) return <Navigate to="/login" replace />
  return children
}

function PublicOnly({ children }) {
  const { user, token, loading } = useAuth()
  if (loading) return <div className="container"><div className="card shimmer" style={{ height: 120, marginTop: 20 }} /></div>
  if (token && user) return <Navigate to="/" replace />
  return children
}

function AnimatedRoutes() {
  const location = useLocation()
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.22, ease: 'easeOut' }}
      >
        <Routes location={location} key={location.pathname}>
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/doc/:id" element={<ProtectedRoute><DocumentView /></ProtectedRoute>} />
          <Route path="/compare" element={<ProtectedRoute><ComparePage /></ProtectedRoute>} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  const { toasts } = useToast()
  return (
    <BrowserRouter>
      <AuthProvider>
        <AnimatedBackground />
        <Navbar />
        <AnimatedRoutes />
        <ToastContainer toasts={toasts} />
        <motion.footer
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          style={{ textAlign: 'center', padding: '28px 0 32px', fontSize: 12, color: '#94a3b8' }}
        >
          <span style={{ background: 'rgba(255,255,255,0.62)', padding: '6px 12px', borderRadius: 999, border: '1px solid rgba(255,255,255,0.9)', backdropFilter: 'blur(8px)' }}>
            Your documents stay private — only you can see them
          </span>
        </motion.footer>
      </AuthProvider>
    </BrowserRouter>
  )
}
