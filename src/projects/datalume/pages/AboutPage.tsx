export default function AboutPage() {
  return (
    <section className="page">
      <span className="eyebrow page-eyebrow">Nosotros</span>
      <h1>Construimos Datalume para equipos que viven entre hojas de cálculo</h1>
      <p className="page-lead">
        Nacimos de una frustración simple: los datos de una empresa casi
        siempre viven repartidos entre archivos sueltos, formatos distintos y
        versiones desactualizadas. Datalume junta todo eso en un solo lugar,
        con una interfaz pensada para que cualquier persona del equipo pueda
        entender lo que dicen sus datos, no solo el área técnica.
      </p>

      <div className="page-section">
        <h3>Nuestra misión</h3>
        <p>
          Reducir el tiempo que un equipo pasa limpiando y ordenando archivos,
          para que pueda dedicarlo a interpretar resultados y tomar
          decisiones.
        </p>
      </div>

      <div className="page-grid">
        <div className="page-section" style={{ marginBottom: 0 }}>
          <h3>Claridad primero</h3>
          <p>Cada pantalla muestra lo esencial: qué se cargó, qué se limpió y qué significa para el negocio.</p>
        </div>
        <div className="page-section" style={{ marginBottom: 0 }}>
          <h3>Construido con equipos reales</h3>
          <p>El diseño de cada sección viene de observar cómo trabajan equipos de análisis y operaciones día a día.</p>
        </div>
      </div>
    </section>
  )
}
