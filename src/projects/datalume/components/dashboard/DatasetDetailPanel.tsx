import type { Dataset } from '../../lib/api'

interface DatasetDetailPanelProps {
    datasets: Dataset[]
    selectedId: string
    onSelectId: (id: string) => void
}

function formatStat(value?: number) {
    if (value === undefined) return '—'
    const rounded = Math.round(value * 100) / 100
    return rounded.toLocaleString('es-PE', { maximumFractionDigits: Number.isInteger(rounded) ? 0 : 2 })
}

export default function DatasetDetailPanel({ datasets, selectedId, onSelectId }: DatasetDetailPanelProps) {
    const dataset = datasets.find((d) => d.id === selectedId) ?? datasets[0]

    if (!dataset) return null

    const columnStats = dataset.columns_summary ?? []

    return (
        <div className="panel-card" style={{ marginTop: 20 }}>
            <div className="table-section-header">
                <div>
                    <div className="panel-title" style={{ marginBottom: 2 }}>Resumen de "{dataset.file_name}"</div>
                    <div className="panel-subtitle" style={{ marginBottom: 0 }}>
                        {dataset.row_count.toLocaleString('es-PE')} filas · {dataset.column_count} columnas
                    </div>
                </div>

                {datasets.length > 0 && (
                    <select
                        className="input-field"
                        value={dataset.id}
                        onChange={(e) => onSelectId(e.target.value)}
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

            <div className="panel-subtitle" style={{ marginTop: 14, marginBottom: 8 }}>Resumen por columna</div>
            <div className="data-table-wrapper">
                <table className="data-table">
                    <thead>
                        <tr>
                            <th>Columna</th>
                            <th>Tipo</th>
                            <th>Nulos</th>
                            <th>% Nulos</th>
                            <th>Únicos</th>
                            <th>Mín</th>
                            <th>Máx</th>
                            <th>Promedio</th>
                        </tr>
                    </thead>
                    <tbody>
                        {columnStats.map((c) => (
                            <tr key={c.name}>
                                <td><strong>{c.name}</strong></td>
                                <td>{c.dtype}</td>
                                <td>{c.null_count.toLocaleString('es-PE')}</td>
                                <td>{c.null_pct.toLocaleString('es-PE', { maximumFractionDigits: 1 })}%</td>
                                <td>{c.unique_count.toLocaleString('es-PE')}</td>
                                <td>{formatStat(c.min)}</td>
                                <td>{formatStat(c.max)}</td>
                                <td>{formatStat(c.mean)}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    )
}