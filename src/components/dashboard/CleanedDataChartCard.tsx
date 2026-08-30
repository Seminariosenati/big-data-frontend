import { useEffect, useState } from 'react'
import { getChartColumnsForDataset, getChartColumnDataForDataset, type ChartColumn, type ChartColumnData, type Dataset } from '../../lib/api'
import ColumnChart from './ColumnChart'

interface CleanedDataChartCardProps {
  datasets: Dataset[]
  /** Dataset activo, compartido con "Registros" para que ambos cambien juntos. */
  selectedId: string
  refreshKey?: number
}

export default function CleanedDataChartCard({ datasets, selectedId, refreshKey }: CleanedDataChartCardProps) {
  const [columns, setColumns] = useState<ChartColumn[]>([])
  const [selected, setSelected] = useState<string>('')
  const [chartData, setChartData] = useState<ChartColumnData | null>(null)
  const [loadingColumns, setLoadingColumns] = useState(true)
  const [loadingData, setLoadingData] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const activeId = selectedId || datasets[0]?.id || ''
  const activeDataset = datasets.find((d) => d.id === activeId)

  // Cambio de dataset (o de datasets tras subir uno nuevo): recargar las
  // columnas disponibles de la versión limpia de ESE archivo puntual.
  useEffect(() => {
    if (!activeId) {
      setColumns([])
      setLoadingColumns(false)
      return
    }
    setLoadingColumns(true)
    setError(null)
    getChartColumnsForDataset(activeId)
      .then((res) => {
        setColumns(res.columns)
        setSelected((prev) => (res.columns.some((c) => c.name === prev) ? prev : res.columns[0]?.name ?? ''))
      })
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar las columnas'))
      .finally(() => setLoadingColumns(false))
  }, [activeId, refreshKey])

  useEffect(() => {
    if (!activeId || !selected) {
      setChartData(null)
      return
    }
    setLoadingData(true)
    setError(null)
    getChartColumnDataForDataset(activeId, selected)
      .then(setChartData)
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos'))
      .finally(() => setLoadingData(false))
  }, [activeId, selected])

  return (
    <div className="panel-card">
      <div
        style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap' }}
      >
        <div>
          <div className="panel-title" style={{ marginBottom: 2 }}>Datos limpios por columna</div>
          <div className="panel-subtitle" style={{ marginBottom: 0 }}>
            {activeDataset
              ? `${chartData?.type === 'numeric' ? 'Distribución de valores' : 'Conteo de categorías'} · ${activeDataset.file_name}`
              : 'Selecciona un archivo para ver su gráfico'}
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
          {activeDataset
            ? `"${activeDataset.file_name}" todavía no tiene una versión limpia. Límpialo en "Limpieza de datos" para ver gráficos aquí.`
            : 'Todavía no tienes datasets limpios. Limpia un dataset en "Limpieza de datos" para ver gráficos aquí.'}
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
            <ColumnChart chartData={chartData} />
          )}
        </div>
      )}
    </div>
  )
}