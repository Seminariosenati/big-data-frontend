import { useEffect, useRef, useState } from 'react'
import {
  Bell,
  Camera,
  Check,
  LockKeyhole,
  Mail,
  Moon,
  Phone,
  ShieldCheck,
  Sun,
  UserRound,
} from 'lucide-react'
import { getMyProfile, updateMyProfile } from '../lib/api'

interface SettingsPageProps {
  isLight: boolean
  onToggleTheme: () => void
  totalRows: number
  totalFiles: number
}

export default function SettingsPage({ isLight, onToggleTheme, totalRows, totalFiles }: SettingsPageProps) {
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [avatar, setAvatar] = useState<string | null>(null)
  const [emailAlerts, setEmailAlerts] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [loading, setLoading] = useState(true)
  const [passwords, setPasswords] = useState({ current: '', next: '', confirm: '' })
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const avatarInput = useRef<HTMLInputElement>(null)

  useEffect(() => {
    getMyProfile()
      .then((profile) => {
        const [first, ...rest] = (profile.full_name ?? '').split(' ')
        setFirstName(first ?? '')
        setLastName(rest.join(' '))
        setEmail(profile.email ?? '')
        setPhone(profile.phone ?? '')
        setRole(profile.role ?? '')
      })
      .catch(() => { })
      .finally(() => setLoading(false))
  }, [])

  const initials = (firstName[0] ?? '') + (lastName[0] ?? '') || '—'

  const handleAvatarChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => setAvatar(String(reader.result))
    reader.readAsDataURL(file)
  }

  const handleSave = async (event: React.FormEvent) => {
    event.preventDefault()
    setSaving(true)
    try {
      await updateMyProfile({ full_name: `${firstName} ${lastName}`.trim(), phone, role })
      setSaved(true)
      window.setTimeout(() => setSaved(false), 2400)
    } catch {
      // si falla, simplemente no se muestra la confirmación
    } finally {
      setSaving(false)
    }
  }

  const handlePasswordChange = (event: React.FormEvent) => {
    event.preventDefault()
    setPasswordMessage(passwords.next === passwords.confirm ? 'Contraseña lista para actualizar.' : 'Las contraseñas no coinciden.')
    if (passwords.next === passwords.confirm) setPasswords({ current: '', next: '', confirm: '' })
  }

  return (
    <form className="settings-page" onSubmit={handleSave}>
      <div className="settings-layout">
        <div className="settings-main-column">
          <section className="panel-card settings-section">
            <div className="settings-section-heading">
              <div>
                <div className="panel-title">Información personal</div>
                <div className="panel-subtitle">Mantén actualizados tus datos de contacto y perfil.</div>
              </div>
              <UserRound size={19} className="settings-heading-icon" />
            </div>

            <div className="profile-editor">
              <div className="avatar-editor">
                {avatar ? <img src={avatar} alt="Avatar de usuario" /> : <span>{initials.toUpperCase()}</span>}
                <button type="button" className="avatar-edit" onClick={() => avatarInput.current?.click()} aria-label="Cambiar foto de perfil">
                  <Camera size={14} />
                </button>
                <input ref={avatarInput} type="file" accept="image/*" onChange={handleAvatarChange} hidden />
              </div>
              <div>
                <strong>{loading ? 'Cargando…' : `${firstName} ${lastName}`.trim() || 'Sin nombre'}</strong>
                <p>JPG o PNG, hasta 5 MB</p>
                <button type="button" className="link-btn" onClick={() => avatarInput.current?.click()}>Cambiar foto</button>
              </div>
            </div>

            <div className="settings-form-grid">
              <label className="settings-input"><span>Nombre</span><input value={firstName} onChange={(event) => setFirstName(event.target.value)} disabled={loading} /></label>
              <label className="settings-input"><span>Apellidos</span><input value={lastName} onChange={(event) => setLastName(event.target.value)} disabled={loading} /></label>
              <label className="settings-input settings-input-wide"><span>Correo electrónico</span><div className="settings-input-icon"><Mail size={15} /><input type="email" value={email} disabled readOnly /></div></label>
              <label className="settings-input"><span>Teléfono</span><div className="settings-input-icon"><Phone size={15} /><input value={phone} onChange={(event) => setPhone(event.target.value)} disabled={loading} /></div></label>
              <label className="settings-input"><span>Rol / Cargo</span><input value={role} onChange={(event) => setRole(event.target.value)} disabled={loading} /></label>
            </div>
          </section>

          <section className="panel-card settings-section">
            <div className="settings-section-heading">
              <div>
                <div className="panel-title">Seguridad y cuenta</div>
                <div className="panel-subtitle">Protege el acceso a tu espacio de trabajo.</div>
              </div>
              <LockKeyhole size={19} className="settings-heading-icon" />
            </div>
            <div className="security-status"><ShieldCheck size={17} /><div><strong>Verificación en dos pasos activa</strong><span>Tu cuenta requiere OTP al iniciar sesión.</span></div><span className="status-badge success">Activa</span></div>
            <div className="settings-subheading">Cambiar contraseña</div>
            <div className="settings-form-grid password-grid">
              <label className="settings-input"><span>Contraseña actual</span><input type="password" value={passwords.current} onChange={(event) => setPasswords({ ...passwords, current: event.target.value })} /></label>
              <label className="settings-input"><span>Nueva contraseña</span><input type="password" value={passwords.next} onChange={(event) => setPasswords({ ...passwords, next: event.target.value })} /></label>
              <label className="settings-input"><span>Confirmar contraseña</span><input type="password" value={passwords.confirm} onChange={(event) => setPasswords({ ...passwords, confirm: event.target.value })} /></label>
            </div>
            {passwordMessage && <div className={`form-alert ${passwordMessage.includes('coinciden') ? 'error' : ''}`}>{passwordMessage}</div>}
            <button type="button" className="btn btn-outline" onClick={handlePasswordChange}>Actualizar contraseña</button>
          </section>

          <section className="panel-card settings-section">
            <div className="settings-section-heading"><div><div className="panel-title">Preferencias de la aplicación</div><div className="panel-subtitle">Personaliza cómo quieres trabajar en Datalume.</div></div><Bell size={19} className="settings-heading-icon" /></div>
            <div className="settings-row"><div><div className="settings-row-label">Tema de la aplicación</div><div className="settings-row-hint">{isLight ? 'Modo claro activo' : 'Modo oscuro activo'}</div></div><button type="button" className="settings-preference-control" onClick={onToggleTheme}><span>{isLight ? <Sun size={15} /> : <Moon size={15} />}</span>{isLight ? 'Claro' : 'Oscuro'}</button></div>
            <div className="settings-row"><div><div className="settings-row-label">Alertas por correo</div><div className="settings-row-hint">Recibe un aviso al finalizar la limpieza de datos.</div></div><button type="button" className={`toggle ${emailAlerts ? 'on' : ''}`} onClick={() => setEmailAlerts((value) => !value)} aria-label="Activar alertas por correo"><span className="toggle-knob" /></button></div>
          </section>
        </div>

        <aside className="settings-side-column">
          <section className="panel-card plan-card"><div className="plan-card-top"><span className="plan-icon"><DatabaseIcon /></span><span className="status-badge">Demo</span></div><div className="plan-label">Plan actual</div><h3>Free / Demo</h3><p>Explora las herramientas esenciales de Datalume.</p><div className="usage-item"><div><span>Registros procesados</span><strong>{totalRows.toLocaleString('es-PE')}</strong></div><div className="usage-track"><span style={{ width: `${Math.min(totalRows / 1000, 100)}%` }} /></div></div><div className="usage-item"><div><span>Archivos cargados</span><strong>{totalFiles} / 10</strong></div><div className="usage-track"><span style={{ width: `${Math.min(totalFiles * 10, 100)}%` }} /></div></div></section>
          <section className="panel-card account-note"><Check size={18} /><div><strong>Cuenta protegida</strong><p>Tu sesión y preferencias están guardadas en este dispositivo.</p></div></section>
        </aside>
      </div>
      <div className="settings-actions">{saved && <span className="save-feedback"><Check size={15} /> Cambios guardados</span>}<button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Guardando…' : 'Guardar cambios'}</button></div>
    </form>
  )
}

function DatabaseIcon() {
  return <span className="plan-database-mark">D</span>
}