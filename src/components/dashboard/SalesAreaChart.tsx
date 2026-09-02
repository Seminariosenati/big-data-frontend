import { useEffect, useMemo, useState } from 'react'
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
import { getSalesPeriodBreakdown } from '../../lib/api'

interface SalesAreaChartProps {
  datasetId: string
  monthly: { month: string; total: number }[]
  hasDailyDetail: boolean
  /** Notifica hacia arriba qué periodo está viendo el usuario (mes y, si
   * aplica, día puntual), para que la dona de categorías se recalcule. */
  onPeriodChange: (period: { month: string | null; day: string | null }) => void
}

const ALL_MONTHS = '__all__'

const formatMoney = (value: number) =>
  value.toLocaleString('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })

function monthLabel(raw: string) {
  const d = new Date(`${raw}-01T00:00:00`)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString('es-PE', { month: 'short', year: '2-digit' }).replace('.', '')
}

function dayLabel(raw: string) {
  const d = new Date(`${raw}T00:00:00`)
  if (Number.isNaN(d.getTime())) return raw
  return d.toLocaleDateString('es-PE', { day: '2-digit', month: 'short' }).replace('.', '')
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

export default function SalesAreaChart({ datasetId, monthly, hasDailyDetail, onPeriodChange }: SalesAreaChartProps) {
  // '__all__' = vista general (los 12 meses); cualquier otro valor es un
  // mes puntual ('YYYY-MM') que el usuario eligió del dropdown.
  const [selectedMonth, setSelectedMonth] = useState<string>(ALL_MONTHS)
  const [selectedDay, setSelectedDay] = useState<string | null>(null)
  const [dailyPoints, setDailyPoints] = useState<{ day: string; total: number }[] | null>(null)
  const [loadingDaily, setLoadingDaily] = useState(false)
  const { view } = useChartView()

  const availableMonths = useMemo(() => monthly.map((m) => m.month), [monthly])

  // Al cambiar de dataset, vuelve a la vista general.
  useEffect(() => {
    setSelectedMonth(ALL_MONTHS)
    setSelectedDay(null)
  }, [datasetId])

  // Si el dataset tiene detalle diario y el usuario eligió un mes puntual,
  // pide el desglose día a día de ese mes. Si no tiene detalle diario, no
  // se pide nada: solo existe la vista general de 12 meses.
  useEffect(() => {
    setSelectedDay(null)
    if (!hasDailyDetail || selectedMonth === ALL_MONTHS) {
      setDailyPoints(null)
      onPeriodChange({ month: selectedMonth === ALL_MONTHS ? null : selectedMonth, day: null })
      return
    }
    setLoadingDaily(true)
    getSalesPeriodBreakdown(datasetId, selectedMonth)
      .then((res) => {
        setDailyPoints(res.daily_points)
        onPeriodChange({ month: selectedMonth, day: null })
      })
      .catch(() => setDailyPoints(null))
      .finally(() => setLoadingDaily(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedMonth, hasDailyDetail, datasetId])

  const data = useMemo(() => {
    if (selectedMonth !== ALL_MONTHS && hasDailyDetail && dailyPoints) {
      const avg = dailyPoints.length ? dailyPoints.reduce((sum, d) => sum + d.total, 0) / dailyPoints.length : 0
      return dailyPoints.map((d, i) => ({
        name: dayLabel(d.day),
        full: d.day,
        ventas: d.total,
        anterior: dailyPoints[i - 1]?.total ?? avg,
      }))
    }
    if (monthly.length === 0) return []
    const avg = monthly.reduce((sum, m) => sum + m.total, 0) / monthly.length
    return monthly.map((m, i) => ({
      name: monthLabel(m.month),
      full: m.month,
      ventas: m.total,
      anterior: monthly[i - 1]?.total ?? avg,
    }))
  }, [monthly, selectedMonth, hasDailyDetail, dailyPoints])

  const handlePointClick = (point: { full?: string }) => {
    if (selectedMonth === ALL_MONTHS || !hasDailyDetail || !point?.full) return
    const day = point.full
    setSelectedDay((prev) => {
      const next = prev === day ? null : day
      onPeriodChange({ month: selectedMonth, day: next })
      return next
    })
  }

  if (!monthly || monthly.length === 0) {
    return (
      <div className="panel-card">
        <div className="panel-title">Evolución de Ventas</div>
        <div className="panel-subtitle">Sin datos suficientes para graficar</div>
      </div>
    )
  }

  const viewingMonth = selectedMonth !== ALL_MONTHS
  const showingDaily = viewingMonth && hasDailyDetail
  const subtitle = showingDaily
    ? `Detalle diario de ${monthLabel(selectedMonth)}${selectedDay ? ` · ${dayLabel(selectedDay)}` : ''}`
    : 'Tendencia de ingresos y transacciones (vista general por mes)'

  return (
    <div className="panel-card sales-area-card">
      <div className="sales-area-head">
        <div>
          <div className="panel-title">Evolución de Ventas</div>
          <div className="panel-subtitle">{subtitle}</div>
        </div>
        <select
          className="input-field sales-area-month-select"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value={ALL_MONTHS}>Todos los meses</option>
          {availableMonths.map((m) => (
            <option key={m} value={m}>
              {monthLabel(m)}
            </option>
          ))}
        </select>
      </div>

      {viewingMonth && !hasDailyDetail && (
        <div className="settings-row-hint" style={{ marginTop: 4 }}>
          Este dataset no trae fechas con suficiente detalle diario, así que se mantiene la vista general por mes.
        </div>
      )}

      {loadingDaily && <div className="settings-row-hint" style={{ marginTop: 4 }}>Cargando detalle diario…</div>}

      {viewingMonth && hasDailyDetail && !loadingDaily && dailyPoints && dailyPoints.length > 0 && (
        <div className="settings-row-hint" style={{ marginTop: 4 }}>
          Haz clic en un día para ver sus categorías en el gráfico de la derecha.
        </div>
      )}

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
              <Bar
                dataKey="ventas"
                fill="url(#salesBarGradient)"
                radius={[4, 4, 0, 0]}
                maxBarSize={34}
                onClick={(point: any) => handlePointClick(point ?? {})}
                style={{ cursor: showingDaily ? 'pointer' : 'default' }}
              />
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
                activeDot={{ r: 5, onClick: (_: unknown, e: any) => handlePointClick(e?.payload ?? {}) }}
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