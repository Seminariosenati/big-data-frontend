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
import { useChartView } from '../../lib/chartViewContext'
import type { ChartColumnData } from '../../lib/api'

function formatEdge(n: number) {
  const rounded = Math.round(n * 100) / 100
  return rounded.toLocaleString('es-PE', { maximumFractionDigits: Number.isInteger(rounded) ? 0 : 2 })
}

// Para histogramas numéricos el backend manda "edgeA – edgeB". Lo partimos.
function shortLabel(raw: string, type?: 'numeric' | 'categorical') {
  if (type !== 'numeric') return raw
  const parts = raw.split('–').map((p) => p.trim())
  if (parts.length !== 2) return raw
  const a = Number(parts[0])
  const b = Number(parts[1])
  if (Number.isNaN(a) || Number.isNaN(b)) return raw
  return `${formatEdge(a)}–${formatEdge(b)}`
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

export default function ColumnChart({ chartData }: { chartData: ChartColumnData }) {
  const { view } = useChartView()

  const data = useMemo(
    () => chartData.data.map((d) => ({ name: shortLabel(d.label, chartData.type), value: d.value })),
    [chartData]
  )

  const isNumeric = chartData.type === 'numeric'

  return (
    <div style={{ marginTop: 14 }}>
      <div className="sales-area-chart" style={{ minWidth: 420 }}>
        <ResponsiveContainer width="100%" height={260}>
          {view === 'bar' ? (
            <BarChart data={data} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colBarGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.9} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0.25} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} interval={isNumeric ? 0 : undefined} />
              <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} width={56} dataKey="value" />
              <Tooltip content={<ChartTooltip />} cursor={{ fill: 'var(--border-soft)' }} />
              <Bar dataKey="value" fill="url(#colBarGradient)" radius={[3, 3, 0, 0]} maxBarSize={30} />
            </BarChart>
          ) : (
            <AreaChart data={data} margin={{ top: 8, right: 6, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colAreaGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--primary)" stopOpacity={0.3} />
                  <stop offset="100%" stopColor="var(--primary)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
              <XAxis dataKey="name" tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fill: 'var(--text-faint)', fontSize: 11 }} axisLine={false} tickLine={false} width={56} />
              <Tooltip content={<ChartTooltip />} cursor={{ stroke: '#27272a', strokeDasharray: '3 3' }} />
              <Area type="natural" dataKey="value" stroke="var(--primary)" strokeWidth={2.5} fill="url(#colAreaGradient)" dot={false} activeDot={{ r: 5 }} />
            </AreaChart>
          )}
        </ResponsiveContainer>
      </div>
    </div>
  )
}
