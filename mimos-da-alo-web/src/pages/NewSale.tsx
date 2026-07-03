import {
  ArrowLeft,
  Minus,
  Plus,
  Search,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import { CustomerFormModal } from "../components/CustomerFormModal.tsx";
import { Spinner } from "../components/Spinner.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { customersApi, productsApi, salesApi } from "../lib/endpoints.ts";
import {
  categoryLabels,
  formatCentsToBRL,
  formatDate,
  parseBRLInputToCents,
  paymentLabels,
  todayAsInputDate,
} from "../lib/format.ts";
import type { Customer, PaymentMethod, Product } from "../lib/types.ts";

interface CartItem {
  product: Product;
  quantity: number;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  "PIX",
  "DINHEIRO",
  "CARTAO",
  "PROMISSORIA",
];

export function NewSale() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [customerId, setCustomerId] = useState("");
  const [customerSearch, setCustomerSearch] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);
  const [discount, setDiscount] = useState("");

  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("PIX");
  const [numberOfInstallments, setNumberOfInstallments] = useState(3);
  const [firstDueDate, setFirstDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 30);
    return d.toISOString().slice(0, 10);
  });
  const [intervalInDays, setIntervalInDays] = useState(30);

  const toast = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([customersApi.list(), productsApi.list({ onlyActive: true })])
      .then(([c, p]) => {
        setCustomers(c);
        setProducts(p);
      })
      .catch((err) =>
        toast.error(
          err instanceof Error
            ? err.message
            : "Não foi possível carregar dados iniciais.",
        ),
      )
      .finally(() => setIsLoading(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const filteredCustomers = useMemo(() => {
    if (!customerSearch) return customers.slice(0, 8);
    const term = customerSearch.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.name.toLowerCase().includes(term) ||
          c.phone.includes(term) ||
          c.document?.includes(term),
      )
      .slice(0, 8);
  }, [customers, customerSearch]);

  const filteredProducts = useMemo(() => {
    const term = productSearch.toLowerCase();
    return products
      .filter((p) => p.stockQuantity > 0)
      .filter(
        (p) =>
          !term ||
          p.name.toLowerCase().includes(term) ||
          categoryLabels[p.category].toLowerCase().includes(term) ||
          p.brand?.toLowerCase().includes(term),
      )
      .slice(0, 8);
  }, [products, productSearch]);

  const selectedCustomer = customers.find((c) => c.id === customerId);
  const subtotal = cart.reduce(
    (sum, item) => sum + item.product.priceInCents * item.quantity,
    0,
  );
  const discountInCents = Math.min(parseBRLInputToCents(discount || "0"), subtotal);
  const total = subtotal - discountInCents;

  function addToCart(product: Product) {
    setCart((current) => {
      const existing = current.find((i) => i.product.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stockQuantity) return current;
        return current.map((i) =>
          i.product.id === product.id ? { ...i, quantity: i.quantity + 1 } : i,
        );
      }
      return [...current, { product, quantity: 1 }];
    });
  }

  function updateQuantity(productId: string, delta: number) {
    setCart((current) =>
      current
        .map((i) =>
          i.product.id === productId
            ? {
                ...i,
                quantity: Math.min(
                  i.product.stockQuantity,
                  Math.max(1, i.quantity + delta),
                ),
              }
            : i,
        )
        .filter((i) => i.quantity > 0),
    );
  }

  function removeFromCart(productId: string) {
    setCart((current) => current.filter((i) => i.product.id !== productId));
  }

  const installmentPreview = useMemo(() => {
    if (
      paymentMethod !== "PROMISSORIA" ||
      numberOfInstallments < 1 ||
      total === 0
    )
      return [];
    const base = Math.floor(total / numberOfInstallments);
    const remainder = total - base * numberOfInstallments;
    return Array.from({ length: numberOfInstallments }, (_, i) => {
      const due = new Date(`${firstDueDate}T00:00:00`);
      due.setDate(due.getDate() + i * intervalInDays);
      return {
        number: i + 1,
        amount: base + (i === numberOfInstallments - 1 ? remainder : 0),
        dueDate: due.toISOString().slice(0, 10),
      };
    });
  }, [
    paymentMethod,
    numberOfInstallments,
    firstDueDate,
    intervalInDays,
    total,
  ]);

  async function handleSubmit() {
    setError(null);

    if (!customerId) {
      setError("Selecione um cliente para continuar.");
      return;
    }
    if (cart.length === 0) {
      setError("Adicione ao menos um item ao carrinho.");
      return;
    }

    setIsSubmitting(true);
    try {
      const sale = await salesApi.create({
        customerId,
        paymentMethod,
        items: cart.map((i) => ({
          productId: i.product.id,
          quantity: i.quantity,
        })),
        discountInCents: discountInCents || undefined,
        installmentPlan:
          paymentMethod === "PROMISSORIA"
            ? { numberOfInstallments, firstDueDate, intervalInDays }
            : undefined,
      });
      toast.success("Venda registrada com sucesso!");
      navigate(`/vendas/${sale.id}`);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível registrar a venda.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-cream">
        <Spinner />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-cream">
      <div className="mx-auto max-w-6xl px-8 py-8">
        <Link
          to="/vendas"
          className="mb-6 flex items-center gap-1.5 text-sm font-medium text-wine hover:underline"
        >
          <ArrowLeft size={15} /> Voltar para vendas
        </Link>

        <h1 className="mb-7 font-display text-2xl font-medium text-wine-dark">
          Nova venda
        </h1>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.4fr_1fr]">
          {/* Coluna esquerda: cliente e produtos */}
          <div className="space-y-6">
            <div className="card px-5 py-5">
              <div className="mb-3 flex items-center justify-between gap-3">
                <h2 className="text-xs font-medium uppercase tracking-wide text-muted">
                  1. Cliente
                </h2>
                <button
                  type="button"
                  className="btn-secondary px-3 py-1.5 text-xs"
                  onClick={() => setIsCustomerModalOpen(true)}
                >
                  <Plus size={14} /> Novo cliente
                </button>
              </div>
              {selectedCustomer ? (
                <div className="flex items-center justify-between rounded-lg bg-blush/60 px-4 py-3">
                  <div>
                    <p className="font-medium text-ink">
                      {selectedCustomer.name}
                    </p>
                    <p className="text-xs text-muted">
                      {selectedCustomer.phone}
                    </p>
                  </div>
                  <button
                    className="text-xs font-medium text-wine hover:underline"
                    onClick={() => setCustomerId("")}
                  >
                    Trocar
                  </button>
                </div>
              ) : (
                <div>
                  <div className="relative mb-2">
                    <Search
                      size={15}
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                    />
                    <input
                      className="input-field pl-9"
                      placeholder="Buscar cliente por nome, telefone ou documento…"
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                    />
                  </div>
                  <div className="max-h-48 overflow-y-auto rounded-lg border border-sand">
                    {filteredCustomers.length === 0 ? (
                      <p className="px-4 py-3 text-sm text-muted">
                        Nenhum cliente encontrado.
                      </p>
                    ) : (
                      filteredCustomers.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className="flex w-full items-center justify-between border-b border-sand px-4 py-2.5 text-left text-sm last:border-b-0 hover:bg-blush/40"
                          onClick={() => setCustomerId(c.id)}
                        >
                          <span className="font-medium text-ink">{c.name}</span>
                          <span className="text-xs text-muted">{c.phone}</span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="card px-5 py-5">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
                2. Itens
              </h2>
              <div className="relative mb-3">
                <Search
                  size={15}
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
                />
                <input
                  className="input-field pl-9"
                  placeholder="Buscar produto por nome ou categoria…"
                  value={productSearch}
                  onChange={(e) => setProductSearch(e.target.value)}
                />
              </div>
              <div className="max-h-72 space-y-1 overflow-y-auto">
                {filteredProducts.length === 0 ? (
                  <p className="px-2 py-6 text-center text-sm text-muted">
                    Nenhum produto disponível encontrado.
                  </p>
                ) : (
                  filteredProducts.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => addToCart(p)}
                      className="flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm transition hover:bg-blush/40"
                    >
                      <div>
                        <p className="font-medium text-ink">{p.name}</p>
                        <p className="text-xs text-muted">
                          {categoryLabels[p.category]}
                          {p.brand ? ` · ${p.brand}` : ""} · {p.stockQuantity}{" "}
                          em estoque
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-mono text-ink/80">
                          {formatCentsToBRL(p.priceInCents)}
                        </span>
                        <Plus size={15} className="text-wine" />
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Coluna direita: carrinho, pagamento, confirmação */}
          <div className="space-y-6">
            <div className="card px-5 py-5">
              <h2 className="mb-3 flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-muted">
                <ShoppingBag size={14} /> Carrinho
              </h2>
              {cart.length === 0 ? (
                <p className="py-6 text-center text-sm text-muted">
                  Nenhum item adicionado ainda.
                </p>
              ) : (
                <ul className="space-y-3">
                  {cart.map((item) => (
                    <li
                      key={item.product.id}
                      className="flex items-center justify-between gap-2"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-ink">
                          {item.product.name}
                        </p>
                        <p className="font-mono text-xs text-muted">
                          {formatCentsToBRL(item.product.priceInCents)} un.
                        </p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          className="rounded-md border border-sand p-1 text-muted hover:border-wine hover:text-wine"
                          onClick={() => updateQuantity(item.product.id, -1)}
                        >
                          <Minus size={13} />
                        </button>
                        <span className="w-5 text-center text-sm font-medium">
                          {item.quantity}
                        </span>
                        <button
                          className="rounded-md border border-sand p-1 text-muted hover:border-wine hover:text-wine disabled:opacity-30"
                          onClick={() => updateQuantity(item.product.id, 1)}
                          disabled={item.quantity >= item.product.stockQuantity}
                        >
                          <Plus size={13} />
                        </button>
                        <button
                          className="rounded-md p-1 text-muted hover:text-rust"
                          onClick={() => removeFromCart(item.product.id)}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}

              <div className="mt-4 space-y-2 border-t border-sand pt-4">
                <div>
                  <label className="field-label">Desconto (R$)</label>
                  <input
                    className="input-field"
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    placeholder="0,00"
                    inputMode="decimal"
                    disabled={cart.length === 0}
                  />
                </div>

                {discountInCents > 0 && (
                  <div className="flex items-center justify-between text-sm text-ink/70">
                    <span>Subtotal</span>
                    <span className="font-mono">{formatCentsToBRL(subtotal)}</span>
                  </div>
                )}
                {discountInCents > 0 && (
                  <div className="flex items-center justify-between text-sm text-sage">
                    <span>Desconto</span>
                    <span className="font-mono">−{formatCentsToBRL(discountInCents)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between pt-1">
                  <span className="text-sm font-medium text-ink">Total</span>
                  <span className="font-mono text-lg text-wine-dark">
                    {formatCentsToBRL(total)}
                  </span>
                </div>
              </div>
            </div>

            <div className="card px-5 py-5">
              <h2 className="mb-3 text-xs font-medium uppercase tracking-wide text-muted">
                3. Pagamento
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map((method) => (
                  <button
                    key={method}
                    type="button"
                    onClick={() => setPaymentMethod(method)}
                    className={`rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                      paymentMethod === method
                        ? "border-wine bg-wine text-cream"
                        : "border-sand text-ink/80 hover:border-wine hover:text-wine"
                    }`}
                  >
                    {paymentLabels[method]}
                  </button>
                ))}
              </div>

              {paymentMethod === "PROMISSORIA" && (
                <div className="mt-4 space-y-3 rounded-lg bg-blush/40 p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="field-label">Parcelas</label>
                      <input
                        type="number"
                        min={1}
                        className="input-field"
                        value={numberOfInstallments}
                        onChange={(e) =>
                          setNumberOfInstallments(
                            Math.max(1, Number(e.target.value)),
                          )
                        }
                      />
                    </div>
                    <div>
                      <label className="field-label">Intervalo (dias)</label>
                      <input
                        type="number"
                        min={1}
                        className="input-field"
                        value={intervalInDays}
                        onChange={(e) =>
                          setIntervalInDays(Math.max(1, Number(e.target.value)))
                        }
                      />
                    </div>
                  </div>
                  <div>
                    <label className="field-label">1ª parcela vence em</label>
                    <input
                      type="date"
                      className="input-field"
                      value={firstDueDate}
                      min={todayAsInputDate()}
                      onChange={(e) => setFirstDueDate(e.target.value)}
                    />
                  </div>

                  {installmentPreview.length > 0 && (
                    <div className="space-y-1 pt-1">
                      {installmentPreview.map((inst) => (
                        <div
                          key={inst.number}
                          className="flex items-center justify-between text-xs text-ink/70"
                        >
                          <span>
                            Parcela {inst.number} · {formatDate(inst.dueDate)}
                          </span>
                          <span className="font-mono">
                            {formatCentsToBRL(inst.amount)}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {error && (
              <div className="rounded-lg border border-rust/30 bg-rust-light px-3.5 py-2.5 text-sm text-rust">
                {error}
              </div>
            )}

            <button
              className="btn-primary w-full py-3 text-base"
              onClick={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting
                ? "Registrando venda…"
                : `Confirmar venda · ${formatCentsToBRL(total)}`}
            </button>
          </div>
        </div>
      </div>

      {isCustomerModalOpen && (
        <CustomerFormModal
          customer={null}
          onClose={() => setIsCustomerModalOpen(false)}
          onSaved={(customer) => {
            setCustomers((current) => [
              customer,
              ...current.filter((item) => item.id !== customer.id),
            ]);
            setCustomerSearch("");
            setCustomerId(customer.id);
            setIsCustomerModalOpen(false);
          }}
        />
      )}
    </div>
  );
}
