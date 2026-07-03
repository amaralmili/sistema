import { Bell, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'

import { Layout } from '../components/Layout.tsx'
import { EmptyState, Spinner } from '../components/Spinner.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { customersApi, notificationsApi } from '../lib/endpoints.ts'
import { formatDateTime } from '../lib/format.ts'
import type { Customer, Notification } from '../lib/types.ts'

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isRunning, setIsRunning] = useState(false)
  const toast = useToast()

  useEffect(() => {
    customersApi.list().then(setCustomers).catch(() => {})
  }, [])

  async function load() {
    setIsLoading(true)
    try {
      setNotifications(await notificationsApi.list(customerId || undefined))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível carregar as notificações.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  async function handleRunCheck() {
    setIsRunning(true)
    try {
      const result = await notificationsApi.runOverdueCheck()
      if (result.notificationsCreated.length === 0) {
        toast.success('Nenhuma parcela nova em atraso. Tudo em dia por aqui.')
      } else {
        toast.success(
          `${result.overdueInstallmentsFound} parcela(s) em atraso · ${result.notificationsCreated.length} notificação(ões) criada(s).`,
        )
      }
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível rodar a verificação.')
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <Layout
      title="Notificações"
      subtitle="Avisos gerados automaticamente para clientes com parcelas em atraso."
      actions={
        <button className="btn-primary" onClick={handleRunCheck} disabled={isRunning}>
          <RefreshCw size={15} className={isRunning ? 'animate-spin' : ''} />
          {isRunning ? 'Verificando…' : 'Executar verificação de atraso'}
        </button>
      }
    >
      <div className="mb-4 max-w-xs">
        <select className="input-field" value={customerId} onChange={(e) => setCustomerId(e.target.value)}>
          <option value="">Todos os clientes</option>
          {customers.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <Spinner />
        ) : notifications.length === 0 ? (
          <EmptyState
            icon={<Bell size={28} />}
            title="Nenhuma notificação ainda"
            description="Clique em “Executar verificação de atraso” para varrer as parcelas vencidas e notificar os clientes."
          />
        ) : (
          <ul className="divide-y divide-sand">
            {notifications
              .slice()
              .sort((a, b) => b.sentAt.localeCompare(a.sentAt))
              .map((n) => (
                <li key={n.id} className="flex items-start gap-3 px-5 py-4">
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blush text-wine">
                    <Bell size={14} />
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline justify-between gap-x-3">
                      <p className="font-medium text-ink">{n.customerName}</p>
                      <p className="text-xs text-muted">{formatDateTime(n.sentAt)}</p>
                    </div>
                    <p className="mt-0.5 text-sm text-ink/70">{n.message}</p>
                  </div>
                </li>
              ))}
          </ul>
        )}
      </div>
    </Layout>
  )
}
