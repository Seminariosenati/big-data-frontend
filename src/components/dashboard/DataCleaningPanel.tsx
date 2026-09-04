import { useEffect, useMemo, useRef, useState } from 'react'
import { CheckCircle2, Download, FileSpreadsheet, FilterX, History, Table2, Activity, Trash2, WandSparkles } from 'lucide-react'
import type { CleaningOptions, Dataset, DatasetPreview } from '../../lib/api'
import { applyCleanDataset, getDatasetPreview, previewCleanDataset } from '../../lib/api'
import CleaningHistoryModal from './CleaningHistoryModal'
import CleaningModal, { type CleaningStatus } from './CleaningModal'
import HealthScoreRing from './HealthScoreRing'

interface DataCleaningPanelProps {
  datasets: Dataset[]
  loading?: boolean
  onGoToUpload: () => void
  /** Se llama después de aplicar la limpieza con éxito, para que el padre
   * vuelva a pedir la lista de datasets y la fila (calidad/estado) se
   * actualice sin tener que recargar la página. */
  onCleaned?: () => void
}

// Ojo: "status" es un puntaje de CALIDAD calculado al subir el archivo
// (qué tan pocos nulos/duplicados tiene), NO si ya pasó por "Limpieza de
// datos". Por eso el texto dice "Calidad ___" y no "Procesado" — decir
// "Procesado" sonaba a "ya limpio" y generaba confusión.
const STATUS_LABELS = { ok: 'Calidad buena', warn: 'Calidad regular', error: 'Calidad baja', processing: 'Procesando' } as const

// "Procesado" (en verde) queda reservado para cuando el dataset YA pasó
// por "Aplicar limpieza" — no solo por tener buena calidad al subir.
function statusDisplay(d: Dataset) {
  if (d.has_cleaned_version) return { label: 'Procesado', pillClass: 'ok' }
  return { label: STATUS_LABELS[d.status], pillClass: d.status === 'processing' ? 'warn' : d.status }
}
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

