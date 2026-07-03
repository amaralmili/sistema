import { EyeOff, Package, Pencil, Plus, Search } from 'lucide-react'
import { FormEvent, useEffect, useState } from 'react'

import { ConfirmDialog } from '../components/ConfirmDialog.tsx'
import { Layout } from '../components/Layout.tsx'
import { Modal } from '../components/Modal.tsx'
import { EmptyState, Spinner } from '../components/Spinner.tsx'
import { StatusBadge } from '../components/StatusBadge.tsx'
import { useToast } from '../context/ToastContext.tsx'
import { productsApi } from '../lib/endpoints.ts'
import { categoryLabels, formatCentsToBRL, parseBRLInputToCents } from '../lib/format.ts'
import type { CreateProductInput, Product, ProductCategory } from '../lib/types.ts'

const CATEGORIES: ProductCategory[] = ['COSMETICO', 'JOIA', 'PERFUME', 'ACESSORIO']

const categoryTone: Record<ProductCategory, 'wine' | 'gold' | 'sage' | 'muted'> = {
  COSMETICO: 'sage',
  JOIA: 'gold',
  PERFUME: 'wine',
  ACESSORIO: 'muted',
}

export function Products() {
  const [products, setProducts] = useState<Product[]>([])
  const [allBrands, setAllBrands] = useState<string[]>([])
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<ProductCategory | ''>('')
  const [brand, setBrand] = useState('')
  const [onlyActive, setOnlyActive] = useState(true)
  const [isLoading, setIsLoading] = useState(true)
  const [editing, setEditing] = useState<Product | null | 'new'>(null)
  const [deactivating, setDeactivating] = useState<Product | null>(null)
  const toast = useToast()

  // Lista de marcas cadastradas pra popular o filtro. Busca sem os filtros
  // ativos (uma vez, e de novo após criar/editar produto), pra não colapsar
  // as opções quando uma marca já está selecionada.
  async function loadBrands() {
    try {
      const all = await productsApi.list()
      const brands = new Set(all.map((p) => p.brand).filter((b): b is string => Boolean(b)))
      setAllBrands(Array.from(brands).sort((a, b) => a.localeCompare(b, 'pt-BR')))
    } catch {
      // silencioso: filtro de marca simplesmente fica vazio
    }
  }

  async function load() {
    setIsLoading(true)
    try {
      setProducts(
        await productsApi.list({
          search: search || undefined,
          category: category || undefined,
          brand: brand || undefined,
          onlyActive,
        }),
      )
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível carregar os produtos.')
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    loadBrands()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    const timeout = setTimeout(load, 300)
    return () => clearTimeout(timeout)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search, category, brand, onlyActive])

  async function handleDeactivate() {
    if (!deactivating) return
    try {
      await productsApi.deactivate(deactivating.id)
      toast.success('Produto inativado.')
      setDeactivating(null)
      load()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Não foi possível inativar o produto.')
    }
  }

  return (
    <Layout
      title="Produtos"
      subtitle="Catálogo de cosméticos, joias, perfumes e acessórios."
      actions={
        <button className="btn-primary" onClick={() => setEditing('new')}>
          <Plus size={16} /> Novo produto
        </button>
      }
    >
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="relative max-w-xs flex-1">
          <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            className="input-field pl-9"
            placeholder="Buscar produto…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        <select
          className="input-field w-auto"
          value={category}
          onChange={(e) => setCategory(e.target.value as ProductCategory | '')}
        >
          <option value="">Todas as categorias</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {categoryLabels[c]}
            </option>
          ))}
        </select>
        <select className="input-field w-auto" value={brand} onChange={(e) => setBrand(e.target.value)}>
          <option value="">Todas as marcas</option>
          {allBrands.map((b) => (
            <option key={b} value={b}>
              {b}
            </option>
          ))}
        </select>
        <label className="flex items-center gap-2 text-sm text-ink/80">
          <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} className="h-4 w-4 rounded border-sand text-wine focus:ring-wine/30" />
          Somente ativos
        </label>
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <Spinner />
        ) : products.length === 0 ? (
          <EmptyState
            icon={<Package size={28} />}
            title="Nenhum produto encontrado"
            description="Cadastre produtos para começar a montar vendas."
            action={
              <button className="btn-primary" onClick={() => setEditing('new')}>
                <Plus size={16} /> Novo produto
              </button>
            }
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-sand text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Produto</th>
                <th className="px-5 py-3 font-medium">Categoria</th>
                <th className="px-5 py-3 font-medium">Marca</th>
                <th className="px-5 py-3 font-medium">Preço</th>
                <th className="px-5 py-3 font-medium">Estoque</th>
                <th className="px-5 py-3 font-medium">Status</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {products.map((product) => (
                <tr key={product.id} className="transition hover:bg-blush/30">
                  <td className="px-5 py-3.5">
                    <p className="font-medium text-ink">{product.name}</p>
                    {product.description && (
                      <p className="max-w-xs truncate text-xs text-muted">{product.description}</p>
                    )}
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge tone={categoryTone[product.category]}>{categoryLabels[product.category]}</StatusBadge>
                  </td>
                  <td className="px-5 py-3.5 text-ink/70">{product.brand || '—'}</td>
                  <td className="px-5 py-3.5 font-mono text-ink/80">{formatCentsToBRL(product.priceInCents)}</td>
                  <td className="px-5 py-3.5">
                    <span className={product.stockQuantity <= 3 ? 'font-medium text-rust' : 'text-ink/80'}>
                      {product.stockQuantity} un.
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    <StatusBadge tone={product.isActive ? 'sage' : 'muted'}>
                      {product.isActive ? 'Ativo' : 'Inativo'}
                    </StatusBadge>
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        className="rounded-md p-1.5 text-muted transition hover:bg-blush hover:text-wine"
                        title="Editar"
                        onClick={() => setEditing(product)}
                      >
                        <Pencil size={16} />
                      </button>
                      {product.isActive && (
                        <button
                          className="rounded-md p-1.5 text-muted transition hover:bg-rust/10 hover:text-rust"
                          title="Inativar"
                          onClick={() => setDeactivating(product)}
                        >
                          <EyeOff size={16} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <ProductFormModal
          product={editing === 'new' ? null : editing}
          existingBrands={allBrands}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
            loadBrands()
          }}
        />
      )}

      {deactivating && (
        <ConfirmDialog
          title="Inativar produto"
          message={`"${deactivating.name}" deixará de aparecer para novas vendas, mas o histórico é mantido. Deseja continuar?`}
          confirmLabel="Inativar"
          danger
          onCancel={() => setDeactivating(null)}
          onConfirm={handleDeactivate}
        />
      )}
    </Layout>
  )
}

