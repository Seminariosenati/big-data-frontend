import { useState } from 'react'
import { X } from 'lucide-react'
import type { AdminUser, PortalProject } from '../../lib/portalApi'

interface Props {
    user: AdminUser
    projects: PortalProject[]
    onClose: () => void
    onSave: (access: { project_id: string; role: string }[]) => void
}

export default function ProjectAccessModal({ user, projects, onClose, onSave }: Props) {
    const initial = Object.fromEntries(user.project_access.map((a) => [a.project_id, a.role]))
    const [access, setAccess] = useState<Record<string, string>>(initial)

    const toggle = (id: string) => {
        setAccess((prev) => {
            const next = { ...prev }
            if (id in next) {
                delete next[id]
            } else {
                next[id] = 'analyst'
            }
            return next
        })
    }

    const setRole = (id: string, role: string) => {
        setAccess((prev) => ({ ...prev, [id]: role }))
    }

    const handleSave = () => {
        onSave(Object.entries(access).map(([project_id, role]) => ({ project_id, role })))
    }

    return (
        <div className="portal-modal-overlay" onMouseDown={onClose}>
            <div className="portal-modal" onMouseDown={(e) => e.stopPropagation()}>
                <button type="button" className="portal-modal-close" onClick={onClose} aria-label="Cerrar">
                    <X size={18} />
                </button>

                <h2 className="portal-modal-title">Proyectos de {user.full_name || user.email}</h2>
                <p className="portal-modal-subtitle">
                    Elige a qué proyectos tiene acceso y con qué rol dentro de cada uno.
                </p>

                <div className="admin-access-list">
                    {projects.map((p) => {
                        const active = p.id in access
                        return (
                            <div key={p.id} className={`admin-access-row ${active ? 'admin-access-row--active' : ''}`}>
                                <button
                                    type="button"
                                    className={`admin-chip ${active ? 'admin-chip--active' : ''}`}
                                    onClick={() => toggle(p.id)}
                                >
                                    {p.name}
                                </button>
                                {active && (
                                    <select
                                        className="portal-input admin-select"
                                        value={access[p.id]}
                                        onChange={(e) => setRole(p.id, e.target.value)}
                                    >
                                        <option value="analyst">Analista</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                )}
                            </div>
                        )
                    })}
                </div>

                <button type="button" className="portal-btn portal-btn--primary" onClick={handleSave}>
                    Guardar
                </button>
            </div>
        </div>
    )
}