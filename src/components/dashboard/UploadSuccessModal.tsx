import { CheckCircle2, ArrowRight, X } from 'lucide-react'

interface UploadSuccessModalProps {
    fileCount: number
    onClose: () => void
    onGoToClean: () => void
}

export default function UploadSuccessModal({ fileCount, onClose, onGoToClean }: UploadSuccessModalProps) {
    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-card modal-card-center" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close modal-close-floating" onClick={onClose} aria-label="Cerrar">
                    <X size={18} />
                </button>

                <div className="modal-success-icon">
                    <CheckCircle2 size={32} strokeWidth={2} />
                </div>

                <div className="modal-success-title">Datos cargados</div>
                <div className="modal-success-subtitle">
                    {fileCount === 1
                        ? 'Tu archivo se subió correctamente.'
                        : `Tus ${fileCount} archivos se subieron correctamente.`}{' '}
                    Ahora puedes revisarlos y limpiarlos.
                </div>

                <div className="modal-success-actions">
                    <button className="btn btn-outline" onClick={onClose} type="button">
                        Seguir cargando
                    </button>
                    <button className="btn btn-primary" onClick={onGoToClean} type="button">
                        Ir a limpieza de datos
                        <ArrowRight size={16} style={{ marginLeft: 6 }} />
                    </button>
                </div>
            </div>
        </div>
    )
}