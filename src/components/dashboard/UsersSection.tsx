import { useEffect, useState } from 'react'
import { Database, Loader2, Trash2, UserPlus, Users } from 'lucide-react'
import {
    createAnalyst,
    deleteAnalyst,
    listAnalysts,
    listAnalystDatasetAccess,
    updateAnalystDatasetAccess,
    updateAnalystPermissions,
    type Analyst,
    type AnalystDatasetAccess,
    type AnalystPermissions,
} from '../../lib/api'

const PERMISSION_LABELS: { key: keyof AnalystPermissions; label: string }[] = [
    { key: 'ventas', label: 'Ventas (acceso general)' },
    { key: 'ventas_resumen', label: 'Ventas · Resumen' },
    { key: 'ventas_clientes', label: 'Ventas · Clientes' },
    { key: 'ventas_comparacion', label: 'Ventas · Comparación' },
    { key: 'cargar', label: 'Cargar datos' },
    { key: 'explorar', label: 'Limpieza de datos' },
    { key: 'reportes', label: 'Reportes' },
]

export default function UsersSection() {
    const [analysts, setAnalysts] = useState<Analyst[]>([])
    const [loading, setLoading] = useState(true)
    const [showForm, setShowForm] = useState(false)
    const [form, setForm] = useState({ fullName: '', email: '', password: '' })
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const load = () => {
        setLoading(true)
        listAnalysts()
            .then(setAnalysts)
            .catch(() => setError('No se pudo cargar la lista de analistas.'))
            .finally(() => setLoading(false))
    }

    useEffect(load, [])

    const handleCreate = async (event: React.FormEvent) => {
        event.preventDefault()
        setCreating(true)
        setError(null)
        try {
            await createAnalyst(form)
            setForm({ fullName: '', email: '', password: '' })
            setShowForm(false)
            load()
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta')
        } finally {
            setCreating(false)
        }
    }

    const handleTogglePermission = async (analyst: Analyst, key: keyof AnalystPermissions) => {
        const nextPermissions = { ...analyst.permissions, [key]: !analyst.permissions[key] }
        setAnalysts((prev) => prev.map((a) => (a.id === analyst.id ? { ...a, permissions: nextPermissions } : a)))
        setError(null)
        try {
            await updateAnalystPermissions(analyst.id, nextPermissions)
        } catch (err) {
            // si falla, revertimos al valor anterior y mostramos por qué
            setAnalysts((prev) => prev.map((a) => (a.id === analyst.id ? analyst : a)))
            setError(err instanceof Error ? err.message : 'No se pudo guardar el permiso')
        }
    }

    const handleDelete = async (analyst: Analyst) => {
        if (!confirm(`¿Eliminar la cuenta de ${analyst.full_name ?? analyst.email}? Esta acción no se puede deshacer.`)) return
        try {
            await deleteAnalyst(analyst.id)
            setAnalysts((prev) => prev.filter((a) => a.id !== analyst.id))
        } catch {
            setError('No se pudo eliminar la cuenta.')
        }
    }

    return (
        <section className="panel-card settings-section">
            <div className="settings-section-heading">
                <div>
                    <div className="panel-title">Usuarios</div>
                    <div className="panel-subtitle">Crea cuentas de analista y controla a qué secciones puede acceder cada una.</div>
                </div>
                <Users size={19} className="settings-heading-icon" />
            </div>

            {error && <div className="form-alert error">{error}</div>}

            {loading ? (
                <div className="settings-row-hint"><Loader2 size={15} className="spin" /> Cargando analistas…</div>
            ) : analysts.length === 0 && !showForm ? (
                <div className="settings-row-hint">Todavía no has creado ninguna cuenta de analista.</div>
            ) : (
                <div className="users-list">
                    {analysts.map((analyst) => (
                        <div key={analyst.id} className="users-list-item">
                            <div className="users-list-item-header">
                                <div>
                                    <strong>{analyst.full_name || 'Sin nombre'}</strong>
                                    <span className="settings-row-hint">{analyst.email}</span>
                                </div>
                                <button type="button" className="link-btn" onClick={() => handleDelete(analyst)} aria-label="Eliminar analista">
                                    <Trash2 size={15} />
                                </button>
                            </div>
                            <div className="users-permissions-grid">
                                {PERMISSION_LABELS.map(({ key, label }) => (
                                    <div key={key} className="users-permission-toggle">
                                        <button
                                            type="button"
                                            className={`toggle ${analyst.permissions[key] ? 'on' : ''}`}
                                            onClick={() => handleTogglePermission(analyst, key)}
                                            aria-pressed={analyst.permissions[key]}
                                            aria-label={label}
                                        >
                                            <span className="toggle-knob" />
                                        </button>
                                        <span>{label}</span>
                                    </div>
                                ))}
                            </div>
                            <AnalystDatasetsPicker analystId={analyst.id} />
                        </div>
                    ))}
                </div>
            )}

            {showForm ? (
                <form className="settings-form-grid" style={{ marginTop: 16 }} onSubmit={handleCreate}>
                    <label className="settings-input">
                        <span>Nombre completo</span>
                        <input value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} required />
                    </label>
                    <label className="settings-input">
                        <span>Correo electrónico</span>
                        <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
                    </label>
                    <label className="settings-input">
                        <span>Contraseña temporal</span>
                        <input type="password" minLength={8} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                    </label>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'end' }}>
                        <button type="submit" className="btn btn-primary" disabled={creating}>
                            {creating ? 'Creando…' : 'Crear analista'}
                        </button>
                        <button type="button" className="btn btn-outline" onClick={() => setShowForm(false)}>Cancelar</button>
                    </div>
                </form>
            ) : (
                <button type="button" className="btn btn-outline" style={{ marginTop: 16 }} onClick={() => setShowForm(true)}>
                    <UserPlus size={15} /> Crear analista
                </button>
            )}
        </section>
    )
}

