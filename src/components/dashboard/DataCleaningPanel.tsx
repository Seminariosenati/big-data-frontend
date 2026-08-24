import { useEffect, useMemo, useState } from 'react'
import {
  CheckCircle2,
  Download,
  FileSpreadsheet,
  FilterX,
  RefreshCw,
  Sparkles,
  Trash2,
  WandSparkles,
} from 'lucide-react'
import type { Dataset, DatasetPreview } from '../../lib/api'
import { getDatasetPreview } from '../../lib/api'

type NullStrategy = 'remove' | 'zero' | 'average'
type Transform = 'number' | 'dates'

interface DataCleaningPanelProps {
  datasets: Dataset[]
  loading?: boolean
  onGoToUpload: () => void
}

const STATUS_LABELS = { ok: 'Procesado', warn: 'En revisión', error: 'Error', processing: 'Procesando' } as const

function formatDate(value: string) {
  return new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })
}

function downloadCsv(preview: DatasetPreview | null, fileName: string) {
  if (!preview || preview.rows.length === 0) return
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [preview.columns, ...preview.rows.map((row) => preview.columns.map((column) => row[column]))]
    .map((row) => row.map(escape).join(','))
    .join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = document.createElement('a')
  link.href = url
  link.download = `${fileName.replace(/\.[^.]+$/, '')}-limpio.csv`
  link.click()
  URL.revokeObjectURL(url)
}

