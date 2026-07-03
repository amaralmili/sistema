import { FormEvent, useState } from "react";

import { useToast } from "../context/ToastContext.tsx";
import { customersApi } from "../lib/endpoints.ts";
import type { Customer, CreateCustomerInput } from "../lib/types.ts";
import { Modal } from "./Modal.tsx";

const EMPTY_FORM: CreateCustomerInput = {
  name: "",
  phone: "",
  document: "",
  email: "",
  address: "",
  notes: "",
};

export function CustomerFormModal({
  customer,
  onClose,
  onSaved,
}: {
  customer: Customer | null;
  onClose: () => void;
  onSaved: (customer: Customer) => void;
}) {
  const [form, setForm] = useState<CreateCustomerInput>(
    customer
      ? {
          name: customer.name,
          phone: customer.phone,
          document: customer.document ?? "",
          email: customer.email ?? "",
          address: customer.address ?? "",
          notes: customer.notes ?? "",
        }
      : EMPTY_FORM,
  );
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const toast = useToast();

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);

    const payload: CreateCustomerInput = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      document: form.document?.trim() || undefined,
      email: form.email?.trim() || undefined,
      address: form.address?.trim() || undefined,
      notes: form.notes?.trim() || undefined,
    };

    try {
      const savedCustomer = customer
        ? await customersApi.update(customer.id, payload)
        : await customersApi.create(payload);
      toast.success(customer ? "Cliente atualizado." : "Cliente cadastrado.");
      onSaved(savedCustomer);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível salvar o cliente.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Modal
      title={customer ? "Editar cliente" : "Novo cliente"}
      onClose={onClose}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="field-label">Nome *</label>
          <input
            className="input-field"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            required
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="field-label">Telefone *</label>
            <input
              className="input-field"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              placeholder="(18) 99999-0000"
              required
            />
          </div>
          <div>
            <label className="field-label">CPF / documento</label>
            <input
              className="input-field"
              value={form.document}
              onChange={(e) => setForm({ ...form, document: e.target.value })}
            />
          </div>
        </div>
        <div>
          <label className="field-label">E-mail</label>
          <input
            type="email"
            className="input-field"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Endereço</label>
          <input
            className="input-field"
            value={form.address}
            onChange={(e) => setForm({ ...form, address: e.target.value })}
          />
        </div>
        <div>
          <label className="field-label">Observações</label>
          <textarea
            className="input-field min-h-[72px] resize-none"
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />
        </div>

        {error && (
          <div className="rounded-lg border border-rust/30 bg-rust-light px-3.5 py-2.5 text-sm text-rust">
            {error}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            className="btn-secondary"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancelar
          </button>
          <button type="submit" className="btn-primary" disabled={isSubmitting}>
            {isSubmitting
              ? "Salvando…"
              : customer
                ? "Salvar alterações"
                : "Cadastrar cliente"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
