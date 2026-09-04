const SERVICES = [
  {
    title: 'Carga de archivos',
    description: 'Sube archivos CSV y Excel de cualquier tamaño y da seguimiento a su procesamiento desde tu panel.',
  },
  {
    title: 'Limpieza de datos',
    description: 'Identifica valores nulos, filas duplicadas y formatos inconsistentes antes de analizar tus datos.',
  },
  {
    title: 'Visualización',
    description: 'Convierte tablas en gráficos claros: tendencias, comparativas y distribuciones listas para compartir.',
  },
  {
    title: 'Reportes',
    description: 'Genera resúmenes descargables con los hallazgos principales de cada conjunto de datos.',
  },
]

export default function ServicesPage() {
  return (
    <section className="page">
      <span className="eyebrow page-eyebrow">Servicios</span>
      <h1>Todo lo que necesitas para trabajar con tus datos</h1>
      <p className="page-lead">
        Esta vista muestra las secciones principales de la plataforma. En esta
        etapa el proyecto es solo interfaz: cada módulo se conectará a su
        respectivo servicio cuando el backend esté listo.
      </p>

      <div className="page-grid">
        {SERVICES.map((service) => (
          <div className="page-section" style={{ marginBottom: 0 }} key={service.title}>
            <h3>{service.title}</h3>
            <p>{service.description}</p>
          </div>
        ))}
      </div>
    </section>
  )
}