function AnalystDatasetsPicker({ analystId }: { analystId: string }) {
    const [open, setOpen] = useState(false)
    const [datasets, setDatasets] = useState<AnalystDatasetAccess[] | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const handleOpen = () => {
        setOpen((v) => !v)
        if (!datasets) {
            setLoading(true)
            listAnalystDatasetAccess(analystId)
                .then(setDatasets)
                .catch(() => setError('No se pudo cargar la lista de datasets.'))
                .finally(() => setLoading(false))
        }
    }

    const handleToggle = async (datasetId: string) => {
        if (!datasets) return
        const next = datasets.map((d) => (d.id === datasetId ? { ...d, allowed: !d.allowed } : d))
        setDatasets(next)
        setError(null)
        try {
            await updateAnalystDatasetAccess(analystId, next.filter((d) => d.allowed).map((d) => d.id))
        } catch (err) {
            setDatasets(datasets)
            setError(err instanceof Error ? err.message : 'No se pudo guardar el acceso al dataset')
        }
    }

    const allowedCount = datasets?.filter((d) => d.allowed).length ?? 0

    return (
        <div className="users-datasets-picker">
            <button type="button" className="link-btn" onClick={handleOpen}>
                <Database size={13} /> Datasets visibles {datasets ? `(${allowedCount}/${datasets.length})` : ''}
            </button>
            {open && (
                <div className="users-datasets-list">
                    {loading && <div className="settings-row-hint"><Loader2 size={13} className="spin" /> Cargando…</div>}
                    {error && <div className="form-alert error">{error}</div>}
                    {!loading && datasets?.length === 0 && (
                        <div className="settings-row-hint">Todavía no has subido ningún dataset.</div>
                    )}
                    {!loading &&
                        datasets?.map((d) => (
                            <label key={d.id} className="users-dataset-checkbox">
                                <input type="checkbox" checked={d.allowed} onChange={() => handleToggle(d.id)} />
                                {d.file_name}
                            </label>
                        ))}
                </div>
            )}
        </div>
    )
}