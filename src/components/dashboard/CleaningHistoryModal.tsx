import { useEffect, useState } from 'react'
import { History, X } from 'lucide-react'
import type { CleaningLog } from '../../lib/api'
import { getCleaningLogs } from '../../lib/api'

interface CleaningHistoryModalProps {
    datasetId: string
    fileName: string
    onClose: () => void
}

const ACTION_LABELS: Record<CleaningLog['action'], string> = {
    duplicate_removed: 'Fila duplicada eliminada',
    empty_row_removed: 'Fila vacía eliminada',
    column_removed: 'Columna eliminada',
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

export default function CleaningHistoryModal({ datasetId, fileName, onClose }: CleaningHistoryModalProps) {
    const [logs, setLogs] = useState<CleaningLog[] | null>(null)
    const [error, setError] = useState(false)

    useEffect(() => {
        getCleaningLogs(datasetId)
            .then((result) => setLogs(result.logs))
            .catch(() => setError(true))
    }, [datasetId])

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card modal-card-wide" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <div className="panel-title"><History size={16} style={{ marginRight: 6, verticalAlign: -3 }} />Historial de limpieza</div>
                        <div className="panel-subtitle">Todo lo que se quitó o cambió en {fileName}. Nada se borra para siempre.</div>
                    </div>
                    <button className="modal-close" onClick={onClose} aria-label="Cerrar"><X size={18} /></button>
                </div>
                <div className="modal-body">
                    {error && <div className="preview-empty">No se pudo cargar el historial.</div>}
                    {!error && logs === null && <div className="preview-empty">Cargando…</div>}
                    {logs?.length === 0 && <div className="preview-empty">Todavía no se aplicó ninguna limpieza a este archivo.</div>}
                    {logs && logs.length > 0 && (
                        <div className="history-list">
                            {logs.map((log) => (
                                <div key={log.id} className="history-item">
                                    <div className="history-item-head">
                                        <span className={`status-pill ${ACTION_CLASS[log.action]}`}>{ACTION_LABELS[log.action]}</span>
                                        <span className="history-item-date">{formatDateTime(log.created_at)}</span>
                                    </div>
                                    <div className="history-item-data">
                                        {Object.entries(log.row_data).map(([key, value]) => (
                                            <span key={key}><b>{key}:</b> {value === null || value === '' ? '—' : String(value)}</span>
                                        ))}
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