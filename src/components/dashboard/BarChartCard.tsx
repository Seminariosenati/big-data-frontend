import type { Dataset } from '../../lib/api'

interface BarChartCardProps {
  datasets: Dataset[]
}

const MONTH_LABELS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic']

function buildMonthlyVolume(datasets: Dataset[]) {
  const now = new Date()
  const months: { key: string; label: string; value: number }[] = []

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    months.push({ key: `${d.getFullYear()}-${d.getMonth()}`, label: MONTH_LABELS[d.getMonth()], value: 0 })
  }

  const byKey = new Map(months.map((m) => [m.key, m]))

  for (const dataset of datasets) {
    const d = new Date(dataset.created_at)
    const key = `${d.getFullYear()}-${d.getMonth()}`
    const bucket = byKey.get(key)
    if (bucket) bucket.value += Math.round(dataset.row_count / 1000)
  }

  return months
}

export default function BarChartCard({ datasets }: BarChartCardProps) {
  const monthlyVolume = buildMonthlyVolume(datasets)
  const max = Math.max(1, ...monthlyVolume.map((m) => m.value))

  return (
    <div className="panel-card">
      <div className="panel-title">Volumen de registros procesados</div>
      <div className="panel-subtitle">Últimos 7 meses</div>
      <div className="bar-chart">
        {monthlyVolume.map((m) => (
          <div className="bar-chart-col" key={m.key}>
            <div
              className="bar-chart-bar"
              style={{ height: `${(m.value / max) * 100}%` }}
              title={`${m.label}: ${m.value}k registros`}
            />
            <span className="bar-chart-label">{m.label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}