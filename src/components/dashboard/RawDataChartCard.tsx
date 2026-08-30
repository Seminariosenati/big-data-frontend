import { useEffect, useState } from 'react'
import { getRawChartColumnsForDataset, getRawChartColumnDataForDataset, type ChartColumn, type ChartColumnData, type Dataset } from '../../lib/api'
import ColumnChart from './ColumnChart'

interface RawDataChartCardProps {
    datasets: Dataset[]
}

export default function RawDataChartCard({ datasets }: RawDataChartCardProps) {
    const [selectedId, setSelectedId] = useState('')
    const [columns, setColumns] = useState<ChartColumn[]>([])
    const [selectedColumn, setSelectedColumn] = useState('')
    const [chartData, setChartData] = useState<ChartColumnData | null>(null)
    const [loadingColumns, setLoadingColumns] = useState(false)
    const [loadingData, setLoadingData] = useState(false)
    const [error, setError] = useState<string | null>(null)

    const activeId = selectedId || datasets[0]?.id || ''

    // Cambio de dataset: recargar las columnas del archivo ORIGINAL (sin limpiar).
    useEffect(() => {
        if (!activeId) {
            setColumns([])
            return
        }
        setLoadingColumns(true)
        setError(null)
        getRawChartColumnsForDataset(activeId)
            .then((res) => {
                setColumns(res.columns)
                setSelectedColumn((prev) => (res.columns.some((c) => c.name === prev) ? prev : res.columns[0]?.name ?? ''))
            })
            .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar las columnas'))
            .finally(() => setLoadingColumns(false))
    }, [activeId])

    useEffect(() => {
        if (!activeId || !selectedColumn) {
            setChartData(null)
            return
        }
        setLoadingData(true)
        setError(null)
        getRawChartColumnDataForDataset(activeId, selectedColumn)
            .then(setChartData)
            .catch((err) => setError(err instanceof Error ? err.message : 'No se pudieron cargar los datos'))
            .finally(() => setLoadingData(false))
    }, [activeId, selectedColumn])

    if (datasets.length === 0) {
        return (
            <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)' }}>
                Todavía no has subido ningún archivo.
            </div>
        )
    }

    return (
        <div>
            <div
                style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', marginBottom: 4 }}
            >
                <div className="panel-subtitle" style={{ marginBottom: 0 }}>
                    Datos tal como se subieron, incluyendo nulos, duplicados y valores mal formateados.
                </div>

                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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

                    {columns.length > 0 && (
                        <select
                            className="input-field"
                            value={selectedColumn}
                            onChange={(e) => setSelectedColumn(e.target.value)}
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
            </div>

            {loadingColumns && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)' }}>Cargando…</div>
            )}

            {!loadingColumns && columns.length === 0 && !error && (
                <div style={{ textAlign: 'center', padding: '32px 0', color: 'var(--text-faint)' }}>
                    Este archivo no tiene columnas para graficar
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