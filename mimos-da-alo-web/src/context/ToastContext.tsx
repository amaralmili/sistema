import { CheckCircle2, TriangleAlert, X } from 'lucide-react'
import { createContext, ReactNode, useCallback, useContext, useState } from 'react'

interface Toast {
  id: number
  kind: 'success' | 'error'
  message: string
}

interface ToastContextValue {
  success: (message: string) => void
  error: (message: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

let nextId = 1

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const remove = useCallback((id: number) => {
    setToasts((current) => current.filter((t) => t.id !== id))
  }, [])

  const push = useCallback(
    (kind: Toast['kind'], message: string) => {
      const id = nextId++
      setToasts((current) => [...current, { id, kind, message }])
      setTimeout(() => remove(id), 5000)
    },
    [remove],
  )

  const value: ToastContextValue = {
    success: (message) => push('success', message),
    error: (message) => push('error', message),
  }

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div className="fixed bottom-5 right-5 z-50 flex w-full max-w-sm flex-col gap-2">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`card flex items-start gap-2.5 border-l-4 px-4 py-3 shadow-card ${
              toast.kind === 'success' ? 'border-l-sage' : 'border-l-rust'
            }`}
          >
            {toast.kind === 'success' ? (
              <CheckCircle2 size={18} className="mt-0.5 shrink-0 text-sage" />
            ) : (
              <TriangleAlert size={18} className="mt-0.5 shrink-0 text-rust" />
            )}
            <p className="flex-1 text-sm text-ink">{toast.message}</p>
            <button onClick={() => remove(toast.id)} className="text-muted hover:text-ink">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa ser usado dentro de um ToastProvider')
  return ctx
}
