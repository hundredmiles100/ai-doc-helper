import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useLocation } from 'react-router-dom'
import { useState } from 'react'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import DocumentView from './pages/DocumentView'
import ComparePage from './pages/ComparePage'
import AnimatedBackground from './components/AnimatedBackground'
import ToastContainer, { useToast } from './components/Toast'

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
          <Route path="/" element={<Dashboard />} />
          <Route path="/doc/:id" element={<DocumentView />} />
          <Route path="/compare" element={<ComparePage />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  )
}

export default function App() {
  const { toasts } = useToast()
  return (
    <BrowserRouter>
      <AnimatedBackground />
      <Navbar />
      <AnimatedRoutes />
      <ToastContainer toasts={toasts} />
      <motion.footer
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        style={{ textAlign: 'center', padding: '24px 0 32px', fontSize: 12, color: '#94a3b8' }}
      >
        Built with FastAPI + React + motion • Tables & markdown rendered • No fake data — real doc extraction
      </motion.footer>
    </BrowserRouter>
  )
}
