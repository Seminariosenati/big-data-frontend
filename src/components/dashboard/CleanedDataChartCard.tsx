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
            <div className="bar-chart" style={{ minWidth: chartData.data.length * 56 }}>
              {chartData.data.map((d) => (
                <div className="bar-chart-col" key={d.label}>
                  <div
                    className="bar-chart-bar"
                    style={{ height: `${(d.value / max) * 100}%` }}
                    title={`${d.label}: ${d.value.toLocaleString('es-PE')}`}
                  />
                  <span
                    className="bar-chart-label"
                    style={{ maxWidth: 56, textAlign: 'center', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                    title={d.label}
                  >
                    {d.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
