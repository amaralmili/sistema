import { Check, Search, Ticket, X } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'

import { ConfirmDialog } from '../components/ConfirmDialog.tsx'
import { Layout } from '../components/Layout.tsx'
import { EmptyState, Spinner } from '../components/Spinner.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { customersApi, promissoriesApi } from '../lib/endpoints.ts'
import { formatCentsToBRL, formatDate, installmentStatusLabels } from '../lib/format.ts'
import type { Customer, Installment, Promissory } from '../lib/types.ts'

const statusTone = { PENDENTE: 'gold', PAGA: 'sage', ATRASADA: 'rust' } as const

export function Promissories() {
  const [promissories, setPromissories] = useState<Promissory[]>([])
  const [customers, setCustomers] = useState<Customer[]>([])
  const [customerId, setCustomerId] = useState('')
  const [customerSearch, setCustomerSearch] = useState('')
  const [onlyOverdue, setOnlyOverdue] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [paying, setPaying] = useState<{ promissory: Promissory; installment: Installment } | null>(null)
  const [isPaying, setIsPaying] = useState(false)
  const toast = useToast()
  const navigate = useNavigate()

  const selectedCustomer = customers.find((c) => c.id === customerId)

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return []
    const term = customerSearch.toLowerCase()
    return customers
      .filter((c) => c.name.toLowerCase().includes(term) || c.phone.includes(term) || c.document?.includes(term))
      .slice(0, 8)
  }, [customers, customerSearch])

  useEffect(() => {
    customersApi.list().then(setCustomers).catch(() => {})
  }, [])

  async function load() {
    setIsLoading(true)
    try {
      setPromissories(await promissoriesApi.list({ customerId: customerId || undefined, onlyOverdue: onlyOverdue || undefined }))
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível carregar as promissórias.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [customerId, onlyOverdue])

  async function handlePay() {
    if (!paying) return
    setIsPaying(true)
    try {
      await promissoriesApi.payInstallment(paying.installment.id)
      toast.success(`Parcela ${paying.installment.number} de ${paying.promissory.customerName} marcada como paga.`)
      setPaying(null)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível registrar o pagamento.')
    } finally {
      setIsPaying(false)
    }
  }

  return (
    <Layout title="Promissórias" subtitle="Acompanhe e dê baixa nas parcelas de cada venda parcelada.">
      <div className="mb-4 flex flex-wrap items-center gap-3">
        {selectedCustomer ? (
          <div className="flex items-center gap-2 rounded-lg border border-sand bg-blush/40 py-2 pl-3.5 pr-2 text-sm">
            <span className="font-medium text-ink">{selectedCustomer.name}</span>
            <span className="text-xs text-muted">{selectedCustomer.phone}</span>
            <button
              className="rounded p-0.5 text-muted hover:text-wine"
              onClick={() => {
                setCustomerId('')
                setCustomerSearch('')
              }}
              title="Limpar filtro"
            >
              <X size={14} />
            </button>
          </div>
        ) : (
          <div className="relative w-full max-w-xs">
            <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
            <input
              className="input-field pl-9"
              placeholder="Buscar cliente por nome, telefone…"
              value={customerSearch}
              onChange={(e) => setCustomerSearch(e.target.value)}
            />
            {customerSearch && (
              <div className="absolute z-10 mt-1 max-h-56 w-full overflow-y-auto rounded-lg border border-sand bg-surface shadow-card">
                {filteredCustomers.length === 0 ? (
                  <p className="px-4 py-3 text-sm text-muted">Nenhum cliente encontrado.</p>
                ) : (
                  filteredCustomers.map((c) => (
                    <button
                      key={c.id}
                      type="button"
                      className="flex w-full items-center justify-between border-b border-sand px-4 py-2.5 text-left text-sm last:border-b-0 hover:bg-blush/40"
                      onClick={() => {
                        setCustomerId(c.id)
                        setCustomerSearch('')
                      }}
                    >
                      <span className="font-medium text-ink">{c.name}</span>
                      <span className="text-xs text-muted">{c.phone}</span>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input
            type="checkbox"
            checked={onlyOverdue}
            onChange={(e) => setOnlyOverdue(e.target.checked)}
            className="h-4 w-4 rounded border-sand text-wine focus:ring-wine/30"
          />
          Somente atrasadas
        </label>
      </div>

      {isLoading ? (
        <div className="card">
          <Spinner />
        </div>
      ) : promissories.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={<Ticket size={28} />}
            title="Nenhuma promissória encontrada"
            description="Vendas registradas com parcelamento aparecem aqui, com todas as parcelas."
          />
        </div>
      ) : (
        <div className="space-y-4">
          {promissories.map((promissory) => (
            <div key={promissory.id} className="card overflow-hidden">
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-sand bg-blush/30 px-5 py-3.5">
                <button
                  className="font-medium text-wine-dark hover:underline"
                  onClick={() => navigate(`/vendas/${promissory.saleId}`)}
                >
                  {promissory.customerName}
                </button>
                <span className="font-mono text-sm text-ink/70">{formatCentsToBRL(promissory.totalInCents)} no total</span>
              </div>
              <ul className="divide-y divide-sand">
                {promissory.installments
                  .slice()
                  .sort((a, b) => a.number - b.number)
                  .map((installment) => (
                    <li key={installment.id} className="flex items-center justify-between px-5 py-3.5 text-sm">
                      <div>
                        <p className="font-medium text-ink">Parcela {installment.number}</p>
                        <p className="text-xs text-muted">Vence em {formatDate(installment.dueDate)}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-ink/80">{formatCentsToBRL(installment.amountInCents)}</span>
                        <StatusBadge tone={statusTone[installment.status]}>
                          {installmentStatusLabels[installment.status]}
                        </StatusBadge>
                        {installment.status !== 'PAGA' && (
                          <button
                            className="flex items-center gap-1 rounded-lg border border-sage/40 bg-sage-light px-2.5 py-1.5 text-xs font-medium text-sage transition hover:bg-sage hover:text-cream"
                            onClick={() => setPaying({ promissory, installment })}
                          >
                            <Check size={13} /> Dar baixa
                          </button>
                        )}
                      </div>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {paying && (
        <ConfirmDialog
          title="Registrar pagamento"
          message={`Confirmar o pagamento da parcela ${paying.installment.number} (${formatCentsToBRL(
            paying.installment.amountInCents,
          )}) de ${paying.promissory.customerName}, com a data/hora de hoje?`}
          confirmLabel="Registrar pagamento"
          onCancel={() => setPaying(null)}
          onConfirm={handlePay}
          isLoading={isPaying}
        />
      )}
    </Layout>
  )
}
