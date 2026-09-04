import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { ArrowLeft, Database } from 'lucide-react'
import LoginForm from '../components/auth/LoginForm'
import RegisterForm from '../components/auth/RegisterForm'

type AuthMode = 'login' | 'crear'

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const initial = searchParams.get('modo') === 'crear' ? 'crear' : 'login'
  const [mode, setMode] = useState<AuthMode>(initial)

  return (
    <div className="auth-page">
      <aside className="auth-visual">
        <div>
          <Link to="../" className="auth-back-link">
            <ArrowLeft size={14} /> Volver al inicio
          </Link>

          <div className="auth-visual-content">
            <span className="brand" style={{ fontSize: 17 }}>
              <span className="brand-mark">
                <Database size={16} strokeWidth={2.3} />
              </span>
              Datalume
            </span>
            <h1>Un solo panel para cargar, limpiar y entender tus datos</h1>
            <p>
              Diseñado para equipos que reciben archivos de distintas fuentes
              y necesitan una lectura clara y confiable de sus métricas.
            </p>

            <ul className="auth-features">
              <li><span className="auth-feature-icon">✓</span>Carga de archivos CSV y Excel</li>
              <li><span className="auth-feature-icon">✓</span>Detección de valores nulos y duplicados</li>
              <li><span className="auth-feature-icon">✓</span>Gráficos y reportes listos para compartir</li>
            </ul>
          </div>
        </div>

        <div className="readout">
          <div className="readout-topbar">
            <div className="readout-dots"><span /><span /><span /></div>
            <span className="readout-label">RESUMEN · EN VIVO</span>
          </div>
          <div className="readout-rows">
            <div className="readout-row">
              <span>Registros procesados</span>
              <strong>128,942</strong>
            </div>
            <div className="readout-row">
              <span>Calidad promedio</span>
              <strong>94.2%</strong>
            </div>
          </div>
          <div className="readout-bars">
            <span style={{ height: '45%' }} />
            <span style={{ height: '68%' }} />
            <span style={{ height: '52%' }} />
            <span style={{ height: '85%' }} />
            <span style={{ height: '72%' }} />
            <span style={{ height: '90%' }} />
          </div>
        </div>
      </aside>

      <div className="auth-wrapper">
        <div className="auth-card">
          <div className="auth-tabs" role="tablist" aria-label="Modo de acceso">
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'login'}
              className={`auth-tab ${mode === 'login' ? 'active' : ''}`}
              onClick={() => setMode('login')}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={mode === 'crear'}
              className={`auth-tab ${mode === 'crear' ? 'active' : ''}`}
              onClick={() => setMode('crear')}
            >
              Crear cuenta
            </button>
          </div>

          {mode === 'login' ? <LoginForm /> : <RegisterForm onSuccess={() => setMode('login')} />}

          <div className="auth-divider">o</div>

          <p className="auth-switch">
            {mode === 'login' ? (
              <>¿Aún no tienes cuenta?{' '}
                <button type="button" className="link-btn" onClick={() => setMode('crear')}>
                  Crear una cuenta
                </button>
              </>
            ) : (
              <>¿Ya tienes cuenta?{' '}
                <button type="button" className="link-btn" onClick={() => setMode('login')}>
                  Inicia sesión
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  )
}