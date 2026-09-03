import { useEffect, useMemo, useRef, useState } from 'react'
import { TrendingUp, Users, GitCompareArrows, UploadCloud, Loader2, DollarSign, Receipt, Award, ArrowUpRight, ArrowDownRight, Sparkles, X } from 'lucide-react'
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
]

interface VentasPageProps {
    datasets: Dataset[]
    /** Submódulos visibles (para el rol analyst, controlado desde Ajustes). */
    visibleSubmodules: VentasSubmodule[]
}

export default function VentasPage({ datasets, visibleSubmodules }: VentasPageProps) {
    // "Comparación" ya no es una pestaña propia: vive dentro de "Resumen de
    // ventas". El permiso (Ajustes → Permisos del analista) sigue
    // controlando si esa sección se muestra o no.
    const subtabs = ALL_SUBTABS.filter((tab) => visibleSubmodules.includes(tab.key))
    const canCompare = visibleSubmodules.includes('comparacion')
    // Si el analista solo tiene permiso de "Comparación" (sin "Resumen"),
    // igual necesita un lugar donde verla — cae en la vista de Resumen
    // aunque esa pestaña no aparezca en el menú.
    const showResumenContent = subtabs.some((t) => t.key === 'resumen') || (canCompare && subtabs.length === 0)
    const [activeSub, setActiveSub] = useState<VentasSubmodule>(subtabs[0]?.key ?? 'resumen')

    // CSV seleccionado, compartido entre las sub-pestañas: si lo cambias
    // en una, se mantiene al pasar a las otras (antes cada pestaña tenía su
    // propio estado y se perdía la selección al cambiar de tab).
    const [selectedDatasetId, setSelectedDatasetId] = useState('')
    const activeDatasetId = selectedDatasetId || datasets[0]?.id || ''

    // KPIs recalculados en memoria a partir de la tabla temporal de
    // "Comparar con otra farmacia" (cuando el analista agregó columnas
    // como 'oferta'). Vive en ESTE componente (no en VentasResumen) a
    // propósito: así sobrevive si el analista cambia entre las
    // sub-pestañas "Resumen de ventas" / "Clientes" y vuelve — solo se
    // pierde con un refresh real de la página (F5), nunca se guarda en
    // el servidor.
    const [enrichedSummary, setEnrichedSummary] = useState<SalesSummary | null>(null)
    const [projectedImpactPct, setProjectedImpactPct] = useState<number | null>(null)

    if (subtabs.length === 0 && !canCompare) {
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
            {subtabs.length > 0 && (
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
            )}

            {activeSub === 'resumen' && showResumenContent && (
                <VentasResumen
                    datasets={datasets}
                    selectedId={activeDatasetId}
                    onSelectId={setSelectedDatasetId}
                    canCompare={canCompare}
                    enrichedSummary={enrichedSummary}
                    onEnrichedSummaryChange={setEnrichedSummary}
                    projectedImpactPct={projectedImpactPct}
                    onProjectedImpactPctChange={setProjectedImpactPct}
                />
            )}
            {activeSub === 'clientes' && (
                <VentasClientes datasets={datasets} selectedId={activeDatasetId} onSelectId={setSelectedDatasetId} />
            )}
        </div>
    )
}

interface VentasSubProps {
    datasets: Dataset[]
    selectedId: string
    onSelectId: (id: string) => void
}

interface VentasResumenProps extends VentasSubProps {
    canCompare: boolean
    enrichedSummary: SalesSummary | null
    onEnrichedSummaryChange: (summary: SalesSummary | null) => void
    projectedImpactPct: number | null
    onProjectedImpactPctChange: (pct: number | null) => void
}

