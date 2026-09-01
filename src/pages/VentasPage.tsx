import { useEffect, useRef, useState } from 'react'
import { TrendingUp, Users, GitCompareArrows, UploadCloud, Loader2, DollarSign, Receipt, Award, ArrowUpRight, ArrowDownRight } from 'lucide-react'
import SalesAreaChart from '../components/dashboard/SalesAreaChart'
import CleanedDataChartCard from '../components/dashboard/CleanedDataChartCard'
import EmptyState from '../components/dashboard/EmptyState'
import StatCard from '../components/dashboard/StatCard'
import { compareDataset, getSalesSummaryForDataset, type CompareResult, type Dataset, type SalesSummary } from '../lib/api'

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

    const activeId = selectedId || datasets[0]?.id || ''

    useEffect(() => {
        if (!activeId) return
        setLoadingSummary(true)
        setSummaryError(null)
        getSalesSummaryForDataset(activeId)
            .then(setSummary)
            .catch((err) => {
                setSummary(null)
                setSummaryError(err instanceof Error ? err.message : 'No se pudo calcular el resumen de ventas')
            })
            .finally(() => setLoadingSummary(false))
    }, [activeId])

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
                {summary && <SalesAreaChart monthly={summary.monthly} />}
                <CleanedDataChartCard datasets={datasets} selectedId={activeId} refreshKey={datasets.length} />
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

    const handleCompare = async () => {
        if (!selectedDatasetId || !file) {
            setError('Selecciona tu archivo y sube el CSV de la otra farmacia.')
            return
        }
        setLoading(true)
        setError(null)
        setResult(null)
        try {
            const data = await compareDataset(selectedDatasetId, file)
            setResult(data)
        } catch (err) {
            setError(err instanceof Error ? err.message : 'No se pudo comparar el archivo')
        } finally {
            setLoading(false)
        }
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
                        onChange={(e) => setFile(e.target.files?.[0] ?? null)}
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
                        <ul className="ventas-recommendation-list">
                            {result.recommendations.map((rec) => (
                                <li key={rec.column} className={rec.impact_pct && rec.impact_pct > 0 ? 'positive' : ''}>
                                    <div className="ventas-recommendation-header">
                                        <strong>{rec.column}</strong>
                                        {rec.impact_pct !== null && (
                                            <span className={`status-badge ${rec.impact_pct > 0 ? 'success' : ''}`}>
                                                {rec.impact_pct > 0 ? '+' : ''}
                                                {rec.impact_pct}% ventas
                                            </span>
                                        )}
                                    </div>
                                    <p>{rec.message}</p>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            )}
        </div>
    )
}