import { ArrowLeft, Receipt } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { EmptyState, Spinner } from '../components/Spinner.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { customersApi } from '../lib/endpoints.ts'
import { formatCentsToBRL, formatDate, paymentLabels } from '../lib/format.ts'
import type { CustomerPurchaseHistory } from '../lib/types.ts'

export function CustomerDetail() {
  const { id } = useParams<{ id: string }>()
  const [history, setHistory] = useState<CustomerPurchaseHistory | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    customersApi
      .purchaseHistory(id)
      .then(setHistory)
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Não foi possível carregar o histórico.')
        navigate('/clientes')
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-4xl px-8 py-8">
        <Link to="/clientes" className="mb-6 flex items-center gap-1.5 text-sm font-medium text-wine hover:underline">
          <ArrowLeft size={15} /> Voltar para clientes
        </Link>

        {isLoading ? (
          <Spinner />
        ) : !history ? null : (
          <>
            <div className="card mb-6 px-6 py-6">
              <div className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-2xl font-medium text-wine-dark">{history.customer.name}</h1>
                  <p className="mt-1 text-sm text-muted">
                    {history.customer.phone}
                    {history.customer.email ? ` · ${history.customer.email}` : ''}
                    {history.customer.document ? ` · ${history.customer.document}` : ''}
                  </p>
                  {history.customer.address && (
                    <p className="mt-1 text-sm text-muted">{history.customer.address}</p>
                  )}
                </div>
                <div className="rounded-xl2 bg-blush px-5 py-3 text-right">
                  <p className="text-[11px] uppercase tracking-wide text-wine-dark/70">Total gasto</p>
                  <p className="font-display text-2xl font-medium text-wine-dark">
                    {formatCentsToBRL(history.totalSpentInCents)}
                  </p>
                </div>
              </div>
            </div>

            <h2 className="mb-3 font-display text-lg text-wine-dark">Histórico de compras</h2>
            {history.sales.length === 0 ? (
              <div className="card">
                <EmptyState icon={<Receipt size={26} />} title="Sem compras ainda" description="As vendas registradas para este cliente vão aparecer aqui." />
              </div>
            ) : (
              <div className="space-y-3">
                {history.sales
                  .slice()
                  .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
                  .map((sale) => (
                    <Link
                      key={sale.id}
                      to={`/vendas/${sale.id}`}
                      className="card flex items-center justify-between px-5 py-4 transition hover:-translate-y-0.5 hover:shadow-card"
                    >
                      <div>
                        <div className="mb-1 flex items-center gap-2">
                          <StatusBadge tone={sale.status === 'CONCLUIDA' ? 'sage' : 'muted'}>
                            {sale.status === 'CONCLUIDA' ? 'Concluída' : 'Cancelada'}
                          </StatusBadge>
                          <span className="text-xs text-muted">{formatDate(sale.createdAt)}</span>
                        </div>
                        <p className="text-sm text-ink/80">
                          {sale.items.length} item(ns) · {paymentLabels[sale.paymentMethod]}
                        </p>
                      </div>
                      <span className="font-mono text-base text-wine-dark">{formatCentsToBRL(sale.totalInCents)}</span>
                    </Link>
                  ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
