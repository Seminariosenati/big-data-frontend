import { useMemo, useState } from 'react'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { useChartView } from '../../lib/chartView'

interface SalesAreaChartProps {
  monthly: { month: string; total: number }[]
}

type PeriodKey = '3m' | '30d' | '7d'

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: '3m', label: 'Últimos 3 meses' },
  { key: '30d', label: 'Últimos 30 días' },
  { key: '7d', label: 'Últimos 7 días' },
]

// Puntos mensuales a mostrar según el filtro. El backend entrega ventas
// agregadas por mes (no por día), así que "30 días"≈4 meses y "7 días"≈1-2
// meses en la resolución disponible.
const PERIOD_POINTS: Record<PeriodKey, number> = {
  '3m': 3,
  '30d': 4,
  '7d': 2,
}

const formatMoney = (value: number) =>
  value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function monthLabel(raw: string) {
  const d = new Date(`${raw}-01T00:00:00`)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' }).replace('.', '')
}

function CustomTooltip({ active, payload }: { active?: boolean; payload?: Array<{ value?: number }> }) {
  if (!active || !payload || payload.length === 0) return null
  const value = payload[0]?.value ?? 0
  return (
    <div className="sales-area-tooltip">
      <span className="sales-area-tooltip-dot" />
      <strong>S/ {formatMoney(value)}</strong>
    </div>
  )
}

export default function SalesAreaChart({ monthly }: SalesAreaChartProps) {
  const [period, setPeriod] = useState<PeriodKey>('3m')
  const { view } = useChartView()

  const data = useMemo(() => {
    const points = PERIOD_POINTS[period]
    const sliced = monthly.slice(-points)
    if (sliced.length === 0) return []
    const avg = sliced.reduce((sum, m) => sum + m.total, 0) / sliced.length
    return sliced.map((m, i) => {
      const prev = sliced[i - 1]?.total
      return {
        name: monthLabel(m.month),
        full: m.month,
        ventas: m.total,
        // Referencia comparativa: valor del mes anterior cuando existe,
        // sino el promedio del período (línea gris punteada).
        anterior: prev ?? avg,
      }
    })
  }, [monthly, period])

  if (!monthly || monthly.length === 0) {
    return (
      <div className="panel-card">
        <div className="panel-title">Evolución de Ventas</div>
        <div className="panel-subtitle">Sin datos suficientes para graficar</div>
      </div>
    )
  }

  const periodLabel = PERIODS.find((p) => p.key === period)?.label ?? ''

  return (
    <div className="panel-card sales-area-card">
      <div className="sales-area-head">
        <div>
          <div className="panel-title">Evolución de Ventas</div>
          <div className="panel-subtitle">
            Tendencia de ingresos y transacciones {periodLabel ? `(${periodLabel.toLowerCase()})` : ''}
          </div>
        </div>
        <div className="sales-area-pills" role="group" aria-label="Selector de periodo">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              type="button"
              className={`sales-area-pill ${period === p.key ? 'active' : ''}`}
              onClick={() => setPeriod(p.key)}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      <div className="sales-area-chart">
        <ResponsiveContainer width="100%" height={230}>
          {view === 'bar' ? (
            <BarChart data={data} margin={{ top: 12, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0.35} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-faint)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tick={{ fill: 'var(--text-faint)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(value: number) => `S/ ${value >= 1000 ? `${Math.round(value / 1000)}k` : Math.round(value)}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--border-soft)' }} />
              <Bar dataKey="ventas" fill="url(#salesBarGradient)" radius={[4, 4, 0, 0]} maxBarSize={34} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 12, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="salesAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#f59e0b" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fill: 'var(--text-faint)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                dy={6}
              />
              <YAxis
                tick={{ fill: 'var(--text-faint)', fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={56}
                tickFormatter={(value: number) => `S/ ${value >= 1000 ? `${Math.round(value / 1000)}k` : Math.round(value)}`}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ stroke: '#27272a', strokeDasharray: '3 3' }} />
              <Area
                type="natural"
                dataKey="ventas"
                stroke="#f59e0b"
                strokeWidth={2.5}
                fill="url(#salesAreaGradient)"
                dot={{ r: 3, fill: '#f59e0b', strokeWidth: 0 }}
                activeDot={{ r: 5 }}
              />
              <Area
                type="natural"
                dataKey="anterior"
                stroke="#6b7280"
                strokeWidth={1.5}
                strokeDasharray="5 5"
                fill="transparent"
                dot={false}
                activeDot={false}
              />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
