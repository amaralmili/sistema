import z from 'zod'

import {
  InstallmentStatus,
  PaymentMethod,
  ProductCategory,
  SaleStatus,
} from '../generated/prisma/enums.js'

export const ErrorSchema = z.object({
  error: z.string(),
  code: z.string(),
})

// IDs no banco nem sempre são UUID "de verdade" (ex: os registros de seed
// usam ids fixos tipo "seed-customer-maria" para permitir upsert idempotente),
// então validamos só como string não vazia em vez de exigir o formato UUID.
const idSchema = z.string().min(1)

// Datas podem chegar como Date (objeto vindo direto do Prisma, em alguns
// usecases) ou já como string ISO (quando o usecase já converteu). Aceitamos
// os dois formatos e sempre devolvemos string ISO na resposta.
const dateLike = z
  .union([z.string(), z.date()])
  .transform((value) => (typeof value === 'string' ? value : value.toISOString()))

// ----------------------------------------------------------------
// CLIENTES - RF03
// ----------------------------------------------------------------

export const CustomerSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  document: z.string().nullish(),
  phone: z.string().min(1),
  email: z.email().nullish(),
  address: z.string().nullish(),
  notes: z.string().nullish(),
  createdAt: dateLike.optional(),
})

export const CreateCustomerBodySchema = CustomerSchema.omit({
  id: true,
  createdAt: true,
})

export const UpdateCustomerBodySchema = CreateCustomerBodySchema.partial()

export const ListCustomersQuerySchema = z.object({
  search: z.string().optional(),
})

export const ListCustomersSchema = z.array(CustomerSchema)

// ----------------------------------------------------------------
// PRODUTOS - RF02
// ----------------------------------------------------------------

export const ProductSchema = z.object({
  id: idSchema,
  name: z.string().min(1),
  description: z.string().nullish(),
  category: z.enum(ProductCategory),
  brand: z.string().nullish(),
  priceInCents: z.number().int().nonnegative(),
  stockQuantity: z.number().int().nonnegative(),
  imageUrl: z.url().nullish(),
  isActive: z.boolean(),
})

export const CreateProductBodySchema = ProductSchema.omit({
  id: true,
  isActive: true,
})

export const UpdateProductBodySchema = CreateProductBodySchema.partial()

export const ListProductsQuerySchema = z.object({
  category: z.enum(ProductCategory).optional(),
  brand: z.string().optional(),
  search: z.string().optional(),
  onlyActive: z.coerce.boolean().optional(),
})

export const ListProductsSchema = z.array(ProductSchema)

// ----------------------------------------------------------------
// VENDAS - RF05
// ----------------------------------------------------------------

export const SaleItemInputSchema = z.object({
  productId: idSchema,
  quantity: z.number().int().positive(),
})

export const InstallmentPlanInputSchema = z.object({
  numberOfInstallments: z.number().int().positive(),
  firstDueDate: z.iso.date(),
  intervalInDays: z.number().int().positive().default(30),
})

export const CreateSaleBodySchema = z.object({
  customerId: idSchema,
  paymentMethod: z.enum(PaymentMethod),
  items: z.array(SaleItemInputSchema).min(1),
  discountInCents: z.number().int().nonnegative().optional(),
  installmentPlan: InstallmentPlanInputSchema.optional(),
})

export const SaleItemSchema = z.object({
  productId: idSchema,
  productName: z.string(),
  quantity: z.number().int(),
  unitPriceInCents: z.number().int(),
})

export const SaleSchema = z.object({
  id: idSchema,
  customerId: idSchema,
  sellerId: idSchema,
  paymentMethod: z.enum(PaymentMethod),
  status: z.enum(SaleStatus),
  discountInCents: z.number().int().nonnegative().default(0),
  totalInCents: z.number().int(),
  items: z.array(SaleItemSchema),
  promissoryId: idSchema.nullish(),
  createdAt: dateLike.optional(),
})

export const ListSalesQuerySchema = z.object({
  customerId: idSchema.optional(),
})

export const ListSalesSchema = z.array(SaleSchema)

// ----------------------------------------------------------------
// HISTÓRICO DE COMPRAS - RF07
// ----------------------------------------------------------------

export const CustomerPurchaseHistorySchema = z.object({
  customer: CustomerSchema,
  sales: z.array(SaleSchema),
  totalSpentInCents: z.number().int(),
})

// ----------------------------------------------------------------
// PROMISSÓRIAS / PARCELAS - RF06
// ----------------------------------------------------------------

export const InstallmentSchema = z.object({
  id: idSchema,
  number: z.number().int(),
  amountInCents: z.number().int(),
  dueDate: z.iso.date(),
  status: z.enum(InstallmentStatus),
  paidAt: dateLike.nullish(),
})

export const PromissorySchema = z.object({
  id: idSchema,
  saleId: idSchema,
  customerId: idSchema,
  customerName: z.string(),
  totalInCents: z.number().int(),
  installments: z.array(InstallmentSchema),
})

export const ListPromissoriesQuerySchema = z.object({
  customerId: idSchema.optional(),
  onlyOverdue: z.coerce.boolean().optional(),
})

export const ListPromissoriesSchema = z.array(PromissorySchema)

export const PayInstallmentBodySchema = z.object({
  paidAt: z.iso.datetime().optional(),
})

// ----------------------------------------------------------------
// NOTIFICAÇÕES DE ATRASO - RF04
// ----------------------------------------------------------------

export const NotificationSchema = z.object({
  id: idSchema,
  customerId: idSchema,
  customerName: z.string(),
  installmentId: idSchema,
  message: z.string(),
  sentAt: dateLike,
})

export const RunOverdueNotificationsResultSchema = z.object({
  overdueInstallmentsFound: z.number().int(),
  notificationsCreated: z.array(NotificationSchema),
})

export const ListNotificationsQuerySchema = z.object({
  customerId: idSchema.optional(),
})

export const ListNotificationsSchema = z.array(NotificationSchema)
