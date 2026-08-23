import { useRef, useState } from 'react'
import { UploadCloud, XCircle } from 'lucide-react'
import Papa from 'papaparse'
import * as XLSX from 'xlsx'
import { uploadDataset } from '../../lib/api'
import UploadPreviewModal from './UploadPreviewModal'
import UploadSuccessModal from './UploadSuccessModal'

interface UploadZoneProps {
  onUploaded?: () => void
  onGoToClean?: () => void
}

interface FilePreview {
  columns: string[]
  rows: Record<string, unknown>[]
  totalRows: number
}

interface UploadItem {
  id: string
  file: File
  name: string
  status: 'pending' | 'uploading' | 'done' | 'error'
  errorMessage?: string
  preview?: FilePreview
  previewError?: string
}

const PREVIEW_ROW_LIMIT = 500

function parseFilePreview(file: File): Promise<FilePreview> {
  const isCsv = /\.csv$/i.test(file.name)

  if (isCsv) {
    return new Promise((resolve, reject) => {
      Papa.parse<Record<string, unknown>>(file, {
        header: true,
        skipEmptyLines: true,
        complete: (result) => {
          const rows = result.data
          const columns = result.meta.fields ?? []
          resolve({ columns, rows: rows.slice(0, PREVIEW_ROW_LIMIT), totalRows: rows.length })
        },
        error: (err) => reject(err),
      })
    })
  }

  return file.arrayBuffer().then((buffer) => {
    const workbook = XLSX.read(buffer, { type: 'array' })
    const firstSheet = workbook.Sheets[workbook.SheetNames[0]]
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(firstSheet, { defval: null })
    const columns = json.length > 0 ? Object.keys(json[0]) : []
    return { columns, rows: json.slice(0, PREVIEW_ROW_LIMIT), totalRows: json.length }
  })
}

export default function UploadZone({ onUploaded, onGoToClean }: UploadZoneProps) {
  const [items, setItems] = useState<UploadItem[]>([])
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [rejectedFiles, setRejectedFiles] = useState<string[]>([])
  const [successCount, setSuccessCount] = useState<number | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const addFiles = (fileList: FileList | null) => {
    if (!fileList || fileList.length === 0) return

    const newItems: UploadItem[] = []
    const rejected: string[] = []

    Array.from(fileList).forEach((file) => {
      const isValid = /\.(csv|xlsx|xls)$/i.test(file.name)
      if (!isValid) {
        rejected.push(file.name)
        return
      }
      newItems.push({
        id: `${file.name}-${file.size}-${Date.now()}-${Math.random()}`,
        file,
        name: file.name,
        status: 'pending',
      })
    })

    if (rejected.length > 0) setRejectedFiles((prev) => [...prev, ...rejected])
    if (newItems.length === 0) return

    setItems((prev) => [...prev, ...newItems])

    newItems.forEach((item) => {
      parseFilePreview(item.file)
        .then((preview) => {
          setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, preview } : it)))
        })
        .catch(() => {
          setItems((prev) =>
            prev.map((it) => (it.id === item.id ? { ...it, previewError: 'No se pudo leer el archivo' } : it))
          )
        })
    })
  }

  const pendingItems = items.filter((it) => it.status === 'pending')
  const pendingWithPreview = pendingItems.filter((it) => it.preview)
  const modalOpen = pendingWithPreview.length > 0

  const closeModal = () => {
    setItems((prev) => prev.filter((it) => it.status !== 'pending'))
  }

  const handleUploadAll = async () => {
    setIsUploading(true)
    let succeeded = 0

    for (const item of pendingItems) {
      setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, status: 'uploading' } : it)))
      try {
        await uploadDataset(item.file)
        setItems((prev) => prev.map((it) => (it.id === item.id ? { ...it, status: 'done' } : it)))
        succeeded += 1
        onUploaded?.()
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Error al subir el archivo'
        setItems((prev) =>
          prev.map((it) => (it.id === item.id ? { ...it, status: 'error', errorMessage: message } : it))
        )
      }
    }

    setIsUploading(false)
    setItems((prev) => prev.filter((it) => it.status !== 'done'))
    if (succeeded > 0) setSuccessCount(succeeded)
  }

  return (
    <div className="panel-card">
      <div className="panel-title">Cargar nuevos archivos</div>
      <div className="panel-subtitle">Arrastra uno o varios archivos CSV / Excel para empezar.</div>

      <div
        className="dropzone"
        onDragOver={(e) => {
          e.preventDefault()
          setIsDragging(true)
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault()
          setIsDragging(false)
          addFiles(e.dataTransfer.files)
        }}
        onClick={() => inputRef.current?.click()}
        style={isDragging ? { borderColor: 'var(--primary)' } : undefined}
      >
        <input
          ref={inputRef}
          type="file"
          accept=".csv,.xlsx,.xls"
          multiple
          hidden
          onChange={(e) => {
            addFiles(e.target.files)
            e.target.value = ''
          }}
        />
        <span className="dropzone-icon">
          <UploadCloud size={22} strokeWidth={2} />
        </span>
        <div className="dropzone-title">Arrastra tus archivos o haz clic para elegirlos</div>
        <div className="dropzone-subtitle">Formatos soportados: .csv, .xlsx — hasta 200 MB · puedes elegir varios</div>
      </div>

      {rejectedFiles.length > 0 && (
        <div className="upload-list">
          {rejectedFiles.map((name, idx) => (
            <div className="upload-row" key={`${name}-${idx}`}>
              <span className="upload-row-icon">
                <XCircle size={16} color="var(--danger)" />
              </span>
              <div className="upload-row-info">
                <div className="upload-row-name">{name}</div>
                <div className="upload-row-meta">Formato no soportado</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <UploadPreviewModal
          files={pendingWithPreview.map((it) => ({
            id: it.id,
            name: it.name,
            columns: it.preview!.columns,
            rows: it.preview!.rows,
            totalRows: it.preview!.totalRows,
            status: it.status,
            errorMessage: it.errorMessage,
          }))}
          isUploading={isUploading}
          onClose={closeModal}
          onConfirmUpload={handleUploadAll}
          onAddFiles={addFiles}
        />
      )}

      {successCount !== null && (
        <UploadSuccessModal
          fileCount={successCount}
          onClose={() => setSuccessCount(null)}
          onGoToClean={() => {
            setSuccessCount(null)
            onGoToClean?.()
          }}
        />
      )}
    </div>
  )
}