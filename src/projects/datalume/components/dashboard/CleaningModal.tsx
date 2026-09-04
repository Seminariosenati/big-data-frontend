import { CheckCircle2, AlertTriangle, Sparkles } from 'lucide-react'

export type CleaningStatus = 'processing' | 'success' | 'error'

interface CleaningModalProps {
  status: CleaningStatus
  /** 0–100. Solo se usa en estado "processing". */
  progress: number
  fileName: string
  /** Resumen de lo limpiado (duplicados, nulos, columnas, filas). */
  summary?: {
    duplicatesRemoved: number
    emptyRowsRemoved: number
    columnsRemoved: string[]
    nullsFilled: number
  } | null
  errorMessage?: string
  onViewDataset: () => void
  onClose: () => void
}

const STAGE_TEXT: { from: number; to: number; text: string }[] = [
  { from: 0, to: 25, text: 'Analizando estructura de columnas y buscando duplicados...' },
  { from: 25, to: 60, text: 'Imputando valores nulos y normalizando datos...' },
  { from: 60, to: 90, text: 'Estandarizando precios y montos a moneda local (S/)...' },
  { from: 90, to: 100, text: 'Calculando Health Score y finalizando dataset...' },
]

function getStageText(progress: number): string {
  const clamped = Math.min(100, Math.max(0, progress))
  const stage = STAGE_TEXT.find((s) => clamped >= s.from && clamped < s.to) ?? STAGE_TEXT[STAGE_TEXT.length - 1]
  return stage.text
}

export default function CleaningModal({
  status,
  progress,
  fileName,
  summary,
  errorMessage,
  onViewDataset,
  onClose,
}: CleaningModalProps) {
  const pct = Math.min(100, Math.max(0, progress))

  return (
    <div className="modal-overlay">
      <div className="modal-card modal-card-center cleaning-modal">
        {status === 'processing' ? (
          <>
            <div className="cleaning-modal-spinner"><Sparkles size={28} strokeWidth={1.8} /></div>

            <div className="modal-success-title">Procesando y Limpiando Dataset</div>
            <div className="modal-success-subtitle">{fileName}</div>

            <div className="cleaning-progress-wrap">
              <div className="cleaning-progress-track">
                <div className="cleaning-progress-fill" style={{ width: `${pct}%` }} />
              </div>
              <div className="cleaning-progress-meta">
                <span className="cleaning-progress-text">{getStageText(pct)}</span>
                <strong className="cleaning-progress-pct">{pct}%</strong>
              </div>
            </div>
          </>
        ) : status === 'success' ? (
          <>
            <div className="modal-success-icon">
              <CheckCircle2 size={32} strokeWidth={2} />
            </div>

            <div className="modal-success-title">Dataset limpio y listo</div>
            <div className="modal-success-subtitle">
              Se aplicaron los cambios a <strong>{fileName}</strong>. Lo que se quitó quedó registrado en el
              historial, no se borró permanentemente.
            </div>

            {summary && (summary.duplicatesRemoved > 0 || summary.emptyRowsRemoved > 0 || summary.nullsFilled > 0 || summary.columnsRemoved.length > 0) && (
              <div className="cleaning-result-chips">
                {summary.duplicatesRemoved > 0 && <span>{summary.duplicatesRemoved} duplicados</span>}
                {summary.emptyRowsRemoved > 0 && <span>{summary.emptyRowsRemoved} filas vacías</span>}
                {summary.nullsFilled > 0 && <span>{summary.nullsFilled} nulos</span>}
                {summary.columnsRemoved.length > 0 && <span>{summary.columnsRemoved.length} columnas</span>}
              </div>
            )}

            <div className="modal-success-actions">
              <button className="btn btn-outline" onClick={onClose} type="button">
                Cerrar
              </button>
              <button className="btn btn-primary" onClick={onViewDataset} type="button">
                Ver dataset limpio
              </button>
            </div>
          </>
        ) : (
          <>
            <div className="cleaning-modal-error-icon">
              <AlertTriangle size={30} strokeWidth={2} />
            </div>

            <div className="modal-success-title">No se pudo completar la limpieza</div>
            <div className="modal-success-subtitle">
              {errorMessage || 'Ocurrió un error inesperado al procesar el archivo.'}
            </div>

            <div className="modal-success-actions">
              <button className="btn btn-primary" onClick={onClose} type="button">
                Entendido
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
