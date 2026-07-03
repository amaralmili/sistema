import { api } from './api.ts'
import type {
  CreateCustomerInput,
  CreateProductInput,
  CreateSaleInput,
  Customer,
  CustomerPurchaseHistory,
  Installment,
  Notification,
  Product,
  Promissory,
  RunOverdueResult,
  Sale,
  UpdateCustomerInput,
  UpdateProductInput,
} from './types.ts'

// Clientes — RF03 / RF07
export const customersApi = {
  list: (search?: string) => api.get<Customer[]>('/customers', { search }),
  get: (id: string) => api.get<Customer>(`/customers/${id}`),
  create: (input: CreateCustomerInput) => api.post<Customer>('/customers', input),
  update: (id: string, input: UpdateCustomerInput) => api.patch<Customer>(`/customers/${id}`, input),
  remove: (id: string) => api.delete<void>(`/customers/${id}`),
  purchaseHistory: (id: string) => api.get<CustomerPurchaseHistory>(`/customers/${id}/purchases`),
}

// Produtos — RF02
export const productsApi = {
  list: (filters?: { category?: string; brand?: string; search?: string; onlyActive?: boolean }) =>
    api.get<Product[]>('/products', filters),
  get: (id: string) => api.get<Product>(`/products/${id}`),
  create: (input: CreateProductInput) => api.post<Product>('/products', input),
  update: (id: string, input: UpdateProductInput) => api.patch<Product>(`/products/${id}`, input),
  deactivate: (id: string) => api.delete<Product>(`/products/${id}`),
}

// Vendas — RF05
export const salesApi = {
  list: (customerId?: string) => api.get<Sale[]>('/sales', { customerId }),
  get: (id: string) => api.get<Sale>(`/sales/${id}`),
  create: (input: CreateSaleInput) => api.post<Sale>('/sales', input),
}

// Promissórias / parcelas — RF06
export const promissoriesApi = {
  list: (filters?: { customerId?: string; onlyOverdue?: boolean }) =>
    api.get<Promissory[]>('/promissories', filters),
  payInstallment: (installmentId: string, paidAt?: string) =>
    api.patch<Installment>(`/promissories/installments/${installmentId}/pay`, paidAt ? { paidAt } : {}),
}

// Notificações de atraso — RF04
export const notificationsApi = {
  list: (customerId?: string) => api.get<Notification[]>('/notifications', { customerId }),
  runOverdueCheck: () => api.post<RunOverdueResult>('/notifications/run-overdue-check'),
}
