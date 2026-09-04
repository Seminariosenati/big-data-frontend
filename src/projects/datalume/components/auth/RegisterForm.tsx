import { useState } from 'react'
import { User, Mail, Building2, Lock, Eye, EyeOff } from 'lucide-react'
import { registerUser } from '../../lib/api'

interface RegisterFormProps {
  onSuccess?: () => void
}

export default function RegisterForm({ onSuccess }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false)
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)

    if (password !== confirmPassword) {
      setError('Las contraseñas no coinciden')
      return
    }

    setLoading(true)
    try {
      await registerUser({ fullName, email, company: company || undefined, password })
      setSuccess('Cuenta creada. Ya puedes iniciar sesión.')
      onSuccess?.()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo crear la cuenta')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <h2 className="auth-card-title">Crea tu cuenta</h2>
      <p className="auth-card-subtitle">
        Regístrate para empezar a cargar y visualizar tus datos.
      </p>

      {error && <div className="form-alert error">{error}</div>}
      {success && !error && <div className="form-alert">{success}</div>}

      <div className="field">
        <label className="field-label" htmlFor="reg-name">Nombre completo</label>
        <div className="input-wrap">
          <User size={16} className="field-icon" />
          <input
            id="reg-name"
            type="text"
            required
            className="input-field"
            placeholder="María Cruz"
            autoComplete="name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="reg-email">Correo electrónico</label>
        <div className="input-wrap">
          <Mail size={16} className="field-icon" />
          <input
            id="reg-email"
            type="email"
            required
            className="input-field"
            placeholder="tucorreo@empresa.com"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="reg-company">Empresa (opcional)</label>
        <div className="input-wrap">
          <Building2 size={16} className="field-icon" />
          <input
            id="reg-company"
            type="text"
            className="input-field"
            placeholder="Nombre de tu empresa"
            autoComplete="organization"
            value={company}
            onChange={(e) => setCompany(e.target.value)}
          />
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="reg-password">Contraseña</label>
        <div className="input-wrap">
          <Lock size={16} className="field-icon" />
          <input
            id="reg-password"
            type={showPassword ? 'text' : 'password'}
            required
            minLength={8}
            className="input-field"
            placeholder="Mínimo 8 caracteres"
            autoComplete="new-password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button
            type="button"
            className="field-toggle"
            onClick={() => setShowPassword((v) => !v)}
            aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
      </div>

      <div className="field">
        <label className="field-label" htmlFor="reg-password-confirm">Confirmar contraseña</label>
        <div className="input-wrap">
          <Lock size={16} className="field-icon" />
          <input
            id="reg-password-confirm"
            type={showPassword ? 'text' : 'password'}
            required
            className="input-field"
            placeholder="Repite tu contraseña"
            autoComplete="new-password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </div>
      </div>

      <label className="terms-row">
        <input type="checkbox" required />
        Acepto los términos de uso y la política de privacidad de Datalume.
      </label>

      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? 'Creando cuenta…' : 'Crear cuenta'}
      </button>
    </form>
  )
}