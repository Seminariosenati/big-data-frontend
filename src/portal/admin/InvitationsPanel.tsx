import { useEffect, useState } from 'react'
import { Send, Trash2 } from 'lucide-react'
import {
    createAdminInvitation,
    getAdminInvitations,
    revokeAdminInvitation,
    type AdminInvitation,
    type PortalProject,
} from '../../lib/portalApi'

export default function InvitationsPanel({ projects }: { projects: PortalProject[] }) {
    const [invitations, setInvitations] = useState<AdminInvitation[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

    const [email, setEmail] = useState('')
    const [selectedProjects, setSelectedProjects] = useState<string[]>([])
    const [sending, setSending] = useState(false)

    const load = () => {
        setLoading(true)
        getAdminInvitations()
            .then(setInvitations)
            .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar las invitaciones'))
            .finally(() => setLoading(false))
    }

    useEffect(load, [])

    const toggleProject = (id: string) => {
        setSelectedProjects((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (selectedProjects.length === 0) {
            setError('Selecciona al menos un proyecto')
            return
        }
        setSending(true)
        setError(null)
        try {
            await createAdminInvitation({ email: email.trim(), project_ids: selectedProjects })
            setEmail('')
            setSelectedProjects([])
            load()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo enviar la invitación')
        } finally {
            setSending(false)
        }
    }

    const handleRevoke = async (id: string) => {
        try {
            await revokeAdminInvitation(id)
            load()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo revocar la invitación')
        }
    }

    return (
        <div className="admin-invitations">
            <form className="admin-invite-form" onSubmit={handleSubmit}>
                <input
                    type="email"
                    required
                    placeholder="correo@empresa.com"
                    className="portal-input"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <div className="admin-project-chips">
                    {projects.map((p) => (
                        <button
                            type="button"
                            key={p.id}
                            className={`admin-chip ${selectedProjects.includes(p.id) ? 'admin-chip--active' : ''}`}
                            onClick={() => toggleProject(p.id)}
                        >
                            {p.name}
                        </button>
                    ))}
                </div>
                <button type="submit" className="portal-btn portal-btn--primary" disabled={sending}>
                    {sending && <span className="portal-spinner" aria-hidden="true" />}
                    <Send size={15} />
                    {sending ? 'Enviando…' : 'Invitar'}
                </button>
            </form>

            {error && <div className="portal-alert portal-alert--error">{error}</div>}

            {loading ? (
                <p>Cargando invitaciones…</p>
            ) : (
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Correo</th>
                            <th>Proyecto</th>
                            <th>Estado</th>
                            <th></th>
                        </tr>
                    </thead>
                    <tbody>
                        {invitations.map((inv) => (
                            <tr key={inv.id}>
                                <td>{inv.email}</td>
                                <td>{inv.projects?.name || '—'}</td>
                                <td>{inv.used ? 'Usada' : new Date(inv.expires_at) < new Date() ? 'Expirada' : 'Pendiente'}</td>
                                <td>
                                    {!inv.used && (
                                        <button type="button" className="admin-icon-btn" onClick={() => handleRevoke(inv.id)}>
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    )
}