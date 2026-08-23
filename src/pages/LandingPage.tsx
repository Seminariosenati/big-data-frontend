import { Link } from 'react-router-dom'
import { UploadCloud, Sparkles, BarChart3, ShieldCheck } from 'lucide-react'

const STEPS = [
  {
    number: '01',
    title: 'Sube tus archivos',
    description: 'Arrastra tus CSV o Excel desde cualquier fuente. Sin límites de formato ni de estructura.',
  },
  {
    number: '02',
    title: 'Limpia y organiza',
    description: 'Detecta duplicados, nulos e inconsistencias antes de que lleguen a tus reportes.',
  },
  {
    number: '03',
    title: 'Visualiza y comparte',
    description: 'Convierte tablas dispersas en paneles claros que tu equipo puede entender al instante.',
  },
]

const FEATURES = [
  {
    icon: UploadCloud,
    tone: 'amber',
    title: 'Carga sin fricción',
    description: 'Sube archivos grandes y monitorea el progreso en tiempo real desde tu panel.',
  },
  {
    icon: Sparkles,
    tone: 'blue',
    title: 'Limpieza asistida',
    description: 'Identifica valores nulos, duplicados y formatos inconsistentes en segundos.',
  },
  {
    icon: BarChart3,
    tone: 'green',
    title: 'Visualización clara',
    description: 'Gráficos y tablas pensados para decisiones rápidas, no solo para ver números.',
  },
  {
    icon: ShieldCheck,
    tone: 'coral',
    title: 'Acceso protegido',
    description: 'Cuentas individuales por equipo, con inicio de sesión y creación de cuenta separados.',
  },
]

export default function LandingPage() {
  return (
    <div>
      <section className="hero">
        <div className="hero-glow" />
        <div className="container hero-grid">
          <div>
            <span className="eyebrow">Plataforma de datos</span>
            <h1 className="hero-title">
              Convierte archivos dispersos en <span className="text-accent">decisiones claras</span>
            </h1>
            <p className="hero-subtitle">
              Datalume centraliza la carga, limpieza y visualización de tus datos
              en un solo panel, para que tu equipo deje de perseguir hojas de
              cálculo sueltas.
            </p>
            <div className="hero-cta-row">
              <Link to="/login?modo=crear" className="btn btn-primary btn-lg">
                Crear cuenta gratis
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">
                Iniciar sesión
              </Link>
            </div>
            <div className="hero-meta">
              <span><strong>128k+</strong> registros procesados en la demo</span>
              <span><strong>94%</strong> de calidad promedio</span>
            </div>
          </div>

          <div className="readout">
            <div className="readout-topbar">
              <div className="readout-dots"><span /><span /><span /></div>
              <span className="readout-label">RESUMEN · VISTA PREVIA</span>
            </div>
            <div className="readout-rows">
              <div className="readout-row">
                <span>Archivos procesados hoy</span>
                <strong>46</strong>
              </div>
              <div className="readout-row">
                <span>Datos con errores</span>
                <span className="down">-3.1%</span>
              </div>
              <div className="readout-row">
                <span>Reportes generados</span>
                <span className="up">+2 esta semana</span>
              </div>
            </div>
            <div className="readout-bars">
              <span style={{ height: '40%' }} />
              <span style={{ height: '55%' }} />
              <span style={{ height: '48%' }} />
              <span style={{ height: '70%' }} />
              <span style={{ height: '62%' }} />
              <span style={{ height: '85%' }} />
              <span style={{ height: '78%' }} />
            </div>
          </div>
        </div>
      </section>

      <section className="steps-section container">
        <div className="section-heading">
          <span className="eyebrow">Cómo funciona</span>
          <h2>De archivo crudo a panel entendible en tres pasos</h2>
          <p>Pensado para equipos que reciben datos de varias fuentes y necesitan una sola versión confiable de la verdad.</p>
        </div>
        <div className="steps-row">
          {STEPS.map((step) => (
            <div className="step-card" key={step.number}>
              <div className="step-number">{step.number}</div>
              <h3>{step.title}</h3>
              <p>{step.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="features-section container">
        <div className="section-heading">
          <span className="eyebrow">Qué incluye</span>
          <h2>Todo lo que necesitas para trabajar con datos en equipo</h2>
        </div>
        <div className="feature-grid">
          {FEATURES.map((feature) => (
            <div className="feature-card" key={feature.title}>
              <span className={`feature-icon tone-${feature.tone}`}>
                <feature.icon size={18} strokeWidth={2.1} />
              </span>
              <h3>{feature.title}</h3>
              <p>{feature.description}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="cta-band">
        <div>
          <h2>¿Listo para ordenar tus datos?</h2>
          <p>Crea tu cuenta y explora el panel de ejemplo con datos de demostración.</p>
        </div>
        <Link to="/login?modo=crear" className="btn btn-primary btn-lg">
          Crear cuenta gratis
        </Link>
      </section>
    </div>
  )
}
