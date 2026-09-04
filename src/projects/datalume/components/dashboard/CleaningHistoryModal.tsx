import { useEffect, useMemo, useState } from 'react'
import { ArrowLeft, FileSpreadsheet, History, X } from 'lucide-react'
import type { CleaningLog, Dataset } from '../../lib/api'
import { getCleaningLogs } from '../../lib/api'

interface CleaningHistoryModalProps {
    datasets: Dataset[]
    initialDatasetId?: string
    onClose: () => void
}

const ACTION_LABELS: Record<CleaningLog['action'], string> = {
    duplicate_removed: 'Filas duplicadas eliminadas',
    empty_row_removed: 'Filas vacías eliminadas',
    column_removed: 'Columnas eliminadas',
    nulls_filled: 'Valores nulos modificados',
}

const ACTION_CLASS: Record<CleaningLog['action'], string> = {
    duplicate_removed: 'warn',
    empty_row_removed: 'warn',
    column_removed: 'error',
    nulls_filled: 'ok',
}

function formatDateTime(value: string) {
    return new Date(value).toLocaleString('es-PE', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

function cellText(value: unknown) {
    return value === null || value === undefined || value === '' ? '—' : String(value)
}

export default function CleaningHistoryModal({ datasets, initialDatasetId, onClose }: CleaningHistoryModalProps) {
    const [selectedId, setSelectedId] = useState<string | null>(initialDatasetId ?? null)
    const [logs, setLogs] = useState<CleaningLog[] | null>(null)
    const [error, setError] = useState(false)

    const selectedDataset = datasets.find((d) => d.id === selectedId) ?? null

    useEffect(() => {
        if (!selectedId) return
        setLogs(null)
        setError(false)
        getCleaningLogs(selectedId)
            .then((result) => setLogs(result.logs))
            .catch(() => setError(true))
    }, [selectedId])

    // Agrupa los logs por tipo de acción y arma una tabla por grupo, con
    // columnas dinámicas según las claves que traiga cada row_data.
    const groups = useMemo(() => {
        if (!logs) return []
        const byAction = new Map<CleaningLog['action'], CleaningLog[]>()
        for (const log of logs) {
            const list = byAction.get(log.action) ?? []
            list.push(log)
            byAction.set(log.action, list)
        }
        return Array.from(byAction.entries()).map(([action, items]) => {
            const columns = Array.from(new Set(items.flatMap((item) => Object.keys(item.row_data))))
            return { action, items, columns }
        })
    }, [logs])

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <div className="panel-title">
                            {selectedDataset && (
                                <button className="icon-button history-back" onClick={() => setSelectedId(null)} aria-label="Volver">
                                    <ArrowLeft size={16} />
                                </button>
                            )}
                            <History size={16} style={{ marginRight: 6, verticalAlign: -3 }} />
                            {selectedDataset ? `Historial · ${selectedDataset.file_name}` : 'Historial de limpieza'}
                        </div>
                        <div className="panel-subtitle">
                            {selectedDataset
                                ? 'Todo lo que se quitó o corrigió en este archivo. Nada se borra para siempre.'
                                : 'Elige un archivo para ver qué se le quitó o corrigió.'}
                        </div>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
                </div>

                <div className="modal-body">
                    {!selectedDataset && (
                        <div className="history-file-list">
                            {datasets.length === 0 && <div className="preview-empty">Todavía no has subido ningún archivo.</div>}
                            {datasets.map((d) => (
                                <button key={d.id} className="history-file-item" onClick={() => setSelectedId(d.id)}>
                                    <span className="history-file-icon"><FileSpreadsheet size={16} /></span>
                                    <span className="history-file-info">
                                        <strong>{d.file_name}</strong>
                                        <small>{d.row_count.toLocaleString('es-PE')} filas · {d.column_count} columnas</small>
                                    </span>
                                    <span className="quality-badge">{d.quality_score}%</span>
                                </button>
                            ))}
                        </div>
                    )}

                    {selectedDataset && error && <div className="preview-empty">No se pudo cargar el historial.</div>}
                    {selectedDataset && !error && logs === null && <div className="preview-empty">Cargando…</div>}
                    {selectedDataset && logs?.length === 0 && (
                        <div className="preview-empty">Todavía no se aplicó ninguna limpieza a este archivo.</div>
                    )}

                    {selectedDataset && groups.length > 0 && (
                        <div className="history-groups">
                            {groups.map(({ action, items, columns }) => (
                                <div key={action} className="history-group">
                                    <div className="history-group-head">
                                        <span className={`status-pill ${ACTION_CLASS[action]}`}>{ACTION_LABELS[action]}</span>
                                        <span className="history-item-date">{items.length} registro{items.length === 1 ? '' : 's'}</span>
                                    </div>
                                    <div className="data-table-wrapper">
                                        <table className="data-table">
                                            <thead>
                                                <tr>
                                                    {columns.map((c) => <th key={c}>{c}</th>)}
                                                    <th>Fecha</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {items.map((log) => (
                                                    <tr key={log.id}>
                                                        {columns.map((c) => <td key={c}>{cellText(log.row_data[c])}</td>)}
                                                        <td>{formatDateTime(log.created_at)}</td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}