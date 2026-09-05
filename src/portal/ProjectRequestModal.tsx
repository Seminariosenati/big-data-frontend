import { useState } from 'react'
import { X } from 'lucide-react'
import { requestNewProject } from '../lib/portalApi'

interface ProjectRequestModalProps {
    defaultEmail?: string
    onClose: () => void
}

export default function ProjectRequestModal({ defaultEmail, onClose }: ProjectRequestModalProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [email, setEmail] = useState(defaultEmail || '')
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [done, setDone] = useState(false)

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setLoading(true)
        try {
            await requestNewProject({
                name: name.trim(),
                description: description.trim(),
                contact_email: email.trim(),
            })
            setDone(true)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud')
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="portal-modal-overlay" onMouseDown={onClose}>
            <div className="portal-modal" onMouseDown={(e) => e.stopPropagation()}>
                <button type="button" className="portal-modal-close" onClick={onClose} aria-label="Cerrar">
                    <X size={18} />
                </button>

                {done ? (
                    <div className="portal-modal-success">
                        <h2>¡Listo!</h2>
                        <p>
                            Registramos tu solicitud. El administrador la va a revisar y te contactará a{' '}
                            <strong>{email}</strong> cuando el proyecto esté disponible.
                        </p>
                        <button type="button" className="portal-btn portal-btn--primary" onClick={onClose}>
                            Cerrar
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit}>
                        <h2 className="portal-modal-title">Crear nuevo proyecto</h2>
                        <p className="portal-modal-subtitle">
                            Cuéntanos qué proyecto necesitas. Esto no lo crea automáticamente: queda registrado
                            para que el administrador lo revise y lo agregue al portal.
                        </p>

                        {error && <div className="portal-alert portal-alert--error">{error}</div>}

                        <label className="portal-field-label" htmlFor="pr-name">
                            Nombre del proyecto
                        </label>
                        <div className="portal-input-wrap">
                            <input
                                id="pr-name"
                                type="text"
                                required
                                className="portal-input"
                                style={{ paddingLeft: 12 }}
                                placeholder="Ej: Panel de inventario"
                                value={name}
                                onChange={(e) => setName(e.target.value)}
                                autoFocus
                            />
                        </div>

                        <label className="portal-field-label" htmlFor="pr-description">
                            Descripción (opcional)
                        </label>
                        <div className="portal-input-wrap">
                            <textarea
                                id="pr-description"
                                className="portal-input portal-textarea"
                                placeholder="¿Qué debería hacer este proyecto?"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                rows={3}
                            />
                        </div>

                        <label className="portal-field-label" htmlFor="pr-email">
                            Correo de contacto
                        </label>
                        <div className="portal-input-wrap">
                            <input
                                id="pr-email"
                                type="email"
                                required
                                className="portal-input"
                                style={{ paddingLeft: 12 }}
                                placeholder="tucorreo@empresa.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                            />
                        </div>

                        <button type="submit" className="portal-btn portal-btn--primary" disabled={loading}>
                            {loading && <span className="portal-spinner" aria-hidden="true" />}
                            {loading ? 'Enviando…' : 'Enviar solicitud'}
                        </button>
                    </form>
                )}
            </div>
        </div>
    )
}