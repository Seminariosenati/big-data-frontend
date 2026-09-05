import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft } from 'lucide-react'
import UsersTable from './UsersTable'
import InvitationsPanel from './InvitationsPanel'
import { getProjects, type PortalProject } from '../../lib/portalApi'
import '../portal.css'
import './admin.css'

export default function AdminPage() {
    const navigate = useNavigate()
    const [tab, setTab] = useState<'users' | 'invitations'>('users')
    const [projects, setProjects] = useState<PortalProject[]>([])

    useEffect(() => {
        getProjects().then(setProjects).catch(() => { })
    }, [])

    return (
        <div className="portal-page">
            <div className="portal-container">
                <header className="portal-header">
                    <div className="portal-brand">
                        <button type="button" className="admin-back-btn" onClick={() => navigate('/')}>
                            <ArrowLeft size={18} />
                        </button>
                        <div>
                            <strong>Administración</strong>
                            <span>Usuarios, roles e invitaciones</span>
                        </div>
                    </div>
                </header>

                <div className="admin-tabs">
                    <button
                        type="button"
                        className={`admin-tab ${tab === 'users' ? 'admin-tab--active' : ''}`}
                        onClick={() => setTab('users')}
                    >
                        Usuarios
                    </button>
                    <button
                        type="button"
                        className={`admin-tab ${tab === 'invitations' ? 'admin-tab--active' : ''}`}
                        onClick={() => setTab('invitations')}
                    >
                        Invitaciones
                    </button>
                </div>

                {tab === 'users' ? <UsersTable projects={projects} /> : <InvitationsPanel projects={projects} />}
            </div>
        </div>
    )
}