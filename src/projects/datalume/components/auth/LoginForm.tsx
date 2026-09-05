import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, Eye, EyeOff, ShieldCheck } from 'lucide-react'
import { loginUser, verifyOtp, resendOtp, saveSession } from '../../lib/api'

type Step = 'credenciales' | 'otp'

export default function LoginForm() {
  const [step, setStep] = useState<Step>('credenciales')
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const navigate = useNavigate()

  const handleCredentialsSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      await loginUser({ email, password })
      setStep('otp')
      setInfo(`Enviamos un código de verificación a ${email}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo iniciar sesión')
    } finally {
      setLoading(false)
    }
  }

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { session } = await verifyOtp({ email, code })
      saveSession(session)
      navigate('../dashboard')
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
      await resendOtp({ email })
      setInfo('Reenviamos el código a tu correo')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo reenviar el código')
    }
  }

  if (step === 'otp') {
    return (
      <form onSubmit={handleOtpSubmit}>
        <h2 className="auth-card-title">Verifica tu identidad</h2>
        <p className="auth-card-subtitle">
          Ingresa el código de 6 dígitos que enviamos a <strong>{email}</strong>.
        </p>

        {error && <div className="form-alert error">{error}</div>}
        {info && !error && <div className="form-alert">{info}</div>}

        <div className="field">
          <label className="field-label" htmlFor="otp-code">Código de verificación</label>
          <div className="input-wrap">
            <ShieldCheck size={16} className="field-icon" />
            <input
              id="otp-code"
              type="text"
              inputMode="numeric"
              maxLength={6}
              required
              className="input-field"
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
          </div>
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
          {loading ? 'Verificando…' : 'Verificar código'}
        </button>

        <div className="field-row" style={{ marginTop: 12 }}>
          <button type="button" className="link-btn" onClick={handleResend}>
            Reenviar código
          </button>
          <button type="button" className="link-btn" onClick={() => setStep('credenciales')}>
            Cambiar correo
          </button>
        </div>
      </form>
    )
  }

  return (
    <form onSubmit={handleCredentialsSubmit}>
      <h2 className="auth-card-title">Bienvenido de nuevo</h2>
      <p className="auth-card-subtitle">
        Ingresa tus credenciales para acceder a tu panel de datos.
      </p>

      {error && <div className="form-alert error">{error}</div>}

      <div className="field">
        <label className="field-label" htmlFor="login-email">Correo electrónico</label>
        <div className="input-wrap">
          <Mail size={16} className="field-icon" />
          <input
            id="login-email"
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
        <label className="field-label" htmlFor="login-password">Contraseña</label>
        <div className="input-wrap">
          <Lock size={16} className="field-icon" />
          <input
            id="login-password"
            type={showPassword ? 'text' : 'password'}
            required
            className="input-field"
            placeholder="••••••••"
            autoComplete="current-password"
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

      <div className="field-row">
        <label className="checkbox-row">
          <input type="checkbox" defaultChecked />
          Recordarme
        </label>
        <button type="button" className="link-btn">¿Olvidaste tu contraseña?</button>
      </div>

      <button type="submit" className="btn btn-primary btn-block" disabled={loading}>
        {loading ? 'Verificando…' : 'Iniciar sesión'}
      </button>
    </form>
  )
}