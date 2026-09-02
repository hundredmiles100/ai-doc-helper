import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

export default function Navbar() {
  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.4 }}
      style={{ background: 'white', borderBottom: '1px solid #e2e8f0', padding: '14px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}
    >
      <Link to="/" className="logo" style={{ fontWeight: 700, fontSize: 20 }}>DocHelper 🤖</Link>
      <div className="links" style={{ display: 'flex', gap: 16 }}>
        <motion.div whileHover={{ y: -1 }}><Link to="/">Dashboard</Link></motion.div>
        <motion.div whileHover={{ y: -1 }}><Link to="/compare">Compare</Link></motion.div>
        <motion.div whileHover={{ y: -1 }}><a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">API Docs</a></motion.div>
      </div>
    </motion.nav>
  )
}

