import { TrendingUp } from 'lucide-react'

interface SalesByMonthCardProps {
  monthly: { month: string; total: number }[]
}

const formatMoney = (value: number) => `S/ ${value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

function monthLabel(raw: string) {
  const d = new Date(`${raw}-01T00:00:00`)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' }).replace('.', '')
}

export default function SalesByMonthCard({ monthly }: SalesByMonthCardProps) {
  if (!monthly || monthly.length === 0) {
    return (
      <div className="panel-card">
        <div className="panel-title">Ventas por mes</div>
        <div className="panel-subtitle">Sin datos suficientes para graficar</div>
      </div>
    )
  }

  const max = Math.max(1, ...monthly.map((m) => m.total))
  const best = monthly.reduce((a, b) => (b.total > a.total ? b : a), monthly[0])
  const worst = monthly.reduce((a, b) => (b.total < a.total ? b : a), monthly[0])
  const total = monthly.reduce((sum, m) => sum + m.total, 0)
  const avg = total / monthly.length
  const bestDiffPct = avg > 0 ? Math.round(((best.total - avg) / avg) * 100) : 0

  return (
    <div className="panel-card">
      <div className="sales-monthly-head">
        <div>
          <div className="panel-title">Ventas por mes</div>
          <div className="panel-subtitle">Total del período: <strong>S/ {total.toLocaleString('es-PE')}</strong></div>
        </div>
        <div className="sales-best-badge" title={`Mejor mes: ${monthLabel(best.month)}`}>
          <TrendingUp size={14} />
          <span>Mejor mes vs. Promedio</span>
          <strong>+{bestDiffPct}%</strong>
        </div>
      </div>
      <div className="bar-chart bar-chart-with-values">
        {monthly.map((m) => {
          const isBest = m.month === best.month && m.total === best.total
          const isWorst = m.month === worst.month && m.total === worst.total
          const tone = isBest ? 'sales-best' : isWorst ? 'sales-worst' : ''
          const label = m.total >= 1000 || m.total === 0 ? `${Math.round(m.total / 1000)}k` : String(Math.round(m.total))
          return (
            <div className="bar-chart-col" key={m.month}>
              <span className={`bar-chart-value ${tone}`}>{label}</span>
              <div
                className={`bar-chart-bar bar-chart-bar-single ${tone}`}
                style={{ height: `${(m.total / max) * 100}%` }}
                title={`${monthLabel(m.month)}: ${formatMoney(m.total)}`}
              />
              <span className="bar-chart-label">{monthLabel(m.month)}</span>
            </div>
          )
        })}
      </div>
    </div>
  )
}
