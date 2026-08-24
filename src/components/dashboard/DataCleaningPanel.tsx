import { useEffect, useMemo, useState } from 'react'
import { CheckCircle2, Download, FileSpreadsheet, FilterX, History, RefreshCw, Trash2, WandSparkles } from 'lucide-react'
import type { CleaningOptions, Dataset, DatasetPreview } from '../../lib/api'
import { applyCleanDataset, getDatasetPreview, previewCleanDataset } from '../../lib/api'
import CleaningHistoryModal from './CleaningHistoryModal'

interface DataCleaningPanelProps {
  datasets: Dataset[]
  loading?: boolean
  onGoToUpload: () => void
}

const STATUS_LABELS = { ok: 'Procesado', warn: 'En revisión', error: 'Error', processing: 'Procesando' } as const
const DEFAULT_OPTIONS: CleaningOptions = { remove_duplicates: false, null_strategy: 'ignore', convert_number: false, convert_dates: false, remove_empty_columns: false }

const formatDate = (value: string) => new Date(value).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: 'numeric' })

function downloadCsv(preview: DatasetPreview | null, fileName: string) {
  if (!preview?.rows.length) return
  const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
  const csv = [preview.columns, ...preview.rows.map((row) => preview.columns.map((c) => row[c]))].map((r) => r.map(escape).join(',')).join('\n')
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
  const link = Object.assign(document.createElement('a'), { href: url, download: `${fileName.replace(/\.[^.]+$/, '')}-limpio.csv` })
  link.click()
  URL.revokeObjectURL(url)
}

