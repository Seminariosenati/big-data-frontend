import { useMemo } from 'react'
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
import type { Dataset } from '../../lib/api'
import { useChartView } from '../../lib/chartViewContext'

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
    if (bucket) bucket.value += dataset.row_count
  }

  return months
}

function ChartTooltip({ active, payload, label }: { active?: boolean; payload?: Array<{ value?: number }>; label?: string }) {
  if (!active || !payload || payload.length === 0) return null
  const value = payload[0]?.value ?? 0
  return (
    <div className="sales-area-tooltip">
      <span className="sales-area-tooltip-dot" />
      <strong>{label}: {value.toLocaleString('es-PE')}</strong>
    </div>
  )
}

export default function BarChartCard({ datasets }: BarChartCardProps) {
  const monthlyVolume = useMemo(() => buildMonthlyVolume(datasets), [datasets])
  const { view } = useChartView()

  return (
    <div className="panel-card">
      <div className="panel-title">Volumen de registros procesados</div>
      <div className="panel-subtitle">Últimos 7 meses</div>
      <div className="sales-area-chart">
        <ResponsiveContainer width="100%" height={230}>
          {view === 'bar' ? (
            <BarChart data={monthlyVolume} margin={{ top: 12, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="volBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.25} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} dy={6} />
              <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--border-soft)' }} />
              <Bar dataKey="value" fill="url(#volBarGradient)" radius={[4, 4, 0, 0]} maxBarSize={34} />
            </BarChart>
          ) : (
            <AreaChart data={monthlyVolume} margin={{ top: 12, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="volAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="label" tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} dy={6} />
              <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} width={56} tickFormatter={(v: number) => (v >= 1000 ? `${Math.round(v / 1000)}k` : String(v))} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#27272a', strokeDasharray: '3 3' }} />
              <Area type="natural" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} fill="url(#volAreaGradient)" dot={{ r: 3, fill: 'var(--primary)', strokeWidth: 0 }} activeDot={{ r: 5 }} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