export default function DataCleaningPanel({ datasets, loading, onGoToUpload, onCleaned }: DataCleaningPanelProps) {
  const [selectedId, setSelectedId] = useState('')
  const [beforePreview, setBeforePreview] = useState<DatasetPreview | null>(null)
  const [afterPreview, setAfterPreview] = useState<DatasetPreview | null>(null)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [afterLoading, setAfterLoading] = useState(false)
  const [options, setOptions] = useState<CleaningOptions>(DEFAULT_OPTIONS)
  const [applying, setApplying] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [cleanModal, setCleanModal] = useState<{ status: CleaningStatus; progress: number } | null>(null)
  const [cleanError, setCleanError] = useState<string | null>(null)
  const [cleanSummary, setCleanSummary] = useState<DatasetPreview['summary']>(undefined)
  const [rightTab, setRightTab] = useState<'preview' | 'health'>('preview')
  const [previewMode, setPreviewMode] = useState<'original' | 'cleaned'>('cleaned')

  const selected = datasets.find((d) => d.id === selectedId) ?? datasets[0]
  const setOption = <K extends keyof CleaningOptions>(key: K, value: CleaningOptions[K]) =>
    setOptions((c) => ({ ...c, [key]: value }))

  // Referencia con el id del dataset REALMENTE seleccionado en este momento
  // (no el de cuando arrancó cada fetch). Sirve para que, si cambias de
  // archivo mientras una petición anterior sigue en camino, esa respuesta
  // vieja no pise los datos del archivo que estás viendo ahora.
  const selectedIdRef = useRef('')
  useEffect(() => {
    selectedIdRef.current = selected?.id ?? ''
  }, [selected?.id])

  // Cambio de dataset: cargar el "ANTES" real y resetear opciones.
  useEffect(() => {
    if (!selected) return
    const id = selected.id
    setSelectedId(id)
    setOptions(DEFAULT_OPTIONS)
    setBeforePreview(null)
    setAfterPreview(null)
    setCleanModal(null)
    setPreviewLoading(true)
    getDatasetPreview(id)
      .then((result) => {
        if (id !== selectedIdRef.current) return // el usuario ya cambió de archivo; ignorar
        setBeforePreview(result)
        setAfterPreview(result)
      })
      .catch(() => {
        if (id === selectedIdRef.current) { setBeforePreview(null); setAfterPreview(null) }
      })
      .finally(() => {
        if (id === selectedIdRef.current) setPreviewLoading(false)
      })
  }, [selected?.id])

  // Cambio de OPCIONES de limpieza (no de dataset): pedirle al backend el
  // resultado real (debounced). Ojo: esto NO depende de selected?.id — solo
  // reacciona a cambios reales de opciones hechos por el usuario. Si
  // dependiera también del dataset, al cambiar de archivo este efecto se
  // disparaba con las opciones "sucias" que habían quedado del archivo
  // anterior (el reset a DEFAULT_OPTIONS del efecto de arriba todavía no se
  // había aplicado en ese mismo instante), y esa respuesta tardía terminaba
  // sobrescribiendo la vista previa correcta del archivo nuevo con el
  // resultado de limpiar el archivo nuevo usando las opciones viejas — eso
  // era el bug: "se muestra el preview del csv que ya se había limpiado".
  useEffect(() => {
    if (JSON.stringify(options) === JSON.stringify(DEFAULT_OPTIONS)) {
      if (beforePreview) setAfterPreview(beforePreview)
      return
    }
    const id = selectedIdRef.current
    if (!id) return
    setCleanModal(null)
    setAfterLoading(true)
    const timeout = setTimeout(() => {
      previewCleanDataset(id, options)
        .then((result) => {
          if (id !== selectedIdRef.current) return // ya no es el archivo activo; ignorar
          setAfterPreview(result)
        })
        .catch(() => { })
        .finally(() => {
          if (id === selectedIdRef.current) setAfterLoading(false)
        })
    }, 350)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options])

  const healthScore = useMemo(() => {
    if (!selected) return 0
    let score = selected.quality_score ?? 0
    if (options.remove_duplicates) score += 3
    if (options.null_strategy !== 'ignore') score += 2
    if (options.remove_empty_columns) score += 1
    return Math.round(Math.min(100, score))
  }, [options, selected])

  const qualityMetrics = useMemo(() => {
    const rowCount = selected?.row_count ?? 0
    const colCount = selected?.column_count ?? 0
    const nulls = selected?.null_count ?? 0
    const dups = selected?.duplicate_count ?? 0

    const dupPct = rowCount > 0 ? (dups / rowCount) * 100 : 0
    const nullPct = rowCount > 0 && colCount > 0 ? (nulls / (rowCount * colCount)) * 100 : 0
    const cells = rowCount * colCount
    const cleanCells = cells > 0 ? cells - nulls : 0
    const coveragePct = cells > 0 ? (cleanCells / cells) * 100 : 0

    const dateColumns = (selected?.columns_summary ?? []).filter((c) =>
      /date|datetime|timestamp/i.test(c.dtype)
    )
    const hasDates = dateColumns.length > 0
    const dateAvgNullPct = dateColumns.length > 0
      ? dateColumns.reduce((sum, c) => sum + (c.null_pct ?? 0), 0) / dateColumns.length
      : 0

    return {
      dupPct,
      nullPct,
      coveragePct,
      hasDates,
      dateAvgNullPct,
      dateStatus: !hasDates
        ? 'Sin columnas de fecha detectadas'
        : dateAvgNullPct > 5
          ? 'Requiere revisión'
          : 'Formato correcto',
      dateOk: !hasDates || dateAvgNullPct <= 5,
    }
  }, [selected])

  const cleanedCounts = useMemo(() => {
    const s = afterPreview?.summary
    return {
      duplicates: s?.duplicatesRemoved ?? 0,
      emptyRows: s?.emptyRowsRemoved ?? 0,
      nulls: s?.nullsFilled ?? 0,
      columns: s?.columnsRemoved.length ?? 0,
    }
  }, [afterPreview])

  const applyCleaning = async () => {
    if (!selected) return
    setApplying(true)
    setCleanError(null)
    setCleanSummary(undefined)
    setCleanModal({ status: 'processing', progress: 0 })

    // Simula el avance de la barra mientras la API responde. La API resuelve
    // de una sola vez, así que el progreso es informativo: sube hasta ~90% y
    // el 100% se asigna recién cuando termina de verdad.
    let progress = 0
    const ticker = window.setInterval(() => {
      progress = Math.min(90, progress + 8 + Math.round(Math.random() * 10))
      setCleanModal((m) => (m && m.status === 'processing' ? { ...m, progress } : m))
    }, 260)

    try {
      const result = await applyCleanDataset(selected.id, options)
      window.clearInterval(ticker)
      setAfterPreview(result)
      setCleanSummary(result.summary)
      setCleanModal({ status: 'success', progress: 100 })
      setApplying(false)
      // El backend ya recalculó calidad/estado; refrescamos la lista del padre
      // para que la tabla y el resto del dashboard lo reflejen ya.
      onCleaned?.()
    } catch (err) {
      window.clearInterval(ticker)
      setCleanError(err instanceof Error ? err.message : 'No se pudo aplicar la limpieza')
      setCleanModal({ status: 'error', progress })
      setApplying(false)
    }
  }

  if (loading && datasets.length === 0) return <div className="cleaning-loading">Cargando archivos…</div>

  return (
    <div className="cleaning-page">
      {selected && (
        <section className="cleaning-health panel-card cleaning-right-card cleaning-top-preview">
          <div className="cleaning-tabs">
            <button
              type="button"
              className={`cleaning-tab ${rightTab === 'preview' ? 'active' : ''}`}
              onClick={() => setRightTab('preview')}
            >
              <Table2 size={15} /> Vista Previa de Datos
            </button>
            <button
              type="button"
              className={`cleaning-tab ${rightTab === 'health' ? 'active' : ''}`}
              onClick={() => setRightTab('health')}
            >
              <Activity size={15} /> Diagnóstico de Salud
            </button>
          </div>

          <div className="cleaning-tab-body">
            {rightTab === 'preview' ? (
              <div className="cleaning-preview-tab">
                <div className="cleaning-mode-toggle" role="group" aria-label="Modo de vista previa">
                  <button
                    type="button"
                    className={`preview-mode-btn ${previewMode === 'original' ? 'active' : ''}`}
                    onClick={() => setPreviewMode('original')}
                  >
                    Original (Antes)
                  </button>
                  <button
                    type="button"
                    className={`preview-mode-btn ${previewMode === 'cleaned' ? 'active' : ''}`}
                    onClick={() => setPreviewMode('cleaned')}
                  >
                    Limpio (Después)
                    {afterLoading && <span className="preview-mode-dot" />}
                  </button>
                </div>

                <div className="preview-table-wrap preview-table-full">
                  {previewMode === 'original' ? (
                    <FullPreviewTable preview={beforePreview} loading={previewLoading} />
                  ) : (
                    <FullPreviewTable preview={afterPreview} loading={previewLoading || afterLoading} diffAgainst={previewMode === 'cleaned' ? beforePreview : null} />
                  )}
                </div>

                {(previewMode === 'cleaned' && (cleanedCounts.duplicates > 0 || cleanedCounts.emptyRows > 0 || cleanedCounts.nulls > 0 || cleanedCounts.columns > 0)) && (
                  <div className="cleaning-summary">
                    {cleanedCounts.duplicates > 0 && <span>{cleanedCounts.duplicates} duplicados</span>}
                    {cleanedCounts.emptyRows > 0 && <span>{cleanedCounts.emptyRows} filas vacías</span>}
                    {cleanedCounts.nulls > 0 && <span>{cleanedCounts.nulls} nulos</span>}
                    {cleanedCounts.columns > 0 && <span>{cleanedCounts.columns} columnas</span>}
                  </div>
                )}
              </div>
            ) : (
              <div className="cleaning-health-tab">
                <div className="health-ring-wrap">
                  <HealthScoreRing score={healthScore} />
                  <div className="health-ring-caption">
                    <span>{healthScore >= 80 ? 'Datos saludables' : healthScore >= 50 ? 'Mejorable' : 'Requiere atención'}</span>
                  </div>
                </div>

                <div className="health-metric-grid">
                  <div className="health-metric">
                    <div className="health-metric-label">
                      <span>Filas duplicadas</span>
                      <strong>{qualityMetrics.dupPct.toFixed(1)}%</strong>
                    </div>
                    <div className="health-metric-bar">
                      <span className={`health-metric-fill ${qualityMetrics.dupPct <= 1 ? 'ok' : qualityMetrics.dupPct < 5 ? 'warn' : 'bad'}`} style={{ width: `${Math.min(100, qualityMetrics.dupPct * 3)}%` }} />
                    </div>
                  </div>

                  <div className="health-metric">
                    <div className="health-metric-label">
                      <span>Valores nulos detectados</span>
                      <strong>{qualityMetrics.nullPct.toFixed(1)}%</strong>
                    </div>
                    <div className="health-metric-bar">
                      <span className={`health-metric-fill ${qualityMetrics.nullPct <= 2 ? 'ok' : qualityMetrics.nullPct < 8 ? 'warn' : 'bad'}`} style={{ width: `${Math.min(100, qualityMetrics.nullPct * 3)}%` }} />
                    </div>
                  </div>

                  <div className="health-metric">
                    <div className="health-metric-label">
                      <span>Cobertura de celdas</span>
                      <strong>{qualityMetrics.coveragePct.toFixed(1)}%</strong>
                    </div>
                    <div className="health-metric-bar">
                      <span className={`health-metric-fill healthy ${qualityMetrics.coveragePct >= 98 ? 'ok' : qualityMetrics.coveragePct >= 92 ? 'warn' : 'bad'}`} style={{ width: `${qualityMetrics.coveragePct}%` }} />
                    </div>
                  </div>

                  <div className="health-metric">
                    <div className="health-metric-label">
                      <span>Formato de fechas</span>
                      <strong>{qualityMetrics.dateStatus}</strong>
                    </div>
                    <div className="health-metric-bar health-metric-bar-static">
                      <span className={`health-metric-fill ${qualityMetrics.dateOk ? 'ok' : 'bad'}`} style={{ width: qualityMetrics.dateOk ? '100%' : '35%' }} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="cleaning-workspace">
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
            <div className="cleaning-file-list">
              {datasets.map((d) => (
                <button
                  key={d.id}
                  type="button"
                  className={`cleaning-file-row ${selected?.id === d.id ? 'selected' : ''}`}
                  onClick={() => setSelectedId(d.id)}
                >
                  <div className="cleaning-file-main">
                    <strong className="cleaning-file-name" title={d.file_name}>{d.file_name}</strong>
                    <span className="cleaning-file-meta">
                      {d.row_count.toLocaleString('es-PE')} filas · {d.column_count} columnas
                    </span>
                  </div>
                  <div className="cleaning-file-side">
                    <span className="quality-badge">{d.quality_score}%</span>
                    <span className={`status-pill ${statusDisplay(d).pillClass}`}><CheckCircle2 size={12} />{statusDisplay(d).label}</span>
                    <span className="cleaning-file-date">{formatDate(d.created_at)}</span>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selected && (
            <div className="cleaning-export-bar">
              <button className="btn btn-outline" disabled={!afterPreview?.rows.length} onClick={() => downloadCsv(afterPreview, selected.file_name)}><Download size={15} /> Descargar CSV limpio</button>
              <button className="btn btn-ghost" disabled={!afterPreview?.rows.length} onClick={() => downloadCsv(afterPreview, selected.file_name.replace(/\.[^.]+$/, '.xlsx'))}>Descargar Excel limpio</button>
            </div>
          )}
        </section>

        {selected && (
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
            <button className="btn btn-primary btn-block cleaning-apply" onClick={applyCleaning} disabled={applying || cleanModal?.status === 'processing'}>
              <WandSparkles size={16} /> {applying ? 'Aplicando…' : 'Aplicar limpieza'}
            </button>
            <button className="btn btn-ghost btn-block" onClick={() => setHistoryOpen(true)}>
              <History size={15} /> Ver historial de limpieza
            </button>
          </section>
        )}
      </div>

      {historyOpen && (
        <CleaningHistoryModal datasets={datasets} onClose={() => setHistoryOpen(false)} />
      )}

      {cleanModal && (
        <CleaningModal
          status={cleanModal.status}
          progress={cleanModal.progress}
          fileName={selected?.file_name ?? ''}
          summary={cleanSummary}
          errorMessage={cleanError ?? undefined}
          onViewDataset={() => setCleanModal(null)}
          onClose={() => setCleanModal(null)}
        />
      )}
    </div>
  )
}

function cellText(value: unknown) {
  return value === null || value === undefined || value === '' ? '—' : String(value)
}

/** Tabla de preview a ancho completo. Si recibe `diffAgainst`, resalta las
 * celdas cuyo valor cambió respecto a esa otra preview (misma fila/columna),
 * para que la limpieza se vea clara aunque el texto renderizado ("—") sea
 * igual en ambos casos. */
function FullPreviewTable({ preview, loading, diffAgainst }: { preview: DatasetPreview | null; loading: boolean; diffAgainst?: DatasetPreview | null }) {
  if (loading) return <div className="preview-empty">Cargando…</div>
  if (!preview || preview.columns.length === 0) return <div className="preview-empty">Sin vista previa disponible</div>
  const columns = preview.columns
  return (
    <div className="preview-table-scroll">
      <table className="data-table">
        <thead>
          <tr>{columns.map((c) => <th key={c}>{c}</th>)}</tr>
        </thead>
        <tbody>
          {preview.rows.map((row, i) => (
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
