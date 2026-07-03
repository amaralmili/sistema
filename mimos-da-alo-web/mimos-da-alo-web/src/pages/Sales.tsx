import { Plus, Receipt } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Layout } from '../components/Layout.tsx'
import { EmptyState, Spinner } from '../components/Spinner.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { customersApi, salesApi } from '../lib/endpoints.ts'
import { formatCentsToBRL, formatDate, paymentLabels } from '../lib/format.ts'
import type { Customer, Sale } from '../lib/types.ts'

export function Sales() {
  const [sales, setSales] = useState<Sale[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const toast = useToast()
  const navigate = useNavigate()

  useEffect(() => {
    customersApi.list().then(setCustomers).catch(() => {})
  }, [])

  useEffect(() => {
    setIsLoading(true)
    salesApi
      .list(customerId || undefined)
      .then(setSales)
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Não foi possível carregar as vendas.'))
      .finally(() => setIsLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId])

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? '—'

  return (
    <Layout
      title="Vendas"
      subtitle="Todo o histórico de vendas registradas na loja."
      actions={
        <button className="btn-primary" onClick={() => navigate('/vendas/nova')}>
          <Plus size={16} /> Nova venda
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
        ) : sales.length === 0 ? (
          <EmptyState
            icon={<Receipt size={28} />}
            title="Nenhuma venda encontrada"
            description="Registre a primeira venda para começar a acompanhar o faturamento."
            action={
              <button className="btn-primary" onClick={() => navigate('/vendas/nova')}>
                <Plus size={16} /> Nova venda
              </button>
            }
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-sand text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Data</th>
                <th className="px-5 py-3 font-medium">Cliente</th>
                <th className="px-5 py-3 font-medium">Pagamento</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium">Itens</th>
                <th className="px-5 py-3 font-medium text-right">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {sales
                .slice()
                .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
                .map((sale) => (
                  <tr
                    key={sale.id}
                    className="cursor-pointer transition hover:bg-blush/30"
                    onClick={() => navigate(`/vendas/${sale.id}`)}
                  >
                    <td className="px-5 py-3.5 text-ink/80">{formatDate(sale.createdAt)}</td>
                    <td className="px-5 py-3.5 font-medium text-ink">
                      <Link to={`/clientes/${sale.customerId}`} onClick={(e) => e.stopPropagation()} className="hover:text-wine hover:underline">
                        {customerName(sale.customerId)}
                      </Link>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge tone={sale.paymentMethod === 'PROMISSORIA' ? 'gold' : 'muted'}>
                        {paymentLabels[sale.paymentMethod]}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-3.5">
                      <StatusBadge tone={sale.status === 'CONCLUIDA' ? 'sage' : 'muted'}>
                        {sale.status === 'CONCLUIDA' ? 'Concluída' : 'Cancelada'}
                      </StatusBadge>
                    </td>
                    <td className="px-5 py-3.5 text-ink/70">{sale.items.length}</td>
                    <td className="px-5 py-3.5 text-right font-mono text-wine-dark">{formatCentsToBRL(sale.totalInCents)}</td>
                  </tr>
                ))}
            </tbody>
          </table>
        )}
      </div>
    </Layout>
  )
}
