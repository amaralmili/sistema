import { History, Pencil, Plus, Search, Trash2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import { ConfirmDialog } from "../components/ConfirmDialog.tsx";
import { CustomerFormModal } from "../components/CustomerFormModal.tsx";
import { Layout } from "../components/Layout.tsx";
import { EmptyState, Spinner } from "../components/Spinner.tsx";
import { useToast } from "../context/ToastContext.tsx";
import { customersApi } from "../lib/endpoints.ts";
import type { Customer } from "../lib/types.ts";

export function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [editing, setEditing] = useState<Customer | null | "new">(null);
  const [deleting, setDeleting] = useState<Customer | null>(null);
  const toast = useToast();

  async function load(searchTerm?: string) {
    setIsLoading(true);
    try {
      setCustomers(await customersApi.list(searchTerm));
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível carregar os clientes.",
      );
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => load(search || undefined), 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function handleDelete() {
    if (!deleting) return;
    try {
      await customersApi.remove(deleting.id);
      toast.success("Cliente removido.");
      setDeleting(null);
      load(search || undefined);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível remover o cliente.",
      );
    }
  }

  return (
    <Layout
      title="Clientes"
      subtitle="Cadastro e histórico dos clientes da loja."
      actions={
        <button className="btn-primary" onClick={() => setEditing("new")}>
          <Plus size={16} /> Novo cliente
        </button>
      }
    >
      <div className="mb-4 relative max-w-xs">
        <Search
          size={15}
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          className="input-field pl-9"
          placeholder="Buscar por nome, telefone ou documento…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="card overflow-hidden">
        {isLoading ? (
          <Spinner />
        ) : customers.length === 0 ? (
          <EmptyState
            icon={<Users size={28} />}
            title="Nenhum cliente por aqui"
            description="Cadastre o primeiro cliente da loja para começar a registrar vendas."
            action={
              <button className="btn-primary" onClick={() => setEditing("new")}>
                <Plus size={16} /> Novo cliente
              </button>
            }
          />
        ) : (
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-sand text-xs uppercase tracking-wide text-muted">
                <th className="px-5 py-3 font-medium">Nome</th>
                <th className="px-5 py-3 font-medium">Telefone</th>
                <th className="px-5 py-3 font-medium">E-mail</th>
                <th className="px-5 py-3 font-medium">Documento</th>
                <th className="px-5 py-3 font-medium text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-sand">
              {customers.map((customer) => (
                <tr key={customer.id} className="transition hover:bg-blush/30">
                  <td className="px-5 py-3.5 font-medium text-ink">
                    {customer.name}
                  </td>
                  <td className="px-5 py-3.5 text-ink/80">{customer.phone}</td>
                  <td className="px-5 py-3.5 text-ink/80">
                    {customer.email || "—"}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-xs text-ink/70">
                    {customer.document || "—"}
                  </td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1">
                      <Link
                        to={`/clientes/${customer.id}`}
                        className="rounded-md p-1.5 text-muted transition hover:bg-blush hover:text-wine"
                        title="Histórico de compras"
                      >
                        <History size={16} />
                      </Link>
                      <button
                        className="rounded-md p-1.5 text-muted transition hover:bg-blush hover:text-wine"
                        title="Editar"
                        onClick={() => setEditing(customer)}
                      >
                        <Pencil size={16} />
                      </button>
                      <button
                        className="rounded-md p-1.5 text-muted transition hover:bg-rust/10 hover:text-rust"
                        title="Remover"
                        onClick={() => setDeleting(customer)}
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <CustomerFormModal
          customer={editing === "new" ? null : editing}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load(search || undefined);
          }}
        />
      )}

      {deleting && (
        <ConfirmDialog
          title="Remover cliente"
          message={`Tem certeza que deseja remover "${deleting.name}"? Essa ação não pode ser desfeita.`}
          confirmLabel="Remover"
          danger
          onCancel={() => setDeleting(null)}
          onConfirm={handleDelete}
        />
      )}
    </Layout>
  );
}
