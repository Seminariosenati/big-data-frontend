import type { LucideIcon } from 'lucide-react'
import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface StatCardProps {
  icon: LucideIcon
  label: string
  value: string
  hint: string
  tone: 'amber' | 'blue' | 'green' | 'coral'
  trend: 'up' | 'down'
}

export default function StatCard({ icon: Icon, label, value, hint, tone, trend }: StatCardProps) {
  return (
    <div className="stat-card">
      <div className="stat-card-top">
        <span className="stat-card-label">{label}</span>
        <span className={`stat-card-icon tone-${tone}`}>
          <Icon size={15} strokeWidth={2.2} />
        </span>
      </div>
      <div className="stat-card-value">{value}</div>
      <div className={`stat-card-hint ${trend}`} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
        {trend === 'up' ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
        {hint}
      </div>
    </div>
  )
}
