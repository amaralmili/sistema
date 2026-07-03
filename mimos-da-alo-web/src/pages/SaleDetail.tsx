import { ArrowLeft, Ticket } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'

import { Spinner } from '../components/Spinner.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { customersApi, salesApi } from '../lib/endpoints.ts'
import { formatCentsToBRL, formatDateTime, paymentLabels } from '../lib/format.ts'
import type { Customer, Sale } from '../lib/types.ts'

export function SaleDetail() {
  const { id } = useParams<{ id: string }>()
  const [sale, setSale] = useState<Sale | null>(null)
  const [customer, setCustomer] = useState<Customer | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    if (!id) return
    salesApi
      .get(id)
      .then(async (s) => {
        setSale(s)
        setCustomer(await customersApi.get(s.customerId).catch(() => null))
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Venda não encontrada.')
        navigate('/vendas')
      })
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-3xl px-8 py-8">
        <Link to="/vendas" className="mb-6 flex items-center gap-1.5 text-sm font-medium text-wine hover:underline">
          <ArrowLeft size={15} /> Voltar para vendas
        </Link>

        {isLoading ? (
          <Spinner />
        ) : !sale ? null : (
          <div className="card overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-sand px-6 py-6">
              <div>
                <p className="text-xs uppercase tracking-wide text-muted">Venda</p>
                <h1 className="font-display text-2xl font-medium text-wine-dark">
                  {customer ? (
                    <Link to={`/clientes/${customer.id}`} className="hover:underline">
                      {customer.name}
                    </Link>
                  ) : (
                    '—'
                  )}
                </h1>
                <p className="mt-1 text-sm text-muted">{formatDateTime(sale.createdAt)}</p>
              </div>
              <div className="flex flex-col items-end gap-2">
                <StatusBadge tone={sale.status === 'CONCLUIDA' ? 'sage' : 'muted'}>
                  {sale.status === 'CONCLUIDA' ? 'Concluída' : 'Cancelada'}
                </StatusBadge>
                <StatusBadge tone={sale.paymentMethod === 'PROMISSORIA' ? 'gold' : 'muted'}>
                  {paymentLabels[sale.paymentMethod]}
                </StatusBadge>
              </div>
            </div>

            <div className="px-6 py-5">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">Itens</h2>
              <ul className="divide-y divide-sand">
                {sale.items.map((item, idx) => (
                  <li key={idx} className="flex items-center justify-between py-3 text-sm">
                    <div>
                      <p className="font-medium text-ink">{item.productName}</p>
                      <p className="text-xs text-muted">
                        {item.quantity} × {formatCentsToBRL(item.unitPriceInCents)}
                      </p>
                    </div>
                    <span className="font-mono text-ink/80">
                      {formatCentsToBRL(item.quantity * item.unitPriceInCents)}
                    </span>
                  </li>
                ))}
              </ul>

              {sale.discountInCents > 0 && (
                <div className="mt-4 space-y-1.5 border-t border-sand pt-4">
                  <div className="flex items-center justify-between text-sm text-ink/70">
                    <span>Subtotal</span>
                    <span className="font-mono">
                      {formatCentsToBRL(sale.totalInCents + sale.discountInCents)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-sage">
                    <span>Desconto</span>
                    <span className="font-mono">−{formatCentsToBRL(sale.discountInCents)}</span>
                  </div>
                </div>
              )}

              <div className={`flex items-center justify-between pt-4 ${sale.discountInCents > 0 ? '' : 'border-t border-sand'}`}>
                <span className="font-display text-lg text-wine-dark">Total</span>
                <span className="font-mono text-xl text-wine-dark">{formatCentsToBRL(sale.totalInCents)}</span>
              </div>

              {sale.promissoryId && (
                <Link
                  to="/promissorias"
                  className="mt-5 flex items-center justify-between rounded-lg border border-gold/40 bg-blush/60 px-4 py-3 text-sm font-medium text-wine-dark transition hover:bg-blush"
                >
                  <span className="flex items-center gap-2">
                    <Ticket size={16} /> Essa venda gerou uma promissória
                  </span>
                  <span>Ver parcelas →</span>
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