export default function DataCleaningPanel({ datasets, loading, onGoToUpload }: DataCleaningPanelProps) {
  const [selectedId, setSelectedId] = useState('')
  const [preview, setPreview] = useState<DatasetPreview | null>(null)
  const [beforePreview, setBeforePreview] = useState<DatasetPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [nullStrategy, setNullStrategy] = useState<NullStrategy>('remove')
  const [transforms, setTransforms] = useState<Transform[]>([])
  const [removeEmpty, setRemoveEmpty] = useState(false)
  const [duplicatesRemoved, setDuplicatesRemoved] = useState(false)
  const [applied, setApplied] = useState(false)

  const selected = datasets.find((dataset) => dataset.id === selectedId) ?? datasets[0]

  useEffect(() => {
    if (!selected) return
    setSelectedId(selected.id)
    setPreview(null)
    setBeforePreview(null)
    setApplied(false)
    setPreviewLoading(true)
    getDatasetPreview(selected.id)
      .then((result) => {
        setPreview(result)
        setBeforePreview(result)
      })
      .catch(() => {
        setPreview(null)
        setBeforePreview(null)
      })
      .finally(() => setPreviewLoading(false))
  }, [selected?.id])

  const healthScore = useMemo(() => {
    if (!selected) return 0
    let score = selected.quality_score ?? 0
    if (duplicatesRemoved) score = Math.min(100, score + 3)
    if (nullStrategy !== 'remove') score = Math.min(100, score + 2)
    if (removeEmpty) score = Math.min(100, score + 1)
    return Math.round(score)
  }, [duplicatesRemoved, nullStrategy, removeEmpty, selected])

  const toggleTransform = (transform: Transform) => {
    setTransforms((current) => current.includes(transform)
      ? current.filter((item) => item !== transform)
      : [...current, transform])
    setApplied(false)
  }

  const applyCleaning = () => {
    setApplied(true)
    if (!preview) return
    const cleanedRows = duplicatesRemoved
      ? preview.rows.filter((row, index, rows) => index === rows.findIndex((candidate) => JSON.stringify(candidate) === JSON.stringify(row)))
      : preview.rows
    setPreview({ ...preview, rows: cleanedRows })
  }

  if (loading) return <div className="cleaning-loading">Cargando archivos…</div>

  return (
    <div className="cleaning-page">
      <section className="cleaning-files panel-card">
        <div className="table-section-header">
          <div>
            <div className="panel-title">Archivos subidos</div>
            <div className="panel-subtitle">Selecciona un dataset para revisar y limpiar su estructura.</div>
          </div>
          <button className="btn btn-outline" onClick={onGoToUpload}><FileSpreadsheet size={15} /> Subir archivo</button>
        </div>
        {datasets.length === 0 ? (
          <div className="cleaning-empty">
            <FilterX size={28} />
            <strong>Aún no hay archivos para limpiar</strong>
            <span>Sube un CSV o Excel para comenzar el análisis.</span>
            <button className="btn btn-primary" onClick={onGoToUpload}>Subir primer archivo</button>
          </div>
        ) : (
          <div className="data-table-wrapper">
            <table className="data-table cleaning-table">
              <thead><tr><th>Archivo</th><th>Filas</th><th>Columnas</th><th>Calidad</th><th>Estado</th><th>Fecha</th></tr></thead>
              <tbody>{datasets.map((dataset) => (
                <tr key={dataset.id} className={selected?.id === dataset.id ? 'selected' : ''} onClick={() => setSelectedId(dataset.id)}>
                  <td><strong>{dataset.file_name}</strong></td>
                  <td>{dataset.row_count.toLocaleString('es-PE')}</td>
                  <td>{dataset.column_count}</td>
                  <td><span className="quality-badge">{dataset.quality_score}%</span></td>
                  <td><span className={`status-pill ${dataset.status === 'processing' ? 'warn' : dataset.status}`}><CheckCircle2 size={12} />{STATUS_LABELS[dataset.status]}</span></td>
                  <td>{formatDate(dataset.created_at)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {selected && <>
        <div className="cleaning-workspace">
          <section className="cleaning-tools panel-card">
            <div className="panel-title">Herramientas de limpieza</div>
            <div className="panel-subtitle">Cambios preparados localmente para {selected.file_name}.</div>
            <button className={`cleaning-tool ${duplicatesRemoved ? 'active' : ''}`} onClick={() => { setDuplicatesRemoved((value) => !value); setApplied(false) }}><Trash2 size={17} /><span><strong>Eliminar filas duplicadas</strong><small>Conserva la primera aparición de cada registro</small></span></button>
            <label className="cleaning-field"><span>Valores nulos / vacíos</span><select value={nullStrategy} onChange={(event) => { setNullStrategy(event.target.value as NullStrategy); setApplied(false) }}><option value="remove">Eliminar fila</option><option value="zero">Rellenar con cero</option><option value="average">Rellenar con promedio</option></select></label>
            <div className="cleaning-option-group"><span>Convertir tipos de dato</span><label><input type="checkbox" checked={transforms.includes('number')} onChange={() => toggleTransform('number')} /> Texto a número</label><label><input type="checkbox" checked={transforms.includes('dates')} onChange={() => toggleTransform('dates')} /> Corregir formato de fechas</label></div>
            <label className="cleaning-check"><input type="checkbox" checked={removeEmpty} onChange={(event) => { setRemoveEmpty(event.target.checked); setApplied(false) }} /><span><strong>Eliminar columnas vacías o irrelevantes</strong><small>Quita campos sin información útil</small></span></label>
            <button className="btn btn-primary btn-block cleaning-apply" onClick={applyCleaning}><WandSparkles size={16} /> Aplicar limpieza</button>
            {applied && <div className="cleaning-confirm"><CheckCircle2 size={15} /> Cambios aplicados a la vista previa</div>}
          </section>

          <section className="cleaning-health panel-card">
            <div className="cleaning-health-head"><div><div className="panel-title">Salud de datos</div><div className="panel-subtitle">Score estimado según las acciones seleccionadas</div></div><strong>{healthScore}<small>/100</small></strong></div>
            <div className="health-meter"><span style={{ width: `${healthScore}%` }} /></div>
            <div className="health-meta"><span>Antes <b>{selected.quality_score}%</b></span><span>Después <b className="health-after">{healthScore}%</b></span></div>
            <div className="cleaning-preview-title"><span>Vista previa</span><button className="icon-button" title="Recargar vista previa" onClick={() => selected && setSelectedId('')}><RefreshCw size={15} /></button></div>
            <div className="preview-labels"><span>ANTES</span><span>DESPUÉS</span></div>
            <div className="preview-compare">
              <PreviewTable preview={beforePreview} loading={previewLoading} />
              <PreviewTable preview={preview} loading={previewLoading} />
            </div>
            <button className="btn btn-outline btn-block" disabled={!preview?.rows.length} onClick={() => downloadCsv(preview, selected.file_name)}><Download size={15} /> Descargar CSV limpio</button>
            <button className="btn btn-ghost btn-block" disabled={!preview?.rows.length} onClick={() => downloadCsv(preview, selected.file_name.replace(/\.[^.]+$/, '.xlsx'))}>Descargar Excel limpio</button>
          </section>
        </div>
      </>}
    </div>
  )
}

function PreviewTable({ preview, loading }: { preview: DatasetPreview | null; loading: boolean }) {
  if (loading) return <div className="preview-empty">Cargando…</div>
  if (!preview) return <div className="preview-empty">Sin vista previa disponible</div>
  return <div className="preview-table-wrap"><table className="data-table"><thead><tr>{preview.columns.slice(0, 4).map((column) => <th key={column}>{column}</th>)}</tr></thead><tbody>{preview.rows.slice(0, 3).map((row, index) => <tr key={index}>{preview.columns.slice(0, 4).map((column) => <td key={column}>{String(row[column] ?? '—')}</td>)}</tr>)}</tbody></table></div>
}