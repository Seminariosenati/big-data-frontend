import { useMemo, useRef, useState } from 'react'
import { X, ChevronLeft, ChevronRight, UploadCloud, Loader2 } from 'lucide-react'

interface PreviewFile {
    id: string
    name: string
    columns: string[]
    rows: Record<string, unknown>[]
    totalRows: number
    status: 'pending' | 'uploading' | 'done' | 'error'
    errorMessage?: string
}

interface UploadPreviewModalProps {
    files: PreviewFile[]
    isUploading: boolean
    onClose: () => void
    onConfirmUpload: () => void
    onAddFiles: (fileList: FileList | null) => void
}

const PAGE_SIZE = 25

export default function UploadPreviewModal({
    files,
    isUploading,
    onClose,
    onConfirmUpload,
    onAddFiles,
}: UploadPreviewModalProps) {
    const [page, setPage] = useState(0)
    const [isDragging, setIsDragging] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)

    const columns = useMemo(() => {
        const set = new Set<string>()
        files.forEach((f) => f.columns.forEach((c) => set.add(c)))
        return Array.from(set)
    }, [files])

    const showSourceColumn = files.length > 1

    const combinedRows = useMemo(() => {
        return files.flatMap((f) => f.rows.map((row) => ({ __source: f.name, ...row })))
    }, [files])

    const totalCombinedRows = files.reduce((acc, f) => acc + f.totalRows, 0)
    const totalPages = Math.max(1, Math.ceil(combinedRows.length / PAGE_SIZE))
    const pageRows = combinedRows.slice(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE)

    const pendingCount = files.filter((f) => f.status === 'pending').length

    return (
        <div
            className="modal-overlay"
            onClick={onClose}
            onDragOver={(e) => {
                e.preventDefault()
                setIsDragging(true)
            }}
            onDragLeave={() => setIsDragging(false)}
            onDrop={(e) => {
                e.preventDefault()
                setIsDragging(false)
                onAddFiles(e.dataTransfer.files)
            }}
        >
            <div
                className="modal-card modal-card-wide"
                onClick={(e) => e.stopPropagation()}
                style={isDragging ? { outline: '2px dashed var(--primary)', outlineOffset: -2 } : undefined}
            >
                <div className="modal-header">
                    <div>
                        <div className="panel-title" style={{ marginBottom: 2 }}>
                            {files.length > 1 ? `${files.length} archivos` : files[0]?.name ?? 'Vista previa'}
                        </div>
                        <div className="panel-subtitle" style={{ marginBottom: 0 }}>
                            Muestra {combinedRows.length.toLocaleString('es-PE')} de {totalCombinedRows.toLocaleString('es-PE')} filas
                            totales · arrastra otro archivo aquí para agregarlo
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                        <input
                            ref={inputRef}
                            type="file"
                            accept=".csv,.xlsx,.xls"
                            multiple
                            hidden
                            onChange={(e) => {
                                onAddFiles(e.target.files)
                                e.target.value = ''
                            }}
                        />
                        <button className="btn btn-outline" onClick={() => inputRef.current?.click()} type="button">
                            + Agregar archivo
                        </button>
                        <button className="modal-close" onClick={onClose} aria-label="Cerrar">
                            <X size={18} />
                        </button>
                    </div>
                </div>

                <div className="modal-body">
                    {isDragging && (
                        <div
                            style={{
                                border: '2px dashed var(--primary)',
                                borderRadius: 10,
                                padding: '24px',
                                textAlign: 'center',
                                marginBottom: 14,
                                color: 'var(--primary)',
                            }}
                        >
                            Suelta el archivo para agregarlo a la tabla
                        </div>
                    )}

                    <div className="data-table-wrapper">
                        <table className="data-table">
                            <thead>
                                <tr>
                                    {showSourceColumn && <th>Archivo</th>}
                                    {columns.map((col) => (
                                        <th key={col}>{col}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {pageRows.map((row, idx) => (
                                    <tr key={idx}>
                                        {showSourceColumn && <td>{String(row.__source)}</td>}
                                        {columns.map((col) => (
                                            <td key={col}>{row[col] === null || row[col] === undefined ? '—' : String(row[col])}</td>
                                        ))}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14 }}>
                        <div className="panel-subtitle" style={{ marginBottom: 0 }}>
                            Página {page + 1} de {totalPages}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                            <button
                                className="btn btn-outline"
                                disabled={page === 0}
                                onClick={() => setPage((p) => Math.max(0, p - 1))}
                                type="button"
                            >
                                <ChevronLeft size={16} />
                            </button>
                            <button
                                className="btn btn-outline"
                                disabled={page >= totalPages - 1}
                                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                                type="button"
                            >
                                <ChevronRight size={16} />
                            </button>
                        </div>
                    </div>
                </div>

                <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border, #2a2d35)' }}>
                    <button className="btn btn-primary btn-block" disabled={isUploading || pendingCount === 0} onClick={onConfirmUpload} type="button">
                        {isUploading ? (
                            <>
                                <Loader2 size={16} className="spin" style={{ marginRight: 6 }} />
                                Cargando…
                            </>
                        ) : (
                            <>
                                <UploadCloud size={16} style={{ marginRight: 6 }} />
                                Cargar datos ({pendingCount})
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    )
}