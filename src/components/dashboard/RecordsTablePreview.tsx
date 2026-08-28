import { useEffect, useState } from 'react'
import { getDatasetPreview, type Dataset, type DatasetPreview } from '../../lib/api'

const ROW_LIMIT = 10

interface RecordsTablePreviewProps {
  datasets: Dataset[]
  loading?: boolean
}

export default function RecordsTablePreview({ datasets, loading }: RecordsTablePreviewProps) {
  const [selectedId, setSelectedId] = useState('')
  const [preview, setPreview] = useState<DatasetPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [error, setError] = useState('')

  const activeId = selectedId || datasets[0]?.id || ''

  useEffect(() => {
    if (!activeId) {
      setPreview(null)
      return
    }
    setPreviewLoading(true)
    setError('')
    getDatasetPreview(activeId)
      .then(setPreview)
      .catch(() => setError('No se pudieron cargar los registros de este archivo'))
      .finally(() => setPreviewLoading(false))
  }, [activeId])

  const columns = preview?.columns ?? []
  const rows = preview?.rows.slice(0, ROW_LIMIT) ?? []

  return (
    <div className="table-section">
      <div className="table-section-header">
        <div>
          <div className="panel-title" style={{ marginBottom: 2 }}>Registros</div>
          <div className="panel-subtitle" style={{ marginBottom: 0 }}>
            Vista previa de los datos dentro del archivo seleccionado
          </div>
        </div>

        {datasets.length > 0 && (
          <select
            className="input-field"
            value={activeId}
            onChange={(e) => setSelectedId(e.target.value)}
            style={{ width: 'auto', minWidth: 200, padding: '8px 12px' }}
          >
            {datasets.map((d) => (
              <option key={d.id} value={d.id}>
                {d.file_name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              {columns.length > 0
                ? columns.map((c) => <th key={c}>{c}</th>)
                : <th>Registro</th>}
            </tr>
          </thead>
          <tbody>
            {(loading || previewLoading) && (
              <tr>
                <td colSpan={Math.max(columns.length, 1)} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-faint)' }}>
                  Cargando…
                </td>
              </tr>
            )}

            {!loading && !previewLoading && error && (
              <tr>
                <td colSpan={Math.max(columns.length, 1)} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-faint)' }}>
                  {error}
                </td>
              </tr>
            )}

            {!loading && !previewLoading && !error && datasets.length === 0 && (
              <tr>
                <td colSpan={Math.max(columns.length, 1)} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-faint)' }}>
                  Todavía no has subido ningún archivo
                </td>
              </tr>
            )}

            {!loading && !previewLoading && !error && rows.map((row, i) => (
              <tr key={i}>
                {columns.map((c) => (
                  <td key={c}>{String(row[c] ?? '—')}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {preview && (
        <div className="panel-subtitle" style={{ marginTop: 8, marginBottom: 0 }}>
          Mostrando {rows.length.toLocaleString('es-PE')} de {preview.totalRows.toLocaleString('es-PE')} registros
        </div>
      )}
    </div>
  )
}
