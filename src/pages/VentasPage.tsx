import { useEffect, useRef, useState } from 'react'
import { TrendingUp, Users, GitCompareArrows, UploadCloud, Loader2, DollarSign, Receipt, Award, ArrowUpRight, ArrowDownRight, Sparkles } from 'lucide-react'
import SalesAreaChart from '../components/dashboard/SalesAreaChart'
import SalesCategoryDonutChart from '../components/dashboard/SalesCategoryDonutChart'
import CleanedDataChartCard from '../components/dashboard/CleanedDataChartCard'
import EmptyState from '../components/dashboard/EmptyState'
import StatCard from '../components/dashboard/StatCard'
import { compareDataset, enrichDatasetPreview, getSalesSummaryForDataset, getSalesPeriodBreakdown, type CompareResult, type Dataset, type EnrichedPreview, type SalesSummary } from '../lib/api'

export type VentasSubmodule = 'resumen' | 'clientes' | 'comparacion'

interface VentasSubTab {
    key: VentasSubmodule
    label: string
    icon: typeof TrendingUp
}

const ALL_SUBTABS: VentasSubTab[] = [
    { key: 'resumen', label: 'Resumen de ventas', icon: TrendingUp },
    { key: 'clientes', label: 'Clientes', icon: Users },
    { key: 'comparacion', label: 'Comparar con otra farmacia', icon: GitCompareArrows },
]

interface VentasPageProps {
    datasets: Dataset[]
    /** Submódulos visibles (para el rol analyst, controlado desde Ajustes). */
    visibleSubmodules: VentasSubmodule[]
}

export default function VentasPage({ datasets, visibleSubmodules }: VentasPageProps) {
    const subtabs = ALL_SUBTABS.filter((tab) => visibleSubmodules.includes(tab.key))
    const [activeSub, setActiveSub] = useState<VentasSubmodule>(subtabs[0]?.key ?? 'resumen')

    // CSV seleccionado, compartido entre las 3 sub-pestañas: si lo cambias
    // en una, se mantiene al pasar a las otras (antes cada pestaña tenía su
    // propio estado y se perdía la selección al cambiar de tab).
    const [selectedDatasetId, setSelectedDatasetId] = useState('')
    const activeDatasetId = selectedDatasetId || datasets[0]?.id || ''

    if (subtabs.length === 0) {
        return (
            <EmptyState
                icon={TrendingUp}
                title="No tienes acceso a ningún submódulo de Ventas"
                description="Pide al administrador que habilite al menos un submódulo desde Ajustes → Permisos del analista."
            />
        )
    }

    return (
        <div className="ventas-page">
            <div className="ventas-subtabs">
                {subtabs.map((tab) => {
                    const Icon = tab.icon
                    return (
                        <button
                            key={tab.key}
                            className={`ventas-subtab ${activeSub === tab.key ? 'active' : ''}`}
                            onClick={() => setActiveSub(tab.key)}
                            type="button"
                        >
                            <Icon size={15} />
                            {tab.label}
                        </button>
                    )
                })}
            </div>

            {activeSub === 'resumen' && (
                <VentasResumen datasets={datasets} selectedId={activeDatasetId} onSelectId={setSelectedDatasetId} />
            )}
            {activeSub === 'clientes' && (
                <VentasClientes datasets={datasets} selectedId={activeDatasetId} onSelectId={setSelectedDatasetId} />
            )}
            {activeSub === 'comparacion' && (
                <VentasComparacion datasets={datasets} selectedId={activeDatasetId} onSelectId={setSelectedDatasetId} />
            )}
        </div>
    )
}

interface VentasSubProps {
    datasets: Dataset[]
    selectedId: string
    onSelectId: (id: string) => void
}

