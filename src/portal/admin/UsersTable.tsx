import { useEffect, useState } from 'react'
import { Settings, Trash2 } from 'lucide-react'
import {
    deleteAdminUser,
    getAdminUsers,
    updateAdminUser,
    type AdminUser,
    type PortalProject,
} from '../../lib/portalApi'
import ProjectAccessModal from './ProjectAccessModal'

export default function UsersTable({ projects }: { projects: PortalProject[] }) {
    const [users, setUsers] = useState<AdminUser[]>([])
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [busyId, setBusyId] = useState<string | null>(null)
    const [editingUser, setEditingUser] = useState<AdminUser | null>(null)

    const load = () => {
        setLoading(true)
        getAdminUsers()
            .then(setUsers)
            .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los usuarios'))
            .finally(() => setLoading(false))
    }

    useEffect(load, [])

    const handleDelete = async (user: AdminUser) => {
        if (!confirm(`¿Eliminar a ${user.email}? Esta acción no se puede deshacer.`)) return
        setBusyId(user.id)
        try {
            await deleteAdminUser(user.id)
            load()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo eliminar el usuario')
        } finally {
            setBusyId(null)
        }
    }

    const handleSaveAccess = async (access: { project_id: string; role: string }[]) => {
        if (!editingUser) return
        setBusyId(editingUser.id)
        try {
            await updateAdminUser(editingUser.id, { project_access: access })
            setEditingUser(null)
            load()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo actualizar el acceso')
        } finally {
            setBusyId(null)
        }
    }

    if (loading) return <div className="portal-empty-state"><p>Cargando usuarios…</p></div>
    if (error) return <div className="portal-alert portal-alert--error">{error}</div>

    return (
        <>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Usuario</th>
                        <th>Rol</th>
                        <th>Proyectos</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody>
                    {users.map((user) => (
                        <tr key={user.id}>
                            <td>
                                <strong>{user.full_name || 'Sin nombre'}</strong>
                                <div className="admin-table-subtext">{user.email}</div>
                            </td>
                            <td>{user.role === 'admin' ? 'Administrador' : 'Analista'}</td>
                            <td>
                                {user.project_access.length === 0
                                    ? '—'
                                    : user.project_access
                                        .map((a) => `${a.project_name} (${a.role === 'admin' ? 'Admin' : 'Analista'})`)
                                        .join(', ')}
                            </td>
                            <td>
                                <div className="admin-row-actions">
                                    <button
                                        type="button"
                                        className="admin-icon-btn"
                                        disabled={busyId === user.id}
                                        onClick={() => setEditingUser(user)}
                                        title="Gestionar proyectos"
                                    >
                                        <Settings size={14} />
                                    </button>
                                    {user.role !== 'admin' && (
                                        <button
                                            type="button"
                                            className="admin-icon-btn admin-icon-btn--danger"
                                            disabled={busyId === user.id}
                                            onClick={() => handleDelete(user)}
                                            title="Eliminar usuario"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    )}
                                </div>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {editingUser && (
                <ProjectAccessModal
                    user={editingUser}
                    projects={projects}
                    onClose={() => setEditingUser(null)}
                    onSave={handleSaveAccess}
                />
            )}
        </>
    )
}