function VentasResumen({
    datasets,
    selectedId,
    onSelectId,
    canCompare,
    enrichedSummary,
    onEnrichedSummaryChange,
    projectedImpactPct,
    onProjectedImpactPctChange,
}: VentasResumenProps) {
    const [summary, setSummary] = useState<SalesSummary | null>(null)
    const [summaryError, setSummaryError] = useState<string | null>(null)
    const [loadingSummary, setLoadingSummary] = useState(false)

    // `summary` = KPIs reales del dataset guardado. `enrichedSummary` = KPIs
    // recalculados en memoria sobre la tabla temporal — vive un nivel arriba
    // (en VentasPage) para sobrevivir a cambios de sub-pestaña. displaySummary
    // muestra siempre el mismo valor total_sales que `summary` (agregar
    // columnas no cambia filas ni montos existentes) — lo único que cambia
    // realmente es `projectedTotal`, la proyección basada en el impacto
    // histórico medido en "Comparar con otra farmacia".
    const displaySummary = enrichedSummary ?? summary
    const projectedTotal =
        projectedImpactPct != null && displaySummary ? displaySummary.total_sales * (1 + projectedImpactPct / 100) : null
    const projectedTicket =
        projectedImpactPct != null && displaySummary ? displaySummary.avg_ticket * (1 + projectedImpactPct / 100) : null

    // Gráfico de barras y "Tendencia mensual" proyectados: se escala cada
    // mes por el mismo factor (1 + impacto%). Esto es solo para
    // visualización en memoria — no cambia `summary.monthly` original. Ojo:
    // como el factor es el mismo para todos los meses, la variación
    // porcentual entre un mes y el anterior (trend_pct) NO cambia — escalar
    // ambos meses por igual no altera la razón entre ellos. Es matemática,
    // no un bug.
    // useMemo es importante aquí: sin él, este array se recreaba en CADA
    // render de VentasResumen (incluyendo abrir el modal de comparación,
    // escribir en el input de archivo, activar/desactivar un switch, etc.),
    // lo que rompía la memoización de SalesAreaChart de abajo y hacía que
    // el gráfico (Recharts/ResponsiveContainer) se volviera a montar y
    // recalcular en cada tecla — el "lag" al usar el modal de comparar.
    const projectedMonthly = useMemo(() => {
        if (projectedImpactPct == null || !summary) return null
        return summary.monthly.map((m) => ({ month: m.month, total: m.total * (1 + projectedImpactPct / 100) }))
    }, [summary, projectedImpactPct])
    const projectedTrendPct = useMemo(() => {
        if (!projectedMonthly || projectedMonthly.length < 2) return null
        const last = projectedMonthly[projectedMonthly.length - 1].total
        const prev = projectedMonthly[projectedMonthly.length - 2].total
        if (prev === 0) return null
        return Math.round(((last - prev) / prev) * 1000) / 10
    }, [projectedMonthly])
    const displayTrendPct = projectedImpactPct != null ? projectedTrendPct : displaySummary?.trend_pct ?? null

    // Periodo actual visto en "Evolución de Ventas" (null = vista general de
    // todos los meses). La dona de categorías se recalcula cada vez que
    // cambia, para reflejar siempre lo que el usuario está mirando.
    const [period, setPeriod] = useState<{ month: string | null; day: string | null }>({ month: null, day: null })
    const [categories, setCategories] = useState<{ name: string; total: number }[] | null>(null)
    const [loadingCategories, setLoadingCategories] = useState(false)

    // Estado del flujo de "Comparar con otra farmacia". Vive aquí (y no
    // dentro del modal) para que los switches y la tabla puedan seguir
    // mostrándose debajo de los KPI incluso con el modal cerrado.
    const [compareModalOpen, setCompareModalOpen] = useState(false)
    const [compareFile, setCompareFile] = useState<File | null>(null)
    const [compareLoading, setCompareLoading] = useState(false)
    const [compareError, setCompareError] = useState<string | null>(null)
    const [compareResult, setCompareResult] = useState<CompareResult | null>(null)
    const [joinKey, setJoinKey] = useState('')
    // `knownColumns`: toda columna que el analista activó alguna vez (se
    // queda en la lista de switches aunque la desactive). `addedColumns`:
    // subconjunto actualmente activo, el que realmente se cruza en la tabla.
    const [knownColumns, setKnownColumns] = useState<string[]>([])
    const [addedColumns, setAddedColumns] = useState<string[]>([])
    const [enriched, setEnriched] = useState<EnrichedPreview | null>(null)
    const [enrichLoading, setEnrichLoading] = useState(false)
    const [enrichError, setEnrichError] = useState<string | null>(null)
    const compareInputRef = useRef<HTMLInputElement>(null)

    const activeId = selectedId || datasets[0]?.id || ''
    const activeDataset = datasets.find((d) => d.id === activeId)

    useEffect(() => {
        if (!activeId) return
        setLoadingSummary(true)
        setSummaryError(null)
        setPeriod({ month: null, day: null })
        onEnrichedSummaryChange(null)
        onProjectedImpactPctChange(null)
        setCompareFile(null)
        setCompareResult(null)
        setCompareError(null)
        setJoinKey('')
        setKnownColumns([])
        setAddedColumns([])
        setEnriched(null)
        getSalesSummaryForDataset(activeId)
            .then(setSummary)
            .catch((err) => {
                setSummary(null)
                setSummaryError(err instanceof Error ? err.message : 'No se pudo calcular el resumen de ventas')
            })
            .finally(() => setLoadingSummary(false))
    }, [activeId])

    // Recalcula la dona de categorías cada vez que cambia el dataset, el
    // periodo elegido en "Evolución de Ventas", o el % de proyección
    // activo (para que la dona quede consistente con las barras y las
    // StatCard de arriba).
    useEffect(() => {
        if (!activeId || !summary?.category_column) {
            setCategories(null)
            return
        }
        setLoadingCategories(true)
        getSalesPeriodBreakdown(activeId, period.month ?? undefined, period.day ?? undefined)
            .then((res) => {
                const cats =
                    projectedImpactPct != null && res.categories
                        ? res.categories.map((c) => ({ ...c, total: c.total * (1 + projectedImpactPct / 100) }))
                        : res.categories
                setCategories(cats)
            })
            .catch(() => setCategories(null))
            .finally(() => setLoadingCategories(false))
    }, [activeId, period, summary?.category_column, projectedImpactPct])

    const handleCompare = async () => {
        if (!activeId || !compareFile) {
            setCompareError('Selecciona tu archivo y sube el CSV de la otra farmacia.')
            return
        }
        setCompareLoading(true)
        setCompareError(null)
        setCompareResult(null)
        setJoinKey('')
        setKnownColumns([])
        setAddedColumns([])
        setEnriched(null)
        onEnrichedSummaryChange(null)
        onProjectedImpactPctChange(null)
        try {
            const data = await compareDataset(activeId, compareFile)
            setCompareResult(data)
            setJoinKey(data.join_key_candidates[0]?.column ?? '')
        } catch (err) {
            setCompareError(err instanceof Error ? err.message : 'No se pudo comparar el archivo')
        } finally {
            setCompareLoading(false)
        }
    }

    const toggleColumn = (column: string) => {
        setKnownColumns((prev) => (prev.includes(column) ? prev : [...prev, column]))
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

    // Columnas por las que se podría cruzar: primero las candidatas
    // detectadas (con buen % de coincidencia real), y después cualquier
    // otra columna que exista en ambos archivos.
    const otherColumnsLower = new Set((compareResult?.other_columns ?? []).map((c) => c.toLowerCase()))
    const candidateNames = new Set((compareResult?.join_key_candidates ?? []).map((c) => c.column))
    const fallbackSharedColumns = (compareResult?.own_columns ?? []).filter(
        (c) => otherColumnsLower.has(c.toLowerCase()) && !candidateNames.has(c)
    )

    // En tiempo real: cada vez que cambian las columnas activas o la clave
    // elegida, se vuelve a pedir la tabla combinada (debounced), se avisa al
    // padre del nuevo summary en memoria, y se calcula el % de impacto
    // proyectado como el promedio de los impact_pct de las columnas activas.
    useEffect(() => {
        if (!compareResult || !compareFile || addedColumns.length === 0 || !joinKey) {
            setEnriched(null)
            onEnrichedSummaryChange(null)
            onProjectedImpactPctChange(null)
            return
        }
        const activeImpacts = compareResult.recommendations
            .filter((r) => addedColumns.includes(r.column) && r.impact_pct != null)
            .map((r) => r.impact_pct as number)
        const avgImpact =
            activeImpacts.length > 0
                ? Math.round((activeImpacts.reduce((a, b) => a + b, 0) / activeImpacts.length) * 10) / 10
                : null

        setEnrichLoading(true)
        setEnrichError(null)
        const timeout = setTimeout(() => {
            enrichDatasetPreview(activeId, compareFile, joinKey, addedColumns)
                .then((data) => {
                    setEnriched(data)
                    onEnrichedSummaryChange(data.summary)
                    onProjectedImpactPctChange(avgImpact)
                })
                .catch((err) => {
                    setEnriched(null)
                    onEnrichedSummaryChange(null)
                    onProjectedImpactPctChange(null)
                    setEnrichError(err instanceof Error ? err.message : 'No se pudo armar la tabla combinada')
                })
                .finally(() => setEnrichLoading(false))
        }, 300)
        return () => clearTimeout(timeout)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [addedColumns, joinKey])

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
            {(canCompare || datasets.length > 1) && (
                <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, flexWrap: 'wrap' }}>
                    {canCompare && (
                        <button
                            type="button"
                            className="btn btn-outline"
                            onClick={() => setCompareModalOpen(true)}
                            style={{ margin: 0 }}
                        >
                            <GitCompareArrows size={15} /> Comparar con otra farmacia
                        </button>
                    )}
                    {datasets.length > 1 && (
                        <select
                            className="input-field"
                            value={activeId}
                            onChange={(e) => onSelectId(e.target.value)}
                            style={{ width: 'auto', minWidth: 200, padding: '8px 12px', margin: 0 }}
                        >
                            {datasets.map((d) => (
                                <option key={d.id} value={d.id}>
                                    {d.file_name}
                                </option>
                            ))}
                        </select>
                    )}
                    {compareResult && (
                        <span className="settings-row-hint">
                            {compareResult.ownFileName} vs {compareResult.comparedFileName}
                        </span>
                    )}
                </div>
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

            {!loadingSummary && displaySummary && (
                <>
                    {projectedImpactPct != null && (
                        <div className="settings-row-hint" style={{ marginBottom: 8 }}>
                            Proyección en memoria con {projectedImpactPct > 0 ? '+' : ''}
                            {projectedImpactPct}% de impacto histórico — no son datos reales, se pierde al recargar.
                        </div>
                    )}
                    <div className="stat-grid" style={{ marginBottom: 20 }}>
                        <StatCard
                            icon={DollarSign}
                            label="Ventas totales"
                            value={`S/ ${displaySummary.total_sales.toLocaleString('es-PE')}`}
                            hint={
                                projectedTotal != null
                                    ? `proyección: S/ ${projectedTotal.toLocaleString('es-PE', { maximumFractionDigits: 2 })}`
                                    : `columna "${displaySummary.sales_column}"`
                            }
                            tone="amber"
                            trend="up"
                        />
                        <StatCard
                            icon={Receipt}
                            label="Ticket promedio"
                            value={`S/ ${displaySummary.avg_ticket.toLocaleString('es-PE')}`}
                            hint={
                                projectedTicket != null
                                    ? `proyección: S/ ${projectedTicket.toLocaleString('es-PE', { maximumFractionDigits: 2 })}`
                                    : `sobre ${displaySummary.row_count.toLocaleString('es-PE')} ventas`
                            }
                            tone="blue"
                            trend="up"
                        />
                        <StatCard
                            icon={Award}
                            label="Categoría top"
                            value={displaySummary.top_category ? displaySummary.top_category.name : 'N/D'}
                            hint={
                                displaySummary.top_category
                                    ? `S/ ${(
                                        displaySummary.top_category.total * (1 + (projectedImpactPct ?? 0) / 100)
                                    ).toLocaleString('es-PE')}`
                                    : 'sin columna de categoría'
                            }
                            tone="green"
                            trend="up"
                        />
                        <StatCard
                            icon={displayTrendPct != null && displayTrendPct < 0 ? ArrowDownRight : ArrowUpRight}
                            label="Tendencia mensual"
                            value={displayTrendPct != null ? `${displayTrendPct > 0 ? '+' : ''}${displayTrendPct}%` : 'N/D'}
                            hint={displayTrendPct != null ? 'vs. mes anterior' : 'faltan ≥2 meses de datos'}
                            tone="coral"
                            trend={displayTrendPct != null && displayTrendPct < 0 ? 'down' : 'up'}
                        />
                    </div>
                </>
            )}


            <div className="chart-grid">
                {summary && (
                    <SalesAreaChart
                        datasetId={activeId}
                        monthly={projectedMonthly ?? summary.monthly}
                        hasDailyDetail={summary.has_daily_detail}
                        onPeriodChange={setPeriod}
                        projectionFactor={projectedImpactPct != null ? 1 + projectedImpactPct / 100 : null}
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

            {knownColumns.length > 0 && (
                <div className="ventas-enriched-table" style={{ marginBottom: 20 }}>
                    <div className="panel-subtitle" style={{ marginBottom: 8 }}>
                        Columnas de <strong>{compareResult?.comparedFileName ?? 'la otra farmacia'}</strong> — actívalas
                        o desactívalas cuando quieras. Tabla temporal, <strong>nunca se guarda en el sistema</strong>.
                    </div>
                    <div className="ventas-compare-switches">
                        {knownColumns.map((col) => {
                            const active = addedColumns.includes(col)
                            return (
                                <label key={col} className="ventas-compare-switch-row">
                                    <button
                                        type="button"
                                        className={`toggle ${active ? 'on' : ''}`}
                                        onClick={() => toggleColumn(col)}
                                        aria-label={`${active ? 'Desactivar' : 'Activar'} columna ${col}`}
                                        disabled={!joinKey}
                                    >
                                        <span className="toggle-knob" />
                                    </button>
                                    <span>{col}</span>
                                </label>
                            )
                        })}
                    </div>

                    {enrichLoading && (
                        <div className="settings-row-hint" style={{ marginBottom: 8 }}>
                            <Loader2 size={14} className="spin" /> Actualizando tabla…
                        </div>
                    )}
                    {enrichError && <div className="form-alert error">{enrichError}</div>}

                    {enriched && (
                        <>
                            <div className="settings-row-hint" style={{ margin: '8px 0' }}>
                                {enriched.matchedRows} de {enriched.totalRows} filas encontraron coincidencia por "
                                {enriched.joinKey}".
                            </div>
                            <div className="data-table-wrapper ventas-enriched-table-scroll">
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

            {compareModalOpen && (
                <div className="modal-overlay ventas-compare-modal-overlay" onClick={() => setCompareModalOpen(false)}>
                    <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
                        <div className="modal-header">
                            <div>
                                <div className="panel-title" style={{ marginBottom: 2 }}>
                                    Comparar con otra farmacia
                                </div>
                                <div className="panel-subtitle" style={{ marginBottom: 0 }}>
                                    Sube el CSV de otra farmacia/botica para ver qué columnas tienen (por ejemplo
                                    "oferta" o "promoción") que tú no tienes, y si se asocian a mayores ventas. Este
                                    archivo externo <strong>no se guarda en el sistema</strong>.
                                </div>
                            </div>
                            <button
                                type="button"
                                className="modal-close"
                                onClick={() => setCompareModalOpen(false)}
                                aria-label="Cerrar"
                            >
                                <X size={18} />
                            </button>
                        </div>

                        <div className="modal-body">
                            <div className="panel-card ventas-compare-card">
                                <div className="ventas-compare-form">
                                    <label className="settings-input">
                                        <span>Tu dataset (ya limpio)</span>
                                        <select value={activeId} onChange={(e) => onSelectId(e.target.value)}>
                                            <option value="">Selecciona un archivo…</option>
                                            {datasets.map((d) => (
                                                <option key={d.id} value={d.id}>
                                                    {d.file_name}
                                                </option>
                                            ))}
                                        </select>
                                    </label>

                                    <label className="settings-input">
                                        <span>CSV de la otra farmacia</span>
                                        <div
                                            className="settings-input-icon"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => compareInputRef.current?.click()}
                                        >
                                            <UploadCloud size={15} />
                                            <input readOnly value={compareFile ? compareFile.name : 'Haz clic para elegir un archivo…'} />
                                        </div>
                                        <input
                                            ref={compareInputRef}
                                            type="file"
                                            accept=".csv,.xlsx,.xls"
                                            hidden
                                            onChange={(e) => {
                                                setCompareFile(e.target.files?.[0] ?? null)
                                                setCompareResult(null)
                                                setJoinKey('')
                                                setKnownColumns([])
                                                setAddedColumns([])
                                                setEnriched(null)
                                                onEnrichedSummaryChange(null)
                                                onProjectedImpactPctChange(null)
                                            }}
                                        />
                                    </label>

                                    <button
                                        type="button"
                                        className="btn btn-primary ventas-compare-submit"
                                        onClick={handleCompare}
                                        disabled={compareLoading}
                                    >
                                        {compareLoading ? (
                                            <>
                                                <Loader2 size={15} className="spin" /> Comparando…
                                            </>
                                        ) : (
                                            <>
                                                <GitCompareArrows size={15} /> Comparar
                                            </>
                                        )}
                                    </button>
                                </div>

                                {compareError && <div className="form-alert error">{compareError}</div>}

                                {compareResult && (
                                    <div className="ventas-compare-result">
                                        <div className="ventas-compare-summary">
                                            <span>
                                                <strong>{compareResult.ownFileName}</strong> vs{' '}
                                                <strong>{compareResult.comparedFileName}</strong>
                                            </span>
                                            {compareResult.sales_column_detected && (
                                                <span className="status-badge success">
                                                    Columna de ventas detectada: {compareResult.sales_column_detected}
                                                </span>
                                            )}
                                        </div>

                                        {compareResult.extra_columns.length === 0 ? (
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
                                                    <p>{compareResult.executive_summary.headline}</p>
                                                    {compareResult.executive_summary.priority_recommendation && (
                                                        <div className="ventas-executive-summary-action">
                                                            <span className="status-badge success">Acción sugerida</span>
                                                            <p>{compareResult.executive_summary.priority_recommendation.action}</p>
                                                        </div>
                                                    )}
                                                </div>

                                                <ul className="ventas-recommendation-list">
                                                    {compareResult.recommendations.map((rec) => {
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
                                                            {compareResult.join_key_candidates.map((c) => (
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
                                                        {compareResult.join_key_candidates.length === 0 && (
                                                            <div className="settings-row-hint" style={{ marginTop: 4 }}>
                                                                No se detectó una clave con buena coincidencia automáticamente;
                                                                elige tú cuál columna identifica a la misma fila en ambos archivos.
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="modal-footer">
                            <button type="button" className="btn btn-primary" onClick={() => setCompareModalOpen(false)}>
                                Listo
                            </button>
                        </div>
                    </div>
                </div>
            )}
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