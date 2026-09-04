import { useState } from 'react'
import { NavLink, Link } from 'react-router-dom'
import { Database, Menu, X } from 'lucide-react'

const LINKS = [
  { to: '/', label: 'Inicio', end: true },
  { to: '/nosotros', label: 'Nosotros' },
  { to: '/servicios', label: 'Servicios' },
  { to: '/contacto', label: 'Contacto' },
]

export default function Navbar() {
  const [open, setOpen] = useState(false)

  return (
    <header className="navbar">
      <div className="container navbar-content">
        <Link to="/" className="brand">
          <span className="brand-mark">
            <Database size={17} strokeWidth={2.3} />
          </span>
          Datalume
        </Link>

        <div className="navbar-right">
          <nav>
            {LINKS.map((link) => (
              <NavLink key={link.to} to={link.to} end={link.end}>
                {link.label}
              </NavLink>
            ))}
          </nav>
          <div className="navbar-actions">
            <Link to="login" className="btn btn-outline btn-sm">
              Iniciar sesión
            </Link>
            <Link to="/login?modo=crear" className="btn btn-primary">
              Crear cuenta
            </Link>
          </div>
          <button
            className="nav-toggle"
            onClick={() => setOpen((v) => !v)}
            aria-label="Abrir menú"
          >
            {open ? <X size={18} /> : <Menu size={18} />}
          </button>
        </div>
      </div>

      {open && (
        <div className="container" style={{ paddingBottom: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          {LINKS.map((link) => (
            <NavLink key={link.to} to={link.to} end={link.end} onClick={() => setOpen(false)}>
              {link.label}
            </NavLink>
          ))}
        </div>
      )}
    </header>
  )
}
