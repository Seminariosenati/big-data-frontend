import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import ProjectCard from './ProjectCard'
import ProjectRequestModal from './ProjectRequestModal'
import { ChevronDown, Database, LayoutGrid, LogOut, Plus } from 'lucide-react'
import {
  clearPortalSession,
  getProfile,
  getProjects,
  type PortalProfile,
  type PortalProject,
} from '../lib/portalApi'
import './portal.css'

function initialsFrom(profile: PortalProfile | null): string {
  if (!profile) return '?'
  const source = profile.full_name?.trim() || profile.email
  const parts = source.split(/[\s@.]+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
}

export default function PortalPage() {
  const navigate = useNavigate()
  const [profile, setProfile] = useState<PortalProfile | null>(null)
  const [projects, setProjects] = useState<PortalProject[]>([])
  const [projectsLoading, setProjectsLoading] = useState(true)
  const [projectsError, setProjectsError] = useState<string | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [showRequestModal, setShowRequestModal] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cancelled = false
    getProfile()
      .then((p) => {
        if (!cancelled) setProfile(p)
      })
      .catch(() => {
        // Si falla (perfil aún no listo, red, etc.) simplemente no mostramos
        // el chip de usuario; no bloquea el uso del portal.
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    getProjects()
      .then((list) => {
        if (!cancelled) setProjects(list)
      })
      .catch((err) => {
        if (!cancelled) {
          setProjectsError(err instanceof Error ? err.message : 'No se pudieron cargar los proyectos')
        }
      })
      .finally(() => {
        if (!cancelled) setProjectsLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    if (!menuOpen) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setMenuOpen(false)
    }
    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [menuOpen])

  const handleLogout = () => {
    clearPortalSession()
    navigate('/login', { replace: true })
  }

  return (
    <div className="portal-page">
      <div className="portal-container">
        <header className="portal-header">
          <div className="portal-brand">
            <span className="portal-brand-icon">
              <LayoutGrid size={20} />
            </span>
            <div>
              <strong>Mis Proyectos</strong>
              <span>Selecciona un proyecto para entrar a su panel</span>
            </div>
          </div>

          <div className="portal-header-actions">
            {profile && (
              <div className="portal-user-menu" ref={menuRef}>
                <button
                  type="button"
                  className="portal-user-chip"
                  title={profile.email}
                  aria-expanded={menuOpen}
                  aria-haspopup="menu"
                  onClick={() => setMenuOpen((open) => !open)}
                >
                  <span className="portal-user-avatar">{initialsFrom(profile)}</span>
                  <div className="portal-user-meta">
                    <strong>{profile.full_name || profile.email}</strong>
                    {profile.role && <span>{profile.role === 'admin' ? 'Administrador' : profile.role}</span>}
                  </div>
                  <span className="portal-user-chip-caret">
                    <ChevronDown size={14} />
                  </span>
                </button>

                {menuOpen && (
                  <div className="portal-user-dropdown" role="menu">
                    <div className="portal-user-dropdown-header">
                      <strong>{profile.full_name || 'Sin nombre'}</strong>
                      <span>{profile.email}</span>
                    </div>
                    <button type="button" className="portal-logout-btn" onClick={handleLogout} role="menuitem">
                      <LogOut size={15} />
                      Cerrar sesión
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </header>

        <div className="portal-grid">
          {projectsLoading ? (
            <>
              {[0, 1, 2].map((i) => (
                <div className="portal-card-skeleton" key={i}>
                  <div className="portal-skeleton-line" style={{ width: 40, height: 40, borderRadius: 12 }} />
                  <div className="portal-skeleton-line" style={{ width: '60%', height: 16, marginTop: 22 }} />
                  <div className="portal-skeleton-line" style={{ width: '90%', height: 12, marginTop: 10 }} />
                  <div className="portal-skeleton-line" style={{ width: '75%', height: 12, marginTop: 6 }} />
                </div>
              ))}
            </>
          ) : projectsError ? (
            <div className="portal-empty-state">
              <p>No se pudieron cargar tus proyectos.</p>
              <span>{projectsError}</span>
            </div>
          ) : projects.length === 0 ? (
            <div className="portal-empty-state">
              <p>Todavía no tienes proyectos asignados.</p>
              <span>Usa el botón "Crear nuevo proyecto" para solicitar uno.</span>
            </div>
          ) : (
            projects.map((p) => (
              <ProjectCard
                key={p.id}
                name={p.name}
                description={p.description}
                tag={p.tag}
                accent={p.accent}
                icon={<Database size={22} />}
                onClick={() => navigate(p.path)}
              />
            ))
          )}

          <button
            className="portal-card portal-card--add"
            type="button"
            onClick={() => setShowRequestModal(true)}
          >
            <span className="portal-card-add-icon">
              <Plus size={20} />
            </span>
            <span>Crear nuevo proyecto</span>
          </button>
        </div>
      </div>

      {showRequestModal && (
        <ProjectRequestModal defaultEmail={profile?.email} onClose={() => setShowRequestModal(false)} />
      )}
    </div>
  )
}