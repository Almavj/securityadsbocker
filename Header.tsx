import Link from 'next/link'
import DarkModeToggle from './DarkModeToggle'

export default function Header() {
  return (
    <header className="main-header">
      <div className="logo-container">
        <img src="/assets/images/logo.png" alt="Logo" className="logo" />
        <h1>Network Security Dashboard</h1>
      </div>
      <nav className="main-nav" aria-label="Main navigation">
        <ul>
          <li><Link href="/"><a className="nav-link">Home</a></Link></li>
          <li><Link href="/dashboard"><a className="nav-link">Dashboard</a></Link></li>
          <li><Link href="/blocklist"><a className="nav-link">Blocklist</a></Link></li>
          <li><Link href="/logs"><a className="nav-link">Logs</a></Link></li>
          <li><Link href="/login"><a className="nav-link">Login</a></Link></li>
        </ul>
      </nav>
      <DarkModeToggle />
    </header>
  )
}