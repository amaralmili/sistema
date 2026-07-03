import type { InstallmentStatus, PaymentMethod, ProductCategory, SaleStatus } from './types.ts'

export function formatCentsToBRL(cents: number) {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(cents / 100)
}

export function parseBRLInputToCents(value: string) {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\.(?=\d{3},)/g, '').replace(',', '.')
  const amount = Number.parseFloat(normalized)
  if (Number.isNaN(amount)) return 0
  return Math.round(amount * 100)
}

export function formatDate(iso?: string) {
  if (!iso) return '—'
  const date = new Date(iso.length === 10 ? `${iso}T00:00:00` : iso)
  return new Intl.DateTimeFormat('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(date)
}

export function formatDateTime(iso?: string) {
  if (!iso) return '—'
  return new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(iso))
}

export function todayAsInputDate() {
  return new Date().toISOString().slice(0, 10)
}

export const categoryLabels: Record<ProductCategory, string> = {
  COSMETICO: 'Cosmético',
  JOIA: 'Joia',
  PERFUME: 'Perfume',
  ACESSORIO: 'Acessório',
}

export const paymentLabels: Record<PaymentMethod, string> = {
  DINHEIRO: 'Dinheiro',
  CARTAO: 'Cartão',
  PIX: 'Pix',
  PROMISSORIA: 'Promissória',
}

export const saleStatusLabels: Record<SaleStatus, string> = {
  CONCLUIDA: 'Concluída',
  CANCELADA: 'Cancelada',
}

export const installmentStatusLabels: Record<InstallmentStatus, string> = {
  PENDENTE: 'Pendente',
  PAGA: 'Paga',
  ATRASADA: 'Atrasada',
}