function ProductFormModal({
  product,
  existingBrands,
  onClose,
  onSaved,
}: {
  product: Product | null
  existingBrands: string[]
  onClose: () => void
  onSaved: () => void
}) {
  const [name, setName] = useState(product?.name ?? '')
  const [description, setDescription] = useState(product?.description ?? '')
  const [category, setCategory] = useState<ProductCategory>(product?.category ?? 'COSMETICO')
  const [brand, setBrand] = useState(product?.brand ?? '')
  const [price, setPrice] = useState(product ? (product.priceInCents / 100).toFixed(2) : '')
  const [stock, setStock] = useState(product ? String(product.stockQuantity) : '0')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const toast = useToast()

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError(null)
    setIsSubmitting(true)

    const payload: CreateProductInput = {
      name: name.trim(),
      description: description.trim() || undefined,
      category,
      brand: brand.trim() || undefined,
      priceInCents: parseBRLInputToCents(price),
      stockQuantity: Number.parseInt(stock, 10) || 0,
    }

    try {
      if (product) {
        await productsApi.update(product.id, payload)
        toast.success('Produto atualizado.')
      } else {
        await productsApi.create(payload)
        toast.success('Produto cadastrado.')
      }
      onSaved()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Não foi possível salvar o produto.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Modal title={product ? 'Editar produto' : 'Novo produto'} onClose={onClose}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Nome *</label>
          <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div>
          <label className="field-label">Descrição</label>
          <textarea
            className="input-field min-h-[64px] resize-none"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Categoria *</label>
            <select className="input-field" value={category} onChange={(e) => setCategory(e.target.value as ProductCategory)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {categoryLabels[c]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="field-label">Marca</label>
            <input
              className="input-field"
              value={brand}
              onChange={(e) => setBrand(e.target.value)}
              placeholder="Ex: O Boticário"
              list="brand-suggestions"
            />
            <datalist id="brand-suggestions">
              {existingBrands.map((b) => (
                <option key={b} value={b} />
              ))}
            </datalist>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Preço (R$) *</label>
            <input
              className="input-field"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0,00"
              inputMode="decimal"
              required
            />
          </div>
          <div>
            <label className="field-label">Estoque *</label>
            <input
              type="number"
              min={0}
              className="input-field"
              value={stock}
              onChange={(e) => setStock(e.target.value)}
              required
            />
          </div>
        </div>

        {error && (
          <div className="rounded-lg border border-rust/30 bg-rust-light px-3.5 py-2.5 text-sm text-rust">{error}</div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="btn-secondary" onClick={onClose} disabled={isSubmitting}>
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting ? 'Salvando…' : 'Salvar'}
          </button>
        </div>
      </form>
    </Modal>
  )
}