export default function DataCleaningPanel({ datasets, loading, onGoToUpload }: DataCleaningPanelProps) {
  const [selectedId, setSelectedId] = useState('')
  const [beforePreview, setBeforePreview] = useState<DatasetPreview | null>(null)
  const [afterPreview, setAfterPreview] = useState<DatasetPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [afterLoading, setAfterLoading] = useState(false)
  const [options, setOptions] = useState<CleaningOptions>(DEFAULT_OPTIONS)
  const [applying, setApplying] = useState(false)
  const [applied, setApplied] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)

  const selected = datasets.find((d) => d.id === selectedId) ?? datasets[0]
  const setOption = <K extends keyof CleaningOptions>(key: K, value: CleaningOptions[K]) =>
    setOptions((c) => ({ ...c, [key]: value }))

  // Cambio de dataset: cargar el "ANTES" y resetear opciones.
  useEffect(() => {
    if (!selected) return
    setSelectedId(selected.id)
    setOptions(DEFAULT_OPTIONS)
    setBeforePreview(null)
    setAfterPreview(null)
    setApplied(false)
    setPreviewLoading(true)
    getDatasetPreview(selected.id)
      .then((result) => { setBeforePreview(result); setAfterPreview(result) })
      .catch(() => { setBeforePreview(null); setAfterPreview(null) })
      .finally(() => setPreviewLoading(false))
  }, [selected?.id])

  // Cambio de opciones: pedirle al backend el resultado real (debounced).
  useEffect(() => {
    if (!selected) return
    setApplied(false)
    if (JSON.stringify(options) === JSON.stringify(DEFAULT_OPTIONS)) {
      if (beforePreview) setAfterPreview(beforePreview)
      return
    }
    setAfterLoading(true)
    const timeout = setTimeout(() => {
      previewCleanDataset(selected.id, options).then(setAfterPreview).catch(() => { }).finally(() => setAfterLoading(false))
    }, 350)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options, selected?.id])

  const healthScore = useMemo(() => {
    if (!selected) return 0
    let score = selected.quality_score ?? 0
    if (options.remove_duplicates) score += 3
    if (options.null_strategy !== 'ignore') score += 2
    if (options.remove_empty_columns) score += 1
    return Math.round(Math.min(100, score))
  }, [options, selected])

  const applyCleaning = async () => {
    if (!selected) return
    setApplying(true)
    try {
      setAfterPreview(await applyCleanDataset(selected.id, options))
      setApplied(true)
    } catch {
      // el fallo se refleja en que applied se queda en false
    } finally {
      setApplying(false)
    }
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
              <tbody>{datasets.map((d) => (
                <tr key={d.id} className={selected?.id === d.id ? 'selected' : ''} onClick={() => setSelectedId(d.id)}>
                  <td><strong>{d.file_name}</strong></td>
                  <td>{d.row_count.toLocaleString('es-PE')}</td>
                  <td>{d.column_count}</td>
                  <td><span className="quality-badge">{d.quality_score}%</span></td>
                  <td><span className={`status-pill ${d.status === 'processing' ? 'warn' : d.status}`}><CheckCircle2 size={12} />{STATUS_LABELS[d.status]}</span></td>
                  <td>{formatDate(d.created_at)}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </section>

      {selected && (
        <div className="cleaning-workspace">
          <section className="cleaning-tools panel-card">
            <div className="panel-title">Herramientas de limpieza</div>
            <div className="panel-subtitle">La vista previa se calcula en tiempo real para {selected.file_name}.</div>
            <button className={`cleaning-tool ${options.remove_duplicates ? 'active' : ''}`} onClick={() => setOption('remove_duplicates', !options.remove_duplicates)}>
              <Trash2 size={17} /><span><strong>Eliminar filas duplicadas</strong><small>Conserva la primera aparición de cada registro</small></span>
            </button>
            <label className="cleaning-field">
              <span>Valores nulos / vacíos</span>
              <select value={options.null_strategy} onChange={(e) => setOption('null_strategy', e.target.value as CleaningOptions['null_strategy'])}>
                <option value="ignore">No modificar</option>
                <option value="remove_row">Eliminar fila</option>
                <option value="set_null">Poner como null</option>
                <option value="zero">Rellenar con cero</option>
                <option value="average">Rellenar con promedio</option>
              </select>
            </label>
            <div className="cleaning-option-group">
              <span>Convertir tipos de dato</span>
              <label><input type="checkbox" checked={options.convert_number} onChange={(e) => setOption('convert_number', e.target.checked)} /> Texto a número</label>
              <label><input type="checkbox" checked={options.convert_dates} onChange={(e) => setOption('convert_dates', e.target.checked)} /> Corregir formato de fechas</label>
            </div>
            <label className="cleaning-check">
              <input type="checkbox" checked={options.remove_empty_columns} onChange={(e) => setOption('remove_empty_columns', e.target.checked)} />
              <span><strong>Eliminar columnas vacías o irrelevantes</strong><small>Quita campos sin información útil</small></span>
            </label>
            <button className="btn btn-primary btn-block cleaning-apply" onClick={applyCleaning} disabled={applying}>
              <WandSparkles size={16} /> {applying ? 'Aplicando…' : 'Aplicar limpieza'}
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => setHistoryOpen(true)}>
              <History size={15} /> Ver historial de limpieza
            </button>
            {applied && <div className="cleaning-confirm"><CheckCircle2 size={15} /> Cambios aplicados y guardados. Lo que se quitó quedó en el log, no se borró.</div>}
          </section>

          <section className="cleaning-health panel-card">
            <div className="cleaning-health-head"><div><div className="panel-title">Salud de datos</div><div className="panel-subtitle">Score estimado según las acciones seleccionadas</div></div><strong>{healthScore}<small>/100</small></strong></div>
            <div className="health-meter"><span style={{ width: `${healthScore}%` }} /></div>
            <div className="health-meta"><span>Antes <b>{selected.quality_score}%</b></span><span>Después <b className="health-after">{healthScore}%</b></span></div>
            {afterPreview?.summary && (
              <div className="cleaning-summary">
                {afterPreview.summary.duplicatesRemoved > 0 && <span>{afterPreview.summary.duplicatesRemoved} duplicados</span>}
                {afterPreview.summary.emptyRowsRemoved > 0 && <span>{afterPreview.summary.emptyRowsRemoved} filas vacías</span>}
                {afterPreview.summary.nullsFilled > 0 && <span>{afterPreview.summary.nullsFilled} nulos afectados</span>}
                {afterPreview.summary.columnsRemoved.length > 0 && <span>{afterPreview.summary.columnsRemoved.length} columnas quitadas</span>}
              </div>
            )}
            <div className="cleaning-preview-title"><span>Vista previa {afterPreview && afterPreview !== beforePreview && <small>· resaltado = cambió</small>}</span><button className="icon-button" title="Recargar vista previa" onClick={() => selected && setSelectedId('')}><RefreshCw size={15} /></button></div>
            <div className="preview-labels"><span>ANTES</span><span>DESPUÉS {afterLoading && '· calculando…'}</span></div>
            <div className="preview-compare">
              <PreviewTable preview={beforePreview} loading={previewLoading} />
              <PreviewTable preview={afterPreview} loading={previewLoading || afterLoading} diffAgainst={beforePreview} />
            </div>
            <button className="btn btn-outline btn-block" disabled={!afterPreview?.rows.length} onClick={() => downloadCsv(afterPreview, selected.file_name)}><Download size={15} /> Descargar CSV limpio</button>
            <button className="btn btn-ghost btn-block" disabled={!afterPreview?.rows.length} onClick={() => downloadCsv(afterPreview, selected.file_name.replace(/\.[^.]+$/, '.xlsx'))}>Descargar Excel limpio</button>
          </section>
        </div>
      )}

      {historyOpen && (
        <CleaningHistoryModal datasets={datasets} onClose={() => setHistoryOpen(false)} />
      )}
    </div>
  )
}

function cellText(value: unknown) {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

/** Tabla de preview. Si recibe `diffAgainst`, resalta las celdas cuyo valor
 * cambió respecto a esa otra preview (misma fila/columna), para que "poner
 * null" o cualquier otro cambio se vea aunque el texto renderizado ("—")
 * sea igual en ambos casos. */
function PreviewTable({ preview, loading, diffAgainst }: { preview: DatasetPreview | null; loading: boolean; diffAgainst?: DatasetPreview | null }) {
  if (loading) return <div className="preview-empty">Cargando…</div>
  if (!preview) return <div className="preview-empty">Sin vista previa disponible</div>
  const columns = preview.columns.slice(0, 4)
  return (
    <div className="preview-table-wrap">
      <table className="data-table">
        <thead><tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr></thead>
        <tbody>
          {preview.rows.slice(0, 3).map((row, i) => (
            <tr key={i}>
              {columns.map((c) => {
                const before = diffAgainst?.rows[i]?.[c]
                const changed = diffAgainst ? JSON.stringify(before) !== JSON.stringify(row[c]) : false
                return <td key={c} className={changed ? 'cell-changed' : undefined}>{cellText(row[c])}</td>
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}