function VentasResumen({ datasets, selectedId, onSelectId }: VentasSubProps) {
    const [summary, setSummary] = useState<SalesSummary | null>(null)
    const [summaryError, setSummaryError] = useState<string | null>(null)
    const [loadingSummary, setLoadingSummary] = useState(false)

    // Periodo actual visto en "Evolución de Ventas" (null = vista general de
    // todos los meses). La dona de categorías se recalcula cada vez que
    // cambia, para reflejar siempre lo que el usuario está mirando.
    const [period, setPeriod] = useState<{ month: string | null; day: string | null }>({ month: null, day: null })
    const [categories, setCategories] = useState<{ name: string; total: number }[] | null>(null)
    const [loadingCategories, setLoadingCategories] = useState(false)

    const activeId = selectedId || datasets[0]?.id || ''
    const activeDataset = datasets.find((d) => d.id === activeId)

    useEffect(() => {
        if (!activeId) return
        setLoadingSummary(true)
        setSummaryError(null)
        setPeriod({ month: null, day: null })
        getSalesSummaryForDataset(activeId)
            .then(setSummary)
            .catch((err) => {
                setSummary(null)
                setSummaryError(err instanceof Error ? err.message : 'No se pudo calcular el resumen de ventas')
            })
            .finally(() => setLoadingSummary(false))
    }, [activeId])

    // Recalcula la dona de categorías cada vez que cambia el dataset o el
    // periodo elegido en "Evolución de Ventas" (todos los meses, un mes
    // puntual, o un día puntual dentro de ese mes).
    useEffect(() => {
        if (!activeId || !summary?.category_column) {
            setCategories(null)
            return
        }
        setLoadingCategories(true)
        getSalesPeriodBreakdown(activeId, period.month ?? undefined, period.day ?? undefined)
            .then((res) => setCategories(res.categories))
            .catch(() => setCategories(null))
            .finally(() => setLoadingCategories(false))
    }, [activeId, period, summary?.category_column])

    const periodLabel = period.day
        ? new Date(`${period.day}T00:00:00`).toLocaleDateString('es-PE', { day: '2-digit', month: 'short', year: '2-digit' })
        : period.month
            ? new Date(`${period.month}-01T00:00:00`).toLocaleDateString('es-PE', { month: 'long', year: 'numeric' })
            : 'Todos los meses'

    if (datasets.length === 0) {
        return (
            <EmptyState
                icon={TrendingUp}
                title="Todavía no hay datos de ventas"
                description="En cuanto se cargue y limpie al menos un archivo, aquí verás el resumen de ventas."
            />
        )
    }

    return (
        <div>
            {datasets.length > 1 && (
                <select
                    className="input-field"
                    value={activeId}
                    onChange={(e) => onSelectId(e.target.value)}
                    style={{ width: 'auto', minWidth: 200, padding: '8px 12px', marginBottom: 16 }}
                >
                    {datasets.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.file_name}
                        </option>
                    ))}
                </select>
            )}

            {loadingSummary && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)' }}>Calculando…</div>
            )}

            {!loadingSummary && summaryError && (
                <div className="form-alert error" style={{ marginBottom: 20 }}>
                    No se pudo calcular un resumen de ventas para este archivo: {summaryError}. Verifica que tenga
                    una columna reconocible de monto (ventas, monto, importe, total).
                </div>
            )}

            {!loadingSummary && summary && (
                <div className="stat-grid" style={{ marginBottom: 20 }}>
                    <StatCard
                        icon={DollarSign}
                        label="Ventas totales"
                        value={`S/ ${summary.total_sales.toLocaleString('es-PE')}`}
                        hint={`columna "${summary.sales_column}"`}
                        tone="amber"
                        trend="up"
                    />
                    <StatCard
                        icon={Receipt}
                        label="Ticket promedio"
                        value={`S/ ${summary.avg_ticket.toLocaleString('es-PE')}`}
                        hint={`sobre ${summary.row_count.toLocaleString('es-PE')} ventas`}
                        tone="blue"
                        trend="up"
                    />
                    <StatCard
                        icon={Award}
                        label="Categoría top"
                        value={summary.top_category ? summary.top_category.name : 'N/D'}
                        hint={summary.top_category ? `S/ ${summary.top_category.total.toLocaleString('es-PE')}` : 'sin columna de categoría'}
                        tone="green"
                        trend="up"
                    />
                    <StatCard
                        icon={summary.trend_pct != null && summary.trend_pct < 0 ? ArrowDownRight : ArrowUpRight}
                        label="Tendencia mensual"
                        value={summary.trend_pct != null ? `${summary.trend_pct > 0 ? '+' : ''}${summary.trend_pct}%` : 'N/D'}
                        hint={summary.trend_pct != null ? 'vs. mes anterior' : 'faltan ≥2 meses de datos'}
                        tone="coral"
                        trend={summary.trend_pct != null && summary.trend_pct < 0 ? 'down' : 'up'}
                    />
                </div>
            )}

            <div className="chart-grid">
                {summary && (
                    <SalesAreaChart
                        datasetId={activeId}
                        monthly={summary.monthly}
                        hasDailyDetail={summary.has_daily_detail}
                        onPeriodChange={setPeriod}
                    />
                )}
                <SalesCategoryDonutChart
                    categories={categories}
                    loading={loadingCategories}
                    fileName={activeDataset?.file_name}
                    categoryColumnName={summary?.category_column ?? null}
                    periodLabel={periodLabel}
                />
            </div>
        </div>
    )
}

