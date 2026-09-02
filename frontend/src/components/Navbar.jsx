import { Link } from 'react-router-dom'

export default function Navbar() {
  return (
    <nav>
      <Link to="/" className="logo">DocHelper 🤖</Link>
      <div className="links">
        <Link to="/">Dashboard</Link>
        <Link to="/compare">Compare</Link>
        <a href="http://localhost:8000/docs" target="_blank" rel="noreferrer">API Docs</a>
      </div>
    </nav>
  )
}
