import {
  AlertTriangle,
  ArrowRight,
  Package,
  Plus,
  Receipt,
  RefreshCw,
  Users,
} from 'lucide-react'
import { ReactNode, useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'

import { Layout } from '../components/Layout.tsx'
import { Spinner } from '../components/Spinner.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { customersApi, notificationsApi, productsApi, promissoriesApi, salesApi } from '../lib/endpoints.ts'
import { formatCentsToBRL, formatDate, paymentLabels } from '../lib/format.ts'
import type { Customer, Product, Promissory, Sale } from '../lib/types.ts'

export function Dashboard() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [sales, setSales] = useState<Sale[]>([])
  const [overdue, setOverdue] = useState<Promissory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isRunningCheck, setIsRunningCheck] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  async function loadAll() {
    setIsLoading(true)
    try {
      const [c, p, s, o] = await Promise.all([
        customersApi.list(),
        productsApi.list(),
        salesApi.list(),
        promissoriesApi.list({ onlyOverdue: true }),
      ])
      setCustomers(c)
      setProducts(p)
      setSales(s)
      setOverdue(o)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível carregar o painel.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const stats = useMemo(() => {
    const now = new Date()
    const salesThisMonth = sales.filter((s) => {
      if (!s.createdAt) return false
      const d = new Date(s.createdAt)
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    })
    const activeProducts = products.filter((p) => p.isActive).length
    const overdueInstallments = overdue.flatMap((p) => p.installments.filter((i) => i.status === 'ATRASADA'))
    const overdueTotal = overdueInstallments.reduce((sum, i) => sum + i.amountInCents, 0)

    return {
      totalCustomers: customers.length,
      activeProducts,
      totalProducts: products.length,
      salesThisMonthCount: salesThisMonth.length,
      salesThisMonthTotal: salesThisMonth.reduce((sum, s) => sum + s.totalInCents, 0),
      overdueCount: overdueInstallments.length,
      overdueTotal,
    }
  }, [customers, products, sales, overdue])

  async function handleRunCheck() {
    setIsRunningCheck(true)
    try {
      const result = await notificationsApi.runOverdueCheck()
      toast.success(
        `${result.overdueInstallmentsFound} parcela(s) em atraso encontradas · ${result.notificationsCreated.length} notificação(ões) criada(s).`,
      )
      await loadAll()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível rodar a verificação.')
    } finally {
      setIsRunningCheck(false)
    }
  }

  const customerName = (id: string) => customers.find((c) => c.id === id)?.name ?? '—'

  return (
    <Layout
      title="Painel"
      subtitle="Um resumo rápido de como a loja está hoje."
      actions={
        <>
          <button onClick={handleRunCheck} className="btn-secondary" disabled={isRunningCheck}>
            <RefreshCw size={15} className={isRunningCheck ? 'animate-spin' : ''} />
            Verificar atrasos
          </button>
          <button onClick={() => navigate('/vendas/nova')} className="btn-primary">
            <Plus size={16} />
            Nova venda
          </button>
        </>
      }
    >
      {isLoading ? (
        <Spinner />
      ) : (
        <div className="space-y-8">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <StatCard
              icon={<Users size={18} />}
              label="Clientes"
              value={String(stats.totalCustomers)}
              href="/clientes"
            />
            <StatCard
              icon={<Package size={18} />}
              label="Produtos ativos"
              value={`${stats.activeProducts} / ${stats.totalProducts}`}
              href="/produtos"
            />
            <StatCard
              icon={<Receipt size={18} />}
              label="Vendas no mês"
              value={`${stats.salesThisMonthCount} · ${formatCentsToBRL(stats.salesThisMonthTotal)}`}
              href="/vendas"
            />
            <StatCard
              icon={<AlertTriangle size={18} />}
              label="Parcelas em atraso"
              value={`${stats.overdueCount} · ${formatCentsToBRL(stats.overdueTotal)}`}
              href="/promissorias"
              tone={stats.overdueCount > 0 ? 'rust' : undefined}
            />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
            <div className="card lg:col-span-3">
              <div className="flex items-center justify-between border-b border-sand px-5 py-4">
                <h3 className="font-display text-lg text-wine-dark">Últimas vendas</h3>
                <Link to="/vendas" className="flex items-center gap-1 text-xs font-medium text-wine hover:underline">
                  Ver todas <ArrowRight size={12} />
                </Link>
              </div>
              {sales.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">Nenhuma venda registrada ainda.</p>
              ) : (
                <ul className="divide-y divide-sand">
                  {sales
                    .slice()
                    .sort((a, b) => (b.createdAt ?? '').localeCompare(a.createdAt ?? ''))
                    .slice(0, 6)
                    .map((sale) => (
                      <li key={sale.id}>
                        <Link
                          to={`/vendas/${sale.id}`}
                          className="flex items-center justify-between px-5 py-3 text-sm transition hover:bg-blush/40"
                        >
                          <div>
                            <p className="font-medium text-ink">{customerName(sale.customerId)}</p>
                            <p className="text-xs text-muted">{formatDate(sale.createdAt)} · {paymentLabels[sale.paymentMethod]}</p>
                          </div>
                          <span className="font-mono text-sm text-wine-dark">{formatCentsToBRL(sale.totalInCents)}</span>
                        </Link>
                      </li>
                    ))}
                </ul>
              )}
            </div>

            <div className="card lg:col-span-2">
              <div className="flex items-center justify-between border-b border-sand px-5 py-4">
                <h3 className="font-display text-lg text-wine-dark">Parcelas em atraso</h3>
                <Link to="/promissorias" className="flex items-center gap-1 text-xs font-medium text-wine hover:underline">
                  Ver todas <ArrowRight size={12} />
                </Link>
              </div>
              {overdue.length === 0 ? (
                <p className="px-5 py-8 text-center text-sm text-muted">Nenhuma parcela em atraso. 🎉</p>
              ) : (
                <ul className="divide-y divide-sand">
                  {overdue.slice(0, 6).map((promissory) =>
                    promissory.installments
                      .filter((i) => i.status === 'ATRASADA')
                      .map((installment) => (
                        <li key={installment.id} className="flex items-center justify-between px-5 py-3 text-sm">
                          <div>
                            <p className="font-medium text-ink">{promissory.customerName}</p>
                            <p className="text-xs text-muted">
                              Parcela {installment.number} · venceu em {formatDate(installment.dueDate)}
                            </p>
                          </div>
                          <StatusBadge tone="rust">{formatCentsToBRL(installment.amountInCents)}</StatusBadge>
                        </li>
                      )),
                  )}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </Layout>
  )
}

function StatCard({
  icon,
  label,
  value,
  href,
  tone,
}: {
  icon: ReactNode
  label: string
  value: string
  href: string
  tone?: 'rust'
}) {
  return (
    <Link to={href} className="card group flex flex-col gap-3 px-5 py-5 transition hover:-translate-y-0.5 hover:shadow-card">
      <span
        className={`flex h-9 w-9 items-center justify-center rounded-full ${
          tone === 'rust' ? 'bg-rust-light text-rust' : 'bg-blush text-wine'
        }`}
      >
        {icon}
      </span>
      <div>
        <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
        <p className="mt-0.5 font-display text-xl font-medium text-ink">{value}</p>
      </div>
    </Link>
  )
}
