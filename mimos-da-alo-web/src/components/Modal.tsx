import { X } from 'lucide-react'
import { ReactNode, useEffect } from 'react'
import { createPortal } from 'react-dom'

export function Modal({
  title,
  subtitle,
  onClose,
  children,
  width = 'max-w-lg',
}: {
  title: string
  subtitle?: string
  onClose: () => void
  children: ReactNode
  width?: string
}) {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKeyDown)
    document.body.style.overflow = 'hidden'
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      document.body.style.overflow = ''
    }
  }, [onClose])

  return createPortal(
    <div className="fixed inset-0 z-40 flex items-start justify-center overflow-y-auto bg-ink/40 px-4 py-8 backdrop-blur-[2px]">
      <div className={`card w-full ${width} animate-[fadeIn_0.15s_ease-out]`}>
        <div className="flex items-start justify-between border-b border-sand px-6 py-5">
          <div>
            <h2 className="font-display text-xl font-medium text-wine-dark">{title}</h2>
            {subtitle && <p className="mt-0.5 text-sm text-muted">{subtitle}</p>}
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-muted transition hover:bg-blush hover:text-wine"
            aria-label="Fechar"
          >
            <X size={18} />
          </button>
        </div>
        <div className="px-6 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  )
}