function VentasClientes({ datasets, selectedId, onSelectId }: VentasSubProps) {
    const activeId = selectedId || datasets[0]?.id || ''

    if (datasets.length === 0) {
        return <EmptyState icon={Users} title="Sin datasets todavía" description="Carga un archivo de ventas para ver clientes." />
    }

    return (
        <div>
            <div className="panel-subtitle" style={{ marginBottom: 12 }}>
                Elige un archivo y una columna (nombre, distrito, frecuencia de compra, etc.) para ver cómo se
                distribuyen tus clientes en los datos ya limpios.
            </div>
            {datasets.length > 1 && (
                <select
                    className="input-field"
                    value={activeId}
                    onChange={(e) => onSelectId(e.target.value)}
                    style={{ width: 'auto', minWidth: 200, padding: '8px 12px', marginBottom: 12 }}
                >
                    {datasets.map((d) => (
                        <option key={d.id} value={d.id}>
                            {d.file_name}
                        </option>
                    ))}
                </select>
            )}
            <CleanedDataChartCard datasets={datasets} selectedId={activeId} refreshKey={datasets.length} />
        </div>
    )
}

function VentasComparacion({ datasets, selectedId, onSelectId }: VentasSubProps) {
    const selectedDatasetId = selectedId || datasets[0]?.id || ''
    const [file, setFile] = useState<File | null>(null)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [result, setResult] = useState<CompareResult | null>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    // Tabla temporal: columnas que el analista eligió "traer" del CSV
    // externo, cruzadas por una clave en común (ej. cliente_id). Nada de
    // esto se guarda — se recalcula en memoria cada vez que cambia algo.
    const [joinKey, setJoinKey] = useState('')
    const [addedColumns, setAddedColumns] = useState<string[]>([])
    const [enriched, setEnriched] = useState<EnrichedPreview | null>(null)
    const [enrichLoading, setEnrichLoading] = useState(false)
    const [enrichError, setEnrichError] = useState<string | null>(null)

    const handleCompare = async () => {
        if (!selectedDatasetId || !file) {
            setError('Selecciona tu archivo y sube el CSV de la otra farmacia.')
            return
        }
        setLoading(true)
        setError(null)
        setResult(null)
        setAddedColumns([])
        setEnriched(null)
        try {
            const data = await compareDataset(selectedDatasetId, file)
            setResult(data)
            setJoinKey(data.join_key_candidates[0]?.column ?? '')
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo comparar el archivo')
        } finally {
            setLoading(false)
        }
    }

    // Columnas por las que se podría cruzar: primero las candidatas
    // detectadas (con buen % de coincidencia real), y después cualquier
    // otra columna que exista en ambos archivos, por si el sistema no
    // encontró una candidata fuerte y el analista quiere elegir a mano.
    const otherColumnsLower = new Set((result?.other_columns ?? []).map((c) => c.toLowerCase()))
    const candidateNames = new Set((result?.join_key_candidates ?? []).map((c) => c.column))
    const fallbackSharedColumns = (result?.own_columns ?? []).filter(
        (c) => otherColumnsLower.has(c.toLowerCase()) && !candidateNames.has(c)
    )

    // En tiempo real: cada vez que cambian las columnas agregadas o la
    // clave elegida, se vuelve a pedir la tabla combinada (debounced).
    useEffect(() => {
        if (!result || !file || addedColumns.length === 0 || !joinKey) {
            setEnriched(null)
            return
        }
        setEnrichLoading(true)
        setEnrichError(null)
        const timeout = setTimeout(() => {
            enrichDatasetPreview(selectedDatasetId, file, joinKey, addedColumns)
                .then(setEnriched)
                .catch((err) => {
                    setEnriched(null)
                    setEnrichError(err instanceof Error ? err.message : 'No se pudo armar la tabla combinada')
                })
                .finally(() => setEnrichLoading(false))
        }, 300)
        return () => clearTimeout(timeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addedColumns, joinKey])

    const toggleColumn = (column: string) => {
        setAddedColumns((prev) => (prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]))
    }

    const downloadEnrichedCsv = () => {
        if (!enriched?.rows.length) return
        const escape = (value: unknown) => `"${String(value ?? '').replace(/"/g, '""')}"`
        const csv = [enriched.columns, ...enriched.rows.map((row) => enriched.columns.map((c) => row[c]))]
            .map((r) => r.map(escape).join(','))
            .join('\n')
        const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }))
        const link = Object.assign(document.createElement('a'), { href: url, download: 'tabla-temporal.csv' })
        link.click()
        URL.revokeObjectURL(url)
    }

    return (
        <div className="panel-card">
            <div className="panel-title">Comparar con otra farmacia del mismo rubro</div>
            <div className="panel-subtitle">
                Sube el CSV de otra farmacia/botica para ver qué columnas tienen (por ejemplo "oferta" o "promoción")
                que tú no tienes, y si esas columnas se asocian a mayores ventas. Este archivo externo{' '}
                <strong>no se guarda en el sistema</strong>: se analiza en memoria y se descarta al mostrar el resultado.
            </div>

            <div className="settings-form-grid" style={{ marginTop: 16 }}>
                <label className="settings-input settings-input-wide">
                    <span>Tu dataset (ya limpio)</span>
                    <select value={selectedDatasetId} onChange={(e) => onSelectId(e.target.value)}>
                        <option value="">Selecciona un archivo…</option>
                        {datasets.map((d) => (
                            <option key={d.id} value={d.id}>
                                {d.file_name}
                            </option>
                        ))}
                    </select>
                </label>

                <label className="settings-input settings-input-wide">
                    <span>CSV de la otra farmacia</span>
                    <div className="settings-input-icon" style={{ cursor: 'pointer' }} onClick={() => inputRef.current?.click()}>
                        <UploadCloud size={15} />
                        <input readOnly value={file ? file.name : 'Haz clic para elegir un archivo…'} />
                    </div>
                    <input
                        ref={inputRef}
                        type="file"
                        accept=".csv,.xlsx,.xls"
                        hidden
                        onChange={(e) => {
                            setFile(e.target.files?.[0] ?? null)
                            setResult(null)
                            setAddedColumns([])
                            setEnriched(null)
                        }}
                    />
                </label>
            </div>

            {error && <div className="form-alert error">{error}</div>}

            <button type="button" className="btn btn-primary" style={{ marginTop: 12 }} onClick={handleCompare} disabled={loading}>
                {loading ? (
                    <>
                        <Loader2 size={15} className="spin" /> Comparando…
                    </>
                ) : (
                    'Comparar y ver recomendación'
                )}
            </button>

            {result && (
                <div className="ventas-compare-result">
                    <div className="ventas-compare-summary">
                        <span>
                            <strong>{result.ownFileName}</strong> vs <strong>{result.comparedFileName}</strong>
                        </span>
                        {result.sales_column_detected && (
                            <span className="status-badge success">Columna de ventas detectada: {result.sales_column_detected}</span>
                        )}
                    </div>

                    {result.extra_columns.length === 0 ? (
                        <EmptyState
                            icon={GitCompareArrows}
                            title="No hay columnas nuevas"
                            description="La otra farmacia no tiene columnas que tú no tengas ya."
                        />
                    ) : (
                        <>
                            <div className="ventas-executive-summary">
                                <div className="ventas-executive-summary-title">
                                    <Sparkles size={15} />
                                    Resumen ejecutivo
                                </div>
                                <p>{result.executive_summary.headline}</p>
                                {result.executive_summary.priority_recommendation && (
                                    <div className="ventas-executive-summary-action">
                                        <span className="status-badge success">Acción sugerida</span>
                                        <p>{result.executive_summary.priority_recommendation.action}</p>
                                    </div>
                                )}
                            </div>

                            <ul className="ventas-recommendation-list">
                                {result.recommendations.map((rec) => {
                                    const added = addedColumns.includes(rec.column)
                                    return (
                                        <li key={rec.column} className={rec.impact_pct && rec.impact_pct > 0 ? 'positive' : ''}>
                                            <div className="ventas-recommendation-header">
                                                <strong>{rec.column}</strong>
                                                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                                                    <span
                                                        className={`priority-badge priority-${rec.priority}`}
                                                        title="Prioridad de incorporar esta columna"
                                                    >
                                                        {rec.priority === 'alta' && 'Prioridad alta'}
                                                        {rec.priority === 'media' && 'Prioridad media'}
                                                        {rec.priority === 'baja' && 'Prioridad baja'}
                                                    </span>
                                                    {rec.impact_pct !== null && (
                                                        <span className={`status-badge ${rec.impact_pct > 0 ? 'success' : ''}`}>
                                                            {rec.impact_pct > 0 ? '+' : ''}
                                                            {rec.impact_pct}% ventas
                                                        </span>
                                                    )}
                                                    <button
                                                        type="button"
                                                        className={`btn ${added ? 'btn-outline' : 'btn-primary'}`}
                                                        style={{ padding: '4px 10px', fontSize: 12 }}
                                                        onClick={() => toggleColumn(rec.column)}
                                                        disabled={!joinKey}
                                                    >
                                                        {added ? 'Quitar de mi tabla' : 'Agregar a mi tabla'}
                                                    </button>
                                                </div>
                                            </div>
                                            <p>{rec.message}</p>
                                        </li>
                                    )
                                })}
                            </ul>

                            {addedColumns.length > 0 && (
                                <div className="settings-input settings-input-wide" style={{ marginTop: 4, maxWidth: 320 }}>
                                    <span>Cruzar filas usando la columna</span>
                                    <select value={joinKey} onChange={(e) => setJoinKey(e.target.value)}>
                                        <option value="">Elige una columna clave…</option>
                                        {result.join_key_candidates.map((c) => (
                                            <option key={c.column} value={c.column}>
                                                {c.column} ({c.match_pct}% de coincidencia)
                                            </option>
                                        ))}
                                        {fallbackSharedColumns.map((c) => (
                                            <option key={c} value={c}>
                                                {c}
                                            </option>
                                        ))}
                                    </select>
                                    {result.join_key_candidates.length === 0 && (
                                        <div className="settings-row-hint" style={{ marginTop: 4 }}>
                                            No se detectó una clave con buena coincidencia automáticamente; elige tú
                                            cuál columna identifica a la misma fila en ambos archivos.
                                        </div>
                                    )}
                                </div>
                            )}
                        </>
                    )}
                </div>
            )}

            {addedColumns.length > 0 && (
                <div className="ventas-enriched-table" style={{ marginTop: 20 }}>
                    <div className="panel-subtitle" style={{ marginBottom: 8 }}>
                        Tabla temporal — se arma en memoria con cada cambio y{' '}
                        <strong>nunca se guarda en el sistema</strong>. Útil para datos de vida corta (ofertas de un
                        día, promociones puntuales).
                    </div>

                    {enrichLoading && (
                        <div className="settings-row-hint">
                            <Loader2 size={14} className="spin" /> Actualizando tabla…
                        </div>
                    )}
                    {enrichError && <div className="form-alert error">{enrichError}</div>}

                    {enriched && !enrichLoading && (
                        <>
                            <div className="settings-row-hint" style={{ marginBottom: 8 }}>
                                {enriched.matchedRows} de {enriched.totalRows} filas encontraron coincidencia por "
                                {enriched.joinKey}".
                            </div>
                            <div className="data-table-wrapper">
                                <table className="data-table">
                                    <thead>
                                        <tr>
                                            {enriched.columns.map((c) => (
                                                <th key={c} className={enriched.addedColumns.includes(c) ? 'ventas-added-col' : ''}>
                                                    {c}
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {enriched.rows.map((row, i) => (
                                            <tr key={i}>
                                                {enriched.columns.map((c) => (
                                                    <td key={c}>{String(row[c] ?? '—')}</td>
                                                ))}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className="panel-subtitle" style={{ marginTop: 8, marginBottom: 0 }}>
                                Mostrando {enriched.rows.length.toLocaleString('es-PE')} de{' '}
                                {enriched.totalRows.toLocaleString('es-PE')} filas.{' '}
                                <button type="button" className="link-btn" onClick={downloadEnrichedCsv}>
                                    Descargar CSV
                                </button>
                            </div>
                        </>
                    )}
                </div>
            )}
        </div>
    )
}