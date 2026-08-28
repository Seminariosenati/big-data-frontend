import { useEffect, useState } from 'react'
import { getChartColumns, getChartColumnData, type ChartColumn, type ChartColumnData } from '../../lib/api'

interface CleanedDataChartCardProps {
  refreshKey?: number
}

export default function CleanedDataChartCard({ refreshKey }: CleanedDataChartCardProps) {
  const [columns, setColumns] = useState<ChartColumn[]>([])
  const [selected, setSelected] = useState<string>('')
  const [chartData, setChartData] = useState<ChartColumnData | null>(null)
  const [loadingColumns, setLoadingColumns] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoadingColumns(true)
    setError(null)
    getChartColumns()
      .then((res) => {
        setColumns(res.columns)
        setSelected((prev) => (res.columns.some((c) => c.name === prev) ? prev : res.columns[0]?.name ?? ''))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar las columnas'))
      .finally(() => setLoadingColumns(false))
  }, [refreshKey])

  useEffect(() => {
    if (!selected) {
      setChartData(null)
      return
    }
    setLoadingData(true)
    setError(null)
    getChartColumnData(selected)
      .then(setChartData)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos'))
      .finally(() => setLoadingData(false))
  }, [selected])

  const max = Math.max(1, ...(chartData?.data.map((d) => d.value) ?? [0]))

  function formatEdge(n: number) {
    // Números grandes sin decimales innecesarios; el resto con máx. 2.
    const rounded = Math.round(n * 100) / 100
    return rounded.toLocaleString('es-PE', { maximumFractionDigits: Number.isInteger(rounded) ? 0 : 2 })
  }

  // Para histogramas numéricos, el backend manda "edgeA – edgeB". Partimos
  // el rango en dos líneas y formateamos los números para que no se corten
  // ni queden con demasiados decimales.
  function formatLabel(label: string, type?: 'numeric' | 'categorical') {
    if (type !== 'numeric') return { top: label, bottom: null as string | null }
    const parts = label.split('–').map((p) => p.trim())
    if (parts.length !== 2) return { top: label, bottom: null }
    const a = Number(parts[0])
    const b = Number(parts[1])
    if (Number.isNaN(a) || Number.isNaN(b)) return { top: label, bottom: null }
    return { top: formatEdge(a), bottom: formatEdge(b) }
  }

  return (
    <div className="panel-card">
      <div
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
      >
        <div>
          <div className="panel-title" style={{ marginBottom: 2 }}>Datos limpios por columna</div>
          <div className="panel-subtitle" style={{ marginBottom: 0 }}>
            {chartData?.type === 'numeric'
              ? 'Distribución de valores (todos tus datasets limpios)'
              : 'Conteo de categorías (todos tus datasets limpios)'}
          </div>
        </div>

        {columns.length > 0 && (
          <select
            className="input-field"
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            style={{ width: 'auto', minWidth: 160, padding: '8px 12px' }}
          >
            {columns.map((col) => (
              <option key={col.name} value={col.name}>
                {col.name}
              </option>
            ))}
          </select>
        )}
      </div>

      {loadingColumns && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)' }}>Cargando…</div>
      )}

      {!loadingColumns && columns.length === 0 && !error && (
        <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)' }}>
          Todavía no tienes datasets limpios. Limpia un dataset en "Limpieza de datos" para ver gráficos aquí.
        </div>
      )}

      {error && <div className="form-alert error" style={{ marginTop: 12 }}>{error}</div>}

      {!loadingColumns && columns.length > 0 && !error && (
        <div style={{ marginTop: 14, overflowX: 'auto' }}>
          {loadingData && <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)' }}>Cargando…</div>}

          {!loadingData && chartData && chartData.data.length === 0 && (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)' }}>
              No hay valores para esta columna
            </div>
          )}

          {!loadingData && chartData && chartData.data.length > 0 && (
            <div className="bar-chart" style={{ minWidth: chartData.data.length * 84 }}>
              {chartData.data.map((d) => {
                const { top, bottom } = formatLabel(d.label, chartData.type)
                const heightPct = Math.max((d.value / max) * 100, d.value > 0 ? 3 : 0)
                return (
                  <div className="bar-chart-col" key={d.label}>
                    <span className="bar-chart-value">{d.value.toLocaleString('es-PE')}</span>
                    <div
                      className="bar-chart-bar bar-chart-bar-single"
                      style={{ height: `${heightPct}%` }}
                      title={chartData.type === 'numeric' ? `${d.label}: ${d.value.toLocaleString('es-PE')} registros` : `${d.label}: ${d.value.toLocaleString('es-PE')}`}
                    />
                    <span className="bar-chart-label" title={d.label}>
                      {top}
                      {bottom != null && (
                        <>
                          <br />– {bottom}
                        </>
                      )}
                    </span>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
