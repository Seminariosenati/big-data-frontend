import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, ShieldCheck, LayoutGrid, Database, Sparkles } from 'lucide-react'
import {
  portalLogin,
  portalVerifyOtp,
  portalResendOtp,
  savePortalSession,
} from '../lib/portalApi'
import './portal.css'

type Step = 'email' | 'otp'

export default function PortalLoginPage() {
  const [step, setStep] = useState<Step>('email')
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setInfo(null)
    setLoading(true)
    try {
      const res = await portalLogin(email.trim())
      if (!res.requiresOtp && res.session) {
        savePortalSession(res.session)
        navigate('/', { replace: true })
        return
      }
      setStep('otp')
      setInfo(
        'Enviamos un código de verificación al administrador. Pídele el código para continuar.',
      )
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo solicitar acceso')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { session } = await portalVerifyOtp(email.trim(), code)
      savePortalSession(session)
      navigate('/', { replace: true })
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Código incorrecto')
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setError(null)
    setInfo(null)
    try {
      await portalResendOtp(email.trim())
      setInfo('Reenviamos el código al administrador')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reenviar el código')
    }
  }

  return (
    <div className="portal-login-page">
      <div className="portal-login-shell">
        <aside className="portal-login-aside">
          <div className="portal-login-aside-brand">
            <span className="portal-brand-icon">
              <LayoutGrid size={22} />
            </span>
            <strong>Portal de proyectos</strong>
          </div>

          <div className="portal-login-aside-copy">
            <h2>Todos tus proyectos, en un solo lugar.</h2>
            <p>
              Accede con tu correo invitado y entra al panel de cada proyecto sin
              cuentas ni contraseñas separadas.
            </p>
          </div>

          <ul className="portal-login-aside-points">
            <li>
              <Database size={16} /> Paneles de datos y analítica por proyecto
            </li>
            <li>
              <ShieldCheck size={16} /> Acceso controlado por invitación
            </li>
            <li>
              <Sparkles size={16} /> Nuevos proyectos se suman al mismo portal
            </li>
          </ul>
        </aside>

        <div className="portal-login-card">
          {step === 'email' ? (
            <form onSubmit={handleEmailSubmit}>
              <h1 className="portal-login-title">Iniciar sesión</h1>
              <p className="portal-login-subtitle">
                Ingresa tu correo. Solo cuentas invitadas pueden acceder. El código de
                verificación llegará al administrador.
              </p>

              {error && <div className="portal-alert portal-alert--error">{error}</div>}

              <label className="portal-field-label" htmlFor="portal-email">
                Correo electrónico
              </label>
              <div className="portal-input-wrap">
                <Mail size={16} className="portal-field-icon" />
                <input
                  id="portal-email"
                  type="email"
                  required
                  className="portal-input"
                  placeholder="tucorreo@empresa.com"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoFocus
                />
              </div>

              <button type="submit" className="portal-btn portal-btn--primary" disabled={loading}>
                {loading && <span className="portal-spinner" aria-hidden="true" />}
                {loading ? 'Verificando…' : 'Continuar'}
              </button>
            </form>
          ) : (
            <form onSubmit={handleOtpSubmit}>
              <h1 className="portal-login-title">Código de verificación</h1>
              <p className="portal-login-subtitle">
                El administrador recibió un código de 6 dígitos para{' '}
                <strong>{email}</strong>. Ingrésalo aquí.
              </p>

              {error && <div className="portal-alert portal-alert--error">{error}</div>}
              {info && !error && <div className="portal-alert">{info}</div>}

              <label className="portal-field-label" htmlFor="portal-otp">
                Código
              </label>
              <div className="portal-input-wrap">
                <ShieldCheck size={16} className="portal-field-icon" />
                <input
                  id="portal-otp"
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  required
                  className="portal-input portal-input--otp"
                  placeholder="123456"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
                  autoFocus
                />
              </div>

              <button type="submit" className="portal-btn portal-btn--primary" disabled={loading}>
                {loading && <span className="portal-spinner" aria-hidden="true" />}
                {loading ? 'Verificando…' : 'Entrar al portal'}
              </button>

              <div className="portal-login-actions">
                <button type="button" className="portal-link" onClick={handleResend}>
                  Reenviar código al admin
                </button>
                <button
                  type="button"
                  className="portal-link"
                  onClick={() => {
                    setStep('email')
                    setCode('')
                    setError(null)
                    setInfo(null)
                  }}
                >
                  Cambiar correo
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}