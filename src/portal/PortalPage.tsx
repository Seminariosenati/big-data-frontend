import { useNavigate } from 'react-router-dom'
import ProjectCard from './ProjectCard'
import { Database, LayoutGrid } from 'lucide-react'
import './portal.css'

interface ProjectDef {
  id: string
  name: string
  description: string
  path: string
  tag: string
  accent?: string
}

const projects: ProjectDef[] = [
  {
    id: 'datalume',
    name: 'Datalume',
    description: 'Panel de limpieza, diagnóstico y análisis de datos de ventas.',
    path: '/proyectos/datalume',
    tag: 'Datos',
  },
  // Agrega aquí el resto de tus proyectos:
  // {
  //   id: 'otro-proyecto',
  //   name: 'Otro Proyecto',
  //   description: 'Descripción corta de qué hace.',
  //   path: '/proyectos/otro-proyecto',
  //   tag: 'Ventas',
  // },
]

export default function PortalPage() {
  const navigate = useNavigate()

  return (
    <div className="portal-page">
      <header className="portal-header">
        <div className="portal-brand">
          <span className="portal-brand-icon">
            <LayoutGrid size={20} />
          </span>
          <div>
            <strong>Mis Proyectos</strong>
            <span>Selecciona un proyecto para entrar a su panel</span>
          </div>
        </div>
      </header>

      <div className="portal-grid">
        {projects.map((p) => (
          <ProjectCard
            key={p.id}
            name={p.name}
            description={p.description}
            tag={p.tag}
            icon={<Database size={22} />}
            onClick={() => navigate(p.path)}
          />
        ))}

        {/* Placeholder para invitar a agregar más proyectos */}
        <button className="portal-card portal-card--add" type="button" disabled>
          <span className="portal-card-add-icon">+</span>
          <span>Próximo proyecto</span>
        </button>
      </div>
    </div>
  )
}