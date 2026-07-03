export type ProductCategory = 'COSMETICO' | 'JOIA' | 'PERFUME' | 'ACESSORIO'
export type PaymentMethod = 'DINHEIRO' | 'CARTAO' | 'PIX' | 'PROMISSORIA'
export type SaleStatus = 'CONCLUIDA' | 'CANCELADA'
export type InstallmentStatus = 'PENDENTE' | 'PAGA' | 'ATRASADA'

export interface Customer {
  id: string
  name: string
  document?: string
  phone: string
  email?: string
  address?: string
  notes?: string
  createdAt?: string
}

export type CreateCustomerInput = Omit<Customer, 'id' | 'createdAt'>
export type UpdateCustomerInput = Partial<CreateCustomerInput>

export interface Product {
  id: string
  name: string
  description?: string
  category: ProductCategory
  brand?: string
  priceInCents: number
  stockQuantity: number
  imageUrl?: string
  isActive: boolean
}

export type CreateProductInput = Omit<Product, 'id' | 'isActive'>
export type UpdateProductInput = Partial<CreateProductInput>

export interface SaleItem {
  productId: string
  productName: string
  quantity: number
  unitPriceInCents: number
}

export interface Sale {
  id: string
  customerId: string
  sellerId: string
  paymentMethod: PaymentMethod
  status: SaleStatus
  totalInCents: number
  items: SaleItem[]
  promissoryId?: string
  createdAt?: string
}

export interface SaleItemInput {
  productId: string
  quantity: number
}

export interface InstallmentPlanInput {
  numberOfInstallments: number
  firstDueDate: string
  intervalInDays: number
}

export interface CreateSaleInput {
  customerId: string
  paymentMethod: PaymentMethod
  items: SaleItemInput[]
  installmentPlan?: InstallmentPlanInput
}

export interface CustomerPurchaseHistory {
  customer: Customer
  sales: Sale[]
  totalSpentInCents: number
}

export interface Installment {
  id: string
  number: number
  amountInCents: number
  dueDate: string
  status: InstallmentStatus
  paidAt?: string
}

export interface Promissory {
  id: string
  saleId: string
  customerId: string
  customerName: string
  totalInCents: number
  installments: Installment[]
}

export interface Notification {
  id: string
  customerId: string
  customerName: string
  installmentId: string
  message: string
  sentAt: string
}

export interface RunOverdueResult {
  overdueInstallmentsFound: number
  notificationsCreated: Notification[]
}

export interface AuthUser {
  id: string
  name: string
  email: string
}
