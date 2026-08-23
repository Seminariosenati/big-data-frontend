import { CheckCircle2, AlertTriangle, XCircle, Loader2 } from 'lucide-react'
import type { Dataset } from '../../lib/api'

const STATUS_MAP = {
  ok: { label: 'Válido', className: 'ok', icon: CheckCircle2 },
  warn: { label: 'Advertencias', className: 'warn', icon: AlertTriangle },
  error: { label: 'Con errores', className: 'error', icon: XCircle },
  processing: { label: 'Procesando', className: 'warn', icon: Loader2 },
} as const

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

interface DataTablePreviewProps {
  datasets: Dataset[]
  loading?: boolean
}

export default function DataTablePreview({ datasets, loading }: DataTablePreviewProps) {
  return (
    <div className="table-section">
      <div className="table-section-header">
        <div>
          <div className="panel-title" style={{ marginBottom: 2 }}>Archivos recientes</div>
          <div className="panel-subtitle" style={{ marginBottom: 0 }}>Vista previa de los últimos conjuntos de datos cargados</div>
        </div>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>Archivo</th>
              <th>Filas</th>
              <th>Columnas</th>
              <th>Calidad</th>
              <th>Estado</th>
              <th>Fecha</th>
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-faint)' }}>
                  Cargando…
                </td>
              </tr>
            )}

            {!loading && datasets.length === 0 && (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', padding: '24px 0', color: 'var(--text-faint)' }}>
                  Todavía no has subido ningún archivo
                </td>
              </tr>
            )}

            {datasets.map((row) => {
              const status = STATUS_MAP[row.status] ?? STATUS_MAP.processing
              const Icon = status.icon
              return (
                <tr key={row.id}>
                  <td>{row.file_name}</td>
                  <td>{row.row_count.toLocaleString('es-PE')}</td>
                  <td>{row.column_count}</td>
                  <td>{row.quality_score != null ? `${row.quality_score}%` : '—'}</td>
                  <td>
                    <span className={`status-pill ${status.className}`}>
                      <Icon size={12} />
                      {status.label}
                    </span>
                  </td>
                  <td>{formatDate(row.created_at)}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}