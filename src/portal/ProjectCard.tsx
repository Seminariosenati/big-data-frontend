import type { ReactNode } from 'react'
import { ArrowUpRight } from 'lucide-react'

interface ProjectCardProps {
  name: string
  description: string
  tag?: string
  icon?: ReactNode
  accent?: 'primary' | 'secondary'
  onClick: () => void
}

export default function ProjectCard({
  name,
  description,
  tag,
  icon,
  accent = 'primary',
  onClick,
}: ProjectCardProps) {
  return (
    <button
      className="portal-card"
      type="button"
      onClick={onClick}
      data-accent={accent}
    >
      <span className="portal-card-accent-bar" />

      <div className="portal-card-top">
        <span className="portal-card-icon">{icon}</span>
        {tag && <span className="portal-card-tag">{tag}</span>}
      </div>

      <div className="portal-card-body">
        <strong>{name}</strong>
        <p>{description}</p>
      </div>

      <div className="portal-card-footer">
        <span>Entrar al proyecto</span>
        <ArrowUpRight size={16} />
      </div>
    </button>
  )
}