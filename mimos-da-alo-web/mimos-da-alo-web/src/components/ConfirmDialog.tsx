import { Modal } from './Modal.tsx'

export function ConfirmDialog({
  title,
  message,
  confirmLabel = 'Confirmar',
  danger,
  onConfirm,
  onCancel,
  isLoading,
}: {
  title: string
  message: string
  confirmLabel?: string
  danger?: boolean
  onConfirm: () => void
  onCancel: () => void
  isLoading?: boolean
}) {
  return (
    <Modal title={title} onClose={onCancel} width="max-w-sm">
      <p className="text-sm text-ink/80">{message}</p>
      <div className="mt-6 flex justify-end gap-2">
        <button className="btn-secondary" onClick={onCancel} disabled={isLoading}>
          Cancelar
        </button>
        <button
          className={danger ? 'btn-danger' : 'btn-primary'}
          onClick={onConfirm}
          disabled={isLoading}
        >
          {isLoading ? 'Aguarde…' : confirmLabel}
        </button>
      </div>
    </Modal>
  )
}
