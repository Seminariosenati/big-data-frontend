import { useEffect, useRef, useState } from 'react'
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

  // Recuerda el último "activeId + columna" que ya se pidió automáticamente
  // al cambiar de dataset, para que el efecto de "columna elegida a mano"
  // no repita esa misma petición apenas un instante después.
  const lastAutoFetchedKey = useRef<string>('')

  const activeId = selectedId || datasets[0]?.id || ''
  const activeDataset = datasets.find((d) => d.id === activeId)

  // Cambio de dataset (o de datasets tras subir uno nuevo): recargar
  // columnas y datos del nuevo archivo EN SECUENCIA, no en efectos
  // separados. Antes, un efecto de "columnas" y otro de "datos del
  // gráfico" corrían en paralelo: al cambiar de CSV, el efecto de datos
  // se disparaba de inmediato con el `activeId` nuevo pero todavía con la
  // columna `selected` del CSV ANTERIOR (que puede no existir en el
  // nuevo), provocando un 404 real que se autocorregía un instante
  // después al llegar la respuesta de columnas. La bandera `cancelled`
  // evita que una respuesta tardía de un dataset ya no activo pise el
  // estado del dataset que el usuario está viendo ahora.
  useEffect(() => {
    let cancelled = false
    if (!activeId) {
      setColumns([])
      setChartData(null)
      setLoadingColumns(false)
      return
    }
    setLoadingColumns(true)
    setError(null)
    setChartData(null)

    getChartColumnsForDataset(activeId)
      .then(async (res) => {
        if (cancelled) return
        setColumns(res.columns)
        const nextSelected = res.columns.some((c) => c.name === selected) ? selected : res.columns[0]?.name ?? ''
        setSelected(nextSelected)
        setLoadingColumns(false)

        if (!nextSelected) return
        setLoadingData(true)
        try {
          const data = await getChartColumnDataForDataset(activeId, nextSelected)
          if (!cancelled) {
            setChartData(data)
            lastAutoFetchedKey.current = `${activeId}|${nextSelected}`
          }
        } catch (err) {
          if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos')
        } finally {
          if (!cancelled) setLoadingData(false)
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'No se pudieron cargar las columnas')
          setLoadingColumns(false)
        }
      })

    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeId, refreshKey])

  // Cuando el usuario cambia la columna manualmente desde el <select>
  // (mismo dataset), solo se vuelve a pedir el dato de esa columna. Si
  // este par ya fue traído hace un instante por el efecto de arriba (justo
  // después de cambiar de dataset), se evita repetir la misma petición.
  useEffect(() => {
    if (!activeId || !selected) return
    if (lastAutoFetchedKey.current === `${activeId}|${selected}`) return
    let cancelled = false
    setLoadingData(true)
    setError(null)
    getChartColumnDataForDataset(activeId, selected)
      .then((data) => {
        if (!cancelled) setChartData(data)
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos')
      })
      .finally(() => {
        if (!cancelled) setLoadingData(false)

      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selected])

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